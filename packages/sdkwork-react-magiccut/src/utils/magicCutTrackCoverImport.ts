import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/react-assets';

export interface MagicCutTrackCoverUpload {
  assetId: string;
  url: string;
}

interface UploadLike {
  name: string;
  data: Uint8Array;
}

const resolveImportedTrackCover = async (
  uploaded: {
    id: string;
    path?: string;
  },
  fallbackUrl: string
): Promise<MagicCutTrackCoverUpload> => {
  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    fallbackUrl;

  return {
    assetId: uploaded.id,
    url: resolvedUrl,
  };
};

export const importMagicCutTrackCoverFile = async (
  file: UploadLike
): Promise<MagicCutTrackCoverUpload> => {
  const uploaded = await importAssetBySdk(
    {
      name: file.name,
      data: file.data,
    },
    'image',
    { domain: 'magiccut' }
  );

  return resolveImportedTrackCover(uploaded, '');
};

export const importMagicCutTrackCoverFromUrl = async (
  sourceUrl: string,
  fileName = `magiccut_track_cover_${Date.now()}.png`
): Promise<MagicCutTrackCoverUpload> => {
  const uploaded = await importAssetFromUrlBySdk(
    sourceUrl,
    'image',
    {
      name: fileName,
      domain: 'magiccut',
    }
  );

  return resolveImportedTrackCover(uploaded, sourceUrl);
};
