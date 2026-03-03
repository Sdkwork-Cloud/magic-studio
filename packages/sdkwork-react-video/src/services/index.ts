import { videoBusinessService } from './videoBusinessService';

export * from './videoBusinessService';
export const videoService = videoBusinessService.videoService;
export const videoHistoryService = videoBusinessService.videoHistoryService;
