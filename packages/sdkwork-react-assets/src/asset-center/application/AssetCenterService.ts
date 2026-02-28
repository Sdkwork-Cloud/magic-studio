import {
  generateUUID,
  pathUtils
} from '@sdkwork/react-commons';
import {
  LIBRARY_SUBDIRS
} from '@sdkwork/react-fs';
import type {
  AssetCenterStats,
  AssetCenterPageRequest,
  AssetContentKey,
  AssetLifecycleStatus,
  AssetStorageMode,
  AssetLocator,
  AssetAtomicMediaResource,
  UnifiedAssetPayload,
  UnifiedAssetQueryResult,
  UnifiedDigitalAsset
} from '@sdkwork/react-types';
import {
  ASSET_CENTER_MAX_PAGE_SIZE,
  DOMAIN_ALLOWED_TYPES,
  buildAssetKey,
  buildUnifiedAssetPayload,
  normalizeTags,
  mapContentKeyToMediaType,
  readUnifiedPayloadPrimary,
  type AssetMutationResult,
  type CreateAssetOptions,
  type ImportAssetInput,
  type RegisterExistingAssetInput
} from '../domain/assetCenter.domain';
import type { AssetIndexPort } from '../ports/AssetIndexPort';
import type { AssetMediaAnalyzerPort } from '../ports/AssetMediaAnalyzerPort';
import type { AssetUrlResolverPort } from '../ports/AssetUrlResolverPort';
import type { AssetVfsPort } from '../ports/AssetVfsPort';

const DEFAULT_EXTENSION_BY_TYPE: Record<AssetContentKey, string> = {
  image: '.png',
  video: '.mp4',
  audio: '.wav',
  music: '.mp3',
  voice: '.wav',
  text: '.txt',
  character: '.json',
  digitalHuman: '.json',
  model3d: '.glb',
  lottie: '.json',
  file: '.bin',
  effect: '.json',
  transition: '.json',
  subtitle: '.srt',
  sfx: '.wav'
};

export interface AssetCenterServiceDeps {
  vfsPort: AssetVfsPort;
  indexPort: AssetIndexPort;
  urlResolver: AssetUrlResolverPort;
  analyzer: AssetMediaAnalyzerPort;
  options?: CreateAssetOptions;
}

export class AssetCenterService {
  private readonly now: () => string;
  private readonly idGenerator: () => string;
  private initialized = false;

  constructor(private readonly deps: AssetCenterServiceDeps) {
    this.now = deps.options?.now || (() => new Date().toISOString());
    this.idGenerator = deps.options?.idGenerator || (() => generateUUID());
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.deps.indexPort.initialize();
    this.initialized = true;
  }

  async importAsset(input: ImportAssetInput): Promise<AssetMutationResult> {
    await this.initialize();
    this.validateImportInput(input);
    const timestamps = this.now();
    const assetId = this.idGenerator();
    const resourceId = this.idGenerator();
    const extension = this.resolveExtension(input.name, input.type);
    const locator = await this.persistPrimaryContent(resourceId, extension, input);
    const resolvedUrl = await this.deps.urlResolver.resolve(locator);

    let mediaAnalysis: { metadata?: Record<string, unknown> } = {};
    try {
      mediaAnalysis = await this.deps.analyzer.analyze(resolvedUrl, input.type);
    } catch (error) {
      console.warn('[AssetCenterService] Media analysis failed, continue import', error);
    }
    const metadata: Record<string, unknown> = {
      ...(input.metadata || {}),
      ...(mediaAnalysis.metadata || {})
    };

    const size = await this.resolveResourceSize(locator);
    const primaryResource: AssetAtomicMediaResource = {
      id: resourceId,
      uuid: resourceId,
      name: input.name,
      type: mapContentKeyToMediaType(input.type),
      url: locator.url,
      path: locator.uri,
      extension,
      size,
      createdAt: timestamps,
      updatedAt: timestamps,
      metadata
    };

    const payload = this.createPayload(input.type, primaryResource, input.additionalAssets || []);
    const storageMode = input.remoteUrl && !input.data && !input.sourcePath ? 'remote-url' : this.deps.vfsPort.getMode();

    const asset: UnifiedDigitalAsset = {
      id: assetId,
      uuid: assetId,
      assetId,
      key: buildAssetKey(input.scope, assetId),
      title: input.name,
      description: typeof metadata.description === 'string' ? metadata.description : undefined,
      primaryType: input.type,
      payload,
      scope: input.scope,
      storage: {
        mode: storageMode,
        primary: locator,
        cacheable: storageMode !== 'remote-url'
      },
      status: input.status || 'ready',
      tags: normalizeTags(input.tags),
      labels: normalizeTags(input.labels),
      isFavorite: false,
      versionInfo: {
        version: 1
      },
      references: input.references,
      metadata,
      createdAt: timestamps,
      updatedAt: timestamps
    };

    await this.deps.indexPort.save(asset);
    return { asset, primaryLocator: locator };
  }

