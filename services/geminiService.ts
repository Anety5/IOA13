import { GoogleGenAI, Part, Modality, GenerateContentResponse, Chat, GenerateContentParameters } from "@google/genai";

let ai: GoogleGenAI;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    // The API key is provided via the process.env.API_KEY environment variable.
    if (!process.env.API_KEY) {
        throw new Error("API Key not provided. Please set the API_KEY environment variable.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
}

// For OptimizerView
export interface GenerateTextOptions {
  task: 'optimize' | 'summarize' | 'proofread';
  creativity: number;
  complexity: number;
  plagiarism_guard: boolean;
  education_level: 'general' | 'k12' | 'university';
}

export const generateText = async (
  inputText: string,
  options: GenerateTextOptions
): Promise<string> => {
    const { task, creativity, complexity, plagiarism_guard, education_level } = options;
    const client = getAiClient();
    
    let promptAction = '';
    switch (task) {
      case 'optimize': promptAction = 'Optimize the following text. Make it more clear, concise, and engaging.'; break;
      case 'summarize': promptAction = 'Summarize the following text concisely.'; break;
      case 'proofread': promptAction = 'Proofread the following text for any grammatical errors, spelling mistakes, and typos. Provide only the corrected text, without explanations.'; break;
    }
  
    const systemInstructionParts = [
        `You are an expert assistant for content creation and optimization.`,
        `The user wants to perform the following task: ${task}.`,
        `Adjust your response based on the following parameters:`,
        `- Creativity level: ${creativity}/100. Higher means more imaginative and less conventional.`,
        `- Language Level: ${complexity}/100. Higher means more sophisticated vocabulary and sentence structures.`,
        `- Educational setting: ${education_level}. Adapt the tone and language appropriately.`
    ];
  
    if (education_level !== 'general' && plagiarism_guard) {
      systemInstructionParts.push(`- Originality Check is ON. Ensure the output is original and avoids close paraphrasing of known sources.`);
    }
  
    const systemInstruction = systemInstructionParts.join(' ');
    const contents = `${promptAction}\n\n---\n\n${inputText}`;
  
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: contents,
      config: { 
          systemInstruction: systemInstruction, 
          temperature: creativity / 100 
      },
    });
  
    return response.text;
};

export type RefinementType = 'shorter' | 'humor' | 'professional' | 'simple';

export const refineText = async (
  inputText: string,
  refinementType: RefinementType
): Promise<string> => {
    const client = getAiClient();
    
    let promptAction = '';
    switch (refinementType) {
      case 'shorter': promptAction = 'Make the following text more concise and to the point.'; break;
      case 'humor': promptAction = 'Rewrite the following text to be more humorous and witty.'; break;
      case 'professional': promptAction = 'Refine the following text to have a more professional and formal tone.'; break;
      case 'simple': promptAction = 'Simplify the language of the following text to be easily understood by a general audience.'; break;
    }
  
    const contents = `${promptAction}\n\n---\n\n${inputText}`;
  
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
  
    return response.text;
};

// For ChatView
export interface GenerateChatResponseOptions {
    prompt: string;
    history: { role: 'user' | 'model'; parts: Part[] }[];
    useThinkingMode: boolean;
    useSearchGrounding: boolean;
}

// FIX: Add and export the missing 'generateChatResponse' function.
export const generateChatResponse = async (options: GenerateChatResponseOptions): Promise<GenerateContentResponse> => {
    const { prompt, history, useThinkingMode, useSearchGrounding } = options;
    const client = getAiClient();

    // With thinking mode, use a more capable model.
    const modelName = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const contents: GenerateContentParameters['contents'] = [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
    ];

    const config: GenerateContentParameters['config'] = {};

    if (useSearchGrounding) {
        config.tools = [{ googleSearch: {} }];
    }

    // `generateContent` is used here instead of `chat.sendMessage` because
    // the chat history is managed by the component state.
    const response = await client.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });

    return response;
};

// For TranslatorView
export const translateText = async (
  text: string,
  sourceLang: string, // e.g., 'English' or 'auto'
  targetLang: string  // e.g., 'Spanish'
): Promise<string> => {
  const client = getAiClient();
  let prompt = '';
  if (sourceLang === 'auto' || sourceLang === 'Auto-detect') {
    prompt = `First, auto-detect the language of the following text. Then, translate it to ${targetLang}. Provide ONLY the translated text, without any additional explanations or commentary.

Text to translate:
"${text}"`;
  } else {
    prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Provide ONLY the translated text, without any additional explanations or commentary.

Text to translate:
"${text}"`;
  }

  const response = await client.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: prompt,
  });

  return response.text;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const client = getAiClient();
    const response = await client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received from API.");
    return base64Audio;
};

// For ImageView
const stylePromptEnhancers: { [key: string]: (prompt: string) => string } = {
    'photorealistic': (p) => `A photorealistic, highly detailed 4K photograph of: ${p}`,
    'anime': (p) => `A vibrant, high-quality anime style illustration of: ${p}`,
    'cartoon': (p) => `A playful, colorful cartoon style image of: ${p}`,
    'watercolor': (p) => `A beautiful watercolor painting of: ${p}`,
    '3d-render': (p) => `A cinematic 3D render of: ${p}, trending on ArtStation`,
    'abstract': (p) => `An abstract artistic interpretation of: ${p}`,
    'line-art': (p) => `A clean, black and white line art drawing of: ${p}`,
};

export const generateImage = async (prompt: string, style: string): Promise<string> => {
    const client = getAiClient();
    const finalPrompt = stylePromptEnhancers[style] ? stylePromptEnhancers[style](prompt) : prompt;

    const response = await client.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
        },
    });
    const base64ImageBytes = response.generatedImages[0]?.image.imageBytes;
    if (!base64ImageBytes) throw new Error("Image generation failed.");
    return base64ImageBytes;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const client = getAiClient();
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates?.[0]?.content.parts.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error("Image editing failed.");
    return part.inlineData.data;
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const client = getAiClient();
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };
    const response = await client.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};

// For LiveConversation
export const getAiClientForLive = (): GoogleGenAI => {
    return getAiClient();
}