import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('LipSyncSection ChooseAsset boundary', () => {
  it('wires project-level persisted reference contracts into all media slots', () => {
    const source = fs.readFileSync(
      new URL('./LipSyncSection.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('projectReference={{');
    expect(source).toContain("slot: 'source-video'");
    expect(source).toContain("slot: 'source-image'");
    expect(source).toContain("slot: 'driver-audio'");
    expect(source).toContain("source: 'lip-sync-section'");
  });
});
