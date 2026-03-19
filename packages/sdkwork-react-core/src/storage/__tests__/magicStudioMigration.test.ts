import { describe, expect, it } from 'vitest';

import { planMagicStudioMigration } from '../magicStudioMigration';

describe('magicStudioMigration', () => {
  it('rewrites legacy open-studio root to magicstudio exactly once', () => {
    const result = planMagicStudioMigration({
      currentRoot: '/Users/demo/.sdkwork/open-studio',
      targetRoot: '/Users/demo/.sdkwork/magicstudio',
      targetEmpty: true,
      markerExists: false,
    });

    expect(result.required).toBe(true);
    expect(result.reason).toBe('legacy-root');
    expect(result.sourceRoot).toBe('/Users/demo/.sdkwork/open-studio');
    expect(result.targetRoot.endsWith('/magicstudio')).toBe(true);
  });

  it('stays idle after migration has already been marked complete', () => {
    const result = planMagicStudioMigration({
      currentRoot: '/Users/demo/.sdkwork/open-studio',
      targetRoot: '/Users/demo/.sdkwork/magicstudio',
      targetEmpty: true,
      markerExists: true,
    });

    expect(result.required).toBe(false);
    expect(result.reason).toBe('already-migrated');
  });
});
