import { createServiceAdapterController } from '@sdkwork/react-commons';
import { musicService } from './musicService';
import { musicHistoryService } from './musicHistoryService';

export interface MusicBusinessAdapter {
  musicService: typeof musicService;
  musicHistoryService: typeof musicHistoryService;
}

const localMusicAdapter: MusicBusinessAdapter = {
  musicService,
  musicHistoryService
};

const controller = createServiceAdapterController<MusicBusinessAdapter>(localMusicAdapter);

export const musicBusinessService: MusicBusinessAdapter = controller.service;
export const setMusicBusinessAdapter = controller.setAdapter;
export const getMusicBusinessAdapter = controller.getAdapter;
export const resetMusicBusinessAdapter = controller.resetAdapter;
