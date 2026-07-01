import { readAssetRecordMetadataValue } from '@sdkwork/magic-studio-commons/utils/assetIdentity';

interface UploadedAssetLike {
  id?: string | null;
  metadata?: Record<string, unknown>;
}

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const createNoteUploadedAssetAttrs = (
  uploaded: UploadedAssetLike,
  src: string
): {
  src: string;
  assetId: string | null;
  assetUuid: string | null;
} => ({
  src,
  assetId: normalizeOptionalString(uploaded.id),
  assetUuid: normalizeOptionalString(
    readAssetRecordMetadataValue(uploaded, 'assetUuid')
  ),
});
