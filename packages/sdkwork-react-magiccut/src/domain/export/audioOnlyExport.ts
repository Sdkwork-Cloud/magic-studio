import type { ExportFormat } from '../../services/export/types';

export interface AudioOnlyExportCard {
  format: 'wav';
  label: string;
  available: true;
  recommended: true;
  route: 'audio-buffer';
  badge: string;
  description: string;
}

type Translate = (key: string, params?: Record<string, any>) => string;

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

export function resolveAudioOnlyExportCard(translate: Translate): AudioOnlyExportCard {
  return {
    format: 'wav',
    label: 'WAV',
    available: true,
    recommended: true,
    route: 'audio-buffer',
    badge: translate('export.formatBadges.master'),
    description: translate('export.formatDescriptions.audioOnly'),
  };
}
