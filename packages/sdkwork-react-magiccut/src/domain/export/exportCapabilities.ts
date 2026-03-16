export interface ExportRuntimeCapabilities {
  webCodecsSupported: boolean;
  h264Supported: boolean;
  vp8Supported?: boolean;
  vp9Supported?: boolean;
  webCodecsMuxerAvailable: boolean;
  mediaRecorderSupported: boolean;
}

export type ExportEncoderId = 'webcodecs' | 'browser-media-recorder';
export type RequestedExportFormat = 'mp4' | 'mov' | 'webm' | 'txt';

export function resolvePreferredExportEncoder(
  capabilities: ExportRuntimeCapabilities,
  requestedFormat: RequestedExportFormat = 'mp4'
): ExportEncoderId | null {
  if (requestedFormat === 'mov' || requestedFormat === 'txt') {
    return null;
  }

  if (requestedFormat === 'webm') {
    return capabilities.mediaRecorderSupported ? 'browser-media-recorder' : null;
  }

  if (
    capabilities.webCodecsSupported &&
    capabilities.h264Supported &&
    capabilities.webCodecsMuxerAvailable
  ) {
    return 'webcodecs';
  }

  if (capabilities.mediaRecorderSupported) {
    return 'browser-media-recorder';
  }

  return null;
}

export function resolveAvailableExportEncoders(capabilities: ExportRuntimeCapabilities) {
  return [
    {
      id: 'webcodecs',
      name: 'WebCodecs (H.264/MP4)',
      available:
        capabilities.webCodecsSupported &&
        capabilities.h264Supported &&
        capabilities.webCodecsMuxerAvailable,
    },
    {
      id: 'browser-media-recorder',
      name: 'MediaRecorder (WebM/VP9)',
      available: capabilities.mediaRecorderSupported,
    },
  ] as const;
}
