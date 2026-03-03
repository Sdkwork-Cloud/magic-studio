import { createServiceAdapterController } from '@sdkwork/react-commons';
import { notificationService } from './notificationService';

export type NotificationBusinessAdapter = typeof notificationService;

const controller = createServiceAdapterController<NotificationBusinessAdapter>(notificationService);

export const notificationBusinessService: NotificationBusinessAdapter = controller.service;
export const setNotificationBusinessAdapter = controller.setAdapter;
export const getNotificationBusinessAdapter = controller.getAdapter;
export const resetNotificationBusinessAdapter = controller.resetAdapter;
