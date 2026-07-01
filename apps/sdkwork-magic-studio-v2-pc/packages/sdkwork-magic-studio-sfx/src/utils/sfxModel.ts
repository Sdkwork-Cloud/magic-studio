import type { SfxModelType } from '../entities';

export const SFX_CANONICAL_MODEL_IDS = [
  'eleven-labs-sfx',
  'audioldm-2',
  'tango',
] as const satisfies readonly SfxModelType[];

export const DEFAULT_SFX_MODEL: SfxModelType = 'eleven-labs-sfx';

const SFX_MODEL_SET = new Set<string>(SFX_CANONICAL_MODEL_IDS);

export function normalizeSfxModel(
  value: unknown,
  fallback: SfxModelType = DEFAULT_SFX_MODEL,
): SfxModelType {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return SFX_MODEL_SET.has(normalized)
    ? (normalized as SfxModelType)
    : fallback;
}
