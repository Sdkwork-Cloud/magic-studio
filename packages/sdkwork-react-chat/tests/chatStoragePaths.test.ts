import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCAL_CHAT_USER_ID,
  resolveMagicStudioChatDirectory,
} from '../src/services/chatStoragePaths';

describe('chatStoragePaths', () => {
  it('defaults chat transcripts to the MagicStudio user chats directory', async () => {
    const directory = await resolveMagicStudioChatDirectory(
      '/Users/demo',
      async () => null
    );

    expect(directory).toBe(
      '/Users/demo/.sdkwork/magicstudio/users/local-user/chats'
    );
  });

  it('respects the configured MagicStudio root override for chat transcripts', async () => {
    const directory = await resolveMagicStudioChatDirectory(
      '/Users/demo',
      async () =>
        JSON.stringify({
          materialStorage: {
            desktop: {
              rootDir: '/Volumes/StudioRoot',
            },
          },
        }),
      'user-42'
    );

    expect(DEFAULT_LOCAL_CHAT_USER_ID).toBe('local-user');
    expect(directory).toBe('/Volumes/StudioRoot/users/user-42/chats');
  });
});
