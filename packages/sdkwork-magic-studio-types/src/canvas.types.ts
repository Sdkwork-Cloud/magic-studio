// Canvas project type definitions
// All canvas-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';
import type { ProjectGraphDocument } from './project-graph.types';

// ============================================================================
// Canvas Element Types
// ============================================================================

export type CanvasElementType = 'note' | 'shape' | 'text' | 'image' | 'video' | 'connector' | 'group';

export type CanvasExportMode = 'video_only' | 'mixed' | 'image_only';

// ============================================================================
// Canvas Node Data
// ============================================================================

export interface CanvasNodeData {
  label?: string;
  connection?: { from: string; to: string };
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  seed?: number;
  inputImageNodeId?: string;
  inputTextNodeId?: string;
  referenceImages?: CanvasMediaResource[];
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  videoMode?: string;
  status?: 'idle' | 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

// ============================================================================
// Canvas Media Resource
// ============================================================================

export interface CanvasMediaResource {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  name?: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  path?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  metadata?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    [key: string]: any;
  };
}

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirstString = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const resolveCanvasMediaResourceKey = (
  resource: Partial<CanvasMediaResource> | null | undefined
): string | null => {
  if (!resource) {
    return null;
  }

  return pickFirstString(
    resource.resourceViewUuid,
    resource.primaryResourceUuid,
    resource.assetUuid,
    resource.uuid,
    resource.resourceViewId,
    resource.primaryResourceId,
    resource.assetId,
    resource.id
  );
};

export const resolveCanvasMediaResourceUrl = (
  resource: Partial<CanvasMediaResource> | null | undefined
): string | null => {
  if (!resource) {
    return null;
  }

  return pickFirstString(resource.url, resource.path);
};

export const resolveOptionalCanvasMediaResourceUrl = (
  resource: Partial<CanvasMediaResource> | null | undefined
): string | undefined => resolveCanvasMediaResourceUrl(resource) ?? undefined;

// ============================================================================
// Canvas Element
// ============================================================================

export interface CanvasElement {
  id: EntityId;
  uuid: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  resource?: CanvasMediaResource;
  color?: string;
  style?: Record<string, any>;
  selected?: boolean;
  groupId?: string;
  groupChildren?: string[];
  data?: CanvasNodeData;
}

// ============================================================================
// Viewport
// ============================================================================

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// ============================================================================
// Canvas Board
// ============================================================================

export interface CanvasBoard extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'CANVAS_BOARD';
  title: string;
  elements: CanvasElement[];
  viewport?: Viewport;
  settings?: CanvasSettings;
}

export interface CanvasSettings {
  backgroundColor?: string;
  gridEnabled?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
  showRulers?: boolean;
}

// ============================================================================
// Snap Line
// ============================================================================

export interface SnapLine {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

// ============================================================================
// Connection Draft
// ============================================================================

export interface ConnectionDraft {
  sourceId: string;
  sourceRect: { x: number; y: number; w: number; h: number };
  portType: 'in' | 'out';
  currentX: number;
  currentY: number;
}

// ============================================================================
// Draft Line
// ============================================================================

export interface DraftLine {
  x1: number;
  y1: number;
  w1: number;
  h1: number;
  x2: number;
  y2: number;
}

// ============================================================================
// Drop Menu State
// ============================================================================

export interface DropMenuState {
  x: number;
  y: number;
  sourceId?: string;
  portType?: 'in' | 'out';
  worldX: number;
  worldY: number;
  draftLine?: DraftLine;
}

// ============================================================================
// Marquee State
// ============================================================================

export interface MarqueeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// ============================================================================
// Context Menu State
// ============================================================================

export interface ContextMenuState {
  x: number;
  y: number;
  targetId: string | null;
}

// ============================================================================
// Canvas Project
// ============================================================================

export interface CanvasProject extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'CANVAS_PROJECT';
  name: string;
  description?: string;
  boards: CanvasBoard[];
  activeBoardId?: string;
  projectGraph?: ProjectGraphDocument;
}
