import type {
  MagicStudioApiListEnvelope,
  MagicStudioTradeMarketplaceTask,
  MagicStudioTradeTaskDifficulty,
  MagicStudioTradeTaskListQuery,
  MagicStudioTradeTaskStatus,
  MagicStudioTradeTaskType,
} from '@sdkwork/magic-studio-server';

import type {
  AvailableTask,
  TradePageRequest,
  TradePageResponse,
} from '../entities';
import { TaskType } from '../entities';

const TRADE_TASK_STATUSES: readonly MagicStudioTradeTaskStatus[] = [
  'AVAILABLE',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const TRADE_TASK_DIFFICULTIES: readonly MagicStudioTradeTaskDifficulty[] = [
  'EASY',
  'MEDIUM',
  'HARD',
  'EXPERT',
];

const TRADE_TASK_SORT_BY: readonly NonNullable<MagicStudioTradeTaskListQuery['sortBy']>[] = [
  'latest',
  'budget',
  'difficulty',
];

const TRADE_TASK_TYPES = Object.values(TaskType) as MagicStudioTradeTaskType[];

function normalizeOptionalText(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizePositiveInteger(value?: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value > 0 ? Math.trunc(value) : undefined;
}

function normalizeTaskStatus(value?: string): MagicStudioTradeTaskStatus | undefined {
  return TRADE_TASK_STATUSES.includes(value as MagicStudioTradeTaskStatus)
    ? (value as MagicStudioTradeTaskStatus)
    : undefined;
}

function normalizeTaskType(value?: string): MagicStudioTradeTaskType | undefined {
  return TRADE_TASK_TYPES.includes(value as MagicStudioTradeTaskType)
    ? (value as MagicStudioTradeTaskType)
    : undefined;
}

function normalizeTaskDifficulty(
  value?: TradePageRequest['difficulty'],
): MagicStudioTradeTaskDifficulty | undefined {
  return TRADE_TASK_DIFFICULTIES.includes(value as MagicStudioTradeTaskDifficulty)
    ? (value as MagicStudioTradeTaskDifficulty)
    : undefined;
}

function normalizeSortBy(
  value?: TradePageRequest['sortBy'],
): MagicStudioTradeTaskListQuery['sortBy'] {
  return TRADE_TASK_SORT_BY.includes(value as NonNullable<MagicStudioTradeTaskListQuery['sortBy']>)
    ? (value as NonNullable<MagicStudioTradeTaskListQuery['sortBy']>)
    : undefined;
}

export function toTradeTaskQuery(
  params: TradePageRequest,
): MagicStudioTradeTaskListQuery {
  return {
    page: normalizePositiveInteger(params.page),
    pageSize: normalizePositiveInteger(params.pageSize),
    sortBy: normalizeSortBy(params.sortBy),
    sortOrder: params.sortOrder === 'asc' || params.sortOrder === 'desc'
      ? params.sortOrder
      : undefined,
    keyword: normalizeOptionalText(params.keyword),
    status: normalizeTaskStatus(params.status),
    type: normalizeTaskType(params.type),
    difficulty: normalizeTaskDifficulty(params.difficulty),
    startTime: normalizeOptionalText(params.startTime),
    endTime: normalizeOptionalText(params.endTime),
  };
}

export function mapTradeMarketplaceTask(
  task: MagicStudioTradeMarketplaceTask,
): AvailableTask {
  return {
    uuid: task.uuid,
    title: task.title,
    description: task.description,
    type: task.type as TaskType,
    requirements: task.requirements ?? [],
    budget: task.budget,
    deadline: task.deadline,
    publisherUuid: task.publisherUuid,
    publisherName: task.publisherName,
    status: task.status,
    acceptorUuid: task.acceptorUuid ?? undefined,
    acceptorName: task.acceptorName ?? undefined,
    acceptedAt: task.acceptedAt ?? undefined,
    submittedAt: task.submittedAt ?? undefined,
    approvedAt: task.approvedAt ?? undefined,
    attachmentResourceUuids: task.attachmentResourceUuids ?? [],
    deliveryResourceUuids: task.deliveryResourceUuids ?? [],
    tags: task.tags ?? [],
    difficulty: task.difficulty,
    estimatedDuration: task.estimatedDuration,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function mapTradeMarketplaceTaskPage(
  envelope: MagicStudioApiListEnvelope<MagicStudioTradeMarketplaceTask>,
): TradePageResponse<AvailableTask> {
  const pageSize = envelope.meta.pageSize;
  const total = envelope.meta.total;

  return {
    items: envelope.items.map(mapTradeMarketplaceTask),
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    currentPage: envelope.meta.page,
    pageSize,
  };
}
