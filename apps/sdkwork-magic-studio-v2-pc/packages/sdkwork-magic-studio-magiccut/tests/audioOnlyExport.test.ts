import { describe, expect, it } from 'vitest';
import type { MagicStudioMagicCutRenderCapabilities } from '@sdkwork/magic-studio-host-types';

import {
  estimateAudioOnlyExportSizeMb,
  isAudioOnlyExportRequest,
  resolveAudioOnlyExportCard,
} from '../src/domain/export/audioOnlyExport';

const createAudioCapabilities = (
  supported: boolean,
  reason?: string
): MagicStudioMagicCutRenderCapabilities => ({
  queueing: true,
  targets: [
    {
      target: 'audio',
      supported,
      formats: supported ? ['wav'] : [],
      defaultFormat: supported ? 'wav' : null,
      reason,
    },
  ],
});

describe('audio-only export helpers', () => {
  it('detects when the export should run as an audio-only mixdown', () => {
    expect(isAudioOnlyExportRequest({ exportVideo: false, exportAudio: true })).toBe(true);
    expect(isAudioOnlyExportRequest({ exportVideo: true, exportAudio: true })).toBe(false);
    expect(isAudioOnlyExportRequest({ exportVideo: false, exportAudio: false })).toBe(false);
  });

  it('estimates wav export size using uncompressed pcm defaults', () => {
    expect(estimateAudioOnlyExportSizeMb(10)).toBe(2);
    expect(estimateAudioOnlyExportSizeMb(0.2)).toBe(1);
  });

  it('returns a canonical server wav format card when the host advertises audio rendering', () => {
    expect(resolveAudioOnlyExportCard(createAudioCapabilities(true))).toEqual({
      format: 'wav',
      label: 'WAV',
      available: true,
      recommended: true,
      route: 'server-render',
      badge: 'Master',
      description: 'Canonical server WAV audio mixdown with host-owned artifact generation.',
    });
  });

  it('fails closed when the canonical server cannot render wav audio', () => {
    expect(resolveAudioOnlyExportCard(createAudioCapabilities(false, 'Audio renderer unavailable'))).toEqual({
      format: 'wav',
      label: 'WAV',
      available: false,
      recommended: false,
      route: null,
      badge: 'Unavailable',
      description: 'Audio renderer unavailable',
    });
  });
});