  async registerExistingAsset(input: RegisterExistingAssetInput): Promise<UnifiedDigitalAsset> {
    await this.initialize();
    this.validateRegisterInput(input);
    const timestamps = this.now();
    const assetId = input.assetId || this.idGenerator();
    const resourceId = this.idGenerator();
    const extension = this.resolveExtension(input.name, input.type);
    const metadata: Record<string, unknown> = {
      ...(input.metadata || {})
    };

    const primaryResource: AssetAtomicMediaResource = {
      id: resourceId,
      uuid: resourceId,
      name: input.name,
      type: mapContentKeyToMediaType(input.type),
      url: input.locator.url || input.locator.uri,
      path: input.locator.uri,
      extension,
      size: input.size,
      createdAt: input.createdAt || timestamps,
      updatedAt: input.updatedAt || timestamps,
      metadata
    };

    const payload = this.createPayload(input.type, primaryResource, input.additionalAssets || []);

    const asset: UnifiedDigitalAsset = {
      id: assetId,
      uuid: assetId,
      assetId,
      key: buildAssetKey(input.scope, assetId),
      title: input.name,
      description: typeof metadata.description === 'string' ? metadata.description : undefined,
      primaryType: input.type,
      payload,
      scope: input.scope,
      storage: {
        mode: this.resolveStorageMode(input.locator),
        primary: input.locator,
        cacheable: input.locator.protocol !== 'http' && input.locator.protocol !== 'https'
      },
      status: input.status || 'ready',
      tags: normalizeTags(input.tags),
      labels: normalizeTags(input.labels),
      isFavorite: false,
      versionInfo: {
        version: 1
      },
      references: input.references,
      metadata,
      createdAt: input.createdAt || timestamps,
      updatedAt: input.updatedAt || timestamps
    };

    await this.deps.indexPort.save(asset);
    return asset;
  }

  async query(input: AssetCenterPageRequest): Promise<UnifiedAssetQueryResult> {
    await this.initialize();
    const normalizedSort = input.sort
      ?.map((item) => item.trim())
      .filter((item): item is string => item.length > 0);

    const normalized: AssetCenterPageRequest = {
      page: Math.max(0, input.page),
      size: Math.min(ASSET_CENTER_MAX_PAGE_SIZE, Math.max(1, input.size)),
      sort: normalizedSort && normalizedSort.length > 0 ? normalizedSort : undefined,
      keyword: input.keyword,
      includeDeleted: input.includeDeleted,
      scope: input.scope,
      origins: input.origins,
      status: input.status,
      tags: input.tags,
      types: input.types,
      reference: input.reference
    };
    return this.deps.indexPort.query(normalized);
  }

  async findById(assetId: string): Promise<UnifiedDigitalAsset | null> {
    await this.initialize();
    return this.deps.indexPort.findById(assetId);
  }

