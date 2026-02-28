import { AssetCenterService } from '../application/AssetCenterService';
import { BrowserTauriAssetVfs } from './BrowserTauriAssetVfs';
import { CoreMediaAnalysisAdapter } from './CoreMediaAnalysisAdapter';
import { DefaultAssetUrlResolver } from './DefaultAssetUrlResolver';
import { JsonAssetIndexRepository } from './JsonAssetIndexRepository';
import {
  RemoteAssetIndexRepository,
  createSpringBootAssetCenterRemoteOptions,
  type RemoteAssetIndexRepositoryOptions
} from './RemoteAssetIndexRepository';

const readGlobalRemoteBaseUrl = (): string | undefined => {
  const maybeGlobal = globalThis as { __SDKWORK_ASSET_CENTER_REMOTE_BASE_URL__?: unknown };
  const value = maybeGlobal.__SDKWORK_ASSET_CENTER_REMOTE_BASE_URL__;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return value.trim();
};

const readGlobalRemoteSpringBootEnabled = (): boolean => {
  const maybeGlobal = globalThis as { __SDKWORK_ASSET_CENTER_REMOTE_SPRING_BOOT__?: unknown };
  return maybeGlobal.__SDKWORK_ASSET_CENTER_REMOTE_SPRING_BOOT__ === true;
};

const readGlobalRemoteSpringBootBasePath = (): string | undefined => {
  const maybeGlobal = globalThis as { __SDKWORK_ASSET_CENTER_REMOTE_SPRING_BOOT_BASE_PATH__?: unknown };
  const value = maybeGlobal.__SDKWORK_ASSET_CENTER_REMOTE_SPRING_BOOT_BASE_PATH__;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return value.trim();
};

export interface CreateDefaultAssetCenterRemoteIndexOptions
  extends Omit<RemoteAssetIndexRepositoryOptions, 'baseUrl'> {
  baseUrl?: string;
  springBoot?: boolean;
  springBootBasePath?: string;
}

export interface CreateDefaultAssetCenterOptions {
  remoteIndex?: CreateDefaultAssetCenterRemoteIndexOptions;
}

export const createDefaultAssetCenter = (
  options: CreateDefaultAssetCenterOptions = {}
): AssetCenterService => {
  const vfsPort = new BrowserTauriAssetVfs();
  const remoteBaseUrl = options.remoteIndex?.baseUrl || readGlobalRemoteBaseUrl();
  const remoteSpringBoot = options.remoteIndex?.springBoot ?? readGlobalRemoteSpringBootEnabled();
  const remoteSpringBootBasePath = options.remoteIndex?.springBootBasePath || readGlobalRemoteSpringBootBasePath();
  const {
    springBoot: _ignoredSpringBoot,
    springBootBasePath: _ignoredSpringBootBasePath,
    baseUrl: _ignoredBaseUrl,
    ...remoteOverrides
  } = options.remoteIndex || {};
  const remotePreset = remoteBaseUrl && remoteSpringBoot
    ? createSpringBootAssetCenterRemoteOptions(remoteBaseUrl, remoteSpringBootBasePath)
    : null;
  const indexPort = remoteBaseUrl
    ? new RemoteAssetIndexRepository({
        ...(remotePreset || {}),
        ...remoteOverrides,
        baseUrl: remoteBaseUrl
      })
    : new JsonAssetIndexRepository(vfsPort);
  const urlResolver = new DefaultAssetUrlResolver(vfsPort);
  const analyzer = new CoreMediaAnalysisAdapter();

  return new AssetCenterService({
    vfsPort,
    indexPort,
    urlResolver,
    analyzer
  });
};
