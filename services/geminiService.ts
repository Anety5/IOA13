import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// For Image Generation
export const generateImages = async (prompt: string, numberOfImages: number, aspectRatio: string) => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio,
        },
    });
    return response;
};

export const editImage = async (prompt: string, image: { base64: string; mimeType: string }): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.base64, mimeType: image.mimeType } },
                { text: prompt },
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

    throw new Error("No image data received from API during edit.");
};

// For Translator View
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const prompt = `Translate the following text from ${sourceLang === 'auto' ? 'the detected language' : sourceLang} to ${targetLang}. Only return the translated text, without any additional explanation or formatting.\n\nText: "${text}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};

export const textToSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
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
    if (!base64Audio) {
        throw new Error("No audio data received from API. The content may be unsupported or blocked by safety filters.");
    }
    return base64Audio;
};

// For Project Studio View
export const summarizeText = async (text: string): Promise<GenerateContentResponse> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following text:\n\n---\n${text}\n---`,
        config: {
          systemInstruction: "You are an expert summarizer. Provide a concise and clear summary of the provided text."
        }
    });
    return response;
}

export const modifyText = async (text: string, instruction: string): Promise<GenerateContentResponse> => {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using pro for more complex instruction following
        contents: `Original Text:\n---\n${text}\n---\n\nInstruction: ${instruction}`,
        config: {
          systemInstruction: "You are an expert text editor. Modify the original text based on the user's instruction. Output only the modified text."
        }
    });
    return response;
}

// For Optimizer View
export const optimizeText = async (
  text: string, 
  audience: string, 
  goal: string, 
  formality: number,
  complexity: number,
  tone: string,
  isPlagiarismCheck: boolean,
  isProofread: boolean,
): Promise<GenerateContentResponse> => {
  let instructions = `You are an expert content optimizer. Your task is to revise the following text based on a set of parameters. Only output the revised text.

**Parameters:**
* **Target Audience:** ${audience}
* **Primary Goal:** ${goal}
* **Formality:** ${formality}/100 (0=very informal, 100=very formal)
* **Complexity:** ${complexity}/100 (0=very simple, 100=very complex/technical)
* **Desired Tone:** ${tone}`;

  if (isProofread) {
    instructions += `\n* **Proofread:** Please correct any spelling, grammar, and punctuation errors.`;
  }
  if (isPlagiarismCheck) {
    instructions += `\n* **Plagiarism Check:** Please rephrase sentences to ensure originality and avoid plagiarism.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: `${instructions}\n\n**Original Text:**\n---\n${text}`,
  });

  return response;
};