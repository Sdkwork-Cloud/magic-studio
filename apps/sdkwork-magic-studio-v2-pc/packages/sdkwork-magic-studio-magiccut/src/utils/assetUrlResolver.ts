import {
    type AssetUrlResolveSource,
    getPrimaryAssetIdCandidate,
    resolveAssetUrlByAssetIdFirst as resolveAssetUrlByAssetIdFirstInCenter
} from '@sdkwork/magic-studio-assets/asset-center';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';

export type AssetUrlSource = AssetUrlResolveSource | Pick<AnyMediaResource, 'id' | 'path' | 'url'>;

export const getAssetIdCandidate = (source: AssetUrlSource): string | undefined => {
    return getPrimaryAssetIdCandidate(source as any);
};

/**
 * Asset URL resolver with strict priority:
 * 1) asset-center by assetId
 * 2) direct locator fallback from source fields
 */
export const resolveAssetUrlByAssetIdFirst = async (source: AssetUrlSource): Promise<string> => {
    const resolved = await resolveAssetUrlByAssetIdFirstInCenter(source as any);
    return resolved || '';
};
