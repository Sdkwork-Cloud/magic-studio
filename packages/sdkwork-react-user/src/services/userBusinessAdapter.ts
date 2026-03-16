import { createServiceAdapterController } from '@sdkwork/react-commons';
import { userBusinessService, type UserBusinessAdapter } from './userBusinessService';

const controller = createServiceAdapterController<UserBusinessAdapter>(userBusinessService);

export const userBusinessAdapterService: UserBusinessAdapter = controller.service;
export const setUserBusinessAdapter = (adapter: UserBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getUserBusinessAdapter = (): UserBusinessAdapter => {
  return controller.getAdapter();
};

export const resetUserBusinessAdapter = (): void => {
  controller.resetAdapter();
};
