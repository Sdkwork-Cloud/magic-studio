import { resolveAssetUrlByAssetIdFirst } from '../../../asset-center';

export const resolveCanonicalUploadAssetUrl = async (
  source: Parameters<typeof resolveAssetUrlByAssetIdFirst>[0],
): Promise<string | null> => resolveAssetUrlByAssetIdFirst(source);
