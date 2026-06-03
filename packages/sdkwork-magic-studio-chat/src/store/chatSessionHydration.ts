import type { ChatMessage, ChatSession, ChatTranscript } from '../entities';
import { createEmptyChatTranscript, normalizeChatTranscript } from '../services/chatIdentity';
import { findChatSessionByKey } from './chatSessionIdentity';

export interface HydratedChatSession extends ChatSession {
  messages: ChatMessage[];
}

interface TranscriptResultLike {
  success: boolean;
  data?: Partial<ChatTranscript>;
}

export const hydrateActiveChatSession = async (
  sessionId: string,
  sessions: ChatSession[],
  loadTranscript: (sessionId: string) => Promise<TranscriptResultLike>
): Promise<HydratedChatSession | null> => {
  const meta = findChatSessionByKey(sessions, sessionId);
  if (!meta) {
    return null;
  }

  const transcriptRes = await loadTranscript(sessionId);
  const transcript = transcriptRes.success && transcriptRes.data
    ? normalizeChatTranscript(sessionId, transcriptRes.data)
    : createEmptyChatTranscript(sessionId);

  if (transcriptRes.success && transcriptRes.data) {
    return {
      ...meta,
      messages: transcript.messages || []
    };
  }

  return {
    ...meta,
    messages: transcript.messages
  };
};
