import type {
  DriveUploaderClient,
  DriveUploaderProfile,
  DriveUploaderUploadResult,
  SdkworkDriveAppClient,
} from '@sdkwork/drive-app-sdk';

const DEFAULT_CONTENT_TYPE = 'application/octet-stream';
const DEFAULT_APP_ID = 'magic-studio';
const DEFAULT_APP_RESOURCE_TYPE = 'magic-studio-upload';
const DEFAULT_SCENE = 'magic_studio_upload';
const DEFAULT_SOURCE = 'magic-studio-core';

type LegacyUploadKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
type UploadClientLike = {
  uploader?: Pick<DriveUploaderClient, 'uploadByProfile'>;
} | Pick<SdkworkDriveAppClient, 'uploader'>;

export interface UploadViaPresignedUrlInput {
  file: Blob | Uint8Array | ArrayBuffer | ArrayBufferView;
  fileName: string;
  contentType?: string;
  folderId?: string | number;
  path?: string;
  type?: string;
  provider?: string;
  bucket?: string;
  tenantId?: string;
  organizationId?: string;
  userId?: string;
  anonymousId?: string;
  operatorId?: string;
  appId?: string;
  appResourceType?: string;
  appResourceId?: string;
  scene?: string;
  source?: string;
}

export interface UploadViaPresignedUrlResult {
  driveUri: string;
  driveSpaceId: string;
  driveNodeId: string;
  fileId: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadResult: DriveUploaderUploadResult;
  objectKey?: never;
  uploadUrl?: never;
}

const normalizeUploadType = (value?: string): LegacyUploadKind => {
  const normalized = String(value || 'OTHER').trim().toUpperCase();
  if (normalized === 'IMAGE' || normalized === 'VIDEO' || normalized === 'AUDIO' || normalized === 'DOCUMENT') {
    return normalized;
  }
  return 'OTHER';
};

const uploadProfileFromLegacyType = (value?: string): DriveUploaderProfile => {
  const normalized = normalizeUploadType(value);
  if (normalized === 'IMAGE') return 'image';
  if (normalized === 'VIDEO') return 'video';
  if (normalized === 'AUDIO') return 'audio';
  if (normalized === 'DOCUMENT') return 'document';
  return 'generic';
};

const sanitizeFileName = (value: string): string => {
  const normalized = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return normalized || `upload-${Date.now()}.bin`;
};

const toBlob = (
  input: Blob | Uint8Array | ArrayBuffer | ArrayBufferView,
  contentType?: string,
): { blob: Blob; size: number } => {
  if (input instanceof Blob) {
    return { blob: input, size: input.size };
  }
  if (input instanceof ArrayBuffer) {
    const blob = new Blob([input], { type: contentType || DEFAULT_CONTENT_TYPE });
    return { blob, size: input.byteLength };
  }
  if (ArrayBuffer.isView(input)) {
    const view = input as ArrayBufferView;
    const bytes = new Uint8Array(view.byteLength);
    bytes.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    const blob = new Blob([bytes], { type: contentType || DEFAULT_CONTENT_TYPE });
    return { blob, size: bytes.byteLength };
  }

  const typed = input as Uint8Array;
  const bytes = new Uint8Array(typed.byteLength);
  bytes.set(typed);
  const blob = new Blob([bytes], { type: contentType || DEFAULT_CONTENT_TYPE });
  return { blob, size: bytes.byteLength };
};

const normalizeText = (value: unknown): string | undefined => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || undefined;
};

const resolveOperatorId = (input: UploadViaPresignedUrlInput): string | undefined =>
  normalizeText(input.operatorId) ||
  normalizeText(input.userId) ||
  normalizeText(input.anonymousId);

const driveUri = (spaceId: string, nodeId: string) =>
  `drive://spaces/${spaceId}/nodes/${nodeId}`;

const numberFromString = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function uploadViaPresignedUrl(
  client: UploadClientLike,
  input: UploadViaPresignedUrlInput,
): Promise<UploadViaPresignedUrlResult> {
  const uploader = client.uploader;
  if (!uploader || typeof uploader.uploadByProfile !== 'function') {
    throw new Error('Drive uploader API is unavailable: uploader.uploadByProfile is required.');
  }

  const tenantId = normalizeText(input.tenantId);
  if (!tenantId) {
    throw new Error('Drive uploader requires tenantId.');
  }

  const operatorId = resolveOperatorId(input);
  if (!operatorId) {
    throw new Error('Drive uploader requires userId, anonymousId, or operatorId.');
  }

  const fileName = sanitizeFileName(input.fileName);
  const explicitContentType = normalizeText(input.contentType);
  const inferredBlobType = input.file instanceof Blob ? normalizeText(input.file.type) : undefined;
  const contentType = explicitContentType || inferredBlobType || DEFAULT_CONTENT_TYPE;
  const { blob, size } = toBlob(input.file, contentType);
  const profile = uploadProfileFromLegacyType(input.type);
  const appId = normalizeText(input.appId) || DEFAULT_APP_ID;
  const appResourceId =
    normalizeText(input.appResourceId) ||
    normalizeText(input.path) ||
    normalizeText(input.folderId === undefined ? undefined : String(input.folderId)) ||
    fileName;

  const uploadResult = await uploader.uploadByProfile(profile, {
    file: blob,
    tenantId,
    organizationId: normalizeText(input.organizationId),
    userId: normalizeText(input.userId),
    anonymousId: normalizeText(input.anonymousId),
    operatorId,
    appId,
    appResourceType: normalizeText(input.appResourceType) || DEFAULT_APP_RESOURCE_TYPE,
    appResourceId,
    scene: normalizeText(input.scene) || DEFAULT_SCENE,
    source: normalizeText(input.source) || DEFAULT_SOURCE,
    uploadProfileCode: profile,
    originalFileName: fileName,
    contentType,
    retention: {
      mode: 'long_term',
    },
  });

  const spaceId = uploadResult.uploadSession.spaceId || uploadResult.uploadItem.spaceId;
  const nodeId = uploadResult.uploadSession.nodeId || uploadResult.uploadItem.nodeId;

  return {
    driveUri: driveUri(spaceId, nodeId),
    driveSpaceId: spaceId,
    driveNodeId: nodeId,
    fileId: nodeId,
    fileName: uploadResult.uploadItem.originalFileName || fileName,
    contentType: uploadResult.uploadItem.contentType || contentType,
    size: numberFromString(uploadResult.uploadItem.contentLength, size),
    uploadResult,
  };
}
