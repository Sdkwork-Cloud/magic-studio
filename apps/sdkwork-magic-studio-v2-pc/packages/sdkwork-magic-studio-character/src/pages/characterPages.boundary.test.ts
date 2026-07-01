import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('character page type boundaries', () => {
  it('avoids adapter casts in page boundaries', () => {
    const chatPageSource = fs.readFileSync(
      new URL('./CharacterChatPage.tsx', import.meta.url),
      'utf8'
    );
    const historyPageSource = fs.readFileSync(
      new URL('./CharacterPage.tsx', import.meta.url),
      'utf8'
    );

    expect(chatPageSource).not.toContain('as any');
    expect(historyPageSource).not.toContain('as any');
    expect(chatPageSource).not.toContain('as GenerationTask[]');
    expect(chatPageSource).not.toContain('as GenerationConfig');
    expect(chatPageSource).not.toContain('as Partial<CharacterConfig>');
    expect(historyPageSource).not.toContain('as Partial<CharacterConfig>');
  });
});
