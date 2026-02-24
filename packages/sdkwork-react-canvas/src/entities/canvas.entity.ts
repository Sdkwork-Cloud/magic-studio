
import { BaseEntity } from 'sdkwork-react-commons';
import { AnyMediaResource } from 'sdkwork-react-commons';

export type CanvasElementType = 'note' | 'shape' | 'text' | 'image' | 'video' | 'connector' | 'group';
export type CanvasExportMode = 'video_only' | 'mixed' | 'image_only';

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

export interface CanvasElement {
    id: string;
    type: CanvasElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
    resource?: AnyMediaResource;
    color?: string; 
    style?: Record<string, any>;
    selected?: boolean;
    groupId?: string;
    groupChildren?: string[];
    data?: CanvasNodeData;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface CanvasBoard extends BaseEntity {
    title: string;
    elements: CanvasElement[];
}

export interface SnapLine {
    id: string;
    type: 'vertical' | 'horizontal';
    position: number;
    start: number;
    end: number;
}

export interface ConnectionDraft {
    sourceId: string;
    sourceRect: { x: number; y: number; w: number; h: number };
    portType: 'in' | 'out';
    currentX: number;
    currentY: number;
}

export interface DraftLine {
    x1: number;
    y1: number;
    w1: number;
    h1: number;
    x2: number;
    y2: number;
}

export interface DropMenuState {
    x: number;
    y: number;
    sourceId?: string;
    portType?: 'in' | 'out';
    worldX: number;
    worldY: number;
    draftLine?: DraftLine;
}

export interface MarqueeState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export interface ContextMenuState {
    x: number;
    y: number;
    targetId: string | null;
}
