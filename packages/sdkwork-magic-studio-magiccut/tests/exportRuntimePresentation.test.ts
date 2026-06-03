import { describe, expect, it } from 'vitest';

import {
  resolveExportRuntimePresentation,
  resolvePreferredAvailableFormat,
} from '../src/domain/export/exportRuntimePresentation';
import type { MagicStudioMagicCutRenderCapabilities } from '@sdkwork/magic-studio-host-types';

const createVideoCapabilities = (
  formats: Array<'mp4' | 'webm'>,
  reason?: string,
): MagicStudioMagicCutRenderCapabilities => ({
  queueing: true,
  targets: [
    {
      target: 'video',
      supported: formats.length > 0,
      formats,
      defaultFormat: formats[0] ?? null,
      reason: reason ?? null,
    },
  ],
});

describe('resolveExportRuntimePresentation', () => {
  it('prefers MP4 when the canonical server video target exposes MP4 and WebM', () => {
    const presentation = resolveExportRuntimePresentation(
      createVideoCapabilities(['mp4', 'webm']),
    );

    expect(presentation.recommendedFormat).toBe('mp4');
    expect(presentation.runtimeSummary).toContain('Canonical server render');
    expect(presentation.smartHdrSupported).toBe(false);
    expect(presentation.formatOptions).toEqual([
      expect.objectContaining({
        format: 'mp4',
        available: true,
        recommended: true,
        route: 'server-render',
        badge: 'Recommended here',
      }),
      expect.objectContaining({
        format: 'webm',
        available: true,
        recommended: false,
        route: 'server-render',
        badge: 'Compatibility',
      }),
    ]);
  });

  it('recommends WebM when only the canonical server WebM target is available', () => {
    const presentation = resolveExportRuntimePresentation(
      createVideoCapabilities(['webm']),
    );

    expect(presentation.recommendedFormat).toBe('webm');
    expect(presentation.runtimeSummary).toContain('Canonical server render');
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
        route: 'server-render',
      }),
    ]);
  });

  it('describes MP4 as the recommended canonical server export when only MP4 is available', () => {
    const presentation = resolveExportRuntimePresentation(
      createVideoCapabilities(['mp4']),
    );

    expect(presentation.recommendedFormat).toBe('mp4');
    expect(presentation.formatOptions[0]).toMatchObject({
      format: 'mp4',
      available: true,
      route: 'server-render',
      badge: 'Recommended here',
    });
    expect(presentation.formatOptions[1]).toMatchObject({
      format: 'webm',
      available: false,
    });
  });
});

describe('resolvePreferredAvailableFormat', () => {
  it('keeps the current format when it is available', () => {
    const presentation = resolveExportRuntimePresentation(
      createVideoCapabilities(['mp4', 'webm']),
    );

    expect(resolvePreferredAvailableFormat('webm', presentation)).toBe('webm');
  });

  it('falls back to the recommended available format when the current one is unavailable', () => {
    const presentation = resolveExportRuntimePresentation(
      createVideoCapabilities(['webm']),
    );

    expect(resolvePreferredAvailableFormat('mp4', presentation)).toBe('webm');
  });

  it('returns null when no export format is available in the current runtime', () => {
    const presentation = resolveExportRuntimePresentation(
      createVideoCapabilities([], 'No server encoder is configured.'),
    );

    expect(resolvePreferredAvailableFormat('mp4', presentation)).toBeNull();
  });
});
