import { createServiceAdapterController } from '@sdkwork/react-commons';
import { vipService } from './vipService';

export type VipBusinessAdapter = typeof vipService;

const controller = createServiceAdapterController<VipBusinessAdapter>(vipService);

export const vipBusinessService: VipBusinessAdapter = controller.service;
export const setVipBusinessAdapter = controller.setAdapter;
export const getVipBusinessAdapter = controller.getAdapter;
export const resetVipBusinessAdapter = controller.resetAdapter;
