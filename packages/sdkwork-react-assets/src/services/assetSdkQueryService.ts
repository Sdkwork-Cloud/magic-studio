import type { Page, PageRequest } from '@sdkwork/react-commons';
import { getAppSdkClientWithSession, inlineDataService, uploadViaPresignedUrl, type UploadFile } from '@sdkwork/react-core';
import type { AssetBusinessDomain } from '@sdkwork/react-types';
import type { Asset, AssetOrigin, AssetType } from '../entities';
import { createSpringPage } from './impl/springPage';

const SUCCESS_CODE = '2000';

export type AssetSdkQueryCategory = AssetType | 'media' | 'effects' | 'transitions';

interface RawAssetMediaResource {
  url?: string;
  path?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

interface RawAssetVO {
  assetId?: string;
  assetName?: string;
  assetType?: string;
  fileType?: string;
  mimeType?: string;
  size?: number;
  description?: string;
  tags?: string[];
  folderId?: string;
  status?: string;
  primaryUrl?: string;
  thumbnailUrl?: string;
  coverImage?: { url?: string };
  assets?: RawAssetMediaResource[];
  createdAt?: string;
  updatedAt?: string;
}

interface RawPageAssetVO {
  totalElements?: number;
  totalPages?: number;
  size?: number;
  content?: RawAssetVO[];
  number?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

interface RawApiResultPageAssetVO {
  code?: string;
  msg?: string;
  data?: RawPageAssetVO;
}

interface RawApiResultVoid {
  code?: string;
  msg?: string;
}

interface RawFileVO {
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  extension?: string;
  objectKey?: string;
  path?: string;
  assetType?: string;
  accessUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RawApiResultFileVO {
  code?: string;
  msg?: string;
  data?: RawFileVO;
}

interface RawApiResultAssetDetailVO {
  code?: string;
  msg?: string;
  data?: RawAssetVO;
}

interface RawDownloadUrlResource {
  url?: string;
  path?: string;
}

interface RawDownloadUrlVO {
  resource?: RawDownloadUrlResource;
}

interface RawApiResultDownloadUrlVO {
  code?: string;
  msg?: string;
  data?: RawDownloadUrlVO;
}

interface AssetSdkQueryOptions {
  category: AssetSdkQueryCategory;
  pageRequest: PageRequest;
  allowedTypes?: AssetType[];
}

function toAssetOrigin(tags?: string[]): AssetOrigin {
  if (!Array.isArray(tags)) {
    return 'stock';
  }
  const lowered = tags.map((tag) => String(tag || '').toLowerCase());
  if (lowered.some((tag) => tag === 'ai' || tag.includes('origin:ai'))) {
    return 'ai';
  }
  if (lowered.some((tag) => tag === 'upload' || tag.includes('origin:upload'))) {
    return 'upload';
  }
  if (lowered.some((tag) => tag === 'system' || tag.includes('origin:system'))) {
    return 'system';
  }
  return 'stock';
}

function normalizeAssetType(rawType?: string): AssetType | null {
  const type = String(rawType || '').toUpperCase();
  if (type === 'IMAGE') return 'image';
  if (type === 'VIDEO') return 'video';
  if (type === 'AUDIO') return 'audio';
  if (type === 'MUSIC') return 'music';
  if (type === 'VOICE') return 'voice';
  if (type === 'DOCUMENT') return 'text';
  if (type === 'CHARACTER') return 'character';
  if (type === 'MODEL_3D' || type === 'MODEL3D') return 'model3d';
  if (type === 'LOTTIE') return 'lottie';
  if (type === 'EFFECT') return 'effect';
  if (type === 'TRANSITION') return 'transition';
  if (type === 'SUBTITLE') return 'subtitle';
  if (type === 'SFX') return 'sfx';
  if (type === 'FILE' || type === 'UNKNOWN') return 'file';
  return null;
}

function resolveAssetType(raw: RawAssetVO): AssetType {
  const byType = normalizeAssetType(raw.assetType);
  if (byType) {
    return byType;
  }
  const mime = String(raw.mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

function resolveUploadAssetType(raw?: string, fallback: AssetType = 'file'): AssetType {
  const normalized = normalizeAssetType(raw);
  return normalized || fallback;
}

function pickAssetPath(raw: RawAssetVO): string {
  const firstResource = Array.isArray(raw.assets) ? raw.assets[0] : undefined;
  return (
    String(raw.primaryUrl || '').trim() ||
    String(raw.thumbnailUrl || '').trim() ||
    String(raw.coverImage?.url || '').trim() ||
    String(firstResource?.url || '').trim() ||
    String(firstResource?.path || '').trim() ||
    `assets://${String(raw.assetId || '')}`
  );
}

function mapRawAsset(raw: RawAssetVO): Asset {
  const id = String(raw.assetId || '').trim() || `asset-${Date.now()}`;
  const type = resolveAssetType(raw);
  const path = pickAssetPath(raw);
  return {
    id,
    uuid: id,
    name: String(raw.assetName || '').trim() || `Asset ${id}`,
    type,
    path,
    size: Number(raw.size || 0),
    origin: toAssetOrigin(raw.tags),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    metadata: {
      mimeType: raw.mimeType,
      description: raw.description,
      tags: raw.tags,
      folderId: raw.folderId,
      status: raw.status,
      fileType: raw.fileType,
      primaryUrl: raw.primaryUrl,
      thumbnailUrl: raw.thumbnailUrl
    }
  };
}

function resolveBackendType(category: AssetSdkQueryCategory): string | undefined {
  if (category === 'image') return 'IMAGE';
  if (category === 'video') return 'VIDEO';
  if (category === 'audio' || category === 'music' || category === 'voice' || category === 'sfx') {
    return 'AUDIO';
  }
  if (category === 'text' || category === 'subtitle') return 'DOCUMENT';
  return undefined;
}

function parseSort(sort?: string[]): { sortField?: string; sortDirection?: string } {
  const first = sort?.[0];
  if (!first) {
    return { sortField: 'createdAt', sortDirection: 'desc' };
  }
  const [field, direction] = first.split(',');
  return {
    sortField: field?.trim() || 'createdAt',
    sortDirection: (direction || 'desc').trim().toLowerCase() === 'asc' ? 'asc' : 'desc'
  };
}

function resolveUploadCategory(type: AssetType): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (type === 'image') return 'image';
  if (type === 'video') return 'video';
  if (type === 'audio' || type === 'music' || type === 'voice' || type === 'sfx') return 'audio';
  if (type === 'text' || type === 'subtitle') return 'document';
  return 'other';
}

function resolveUploadPath(domain?: AssetBusinessDomain): string {
  const safeDomain = (domain || 'asset-center').replace(/[^a-zA-Z0-9-_]/g, '-');
  return `assets/${safeDomain}`;
}

function mapFileVoToAsset(
  file: RawFileVO | undefined,
  fallbackType: AssetType,
  fallbackName: string,
  fallbackSize: number
): Asset {
  const id = String(file?.fileId || '').trim() || `asset-${Date.now()}`;
  const type = resolveUploadAssetType(file?.assetType, fallbackType);
  const path =
    String(file?.accessUrl || '').trim() ||
    String(file?.path || '').trim() ||
    String(file?.objectKey || '').trim() ||
    `assets://${id}`;

  return {
    id,
    uuid: id,
    name: String(file?.fileName || '').trim() || fallbackName,
    type,
    path,
    size: Number(file?.fileSize || fallbackSize || 0),
    origin: 'upload',
    createdAt: file?.createdAt || new Date().toISOString(),
    updatedAt: file?.updatedAt || file?.createdAt || new Date().toISOString(),
    metadata: {
      fileType: file?.fileType,
      extension: file?.extension,
      objectKey: file?.objectKey,
      accessUrl: file?.accessUrl,
      source: 'sdk-upload'
    }
  };
}

function toPageResult(rawPage: RawPageAssetVO | undefined, request: PageRequest): Page<Asset> {
  const fallback = createSpringPage([], request);
  if (!rawPage) {
    return fallback;
  }

  const content = Array.isArray(rawPage.content) ? rawPage.content.map((item) => mapRawAsset(item)) : [];
  const pageNumber = Number.isFinite(Number(rawPage.number)) ? Number(rawPage.number) : request.page ?? 0;
  const pageSize = Number.isFinite(Number(rawPage.size)) ? Number(rawPage.size) : request.size ?? 20;
  const totalElements = Number.isFinite(Number(rawPage.totalElements))
    ? Number(rawPage.totalElements)
    : content.length;
  const totalPages = Number.isFinite(Number(rawPage.totalPages))
    ? Number(rawPage.totalPages)
    : (totalElements === 0 ? 0 : Math.ceil(totalElements / Math.max(1, pageSize)));
  const numberOfElements = Number.isFinite(Number(rawPage.numberOfElements))
    ? Number(rawPage.numberOfElements)
    : content.length;

  return {
    content,
    pageable: {
      pageNumber,
      pageSize,
      offset: pageNumber * pageSize,
      paged: true,
      unpaged: false,
      sort: {
        sorted: true,
        unsorted: false,
        empty: false
      }
    },
    last: rawPage.last ?? (totalPages === 0 ? true : pageNumber >= totalPages - 1),
    totalPages,
    totalElements,
    size: pageSize,
    number: pageNumber,
    first: rawPage.first ?? pageNumber === 0,
    numberOfElements,
    empty: rawPage.empty ?? content.length === 0,
    sort: {
      sorted: true,
      unsorted: false,
      empty: false
    }
  };
}

function assertApiSuccess(response: RawApiResultVoid | undefined, fallbackMessage: string): void {
  const code = String(response?.code || '').trim();
  if (code && code !== SUCCESS_CODE) {
    throw new Error(String(response?.msg || fallbackMessage));
  }
}

export async function queryAssetsBySdk(options: AssetSdkQueryOptions): Promise<Page<Asset>> {
  const page = Math.max(0, options.pageRequest.page ?? 0);
  const size = Math.max(1, options.pageRequest.size ?? 20);
  const sort = parseSort(options.pageRequest.sort);
  const backendType = resolveBackendType(options.category);

  const client = getAppSdkClientWithSession();
  const response = await client.assets.listAssets({
    type: backendType,
    keyword: options.pageRequest.keyword,
    sortField: sort.sortField,
    sortDirection: sort.sortDirection,
    pageNum: page + 1,
    pageSize: size
  }) as RawApiResultPageAssetVO;

  assertApiSuccess(response, 'Failed to query assets.');

  const mappedPage = toPageResult(response?.data, {
    page,
    size,
    sort: options.pageRequest.sort,
    keyword: options.pageRequest.keyword
  });

  if (!options.allowedTypes || options.allowedTypes.length === 0) {
    return mappedPage;
  }

  const allowSet = new Set(options.allowedTypes);
  const filtered = mappedPage.content.filter((item) => allowSet.has(item.type));
  return {
    ...mappedPage,
    content: filtered,
    numberOfElements: filtered.length,
    empty: filtered.length === 0
  };
}

export async function importAssetBySdk(
  file: UploadFile,
  type: AssetType,
  options?: { domain?: AssetBusinessDomain }
): Promise<Asset> {
  if (!file || !file.name || !(file.data instanceof Uint8Array) || file.data.length === 0) {
    throw new Error('File data is empty, unable to upload through SDK.');
  }

  const bytes = file.data;
  const uploadBytes = new Uint8Array(bytes.byteLength);
  uploadBytes.set(bytes);
  const blob = new Blob([uploadBytes]);

  const client = getAppSdkClientWithSession();
  const uploadResult = await uploadViaPresignedUrl(client, {
    file: blob,
    fileName: file.name,
    type: resolveUploadCategory(type),
    path: resolveUploadPath(options?.domain)
  });
  const response = uploadResult.registerResult as unknown as RawApiResultFileVO;

  assertApiSuccess(response, 'Failed to upload asset.');
  return mapFileVoToAsset(response?.data, type, file.name, file.data.length);
}

async function resolveUploadBytesFromSourceUrl(sourceUrl: string): Promise<Uint8Array> {
  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  if (inlineData && inlineData.length > 0) {
    return inlineData;
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download source asset: HTTP ${response.status}.`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) {
    throw new Error('Downloaded source asset is empty.');
  }
  return bytes;
}

export async function importAssetFromUrlBySdk(
  sourceUrl: string,
  type: AssetType,
  options: { name: string; domain?: AssetBusinessDomain }
): Promise<Asset> {
  const normalizedSource = String(sourceUrl || '').trim();
  if (!normalizedSource) {
    throw new Error('Source url is required.');
  }

  const bytes = await resolveUploadBytesFromSourceUrl(normalizedSource);
  return importAssetBySdk(
    {
      name: options.name,
      data: bytes
    },
    type,
    { domain: options.domain }
  );
}

export async function renameAssetBySdk(assetId: string, newName: string): Promise<void> {
  const normalizedName = newName.trim();
  if (!normalizedName) {
    throw new Error('Asset name is required.');
  }

  const client = getAppSdkClientWithSession();
  const response = await client.assets.renameAsset(assetId, {
    name: normalizedName
  }) as RawApiResultVoid;
  assertApiSuccess(response, 'Failed to rename asset.');
}

export async function deleteAssetBySdk(assetId: string): Promise<void> {
  const client = getAppSdkClientWithSession();
  const response = await client.assets.deleteAsset(assetId) as RawApiResultVoid;
  assertApiSuccess(response, 'Failed to delete asset.');
}

export async function resolveAssetPrimaryUrlBySdk(assetId: string): Promise<string | null> {
  const normalizedAssetId = String(assetId || '').trim();
  if (!normalizedAssetId) {
    return null;
  }

  const client = getAppSdkClientWithSession();

  try {
    const detail = await client.assets.getAssetDetail(normalizedAssetId) as RawApiResultAssetDetailVO;
    assertApiSuccess(detail, 'Failed to get asset detail.');

    const data = detail?.data;
    const fromDetail =
      String(data?.primaryUrl || '').trim() ||
      String(data?.thumbnailUrl || '').trim() ||
      String(data?.coverImage?.url || '').trim() ||
      String(data?.assets?.[0]?.url || '').trim() ||
      String(data?.assets?.[0]?.path || '').trim();
    if (fromDetail) {
      return fromDetail;
    }
  } catch {
    // Ignore detail failure and try download url fallback.
  }

  try {
    const download = await client.assets.getDownloadUrl(normalizedAssetId) as RawApiResultDownloadUrlVO;
    assertApiSuccess(download, 'Failed to get asset download url.');

    const resource = download?.data?.resource;
    const fromDownload =
      String(resource?.url || '').trim() ||
      String(resource?.path || '').trim();
    return fromDownload || null;
  } catch {
    return null;
  }
}
