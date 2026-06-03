import type { ModelProvider } from '@sdkwork/magic-studio-types/infrastructure';
import type { StyleAsset, StyleOption } from '../components/CreationChatInput/StyleSelector';
import type { PortalTab } from '../components/CreationChatInput/types';
import type {
  MagicStudioApiEnvelope,
  MagicStudioCreationCapabilities,
  MagicStudioCreationChannel,
  MagicStudioCreationModel,
  MagicStudioCreationModelCapabilities,
  MagicStudioCreationOption,
  MagicStudioCreationStyleAsset,
  MagicStudioCreationStyleAssetGroup,
  MagicStudioCreationStyleOption,
} from '@sdkwork/magic-studio-server';
import { getCreationServerClient } from './creationServerClient';

export type CreationCapabilityTarget = PortalTab;

export type CreationCapabilityOption = MagicStudioCreationOption;
export type CreationCapabilityModelCapabilities = MagicStudioCreationModelCapabilities;
export type CreationCapabilityModel = MagicStudioCreationModel;
export type CreationCapabilityChannel = MagicStudioCreationChannel;
export type CreationCapabilityStyleAsset = MagicStudioCreationStyleAsset;
export type CreationCapabilityStyleAssetGroup = MagicStudioCreationStyleAssetGroup;
export type CreationCapabilityStyle = MagicStudioCreationStyleOption;

export interface CreationCapabilitySnapshot {
  target: CreationCapabilityTarget;
  channels: CreationCapabilityChannel[];
  styleOptions: StyleOption[];
}

export interface CreationEntryCapabilityOptions {
  aspectRatioOptions: Array<{ label: string; value: string }>;
  resolutionOptions: Array<{ label: string; value: string }>;
  durationOptions: Array<{ label: string; value: string }>;
}

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
const capabilityRequestCache = new Map<CreationCapabilityTarget, Promise<CreationCapabilitySnapshot>>();

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function normalizeOption(
  option?: CreationCapabilityOption | null,
): CreationCapabilityOption | null {
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

function normalizeChannel(
  channel?: CreationCapabilityChannel | null,
): CreationCapabilityChannel | null {
  if (!channel) {
    return null;
  }
  const channelCode = normalizeText(channel.channel);
  const models = Array.isArray(channel.models)
    ? channel.models.filter(
        (model): model is CreationCapabilityModel =>
          Boolean(normalizeText(model?.model)),
      )
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

function normalizeStyleOption(style?: CreationCapabilityStyle | null): StyleOption | null {
  if (!style) {
    return null;
  }
  const id = normalizeText(style.id);
  if (!id) {
    return null;
  }
  const normalizeStyleAsset = (
    asset?: CreationCapabilityStyleAsset | null,
  ): StyleAsset | undefined => {
    if (!asset) {
      return undefined;
    }
    const path = normalizeText(asset.path) || undefined;
    const url = normalizeText(asset.url) || undefined;
    if (!path && !url) {
      return undefined;
    }
    return {
      path,
      url,
      type: asset.type as 'image' | 'video' | undefined,
    };
  };
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
          scene: normalizeStyleAsset(style.assets.scene),
          portrait: normalizeStyleAsset(style.assets.portrait),
          sheet: normalizeStyleAsset(style.assets.sheet),
          video: normalizeStyleAsset(style.assets.video),
        }
      : undefined,
  };
}

function unwrapCapabilitiesResponse(
  response: MagicStudioApiEnvelope<MagicStudioCreationCapabilities> | null | undefined,
  target: CreationCapabilityTarget,
): CreationCapabilitySnapshot {
  const data = response?.data;
  if (!data) {
    throw new Error(`Failed to load creation capabilities for ${target}.`);
  }
  const channels = Array.isArray(data?.channels)
    ? data.channels
        .map((channel) => normalizeChannel(channel))
        .filter((channel): channel is CreationCapabilityChannel => Boolean(channel))
    : [];
  const styleOptions = Array.isArray(data?.styleOptions)
    ? data.styleOptions
        .map((style) => normalizeStyleOption(style))
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
  const cached = capabilityRequestCache.get(target);
  if (cached) {
    return cached;
  }

  const request = getCreationServerClient()
    .readCreationCapabilities({ target })
    .then((response) => unwrapCapabilitiesResponse(response, target))
    .catch((error) => {
      capabilityRequestCache.delete(target);
      throw error;
    });

  capabilityRequestCache.set(target, request);
  return request;
}

export function clearCreationCapabilityCache(target?: CreationCapabilityTarget): void {
  if (target) {
    capabilityRequestCache.delete(target);
    return;
  }
  capabilityRequestCache.clear();
}

export function flattenCreationModels(
  snapshot: CreationCapabilitySnapshot,
): CreationCapabilityModel[] {
  return snapshot.channels.flatMap((channel) => channel.models || []);
}

export function findCreationModel(
  snapshot: CreationCapabilitySnapshot,
  model: string,
): CreationCapabilityModel | undefined {
  const normalized = normalizeText(model);
  if (!normalized) {
    return undefined;
  }
  return flattenCreationModels(snapshot).find((item) => normalizeText(item.model) === normalized);
}

export function normalizeCreationOptions(
  options?: CreationCapabilityOption[] | null,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => normalizeOption(option))
    .filter((option): option is CreationCapabilityOption => Boolean(option))
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

function toBadge(model: CreationCapabilityModel): { badge?: string; badgeColor?: string } {
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
        .filter(
          (model): model is CreationCapabilityModel =>
            Boolean(normalizeText(model?.model)),
        )
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
): Promise<ModelProvider[]> {
  const snapshot = await fetchCreationCapabilities(target);
  return toCreationModelProviders(snapshot);
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
