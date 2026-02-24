
export interface EditorFile {
  path: string;
  name: string;
  content?: string;
  isDirty?: boolean;
  language?: string;
  isPreview?: boolean; // If true, this file is in preview mode (italic tab)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}
