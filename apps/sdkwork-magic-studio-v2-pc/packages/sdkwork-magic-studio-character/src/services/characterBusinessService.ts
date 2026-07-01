import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import { characterService } from './characterService';
import { characterHistoryService } from './characterHistoryService';

export interface CharacterBusinessAdapter {
  characterService: typeof characterService;
  characterHistoryService: typeof characterHistoryService;
}

const localCharacterAdapter: CharacterBusinessAdapter = {
  characterService,
  characterHistoryService
};

const controller = createServiceAdapterController<CharacterBusinessAdapter>(
  localCharacterAdapter
);

export const characterBusinessService: CharacterBusinessAdapter = controller.service;
export const setCharacterBusinessAdapter = controller.setAdapter;
export const getCharacterBusinessAdapter = controller.getAdapter;
export const resetCharacterBusinessAdapter = controller.resetAdapter;

