import { createServiceAdapterController } from '@sdkwork/react-commons';
import { imageService } from './imageService';
import { imageHistoryService } from './imageHistoryService';

export interface ImageBusinessAdapter {
  imageService: typeof imageService;
  imageHistoryService: typeof imageHistoryService;
}

const localImageAdapter: ImageBusinessAdapter = {
  imageService,
  imageHistoryService
};

const controller = createServiceAdapterController<ImageBusinessAdapter>(localImageAdapter);

export const imageBusinessService: ImageBusinessAdapter = controller.service;
export const setImageBusinessAdapter = controller.setAdapter;
export const getImageBusinessAdapter = controller.getAdapter;
export const resetImageBusinessAdapter = controller.resetAdapter;
