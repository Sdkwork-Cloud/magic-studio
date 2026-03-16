import type { ExportFormat } from '../../services/export/types';
import { isAudioOnlyExportFormat } from './audioOnlyExport';

export function validateExportRequest({
  exportVideo,
  exportAudio,
  format,
}: {
  exportVideo: boolean;
  exportAudio: boolean;
  format: ExportFormat;
}) {
  if (!exportVideo && !exportAudio) {
    return 'Enable video or audio before exporting.';
  }

  if (!exportVideo && exportAudio) {
    if (!isAudioOnlyExportFormat(format)) {
      return 'Audio-only export currently supports WAV only.';
    }
    return null;
  }

  if (exportVideo && isAudioOnlyExportFormat(format)) {
    return 'WAV export is only available for audio-only mixdowns.';
  }

  if (format === 'mov') {
    return 'MOV export is not available in the current renderer.';
  }

  return null;
}
