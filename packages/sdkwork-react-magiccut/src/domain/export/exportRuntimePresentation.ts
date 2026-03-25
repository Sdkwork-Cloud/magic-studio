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

type Translate = (key: string, params?: Record<string, any>) => string;

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
  recommendedFormat: ExportRuntimeFormat | null,
  translate: Translate
): ExportFormatPresentation {
  if (support.webCodecsMp4Available) {
    return {
      format: 'mp4',
      label: 'MP4',
      available: true,
      recommended: recommendedFormat === 'mp4',
      route: 'webcodecs',
      badge: translate('export.formatBadges.bestQuality'),
      description: translate('export.formatDescriptions.mp4WebCodecs'),
    };
  }

  if (support.mediaRecorderMp4Available) {
    return {
      format: 'mp4',
      label: 'MP4',
      available: true,
      recommended: recommendedFormat === 'mp4',
      route: 'browser-media-recorder',
      badge: translate('export.formatBadges.compatibility'),
      description: translate('export.formatDescriptions.mp4MediaRecorder'),
    };
  }

  return {
    format: 'mp4',
    label: 'MP4',
    available: false,
    recommended: false,
    route: null,
    badge: translate('export.formatBadges.unavailable'),
    description: translate('export.formatDescriptions.mp4Unavailable'),
  };
}

function resolveWebmPresentation(
  support: ExportRuntimeSupportSnapshot,
  recommendedFormat: ExportRuntimeFormat | null,
  translate: Translate
): ExportFormatPresentation {
  if (support.mediaRecorderWebmAvailable) {
    return {
      format: 'webm',
      label: 'WebM',
      available: true,
      recommended: recommendedFormat === 'webm',
      route: 'browser-media-recorder',
      badge: recommendedFormat === 'webm'
        ? translate('export.formatBadges.recommendedHere')
        : translate('export.formatBadges.compatibility'),
      description: translate('export.formatDescriptions.webmMediaRecorder'),
    };
  }

  return {
    format: 'webm',
    label: 'WebM',
    available: false,
    recommended: false,
    route: null,
    badge: translate('export.formatBadges.unavailable'),
    description: translate('export.formatDescriptions.webmUnavailable'),
  };
}

export function resolveExportRuntimePresentation(
  support: ExportRuntimeSupportSnapshot,
  translate: Translate
): ExportRuntimePresentation {
  const recommendedFormat = resolveRecommendedFormat(support);
  const formatOptions = [
    resolveMp4Presentation(support, recommendedFormat, translate),
    resolveWebmPresentation(support, recommendedFormat, translate),
  ] satisfies ExportFormatPresentation[];

  let runtimeSummary = translate('export.runtime.noContainer');
  if (support.webCodecsMp4Available && support.mediaRecorderWebmAvailable) {
    runtimeSummary = translate('export.runtime.mp4WebCodecsAndWebmMediaRecorder');
  } else if (support.webCodecsMp4Available) {
    runtimeSummary = translate('export.runtime.mp4WebCodecsOnly');
  } else if (support.mediaRecorderMp4Available && support.mediaRecorderWebmAvailable) {
    runtimeSummary = translate('export.runtime.mp4AndWebmMediaRecorder');
  } else if (support.mediaRecorderMp4Available) {
    runtimeSummary = translate('export.runtime.mp4MediaRecorderOnly');
  } else if (support.mediaRecorderWebmAvailable) {
    runtimeSummary = translate('export.runtime.webmMediaRecorderOnly');
  }

  return {
    recommendedFormat,
    runtimeSummary,
    blockingReason: recommendedFormat
      ? null
      : translate('export.runtime.noSupportedFormat'),
    smartHdrSupported: false,
    smartHdrReason: translate('export.runtime.smartHdrUnsupported'),
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
