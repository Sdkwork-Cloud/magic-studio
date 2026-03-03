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

export const WorkspaceStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<StudioWorkspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<StudioWorkspace | null>(null);
  const [currentProject, setCurrentProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    const res = await workspaceBusinessService.findAll({ page: 0, size: 50 });
    if (res.success && res.data) {
      setWorkspaces(res.data.content);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadWorkspaces();
      setIsLoading(false);
    };
    init();
  }, [loadWorkspaces]);

  const addWorkspace = useCallback(async (name: string, description?: string, icon?: string) => {
    const res = await workspaceBusinessService.createWorkspace(name, description, icon);
    if (res.success) {
      await loadWorkspaces();
      if (res.data) {
        setCurrentWorkspace(res.data);
      }
    }
  }, [loadWorkspaces]);

  const editWorkspace = useCallback(async (uuid: string, name: string) => {
    const res = await workspaceBusinessService.updateWorkspace(uuid, name);
    if (res.success) {
      await loadWorkspaces();
      setCurrentWorkspace((prev) => (prev && prev.uuid === uuid ? { ...prev, name } : prev));
    }
  }, [loadWorkspaces]);

  const removeWorkspace = useCallback(async (uuid: string) => {
    await workspaceBusinessService.deleteWorkspace(uuid);
    await loadWorkspaces();
    setCurrentWorkspace((prev) => (prev && prev.uuid === uuid ? null : prev));
    setCurrentProject((prev) => (prev && prev.workspaceId === uuid ? null : prev));
  }, [loadWorkspaces]);

  const addProject = useCallback(async (name: string, type: ProjectType, description: string, coverImage?: { data: Uint8Array, name: string }) => {
    if (!currentWorkspace) return;
    const res = await workspaceBusinessService.saveProject(currentWorkspace.uuid, { name, type, description, coverImage } as any);
    if (res.success) {
      await loadWorkspaces();
    }
  }, [currentWorkspace, loadWorkspaces]);

  const removeProject = useCallback(async (workspaceUuid: string, projectUuid: string) => {
    await workspaceBusinessService.deleteProject(workspaceUuid, projectUuid);
    await loadWorkspaces();
  }, [loadWorkspaces]);

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

export const useWorkspaceStore = () => {
  const context = useContext(WorkspaceStoreContext);
  if (!context) throw new Error('useWorkspaceStore must be used within a WorkspaceStoreProvider');
  return context;
};

