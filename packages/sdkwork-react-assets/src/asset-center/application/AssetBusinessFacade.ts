import type {
  AssetBusinessDomain,
  AssetCenterPageRequest,
  AssetScope,
  UnifiedAssetQueryResult
} from '@sdkwork/react-types';
import type { AssetMutationResult } from '../domain/assetCenter.domain';
import type { ImportAssetInput } from '../domain/assetCenter.domain';
import { AssetCenterService } from './AssetCenterService';

export type ScopedAssetScope = Omit<AssetScope, 'domain'>;

export type ScopedImportInput = Omit<ImportAssetInput, 'scope'> & {
  scope: ScopedAssetScope;
};

export type ScopedQueryInput = Omit<AssetCenterPageRequest, 'scope'> & {
  scope: ScopedAssetScope;
};

const withDomainScope = (
  scope: ScopedAssetScope,
  domain: AssetBusinessDomain
): AssetScope => ({
  workspaceId: scope.workspaceId,
  projectId: scope.projectId,
  collectionId: scope.collectionId,
  domain
});

const withDomainQuery = (
  query: ScopedQueryInput,
  domain: AssetBusinessDomain
): AssetCenterPageRequest => ({
  ...query,
  scope: withDomainScope(query.scope, domain)
});

const withDomainImport = (
  input: ScopedImportInput,
  domain: AssetBusinessDomain
): ImportAssetInput => ({
  ...input,
  scope: withDomainScope(input.scope, domain)
});

export class AssetBusinessFacade {
  constructor(private readonly assetCenter: AssetCenterService) {}

  queryByDomain(
    domain: AssetBusinessDomain,
    query: ScopedQueryInput
  ): Promise<UnifiedAssetQueryResult> {
    return this.assetCenter.query(withDomainQuery(query, domain));
  }

  importByDomain(
    domain: AssetBusinessDomain,
    input: ScopedImportInput
  ): Promise<AssetMutationResult> {
    return this.assetCenter.importAsset(withDomainImport(input, domain));
  }

  queryAssetCenter(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('asset-center', query);
  }

  queryNotes(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('notes', query);
  }

  queryCanvas(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('canvas', query);
  }

  queryImageStudio(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('image-studio', query);
  }

  queryVideoStudio(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('video-studio', query);
  }

  queryAudioStudio(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('audio-studio', query);
  }

  queryMusic(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('music', query);
  }

  queryVoiceSpeaker(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('voice-speaker', query);
  }

  queryMagiccut(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('magiccut', query);
  }

  queryFilm(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('film', query);
  }

  queryPortalVideo(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('portal-video', query);
  }

  queryCharacter(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('character', query);
  }

  querySfx(query: ScopedQueryInput): Promise<UnifiedAssetQueryResult> {
    return this.queryByDomain('sfx', query);
  }

  importAssetCenterAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('asset-center', input);
  }

  importNotesAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('notes', input);
  }

  importCanvasAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('canvas', input);
  }

  importImageStudioAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('image-studio', input);
  }

  importVideoStudioAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('video-studio', input);
  }

  importAudioStudioAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('audio-studio', input);
  }

  importMusicAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('music', input);
  }

  importVoiceSpeakerAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('voice-speaker', input);
  }

  importMagiccutAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('magiccut', input);
  }

  importFilmAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('film', input);
  }

  importPortalVideoAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('portal-video', input);
  }

  importCharacterAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('character', input);
  }

  importSfxAsset(input: ScopedImportInput): Promise<AssetMutationResult> {
    return this.importByDomain('sfx', input);
  }
}
