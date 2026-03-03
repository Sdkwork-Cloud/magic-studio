import { createServiceAdapterController } from '@sdkwork/react-commons';
import { magicCutProjectService } from './magicCutProjectService';
import { playerPreviewService } from './PlayerPreviewService';
import { templateService } from './templateService';
import { timelineOperationService } from './TimelineOperationService';
import { videoExportService } from './export/videoExportService';

export interface MagicCutBusinessAdapter {
  magicCutProjectService: typeof magicCutProjectService;
  templateService: typeof templateService;
  timelineOperationService: typeof timelineOperationService;
  playerPreviewService: typeof playerPreviewService;
  videoExportService: typeof videoExportService;
}

const localMagicCutAdapter: MagicCutBusinessAdapter = {
  magicCutProjectService,
  templateService,
  timelineOperationService,
  playerPreviewService,
  videoExportService
};

const controller = createServiceAdapterController<MagicCutBusinessAdapter>(localMagicCutAdapter);

export const magicCutBusinessService: MagicCutBusinessAdapter = controller.service;
export const setMagicCutBusinessAdapter = controller.setAdapter;
export const getMagicCutBusinessAdapter = controller.getAdapter;
export const resetMagicCutBusinessAdapter = controller.resetAdapter;
