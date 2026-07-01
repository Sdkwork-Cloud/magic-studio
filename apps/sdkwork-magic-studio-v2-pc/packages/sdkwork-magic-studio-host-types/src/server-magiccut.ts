import type { CutProject, TemplateMetadata } from '@sdkwork/magic-studio-types/magiccut';

export interface MagicStudioMagicCutProjectListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string[];
}

export interface MagicStudioMagicCutTemplateListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string[];
}

export interface MagicStudioMagicCutProjectCreateRequest {
  project: CutProject;
}

export interface MagicStudioMagicCutProjectUpdateRequest {
  project: CutProject;
}

export interface MagicStudioMagicCutProjectDuplicateRequest {
  name?: string;
}

export interface MagicStudioMagicCutTemplateInstantiateRequest {
  name?: string;
}

export interface MagicStudioMagicCutTemplateSaveRequest {
  metadata: TemplateMetadata;
  project: CutProject;
}

export type MagicStudioMagicCutRenderTarget = 'audio' | 'video';

export type MagicStudioMagicCutRenderFormat = 'wav' | 'mp4' | 'webm' | 'mov';

export type MagicStudioMagicCutRenderStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type MagicStudioMagicCutRenderArtifactRole = 'primary';

export interface MagicStudioMagicCutRenderError {
  code: string;
  message: string;
}

export interface MagicStudioMagicCutRenderTargetCapability {
  target: MagicStudioMagicCutRenderTarget;
  supported: boolean;
  formats: MagicStudioMagicCutRenderFormat[];
  defaultFormat?: MagicStudioMagicCutRenderFormat | null;
  reason?: string | null;
}

export interface MagicStudioMagicCutRenderCapabilities {
  queueing: boolean;
  targets: MagicStudioMagicCutRenderTargetCapability[];
}

export interface MagicStudioMagicCutRenderListQuery {
  page?: number;
  size?: number;
  projectId?: string;
  target?: MagicStudioMagicCutRenderTarget;
  status?: MagicStudioMagicCutRenderStatus;
  sort?: string[];
}

export interface MagicStudioMagicCutRenderCreateRequest {
  timelineId: string;
  target: MagicStudioMagicCutRenderTarget;
  format: MagicStudioMagicCutRenderFormat;
  fileName: string;
  startTimeSeconds?: number;
  endTimeSeconds?: number;
}

export interface MagicStudioMagicCutRenderArtifact {
  id: string;
  renderId: string;
  role: MagicStudioMagicCutRenderArtifactRole;
  target: MagicStudioMagicCutRenderTarget;
  format: MagicStudioMagicCutRenderFormat;
  fileName: string;
  relativePath: string;
  mimeType: string;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  createdAtMs: number;
}

export interface MagicStudioMagicCutRenderArtifactContent {
  artifactId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytesBase64: string;
}

export interface MagicStudioMagicCutRenderJob {
  id: string;
  projectId: string;
  timelineId: string;
  target: MagicStudioMagicCutRenderTarget;
  format: MagicStudioMagicCutRenderFormat;
  fileName: string;
  status: MagicStudioMagicCutRenderStatus;
  progress: number;
  stage?: string | null;
  rangeStartSeconds?: number | null;
  rangeEndSeconds?: number | null;
  createdAtMs: number;
  updatedAtMs: number;
  error?: MagicStudioMagicCutRenderError | null;
  artifacts: MagicStudioMagicCutRenderArtifact[];
}
