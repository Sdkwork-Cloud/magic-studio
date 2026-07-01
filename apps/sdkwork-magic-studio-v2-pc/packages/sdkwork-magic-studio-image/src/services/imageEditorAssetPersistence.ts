import { inlineDataService } from '@sdkwork/magic-studio-core/services';
import { isCanonicalMagicStudioAssetReference as isStableImageReference } from '@sdkwork/magic-studio-core/storage';
import {
  readAssetRecordMetadataValue,
  resolveAssetRecordClientUuid,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';

import {
  createGeneratedImageResult,
  resolveGeneratedImageResultThumbnailUrl,
  resolveGeneratedImageResultUrl,
  type GeneratedImageResult,
} from '../entities';

export interface PersistImageEditorResultInput {
  source: GeneratedImageResult;
  name: string;
}

export const persistImageEditorResult = async ({
  source,
  name,
}: PersistImageEditorResultInput): Promise<GeneratedImageResult> => {
  const sourceUrl = resolveGeneratedImageResultUrl(source);
  if (!sourceUrl) {
    throw new Error('Image editor result is missing a delivery url');
  }

  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  const uploaded = inlineData
    ? await importAssetBySdk(
        {
          name,
          data: inlineData,
        },
        'image',
        { domain: 'image-studio' }
      )
    : await importAssetFromUrlBySdk(
        sourceUrl,
        'image',
        {
          name,
          domain: 'image-studio',
        }
      );
  const runtimeUuid = resolveAssetRecordClientUuid(uploaded);
  const assetUuid = readAssetRecordMetadataValue(uploaded, 'assetUuid') || undefined;
  const resolvedUrl = (await resolveAssetPrimaryUrlBySdk(uploaded.id)) || uploaded.path || sourceUrl;
  const canonicalPath =
    (isStableImageReference(uploaded.path) ? uploaded.path : '') ||
    resolvedUrl ||
    uploaded.path ||
    sourceUrl;
  const thumbnailUrl = resolveGeneratedImageResultThumbnailUrl(source);

  return createGeneratedImageResult({
    uuid: runtimeUuid,
    assetId: uploaded.id,
    assetUuid,
    resource: {
      id: null,
      uuid: runtimeUuid,
      assetId: uploaded.id,
      assetUuid,
      url: resolvedUrl,
      path: canonicalPath,
      width: source.width,
      height: source.height,
      prompt: source.prompt,
      name,
    },
    coverResource: thumbnailUrl
      ? {
          id: null,
          url: thumbnailUrl,
          width: source.coverResource?.width,
          height: source.coverResource?.height,
          name: `${name}-cover`,
        }
      : undefined,
    prompt: source.prompt,
    negativePrompt: source.negativePrompt,
    width: source.width,
    height: source.height,
  });
};
