export const MAGIC_STUDIO_CREATION_HISTORY_PRODUCTS = [
  'image',
  'video',
  'audio',
  'music',
  'character',
  'sfx',
] as const;

export type MagicStudioCreationHistoryProduct =
  (typeof MAGIC_STUDIO_CREATION_HISTORY_PRODUCTS)[number];

export const MAGIC_STUDIO_CREATION_HISTORY_SOURCES = [
  'generation',
  'imported',
] as const;

export type MagicStudioCreationHistorySource =
  (typeof MAGIC_STUDIO_CREATION_HISTORY_SOURCES)[number];

export const MAGIC_STUDIO_CREATION_HISTORY_STATUSES = [
  'draft',
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
] as const;

export type MagicStudioCreationHistoryStatus =
  (typeof MAGIC_STUDIO_CREATION_HISTORY_STATUSES)[number];

export interface MagicStudioCreationHistoryConfig {
  prompt?: string;
  text?: string;
  previewText?: string;
  mediaType?: string;
  aspectRatio?: string;
  model?: string;
  useMultiModel?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioCreationHistoryResultResource {
  id?: string | null;
  uuid?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  type?: string;
  path?: string;
  url?: string;
  mimeType?: string;
  name?: string;
  text?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioCreationHistoryResult {
  id?: string | null;
  uuid?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  path?: string;
  url?: string;
  mimeType?: string;
  posterUrl?: string;
  resource?: MagicStudioCreationHistoryResultResource;
  coverResource?: MagicStudioCreationHistoryResultResource;
  modelId?: string;
  duration?: number;
}

export interface MagicStudioCreationHistoryEntry {
  id: string;
  uuid: string;
  product: MagicStudioCreationHistoryProduct;
  source: MagicStudioCreationHistorySource;
  status: MagicStudioCreationHistoryStatus;
  error?: string;
  isFavorite?: boolean;
  config: MagicStudioCreationHistoryConfig;
  results?: MagicStudioCreationHistoryResult[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface MagicStudioCreationHistoryListQuery {
  page?: number;
  pageSize?: number;
  product?: MagicStudioCreationHistoryProduct;
  source?: MagicStudioCreationHistorySource;
  status?: MagicStudioCreationHistoryStatus;
  favoriteOnly?: boolean;
}

export interface MagicStudioUpsertCreationHistoryEntryRequest {
  id?: string;
  uuid?: string;
  product: MagicStudioCreationHistoryProduct;
  source?: MagicStudioCreationHistorySource;
  status: MagicStudioCreationHistoryStatus;
  error?: string;
  isFavorite?: boolean;
  config: MagicStudioCreationHistoryConfig;
  results?: MagicStudioCreationHistoryResult[];
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

export interface MagicStudioCreationHistoryFavoriteRequest {
  isFavorite: boolean;
}
