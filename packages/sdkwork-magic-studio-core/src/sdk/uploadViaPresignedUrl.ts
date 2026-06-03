import type {
  PlusApiResultFileVO,
  PlusApiResultPresignedUrlVO,
  PresignedUploadRegisterForm,
  PresignedUrlForm,
} from '@sdkwork/app-sdk';

import type { AppSdkClient } from './useAppSdkClient';

const SUCCESS_CODES = new Set(['0', '200', '2000']);
const DEFAULT_UPLOAD_PATH = 'uploads';
const DEFAULT_CONTENT_TYPE = 'application/octet-stream';
const DEFAULT_UPLOAD_TYPE: UploadKind = 'OTHER';
const DEFAULT_UPLOAD_PROVIDER: UploadProvider = 'AWS';
const VALID_UPLOAD_TYPES = new Set<UploadKind>(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER']);
const VALID_UPLOAD_PROVIDERS = new Set<UploadProvider>(['VOLCENGINE', 'QCLOUD', 'ALIYUN', 'AWS', 'OTHER']);

type UploadKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
type UploadProvider = NonNullable<PresignedUploadRegisterForm['provider']>;
type UploadApiLike = {
  getPresignedUrl: (body: PresignedUrlForm) => Promise<PlusApiResultPresignedUrlVO>;
  registerPresigned: (body: PresignedUploadRegisterForm) => Promise<PlusApiResultFileVO>;
};
type UploadClientLike = {
  upload?: UploadApiLike | Pick<AppSdkClient['upload'], 'getPresignedUrl' | 'registerPresigned'>;
};

interface PresignedUrlDataLike {
  url?: string;
  previewUrl?: string;
  objectKey?: string;
  headers?: Record<string, string>;
}

export interface UploadViaPresignedUrlInput {
  file: Blob | Uint8Array | ArrayBuffer | ArrayBufferView;
  fileName: string;
  contentType?: string;
  folderId?: string | number;
  path?: string;
  type?: string;
  provider?: string;
  bucket?: string;
}

export interface UploadViaPresignedUrlResult {
  presignedResult: PlusApiResultPresignedUrlVO;
  registerResult: PlusApiResultFileVO;
  objectKey: string;
  uploadUrl: string;
}

const assertEnvelopeSuccess = (
  value:
    | Pick<PlusApiResultPresignedUrlVO, 'code' | 'msg'>
    | Pick<PlusApiResultFileVO, 'code' | 'msg'>
    | { code?: string | number; msg?: string; message?: string },
  fallbackMessage: string,
): void => {
  const envelope = value as { code?: string | number; msg?: string; message?: string };
  const code = String(value.code ?? '').trim();
  if (code && !SUCCESS_CODES.has(code)) {
    throw new Error(String(envelope.msg || envelope.message || fallbackMessage));
  }
};

const normalizeUploadType = (value?: string): UploadKind => {
  const normalized = String(value || DEFAULT_UPLOAD_TYPE).trim().toUpperCase();
  return VALID_UPLOAD_TYPES.has(normalized as UploadKind)
    ? (normalized as UploadKind)
    : DEFAULT_UPLOAD_TYPE;
};

const normalizeUploadProvider = (value?: string): UploadProvider => {
  const normalized = String(value || DEFAULT_UPLOAD_PROVIDER).trim().toUpperCase();
  return VALID_UPLOAD_PROVIDERS.has(normalized as UploadProvider)
    ? (normalized as UploadProvider)
    : DEFAULT_UPLOAD_PROVIDER;
};

const normalizeUploadPath = (value?: string): string => {
  const normalized = String(value || DEFAULT_UPLOAD_PATH).trim().replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const trimmed = normalized.replace(/^\/+|\/+$/g, '');
  return trimmed || DEFAULT_UPLOAD_PATH;
};

const sanitizeFileName = (value: string): string => {
  const normalized = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return normalized || `upload-${Date.now()}.bin`;
};

const buildObjectKey = (fileName: string, uploadPath: string): string => {
  const safeName = sanitizeFileName(fileName);
  const random = Math.random().toString(36).slice(2, 10);
  return `${uploadPath}/${Date.now()}-${random}-${safeName}`;
};

const toBlob = (
  input: Blob | Uint8Array | ArrayBuffer | ArrayBufferView,
  contentType?: string
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

const normalizeFolderId = (value?: string | number): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!normalized || normalized === '0') {
    return undefined;
  }
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return undefined;
};

export async function uploadViaPresignedUrl(
  client: UploadClientLike,
  input: UploadViaPresignedUrlInput
): Promise<UploadViaPresignedUrlResult> {
  const uploadApi = client.upload as UploadApiLike | undefined;
  if (!uploadApi || typeof uploadApi.getPresignedUrl !== 'function') {
    throw new Error('SDK upload API is unavailable: getPresignedUrl is required.');
  }
  if (typeof uploadApi.registerPresigned !== 'function') {
    throw new Error('SDK upload API is unavailable: registerPresigned is required.');
  }

  const normalizedPath = normalizeUploadPath(input.path);
  const normalizedType = normalizeUploadType(input.type);
  const normalizedProvider = normalizeUploadProvider(input.provider);
  const normalizedName = sanitizeFileName(input.fileName);
  const normalizedFolderId = normalizeFolderId(input.folderId);
  const objectKey = buildObjectKey(normalizedName, normalizedPath);
  const explicitContentType = String(input.contentType || '').trim();
  const inferredBlobType = input.file instanceof Blob ? String(input.file.type || '').trim() : '';
  const contentType = explicitContentType || inferredBlobType || DEFAULT_CONTENT_TYPE;
  const { blob, size } = toBlob(input.file, contentType);

  const presignedPayload: PresignedUrlForm = {
    objectKey,
    method: 'PUT',
    ...(String(input.bucket || '').trim() ? { bucket: String(input.bucket).trim() } : {}),
  };
  const presignedResult = await uploadApi.getPresignedUrl(presignedPayload);
  assertEnvelopeSuccess(presignedResult, 'Failed to get presigned upload URL.');

  const presignedData = (presignedResult.data || {}) as PresignedUrlDataLike;
  const uploadUrl = String(presignedData.url || '').trim();
  if (!uploadUrl) {
    throw new Error('Presigned upload URL is empty.');
  }
  const finalObjectKey = String(presignedData.objectKey || objectKey).trim() || objectKey;
  const uploadHeaders = {
    ...(presignedData.headers || {}),
    ...(explicitContentType ? { 'Content-Type': explicitContentType } : {}),
  };

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: Object.keys(uploadHeaders).length > 0 ? uploadHeaders : undefined,
    body: blob
  });
  if (!uploadResponse.ok) {
    throw new Error(`Presigned upload failed: HTTP ${uploadResponse.status}.`);
  }

  const registerPayload: PresignedUploadRegisterForm = {
    objectKey: finalObjectKey,
    fileName: normalizedName,
    size,
    contentType,
    type: normalizedType,
    path: normalizedPath,
    provider: normalizedProvider,
    ...(normalizedFolderId !== undefined ? { folderId: normalizedFolderId } : {}),
    ...(String(input.bucket || '').trim() ? { bucket: String(input.bucket).trim() } : {}),
  };

  const registerResult = await uploadApi.registerPresigned(registerPayload);
  assertEnvelopeSuccess(registerResult, 'Failed to register uploaded file metadata.');

  return {
    presignedResult,
    registerResult,
    objectKey: finalObjectKey,
    uploadUrl
  };
}
