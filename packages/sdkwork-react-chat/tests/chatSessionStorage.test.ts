import { describe, expect, it, vi } from 'vitest';

import {
  CHAT_STORAGE_KEY,
  LEGACY_CHAT_STORAGE_KEYS,
  loadChatSessionsSnapshot,
} from '../src/services/chatSessionStorage';

describe('chatSessionStorage', () => {
  it('uses the MagicStudio chat storage key and keeps the OpenStudio key as a legacy fallback', () => {
    expect(CHAT_STORAGE_KEY).toBe('magic_studio_chat_sessions_v3');
    expect(LEGACY_CHAT_STORAGE_KEYS).toContain('open_studio_chat_sessions_v2');
  });

  it('migrates legacy OpenStudio chat sessions into the MagicStudio storage key', async () => {
    const storage = {
      get: vi.fn(async (key: string) =>
        key === 'open_studio_chat_sessions_v2'
          ? JSON.stringify([{ id: 'session-1' }])
          : null
      ),
      set: vi.fn(async () => {}),
      remove: vi.fn(async () => {}),
    };

    const snapshot = await loadChatSessionsSnapshot(storage);

    expect(snapshot).toBe(JSON.stringify([{ id: 'session-1' }]));
    expect(storage.get).toHaveBeenNthCalledWith(1, 'magic_studio_chat_sessions_v3');
    expect(storage.get).toHaveBeenNthCalledWith(2, 'open_studio_chat_sessions_v2');
    expect(storage.set).toHaveBeenCalledWith(
      'magic_studio_chat_sessions_v3',
      JSON.stringify([{ id: 'session-1' }])
    );
    expect(storage.remove).toHaveBeenCalledWith('open_studio_chat_sessions_v2');
  });

  it('still loads legacy sessions when migration persistence fails', async () => {
    const storage = {
      get: vi.fn(async (key: string) =>
        key === 'open_studio_chat_sessions_v2'
          ? JSON.stringify([{ id: 'session-legacy' }])
          : null
      ),
      set: vi.fn(async () => {
        throw new Error('disk unavailable');
      }),
      remove: vi.fn(async () => {}),
    };

    const snapshot = await loadChatSessionsSnapshot(storage);

    expect(snapshot).toBe(JSON.stringify([{ id: 'session-legacy' }]));
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
