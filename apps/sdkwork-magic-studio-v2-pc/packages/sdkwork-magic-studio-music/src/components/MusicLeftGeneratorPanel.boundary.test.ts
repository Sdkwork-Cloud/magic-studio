import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('MusicLeftGeneratorPanel ChooseAsset boundary', () => {
  it('wires a project-level persisted reference contract into the source music input', () => {
    const source = fs.readFileSync(
      new URL('./MusicLeftGeneratorPanel.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'source-music'");
    expect(source).toContain("source: 'music-left-generator-panel'");
  });
});
