import type { ExportFormat } from '../../services/export/types';

export interface ExportRuntimeSupportSnapshot {
  webCodecsMp4Available: boolean;
  mediaRecorderMp4Available: boolean;
  mediaRecorderWebmAvailable: boolean;
}

export type ExportRuntimeRoute = 'webcodecs' | 'browser-media-recorder' | null;
export type ExportRuntimeFormat = Extract<ExportFormat, 'mp4' | 'webm'>;

export interface ExportFormatPresentation {
  format: ExportRuntimeFormat;
  label: string;
  available: boolean;
  recommended: boolean;
  route: ExportRuntimeRoute;
  badge: string;
  description: string;
}

export interface ExportRuntimePresentation {
  recommendedFormat: ExportRuntimeFormat | null;
  runtimeSummary: string;
  blockingReason: string | null;
  smartHdrSupported: boolean;
  smartHdrReason: string;
  formatOptions: ExportFormatPresentation[];
}

const SMART_HDR_REASON =
  'Smart HDR metadata pass-through is not implemented in the current renderer.';

function resolveRecommendedFormat(
  support: ExportRuntimeSupportSnapshot
): ExportRuntimeFormat | null {
  if (support.webCodecsMp4Available || support.mediaRecorderMp4Available) {
    return 'mp4';
  }

  if (support.mediaRecorderWebmAvailable) {
    return 'webm';
  }

  return null;
}

function resolveMp4Presentation(
  support: ExportRuntimeSupportSnapshot,
  recommendedFormat: ExportRuntimeFormat | null
): ExportFormatPresentation {
  if (support.webCodecsMp4Available) {
    return {
      format: 'mp4',
      label: 'MP4',
      available: true,
      recommended: recommendedFormat === 'mp4',
      route: 'webcodecs',
      badge: 'Best quality',
      description: 'H.264 MP4 export through WebCodecs and native MP4 muxing.',
    };
  }

  if (support.mediaRecorderMp4Available) {
    return {
      format: 'mp4',
      label: 'MP4',
      available: true,
      recommended: recommendedFormat === 'mp4',
      route: 'browser-media-recorder',
      badge: 'Compatibility',
      description: 'MP4 export through the runtime MediaRecorder compatibility path.',
    };
  }

  return {
    format: 'mp4',
    label: 'MP4',
    available: false,
    recommended: false,
    route: null,
    badge: 'Unavailable',
    description: 'This runtime does not expose a real MP4 export path.',
  };
}

function resolveWebmPresentation(
  support: ExportRuntimeSupportSnapshot,
  recommendedFormat: ExportRuntimeFormat | null
): ExportFormatPresentation {
  if (support.mediaRecorderWebmAvailable) {
    return {
      format: 'webm',
      label: 'WebM',
      available: true,
      recommended: recommendedFormat === 'webm',
      route: 'browser-media-recorder',
      badge: recommendedFormat === 'webm' ? 'Recommended here' : 'Compatibility',
      description: 'VP8/VP9 WebM export through MediaRecorder.',
    };
  }

  return {
    format: 'webm',
    label: 'WebM',
    available: false,
    recommended: false,
    route: null,
    badge: 'Unavailable',
    description: 'This runtime does not expose a real WebM export path.',
  };
}

export function resolveExportRuntimePresentation(
  support: ExportRuntimeSupportSnapshot
): ExportRuntimePresentation {
  const recommendedFormat = resolveRecommendedFormat(support);
  const formatOptions = [
    resolveMp4Presentation(support, recommendedFormat),
    resolveWebmPresentation(support, recommendedFormat),
  ] satisfies ExportFormatPresentation[];

  let runtimeSummary = 'No real video container is available in the current runtime.';
  if (support.webCodecsMp4Available && support.mediaRecorderWebmAvailable) {
    runtimeSummary =
      'MP4 is available through WebCodecs, and WebM is available through MediaRecorder.';
  } else if (support.webCodecsMp4Available) {
    runtimeSummary = 'MP4 is available through the high-quality WebCodecs export path.';
  } else if (support.mediaRecorderMp4Available && support.mediaRecorderWebmAvailable) {
    runtimeSummary =
      'This runtime can export MP4 and WebM through MediaRecorder compatibility paths.';
  } else if (support.mediaRecorderMp4Available) {
    runtimeSummary = 'This runtime can export MP4 through MediaRecorder compatibility mode.';
  } else if (support.mediaRecorderWebmAvailable) {
    runtimeSummary = 'This runtime can export WebM through MediaRecorder.';
  }

  return {
    recommendedFormat,
    runtimeSummary,
    blockingReason: recommendedFormat
      ? null
      : 'No supported export format is currently available. Change runtime or install the missing encoder path.',
    smartHdrSupported: false,
    smartHdrReason: SMART_HDR_REASON,
    formatOptions,
  };
}

export function resolvePreferredAvailableFormat(
  currentFormat: ExportFormat,
  presentation: ExportRuntimePresentation
): ExportRuntimeFormat | null {
  const currentOption = presentation.formatOptions.find(
    (option) => option.format === currentFormat
  );

  if (currentOption?.available) {
    return currentOption.format;
  }

  return presentation.recommendedFormat;
}
