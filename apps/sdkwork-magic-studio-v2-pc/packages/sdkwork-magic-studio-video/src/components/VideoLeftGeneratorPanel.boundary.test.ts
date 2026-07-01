import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('VideoLeftGeneratorPanel ChooseAssetModal boundary', () => {
  it('wires a project-level persisted reference contract into the reference images modal', () => {
    const source = fs.readFileSync(
      new URL('./VideoLeftGeneratorPanel.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'video-reference-images'");
    expect(source).toContain("source: 'video-left-generator-panel'");
  });
});
