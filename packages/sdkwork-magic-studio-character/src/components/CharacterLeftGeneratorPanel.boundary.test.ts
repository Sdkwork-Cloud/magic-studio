import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('CharacterLeftGeneratorPanel ChooseAsset boundary', () => {
  it('wires a project-level persisted reference contract into the character avatar input', () => {
    const source = fs.readFileSync(
      new URL('./CharacterLeftGeneratorPanel.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'character-avatar'");
    expect(source).toContain("source: 'character-left-generator-panel'");
  });
});
