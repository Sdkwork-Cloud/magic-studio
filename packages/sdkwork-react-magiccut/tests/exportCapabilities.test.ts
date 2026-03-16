import { describe, expect, it } from 'vitest';

import {
  resolveAvailableExportEncoders,
  resolvePreferredExportEncoder,
} from '../src/domain/export/exportCapabilities';

describe('resolvePreferredExportEncoder', () => {
  it('falls back to media recorder when WebCodecs lacks a muxer', () => {
    expect(
      resolvePreferredExportEncoder({
        webCodecsSupported: true,
        h264Supported: true,
        webCodecsMuxerAvailable: false,
        mediaRecorderSupported: true,
      })
    ).toBe('browser-media-recorder');
  });

  it('uses WebCodecs only when codec and muxer support are both available', () => {
    expect(
      resolvePreferredExportEncoder({
        webCodecsSupported: true,
        h264Supported: true,
        webCodecsMuxerAvailable: true,
        mediaRecorderSupported: true,
      }, 'mp4')
    ).toBe('webcodecs');
  });

  it('returns null when the runtime cannot produce a real export file', () => {
    expect(
      resolvePreferredExportEncoder({
        webCodecsSupported: false,
        h264Supported: false,
        webCodecsMuxerAvailable: false,
        mediaRecorderSupported: false,
      }, 'mp4')
    ).toBeNull();
  });

  it('prefers MediaRecorder for WebM exports even when WebCodecs is otherwise available', () => {
    expect(
      resolvePreferredExportEncoder(
        {
          webCodecsSupported: true,
          h264Supported: true,
          webCodecsMuxerAvailable: true,
          mediaRecorderSupported: true,
        },
        'webm'
      )
    ).toBe('browser-media-recorder');
  });

  it('returns null for WebM when MediaRecorder is unavailable', () => {
    expect(
      resolvePreferredExportEncoder(
        {
          webCodecsSupported: true,
          h264Supported: true,
          webCodecsMuxerAvailable: true,
          mediaRecorderSupported: false,
        },
        'webm'
      )
    ).toBeNull();
  });

  it('returns null for MOV because the runtime does not provide a real mov encoder', () => {
    expect(
      resolvePreferredExportEncoder(
        {
          webCodecsSupported: true,
          h264Supported: true,
          webCodecsMuxerAvailable: true,
          mediaRecorderSupported: true,
        },
        'mov'
      )
    ).toBeNull();
  });
});

describe('resolveAvailableExportEncoders', () => {
  it('marks WebCodecs unavailable when muxing is missing even if encoding exists', () => {
    expect(
      resolveAvailableExportEncoders({
        webCodecsSupported: true,
        h264Supported: true,
        vp8Supported: true,
        vp9Supported: true,
        webCodecsMuxerAvailable: false,
        mediaRecorderSupported: true,
      })
    ).toEqual([
      { id: 'webcodecs', name: 'WebCodecs (H.264/MP4)', available: false },
      { id: 'browser-media-recorder', name: 'MediaRecorder (WebM/VP9)', available: true },
    ]);
  });
});
