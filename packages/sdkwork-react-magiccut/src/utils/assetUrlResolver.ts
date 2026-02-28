import {
    getPrimaryAssetIdCandidate,
    resolveAssetUrlByAssetIdFirst as resolveAssetUrlByAssetIdFirstInCenter
} from '@sdkwork/react-assets';
import type { AnyMediaResource } from '@sdkwork/react-commons';

type AssetLike = Pick<AnyMediaResource, 'id' | 'path' | 'url'>;

export type AssetUrlSource = string | AssetLike | null | undefined;

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
