import { GoogleGenAI, Modality, Type, Content } from "@google/genai";
import { audioUtils } from '../utils';

const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) || ''; 

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface GenImageOptions {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    referenceImage?: string;
}

export interface GenAudioOptions {
    prompt: string;
}

export interface ArticleConfig {
    topic: string;
    type: string;
    tone: string;
    language: string;
    context: string;
}

export interface GenAIServiceType {
    isConfigured: () => boolean;
    generateImage: (options: GenImageOptions | string) => Promise<string>;
    generateAudio: (_prompt: string) => Promise<{ url: string; duration?: number }>;
    generateCoverPrompts: (context: string) => Promise<string[]>;
    generateVideo: (prompt: string, image?: string) => Promise<string>;
    generateSpeech: (text: string, voiceName?: string) => Promise<string>;
    streamChat: (
        history: { role: 'user' | 'model', text: string }[],
        context: string,
        onChunk: (chunk: string) => void
    ) => Promise<void>;
    streamArticle: (
        config: ArticleConfig,
        onChunk: (chunk: string) => void
    ) => Promise<void>;
    enhancePrompt: (simplePrompt: string) => Promise<string>;
}

export const genAIService: GenAIServiceType = {

  isConfigured: () => !!ai,

  generateImage: async (options: GenImageOptions | string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured");

    const config = typeof options === 'string' ? { prompt: options } : options;

    const parts: any[] = [];

    if (config.referenceImage) {
        const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            parts.push({
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                }
            });
        }
    }

    parts.push({ text: config.prompt });

    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: parts,
      config: {
        responseModalities: [Modality.TEXT],
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageUrl = (response as any).images?.[0]?.url;
    if (!imageUrl) throw new Error("No image generated");
    return imageUrl;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateAudio: async (_prompt: string): Promise<{ url: string; duration?: number }> => {
    // Stub implementation for future audio generation
    return { url: '', duration: 0 };
  },

  generateCoverPrompts: async (context: string): Promise<string[]> => {
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following text and generate 3 distinct, creative, and visually descriptive art prompts suitable for a cover image. 
        The prompts should be diverse in style (e.g., Minimalist, Photorealistic, Abstract, 3D Render).
        
        Text Context:
        "${context.slice(0, 3000)}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING
                }
            }
        }
    });

    try {
        const text = response.text;
        if (!text) return ["Abstract geometric shapes, minimal, 4k", "Futuristic landscape, neon lights", "Nature photography, calm forest"];
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse prompts", e);
        return ["Abstract modern art", "Clean minimalist office workspace", "Digital technology background"];
    }
  },

  generateVideo: async (prompt: string, image?: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured");

    let request: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    };

    if (image) {
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            request.image = {
                mimeType: matches[1],
                imageBytes: matches[2]
            };
        }
    }

    let operation = await ai.models.generateVideos(request);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed");

    const res = await fetch(`${videoUri}&key=${API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  generateSpeech: async (text: string, voiceName: string = 'Kore'): Promise<string> => {
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const samples = audioUtils.base64ToFloat32Array(base64Audio);
    const wavBlob = audioUtils.encodeWAV(samples, 24000); 
    return URL.createObjectURL(wavBlob);
  },

  streamChat: async (
    history: { role: 'user' | 'model', text: string }[], 
    context: string, 
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    if (!ai) throw new Error("API Key not configured");

    const messages = [...history];
    const lastMsg = messages.pop();
    
    if (!lastMsg || lastMsg.role !== 'user') {
         throw new Error("Invalid chat history for streaming");
    }

    const geminiHistory: Content[] = messages.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));

    const chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: geminiHistory,
        config: {
            systemInstruction: context || undefined
        }
    });

    const result = await chatSession.sendMessageStream({ message: lastMsg.text });
    
    for await (const chunk of result) {
        const text = chunk.text;
        if (text) onChunk(text);
    }
  },

  streamArticle: async (
    config: ArticleConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    if (!ai) throw new Error("API Key not configured");

    const prompt = `Write a ${config.tone} ${config.type} about "${config.topic}" in ${config.language}.
    
    Context: ${config.context || 'None'}
    
    Format: Use Markdown with headers, bullet points, and clear sections.`;

    const response = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
    });

    for await (const chunk of response) {
        const text = chunk.text;
        if (text) onChunk(text);
    }
  },

  enhancePrompt: async (simplePrompt: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert AI Art Prompter. Rewrite the following user description into a highly detailed, descriptive prompt suitable for an image generation model. 
        Include details about lighting, composition, texture, and mood. Keep it under 100 words. Return ONLY the raw prompt text, no markdown.
        
        User description: "${simplePrompt}"`
    });

    return response.text?.trim() || simplePrompt;
  },

};
