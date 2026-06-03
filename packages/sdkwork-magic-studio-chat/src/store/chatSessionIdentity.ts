import { matchesEntityKey, resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

import type { ChatSession } from '../entities';

interface ChatSessionIdentityLike {
    id?: string | null;
    uuid?: string | null;
}

interface ResolveChatSessionSendTargetOptions<TSession extends ChatSessionIdentityLike> {
    activeSessionKey: string | null;
    activeSession: TSession | null;
    isGenerating: boolean;
    createSession: (modelId?: string) => Promise<string>;
    getSessionByKey: (sessionKey: string) => TSession | null;
    modelId?: string;
}

export interface ChatSessionSendTarget<TSession extends ChatSessionIdentityLike> {
    sessionKey: string;
    session: TSession;
}

export const resolveChatSessionKey = (
    session: Pick<ChatSession, 'id' | 'uuid'>
): string => resolveEntityKey(session);

export const findChatSessionByKey = (
    sessions: ChatSession[],
    sessionKey: string
): ChatSession | null => sessions.find((session) => matchesEntityKey(session, sessionKey)) || null;

export const replaceChatSessionByKey = (
    sessions: ChatSession[],
    sessionKey: string,
    nextSession: ChatSession
): ChatSession[] => sessions.map((session) => (
    matchesEntityKey(session, sessionKey) ? nextSession : session
));

export const removeChatSessionByKey = (
    sessions: ChatSession[],
    sessionKey: string
): ChatSession[] => sessions.filter((session) => !matchesEntityKey(session, sessionKey));

export const resolveChatSessionSendTarget = async <TSession extends ChatSessionIdentityLike>(
    options: ResolveChatSessionSendTargetOptions<TSession>
): Promise<ChatSessionSendTarget<TSession> | null> => {
    const {
        activeSessionKey,
        activeSession,
        isGenerating,
        createSession,
        getSessionByKey,
        modelId,
    } = options;

    if (isGenerating) {
        return null;
    }

    const stableActiveSessionKey = activeSession
        ? resolveEntityKey(activeSession)
        : activeSessionKey;

    if (
        stableActiveSessionKey &&
        activeSession &&
        matchesEntityKey(activeSession, stableActiveSessionKey)
    ) {
        return {
            sessionKey: stableActiveSessionKey,
            session: activeSession,
        };
    }

    if (stableActiveSessionKey || activeSession) {
        return null;
    }

    const createdSessionKey = await createSession(modelId);
    if (!createdSessionKey) {
        return null;
    }

    const createdSession = getSessionByKey(createdSessionKey);
    if (!createdSession || !matchesEntityKey(createdSession, createdSessionKey)) {
        return null;
    }

    return {
        sessionKey: createdSessionKey,
        session: createdSession,
    };
};
