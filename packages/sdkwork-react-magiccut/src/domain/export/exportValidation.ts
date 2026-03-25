import type { ExportFormat } from '../../services/export/types';
import { isAudioOnlyExportFormat } from './audioOnlyExport';

type Translate = (key: string, params?: Record<string, any>) => string;

export function validateExportRequest({
  exportVideo,
  exportAudio,
  format,
  translate,
}: {
  exportVideo: boolean;
  exportAudio: boolean;
  format: ExportFormat;
  translate: Translate;
}) {
  if (!exportVideo && !exportAudio) {
    return translate('export.validation.enableVideoOrAudio');
  }

  if (!exportVideo && exportAudio) {
    if (!isAudioOnlyExportFormat(format)) {
      return translate('export.validation.audioOnlyWav');
    }
    return null;
  }

  if (exportVideo && isAudioOnlyExportFormat(format)) {
    return translate('export.validation.wavAudioOnly');
  }

  if (format === 'mov') {
    return translate('export.validation.movUnavailable');
  }

  return null;
}
