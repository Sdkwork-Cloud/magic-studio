import { notificationService } from './notificationService';

export type NotificationBusinessAdapter = typeof notificationService;

export const notificationBusinessService: NotificationBusinessAdapter = notificationService;
