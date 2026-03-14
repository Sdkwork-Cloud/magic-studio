
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatSession, ChatMessage } from '../entities';
import { chatBusinessService } from '../services';

export interface ActiveChatSession extends ChatSession {
    messages: ChatMessage[];
}

interface ChatStoreContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveChatSession | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectSession = useCallback(async (id: string) => {
    setActiveSessionId(id);
    
    const meta = sessions.find(s => s.id === id);
    if (!meta) return;

    const transcriptRes = await chatBusinessService.getTranscript(id);
    if (transcriptRes.success && transcriptRes.data) {
        setActiveSession({
            ...meta,
            messages: transcriptRes.data.messages
        });
    } else {
        setActiveSession({ ...meta, messages: [] });
    }
    setIsLoading(false);
  }, [sessions]);

  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        const result = await chatBusinessService.findAll({ page: 0, size: 50 });
        if (result.success && result.data) {
             const loaded = result.data.content;
             setSessions(loaded);
             
             if (loaded.length > 0) {
                 selectSession(loaded[0].id);
             } else {
                 setIsLoading(false);
             }
        } else {
             setIsLoading(false);
        }
    };
    init();
  }, [selectSession]);

  const createSession = useCallback(async (modelId: string = 'gpt-4o') => {
    const res = await chatBusinessService.createSession(modelId);
    if (res.success && res.data) {
        const newSession = res.data;
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setActiveSession({ ...newSession, messages: [] });
        return newSession.id;
    }
    return '';
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await chatBusinessService.deleteById(id);
    setSessions(prev => {
        const remaining = prev.filter(s => s.id !== id);
        if (activeSessionId === id) {
            if (remaining.length > 0) {
                selectSession(remaining[0].id);
            } else {
                setActiveSessionId(null);
                setActiveSession(null);
            }
        }
        return remaining;
    });
  }, [activeSessionId, selectSession]);

  const updateSessionTitle = useCallback((id: string, title: string) => {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title, updatedAt: Date.now() } : s));
      
      if (activeSession && activeSession.id === id) {
          setActiveSession(prev => prev ? { ...prev, title } : null);
      }
      chatBusinessService.save({ id, title });
  }, [activeSession]);

  const sendMessage = useCallback(async (content: string, modelId?: string, context?: string) => {
      if (!activeSessionId || !activeSession || isGenerating) return;

      setIsGenerating(true);

      const userMsg = chatBusinessService.createMessage('user', content);
      const aiMsg = chatBusinessService.createMessage('ai', '', modelId);

      const nextMessages = [...activeSession.messages, userMsg, aiMsg];
      
      const updatedSession: ActiveChatSession = {
          ...activeSession,
          updatedAt: Date.now(),
          messages: nextMessages
      };
      
      if (activeSession.messages.length === 0) {
          updatedSession.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      }
      
      setActiveSession(updatedSession);
      
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, 
          title: updatedSession.title, 
          updatedAt: updatedSession.updatedAt,
          messageCount: nextMessages.length
      } : s));

      await chatBusinessService.saveTranscript(activeSessionId, nextMessages);

      try {
          let accumulatedContent = '';
          const historyForAI = activeSession.messages; 
          
          await chatBusinessService.streamResponse(
              content, 
              (chunk) => {
                  accumulatedContent += chunk;
                  
                  setActiveSession(prev => {
                      if (!prev || prev.id !== activeSessionId) return prev;
                      const newMsgs = [...prev.messages];
                      const targetIdx = newMsgs.findIndex(m => m.id === aiMsg.id);
                      if (targetIdx !== -1) {
                          newMsgs[targetIdx] = { ...newMsgs[targetIdx], content: accumulatedContent };
                      }
                      return { ...prev, messages: newMsgs };
                  });
              },
              context,
              historyForAI
          );

          setActiveSession(prev => {
              if (!prev) return null;
              const finalMessages = prev.messages.map(m => 
                  m.id === aiMsg.id 
                  ? { ...m, status: 'completed' as const, content: accumulatedContent } 
                  : m
              );
              
              chatBusinessService.saveTranscript(activeSessionId, finalMessages);
              
              return { ...prev, messages: finalMessages };
          });

      } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate.';
          setActiveSession(prev => {
              if (!prev) return null;
              const finalMessages = prev.messages.map(m => 
                  m.id === aiMsg.id 
                  ? { ...m, status: 'error' as const, error: errorMessage } 
                  : m
              );
              chatBusinessService.saveTranscript(activeSessionId, finalMessages);
              return { ...prev, messages: finalMessages };
          });
      } finally {
          setIsGenerating(false);
      }

  }, [activeSessionId, activeSession, isGenerating]);

  const clearSessions = useCallback(async () => {
      const ids = sessions.map(s => s.id);
      await chatBusinessService.deleteAll(ids);
      setSessions([]);
      setActiveSession(null);
      setActiveSessionId(null);
  }, [sessions]);

  return (
    <ChatStoreContext.Provider value={{ 
      sessions, 
      activeSessionId, 
      currentSession: activeSession, 
      isLoading,
      isGenerating,
      createSession, 
      deleteSession, 
      selectSession, 
      updateSessionTitle,
      sendMessage,
      clearSessions
    }}>
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

