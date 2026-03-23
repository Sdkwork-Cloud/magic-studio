import type {
  PagePromptHistoryVO,
  PagePromptVO,
  PromptCreateForm,
  PromptHistoryVO,
  PromptUpdateForm,
  PromptVO,
  QueryParams,
  SdkworkAppConfig,
} from '@sdkwork/app-sdk';
import { createScopedAppSdkClient, getAppSdkClientWithSession } from './useAppSdkClient';

const SUCCESS_CODE = '2000';

type PromptApiEnvelope<T> = {
  code?: string | number;
  msg?: string;
  data?: T;
};

export type PromptRecordType = PromptCreateForm['type'];
export type PromptRecordBizType = PromptCreateForm['bizType'];

export type ScopedSdkInstance = Partial<
  Pick<
    SdkworkAppConfig,
    'baseUrl' | 'tenantId' | 'organizationId' | 'authToken' | 'accessToken' | 'apiKey' | 'timeout' | 'platform' | 'headers'
  >
>;

export interface PromptLibraryQueryOptions {
  page?: number;
  size?: number;
  keyword?: string;
  type?: PromptRecordType;
  bizType?: PromptRecordBizType;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  instance?: ScopedSdkInstance;
}

export interface PromptHistoryQueryOptions {
  page?: number;
  size?: number;
  keyword?: string;
  success?: boolean;
  instance?: ScopedSdkInstance;
}

export interface PromptLibraryRecord {
  id: string;
  title: string;
  content: string;
  description?: string;
  type: PromptRecordType;
  bizType: PromptRecordBizType;
  enabled: boolean;
  isFavorite: boolean;
  isPublic: boolean;
  favoriteCount: number;
  usageCount: number;
  avgResponseTime: number;
  version?: string;
  parameters?: Record<string, unknown>;
  tags?: PromptVO['tags'];
  model?: string;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  raw: PromptVO;
}

export interface PromptHistoryRecord {
  id: string;
  promptId?: string;
  title: string;
  content: string;
  promptContent?: string;
  usedContent?: string;
  responseContent?: string;
  model?: string;
  duration: number;
  inputTokens: number;
  outputTokens: number;
  success?: boolean;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  raw: PromptHistoryVO;
}

export interface PromptPageResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  size: number;
}

