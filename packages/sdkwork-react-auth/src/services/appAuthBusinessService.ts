import { createServiceAdapterController } from '@sdkwork/react-commons';
import { appAuthService } from './appAuthService';

export type AppAuthBusinessAdapter = typeof appAuthService;

const controller = createServiceAdapterController<AppAuthBusinessAdapter>(appAuthService);

export const appAuthBusinessService: AppAuthBusinessAdapter = controller.service;
export const setAppAuthBusinessAdapter = controller.setAdapter;
export const getAppAuthBusinessAdapter = controller.getAdapter;
export const resetAppAuthBusinessAdapter = controller.resetAdapter;
