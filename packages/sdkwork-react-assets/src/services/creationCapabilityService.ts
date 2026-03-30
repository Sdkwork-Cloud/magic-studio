import type { ModelProvider } from '@sdkwork/react-commons';
import type { StyleOption } from '../components/CreationChatInput/StyleSelector';
import type { PortalTab } from '../components/CreationChatInput/types';
import { getSdkworkClient } from '@sdkwork/react-core';

export type CreationCapabilityTarget = PortalTab;

interface CreationOptionLike {
  value?: string | null;
  label?: string | null;
  description?: string | null;
}

interface CreationModelCapabilitiesLike {
  supportsReasoning?: boolean;
  supportsMultimodal?: boolean;
  supportsFunctionCall?: boolean;
  durationOptions?: CreationOptionLike[] | null;
  resolutionOptions?: CreationOptionLike[] | null;
  aspectRatioOptions?: CreationOptionLike[] | null;
}

interface CreationModelLike {
  model?: string | null;
  name?: string | null;
  description?: string | null;
  capabilities?: CreationModelCapabilitiesLike | null;
}

interface CreationChannelLike {
  channel?: string | null;
  name?: string | null;
  models?: CreationModelLike[] | null;
}

interface CreationStyleAssetLike {
  url?: string | null;
  type?: string | null;
}

interface CreationStyleAssetGroupLike {
  scene?: CreationStyleAssetLike | null;
  portrait?: CreationStyleAssetLike | null;
  sheet?: CreationStyleAssetLike | null;
  video?: CreationStyleAssetLike | null;
}

interface CreationStyleOptionLike {
  id?: string | null;
  label?: string | null;
  description?: string | null;
  usage?: string[] | null;
  prompt?: string | null;
  promptZh?: string | null;
  custom?: boolean | null;
  previewColor?: string | null;
  assets?: CreationStyleAssetGroupLike | null;
}

interface CreationCapabilitiesLike {
  channels?: CreationChannelLike[] | null;
  styleOptions?: CreationStyleOptionLike[] | null;
}

interface CreationCapabilitiesResponseLike {
  code?: string | number | null;
  msg?: string | null;
  data?: CreationCapabilitiesLike | null;
}

interface CreationCapabilityModelApiLike {
  getCreationCapabilities?: (
    params: { target: CreationCapabilityTarget },
  ) => Promise<CreationCapabilitiesResponseLike | null | undefined>;
}

export interface CreationCapabilitySnapshot {
  target: CreationCapabilityTarget;
  channels: CreationChannelLike[];
  styleOptions: StyleOption[];
}

export interface CreationEntryCapabilityOptions {
  aspectRatioOptions: Array<{ label: string; value: string }>;
  resolutionOptions: Array<{ label: string; value: string }>;
  durationOptions: Array<{ label: string; value: string }>;
}

