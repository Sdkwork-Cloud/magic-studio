import { describe, expect, it, vi } from 'vitest';

import { CHAT_STORAGE_KEY, loadChatSessionsSnapshot } from '../src/services/chatSessionStorage';

describe('chatSessionStorage', () => {
  it('uses the MagicStudio chat storage key', () => {
    expect(CHAT_STORAGE_KEY).toBe('magic_studio_chat_sessions_v3');
  });

  it('loads chat sessions from the MagicStudio storage key', async () => {
    const storage = {
      get: vi.fn(async (key: string) =>
        key === CHAT_STORAGE_KEY ? JSON.stringify([{ id: 'session-1' }]) : null
      ),
    };

    const snapshot = await loadChatSessionsSnapshot(storage);

    expect(snapshot).toBe(JSON.stringify([{ id: 'session-1' }]));
    expect(storage.get).toHaveBeenCalledTimes(1);
    expect(storage.get).toHaveBeenCalledWith(CHAT_STORAGE_KEY);
  });

  it('returns null when there is no MagicStudio snapshot', async () => {
    const storage = {
      get: vi.fn(async () => null),
    };

    const snapshot = await loadChatSessionsSnapshot(storage);

    expect(snapshot).toBeNull();
    expect(storage.get).toHaveBeenCalledWith(CHAT_STORAGE_KEY);
  });
});
