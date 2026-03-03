import { createServiceAdapterController } from '@sdkwork/react-commons';
import { workspaceService } from './workspaceService';

export type WorkspaceBusinessAdapter = typeof workspaceService;

const controller = createServiceAdapterController<WorkspaceBusinessAdapter>(workspaceService);

export const workspaceBusinessService: WorkspaceBusinessAdapter = controller.service;
export const setWorkspaceBusinessAdapter = controller.setAdapter;
export const getWorkspaceBusinessAdapter = controller.getAdapter;
export const resetWorkspaceBusinessAdapter = controller.resetAdapter;
