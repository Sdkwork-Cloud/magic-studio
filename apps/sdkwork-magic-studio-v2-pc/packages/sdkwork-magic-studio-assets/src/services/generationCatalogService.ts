import type { ModelProvider } from '@sdkwork/magic-studio-types/infrastructure';
import type {
  MagicStudioApiListEnvelope,
  MagicStudioGenerationCatalogModel,
  MagicStudioGenerationCatalogProvider,
  MagicStudioGenerationCatalogQuery,
  MagicStudioGenerationCatalogStyle,
  MagicStudioGenerationCatalogTarget,
  MagicStudioGenerationCatalogVoice,
  MagicStudioGenerationCatalogVoiceQuery,
} from '@sdkwork/magic-studio-server';

import type {
  StyleAsset,
  StyleOption,
} from '../components/CreationChatInput/StyleSelector';
import { getCreationServerClient } from './creationServerClient';

export type GenerationCatalogTarget = MagicStudioGenerationCatalogTarget;
export type GenerationCatalogQuery = MagicStudioGenerationCatalogQuery;
export type GenerationCatalogProvider = MagicStudioGenerationCatalogProvider;
export type GenerationCatalogModel = MagicStudioGenerationCatalogModel;
export type GenerationCatalogStyle = MagicStudioGenerationCatalogStyle;
export type GenerationCatalogVoice = MagicStudioGenerationCatalogVoice;
export type GenerationCatalogVoiceQuery = MagicStudioGenerationCatalogVoiceQuery;

const DEFAULT_GENERATION_CATALOG_TARGET: GenerationCatalogTarget = 'video';

const providerRequestCache = new Map<GenerationCatalogTarget, Promise<ModelProvider[]>>();
const modelRequestCache = new Map<GenerationCatalogTarget, Promise<GenerationCatalogModel[]>>();
const styleRequestCache = new Map<GenerationCatalogTarget, Promise<StyleOption[]>>();
const voiceRequestCache = new Map<string, Promise<GenerationCatalogVoice[]>>();

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function normalizeCatalogTarget(
  target?: GenerationCatalogTarget,
): GenerationCatalogTarget {
  const normalized = normalizeText(target);
  return (normalized || DEFAULT_GENERATION_CATALOG_TARGET) as GenerationCatalogTarget;
}

function normalizeProviderId(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/\s+/g, '-');
}

function unwrapListItems<T>(
  response: MagicStudioApiListEnvelope<T> | null | undefined,
): T[] {
  return Array.isArray(response?.items) ? response.items : [];
}

function toModelBadge(model: GenerationCatalogModel | GenerationCatalogProvider['models'][number]): {
  badge?: string;
  badgeColor?: string;
} {
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

function normalizeStyleAsset(
  asset?: NonNullable<GenerationCatalogStyle['assets']>['scene'] | null,
): StyleAsset | undefined {
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
}

function normalizeStyleOption(
  style?: GenerationCatalogStyle | null,
): StyleOption | null {
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
          scene: normalizeStyleAsset(style.assets.scene),
          portrait: normalizeStyleAsset(style.assets.portrait),
          sheet: normalizeStyleAsset(style.assets.sheet),
          video: normalizeStyleAsset(style.assets.video),
        }
      : undefined,
  };
}

export function toGenerationCatalogModelProviders(
  items: GenerationCatalogProvider[],
): ModelProvider[] {
  return items
    .map((provider) => ({
      id:
        normalizeProviderId(provider.id) ||
        normalizeProviderId(provider.name) ||
        'provider',
      name: normalizeText(provider.name) || normalizeText(provider.id) || 'Provider',
      icon: null,
      models: Array.isArray(provider.models)
        ? provider.models
            .filter((model) => Boolean(normalizeText(model?.id)))
            .map((model) => {
              const badge = toModelBadge(model);
              return {
                id: normalizeText(model.id),
                name: normalizeText(model.name) || normalizeText(model.id),
                description: normalizeText(model.description) || undefined,
                badge: badge.badge,
                badgeColor: badge.badgeColor,
              };
            })
        : [],
    }))
    .filter((provider) => provider.models.length > 0);
}

