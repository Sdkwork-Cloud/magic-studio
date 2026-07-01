import { GoogleGenAI, type Content } from '@google/genai';

function readGeminiApiKey(): string {
  const processEnv = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;

  return (
    processEnv?.GEMINI_API_KEY?.trim()
    || processEnv?.API_KEY?.trim()
    || ''
  );
}

const API_KEY = readGeminiApiKey();

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface ArticleConfig {
  topic: string;
  type: string;
  tone: string;
  language: string;
  context: string;
}

export interface GenAIServiceType {
  isConfigured: () => boolean;
  streamChat: (
    history: { role: 'user' | 'model'; text: string }[],
    context: string,
    onChunk: (chunk: string) => void,
  ) => Promise<void>;
  streamArticle: (
    config: ArticleConfig,
    onChunk: (chunk: string) => void,
  ) => Promise<void>;
}

const requireConfiguredAi = (): GoogleGenAI => {
  if (!ai) {
    throw new Error('API Key not configured');
  }
  return ai;
};

export const genAIService: GenAIServiceType = {
  isConfigured: () => Boolean(ai),

  streamChat: async (
    history: { role: 'user' | 'model'; text: string }[],
    context: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> => {
    const configuredAi = requireConfiguredAi();
    const messages = [...history];
    const lastMsg = messages.pop();

    if (!lastMsg || lastMsg.role !== 'user') {
      throw new Error('Invalid chat history for streaming');
    }

    const geminiHistory: Content[] = messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    }));

    const chatSession = configuredAi.chats.create({
      model: 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: context || undefined,
      },
    });

    const result = await chatSession.sendMessageStream({ message: lastMsg.text });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  },

  streamArticle: async (
    config: ArticleConfig,
    onChunk: (chunk: string) => void,
  ): Promise<void> => {
    const configuredAi = requireConfiguredAi();
    const prompt = `Write a ${config.tone} ${config.type} about "${config.topic}" in ${config.language}.

Context: ${config.context || 'None'}

Format: Use Markdown with headers, bullet points, and clear sections.`;

    const response = await configuredAi.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  },
};
