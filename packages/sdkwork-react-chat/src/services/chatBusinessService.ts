import { createServiceAdapterController } from '@sdkwork/react-commons';
import { chatService } from './chatService';
import type { ChatService } from './chatService';

export type ChatBusinessAdapter = ChatService;

const controller = createServiceAdapterController<ChatBusinessAdapter>(chatService);

export const chatBusinessService: ChatBusinessAdapter = controller.service;
export const setChatBusinessAdapter = (adapter: ChatBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getChatBusinessAdapter = (): ChatBusinessAdapter => {
  return controller.getAdapter();
};

export const resetChatBusinessAdapter = (): void => {
  controller.resetAdapter();
};
