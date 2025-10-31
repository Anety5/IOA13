
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const getGenAI = () => {
  if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export type TextAction = 'summarize' | 'modify' | 'proofread' | 'optimize';

export interface ProcessTextParams {
    text: string;
    action: TextAction;
    instruction?: string; // For 'modify'
    creativity?: number; // For 'optimize'
    complexity?: number; // For 'optimize'
    formality?: string; // For 'optimize'
    tone?: string; // For 'optimize'
    guardrails?: { proofread: boolean; plagiarismCheck: boolean }; // For 'optimize'
}

export const processText = async (params: ProcessTextParams): Promise<GenerateContentResponse> => {
    const ai = getGenAI();
    let model: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-flash';
    let systemInstruction = "You are an expert content assistant.";
    let contents = '';

    switch (params.action) {
        case 'summarize':
            contents = `Please summarize the following text:\n\n${params.text}`;
            break;
        case 'modify':
            contents = `Original Text:\n"${params.text}"\n\nInstruction: "${params.instruction}"\n\nModified Text:`;
            break;
        case 'proofread':
            contents = `Please proofread the following text for any grammar, spelling, or punctuation errors. Only return the corrected text, without any commentary or explanations.\n\n${params.text}`;
            break;
        case 'optimize':
            model = 'gemini-2.5-pro'; // Use Pro for complex optimization
            systemInstruction = "You are an expert content optimizer. Your goal is to improve the provided text based on the user's instructions.";
            
            let userPrompt = `Original text:\n\n---\n${params.text}\n---\n\nPlease optimize the text.`;
            const { creativity, complexity, formality, tone, guardrails } = params;

            if (creativity !== undefined) {
                const creativityDesc = creativity < 33 ? "more straightforward and factual" : creativity > 66 ? "more creative and expressive" : "balanced in creativity";
                userPrompt += `\nMake the tone ${creativityDesc}.`;
            }
            if (complexity !== undefined) {
                const complexityDesc = complexity < 33 ? "simpler and easier to understand, suitable for a general audience" : complexity > 66 ? "more sophisticated and detailed, suitable for an expert audience" : "with moderate complexity";
                userPrompt += `\nAdjust the complexity to be ${complexityDesc}.`;
            }
            if(formality) userPrompt += `\nThe formality should be ${formality}.`;
            if(tone) userPrompt += `\nThe tone should be ${tone}.`;

            if (guardrails?.proofread) {
                userPrompt += "\nThoroughly proofread for any grammatical errors, typos, or awkward phrasing.";
            }
            if (guardrails?.plagiarismCheck) {
                systemInstruction += " You should also rephrase sentences to ensure the final text is original and unique.";
            }
            contents = userPrompt;
            break;
    }

    return ai.models.generateContent({
        model,
        contents,
        config: {
            systemInstruction,
            temperature: params.creativity !== undefined ? params.creativity / 100 : 0.5,
        }
    });
};

export const generateChatSuggestions = async (context: string): Promise<string[]> => {
    const ai = getGenAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the user's current context, suggest 3 concise and helpful actions they could take. Return them as a simple JSON array of strings. Context: "${context}"`,
        });
        // FIX: Safely extract JSON from the response text
        const jsonString = response.text.match(/\[(.*?)\]/s)?.[0];
        if (jsonString) {
            return JSON.parse(jsonString);
        }
        return [];
    } catch (e) {
        console.error("Failed to generate chat suggestions:", e);
        return [];
    }
};

/**
 * Generates images based on a prompt.
 */
export const generateImage = async (prompt: string, numberOfImages: number, aspectRatio: string): Promise<string[]> => {
    const ai = getGenAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio as any,
          negativePrompt: "text, words, letters, logos, watermarks, signatures",
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed to produce images.");
    }
    
    return response.generatedImages.map(img => img.image.imageBytes);
};

/**
 * Edits an image based on a prompt and a source image.
 */
export const editImage = async (prompt: string, sourceImage: { data: string, mimeType: string }): Promise<string> => {
    const ai = getGenAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: sourceImage.data,
                mimeType: sourceImage.mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error("Image editing failed to produce an image.");
};

/**
 * Analyzes an image and returns a textual description.
 */
export const analyzeImage = async (prompt: string, sourceImage: { data: string, mimeType: string }): Promise<string> => {
    const ai = getGenAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: sourceImage.data,
                        mimeType: sourceImage.mimeType
                    }
                },
                { text: prompt }
            ]
        }
    });
    return response.text;
};

/**
 * Translates text from a source language to a target language.
 */
export const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    const ai = getGenAI();
    if (!text.trim()) return "";
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Translate the following text from ${fromLang} to ${toLang}. Only return the translated text, without any additional explanation or quotation marks.\n\nText: "${text}"`,
    });
    return response.text.trim();
};

/**
 * Generates speech from text.
 */
export const textToSpeech = async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return base64Audio;
    }
    throw new Error("Text-to-speech failed to produce audio data.");
};
