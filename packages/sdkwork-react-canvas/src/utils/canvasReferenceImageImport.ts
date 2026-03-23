import {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/react-assets';

interface UploadLike {
  name: string;
  data: Uint8Array;
}

export const importCanvasReferenceImageFile = async (
  file: UploadLike
): Promise<string> => {
  const uploaded = await importAssetBySdk(
    {
      name: file.name,
      data: file.data,
    },
    'image',
    { domain: 'canvas' }
  );

  return (
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    ''
  );
};
