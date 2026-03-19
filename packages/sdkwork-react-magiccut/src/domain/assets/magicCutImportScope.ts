import type { AssetScope } from '@sdkwork/react-types';

export const buildMagicCutImportScope = (
  scope: Omit<AssetScope, 'domain'>,
  fallbackProjectId?: string
): AssetScope => ({
  ...scope,
  projectId: scope.projectId || fallbackProjectId,
  domain: 'magiccut',
});
