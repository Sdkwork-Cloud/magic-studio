import type { ExportFormat } from '../../services/export/types';
import { isAudioOnlyExportFormat } from './audioOnlyExport';
import {
  resolveMagicCutDomainTranslate,
  type MagicCutDomainTranslate,
} from '../i18n/defaultMagicCutDomainTranslate';

export function validateExportRequest({
  exportVideo,
  exportAudio,
  format,
  translate,
}: {
  exportVideo: boolean;
  exportAudio: boolean;
  format: ExportFormat;
  translate?: MagicCutDomainTranslate;
}) {
  const translateText = resolveMagicCutDomainTranslate(translate);

  if (!exportVideo && !exportAudio) {
    return translateText('export.validation.enableVideoOrAudio');
  }

  if (!exportVideo && exportAudio) {
    if (!isAudioOnlyExportFormat(format)) {
      return translateText('export.validation.audioOnlyWav');
    }
    return null;
  }

  if (exportVideo && isAudioOnlyExportFormat(format)) {
    return translateText('export.validation.wavAudioOnly');
  }

  if (format === 'mov') {
    return translateText('export.validation.movUnavailable');
  }

  return null;
}
