import { createUuid } from '@sdkwork/magic-studio-types/entity';
import type { Asset } from '@sdkwork/magic-studio-types/assets';

export const createDocumentSelectionAsset = (
  sourceUrl: string
): Asset => {
  const transientUuid = createUuid();
  const now = Date.now();

  return {
    id: '',
    uuid: transientUuid,
    name: 'Image from Content',
    type: 'image',
    path: sourceUrl,
    size: 0,
    createdAt: now,
    updatedAt: now,
    origin: 'ai',
    metadata: {
      sourceUrl,
      transientSource: 'document-extracted-image',
    },
  };
};
