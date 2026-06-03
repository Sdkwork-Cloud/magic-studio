import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('SubjectReferenceSection ChooseAsset boundary', () => {
  it('wires a project-level persisted reference contract into ChooseAsset', () => {
    const source = fs.readFileSync(
      new URL('./SubjectReferenceSection.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'subject-reference'");
    expect(source).toContain("source: 'subject-reference-section'");
  });
});
