
import { CutTimeline, CutTrack, CutClip, CutLayer } from '../entities';
import { AnyMediaResource, MediaResourceType } from '@sdkwork/react-commons';
;

export interface NormalizedState {
    resources: Record<string, AnyMediaResource>;
    timelines: Record<string, CutTimeline>;
    tracks: Record<string, CutTrack>;
    clips: Record<string, CutClip>;
    layers: Record<string, CutLayer>;
}

export type EditTool = 'select' | 'trim' | 'ripple' | 'roll' | 'slip' | 'slide' | 'razor';

export type InteractionType = 'move' | 'trim-start' | 'trim-end' | 'idle' | 'marquee' | 'select-region' | 'ripple-trim' | 'roll-trim' | 'slip-trim' | 'slide-trim' | 'razor-cut';

export interface MarqueeState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startTime: number;
    endTime: number;
    trackIds: string[];
}

export interface InteractionState {
    type: InteractionType;
    clipId: string | null;       
    initialX: number;            
    initialY: number;            
    initialStartTime: number;    
    initialDuration: number;     
    initialTrackId: string;      
    initialOffset: number;       
    currentTrackId: string | null; 
    currentTime: number; 
    isSnapping: boolean;
    snapLines: number[]; 
    validDrop: boolean;
    hasCollision: boolean;
    insertTrackIndex: number | null;
    marqueeStart?: { x: number, y: number };
    marqueeCurrent?: { x: number, y: number };
    marquee?: MarqueeState;
    editTool?: EditTool;
    razorTime?: number;
}

export interface DragOperation {
    type: 'resource';
    payload: AnyMediaResource; 
    resourceType: MediaResourceType; 
    duration: number; 
    ghostWidth: number; 
    initialX?: number;
    initialY?: number;
}

export interface SelectionState {
    selectedClipIds: Set<string>;
    selectedTrackId: string | null;
    lastSelectedClipId: string | null;
    selectionAnchorTime: number | null;
}

export interface ClipLink {
    id: string;
    linkedClipIds: Set<string>;
    linkType: 'video-audio' | 'group';
}

export interface EditModeState {
    currentTool: EditTool;
    rippleMode: boolean;
    linkedSelection: boolean;
}

