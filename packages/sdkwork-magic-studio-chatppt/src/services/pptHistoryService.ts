import { chatPPTService } from './chatPPTService';

export const pptHistoryService = {
  findAll: chatPPTService.findAll.bind(chatPPTService),
  findById: chatPPTService.findById.bind(chatPPTService),
};
