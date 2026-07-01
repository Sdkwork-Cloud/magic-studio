import type { StudioProjectReleaseTarget } from '@sdkwork/magic-studio-types/workspace';

// Types for Editor Package
export interface EditorFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isPreview: boolean;
}

export interface EditorSession {
  id: string;
  uuid: string;
  rootPath: string | null;
  openFiles: Array<{
    path: string;
    isPreview?: boolean;
  }>;
  activeFilePath: string | null;
  selectedPath?: string | null;
  expandedPaths: string[];
  createdAt: string | number;
  updatedAt: string | number;
}

export interface EditorSessionProjectScope {
  workspaceId: string;
  projectId: string;
  projectRootPath: string;
}

export interface EditorProjectGovernanceScope extends EditorSessionProjectScope {}

export interface GitSyncOptions {
  repository: string;
  branch: string;
  token: string;
  message?: string;
}

export interface PublishOptions {
  appName: string;
  version: string;
  target: StudioProjectReleaseTarget;
  autoDeploy?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
