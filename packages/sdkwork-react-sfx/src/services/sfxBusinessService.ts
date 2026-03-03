import { createServiceAdapterController } from '@sdkwork/react-commons';
import { sfxService } from './sfxService';
import { sfxHistoryService } from './sfxHistoryService';

export interface SfxBusinessAdapter {
  sfxService: typeof sfxService;
  sfxHistoryService: typeof sfxHistoryService;
}

const localSfxAdapter: SfxBusinessAdapter = {
  sfxService,
  sfxHistoryService
};

const controller = createServiceAdapterController<SfxBusinessAdapter>(localSfxAdapter);

export const sfxBusinessService: SfxBusinessAdapter = controller.service;
export const setSfxBusinessAdapter = controller.setAdapter;
export const getSfxBusinessAdapter = controller.getAdapter;
export const resetSfxBusinessAdapter = controller.resetAdapter;
