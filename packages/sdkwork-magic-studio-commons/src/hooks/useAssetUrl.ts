import { useEffect, useState } from 'react';
import { isRenderableAssetUrl as isCanonicalRenderableAssetUrl } from '@sdkwork/magic-studio-types/asset-reference';
import type { AnyMediaResource } from '../types.ts';

export interface Asset {
  id: string;
  path: string;
  url?: string;
  remoteUrl?: string;
  type?: string;
}

type RenderableAssetRecord = {
    url?: unknown;
    path?: unknown;
};

export type RenderableAssetSource = string | RenderableAssetRecord | Asset | AnyMediaResource | null | undefined;

export interface UseRenderableAssetUrlOptions<TSource = RenderableAssetSource> {
  /** Custom resolver function to convert asset source to URL */
  resolver?: (source: TSource) => Promise<string | null>;
}

export const isRenderableAssetUrl = (value: string): boolean =>
    isCanonicalRenderableAssetUrl(value);

export const sanitizeResolvedAssetUrl = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }
    const normalized = value.trim();
    return isCanonicalRenderableAssetUrl(normalized) ? normalized : null;
};

const readDirectRenderableAssetValue = (source: RenderableAssetSource): string | null => {
    if (!source || typeof source !== 'object') {
        return null;
    }

    const directValue =
        ('url' in source && typeof source.url === 'string' && source.url) ||
        ('path' in source && typeof source.path === 'string' && source.path) ||
        null;

    return sanitizeResolvedAssetUrl(directValue);
};

export const resolveRenderableAssetSourceUrl = async <
    TSource extends RenderableAssetSource = RenderableAssetSource
>(
    source: TSource,
    resolver?: (source: TSource) => Promise<string | null>
): Promise<string | null> => {
    if (!source) {
        return null;
    }

    if (typeof source === 'string') {
        const directRenderableUrl = sanitizeResolvedAssetUrl(source);
        if (directRenderableUrl) {
            return directRenderableUrl;
        }
    }

    if (resolver) {
        const resolved = sanitizeResolvedAssetUrl(await resolver(source));
        if (resolved) {
            return resolved;
        }
    }

    return readDirectRenderableAssetValue(source);
};

/**
 * Hook to resolve an asset reference (path, object, or resource) to a renderable URL.
 * Only directly renderable URLs are returned without a resolver.
 * 
 * @param source - The asset source (path string, Asset object, or AnyMediaResource)
 * @param options - Optional configuration including a custom resolver
 * @returns Object containing resolved url, loading state, and error
 * 
 * @example
 * // With default behavior (returns URLs directly)
 * const { url, loading } = useRenderableAssetUrl('https://example.com/image.png');
 * 
 * @example
 * // With custom resolver
 * const { url, loading } = useRenderableAssetUrl(assetId, {
 *   resolver: async (source) => assetService.resolveAssetUrl(source) 
 * });
 */
export const useRenderableAssetUrl = <
    TSource extends RenderableAssetSource = RenderableAssetSource
>(
    source: TSource,
    options?: UseRenderableAssetUrlOptions<TSource>
) => {
    const [url, setUrl] = useState<string | null>(null);
    // Initialize loading to true if source exists to prevent flash of unresolved content
    const [loading, setLoading] = useState<boolean>(!!source);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const resolve = async () => {
            if (!source) {
                if (isMounted) {
                    setUrl(null);
                    setLoading(false);
                }
                return;
            }

            if (isMounted) {
                setLoading(true);
                setError(null);
            }

            try {
                const resolved = await resolveRenderableAssetSourceUrl(source, options?.resolver);

                if (isMounted) {
                    setUrl(resolved);
                }
            } catch (err: any) {
                console.warn("[useRenderableAssetUrl] Failed to resolve:", source);
                if (isMounted) {
                    setError(err);
                    setUrl(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        resolve();

        return () => { isMounted = false; };
    }, [source, options?.resolver]); 

    return { url, loading, error };
};
