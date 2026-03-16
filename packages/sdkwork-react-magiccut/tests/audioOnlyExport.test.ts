import { describe, expect, it } from 'vitest';

import {
  estimateAudioOnlyExportSizeMb,
  isAudioOnlyExportRequest,
  resolveAudioOnlyExportCard,
} from '../src/domain/export/audioOnlyExport';

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

  it('returns a real wav format card for audio-only exports', () => {
    expect(resolveAudioOnlyExportCard()).toEqual({
      format: 'wav',
      label: 'WAV',
      available: true,
      recommended: true,
      route: 'audio-buffer',
      badge: 'Master',
      description: 'Uncompressed PCM WAV audio mixdown for standalone delivery.',
    });
  });
});
