// Canvas project type definitions
// All canvas-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

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
  referenceImages?: string[];
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  videoMode?: string;
  status?: 'idle' | 'generating' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  error?: string;
}

// ============================================================================
// Canvas Media Resource
// ============================================================================

export interface CanvasMediaResource {
  id: string;
  uuid?: string;
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

// ============================================================================
// Canvas Element
// ============================================================================

export interface CanvasElement {
  id: string;
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

export interface CanvasBoard extends BaseEntity {
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

export interface CanvasProject extends BaseEntity {
  type: 'CANVAS_PROJECT';
  name: string;
  description?: string;
  boards: CanvasBoard[];
  activeBoardId?: string;
}
