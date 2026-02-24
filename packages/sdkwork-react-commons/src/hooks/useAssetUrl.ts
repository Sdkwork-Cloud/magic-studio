import { useState, useEffect } from 'react';
import { AnyMediaResource } from '../types';

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
 *   resolver: async (source) => assetService.resolveAssetUrl(source) 
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

            // Quick check for string URLs that don't need resolution
            if (typeof source === 'string') {
                // Explicitly check for our internal protocol
                const isInternal = source.startsWith('assets://');
                
                // Allow valid renderable schemes
                const isRenderable = 
                    source.startsWith('http:') || 
                    source.startsWith('https:') || 
                    source.startsWith('data:') || 
                    source.startsWith('blob:') ||
                    (source.startsWith('asset:') && !isInternal); // 'asset:' (singular) is Tauri's protocol

                if (isRenderable) {
                     if (isMounted) {
                         setUrl(source);
                         setLoading(false);
                     }
                     return;
                }
            }

            try {
                let resolved: string | null = null;
                
                // Use custom resolver if provided
                if (options?.resolver) {
                    resolved = await options.resolver(source);
                } else {
                    // Default behavior: try to extract URL from object
                    if (typeof source === 'object' && source !== null) {
                        if ('url' in source && source.url) {
                            resolved = source.url;
                        } else if ('path' in source && source.path) {
                            resolved = source.path;
                        }
                    }
                }
                
                // Safety check: Ensure we never return the raw internal protocol as a result
                if (resolved && resolved.startsWith('assets://')) {
                    console.warn("[useAssetUrl] Resolved URL is still internal, forcing null:", resolved);
                    resolved = null; 
                }

                if (isMounted) {
                    setUrl(resolved);
                }
            } catch (err: any) {
                console.warn("[useAssetUrl] Failed to resolve:", source);
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
