import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { resolveRuntimeMagicStudioAssetUrl } from '@sdkwork/magic-studio-core/storage';

export const resolveGenerationHistoryAssetUrl = async (
  source: unknown
): Promise<string | null> => {
  const rawValue = typeof source === 'string'
    ? source
    : (
        source &&
        typeof source === 'object' &&
        (
          ('url' in source && typeof source.url === 'string' && source.url) ||
          ('path' in source && typeof source.path === 'string' && source.path)
        )
      ) || '';
  const candidate = String(rawValue ?? '').trim();
  if (!candidate) {
    return null;
  }

  try {
    return await resolveRuntimeMagicStudioAssetUrl(getPlatformRuntime(), candidate);
  } catch {
    return null;
  }
};