const SUCCESS_CODE = '2000';
const APP_SDK_AUTH_TOKEN_STORAGE_KEY = 'sdkwork_token';
const AUTHORIZATION_ERROR_PATTERN = /(unauthorized|forbidden|unauthenticated|not login|not logged in|未登录|无权限|权限不足|未授权|禁止访问)/i;
const DEFAULT_VISUAL_ASPECT_RATIO_OPTIONS = [
  { label: '21:9', value: '21:9' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '4:3', value: '4:3' },
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '2:3', value: '2:3' },
  { label: '9:16', value: '9:16' },
] as const;
const DEFAULT_ENTRY_RESOLUTION_OPTIONS = [
  { label: '2K', value: '2k' },
  { label: '4K', value: '4k' },
] as const;
const DEFAULT_ENTRY_DURATION_OPTIONS = [
  { label: '5s', value: '5s' },
  { label: '10s', value: '10s' },
  { label: '15s', value: '15s' },
  { label: '60s', value: '60s' },
] as const;
const DEFAULT_SHORT_DRAMA_STYLE_OPTIONS: ReadonlyArray<StyleOption> = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Movie-grade lighting, contrast, and dramatic depth.',
    prompt: 'cinematic lighting, dramatic contrast, depth of field, color graded, film still',
    prompt_zh: '电影级光影、戏剧反差、景深效果、专业调色、电影感定格',
    previewColor: '#d97706',
  },
  {
    id: 'realistic',
    label: 'Realistic',
    description: 'Natural lighting, grounded composition, and believable detail.',
    prompt: 'realistic scene, natural lighting, lifelike textures, grounded cinematic framing',
    prompt_zh: '真实场景、自然光照、逼真材质、稳重电影构图',
    previewColor: '#2563eb',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Stylized animation language with expressive color and clean silhouettes.',
    prompt: 'anime style, expressive color palette, crisp linework, dynamic composition',
    prompt_zh: '动漫风格、鲜明配色、清晰线条、富有张力的构图',
    previewColor: '#db2777',
  },
  {
    id: 'documentary',
    label: 'Documentary',
    description: 'Observed realism with restrained grading and authentic atmosphere.',
    prompt: 'documentary realism, observational camera, authentic atmosphere, restrained color grading',
    prompt_zh: '纪录片质感、观察式镜头、真实氛围、克制调色',
    previewColor: '#059669',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Do not apply a preset. Generate directly from the prompt.',
    prompt: '',
    prompt_zh: '',
    isCustom: true,
    previewColor: '#6b7280',
  },
] as const;
const capabilityRequestCache = new Map<string, Promise<CreationCapabilitySnapshot>>();

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeErrorCode(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    return value.trim().toUpperCase();
  }
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isAuthorizationError(error: unknown, depth: number = 0): boolean {
  if (depth > 2 || error == null) {
    return false;
  }

  if (typeof error === 'string') {
    return AUTHORIZATION_ERROR_PATTERN.test(error);
  }

  if (error instanceof Error && AUTHORIZATION_ERROR_PATTERN.test(error.message)) {
    return true;
  }

  if (!isRecord(error)) {
    return false;
  }

  const httpStatus = normalizeErrorCode(error.httpStatus);
  if (httpStatus === '401' || httpStatus === '403') {
    return true;
  }

  const errorCodes = [
    normalizeErrorCode(error.code),
    normalizeErrorCode(error.businessCode),
    normalizeErrorCode(error.errorCode),
  ];
  if (errorCodes.some((code) => ['401', '4010', '403', '4030', 'UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'NO_RIGHT'].includes(code))) {
    return true;
  }

  const errorMessage = normalizeText(error.message) || normalizeText(error.msg) || normalizeText(error.error);
  if (AUTHORIZATION_ERROR_PATTERN.test(errorMessage)) {
    return true;
  }

  return isAuthorizationError(error.cause, depth + 1);
}

function readCapabilityCacheScope(): 'anonymous' | 'authenticated' {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  try {
    const authToken = window.localStorage.getItem(APP_SDK_AUTH_TOKEN_STORAGE_KEY);
    return normalizeText(authToken) ? 'authenticated' : 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function getCapabilityCacheKey(target: CreationCapabilityTarget): string {
  return `${target}:${readCapabilityCacheScope()}`;
}

function createEmptyCreationCapabilitySnapshot(
  target: CreationCapabilityTarget,
): CreationCapabilitySnapshot {
  return {
    target,
    channels: [],
    styleOptions: [],
  };
}

function normalizeOption(option?: CreationOptionLike | null): CreationOptionLike | null {
  if (!option) {
    return null;
  }
  const value = normalizeText(option.value);
  if (!value) {
    return null;
  }
  const label = normalizeText(option.label) || value;
  const description = normalizeText(option.description) || undefined;
  return {
    value,
    label,
    description,
  };
}

function normalizeChannel(channel?: CreationChannelLike | null): CreationChannelLike | null {
  if (!channel) {
    return null;
  }
  const channelCode = normalizeText(channel.channel);
  const models = Array.isArray(channel.models)
    ? channel.models.filter((model): model is CreationModelLike => Boolean(normalizeText(model?.model)))
    : [];
  if (!channelCode || models.length === 0) {
    return null;
  }
  return {
    ...channel,
    channel: channelCode,
    name: normalizeText(channel.name) || channelCode,
    models,
  };
}

function normalizeStyleOption(style?: CreationStyleOptionLike | null): StyleOption | null {
  if (!style) {
    return null;
  }
  const id = normalizeText(style.id);
  if (!id) {
    return null;
  }
  return {
    id,
    label: normalizeText(style.label) || id,
    description: normalizeText(style.description) || undefined,
    usage: Array.isArray(style.usage) ? style.usage.filter(Boolean) : undefined,
    prompt: normalizeText(style.prompt) || undefined,
    prompt_zh: normalizeText(style.promptZh) || undefined,
    isCustom: Boolean(style.custom),
    previewColor: normalizeText(style.previewColor) || undefined,
    assets: style.assets
      ? {
          scene: style.assets.scene?.url ? { url: style.assets.scene.url, type: style.assets.scene.type as 'image' | 'video' | undefined } : undefined,
          portrait: style.assets.portrait?.url ? { url: style.assets.portrait.url, type: style.assets.portrait.type as 'image' | 'video' | undefined } : undefined,
          sheet: style.assets.sheet?.url ? { url: style.assets.sheet.url, type: style.assets.sheet.type as 'image' | 'video' | undefined } : undefined,
          video: style.assets.video?.url ? { url: style.assets.video.url, type: style.assets.video.type as 'image' | 'video' | undefined } : undefined,
        }
      : undefined,
  };
}

function unwrapCapabilitiesResponse(
  response: CreationCapabilitiesResponseLike | null | undefined,
  target: CreationCapabilityTarget,
): CreationCapabilitySnapshot {
  if (!response) {
    throw new Error(`Failed to load creation capabilities for ${target}.`);
  }
  const code = typeof response.code === 'number' ? String(response.code) : normalizeText(response.code);
  if (code && code !== SUCCESS_CODE) {
    throw new Error(normalizeText(response.msg) || `Failed to load creation capabilities for ${target}.`);
  }
  const data = response.data;
  const channels = Array.isArray(data?.channels)
    ? data.channels
        .map((channel: CreationChannelLike) => normalizeChannel(channel))
        .filter((channel): channel is CreationChannelLike => Boolean(channel))
    : [];
  const styleOptions = Array.isArray(data?.styleOptions)
    ? data.styleOptions
        .map((style: CreationStyleOptionLike) => normalizeStyleOption(style))
        .filter((style): style is StyleOption => Boolean(style))
    : [];

  return {
    target,
    channels,
    styleOptions,
  };
}

export async function fetchCreationCapabilities(
  target: CreationCapabilityTarget,
): Promise<CreationCapabilitySnapshot> {
  const cacheKey = getCapabilityCacheKey(target);
  const cached = capabilityRequestCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = Promise.resolve().then(async () => {
    const modelApi = getSdkworkClient().model as unknown as CreationCapabilityModelApiLike;
    if (typeof modelApi.getCreationCapabilities !== 'function') {
      return createEmptyCreationCapabilitySnapshot(target);
    }

    const response = await modelApi.getCreationCapabilities({ target });
    return unwrapCapabilitiesResponse(response, target);
  }).catch((error) => {
    if (isAuthorizationError(error)) {
      // Anonymous users can still enter the creation surfaces with shared defaults.
      return createEmptyCreationCapabilitySnapshot(target);
    }
    capabilityRequestCache.delete(cacheKey);
    throw error;
  });

  capabilityRequestCache.set(cacheKey, request);
  return request;
}

export function clearCreationCapabilityCache(target?: CreationCapabilityTarget): void {
  if (target) {
    const prefix = `${target}:`;
    Array.from(capabilityRequestCache.keys())
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => capabilityRequestCache.delete(key));
    return;
  }
  capabilityRequestCache.clear();
}

export function flattenCreationModels(
  snapshot: CreationCapabilitySnapshot,
): CreationModelLike[] {
  return snapshot.channels.flatMap((channel) => channel.models || []);
}

export function findCreationModel(
  snapshot: CreationCapabilitySnapshot,
  model: string,
): CreationModelLike | undefined {
  const normalized = normalizeText(model);
  if (!normalized) {
    return undefined;
  }
  return flattenCreationModels(snapshot).find((item) => normalizeText(item.model) === normalized);
}

export function normalizeCreationOptions(
  options?: CreationOptionLike[] | null,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option: CreationOptionLike) => normalizeOption(option))
    .filter((option): option is CreationOptionLike => Boolean(option))
    .map((option) => ({
      label: option.label || option.value || '',
      value: option.value || '',
    }))
    .filter((option) => option.value);
}

function cloneSelectionOptions(
  options: ReadonlyArray<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  return options.map((option) => ({
    label: option.label,
    value: option.value,
  }));
}

function cloneStyleOptions(
  options: ReadonlyArray<StyleOption>,
): StyleOption[] {
  return options.map((option) => ({
    ...option,
    usage: Array.isArray(option.usage) ? [...option.usage] : option.usage,
    assets: option.assets
      ? {
          scene: option.assets.scene ? { ...option.assets.scene } : undefined,
          portrait: option.assets.portrait ? { ...option.assets.portrait } : undefined,
          sheet: option.assets.sheet ? { ...option.assets.sheet } : undefined,
          video: option.assets.video ? { ...option.assets.video } : undefined,
        }
      : undefined,
  }));
}

function getDefaultCreationStyleOptions(
  target: CreationCapabilityTarget,
): StyleOption[] {
  if (target === 'short_drama') {
    return cloneStyleOptions(DEFAULT_SHORT_DRAMA_STYLE_OPTIONS);
  }
  return [];
}

export function resolveCreationStyleOptions(
  snapshot: CreationCapabilitySnapshot,
): StyleOption[] {
  if (snapshot.styleOptions.length > 0) {
    return snapshot.styleOptions;
  }
  return getDefaultCreationStyleOptions(snapshot.target);
}

function toBadge(model: CreationModelLike): { badge?: string; badgeColor?: string } {
  const capability = model.capabilities;
  if (capability?.supportsReasoning) {
    return { badge: 'Reasoning', badgeColor: 'bg-amber-500' };
  }
  if (capability?.supportsMultimodal) {
    return { badge: 'Multi', badgeColor: 'bg-blue-500' };
  }
  if (capability?.supportsFunctionCall) {
    return { badge: 'Tools', badgeColor: 'bg-emerald-500' };
  }
  return {};
}

export function toCreationModelProviders(
  snapshot: CreationCapabilitySnapshot,
): ModelProvider[] {
  return snapshot.channels
    .filter((channel) => Array.isArray(channel.models) && channel.models.length > 0)
    .map((channel) => ({
      id: normalizeText(channel.channel || channel.name || 'channel').toLowerCase(),
      name: normalizeText(channel.name) || normalizeText(channel.channel) || 'Channel',
      icon: null,
      models: (channel.models || [])
        .filter((model): model is CreationModelLike => Boolean(normalizeText(model?.model)))
        .map((model) => {
          const badge = toBadge(model);
          return {
            id: normalizeText(model.model),
            name: normalizeText(model.name) || normalizeText(model.model),
            description: normalizeText(model.description) || undefined,
            badge: badge.badge,
            badgeColor: badge.badgeColor,
          };
        }),
    }))
    .filter((provider) => provider.models.length > 0);
}

export async function fetchCreationModelProviders(
  target: CreationCapabilityTarget,
  fallbackProviders: ModelProvider[] = [],
): Promise<ModelProvider[]> {
  try {
    const snapshot = await fetchCreationCapabilities(target);
    const providers = toCreationModelProviders(snapshot);
    if (providers.length > 0) {
      return providers;
    }
  } catch (error) {
    if (fallbackProviders.length === 0) {
      throw error;
    }
  }
  return fallbackProviders;
}

export function getCreationModelDurationOptions(
  snapshot: CreationCapabilitySnapshot,
  model: string,
): Array<{ label: string; value: string }> {
  return normalizeCreationOptions(
    findCreationModel(snapshot, model)?.capabilities?.durationOptions,
  );
}

export function getCreationModelResolutionOptions(
  snapshot: CreationCapabilitySnapshot,
  model: string,
): Array<{ label: string; value: string }> {
  return normalizeCreationOptions(
    findCreationModel(snapshot, model)?.capabilities?.resolutionOptions,
  );
}

export function getCreationModelAspectRatioOptions(
  snapshot: CreationCapabilitySnapshot,
  model: string,
): Array<{ label: string; value: string }> {
  return normalizeCreationOptions(
    findCreationModel(snapshot, model)?.capabilities?.aspectRatioOptions,
  );
}

export function resolveCreationEntryCapabilityOptions(
  snapshot: CreationCapabilitySnapshot,
  model: string,
): CreationEntryCapabilityOptions {
  const aspectRatioOptions = getCreationModelAspectRatioOptions(snapshot, model);
  const resolutionOptions = getCreationModelResolutionOptions(snapshot, model);
  const durationOptions = getCreationModelDurationOptions(snapshot, model);

  return {
    aspectRatioOptions: aspectRatioOptions.length > 0
      ? aspectRatioOptions
      : cloneSelectionOptions(DEFAULT_VISUAL_ASPECT_RATIO_OPTIONS),
    resolutionOptions: resolutionOptions.length > 0
      ? resolutionOptions
      : cloneSelectionOptions(DEFAULT_ENTRY_RESOLUTION_OPTIONS),
    durationOptions: durationOptions.length > 0
      ? durationOptions
      : cloneSelectionOptions(DEFAULT_ENTRY_DURATION_OPTIONS),
  };
}
