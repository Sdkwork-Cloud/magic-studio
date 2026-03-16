declare module '@sdkwork/react-workspace' {
  export interface TradeProject {
    uuid?: string;
    name: string;
  }

  export interface TradeWorkspace {
    projects?: TradeProject[];
  }

  export interface TradeWorkspaceStore {
    currentWorkspace?: TradeWorkspace | null;
    currentProject?: TradeProject | null;
    setCurrentProject: (project: TradeProject) => void;
    addProject: (name: string, type: string, description?: string) => void;
  }

  export function useWorkspaceStore(): TradeWorkspaceStore;
}
