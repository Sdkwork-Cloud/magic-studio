import { createServiceAdapterController } from '@sdkwork/react-commons';
import {
  notificationBusinessService,
  type NotificationBusinessAdapter
} from './notificationBusinessService';

const controller =
  createServiceAdapterController<NotificationBusinessAdapter>(notificationBusinessService);

export const notificationBusinessAdapterService: NotificationBusinessAdapter = controller.service;
export const setNotificationBusinessAdapter = (adapter: NotificationBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getNotificationBusinessAdapter = (): NotificationBusinessAdapter => {
  return controller.getAdapter();
};

export const resetNotificationBusinessAdapter = (): void => {
  controller.resetAdapter();
};