export function toGenerationCatalogStyleOptions(
  items: GenerationCatalogStyle[],
): StyleOption[] {
  return items
    .map((style) => normalizeStyleOption(style))
    .filter((style): style is StyleOption => Boolean(style));
}

export async function fetchGenerationCatalogModels(
  target: GenerationCatalogTarget,
): Promise<GenerationCatalogModel[]> {
  const normalizedTarget = normalizeCatalogTarget(target);
  const cached = modelRequestCache.get(normalizedTarget);
  if (cached) {
    return cached;
  }

  const request = getCreationServerClient()
    .listGenerationCatalogModels({ target: normalizedTarget })
    .then((response) => unwrapListItems(response))
    .catch((error) => {
      modelRequestCache.delete(normalizedTarget);
      throw error;
    });

  modelRequestCache.set(normalizedTarget, request);
  return request;
}

export async function fetchGenerationCatalogStyles(
  target: GenerationCatalogTarget,
): Promise<StyleOption[]> {
  const normalizedTarget = normalizeCatalogTarget(target);
  const cached = styleRequestCache.get(normalizedTarget);
  if (cached) {
    return cached;
  }

  const request = getCreationServerClient()
    .listGenerationCatalogStyles({ target: normalizedTarget })
    .then((response) => toGenerationCatalogStyleOptions(unwrapListItems(response)))
    .catch((error) => {
      styleRequestCache.delete(normalizedTarget);
      throw error;
    });

  styleRequestCache.set(normalizedTarget, request);
  return request;
}

export async function fetchGenerationCatalogProviders(
  target: GenerationCatalogTarget,
): Promise<ModelProvider[]> {
  const normalizedTarget = normalizeCatalogTarget(target);
  let request = providerRequestCache.get(normalizedTarget);
  if (!request) {
    request = getCreationServerClient()
      .listGenerationCatalogProviders({ target: normalizedTarget })
      .then((response) => toGenerationCatalogModelProviders(unwrapListItems(response)))
      .catch((error) => {
        providerRequestCache.delete(normalizedTarget);
        throw error;
      });

    providerRequestCache.set(normalizedTarget, request);
  }

  return request;
}

function buildVoiceCacheKey(query?: GenerationCatalogVoiceQuery): string {
  return JSON.stringify({
    source: normalizeText(query?.source) || '',
    keyword: normalizeText(query?.keyword) || '',
    language: normalizeText(query?.language) || '',
    gender: normalizeText(query?.gender) || '',
    style: normalizeText(query?.style) || '',
    provider: normalizeText(query?.provider) || '',
    page: query?.page ?? '',
    size: query?.size ?? '',
  });
}

export async function fetchGenerationCatalogVoices(
  query?: GenerationCatalogVoiceQuery,
): Promise<GenerationCatalogVoice[]> {
  const cacheKey = buildVoiceCacheKey(query);
  const cached = voiceRequestCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = getCreationServerClient()
    .listGenerationCatalogVoices(query)
    .then((response) => unwrapListItems(response))
    .catch((error) => {
      voiceRequestCache.delete(cacheKey);
      throw error;
    });

  voiceRequestCache.set(cacheKey, request);
  return request;
}

export function clearGenerationCatalogCache(
  target?: GenerationCatalogTarget,
): void {
  if (target) {
    const normalizedTarget = normalizeCatalogTarget(target);
    providerRequestCache.delete(normalizedTarget);
    modelRequestCache.delete(normalizedTarget);
    styleRequestCache.delete(normalizedTarget);
    voiceRequestCache.clear();
    return;
  }

  providerRequestCache.clear();
  modelRequestCache.clear();
  styleRequestCache.clear();
  voiceRequestCache.clear();
}
