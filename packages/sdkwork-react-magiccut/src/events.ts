
import { AnyMediaResource } from 'sdkwork-react-commons';

/**
 * Domain Event Definitions for Magic Cut.
 * Naming Convention: Domain:Entity:Action
 */
export enum MagicCutEvents {
    // Clip Operations
    CLIP_DELETE = 'MagicCut:Clip:Delete',
    CLIP_SPLIT = 'MagicCut:Clip:Split',
    CLIP_TRIM_START = 'MagicCut:Clip:TrimStart',
    CLIP_TRIM_END = 'MagicCut:Clip:TrimEnd',
    CLIP_COPY = 'MagicCut:Clip:Copy',
    CLIP_PASTE = 'MagicCut:Clip:Paste',
    
    // Timeline Operations
    TIMELINE_ADD_CLIP = 'MagicCut:Timeline:AddClip', // Payload: TimelineAddClipPayload
    TIMELINE_SNAP_TOGGLE = 'MagicCut:Timeline:SnapToggle',
    TIMELINE_SKIMMING_TOGGLE = 'MagicCut:Timeline:SkimmingToggle',
    TIMELINE_ADD_MARKER = 'MagicCut:Timeline:AddMarker',
    
    // Timeline Skimming: Previewing the project sequence at a specific time
    TIMELINE_SKIM = 'MagicCut:Timeline:Skim', // Payload: SkimPayload (High Frequency)

    // Playback Operations
    PLAYBACK_TOGGLE = 'MagicCut:Playback:Toggle',
    PLAYBACK_SEEK = 'MagicCut:Playback:Seek', // Payload: SeekPayload (Commit/Jump)
    PLAYBACK_SCRUB = 'MagicCut:Playback:Scrub', // Payload: SeekPayload (High Frequency Drag)
    PLAYBACK_STOP = 'MagicCut:Playback:Stop',
    
    // View Operations
    VIEW_ZOOM = 'MagicCut:View:Zoom', // Payload: ZoomPayload
    VIEW_ZOOM_IN = 'MagicCut:View:ZoomIn',
    VIEW_ZOOM_OUT = 'MagicCut:View:ZoomOut',
    VIEW_FIT = 'MagicCut:View:Fit',
    
    // History
    HISTORY_UNDO = 'MagicCut:History:Undo',
    HISTORY_REDO = 'MagicCut:History:Redo',
    
    // UI
    UI_CONTEXT_MENU = 'MagicCut:UI:ContextMenu', // Payload: ContextMenuPayload

    // Resource Skimming: Previewing a single raw asset from the library
    RESOURCE_SKIM = 'MagicCut:Resource:Skim', // Payload: ResourceSkimPayload | null

    // Templates
    TEMPLATE_SAVED = 'MagicCut:Template:Saved'
}

export interface SeekPayload {
    time: number;
}

export interface ZoomPayload {
    level: number;
}

export interface SkimPayload {
    time: number | null;
}

export interface ResourceSkimPayload {
    time: number;
    resourceId: string;
}

export interface ContextMenuPayload {
    x: number;
    y: number;
    type: 'clip' | 'track' | 'timeline';
    id?: string | null; // clipId or trackId
    time?: number; // Time at cursor position
}

export interface TimelineAddClipPayload {
    trackId: string;
    resource: AnyMediaResource;
    start: number;
    duration?: number;
}

