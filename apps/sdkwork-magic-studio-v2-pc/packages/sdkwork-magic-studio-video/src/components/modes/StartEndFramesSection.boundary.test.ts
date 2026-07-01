import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('StartEndFramesSection ChooseAsset boundary', () => {
  it('wires project-level persisted reference contracts into both frame inputs', () => {
    const source = fs.readFileSync(
      new URL('./StartEndFramesSection.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'start-frame'");
    expect(source).toContain("slot: 'end-frame'");
    expect(source).toContain("source: 'start-end-frames-section'");
  });
});
