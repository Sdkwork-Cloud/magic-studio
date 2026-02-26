
import { AnyMediaResource } from '@sdkwork/react-commons';
import { downloadService } from '@sdkwork/react-core';
import { platform } from '@sdkwork/react-core';
;

/**
 * Robustly resolves a usable URL for a media resource.
 * Priority:
 * 1. Memory Blob URL (from DownloadService cache - fast on Web)
 * 2. Remote URL (http/https - direct if online)
 * 3. Asset Protocol Path (assets:// - via AssetService)
 * 4. Local File Path (Desktop - converted to asset:// protocol)
 * 5. Raw URL (fallback)
 */
export const getRobustResourceUrl = (resource: AnyMediaResource | undefined | null): string => {
    if (!resource) return '';
    
    // 1. Check in-memory blob cache (Downloads/Hydrated Local Files)
    const localUrl = downloadService.getLocalUrl(resource.id);
    if (localUrl) return localUrl;
    
    // 2. Check for Virtual Path (assets://)
    if (resource.path && resource.path.startsWith('assets://')) {
        // We cannot resolve async here directly as this is a sync util.
        // Return path so component can resolve it via useEffect.
        // HOWEVER, if running on Desktop, we might be able to convert it if we know the root.
        // But assetService manages root.
        
        // Return it as is, component logic (MagicCutClip) handles async resolution.
        return resource.path;
    }
    
    // 3. Check Remote URL
    if (resource.url && resource.url.startsWith('http')) return resource.url;
    
    // 4. Check Local File Path (Desktop / Mock)
    const filePath = resource.path || resource.localFile?.path;
    
    if (filePath) {
        // If it's already an asset protocol URL or blob, return as is
        if (filePath.startsWith('asset:') || filePath.startsWith('blob:')) return filePath;

        if (platform.getPlatform() === 'desktop') {
            try {
                return platform.convertFileSrc(filePath);
            } catch (e) {
                console.warn("Failed to convert file src", e);
            }
        }
        return filePath;
    }
    
    // 5. Fallback
    return resource.url || '';
};

/**
 * Checks if a URL string looks like a VFS or Asset path that needs hydration or conversion.
 */
export const isVfsPath = (url: string): boolean => {
    if (!url) return false;
    // 'assets://' is definitely a VFS path
    if (url.startsWith('assets://')) return true;
    
    // Standard checks
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('asset:')) return false;
    
    // If it starts with / (root) or a drive letter (C:), treat as VFS path
    return url.startsWith('/') || /^[a-zA-Z]:/.test(url) || url.startsWith('./') || url.startsWith('../');
};

