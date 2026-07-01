import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import { ideConfigService } from './ideConfigService';

export type IdeConfigBusinessAdapter = typeof ideConfigService;

const controller = createServiceAdapterController<IdeConfigBusinessAdapter>(ideConfigService);

export const ideConfigBusinessService: IdeConfigBusinessAdapter = controller.service;
export const setIdeConfigBusinessAdapter = controller.setAdapter;
export const getIdeConfigBusinessAdapter = controller.getAdapter;
export const resetIdeConfigBusinessAdapter = controller.resetAdapter;

