import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('VideoPromptStyleSection ChooseAsset boundary', () => {
  it('wires a project-level persisted reference contract into the soundtrack input', () => {
    const source = fs.readFileSync(
      new URL('./VideoPromptStyleSection.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'audio-track'");
    expect(source).toContain("source: 'video-prompt-style-section'");
  });
});
