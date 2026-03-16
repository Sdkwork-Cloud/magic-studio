import { describe, expect, it } from 'vitest';

import {
  resolveAudioEnhancementActive,
  resolveEqSettings,
  toggleAudioEnhancement,
  updateEqBandGain,
} from '../src/domain/audio/audioEffectState';

describe('toggleAudioEnhancement', () => {
  it('adds a managed noise gate preset when denoise is enabled', () => {
    const effects = toggleAudioEnhancement([], 'denoise');

    expect(resolveAudioEnhancementActive(effects, 'denoise')).toBe(true);
    expect(effects).toEqual([
      expect.objectContaining({
        type: 'noiseGate',
        params: expect.objectContaining({
          presetId: 'magiccut-denoise',
          enabled: true,
          bypass: false,
        }),
      }),
    ]);
  });

  it('adds managed compressor and limiter presets when loudness normalization is enabled', () => {
    const effects = toggleAudioEnhancement([], 'normalize');

    expect(resolveAudioEnhancementActive(effects, 'normalize')).toBe(true);
    expect(effects.map((effect) => effect.type)).toEqual(['compressor', 'limiter']);
    expect(effects.every((effect) => effect.params.presetId === 'magiccut-normalize')).toBe(true);
  });

  it('removes only managed normalize effects when normalization is disabled', () => {
    const manualLimiter = {
      id: 'manual-limiter',
      type: 'limiter' as const,
      enabled: true,
      params: {
        enabled: true,
        bypass: false,
        threshold: -0.5,
      },
    };

    const enabled = toggleAudioEnhancement([manualLimiter], 'normalize');
    const disabled = toggleAudioEnhancement(enabled, 'normalize');

    expect(disabled).toEqual([manualLimiter]);
  });
});

describe('updateEqBandGain', () => {
  it('creates a managed EQ effect and updates the requested gain band', () => {
    const effects = updateEqBandGain([], 'midGain', 4.5);

    expect(resolveEqSettings(effects)).toMatchObject({
      enabled: true,
      lowGain: 0,
      midGain: 4.5,
      highGain: 0,
    });
    expect(effects).toEqual([
      expect.objectContaining({
        type: 'eq',
        params: expect.objectContaining({
          presetId: 'magiccut-eq',
          midGain: 4.5,
        }),
      }),
    ]);
  });
});
