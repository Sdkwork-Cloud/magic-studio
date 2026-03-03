import { createServiceAdapterController } from '@sdkwork/react-commons';
import { chatPPTService } from './chatPPTService';
import { pptHistoryService } from './pptHistoryService';

export interface ChatPPTBusinessAdapter {
  chatPPTService: typeof chatPPTService;
  pptHistoryService: typeof pptHistoryService;
}

const localChatPPTAdapter: ChatPPTBusinessAdapter = {
  chatPPTService,
  pptHistoryService
};

const controller = createServiceAdapterController<ChatPPTBusinessAdapter>(localChatPPTAdapter);

export const chatPPTBusinessService: ChatPPTBusinessAdapter = controller.service;
export const setChatPPTBusinessAdapter = controller.setAdapter;
export const getChatPPTBusinessAdapter = controller.getAdapter;
export const resetChatPPTBusinessAdapter = controller.resetAdapter;
