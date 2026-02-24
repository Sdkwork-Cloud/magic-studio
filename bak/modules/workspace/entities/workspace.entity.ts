
import { BaseEntity, ImageMediaResource } from '../../../types';

export type ProjectType = 'APP' | 'VIDEO' | 'AUDIO';

export interface StudioProject extends BaseEntity {
  id: string;          // Directory Name (slug)
  uuid: string;        // Unique ID
  name: string;
  type: ProjectType;
  description: string;
  workspaceId: string; // Reference to parent
  path?: string;       // Absolute or Relative path (computed)
  thumbnailUrl?: string;
  coverImage?: ImageMediaResource;
}

export interface StudioWorkspace extends BaseEntity {
  id: string;          // Directory Name (slug)
  uuid: string;        // Unique ID
  name: string;
  description?: string;
  projects: StudioProject[]; 
  path?: string;       // Absolute or Relative path (computed)
  icon?: string;
}
