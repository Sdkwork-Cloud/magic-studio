import type {
  MagicStudioCreationSession,
  MagicStudioCreationSessionAttachment,
  MagicStudioCreationSessionTarget,
} from './server-creation-session.ts';

export const MAGIC_STUDIO_CREATION_BATCH_SOURCE_KINDS = [
  'manual',
  'template',
] as const;

export type MagicStudioCreationBatchSourceKind =
  (typeof MAGIC_STUDIO_CREATION_BATCH_SOURCE_KINDS)[number];

export const MAGIC_STUDIO_CREATION_BATCH_STATUSES = [
  'draft',
  'ready',
  'running',
  'completed',
  'cancelled',
] as const;

export type MagicStudioCreationBatchStatus =
  (typeof MAGIC_STUDIO_CREATION_BATCH_STATUSES)[number];

export const MAGIC_STUDIO_CREATION_BATCH_ITEM_STATUSES = [
  'pending',
  'materialized',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'skipped',
] as const;

export type MagicStudioCreationBatchItemStatus =
  (typeof MAGIC_STUDIO_CREATION_BATCH_ITEM_STATUSES)[number];

export const MAGIC_STUDIO_CREATION_BATCH_EXECUTION_MODES = ['serial'] as const;

export type MagicStudioCreationBatchExecutionMode =
  (typeof MAGIC_STUDIO_CREATION_BATCH_EXECUTION_MODES)[number];

export const MAGIC_STUDIO_CREATION_BATCH_EXECUTION_FAMILIES = [
  'generation',
  'voice_speech',
] as const;

export type MagicStudioCreationBatchExecutionFamily =
  (typeof MAGIC_STUDIO_CREATION_BATCH_EXECUTION_FAMILIES)[number];

export interface MagicStudioCreationBatchItemExecutionLink {
  family: MagicStudioCreationBatchExecutionFamily;
  taskId: string;
  taskUuid?: string;
  historyEntryId?: string;
  product?: string;
  linkedAt: number;
}

export interface MagicStudioCreationBatchItem {
  id: string;
  name: string;
  description?: string;
  status: MagicStudioCreationBatchItemStatus;
  templateStepId?: string;
  presetId?: string;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments: MagicStudioCreationSessionAttachment[];
  sessionId?: string;
  lastMaterializedAt?: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  execution?: MagicStudioCreationBatchItemExecutionLink;
  createdAt: number;
  updatedAt: number;
}

export interface MagicStudioCreationBatchProgress {
  total: number;
  pending: number;
  materialized: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  skipped: number;
  terminal: number;
}

export interface MagicStudioCreationBatch {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  target: MagicStudioCreationSessionTarget;
  sourceKind: MagicStudioCreationBatchSourceKind;
  templateId?: string;
  workspaceId: string;
  projectId?: string;
  status: MagicStudioCreationBatchStatus;
  executionMode: MagicStudioCreationBatchExecutionMode;
  items: MagicStudioCreationBatchItem[];
  progress: MagicStudioCreationBatchProgress;
  tags: string[];
  isFavorite: boolean;
  lastMaterializedItemId?: string;
  startedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MagicStudioCreationBatchListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  target?: MagicStudioCreationSessionTarget;
  workspaceId?: string;
  projectId?: string;
  status?: MagicStudioCreationBatchStatus;
  favoriteOnly?: boolean;
  sourceKind?: MagicStudioCreationBatchSourceKind;
  templateId?: string;
}

export interface MagicStudioCreateCreationBatchItemRequest {
  id?: string;
  name: string;
  description?: string;
  templateStepId?: string;
  presetId?: string;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments?: MagicStudioCreationSessionAttachment[];
}

export interface MagicStudioCreateCreationBatchRequest {
  name: string;
  description?: string;
  target: MagicStudioCreationSessionTarget;
  templateId?: string;
  workspaceId: string;
  projectId?: string;
  status?: MagicStudioCreationBatchStatus;
  items?: MagicStudioCreateCreationBatchItemRequest[];
  tags?: string[];
  isFavorite?: boolean;
}

export interface MagicStudioUpdateCreationBatchRequest {
  name?: string;
  description?: string | null;
  target?: MagicStudioCreationSessionTarget;
  templateId?: string | null;
  workspaceId?: string;
  projectId?: string | null;
  status?: MagicStudioCreationBatchStatus;
  items?: MagicStudioCreateCreationBatchItemRequest[];
  tags?: string[];
  isFavorite?: boolean;
}

export interface MagicStudioMaterializeCreationBatchRequest {
  itemId?: string;
  projectId?: string | null;
  prompt?: string | null;
  genMode?: string | null;
  model?: string | null;
  styleId?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  duration?: string | null;
  attachments?: MagicStudioCreationSessionAttachment[];
}

export interface MagicStudioUpdateCreationBatchItemStatusRequest {
  status: MagicStudioCreationBatchItemStatus;
  error?: string | null;
  taskFamily?: MagicStudioCreationBatchExecutionFamily;
  taskId?: string;
  historyEntryId?: string;
}

export interface MagicStudioCreationBatchMaterialization {
  batch: MagicStudioCreationBatch;
  item: MagicStudioCreationBatchItem;
  session: MagicStudioCreationSession;
}
