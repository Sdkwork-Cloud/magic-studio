import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';

import type { ChatMessage, ChatRole, ChatTranscript } from '../entities';

type ChatMessageDraft = Omit<ChatMessage, 'id' | 'uuid'> & Partial<Pick<ChatMessage, 'id' | 'uuid'>>;
type ChatTranscriptDraft = Partial<Omit<ChatTranscript, 'id' | 'uuid' | 'sessionId' | 'messages'>> & {
    id?: string | null;
    uuid?: string | null;
    sessionId?: string | null;
    messages?: ChatMessageDraft[];
};

const normalizeIdentityValue = (value?: string | null): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const deriveClientEntityUuidFromId = (value: string): string => `client-entity:${value}`;

export const normalizeChatMessage = (message: ChatMessageDraft): ChatMessage => {
    const normalizedId = normalizeIdentityValue(message.id);
    const messageKey = normalizeIdentityValue(message.uuid)
        || (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null)
        || generateUUID();

    return {
        ...message,
        id: normalizedId,
        uuid: messageKey,
    };
};

export const createChatMessage = (
    role: ChatRole,
    content: string,
    model?: string
): ChatMessage => {
    const messageUuid = generateUUID();

    return {
        id: null,
        uuid: messageUuid,
        role,
        content,
        timestamp: Date.now(),
        model,
        status: role === 'user' ? 'completed' : 'streaming'
    };
};

export const createEmptyChatTranscript = (sessionKey: string): ChatTranscript => ({
    id: null,
    uuid: sessionKey,
    sessionId: sessionKey,
    messages: [],
});

export const normalizeChatTranscript = (
    sessionKey: string,
    transcript?: ChatTranscriptDraft | null
): ChatTranscript => ({
    ...transcript,
    id: null,
    uuid: sessionKey,
    sessionId: sessionKey,
    messages: Array.isArray(transcript?.messages)
        ? transcript.messages.map(normalizeChatMessage)
        : [],
});
