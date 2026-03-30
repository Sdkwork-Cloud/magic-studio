import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PortalPage startup boundaries', () => {
  it('keeps the community gallery behind a deferred import boundary', () => {
    const sourcePath = path.resolve(
      process.cwd(),
      'packages/sdkwork-react-portal-video/src/components/PortalHomeExperience.tsx',
    );
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).not.toMatch(/import\s+\{\s*CommunityGallery\s*\}\s+from/);
    expect(source).toContain("import('../components/CommunityGallery')");
  });

  it('keeps heavy creation dependencies behind a deferred home composer boundary', () => {
    const sourcePath = path.resolve(
      process.cwd(),
      'packages/sdkwork-react-portal-video/src/pages/PortalPage.tsx',
    );
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).not.toContain("@sdkwork/react-film");
    expect(source).not.toContain("@sdkwork/react-assets");
    expect(source).toContain("import('../components/PortalHomeExperience')");
  });
});
