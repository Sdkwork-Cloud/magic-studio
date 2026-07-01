// Notes type definitions
// All notes-related types are defined here to avoid circular dependencies

import type { ClientEntityIdentity } from './base.types';

// ============================================================================
// Note Type
// ============================================================================

export type NoteType = 'doc' | 'article' | 'novel' | 'log' | 'news' | 'code';

export type PublishStatus = 'draft' | 'publishing' | 'published' | 'failed' | 'archived';

// ============================================================================
// Note Metadata
// ============================================================================

export interface NoteMetadata {
  wordCount?: number;
  readingTime?: number;
  coverImage?: string;
  icon?: string;
  author?: string;
  tags?: string[];
  customWidth?: string; // e.g. '65ch', '100%'
}

// ============================================================================
// Note Summary (Lightweight)
// ============================================================================

export interface NoteSummary extends ClientEntityIdentity {
  title: string;
  type: NoteType;
  parentId: string | null;
  tags: string[];
  isFavorite: boolean;
  snippet: string; // Plain text preview (first 300 chars)
  publishStatus?: PublishStatus;
  metadata?: NoteMetadata;
}

// ============================================================================
// Full Note
// ============================================================================

export interface Note extends NoteSummary {
  content: string; // Full HTML Content for TipTap
}

// ============================================================================
// Note Folder
// ============================================================================

export interface NoteFolder extends ClientEntityIdentity {
  name: string;
  parentId: string | null;
}

export interface NoteWorkspaceSnapshot {
  notes: NoteSummary[];
  trashedNotes: NoteSummary[];
  folders: NoteFolder[];
}

// ============================================================================
// Tree Item for UI
// ============================================================================

export type TreeNote = NoteSummary & { kind: 'note'; children?: never };

export type TreeFolder = NoteFolder & { kind: 'folder'; children?: TreeItem[]; isExpanded?: boolean };

export type TreeItem = TreeNote | TreeFolder;

// ============================================================================
// Publish Target
// ============================================================================

export interface PublishTarget {
  accountId: string;
  platform: string;
  name: string;
  status: PublishStatus;
  resultUrl?: string;
  error?: string;
}

// ============================================================================
// Article Payload
// ============================================================================

export interface ArticlePayload {
  id?: string;
  title: string;
  content: string;
  markdown?: string;
  coverImage?: string;
  coverAssetId?: string | null;
  coverAssetUuid?: string | null;
  coverPrimaryResourceId?: string | null;
  coverPrimaryResourceUuid?: string | null;
  coverResourceViewId?: string | null;
  coverResourceViewUuid?: string | null;
  digest?: string;
  author?: string;
  originalUrl?: string;
  tags?: string[];
}

// ============================================================================
// Publish Result
// ============================================================================

export interface PublishResult {
  success: boolean;
  platformId: string;
  message?: string;
  url?: string;
  postId?: string;
}

// ============================================================================
// Publishing Log
// ============================================================================

export interface PublishingLog {
  id: string;
  noteId: string;
  timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
  targets: PublishTarget[];
}

// ============================================================================
// Note AI Generation
// ============================================================================

export interface NoteGenerationConfig {
  prompt: string;
  type?: NoteType;
  tone?: 'professional' | 'casual' | 'academic' | 'creative';
  length?: 'short' | 'medium' | 'long';
  language?: string;
}

export interface NoteGenerationTask extends ClientEntityIdentity {
  config: NoteGenerationConfig;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  result?: string;
  error?: string;
}
