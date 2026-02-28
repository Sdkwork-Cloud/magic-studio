import type { AssetLocator } from '@sdkwork/react-types';

export interface AssetUrlResolverPort {
  resolve(locator: AssetLocator): Promise<string>;
  revoke?(resolvedUrl: string): void;
}
