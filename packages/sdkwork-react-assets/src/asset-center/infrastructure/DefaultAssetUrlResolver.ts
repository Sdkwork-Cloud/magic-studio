import { platform } from '@sdkwork/react-core';
import type { AssetLocator } from '@sdkwork/react-types';
import type { AssetUrlResolverPort } from '../ports/AssetUrlResolverPort';
import type { AssetVfsPort } from '../ports/AssetVfsPort';

export class DefaultAssetUrlResolver implements AssetUrlResolverPort {
  private cache = new Map<string, string>();

  constructor(private readonly vfsPort: AssetVfsPort) {}

  async resolve(locator: AssetLocator): Promise<string> {
    const cacheKey = locator.uri || locator.path || locator.url || '';
    if (cacheKey && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const url = locator.url || locator.uri;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      this.cache.set(cacheKey, url);
      return url;
    }

    const absolutePath =
      locator.path ||
      (locator.uri.startsWith('assets://') ? await this.vfsPort.toAbsolutePath(locator.uri) : locator.uri);

    if (platform.getPlatform() === 'desktop') {
      const resolved = platform.convertFileSrc(absolutePath);
      this.cache.set(cacheKey, resolved);
      return resolved;
    }

    const blob = await this.vfsPort.readBlob(absolutePath);
    const objectUrl = URL.createObjectURL(blob);
    this.cache.set(cacheKey, objectUrl);
    return objectUrl;
  }

  revoke(resolvedUrl: string): void {
    if (resolvedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(resolvedUrl);
    }
  }
}
