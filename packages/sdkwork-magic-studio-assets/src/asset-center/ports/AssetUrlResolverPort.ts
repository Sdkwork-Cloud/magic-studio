import type { AssetLocator } from '@sdkwork/magic-studio-types/asset-center';

export interface AssetUrlResolverPort {
  resolve(locator: AssetLocator): Promise<string>;
  revoke?(resolvedUrl: string): void;
}
