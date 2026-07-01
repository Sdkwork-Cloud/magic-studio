import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import {
    isRenderableAssetUrl as isRenderableAssetUrlBase,
    resolveRenderableAssetSourceUrl,
    useRenderableAssetUrl,
} from '@sdkwork/magic-studio-commons/hooks';
import {
    resolveAssetUrlByAssetIdFirst,
    type AssetUrlResolveSource,
} from '../asset-center/application/assetUrlResolver';

export interface Asset {
  id: string;
  path: string;
  url?: string;
  type?: string;
}

type AssetSource = AssetUrlResolveSource | Asset | AnyMediaResource | null | undefined;

export interface UseAssetUrlOptions {
  /** Custom resolver function to convert asset source to URL */
  resolver?: (source: AssetSource) => Promise<string | null>;
}

export const isRenderableAssetUrl = isRenderableAssetUrlBase;

export const resolveAssetSourceUrl = async (
    source: AssetSource,
    resolver?: (source: AssetSource) => Promise<string | null>
): Promise<string | null> => {
    if (!source) {
        return null;
    }

    if (typeof source === 'string' && isRenderableAssetUrl(source)) {
        return source;
    }

    const candidateResolvers = [
        resolver,
        resolver === resolveAssetUrlByAssetIdFirst ? undefined : resolveAssetUrlByAssetIdFirst
    ].filter((candidate): candidate is NonNullable<typeof resolver> => typeof candidate === 'function');

    for (const candidateResolver of candidateResolvers) {
        try {
            const resolved = await resolveRenderableAssetSourceUrl(source, candidateResolver);
            if (resolved) {
                return resolved;
            }
        } catch {
            // Keep local-first URL resolution resilient when a caller-provided resolver fails.
        }
    }

    return resolveRenderableAssetSourceUrl(source);
};

/**
 * Hook to resolve an asset reference (path, object, or resource) to a renderable URL.
 * Handles 'assets://' protocol (internal), Blobs, and Remote URLs.
 * 
 * @param source - The asset source (path string, Asset object, or AnyMediaResource)
 * @param options - Optional configuration including a custom resolver
 * @returns Object containing resolved url, loading state, and error
 * 
 * @example
 * // With default behavior (returns URLs directly)
 * const { url, loading } = useAssetUrl('https://example.com/image.png');
 * 
 * @example
 * // With custom resolver
 * const { url, loading } = useAssetUrl(assetId, { 
 *   resolver: async (source) => resolveAssetUrlByAssetIdFirst(source as any) 
 * });
 */
export const useAssetUrl = (source: AssetSource, options?: UseAssetUrlOptions) =>
    useRenderableAssetUrl(source, {
        resolver: (candidateSource) => resolveAssetSourceUrl(candidateSource as AssetSource, options?.resolver),
    });
