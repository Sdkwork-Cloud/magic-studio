import { createServiceAdapterController } from '@sdkwork/react-commons';
import { chatService } from './chatService';

export type ChatBusinessAdapter = typeof chatService;

const controller = createServiceAdapterController<ChatBusinessAdapter>(chatService);

export const chatBusinessService: ChatBusinessAdapter = controller.service;
export const setChatBusinessAdapter = controller.setAdapter;
export const getChatBusinessAdapter = controller.getAdapter;
export const resetChatBusinessAdapter = controller.resetAdapter;