type PromptClientLike = {
  prompt: {
    createPrompt?: (body: PromptCreateForm) => Promise<unknown>;
    updatePrompt?: (id: string | number, body: PromptUpdateForm) => Promise<unknown>;
    deletePrompt?: (id: string | number) => Promise<unknown>;
    getPromptDetail?: (id: string | number) => Promise<unknown>;
    listPrompts?: (params?: QueryParams) => Promise<unknown>;
    getPopularPrompts?: (params?: QueryParams) => Promise<unknown>;
    getMostFavoritedPrompts?: (params?: QueryParams) => Promise<unknown>;
    getPromptHistoryDetail?: (id: string | number) => Promise<unknown>;
    deletePromptHistory?: (id: string | number) => Promise<unknown>;
    listPromptHistory?: (params?: QueryParams) => Promise<unknown>;
    use?: (id: string | number) => Promise<unknown>;
    favorite?: (id: string | number) => Promise<unknown>;
    unfavorite?: (id: string | number) => Promise<unknown>;
  };
};

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(normalizeText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function assertPromptApiSuccess(payload: PromptApiEnvelope<unknown> | undefined, fallbackMessage: string): void {
  const code = normalizeText(payload?.code);
  if (code && code !== SUCCESS_CODE) {
    throw new Error(normalizeText(payload?.msg) || fallbackMessage);
  }
}

function unwrapPromptPage<T>(payload: unknown, fallbackMessage: string): T {
  const response = payload as PromptApiEnvelope<T> | undefined;
  assertPromptApiSuccess(response, fallbackMessage);
  return (response?.data || {}) as T;
}

function getPromptClient(instance?: ScopedSdkInstance): PromptClientLike {
  if (instance && Object.keys(instance).length > 0) {
    return createScopedAppSdkClient(instance);
  }
  return getAppSdkClientWithSession();
}

function toPromptQueryParams(options: PromptLibraryQueryOptions | PromptHistoryQueryOptions): QueryParams {
  const page = Math.max(0, options.page ?? 0);
  const size = Math.max(1, options.size ?? 20);
  const params: QueryParams = {
    pageNum: page + 1,
    pageSize: size,
  };

  const keyword = normalizeText((options as PromptLibraryQueryOptions).keyword);
  if (keyword) {
    params.keyword = keyword;
  }

  if ('type' in options) {
    const type = normalizeText(options.type);
    if (type) {
      params.type = type;
    }
  }

  if ('bizType' in options) {
    const bizType = normalizeText(options.bizType);
    if (bizType) {
      params.bizType = bizType;
    }
  }

  if ('orderBy' in options) {
    const orderBy = normalizeText(options.orderBy);
    if (orderBy) {
      params.orderBy = orderBy;
    }
  }

  if ('orderDirection' in options) {
    const orderDirection = normalizeText(options.orderDirection);
    if (orderDirection) {
      params.orderDirection = orderDirection;
    }
  }

  if ('success' in options && typeof options.success === 'boolean') {
    params.success = options.success;
  }

  return params;
}

function toPromptPageResult<TPage extends { content?: TItem[]; totalElements?: number; size?: number; number?: number }, TItem, TOutput>(
  page: TPage | undefined,
  mapItem: (item: TItem) => TOutput
): PromptPageResult<TOutput> {
  const items = Array.isArray(page?.content) ? page.content.map((item) => mapItem(item)) : [];
  return {
    items,
    total: normalizeNumber(page?.totalElements ?? items.length),
    page: normalizeNumber(page?.number),
    size: normalizeNumber(page?.size ?? items.length),
  };
}

export function normalizePromptRecord(raw: PromptVO): PromptLibraryRecord {
  const title = normalizeText(raw.title) || 'Untitled Prompt';
  return {
    id: normalizeText(raw.id) || `prompt-${Date.now()}`,
    title,
    content: normalizeText(raw.content),
    description: normalizeText(raw.description) || undefined,
    type: (normalizeText(raw.type) || 'DEFAULT') as PromptRecordType,
    bizType: (normalizeText(raw.bizType) || 'DEFAULT') as PromptRecordBizType,
    enabled: normalizeBoolean(raw.enabled ?? true),
    isFavorite: normalizeBoolean(raw.isFavorite),
    isPublic: normalizeBoolean(raw.isPublic),
    favoriteCount: normalizeNumber(raw.favoriteCount),
    usageCount: normalizeNumber(raw.usageCount),
    avgResponseTime: normalizeNumber(raw.avgResponseTime),
    version: normalizeText(raw.version) || undefined,
    parameters: raw.parameters,
    tags: raw.tags,
    model: normalizeText(raw.model) || undefined,
    lastUsedAt: normalizeText(raw.lastUsedAt) || undefined,
    createdAt: normalizeText(raw.createdAt) || undefined,
    updatedAt: normalizeText(raw.updatedAt) || undefined,
    raw,
  };
}

export function normalizePromptHistoryRecord(raw: PromptHistoryVO): PromptHistoryRecord {
  const promptContent = normalizeText(raw.promptContent);
  const usedContent = normalizeText(raw.usedContent);
  const title = normalizeText(raw.promptTitle) || 'Prompt History';
  return {
    id: normalizeText(raw.id) || `prompt-history-${Date.now()}`,
    promptId: normalizeText(raw.promptId) || undefined,
    title,
    content: usedContent || promptContent,
    promptContent: promptContent || undefined,
    usedContent: usedContent || undefined,
    responseContent: normalizeText(raw.responseContent) || undefined,
    model: normalizeText(raw.model) || undefined,
    duration: normalizeNumber(raw.duration),
    inputTokens: normalizeNumber(raw.inputTokens),
    outputTokens: normalizeNumber(raw.outputTokens),
    success: raw.success === undefined ? undefined : normalizeBoolean(raw.success),
    errorMessage: normalizeText(raw.errorMessage) || undefined,
    createdAt: normalizeText(raw.createdAt) || undefined,
    updatedAt: normalizeText(raw.updatedAt) || undefined,
    raw,
  };
}

export const promptLibraryService = {
  async getPromptDetail(id: string | number, instance?: ScopedSdkInstance): Promise<PromptLibraryRecord> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.getPromptDetail?.(id);
    const record = unwrapPromptPage<PromptVO>(payload, 'Failed to load prompt detail.');
    return normalizePromptRecord(record);
  },

  async listPrompts(options: PromptLibraryQueryOptions = {}): Promise<PromptPageResult<PromptLibraryRecord>> {
    const client = getPromptClient(options.instance);
    const payload = await client.prompt.listPrompts?.(toPromptQueryParams(options));
    const page = unwrapPromptPage<PagePromptVO>(payload, 'Failed to load prompt library.');
    return toPromptPageResult<PagePromptVO, PromptVO, PromptLibraryRecord>(page, normalizePromptRecord);
  },

  async listPopularPrompts(options: PromptLibraryQueryOptions = {}): Promise<PromptPageResult<PromptLibraryRecord>> {
    const client = getPromptClient(options.instance);
    const payload = await client.prompt.getPopularPrompts?.(toPromptQueryParams(options));
    const page = unwrapPromptPage<PagePromptVO>(payload, 'Failed to load popular prompts.');
    return toPromptPageResult<PagePromptVO, PromptVO, PromptLibraryRecord>(page, normalizePromptRecord);
  },

  async listMostFavoritedPrompts(options: PromptLibraryQueryOptions = {}): Promise<PromptPageResult<PromptLibraryRecord>> {
    const client = getPromptClient(options.instance);
    const payload = await client.prompt.getMostFavoritedPrompts?.(toPromptQueryParams(options));
    const page = unwrapPromptPage<PagePromptVO>(payload, 'Failed to load favorited prompts.');
    return toPromptPageResult<PagePromptVO, PromptVO, PromptLibraryRecord>(page, normalizePromptRecord);
  },

  async listPromptHistory(options: PromptHistoryQueryOptions = {}): Promise<PromptPageResult<PromptHistoryRecord>> {
    const client = getPromptClient(options.instance);
    const payload = await client.prompt.listPromptHistory?.(toPromptQueryParams(options));
    const page = unwrapPromptPage<PagePromptHistoryVO>(payload, 'Failed to load prompt history.');
    return toPromptPageResult<PagePromptHistoryVO, PromptHistoryVO, PromptHistoryRecord>(page, normalizePromptHistoryRecord);
  },

  async getPromptHistoryDetail(id: string | number, instance?: ScopedSdkInstance): Promise<PromptHistoryRecord> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.getPromptHistoryDetail?.(id);
    const record = unwrapPromptPage<PromptHistoryVO>(payload, 'Failed to load prompt history detail.');
    return normalizePromptHistoryRecord(record);
  },

  async usePrompt(id: string | number, instance?: ScopedSdkInstance): Promise<void> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.use?.(id);
    assertPromptApiSuccess(payload as PromptApiEnvelope<unknown>, 'Failed to mark prompt as used.');
  },

  async favoritePrompt(id: string | number, instance?: ScopedSdkInstance): Promise<void> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.favorite?.(id);
    assertPromptApiSuccess(payload as PromptApiEnvelope<unknown>, 'Failed to favorite prompt.');
  },

  async unfavoritePrompt(id: string | number, instance?: ScopedSdkInstance): Promise<void> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.unfavorite?.(id);
    assertPromptApiSuccess(payload as PromptApiEnvelope<unknown>, 'Failed to unfavorite prompt.');
  },

  async createPrompt(body: PromptCreateForm, instance?: ScopedSdkInstance): Promise<PromptLibraryRecord> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.createPrompt?.(body);
    const record = unwrapPromptPage<PromptVO>(payload, 'Failed to create prompt.');
    return normalizePromptRecord(record);
  },

  async updatePrompt(id: string | number, body: PromptUpdateForm, instance?: ScopedSdkInstance): Promise<PromptLibraryRecord> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.updatePrompt?.(id, body);
    const record = unwrapPromptPage<PromptVO>(payload, 'Failed to update prompt.');
    return normalizePromptRecord(record);
  },

  async deletePrompt(id: string | number, instance?: ScopedSdkInstance): Promise<void> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.deletePrompt?.(id);
    assertPromptApiSuccess(payload as PromptApiEnvelope<unknown>, 'Failed to delete prompt.');
  },

  async deletePromptHistory(id: string | number, instance?: ScopedSdkInstance): Promise<void> {
    const client = getPromptClient(instance);
    const payload = await client.prompt.deletePromptHistory?.(id);
    assertPromptApiSuccess(payload as PromptApiEnvelope<unknown>, 'Failed to delete prompt history.');
  },
};
