import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CommunityGallery source guards', () => {
  it('uses shared controls instead of raw buttons', () => {
    const sourcePath = path.resolve(
      process.cwd(),
      'packages/sdkwork-react-portal-video/src/components/CommunityGallery.tsx',
    );
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).not.toMatch(/<button\b/);
  });
});
