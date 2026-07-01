// Editor Session Entity
// TODO: Define editor session entity structure
export interface EditorSession {
  id: string;
  projectId: string;
  openedFiles: string[];
  activeFile: string | null;
  createdAt: number;
  updatedAt: number;
}
