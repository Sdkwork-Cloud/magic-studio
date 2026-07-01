import { AssetCenterService } from '../application/AssetCenterService';
import { RuntimeAssetVfs } from './RuntimeAssetVfs';
import { CoreMediaAnalysisAdapter } from './CoreMediaAnalysisAdapter';
import { DefaultAssetUrlResolver } from './DefaultAssetUrlResolver';
import { JsonAssetIndexRepository } from './JsonAssetIndexRepository';
import {
  RemoteAssetIndexRepository,
  type RemoteAssetIndexRepositoryOptions,
} from './RemoteAssetIndexRepository';

export interface CreateDefaultAssetCenterRemoteIndexOptions
  extends RemoteAssetIndexRepositoryOptions {
  enabled?: boolean;
}

export interface CreateDefaultAssetCenterOptions {
  remoteIndex?: CreateDefaultAssetCenterRemoteIndexOptions;
}

export const createDefaultAssetCenter = (
  options: CreateDefaultAssetCenterOptions = {}
): AssetCenterService => {
  const vfsPort = new RuntimeAssetVfs();
  const useRemoteIndex = options.remoteIndex?.enabled ?? true;
  const { enabled: _enabled, ...remoteOptions } = options.remoteIndex || {};
  const indexPort = useRemoteIndex
    ? new RemoteAssetIndexRepository(remoteOptions)
    : new JsonAssetIndexRepository(vfsPort);
  const urlResolver = new DefaultAssetUrlResolver(vfsPort);
  const analyzer = new CoreMediaAnalysisAdapter();

  return new AssetCenterService({
    vfsPort,
    indexPort,
    urlResolver,
    analyzer,
  });
};
