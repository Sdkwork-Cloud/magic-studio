import { createServiceAdapterController } from '@sdkwork/react-commons';
import { voiceService } from './voiceService';
import { voiceHistoryService } from './voiceHistoryService';

export interface VoiceBusinessAdapter {
  voiceService: typeof voiceService;
  voiceHistoryService: typeof voiceHistoryService;
}

const localVoiceAdapter: VoiceBusinessAdapter = {
  voiceService,
  voiceHistoryService
};

const controller = createServiceAdapterController<VoiceBusinessAdapter>(localVoiceAdapter);

export const voiceBusinessService: VoiceBusinessAdapter = controller.service;
export const setVoiceBusinessAdapter = controller.setAdapter;
export const getVoiceBusinessAdapter = controller.getAdapter;
export const resetVoiceBusinessAdapter = controller.resetAdapter;
