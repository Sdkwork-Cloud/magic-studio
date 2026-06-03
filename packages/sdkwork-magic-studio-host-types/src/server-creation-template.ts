import type {
  MagicStudioCreationSessionAttachment,
  MagicStudioCreationSessionTarget,
} from './server-creation-session.ts';

export interface MagicStudioCreationTemplateStep {
  id: string;
  name: string;
  description?: string;
  target: MagicStudioCreationSessionTarget;
  presetId?: string;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments: MagicStudioCreationSessionAttachment[];
}

export interface MagicStudioCreationTemplate {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  primaryTarget: MagicStudioCreationSessionTarget;
  workspaceId: string;
  projectId?: string;
  category?: string;
  defaultStepId: string;
  steps: MagicStudioCreationTemplateStep[];
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MagicStudioCreationTemplateListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  primaryTarget?: MagicStudioCreationSessionTarget;
  workspaceId?: string;
  projectId?: string;
  favoriteOnly?: boolean;
  category?: string;
}

export interface MagicStudioCreateCreationTemplateStepRequest {
  id?: string;
  name: string;
  description?: string;
  target: MagicStudioCreationSessionTarget;
  presetId?: string;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments?: MagicStudioCreationSessionAttachment[];
}

export interface MagicStudioCreateCreationTemplateRequest {
  name: string;
  description?: string;
  primaryTarget: MagicStudioCreationSessionTarget;
  workspaceId: string;
  projectId?: string;
  category?: string;
  defaultStepId?: string;
  steps: MagicStudioCreateCreationTemplateStepRequest[];
  tags?: string[];
  isFavorite?: boolean;
}

export interface MagicStudioUpdateCreationTemplateRequest {
  name?: string;
  description?: string | null;
  primaryTarget?: MagicStudioCreationSessionTarget;
  workspaceId?: string;
  projectId?: string | null;
  category?: string | null;
  defaultStepId?: string | null;
  steps?: MagicStudioCreateCreationTemplateStepRequest[];
  tags?: string[];
  isFavorite?: boolean;
}

export interface MagicStudioApplyCreationTemplateRequest {
  stepId?: string;
  projectId?: string | null;
  prompt?: string | null;
  genMode?: string | null;
  model?: string | null;
  styleId?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  duration?: string | null;
  attachments?: MagicStudioCreationSessionAttachment[];
}
