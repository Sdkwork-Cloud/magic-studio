import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import { magicCutProjectService } from './magicCutProjectService';
import { magicCutRenderService } from './magicCutRenderService';
import { playerPreviewService } from './PlayerPreviewService';
import { templateService } from './templateService';
import { timelineOperationService } from './TimelineOperationService';
import { videoExportService } from './export/videoExportService';

export interface MagicCutBusinessAdapter {
  magicCutProjectService: typeof magicCutProjectService;
  magicCutRenderService: typeof magicCutRenderService;
  templateService: typeof templateService;
  timelineOperationService: typeof timelineOperationService;
  playerPreviewService: typeof playerPreviewService;
  videoExportService: typeof videoExportService;
}

const localMagicCutAdapter: MagicCutBusinessAdapter = {
  magicCutProjectService,
  magicCutRenderService,
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

