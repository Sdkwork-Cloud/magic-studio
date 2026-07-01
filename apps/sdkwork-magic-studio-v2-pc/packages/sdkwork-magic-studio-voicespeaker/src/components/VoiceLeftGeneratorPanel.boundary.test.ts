import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('VoiceLeftGeneratorPanel ChooseAssetModal boundary', () => {
  it('wires a project-level persisted reference contract into the reference audio modal', () => {
    const source = fs.readFileSync(
      new URL('./VoiceLeftGeneratorPanel.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'voice-left-reference-audio'");
    expect(source).toContain("source: 'voice-left-generator-panel'");
  });
});
