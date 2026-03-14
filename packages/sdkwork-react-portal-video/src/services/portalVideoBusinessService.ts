import { createServiceAdapterController } from '@sdkwork/react-commons';
import { portalVideoService } from './portalVideoService';

export type PortalVideoBusinessAdapter = typeof portalVideoService;

const controller = createServiceAdapterController<PortalVideoBusinessAdapter>(portalVideoService);

export const portalVideoBusinessService: PortalVideoBusinessAdapter =
  controller.service;
export const setPortalVideoBusinessAdapter = controller.setAdapter;
export const getPortalVideoBusinessAdapter = controller.getAdapter;
export const resetPortalVideoBusinessAdapter = controller.resetAdapter;
