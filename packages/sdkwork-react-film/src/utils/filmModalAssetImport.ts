import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
  resolveAssetUrlByAssetIdFirst
} from '@sdkwork/react-assets';
import { inlineDataService } from '@sdkwork/react-core';
import type { Asset } from '@sdkwork/react-commons';

type FilmImportType = 'image' | 'video' | 'audio' | 'text' | 'file';

export interface ImportedFilmAssetRef {
  assetId: string;
  url: string;
}

export const importFilmAssetFromUrl = async (
  sourceUrl: string,
  name: string,
  type: FilmImportType,
  _metadata: Record<string, unknown>
): Promise<ImportedFilmAssetRef> => {
  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  const uploaded = inlineData
    ? await importAssetBySdk(
      {
        name,
        data: inlineData
      },
      type,
      { domain: 'film' }
    )
    : await importAssetFromUrlBySdk(
      sourceUrl,
      type,
      {
        name,
        domain: 'film'
      }
    );
  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    sourceUrl;

  return {
    assetId: uploaded.id,
    url: resolvedUrl
  };
};

export const importFilmAssetFromFile = async (
  file: File,
  type: FilmImportType,
  _metadata: Record<string, unknown>
): Promise<ImportedFilmAssetRef> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const uploaded = await importAssetBySdk(
    {
      name: file.name,
      data
    },
    type,
    { domain: 'film' }
  );
  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    '';

  return {
    assetId: uploaded.id,
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
