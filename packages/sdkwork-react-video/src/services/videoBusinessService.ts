import { createServiceAdapterController } from '@sdkwork/react-commons';
import { videoService } from './videoService';
import { videoHistoryService } from './videoHistoryService';

export interface VideoBusinessAdapter {
  videoService: typeof videoService;
  videoHistoryService: typeof videoHistoryService;
}

const localVideoAdapter: VideoBusinessAdapter = {
  videoService,
  videoHistoryService
};

const controller = createServiceAdapterController<VideoBusinessAdapter>(localVideoAdapter);

export const videoBusinessService: VideoBusinessAdapter = controller.service;
export const setVideoBusinessAdapter = controller.setAdapter;
export const getVideoBusinessAdapter = controller.getAdapter;
export const resetVideoBusinessAdapter = controller.resetAdapter;
