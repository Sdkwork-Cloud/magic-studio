import type { PortalLaunchAttachmentRef } from '@sdkwork/magic-studio-types/asset-center';

import type { AssetUrlResolveSource } from './assetUrlResolver';

export interface PortalLaunchAttachmentIdentity {
  id: string | null;
  uuid: string;
  assetId: string | null;
  assetUuid: string | null;
}

export interface PortalLaunchResolvedAttachment
  extends PortalLaunchAttachmentIdentity {
  name: string;
  type: PortalLaunchAttachmentRef['type'];
  locator: string | null;
  content: string | null;
}

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirst = (...values: unknown[]): string | null => {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const resolvePortalLaunchAttachmentIdentity = (
  attachment: Partial<
    Pick<PortalLaunchAttachmentRef, 'id' | 'uuid' | 'assetId' | 'assetUuid'>
  >
): PortalLaunchAttachmentIdentity => {
  const attachmentId = normalizeOptionalString(attachment.id);
  const assetId = normalizeOptionalString(attachment.assetId);
  const assetUuid = normalizeOptionalString(attachment.assetUuid);
  const uuid = pickFirst(
    attachment.uuid,
    assetUuid,
    attachmentId,
    assetId
  );

  if (!uuid) {
    throw new Error('Portal launch attachment requires uuid or asset identity');
  }

  return {
    id: attachmentId,
    uuid,
    assetId,
    assetUuid,
  };
};

export const resolvePortalLaunchAttachmentRef = (
  attachment: Partial<PortalLaunchAttachmentRef>
): PortalLaunchResolvedAttachment => {
  const identity = resolvePortalLaunchAttachmentIdentity(attachment);
  const name = normalizeOptionalString(attachment.name) || identity.uuid;
  const locator = normalizeOptionalString(attachment.locator);
  const type = attachment.type;

  if (!type) {
    throw new Error('Portal launch attachment requires type');
  }

  return {
    ...identity,
    name,
    type,
    locator,
    content:
      type === 'script'
        ? normalizeOptionalString(attachment.content)
        : null,
  };
};

export const toPortalLaunchAttachmentAssetUrlSource = (
  attachment: Partial<PortalLaunchAttachmentRef> | PortalLaunchResolvedAttachment
): AssetUrlResolveSource => {
  const resolved =
    'locator' in attachment && 'name' in attachment && 'type' in attachment
      ? attachment
      : resolvePortalLaunchAttachmentRef(attachment);

  return {
    id: resolved.id || undefined,
    assetId: resolved.assetId || undefined,
    url: resolved.locator || undefined,
  };
};
