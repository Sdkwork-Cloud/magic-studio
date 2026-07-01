import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import { workspaceService } from './workspaceService';
import type { WorkspaceService } from './workspaceService';

export type WorkspaceBusinessAdapter = WorkspaceService;

const controller = createServiceAdapterController<WorkspaceBusinessAdapter>(workspaceService);

export const workspaceBusinessService: WorkspaceBusinessAdapter = controller.service;
export const setWorkspaceBusinessAdapter = (adapter: WorkspaceBusinessAdapter): void => {
  controller.setAdapter(adapter);
};

export const getWorkspaceBusinessAdapter = (): WorkspaceBusinessAdapter => {
  return controller.getAdapter();
};

export const resetWorkspaceBusinessAdapter = (): void => {
  controller.resetAdapter();
};

