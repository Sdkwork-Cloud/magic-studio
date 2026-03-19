import { describe, expect, it } from 'vitest';

import { buildMagicCutImportScope } from '../src/domain/assets/magicCutImportScope';

describe('buildMagicCutImportScope', () => {
  it('falls back to the active project id when workspace scope does not already provide one', () => {
    expect(
      buildMagicCutImportScope(
        {
          workspaceId: 'workspace-1',
          projectId: undefined,
          collectionId: 'collection-1',
        },
        'project-99'
      )
    ).toEqual({
      workspaceId: 'workspace-1',
      projectId: 'project-99',
      collectionId: 'collection-1',
      domain: 'magiccut',
    });
  });

  it('preserves an existing scoped project id when one is already present', () => {
    expect(
      buildMagicCutImportScope(
        {
          workspaceId: 'workspace-1',
          projectId: 'project-1',
        },
        'project-99'
      )
    ).toEqual({
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      domain: 'magiccut',
    });
  });
});
