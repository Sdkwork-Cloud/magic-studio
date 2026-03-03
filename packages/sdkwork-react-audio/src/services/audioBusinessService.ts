import { createServiceAdapterController } from '@sdkwork/react-commons';
import { audioService } from './audioService';
import { audioHistoryService } from './audioHistoryService';

export interface AudioBusinessAdapter {
  audioService: typeof audioService;
  audioHistoryService: typeof audioHistoryService;
}

const localAudioAdapter: AudioBusinessAdapter = {
  audioService,
  audioHistoryService
};

const controller = createServiceAdapterController<AudioBusinessAdapter>(localAudioAdapter);

export const audioBusinessService: AudioBusinessAdapter = controller.service;
export const setAudioBusinessAdapter = controller.setAdapter;
export const getAudioBusinessAdapter = controller.getAdapter;
export const resetAudioBusinessAdapter = controller.resetAdapter;
