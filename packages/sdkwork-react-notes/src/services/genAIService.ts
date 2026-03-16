
import { GoogleGenAI, Modality, Type, Content } from "@google/genai";
import { audioUtils } from "../utils/audioUtils";

const API_KEY = (
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.API_KEY
    || (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_KEY
    || ''
);

// Initialize client safely
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface GenImageOptions {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    referenceImage?: string; // Base64
}

export interface ArticleConfig {
    topic: string;
    type: string;
    tone: string;
    language: string;
    context: string;
}

interface GeminiTextPart {
    text: string;
}

interface GeminiInlineDataPart {
    inlineData: {
        mimeType: string;
        data: string;
    };
}

type GeminiInputPart = GeminiTextPart | GeminiInlineDataPart;

interface VideoGenerationRequest {
    model: string;
    prompt: string;
    config: {
        numberOfVideos: number;
        resolution: string;
        aspectRatio: string;
    };
    image?: {
        mimeType: string;
        imageBytes: string;
    };
}

export const genAIService = {
  
  isConfigured: () => !!ai,

  /**
   * Generate Image using Gemini Flash Image (Nano Banana) or Pro Image
   */
  generateImage: async (options: GenImageOptions | string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured");
    
    // Normalize input
    const config = typeof options === 'string' ? { prompt: options } : options;
    
    const parts: GeminiInputPart[] = [];
    
    // Handle Reference Image
    if (config.referenceImage) {
        // Extract base64 data and mime type
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

    // Add Text Prompt
    parts.push({ text: config.prompt });

    // Select model based on complexity (Ref Image requires Pro usually, but Flash Image supports it too)
    // Using default fast model for speed, but `imageConfig` requires supported models.
    // 'gemini-2.5-flash-image' supports generation.
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
          imageConfig: config.aspectRatio ? {
              aspectRatio: config.aspectRatio
          } : undefined
      }
    });

    // Extract Base64 from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
           return `data:image/png;base64,${part.inlineData.data}`;
       }
    }
    throw new Error("No image generated");
  },

  /**
   * Generate creative prompts for a cover image based on text context
   */
  generateCoverPrompts: async (context: string): Promise<string[]> => {
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following text and generate 3 distinct, creative, and visually descriptive art prompts suitable for a cover image. 
        The prompts should be diverse in style (e.g., Minimalist, Photorealistic, Abstract, 3D Render).
        
        Text Context:
        "${context.slice(0, 3000)}"`, // Limit context to avoid token issues
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

  /**
   * Generate Video using Veo
   */
  generateVideo: async (prompt: string, image?: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured");

    const request: VideoGenerationRequest = {
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

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed");

    // Fetch the actual video bytes using the API key
    const res = await fetch(`${videoUri}&key=${API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Generate Speech using Gemini TTS
   */
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

  /**
   * Stream Chat Response
   */
  streamChat: async (
    history: { role: 'user' | 'model', text: string }[], 
    context: string, 
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    if (!ai) throw new Error("API Key not configured");

    const messages = [...history];
    const lastMsg = messages.pop();
    
    if (!lastMsg || lastMsg.role !== 'user') {
         // Fallback if no user message at end
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

  /**
   * Stream Article Generation
   */
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

  /**
   * Enhance a simple prompt into a detailed descriptive prompt.
   */
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
