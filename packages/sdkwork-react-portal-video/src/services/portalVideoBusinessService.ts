import { createServiceAdapterController } from '@sdkwork/react-commons';

export interface PortalVideoBusinessAdapter {}

const localPortalVideoAdapter: PortalVideoBusinessAdapter = {};

const controller = createServiceAdapterController<PortalVideoBusinessAdapter>(
  localPortalVideoAdapter
);

export const portalVideoBusinessService: PortalVideoBusinessAdapter =
  controller.service;
export const setPortalVideoBusinessAdapter = controller.setAdapter;
export const getPortalVideoBusinessAdapter = controller.getAdapter;
export const resetPortalVideoBusinessAdapter = controller.resetAdapter;
