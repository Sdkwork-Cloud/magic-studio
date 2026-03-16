import { generateUUID } from '@sdkwork/react-commons';

import type { AudioEffectConfig } from '../../entities/magicCut.entity';
import {
  DEFAULT_COMPRESSOR,
  DEFAULT_EQ,
  DEFAULT_LIMITER,
  DEFAULT_NOISE_GATE,
} from '../../services/audio/AudioEffectTypes';

export type AudioEnhancementId = 'denoise' | 'normalize';
export type EqBandKey = 'lowGain' | 'midGain' | 'highGain';

const DENOISE_PRESET_ID = 'magiccut-denoise';
const NORMALIZE_PRESET_ID = 'magiccut-normalize';
const EQ_PRESET_ID = 'magiccut-eq';

type ManagedAudioEffect = AudioEffectConfig & {
  params: Record<string, unknown> & {
    enabled: boolean;
    bypass: boolean;
    presetId?: string;
  };
};

const DENOISE_PRESET: ManagedAudioEffect[] = [
  {
    id: DENOISE_PRESET_ID,
    type: 'noiseGate',
    enabled: true,
    params: {
      ...DEFAULT_NOISE_GATE,
      threshold: -48,
      release: 0.08,
      presetId: DENOISE_PRESET_ID,
    },
  },
];

const NORMALIZE_PRESET: ManagedAudioEffect[] = [
  {
    id: `${NORMALIZE_PRESET_ID}-compressor`,
    type: 'compressor',
    enabled: true,
    params: {
      ...DEFAULT_COMPRESSOR,
      threshold: -18,
      ratio: 3,
      makeupGain: 3,
      presetId: NORMALIZE_PRESET_ID,
    },
  },
  {
    id: `${NORMALIZE_PRESET_ID}-limiter`,
    type: 'limiter',
    enabled: true,
    params: {
      ...DEFAULT_LIMITER,
      threshold: -1,
      presetId: NORMALIZE_PRESET_ID,
    },
  },
];

const EQ_DEFAULT_EFFECT: ManagedAudioEffect = {
  id: EQ_PRESET_ID,
  type: 'eq',
  enabled: true,
  params: {
    ...DEFAULT_EQ,
    presetId: EQ_PRESET_ID,
  },
};

const cloneManagedEffect = (effect: ManagedAudioEffect): AudioEffectConfig => ({
  ...effect,
  id: generateUUID(),
  params: { ...effect.params },
});

const PRESETS: Record<AudioEnhancementId, ManagedAudioEffect[]> = {
  denoise: DENOISE_PRESET,
  normalize: NORMALIZE_PRESET,
};

function hasPresetId(effect: AudioEffectConfig, presetId: string): boolean {
  return (effect.params as Record<string, unknown> | undefined)?.presetId === presetId;
}

function isEffectActive(effect: AudioEffectConfig): boolean {
  const params = (effect.params || {}) as Record<string, unknown>;
  return params.enabled !== false && params.bypass !== true;
}

function filterManagedPreset(
  effects: AudioEffectConfig[],
  presetId: string
): AudioEffectConfig[] {
  return effects.filter((effect) => !hasPresetId(effect, presetId));
}

export function resolveAudioEnhancementActive(
  effects: AudioEffectConfig[] | undefined,
  enhancement: AudioEnhancementId
): boolean {
  const presetId = enhancement === 'denoise' ? DENOISE_PRESET_ID : NORMALIZE_PRESET_ID;
  return (effects || []).some((effect) => hasPresetId(effect, presetId) && isEffectActive(effect));
}

export function toggleAudioEnhancement(
  effects: AudioEffectConfig[] | undefined,
  enhancement: AudioEnhancementId
): AudioEffectConfig[] {
  const current = effects || [];
  const presetId = enhancement === 'denoise' ? DENOISE_PRESET_ID : NORMALIZE_PRESET_ID;

  if (resolveAudioEnhancementActive(current, enhancement)) {
    return filterManagedPreset(current, presetId);
  }

  return [...filterManagedPreset(current, presetId), ...PRESETS[enhancement].map(cloneManagedEffect)];
}

export function resolveEqSettings(effects: AudioEffectConfig[] | undefined) {
  const effect = (effects || []).find((item) => hasPresetId(item, EQ_PRESET_ID) || item.type === 'eq');
  const params = {
    ...DEFAULT_EQ,
    ...((effect?.params || {}) as Record<string, number | boolean>),
  };

  return {
    enabled: effect ? isEffectActive(effect) : false,
    lowGain: Number(params.lowGain ?? DEFAULT_EQ.lowGain),
    midGain: Number(params.midGain ?? DEFAULT_EQ.midGain),
    highGain: Number(params.highGain ?? DEFAULT_EQ.highGain),
  };
}

export function setEqEnabled(
  effects: AudioEffectConfig[] | undefined,
  enabled: boolean
): AudioEffectConfig[] {
  const current = effects || [];
  const withoutManagedEq = filterManagedPreset(current, EQ_PRESET_ID).filter((effect) => effect.type !== 'eq');

  if (!enabled) {
    return withoutManagedEq;
  }

  return [...withoutManagedEq, cloneManagedEffect(EQ_DEFAULT_EFFECT)];
}

export function updateEqBandGain(
  effects: AudioEffectConfig[] | undefined,
  band: EqBandKey,
  value: number
): AudioEffectConfig[] {
  const current = effects || [];
  const existingEq = current.find((effect) => hasPresetId(effect, EQ_PRESET_ID) || effect.type === 'eq');
  const nextEq: AudioEffectConfig = {
    ...(existingEq || cloneManagedEffect(EQ_DEFAULT_EFFECT)),
    type: 'eq',
    enabled: true,
    params: {
      ...DEFAULT_EQ,
      ...((existingEq?.params || {}) as Record<string, unknown>),
      enabled: true,
      bypass: false,
      presetId: EQ_PRESET_ID,
      [band]: value,
    },
  };

  return [
    ...current.filter((effect) => effect !== existingEq && !hasPresetId(effect, EQ_PRESET_ID) && effect.type !== 'eq'),
    nextEq,
  ];
}

export function resetEqSettings(effects: AudioEffectConfig[] | undefined): AudioEffectConfig[] {
  return setEqEnabled(effects, true);
}
