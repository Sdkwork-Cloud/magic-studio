import type {
  MagicStudioCreationSessionAttachment,
  MagicStudioCreationSessionTarget,
} from './server-creation-session.ts';

export interface MagicStudioCreationPreset {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  target: MagicStudioCreationSessionTarget;
  workspaceId: string;
  projectId?: string;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments: MagicStudioCreationSessionAttachment[];
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MagicStudioCreationPresetListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  target?: MagicStudioCreationSessionTarget;
  workspaceId?: string;
  projectId?: string;
  favoriteOnly?: boolean;
}

export interface MagicStudioCreateCreationPresetRequest {
  name: string;
  description?: string;
  target: MagicStudioCreationSessionTarget;
  workspaceId: string;
  projectId?: string;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments?: MagicStudioCreationSessionAttachment[];
  tags?: string[];
  isFavorite?: boolean;
}

export interface MagicStudioUpdateCreationPresetRequest {
  name?: string;
  description?: string | null;
  target?: MagicStudioCreationSessionTarget;
  workspaceId?: string;
  projectId?: string | null;
  prompt?: string | null;
  genMode?: string | null;
  model?: string | null;
  styleId?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  duration?: string | null;
  attachments?: MagicStudioCreationSessionAttachment[];
  tags?: string[];
  isFavorite?: boolean;
}
