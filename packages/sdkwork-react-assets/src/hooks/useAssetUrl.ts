import { useState, useEffect } from 'react';
import { AnyMediaResource } from '@sdkwork/react-commons';
import { resolveAssetUrlByAssetIdFirst } from '../asset-center/application/assetUrlResolver';

export interface Asset {
  id: string;
  path: string;
  url?: string;
  type?: string;
}

type AssetSource = string | Asset | AnyMediaResource | null | undefined;

export interface UseAssetUrlOptions {
  /** Custom resolver function to convert asset source to URL */
  resolver?: (source: AssetSource) => Promise<string | null>;
}

const INTERNAL_ASSET_PROTOCOL = 'assets://';

const isRenderableAssetUrl = (value: string): boolean => {
    const isInternal = value.startsWith(INTERNAL_ASSET_PROTOCOL);

    return (
        value.startsWith('http:') ||
        value.startsWith('https:') ||
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        (value.startsWith('asset:') && !isInternal) ||
        value.startsWith('file://')
    );
};

const sanitizeResolvedAssetUrl = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }
    return value.startsWith(INTERNAL_ASSET_PROTOCOL) ? null : value;
};

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
            const resolved = sanitizeResolvedAssetUrl(await candidateResolver(source));
            if (resolved) {
                return resolved;
            }
        } catch {
            // Keep local-first URL resolution resilient when a caller-provided resolver fails.
        }
    }

    if (typeof source === 'object' && source !== null) {
        const directValue =
            ('url' in source && typeof source.url === 'string' && source.url) ||
            ('path' in source && typeof source.path === 'string' && source.path) ||
            null;

        if (directValue && isRenderableAssetUrl(directValue)) {
            return directValue;
        }
    }

    return null;
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
export const useAssetUrl = (source: AssetSource, options?: UseAssetUrlOptions) => {
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
                const resolved = await resolveAssetSourceUrl(source, options?.resolver);

                if (isMounted) {
                    setUrl(resolved);
                }
            } catch (err: unknown) {
                console.warn("[useAssetUrl] Failed to resolve:", source);
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Failed to resolve asset URL'));
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
