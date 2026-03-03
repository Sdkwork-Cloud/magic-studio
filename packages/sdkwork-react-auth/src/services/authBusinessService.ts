import { createServiceAdapterController } from '@sdkwork/react-commons';
import { authService } from './authService';

export type AuthBusinessAdapter = typeof authService;

const controller = createServiceAdapterController<AuthBusinessAdapter>(authService);

export const authBusinessService: AuthBusinessAdapter = controller.service;
export const setAuthBusinessAdapter = controller.setAdapter;
export const getAuthBusinessAdapter = controller.getAdapter;
export const resetAuthBusinessAdapter = controller.resetAdapter;
