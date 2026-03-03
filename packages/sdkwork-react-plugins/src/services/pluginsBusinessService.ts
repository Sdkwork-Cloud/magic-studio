import { createServiceAdapterController } from '@sdkwork/react-commons';

export interface PluginsBusinessAdapter {}

const localPluginsAdapter: PluginsBusinessAdapter = {};

const controller =
  createServiceAdapterController<PluginsBusinessAdapter>(localPluginsAdapter);

export const pluginsBusinessService: PluginsBusinessAdapter = controller.service;
export const setPluginsBusinessAdapter = controller.setAdapter;
export const getPluginsBusinessAdapter = controller.getAdapter;
export const resetPluginsBusinessAdapter = controller.resetAdapter;
