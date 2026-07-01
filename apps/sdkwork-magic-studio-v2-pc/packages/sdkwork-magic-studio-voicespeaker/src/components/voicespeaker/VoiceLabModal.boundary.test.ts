import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('VoiceLabModal ChooseAsset boundary', () => {
  it('wires project-level persisted reference contracts into the avatar and clone reference inputs', () => {
    const source = fs.readFileSync(
      new URL('./VoiceLabModal.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'voice-lab-avatar'");
    expect(source).toContain("slot: 'voice-lab-reference-audio'");
    expect(source).toContain("source: 'voice-lab-modal'");
  });
});
