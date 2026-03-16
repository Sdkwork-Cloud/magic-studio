import { describe, expect, it } from 'vitest';

import {
  resolveExportRuntimePresentation,
  resolvePreferredAvailableFormat,
} from '../src/domain/export/exportRuntimePresentation';

describe('resolveExportRuntimePresentation', () => {
  it('prefers MP4 when WebCodecs MP4 and WebM MediaRecorder paths are both available', () => {
    const presentation = resolveExportRuntimePresentation({
      webCodecsMp4Available: true,
      mediaRecorderMp4Available: false,
      mediaRecorderWebmAvailable: true,
    });

    expect(presentation.recommendedFormat).toBe('mp4');
    expect(presentation.runtimeSummary).toContain('WebCodecs');
    expect(presentation.smartHdrSupported).toBe(false);
    expect(presentation.formatOptions).toEqual([
      expect.objectContaining({
        format: 'mp4',
        available: true,
        recommended: true,
        route: 'webcodecs',
        badge: 'Best quality',
      }),
      expect.objectContaining({
        format: 'webm',
        available: true,
        recommended: false,
        route: 'browser-media-recorder',
        badge: 'Compatibility',
      }),
    ]);
  });

  it('recommends WebM when only the MediaRecorder WebM path is available', () => {
    const presentation = resolveExportRuntimePresentation({
      webCodecsMp4Available: false,
      mediaRecorderMp4Available: false,
      mediaRecorderWebmAvailable: true,
    });

    expect(presentation.recommendedFormat).toBe('webm');
    expect(presentation.runtimeSummary).toContain('WebM');
    expect(presentation.formatOptions).toEqual([
      expect.objectContaining({
        format: 'mp4',
        available: false,
        recommended: false,
        route: null,
      }),
      expect.objectContaining({
        format: 'webm',
        available: true,
        recommended: true,
        route: 'browser-media-recorder',
      }),
    ]);
  });

  it('describes MP4 as compatibility export when only MediaRecorder MP4 is available', () => {
    const presentation = resolveExportRuntimePresentation({
      webCodecsMp4Available: false,
      mediaRecorderMp4Available: true,
      mediaRecorderWebmAvailable: false,
    });

    expect(presentation.recommendedFormat).toBe('mp4');
    expect(presentation.formatOptions[0]).toMatchObject({
      format: 'mp4',
      available: true,
      route: 'browser-media-recorder',
      badge: 'Compatibility',
    });
    expect(presentation.formatOptions[1]).toMatchObject({
      format: 'webm',
      available: false,
    });
  });
});

describe('resolvePreferredAvailableFormat', () => {
  it('keeps the current format when it is available', () => {
    const presentation = resolveExportRuntimePresentation({
      webCodecsMp4Available: true,
      mediaRecorderMp4Available: false,
      mediaRecorderWebmAvailable: true,
    });

    expect(resolvePreferredAvailableFormat('webm', presentation)).toBe('webm');
  });

  it('falls back to the recommended available format when the current one is unavailable', () => {
    const presentation = resolveExportRuntimePresentation({
      webCodecsMp4Available: false,
      mediaRecorderMp4Available: false,
      mediaRecorderWebmAvailable: true,
    });

    expect(resolvePreferredAvailableFormat('mp4', presentation)).toBe('webm');
  });

  it('returns null when no export format is available in the current runtime', () => {
    const presentation = resolveExportRuntimePresentation({
      webCodecsMp4Available: false,
      mediaRecorderMp4Available: false,
      mediaRecorderWebmAvailable: false,
    });

    expect(resolvePreferredAvailableFormat('mp4', presentation)).toBeNull();
  });
});
