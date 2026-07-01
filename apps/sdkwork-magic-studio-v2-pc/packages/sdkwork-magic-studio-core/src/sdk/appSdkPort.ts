import type {
  SdkworkAppClient as CoreSdkworkAppClient,
  SdkworkAppConfig,
} from '@sdkwork/core-pc-react/app';

export type { SdkworkAppConfig };

export type SdkworkResourceModule = Record<string, unknown>;

export interface QueryParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  bizType?: string;
  orderBy?: string;
  orderDirection?: string;
  success?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface PromptCreateForm {
  title?: string;
  content?: string;
  description?: string;
  type?: string;
  bizType?: string;
  enabled?: boolean;
  isPublic?: boolean;
  parameters?: Record<string, unknown>;
  tags?: unknown;
  model?: string;
  [key: string]: unknown;
}

export interface PromptUpdateForm extends Partial<PromptCreateForm> {
  [key: string]: unknown;
}

export interface PromptVO {
  id?: string | number;
  title?: string;
  content?: string;
  description?: string;
  type?: string;
  bizType?: string;
  enabled?: boolean | string | number;
  isFavorite?: boolean | string | number;
  isPublic?: boolean | string | number;
  favoriteCount?: number | string;
  usageCount?: number | string;
  avgResponseTime?: number | string;
  version?: string;
  parameters?: Record<string, unknown>;
  tags?: unknown;
  model?: string;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PromptHistoryVO {
  id?: string | number;
  promptId?: string | number;
  promptTitle?: string;
  promptContent?: string;
  usedContent?: string;
  responseContent?: string;
  model?: string;
  duration?: number | string;
  inputTokens?: number | string;
  outputTokens?: number | string;
  success?: boolean | string | number;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface SdkworkPage<TItem> {
  content?: TItem[];
  totalElements?: number | string;
  size?: number | string;
  number?: number | string;
  [key: string]: unknown;
}

export type PagePromptVO = SdkworkPage<PromptVO>;
export type PagePromptHistoryVO = SdkworkPage<PromptHistoryVO>;

export interface AppSdkCoverPromptSuggestionsRequest {
  context: string;
  count?: number;
  language?: string;
  styleHints?: string[];
}

export interface AppSdkCoverPromptSuggestionsResponse {
  code?: number | string;
  data?: {
    prompts?: string[];
  };
  message?: string;
  msg?: string;
}

export interface AppSdkEnhanceGenerationPromptRequest {
  prompt: string;
  scene?: string;
  style?: string;
  language?: string;
  maxWords?: number;
  [key: string]: unknown;
}

export interface AppSdkEnhanceGenerationPromptResponse {
  code?: number | string;
  data?: {
    prompt?: string;
    [key: string]: unknown;
  };
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface MagicStudioGenerationModule extends SdkworkResourceModule {
  enhanceGenerationPrompt(
    request: AppSdkEnhanceGenerationPromptRequest,
  ): Promise<AppSdkEnhanceGenerationPromptResponse>;
}

export interface AppSdkGenerationModule extends MagicStudioGenerationModule {
  getCoverPromptSuggestions(
    request: AppSdkCoverPromptSuggestionsRequest,
  ): Promise<AppSdkCoverPromptSuggestionsResponse>;
}

export interface MagicStudioPromptModule extends SdkworkResourceModule {
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
}

export interface MagicStudioAppClient extends CoreSdkworkAppClient {
  readonly auth: SdkworkResourceModule;
  readonly user: SdkworkResourceModule;
  readonly generation: MagicStudioGenerationModule;
  readonly asset: SdkworkResourceModule;
  readonly note: SdkworkResourceModule;
  readonly project: SdkworkResourceModule;
  readonly history: SdkworkResourceModule;
  readonly upload: SdkworkResourceModule;
  readonly payment: SdkworkResourceModule;
  readonly vip: SdkworkResourceModule;
  readonly order: SdkworkResourceModule;
  readonly cart: SdkworkResourceModule;
  readonly coupon: SdkworkResourceModule;
  readonly favorite: SdkworkResourceModule;
  readonly social: SdkworkResourceModule;
  readonly notification: SdkworkResourceModule;
  readonly setting: SdkworkResourceModule;
  readonly search: SdkworkResourceModule;
  readonly model: SdkworkResourceModule;
  readonly prompt: MagicStudioPromptModule;
  readonly feedback: SdkworkResourceModule;
  readonly workspace: SdkworkResourceModule;
  readonly analytic: SdkworkResourceModule;
  readonly category: SdkworkResourceModule;
  readonly chat: SdkworkResourceModule;
}

export interface AppSdkClient extends Omit<MagicStudioAppClient, 'generation'> {
  readonly generation: AppSdkGenerationModule;
  readonly assets: MagicStudioAppClient['asset'];
  readonly notes: MagicStudioAppClient['note'];
  readonly projects: MagicStudioAppClient['project'];
  readonly payments: MagicStudioAppClient['payment'];
  readonly orders: MagicStudioAppClient['order'];
  readonly coupons: MagicStudioAppClient['coupon'];
  readonly settings: MagicStudioAppClient['setting'];
  readonly workspaces: MagicStudioAppClient['workspace'];
  readonly analytics: MagicStudioAppClient['analytic'];
}
