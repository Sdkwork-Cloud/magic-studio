import { StudioWorkspace, StudioProject, ProjectType } from '@sdkwork/react-commons';
import { workspaceBusinessService } from '../services';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface WorkspaceStoreContextType {
  workspaces: StudioWorkspace[];
  currentWorkspace: StudioWorkspace | null;
  currentProject: StudioProject | null;
  isLoading: boolean;

  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: StudioWorkspace) => void;
  setCurrentProject: (project: StudioProject) => void;

  addWorkspace: (name: string, description?: string, icon?: string) => Promise<void>;
  editWorkspace: (uuid: string, name: string) => Promise<void>;
  removeWorkspace: (uuid: string) => Promise<void>;

  addProject: (name: string, type: ProjectType, description: string, coverImage?: { data: Uint8Array, name: string }) => Promise<void>;
  removeProject: (workspaceUuid: string, projectUuid: string) => Promise<void>;
}

const WorkspaceStoreContext = createContext<WorkspaceStoreContextType | undefined>(undefined);

interface WorkspaceStoreProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const WorkspaceStoreProvider: React.FC<WorkspaceStoreProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [workspaces, setWorkspaces] = useState<StudioWorkspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<StudioWorkspace | null>(null);
  const [currentProject, setCurrentProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetState = useCallback(() => {
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setCurrentProject(null);
  }, []);

  const loadWorkspaces = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const res = await workspaceBusinessService.findAll({ page: 0, size: 50 });
    if (res.success && res.data) {
      setWorkspaces(res.data.content);
    }
  }, [enabled]);

  useEffect(() => {
    const init = async () => {
      if (!enabled) {
        resetState();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await loadWorkspaces();
      setIsLoading(false);
    };
    void init();
  }, [enabled, loadWorkspaces, resetState]);

  const addWorkspace = useCallback(async (name: string, description?: string, icon?: string) => {
    if (!enabled) return;

    const res = await workspaceBusinessService.createWorkspace(name, description, icon);
    if (res.success) {
      await loadWorkspaces();
      if (res.data) {
        setCurrentWorkspace(res.data);
      }
    }
  }, [enabled, loadWorkspaces]);

  const editWorkspace = useCallback(async (uuid: string, name: string) => {
    if (!enabled) return;

    const res = await workspaceBusinessService.updateWorkspace(uuid, name);
    if (res.success) {
      await loadWorkspaces();
      setCurrentWorkspace((prev) => (prev && prev.uuid === uuid ? { ...prev, name } : prev));
    }
  }, [enabled, loadWorkspaces]);

  const removeWorkspace = useCallback(async (uuid: string) => {
    if (!enabled) return;

    await workspaceBusinessService.deleteWorkspace(uuid);
    await loadWorkspaces();
    setCurrentWorkspace((prev) => (prev && prev.uuid === uuid ? null : prev));
    setCurrentProject((prev) => (prev && prev.workspaceId === uuid ? null : prev));
  }, [enabled, loadWorkspaces]);

  const addProject = useCallback(async (name: string, type: ProjectType, description: string, coverImage?: { data: Uint8Array, name: string }) => {
    if (!enabled) return;
    if (!currentWorkspace) return;

    const res = await workspaceBusinessService.createProject(
      currentWorkspace.uuid,
      name,
      type,
      description,
      coverImage
    );
    if (res.success) {
      await loadWorkspaces();
    }
  }, [enabled, currentWorkspace, loadWorkspaces]);

  const removeProject = useCallback(async (workspaceUuid: string, projectUuid: string) => {
    if (!enabled) return;

    await workspaceBusinessService.deleteProject(workspaceUuid, projectUuid);
    await loadWorkspaces();
  }, [enabled, loadWorkspaces]);

  return (
    <WorkspaceStoreContext.Provider value={{
      workspaces, currentWorkspace, currentProject, isLoading,
      loadWorkspaces, setCurrentWorkspace, setCurrentProject,
      addWorkspace, editWorkspace, removeWorkspace,
      addProject, removeProject
    }}>
      {children}
    </WorkspaceStoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspaceStore = () => {
  const context = useContext(WorkspaceStoreContext);
  if (!context) throw new Error('useWorkspaceStore must be used within a WorkspaceStoreProvider');
  return context;
};

