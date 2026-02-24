// Types for Editor Package
export interface EditorFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isPreview: boolean;
}

export interface GitSyncOptions {
  repository: string;
  branch: string;
  token: string;
}

export interface PublishOptions {
  appName: string;
  version: string;
  target: string;
  autoDeploy?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
