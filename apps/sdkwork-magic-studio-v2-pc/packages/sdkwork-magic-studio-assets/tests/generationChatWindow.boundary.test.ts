import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

const CHAT_PAGES = [
  '../../sdkwork-magic-studio-audio/src/pages/AudioChatPage.tsx',
  '../../sdkwork-magic-studio-image/src/pages/ImageChatPage.tsx',
  '../../sdkwork-magic-studio-video/src/pages/VideoChatPage.tsx',
  '../../sdkwork-magic-studio-music/src/pages/MusicChatPage.tsx',
  '../../sdkwork-magic-studio-sfx/src/pages/SfxChatPage.tsx',
  '../../sdkwork-magic-studio-voicespeaker/src/pages/VoiceChatPage.tsx',
  '../../sdkwork-magic-studio-character/src/pages/CharacterChatPage.tsx',
];

describe('generation chat window page boundaries', () => {
  it('avoids any-casts in chat page adapters', () => {
    for (const relativePath of CHAT_PAGES) {
      const source = fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
      expect(source).not.toContain('as any');
    }
  });
});
