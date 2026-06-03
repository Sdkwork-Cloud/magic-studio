import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { matchesEntityKey, resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

import type { ChatSession } from '../entities';
import { chatBusinessService } from '../services';
import { hydrateActiveChatSession, type HydratedChatSession } from './chatSessionHydration';
import {
  findChatSessionByKey,
  removeChatSessionByKey,
  resolveChatSessionSendTarget,
} from './chatSessionIdentity';

export type ActiveChatSession = HydratedChatSession;

interface ChatStoreContextType {
  sessions: ChatSession[];
  activeSessionKey: string | null;
  currentSession: ActiveChatSession | null;
  isLoading: boolean;
  isGenerating: boolean;

  createSession: (modelId?: string) => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
  selectSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;

  sendMessage: (content: string, modelId?: string, context?: string) => Promise<void>;
  clearSessions: () => Promise<void>;
}

const ChatStoreContext = createContext<ChatStoreContextType | undefined>(undefined);

export const ChatStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const sessionsRef = useRef<ChatSession[]>([]);
  const activeSessionKeyRef = useRef<string | null>(null);
  const activeSessionRef = useRef<ActiveChatSession | null>(null);

  const updateSessions = useCallback(
    (next: ChatSession[] | ((previous: ChatSession[]) => ChatSession[])) => {
      const resolved = typeof next === 'function'
        ? next(sessionsRef.current)
        : next;

      sessionsRef.current = resolved;
      setSessions(resolved);
    },
    []
  );

  const updateActiveSessionKey = useCallback((next: string | null) => {
    activeSessionKeyRef.current = next;
    setActiveSessionKey(next);
  }, []);

  const updateActiveSession = useCallback(
    (
      next:
        | ActiveChatSession
        | null
        | ((previous: ActiveChatSession | null) => ActiveChatSession | null)
    ) => {
      const resolved = typeof next === 'function'
        ? next(activeSessionRef.current)
        : next;

      activeSessionRef.current = resolved;
      setActiveSession(resolved);
    },
    []
  );

  const loadSession = useCallback(async (sessionKey: string, sessionList: ChatSession[]) => {
    updateActiveSessionKey(sessionKey);
    const hydrated = await hydrateActiveChatSession(
      sessionKey,
      sessionList,
      (key) => chatBusinessService.getTranscript(key)
    );
    updateActiveSession(hydrated);
    setIsLoading(false);
  }, [updateActiveSession, updateActiveSessionKey]);

  const selectSession = useCallback(async (sessionKey: string) => {
    setIsLoading(true);
    await loadSession(sessionKey, sessionsRef.current);
  }, [loadSession]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const result = await chatBusinessService.findAll({ page: 0, size: 50 });

      if (result.success && result.data) {
        const loaded = result.data.content;
        updateSessions(loaded);

        if (loaded.length > 0) {
          await loadSession(resolveEntityKey(loaded[0]), loaded);
        } else {
          updateActiveSessionKey(null);
          updateActiveSession(null);
          setIsLoading(false);
        }
      } else {
        updateActiveSessionKey(null);
        updateActiveSession(null);
        setIsLoading(false);
      }
    };

    void init();
  }, [loadSession, updateActiveSession, updateActiveSessionKey, updateSessions]);

  const createSession = useCallback(async (modelId: string = 'gpt-4o') => {
    const res = await chatBusinessService.createSession(modelId);

    if (res.success && res.data) {
      const newSession = res.data;
      const sessionKey = resolveEntityKey(newSession);

      updateSessions((previous) => [newSession, ...previous]);
      updateActiveSessionKey(sessionKey);
      updateActiveSession({ ...newSession, messages: [] });

      return sessionKey;
    }

    return '';
  }, [updateActiveSession, updateActiveSessionKey, updateSessions]);

  const deleteSession = useCallback(async (sessionKey: string) => {
    await chatBusinessService.deleteById(sessionKey);

    const remaining = removeChatSessionByKey(sessionsRef.current, sessionKey);
    updateSessions(remaining);

    const currentActiveSession = activeSessionRef.current;
    const currentActiveSessionKey = activeSessionKeyRef.current;

    if (
      (currentActiveSession && matchesEntityKey(currentActiveSession, sessionKey)) ||
      currentActiveSessionKey === sessionKey
    ) {
      if (remaining.length > 0) {
        setIsLoading(true);
        await loadSession(resolveEntityKey(remaining[0]), remaining);
      } else {
        updateActiveSessionKey(null);
        updateActiveSession(null);
        setIsLoading(false);
      }
    }
  }, [loadSession, updateActiveSession, updateActiveSessionKey, updateSessions]);

  const updateSessionTitle = useCallback((sessionKey: string, title: string) => {
    const session = findChatSessionByKey(sessionsRef.current, sessionKey);

    updateSessions((previous) => previous.map((item) => (
      matchesEntityKey(item, sessionKey)
        ? { ...item, title, updatedAt: Date.now() }
        : item
    )));

    const currentActiveSession = activeSessionRef.current;
    if (currentActiveSession && matchesEntityKey(currentActiveSession, sessionKey)) {
      updateActiveSession((previous) => previous ? { ...previous, title } : null);
    }

    void chatBusinessService.save({
      id: session?.id ?? null,
      uuid: session?.uuid ?? sessionKey,
      title,
    });
  }, [updateActiveSession, updateSessions]);

  const sendMessage = useCallback(async (content: string, modelId?: string, context?: string) => {
    const target = await resolveChatSessionSendTarget({
      activeSessionKey: activeSessionKeyRef.current,
      activeSession: activeSessionRef.current,
      isGenerating,
      createSession,
      getSessionByKey: (sessionKey) => {
        const currentActiveSession = activeSessionRef.current;
        return currentActiveSession && matchesEntityKey(currentActiveSession, sessionKey)
          ? currentActiveSession
          : null;
      },
      modelId,
    });

    if (!target) {
      return;
    }

    const { sessionKey, session } = target;

    setIsGenerating(true);

    const userMsg = chatBusinessService.createMessage('user', content);
    const aiMsg = chatBusinessService.createMessage('ai', '', modelId);
    const aiMessageKey = resolveEntityKey(aiMsg);

    const nextMessages = [...session.messages, userMsg, aiMsg];
    const updatedSession: ActiveChatSession = {
      ...session,
      updatedAt: Date.now(),
      messages: nextMessages,
    };

    if (session.messages.length === 0) {
      updatedSession.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
    }
    const shouldPersistSessionTitle = updatedSession.title !== session.title;

    updateActiveSession(updatedSession);

    updateSessions((previous) => previous.map((storedSession) => (
      matchesEntityKey(storedSession, sessionKey)
        ? {
            ...storedSession,
            title: updatedSession.title,
            updatedAt: updatedSession.updatedAt,
            messageCount: nextMessages.length,
          }
        : storedSession
    )));

    if (shouldPersistSessionTitle) {
      await chatBusinessService.save({
        id: session.id ?? null,
        uuid: session.uuid,
        title: updatedSession.title,
      });
    }

    await chatBusinessService.saveTranscript(sessionKey, nextMessages);

    try {
      let accumulatedContent = '';
      const historyForAI = session.messages;

      await chatBusinessService.streamResponse(
        content,
        (chunk) => {
          accumulatedContent += chunk;

          updateActiveSession((previous) => {
            if (!previous || !matchesEntityKey(previous, sessionKey)) {
              return previous;
            }

            const updatedMessages = [...previous.messages];
            const targetIndex = updatedMessages.findIndex((message) => matchesEntityKey(message, aiMessageKey));
            if (targetIndex !== -1) {
              updatedMessages[targetIndex] = {
                ...updatedMessages[targetIndex],
                content: accumulatedContent,
              };
            }

            return {
              ...previous,
              messages: updatedMessages,
            };
          });
        },
        context,
        historyForAI
      );

      updateActiveSession((previous) => {
        if (!previous) {
          return null;
        }

        const finalMessages = previous.messages.map((message) => (
          matchesEntityKey(message, aiMessageKey)
            ? { ...message, status: 'completed' as const, content: accumulatedContent }
            : message
        ));

        void chatBusinessService.saveTranscript(sessionKey, finalMessages);

        return {
          ...previous,
          messages: finalMessages,
        };
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate.';

      updateActiveSession((previous) => {
        if (!previous) {
          return null;
        }

        const finalMessages = previous.messages.map((message) => (
          matchesEntityKey(message, aiMessageKey)
            ? { ...message, status: 'error' as const, error: errorMessage }
            : message
        ));

        void chatBusinessService.saveTranscript(sessionKey, finalMessages);

        return {
          ...previous,
          messages: finalMessages,
        };
      });
    } finally {
      setIsGenerating(false);
    }
  }, [createSession, isGenerating, updateActiveSession, updateSessions]);

  const clearSessions = useCallback(async () => {
    const ids = sessionsRef.current.map(resolveEntityKey);
    await chatBusinessService.deleteAll(ids);
    updateSessions([]);
    updateActiveSession(null);
    updateActiveSessionKey(null);
  }, [updateActiveSession, updateActiveSessionKey, updateSessions]);

  return (
    <ChatStoreContext.Provider
      value={{
        sessions,
        activeSessionKey,
        currentSession: activeSession,
        isLoading,
        isGenerating,
        createSession,
        deleteSession,
        selectSession,
        updateSessionTitle,
        sendMessage,
        clearSessions,
      }}
    >
      {children}
    </ChatStoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatStore = () => {
  const context = useContext(ChatStoreContext);
  if (!context) throw new Error('useChatStore must be used within a ChatStoreProvider');
  return context;
};
