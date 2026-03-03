import { createServiceAdapterController } from '@sdkwork/react-commons';
import { settingsService } from './settingsService';

export type SettingsBusinessAdapter = typeof settingsService;

const controller = createServiceAdapterController<SettingsBusinessAdapter>(settingsService);

export const settingsBusinessService: SettingsBusinessAdapter = controller.service;
export const setSettingsBusinessAdapter = controller.setAdapter;
export const getSettingsBusinessAdapter = controller.getAdapter;
export const resetSettingsBusinessAdapter = controller.resetAdapter;
