import { describe, expect, it } from 'vitest';

import { resolveMediaRecorderMimeType } from '../src/domain/export/mediaRecorderMime';

describe('resolveMediaRecorderMimeType', () => {
  it('prefers WebM variants for WebM exports when both WebM and MP4 are supported', () => {
    const supported = new Set([
      'video/webm;codecs=vp9,opus',
      'video/mp4;codecs=avc1,mp4a.40.2',
    ]);

    const mime = resolveMediaRecorderMimeType('webm', (candidate) => supported.has(candidate));

    expect(mime).toBe('video/webm;codecs=vp9,opus');
  });

  it('returns an empty result when WebM is requested but only MP4 is available', () => {
    const supported = new Set(['video/mp4']);

    const mime = resolveMediaRecorderMimeType('webm', (candidate) => supported.has(candidate));

    expect(mime).toBe('');
  });

  it('returns an empty result when MP4 is requested but only WebM is available', () => {
    const supported = new Set([
      'video/webm',
    ]);

    const mime = resolveMediaRecorderMimeType('mp4', (candidate) => supported.has(candidate));

    expect(mime).toBe('');
  });

  it('returns an empty result for MOV because MediaRecorder cannot produce a real mov container', () => {
    const supported = new Set([
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ]);

    const mime = resolveMediaRecorderMimeType('mov', (candidate) => supported.has(candidate));

    expect(mime).toBe('');
  });
});
