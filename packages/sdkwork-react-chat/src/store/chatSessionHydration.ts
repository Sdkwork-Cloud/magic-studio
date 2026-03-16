import type { ChatMessage, ChatSession } from '../entities';

export interface HydratedChatSession extends ChatSession {
  messages: ChatMessage[];
}

interface TranscriptResultLike {
  success: boolean;
  data?: {
    messages?: ChatMessage[];
  };
}

export const hydrateActiveChatSession = async (
  sessionId: string,
  sessions: ChatSession[],
  loadTranscript: (sessionId: string) => Promise<TranscriptResultLike>
): Promise<HydratedChatSession | null> => {
  const meta = sessions.find((session) => session.id === sessionId);
  if (!meta) {
    return null;
  }

  const transcriptRes = await loadTranscript(sessionId);
  if (transcriptRes.success && transcriptRes.data) {
    return {
      ...meta,
      messages: transcriptRes.data.messages || []
    };
  }

  return {
    ...meta,
    messages: []
  };
};
