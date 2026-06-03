import type {
  MagicStudioMagicCutRenderCapabilities,
  MagicStudioMagicCutRenderFormat,
} from '@sdkwork/magic-studio-host-types';

import type { ExportFormat } from '../../services/export/types';
import {
  resolveMagicCutDomainTranslate,
  type MagicCutDomainTranslate,
} from '../i18n/defaultMagicCutDomainTranslate';

export type ExportRuntimeRoute = 'server-render' | null;
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

function resolveVideoCapability(
  capabilities: MagicStudioMagicCutRenderCapabilities,
) {
  return capabilities.targets.find((target) => target.target === 'video') ?? null;
}

function supportsFormat(
  formats: MagicStudioMagicCutRenderFormat[],
  format: ExportRuntimeFormat,
): boolean {
  return formats.includes(format);
}

function resolveFormatPresentation(
  format: ExportRuntimeFormat,
  capabilities: MagicStudioMagicCutRenderCapabilities,
  translate: MagicCutDomainTranslate,
  recommendedFormat: ExportRuntimeFormat | null,
): ExportFormatPresentation {
  const capability = resolveVideoCapability(capabilities);
  const available =
    !!capability?.supported && supportsFormat(capability.formats, format);
  const description = available
    ? format === 'mp4'
      ? translate('export.formatDescriptions.mp4MediaRecorder')
      : translate('export.formatDescriptions.webmMediaRecorder')
    : capability?.reason ||
      (format === 'mp4'
        ? translate('export.formatDescriptions.mp4Unavailable')
        : translate('export.formatDescriptions.webmUnavailable'));

  return {
    format,
    label: format.toUpperCase(),
    available,
    recommended: available && recommendedFormat === format,
    route: available ? 'server-render' : null,
    badge: available
      ? recommendedFormat === format
        ? translate('export.formatBadges.recommendedHere')
        : translate('export.formatBadges.compatibility')
      : translate('export.formatBadges.unavailable'),
    description,
  };
}

function resolveRecommendedFormat(
  capabilities: MagicStudioMagicCutRenderCapabilities,
): ExportRuntimeFormat | null {
  const capability = resolveVideoCapability(capabilities);
  if (!capability?.supported) {
    return null;
  }

  if (supportsFormat(capability.formats, 'mp4')) {
    return 'mp4';
  }

  if (supportsFormat(capability.formats, 'webm')) {
    return 'webm';
  }

  return null;
}

export function resolveExportRuntimePresentation(
  capabilities: MagicStudioMagicCutRenderCapabilities,
  translate?: MagicCutDomainTranslate,
): ExportRuntimePresentation {
  const translateText = resolveMagicCutDomainTranslate(translate);
  const recommendedFormat = resolveRecommendedFormat(capabilities);
  const formatOptions = [
    resolveFormatPresentation('mp4', capabilities, translateText, recommendedFormat),
    resolveFormatPresentation('webm', capabilities, translateText, recommendedFormat),
  ] satisfies ExportFormatPresentation[];
  const videoCapability = resolveVideoCapability(capabilities);

  return {
    recommendedFormat,
    runtimeSummary:
      videoCapability?.reason ||
      (recommendedFormat
        ? `Canonical server render is ready for ${recommendedFormat.toUpperCase()}.`
        : translateText('export.runtime.noContainer')),
    blockingReason:
      recommendedFormat || videoCapability?.supported
        ? null
        : videoCapability?.reason || translateText('export.runtime.noSupportedFormat'),
    smartHdrSupported: false,
    smartHdrReason: translateText('export.runtime.smartHdrUnsupported'),
    formatOptions,
  };
}

export function resolvePreferredAvailableFormat(
  currentFormat: ExportFormat,
  presentation: ExportRuntimePresentation,
): ExportRuntimeFormat | null {
  const currentOption = presentation.formatOptions.find(
    (option) => option.format === currentFormat,
  );

  if (currentOption?.available) {
    return currentOption.format;
  }

  return presentation.recommendedFormat;
}
