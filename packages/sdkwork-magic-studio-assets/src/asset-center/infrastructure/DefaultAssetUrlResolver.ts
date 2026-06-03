import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import {
  isMagicStudioAssetPath,
  isRenderableAssetUrl,
  resolveRuntimeMagicStudioAssetUrl,
} from '@sdkwork/magic-studio-core/storage';
import type { AssetLocator } from '@sdkwork/magic-studio-types/asset-center';
import type { AssetUrlResolverPort } from '../ports/AssetUrlResolverPort';
import type { AssetVfsPort } from '../ports/AssetVfsPort';
import {
  isExplicitLocalAssetLocator,
  stripExplicitLocalAssetLocatorProtocol,
} from '../domain/assetLocator';

export class DefaultAssetUrlResolver implements AssetUrlResolverPort {
  private cache = new Map<string, string>();

  constructor(private readonly vfsPort: AssetVfsPort) {}

  async resolve(locator: AssetLocator): Promise<string> {
    const cacheKey = locator.uri || locator.path || locator.url || '';
    if (cacheKey && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const url = locator.url || locator.uri || '';
    if (isRenderableAssetUrl(url)) {
      this.cache.set(cacheKey, url);
      return url;
    }

    const absolutePath =
      (locator.path
        ? (isExplicitLocalAssetLocator(locator.path)
            ? stripExplicitLocalAssetLocatorProtocol(locator.path)
            : locator.path)
        : undefined) ||
      (isMagicStudioAssetPath(locator.uri)
        ? await this.vfsPort.toAbsolutePath(locator.uri)
        : isExplicitLocalAssetLocator(locator.uri)
          ? stripExplicitLocalAssetLocatorProtocol(locator.uri)
          : locator.uri);

    const resolved = await resolveRuntimeMagicStudioAssetUrl(
      getPlatformRuntime(),
      absolutePath,
    );
    this.cache.set(cacheKey, resolved);
    return resolved;
  }

  revoke(resolvedUrl: string): void {
    if (resolvedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(resolvedUrl);
    }
  }
}
