import {
  assetBusinessFacade,
  assetCenterService,
  resolveAssetUrlByAssetIdFirst,
  mapUnifiedAssetToAnyAsset,
  readWorkspaceScope
} from '@sdkwork/react-assets';
import type { Asset } from '@sdkwork/react-commons';

type FilmImportType = 'image' | 'video' | 'audio' | 'text' | 'file';

export interface ImportedFilmAssetRef {
  assetId: string;
  url: string;
}

const tryExtractInlineData = async (source: string): Promise<Uint8Array | undefined> => {
  if (!source) {
    return undefined;
  }
  if (source.startsWith('data:')) {
    const comma = source.indexOf(',');
    if (comma < 0) {
      return undefined;
    }
    const base64 = source.slice(comma + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  if (source.startsWith('blob:')) {
    const response = await fetch(source);
    return new Uint8Array(await response.arrayBuffer());
  }
  return undefined;
};

const resolveFilmScope = (): { workspaceId: string; projectId?: string } => {
  const scope = readWorkspaceScope();
  return {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId
  };
};

export const importFilmAssetFromUrl = async (
  sourceUrl: string,
  name: string,
  type: FilmImportType,
  metadata: Record<string, unknown>
): Promise<ImportedFilmAssetRef> => {
  const inlineData = await tryExtractInlineData(sourceUrl);
  const imported = await assetBusinessFacade.importFilmAsset({
    scope: resolveFilmScope(),
    type,
    name,
    data: inlineData,
    remoteUrl: inlineData ? undefined : sourceUrl,
    metadata
  });
  const mapped = mapUnifiedAssetToAnyAsset(imported.asset);
  const resolvedUrl =
    mapped?.url ||
    mapped?.path ||
    (await assetCenterService.resolvePrimaryUrl(imported.asset.assetId));

  return {
    assetId: imported.asset.assetId,
    url: resolvedUrl
  };
};

export const importFilmAssetFromFile = async (
  file: File,
  type: FilmImportType,
  metadata: Record<string, unknown>
): Promise<ImportedFilmAssetRef> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const imported = await assetBusinessFacade.importFilmAsset({
    scope: resolveFilmScope(),
    type,
    name: file.name,
    data,
    metadata
  });
  const mapped = mapUnifiedAssetToAnyAsset(imported.asset);
  const resolvedUrl =
    mapped?.url ||
    mapped?.path ||
    (await assetCenterService.resolvePrimaryUrl(imported.asset.assetId));

  return {
    assetId: imported.asset.assetId,
    url: resolvedUrl
  };
};

export const resolveChosenAsset = async (asset: Asset): Promise<ImportedFilmAssetRef | null> => {
  if (!asset?.id) {
    return null;
  }
  const assetWithLocator = asset as Asset & {
    url?: string;
    remoteUrl?: string;
  };
  const resolved = await resolveAssetUrlByAssetIdFirst({
    id: asset.id,
    path: asset.path,
    url: assetWithLocator.remoteUrl || assetWithLocator.url
  });
  if (!resolved) {
    return null;
  }
  return { assetId: asset.id, url: resolved };
};
