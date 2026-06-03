import {
  createUuid,
  matchesEntityKey,
  resolveEntityKey,
} from '@sdkwork/magic-studio-types/entity';

import type { InputAttachment } from './types';

export interface CreateInputAttachmentInput {
  id?: string | null;
  uuid?: string | null;
  assetId?: string | null;
  assetUuid?: string | null;
  name: string;
  url?: string;
  type: InputAttachment['type'];
  size?: number;
}

const normalizeValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirst = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const resolveInputAttachmentKey = (
  attachment: Pick<InputAttachment, 'id' | 'uuid'>
): string => resolveEntityKey(attachment);

export const matchesInputAttachmentKey = (
  attachment: Pick<InputAttachment, 'id' | 'uuid'>,
  key: string
): boolean => matchesEntityKey(attachment, key);

export const removeInputAttachmentByKey = <T extends Pick<InputAttachment, 'id' | 'uuid'>>(
  attachments: readonly T[],
  key: string
): T[] => attachments.filter((attachment) => !matchesInputAttachmentKey(attachment, key));

export const createInputAttachment = ({
  id,
  uuid,
  assetId,
  assetUuid,
  name,
  url,
  type,
  size,
}: CreateInputAttachmentInput): InputAttachment => {
  const normalizedId = normalizeValue(id);
  const normalizedUuid = normalizeValue(uuid);
  const normalizedAssetId = normalizeValue(assetId) || undefined;
  const normalizedAssetUuid = normalizeValue(assetUuid) || undefined;
  const canonicalUuid =
    pickFirst(normalizedUuid, normalizedAssetUuid, normalizedId) || createUuid();
  const persistedId =
    normalizedId && (normalizedUuid || normalizedAssetUuid)
      ? normalizedId
      : null;

  return {
    id: persistedId,
    uuid: canonicalUuid,
    assetId: normalizedAssetId,
    assetUuid: normalizedAssetUuid,
    name,
    url,
    type,
    size,
  };
};