  async resolvePrimaryUrl(assetId: string): Promise<string> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return '';
    }

    const primary = this.pickPrimaryResource(asset);
    if (!primary) {
      return '';
    }

    const locator = this.resolveLocatorFromResource(primary, asset.storage.primary);
    return this.deps.urlResolver.resolve(locator);
  }

  async resolveLocatorUrl(locator: string): Promise<string> {
    if (!locator) {
      return '';
    }
    if (
      locator.startsWith('http://') ||
      locator.startsWith('https://') ||
      locator.startsWith('blob:') ||
      locator.startsWith('data:') ||
      locator.startsWith('asset:') ||
      locator.startsWith('file://')
    ) {
      return locator;
    }

    if (locator.startsWith('assets://')) {
      return this.deps.urlResolver.resolve({
        protocol: 'assets',
        uri: locator
      });
    }

    return this.deps.urlResolver.resolve({
      protocol: 'file',
      uri: locator,
      path: locator
    });
  }

  async attachAssets(assetId: string, resources: AssetAtomicMediaResource[]): Promise<UnifiedDigitalAsset | null> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return null;
    }
    const primary = this.pickPrimaryResource(asset);
    const baseAssets =
      asset.payload.assets.length > 0
        ? asset.payload.assets
        : primary
          ? [primary]
          : [];
    const mergedAssets = this.dedupeResources([...baseAssets, ...resources]);
    const next: UnifiedDigitalAsset = {
      ...asset,
      payload: {
        ...asset.payload,
        assets: mergedAssets
      },
      updatedAt: this.now()
    };
    await this.deps.indexPort.save(next);
    return next;
  }

  async setStatus(assetId: string, status: AssetLifecycleStatus): Promise<UnifiedDigitalAsset | null> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return null;
    }
    const next: UnifiedDigitalAsset = {
      ...asset,
      status,
      updatedAt: this.now()
    };
    await this.deps.indexPort.save(next);
    return next;
  }

  async setFavorite(assetId: string, isFavorite: boolean): Promise<UnifiedDigitalAsset | null> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return null;
    }
    const next: UnifiedDigitalAsset = {
      ...asset,
      isFavorite,
      updatedAt: this.now()
    };
    await this.deps.indexPort.save(next);
    return next;
  }

  async renameAsset(assetId: string, title: string): Promise<UnifiedDigitalAsset | null> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return null;
    }
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      throw new Error('Asset rename failed: title is required');
    }

    const now = this.now();
    const primary = this.pickPrimaryResource(asset);
    let nextPayload: UnifiedAssetPayload = {
      ...asset.payload
    };

    if (primary) {
      const renamedPrimary: AssetAtomicMediaResource = {
        ...primary,
        name: normalizedTitle,
        updatedAt: now
      };
      const additionalAssets = asset.payload.assets.filter((item) => item.id !== renamedPrimary.id);
      nextPayload = this.createPayload(asset.primaryType, renamedPrimary, additionalAssets);
    }

    const next: UnifiedDigitalAsset = {
      ...asset,
      title: normalizedTitle,
      payload: nextPayload,
      metadata: {
        ...(asset.metadata || {}),
        originalName: asset.title
      },
      updatedAt: now
    };
    await this.deps.indexPort.save(next);
    return next;
  }

  async bindReference(assetId: string, reference: NonNullable<ImportAssetInput['references']>[number]): Promise<UnifiedDigitalAsset | null> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return null;
    }
    const current = asset.references || [];
    const exists = current.some(
      (item) =>
        item.domain === reference.domain &&
        item.entityType === reference.entityType &&
        item.entityId === reference.entityId &&
        item.relation === reference.relation &&
        item.slot === reference.slot
    );
    const next: UnifiedDigitalAsset = {
      ...asset,
      references: exists ? current : [...current, reference],
      updatedAt: this.now()
    };
    await this.deps.indexPort.save(next);
    return next;
  }

  async stats(): Promise<AssetCenterStats> {
    await this.initialize();
    return this.deps.indexPort.count();
  }

  async deleteById(assetId: string): Promise<void> {
    const asset = await this.findById(assetId);
    if (!asset) {
      return;
    }

    const localPaths = new Set<string>();

    const collectLocator = async (locator: AssetLocator): Promise<void> => {
      const absolutePath = await this.resolveLocalAbsolutePath(locator);
      if (absolutePath) {
        localPaths.add(absolutePath);
      }
    };

    await collectLocator(asset.storage.primary);

    const primaryResource = this.pickPrimaryResource(asset);
    if (primaryResource) {
      const fromPrimary = this.resolveLocatorFromResource(primaryResource, asset.storage.primary);
      await collectLocator(fromPrimary);
    }

    for (const resource of asset.payload.assets) {
      const candidate = this.resolveLocatorFromResource(resource, asset.storage.primary);
      await collectLocator(candidate);
    }

    for (const absolutePath of localPaths) {
      if (await this.deps.vfsPort.exists(absolutePath)) {
        await this.deps.vfsPort.delete(absolutePath);
      }
    }

    await this.deps.indexPort.deleteById(assetId);
  }

  private resolveExtension(name: string, type: AssetContentKey): string {
    const ext = pathUtils.extname(name);
    if (ext && ext !== '.') {
      return ext.toLowerCase();
    }
    return DEFAULT_EXTENSION_BY_TYPE[type] || '.bin';
  }

  private createPayload(
    type: AssetContentKey,
    primary: AssetAtomicMediaResource,
    assets: AssetAtomicMediaResource[]
  ): UnifiedAssetPayload {
    const mergedAssets = assets.length > 0
      ? this.dedupeResources([primary, ...assets])
      : [];
    return buildUnifiedAssetPayload(type, primary, mergedAssets);
  }

  private async persistPrimaryContent(
    resourceId: string,
    extension: string,
    input: ImportAssetInput
  ): Promise<AssetLocator> {
    if (input.remoteUrl && !input.data && !input.sourcePath) {
      const protocol = input.remoteUrl.startsWith('https://') ? 'https' : 'http';
      return {
        protocol,
        uri: input.remoteUrl,
        url: input.remoteUrl
      };
    }

    const root = await this.deps.vfsPort.getLibraryRoot();
    const categoryDir = this.getSubdirByType(input.type);
    const targetDir = pathUtils.join(root, categoryDir);
    await this.deps.vfsPort.ensureDir(targetDir);

    const filename = `${resourceId}${extension}`;
    const absolutePath = pathUtils.join(targetDir, filename);

    if (input.sourcePath) {
      await this.deps.vfsPort.copyFile(input.sourcePath, absolutePath);
    } else if (input.data instanceof Blob) {
      await this.deps.vfsPort.writeBlob(absolutePath, input.data);
    } else if (input.data instanceof Uint8Array) {
      await this.deps.vfsPort.writeBinary(absolutePath, input.data);
    } else {
      throw new Error('Asset import requires data, sourcePath, or remoteUrl');
    }

    const virtualPath = await this.deps.vfsPort.toVirtualPath(absolutePath);
    return {
      protocol: 'assets',
      uri: virtualPath,
      path: absolutePath
    };
  }

  private async resolveResourceSize(locator: AssetLocator): Promise<number | undefined> {
    if (!locator.path) {
      return undefined;
    }
    try {
      const stat = await this.deps.vfsPort.stat(locator.path);
      return stat.size;
    } catch {
      return undefined;
    }
  }

  private pickPrimaryResource(asset: UnifiedDigitalAsset): AssetAtomicMediaResource | undefined {
    return readUnifiedPayloadPrimary(asset.payload, asset.primaryType);
  }

  private resolveLocatorFromResource(resource: AssetAtomicMediaResource, fallback: AssetLocator): AssetLocator {
    const candidate = resource.path || resource.url || fallback.uri;
    if (candidate.startsWith('http://')) {
      return { protocol: 'http', uri: candidate, url: candidate };
    }
    if (candidate.startsWith('https://')) {
      return { protocol: 'https', uri: candidate, url: candidate };
    }
    if (candidate.startsWith('assets://')) {
      return { protocol: 'assets', uri: candidate };
    }
    if (candidate.startsWith('file://')) {
      const path = candidate.replace(/^file:\/\//, '');
      return { protocol: 'file', uri: candidate, path };
    }
    if (candidate.startsWith('/') || candidate.startsWith('./') || candidate.startsWith('../') || /^[a-zA-Z]:\\/.test(candidate)) {
      return { protocol: 'file', uri: candidate, path: candidate };
    }
    if (resource.path && (resource.path.startsWith('asset:') || resource.path.startsWith('blob:') || resource.path.startsWith('data:'))) {
      return fallback;
    }
    return fallback;
  }

  private async resolveLocalAbsolutePath(locator: AssetLocator): Promise<string | null> {
    if (locator.protocol === 'http' || locator.protocol === 'https') {
      return null;
    }

    if (locator.protocol === 'assets') {
      return locator.path || this.deps.vfsPort.toAbsolutePath(locator.uri);
    }

    if (locator.path) {
      return locator.path;
    }

    if (locator.uri.startsWith('file://')) {
      return locator.uri.replace(/^file:\/\//, '');
    }

    if (locator.uri.startsWith('asset:') || locator.uri.startsWith('blob:') || locator.uri.startsWith('data:')) {
      return null;
    }

    return locator.uri;
  }

  private dedupeResources(resources: AssetAtomicMediaResource[]): AssetAtomicMediaResource[] {
    const result: AssetAtomicMediaResource[] = [];
    const seen = new Set<string>();

    for (const item of resources) {
      const key = item.id || item.uuid || item.path || item.url || `${item.type}:${item.name}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(item);
    }

    return result;
  }

  private getSubdirByType(type: AssetContentKey): string {
    switch (type) {
      case 'image':
        return LIBRARY_SUBDIRS.IMAGES;
      case 'video':
        return LIBRARY_SUBDIRS.VIDEO;
      case 'audio':
      case 'music':
      case 'voice':
      case 'sfx':
        return LIBRARY_SUBDIRS.AUDIO;
      case 'model3d':
      case 'digitalHuman':
        return LIBRARY_SUBDIRS.MODELS;
      default:
        return LIBRARY_SUBDIRS.DOWNLOADS;
    }
  }

  private resolveStorageMode(locator: AssetLocator): AssetStorageMode {
    if (locator.protocol === 'http' || locator.protocol === 'https') {
      return 'remote-url';
    }
    return this.deps.vfsPort.getMode();
  }

  private validateImportInput(input: ImportAssetInput): void {
    if (!input.scope.workspaceId || !input.scope.workspaceId.trim()) {
      throw new Error('Asset import failed: scope.workspaceId is required');
    }
    if (!input.scope.domain) {
      throw new Error('Asset import failed: scope.domain is required');
    }
    if (!input.name || !input.name.trim()) {
      throw new Error('Asset import failed: name is required');
    }
    const allowedTypes = DOMAIN_ALLOWED_TYPES[input.scope.domain];
    if (allowedTypes && !allowedTypes.includes(input.type)) {
      throw new Error(
        `Asset import failed: type "${input.type}" is not allowed in domain "${input.scope.domain}"`
      );
    }
    if (!input.data && !input.sourcePath && !input.remoteUrl) {
      throw new Error('Asset import failed: data, sourcePath, or remoteUrl is required');
    }
  }

  private validateRegisterInput(input: RegisterExistingAssetInput): void {
    if (!input.scope.workspaceId || !input.scope.workspaceId.trim()) {
      throw new Error('Asset register failed: scope.workspaceId is required');
    }
    if (!input.scope.domain) {
      throw new Error('Asset register failed: scope.domain is required');
    }
    if (!input.name || !input.name.trim()) {
      throw new Error('Asset register failed: name is required');
    }
    if (!input.locator || !input.locator.uri) {
      throw new Error('Asset register failed: locator.uri is required');
    }
    const allowedTypes = DOMAIN_ALLOWED_TYPES[input.scope.domain];
    if (allowedTypes && !allowedTypes.includes(input.type)) {
      throw new Error(
        `Asset register failed: type "${input.type}" is not allowed in domain "${input.scope.domain}"`
      );
    }
  }
}
