import { BaseEntity } from 'sdkwork-react-commons';

export type NoteType = 'doc' | 'article' | 'novel' | 'log' | 'news' | 'code';

export interface NoteMetadata {
  wordCount?: number;
  readingTime?: number;
  coverImage?: string;
  icon?: string;
  author?: string;
  tags?: string[];
  customWidth?: string; // e.g. '65ch', '100%'
}

// Lightweight summary for lists and search index
// Does NOT contain the full 'content' HTML string
export interface NoteSummary extends BaseEntity {
  title: string;
  type: NoteType;
  parentId: string | null; 
  tags: string[];
  isFavorite: boolean;
  
  snippet: string; // Plain text preview (first 300 chars)
  
  // Publishing status
  publishStatus?: 'draft' | 'published' | 'archived';
  
  metadata?: NoteMetadata;
}

// Full Note entity
export interface Note extends NoteSummary {
  content: string; // Full HTML Content for TipTap
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

// Unified Tree Item for UI Rendering
export type TreeNote = NoteSummary & { kind: 'note'; children?: never };
export type TreeFolder = NoteFolder & { kind: 'folder'; children?: TreeItem[]; isExpanded?: boolean };
export type TreeItem = TreeNote | TreeFolder;
