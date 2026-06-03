
import {
    isExplicitLocalAssetLocator,
    isLocalFilePath,
    isManagedAssetLocator,
    isRenderableAssetUrl,
} from '@sdkwork/magic-studio-assets/asset-center';
import { downloadService } from '@sdkwork/magic-studio-core/services';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';

/**
 * Returns the best synchronous render candidate for a media resource.
 * Priority:
 * 1. Memory Blob URL (from DownloadService cache - fast on Web)
 * 2. Canonical managed/local locator (assets://, file://, desktop://)
 * 3. Direct renderable URL (http/https/blob/data/asset:)
 * 4. Raw filesystem path (left unresolved for canonical asset resolution)
 * 5. Final string fallback
 *
 * Callers must still route unresolved locator/path candidates through the
 * canonical asset resolver instead of trying to interpret locator protocols
 * locally.
 */
export const getRobustResourceUrl = (resource: AnyMediaResource | undefined | null): string => {
    if (!resource) return '';
    const resourceKey = resolveEntityKey(resource);

    // 1. Check in-memory blob cache (Downloads/Hydrated Local Files)
    const localUrl = downloadService.getLocalUrl(resourceKey);
    if (localUrl) return localUrl;

    for (const candidate of [resource.path, resource.localFile?.path, resource.url]) {
        if (!candidate) {
            continue;
        }

        if (isManagedAssetLocator(candidate) || isExplicitLocalAssetLocator(candidate)) {
            return candidate;
        }

        if (isRenderableAssetUrl(candidate)) {
            return candidate;
        }

        if (isLocalFilePath(candidate)) {
            return candidate;
        }
    }

    // 5. Fallback
    return resource.path || resource.localFile?.path || resource.url || '';
};

/**
 * Checks whether a candidate still needs the canonical asset resolver before it
 * can be rendered safely.
 */
export const requiresCanonicalAssetUrlResolution = (url: string): boolean => {
    if (!url) return false;
    if (isManagedAssetLocator(url) || isExplicitLocalAssetLocator(url)) return true;
    if (isRenderableAssetUrl(url)) return false;
    return isLocalFilePath(url);
};

