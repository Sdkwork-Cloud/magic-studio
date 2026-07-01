import type {
  PortalLaunchAttachmentRef,
  PortalLaunchTarget,
} from '@sdkwork/magic-studio-types/asset-center';

export const MAGIC_STUDIO_CREATION_SESSION_SOURCES = [
  'portal-video',
  'creation-template',
  'creation-batch',
] as const;

export type MagicStudioCreationSessionSource =
  (typeof MAGIC_STUDIO_CREATION_SESSION_SOURCES)[number];

export type MagicStudioCreationSessionAttachment = PortalLaunchAttachmentRef;
export type MagicStudioCreationSessionTarget = PortalLaunchTarget;

export interface MagicStudioCreationSession {
  sessionId: string;
  source: MagicStudioCreationSessionSource;
  target: MagicStudioCreationSessionTarget;
  prompt: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments: MagicStudioCreationSessionAttachment[];
  workspaceId: string;
  projectId?: string;
  createdAt: number;
  expiresAt: number;
}

export interface MagicStudioCreationSessionQuery {
  target?: MagicStudioCreationSessionTarget;
  workspaceId?: string;
  projectId?: string;
}

export interface MagicStudioCreateCreationSessionRequest {
  target: MagicStudioCreationSessionTarget;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments?: MagicStudioCreationSessionAttachment[];
  workspaceId: string;
  projectId?: string;
}

export interface MagicStudioCreationSessionSnapshot {
  session: MagicStudioCreationSession | null;
}
