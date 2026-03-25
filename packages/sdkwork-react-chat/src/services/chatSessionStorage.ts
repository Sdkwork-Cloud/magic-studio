type ChatSessionStorage = {
  get(key: string): Promise<string | null>;
};

export const CHAT_STORAGE_KEY = 'magic_studio_chat_sessions_v3';

export const loadChatSessionsSnapshot = async (
  storage: ChatSessionStorage
): Promise<string | null> => storage.get(CHAT_STORAGE_KEY);
