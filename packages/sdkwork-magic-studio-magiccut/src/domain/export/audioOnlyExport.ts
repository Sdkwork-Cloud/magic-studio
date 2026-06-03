import type { MagicStudioMagicCutRenderCapabilities } from '@sdkwork/magic-studio-host-types';
import type { ExportFormat } from '../../services/export/types';
import {
  resolveMagicCutDomainTranslate,
  type MagicCutDomainTranslate,
} from '../i18n/defaultMagicCutDomainTranslate';

export interface AudioOnlyExportCard {
  format: 'wav';
  label: string;
  available: boolean;
  recommended: boolean;
  route: 'server-render' | null;
  badge: string;
  description: string;
}

export function isAudioOnlyExportRequest({
  exportVideo,
  exportAudio,
}: {
  exportVideo: boolean;
  exportAudio: boolean;
}): boolean {
  return !exportVideo && exportAudio;
}

export function isAudioOnlyExportFormat(format: ExportFormat): boolean {
  return format === 'wav';
}

export function estimateAudioOnlyExportSizeMb(
  durationSeconds: number,
  sampleRate = 48000,
  channels = 2,
  bitsPerSample = 16
): number {
  const safeDuration = Math.max(0, durationSeconds);
  const totalBytes = safeDuration * sampleRate * channels * (bitsPerSample / 8);
  return Math.max(1, Math.round(totalBytes / (1024 * 1024)));
}

export function resolveAudioOnlyExportCard(
  capabilities?: MagicStudioMagicCutRenderCapabilities | null,
  translate?: MagicCutDomainTranslate
): AudioOnlyExportCard {
  const translateText = resolveMagicCutDomainTranslate(translate);
  const audioTarget = capabilities?.targets.find((target) => target.target === 'audio');
  const available = !!audioTarget?.supported && audioTarget.formats.includes('wav');

  return {
    format: 'wav',
    label: 'WAV',
    available,
    recommended: available,
    route: available ? 'server-render' : null,
    badge: available
      ? translateText('export.formatBadges.master')
      : translateText('export.formatBadges.unavailable'),
    description:
      audioTarget?.reason || translateText('export.formatDescriptions.audioOnly'),
  };
}
