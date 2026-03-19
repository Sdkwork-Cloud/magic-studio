type ChatSessionStorage = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export const CHAT_STORAGE_KEY = 'magic_studio_chat_sessions_v3';
export const LEGACY_CHAT_STORAGE_KEYS = ['open_studio_chat_sessions_v2'] as const;

export const loadChatSessionsSnapshot = async (
  storage: ChatSessionStorage
): Promise<string | null> => {
  const primarySnapshot = await storage.get(CHAT_STORAGE_KEY);
  if (primarySnapshot) {
    return primarySnapshot;
  }

  for (const legacyKey of LEGACY_CHAT_STORAGE_KEYS) {
    const legacySnapshot = await storage.get(legacyKey);
    if (!legacySnapshot) {
      continue;
    }

    try {
      await storage.set(CHAT_STORAGE_KEY, legacySnapshot);
      await storage.remove(legacyKey);
    } catch {
      // Keep loading the legacy snapshot even if one migration attempt fails.
    }
    return legacySnapshot;
  }

  return null;
};
