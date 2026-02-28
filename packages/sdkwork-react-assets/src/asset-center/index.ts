export { AssetCenterService } from './application/AssetCenterService';
export { AssetBusinessFacade } from './application/AssetBusinessFacade';
export type {
  ScopedAssetScope,
  ScopedImportInput,
  ScopedQueryInput
} from './application/AssetBusinessFacade';
export {
  mapUnifiedAssetToAnyAsset,
  mapUnifiedAssetToAsset,
  mapUnifiedPageToAnyAssetPage,
  mapUnifiedPageToAssetPage,
  normalizeSpringPageRequest,
  readWorkspaceScope
} from './application/assetCenterAdapters';
export {
  resolveAssetUrlByAssetIdFirst,
  getAssetIdCandidates,
  getPrimaryAssetIdCandidate,
  getDirectLocatorCandidates,
  hasResolvableAssetReference,
  isAssetLocatorLike
} from './application/assetUrlResolver';
export {
  savePortalLaunchSession,
  readPortalLaunchSession,
  consumePortalLaunchSession,
  clearPortalLaunchSession
} from './application/portalLaunchSession';
export type {
  PortalLaunchTarget,
  PortalLaunchAttachmentType,
  PortalLaunchAttachmentRef,
  PortalLaunchSession,
  SavePortalLaunchSessionInput
} from './application/portalLaunchSession';
export { assetCenterService } from './assetCenter';
export { assetBusinessFacade } from './assetCenter';
export type {
  ImportAssetInput,
  RegisterExistingAssetInput,
  CreateAssetOptions,
  AssetMutationResult
} from './domain/assetCenter.domain';
export {
  ASSET_CENTER_PROTOCOL,
  ASSET_CENTER_MAX_PAGE_SIZE,
  ASSET_CENTER_DEFAULT_SORT,
  DOMAIN_ALLOWED_TYPES,
  buildAssetKey,
  buildUnifiedAssetPayload,
  normalizeTags,
  readUnifiedPayloadPrimary,
  mapContentKeyToMediaType
} from './domain/assetCenter.domain';
export {
  ASSET_CENTER_CATEGORIES,
  toAssetType,
  toContentKey,
  resolveDomainAssetTypes,
  resolveAcceptExtensionsByTypes,
  detectAssetTypeByFilename
} from './domain/assetCategory.domain';

export type { AssetVfsPort, AssetFileStat } from './ports/AssetVfsPort';
export type { AssetIndexPort } from './ports/AssetIndexPort';
export type { AssetUrlResolverPort } from './ports/AssetUrlResolverPort';
export type {
  AssetMediaAnalyzerPort,
  AssetMediaAnalysisResult
} from './ports/AssetMediaAnalyzerPort';

export { BrowserTauriAssetVfs } from './infrastructure/BrowserTauriAssetVfs';
export { DefaultAssetUrlResolver } from './infrastructure/DefaultAssetUrlResolver';
export { JsonAssetIndexRepository } from './infrastructure/JsonAssetIndexRepository';
export {
  RemoteAssetIndexRepository,
  type RemoteAssetQueryMode,
  type RemoteAssetIndexRepositoryOptions,
  type RemoteAssetIndexRepositoryEndpoints,
  REMOTE_ASSET_INDEX_DEFAULT_ENDPOINTS,
  SPRING_BOOT_ASSET_CENTER_ENDPOINTS,
  SPRING_BOOT_ASSET_CENTER_QUERY_MODE,
  createSpringBootAssetCenterEndpoints,
  createSpringBootAssetCenterRemoteOptions
} from './infrastructure/RemoteAssetIndexRepository';
export { NoopAssetMediaAnalyzer } from './infrastructure/NoopAssetMediaAnalyzer';
export { CoreMediaAnalysisAdapter } from './infrastructure/CoreMediaAnalysisAdapter';
export {
  createDefaultAssetCenter,
  type CreateDefaultAssetCenterOptions,
  type CreateDefaultAssetCenterRemoteIndexOptions
} from './infrastructure/createDefaultAssetCenter';
