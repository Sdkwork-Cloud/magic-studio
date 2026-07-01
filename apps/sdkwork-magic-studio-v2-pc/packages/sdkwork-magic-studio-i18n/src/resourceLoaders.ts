import type { Locale, TranslationResource } from './types.ts';

type TranslationResourceModule = {
  default: TranslationResource;
};

const BASE_RESOURCE_LOADERS: Record<Locale, () => Promise<TranslationResourceModule>> = {
  'en-US': () => import('./resources/en'),
  'zh-CN': () => import('./resources/zh-CN'),
};

const baseResourceCache = new Map<Locale, TranslationResource>();
const baseResourcePromises = new Map<Locale, Promise<TranslationResource>>();

export const loadBaseResource = async (locale: Locale): Promise<TranslationResource> => {
  const cachedResource = baseResourceCache.get(locale);
  if (cachedResource) {
    return cachedResource;
  }

  const inFlightPromise = baseResourcePromises.get(locale);
  if (inFlightPromise) {
    return inFlightPromise;
  }

  const loadPromise = BASE_RESOURCE_LOADERS[locale]()
    .then((module) => {
      baseResourceCache.set(locale, module.default);
      baseResourcePromises.delete(locale);
      return module.default;
    })
    .catch((error) => {
      baseResourcePromises.delete(locale);
      throw error;
    });

  baseResourcePromises.set(locale, loadPromise);
  return loadPromise;
};
