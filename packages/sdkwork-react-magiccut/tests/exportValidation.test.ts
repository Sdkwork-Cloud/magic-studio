import { describe, expect, it } from 'vitest';

import { validateExportRequest } from '../src/domain/export/exportValidation';

describe('validateExportRequest', () => {
  it('allows audio-only wav exports', () => {
    expect(
      validateExportRequest({
        exportVideo: false,
        exportAudio: true,
        format: 'wav',
      })
    ).toBeNull();
  });

  it('rejects audio-only exports when the selected format is not wav', () => {
    expect(
      validateExportRequest({
        exportVideo: false,
        exportAudio: true,
        format: 'mp4',
      })
    ).toBe('Audio-only export currently supports WAV only.');
  });

  it('rejects mov exports because no real mov encoder is available', () => {
    expect(
      validateExportRequest({
        exportVideo: true,
        exportAudio: true,
        format: 'mov',
      })
    ).toBe('MOV export is not available in the current renderer.');
  });

  it('allows standard video exports', () => {
    expect(
      validateExportRequest({
        exportVideo: true,
        exportAudio: true,
        format: 'mp4',
      })
    ).toBeNull();
  });

  it('rejects wav when video export is still enabled', () => {
    expect(
      validateExportRequest({
        exportVideo: true,
        exportAudio: true,
        format: 'wav',
      })
    ).toBe('WAV export is only available for audio-only mixdowns.');
  });
});
