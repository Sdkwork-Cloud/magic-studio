import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('AudioLeftGeneratorPanel project reference boundary', () => {
  it('reuses one project reference contract for both modal selection and local uploads', () => {
    const source = fs.readFileSync(
      new URL('./AudioLeftGeneratorPanel.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('AUDIO_SOURCE_PROJECT_REFERENCE');
    expect(source).toContain("slot: 'audio-source-audio'");
    expect(source).toContain("source: 'audio-left-generator-panel'");
    expect(source).toContain('projectReference={AUDIO_SOURCE_PROJECT_REFERENCE}');
    expect(source).toContain('persistChooseAssetProjectReference({');
    expect(source).toContain('projectReference: AUDIO_SOURCE_PROJECT_REFERENCE');
  });
});
