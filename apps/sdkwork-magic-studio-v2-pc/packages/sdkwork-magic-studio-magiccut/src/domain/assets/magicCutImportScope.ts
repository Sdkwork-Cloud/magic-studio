import type { AssetScope } from '@sdkwork/magic-studio-types/asset-center';

export const buildMagicCutImportScope = (
  scope: Omit<AssetScope, 'domain'>,
  fallbackProjectId?: string
): AssetScope => ({
  ...scope,
  projectId: scope.projectId || fallbackProjectId,
  domain: 'magiccut',
});
