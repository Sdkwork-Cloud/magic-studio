
;
import { CanvasBoard, CanvasElement, CanvasExportMode } from '../entities/canvas.entity';
import { AnyMediaResource, MediaResourceType, generateUUID } from '@sdkwork/react-commons';
import { 
    CutProject, CutTimeline, CutTrack, CutClip, CutClipTransform, CutTrackType,
    TIMELINE_CONSTANTS
} from '@sdkwork/react-magiccut';

// --- Constants ---
const DEFAULT_DURATIONS: Record<string, number> = {
    [MediaResourceType.IMAGE]: 5,
    [MediaResourceType.TEXT]: 5,
    [MediaResourceType.VIDEO]: 10, // Fallback if metadata missing
    [MediaResourceType.AUDIO]: 10,
    'note': 5,
    'shape': 5,
    'text': 5
};

const PROJECT_WIDTH = 1920;
const PROJECT_HEIGHT = 1080;

// --- Graph Structures ---

interface GraphNode {
    id: string;
    element: CanvasElement;
    duration: number;
    
    // Topology
    parents: string[];
    children: string[];
    
    // Scheduling (Calculated)
    startTime: number;
    endTime: number;
    trackIndex: number;
}

interface Island {
    id: string;
    nodes: GraphNode[];
    bounds: { x: number; y: number; w: number; h: number }; 
}

/**
 * Advanced Converter: Canvas (2D Spatial Graph) -> Magic Cut (1D Linear Timeline)
 */
export class CanvasToCutConverter {
    
    public convert(board: CanvasBoard, exportMode: CanvasExportMode = 'video_only'): CutProject {
        const now = Date.now();
        const resources: Record<string, AnyMediaResource> = {};
        
        // 1. Filter Elements & Harvest Resources
        const validElements = this.filterElements(board.elements, exportMode);
        
        validElements.forEach(el => {
            if (el.resource) {
                // Ensure resource is indexed in the global map
                // Critical: We must preserve the path if it exists (assets://) for the player to resolve it
                resources[el.resource.id] = { ...el.resource };
            }
        });

        // 2. Build Graph (Nodes & Edges)
        const nodesMap = this.buildGraph(validElements, board.elements);

        // 3. Detect Islands (Connected Components)
        const islands = this.detectIslands(nodesMap);

        // 4. Sort Islands Spatially (Top -> Bottom, Left -> Right)
        // This linearizes the "Scenes" laid out on the canvas
        this.sortIslands(islands);

        // 5. Schedule & Pack
        // We will accumulate clips into tracks
        const trackBuckets: Map<number, CutClip[]> = new Map(); 
        let globalTimeOffset = 0;

        for (const island of islands) {
            // A. Local Topological Schedule (Relative Times within Island)
            this.scheduleIsland(island);

            // B. Global Track Packing
            // We shift this island's nodes by globalTimeOffset and pack them into tracks
            const islandDuration = this.packIslandToTracks(island, globalTimeOffset, trackBuckets, resources);
            
            // Increment global time for next scene
            globalTimeOffset += islandDuration + 1.0; // 1 second gap between scenes
        }

        // 6. Assemble CutProject
        const tracks: CutTrack[] = [];
        const allClips: CutClip[] = [];
        
        // Sort bucket keys (0, 1, 2...)
        const sortedTrackIndices = Array.from(trackBuckets.keys()).sort((a, b) => a - b);

        sortedTrackIndices.forEach((trackIdx) => {
            const bucketClips = trackBuckets.get(trackIdx) || [];
            if (bucketClips.length === 0) return;

            const trackId = generateUUID();
            
            // Determine Track Type based on majority content
            const type: CutTrackType = this.determineTrackType(bucketClips, resources);

            // Fixup clips with track ID
            const clipsWithTrack = bucketClips.map(c => ({
                ...c,
                track: { id: trackId, uuid: '', type: 'CutTrack' }
            }));
            
            allClips.push(...clipsWithTrack);

            tracks.push({
                id: trackId,
                uuid: generateUUID(),
                type,
                name: trackIdx === 0 ? 'Main Track' : `Track ${trackIdx + 1}`,
                order: trackIdx,
                isMain: trackIdx === 0,
                clips: clipsWithTrack.map(c => ({ id: c.id, uuid: c.uuid, type: 'CutClip' })),
                height: type === 'video' ? TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO : TIMELINE_CONSTANTS.TRACK_HEIGHT_AUDIO,
                visible: true,
                locked: false,
                muted: false,
                volume: 1.0,
                createdAt: now,
                updatedAt: now
            });
        });
        
        // Ensure at least one empty track if result is empty
        if (tracks.length === 0) {
            const tid = generateUUID();
            tracks.push({
                id: tid, uuid: generateUUID(), type: 'video', name: 'Main Track', order: 0, isMain: true, clips: [],
                height: TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO, visible: true, locked: false, muted: false, volume: 1.0, createdAt: now, updatedAt: now
            });
        }

        const timelineId = generateUUID();
        const projectId = generateUUID();

        const timeline: CutTimeline = {
            id: timelineId,
            uuid: timelineId,
            name: 'Generated Sequence',
            fps: 30,
            duration: Math.max(60, globalTimeOffset),
            tracks: tracks.map(t => ({ id: t.id, uuid: t.uuid, type: 'CutTrack' })),
            createdAt: now,
            updatedAt: now
        };

        const normalizedTracks: Record<string, CutTrack> = {};
        tracks.forEach(t => normalizedTracks[t.id] = t);
        
        const normalizedClips: Record<string, CutClip> = {};
        allClips.forEach(c => normalizedClips[c.id] = c);

        return {
            id: projectId,
            uuid: projectId,
            name: board.title || 'Canvas Export',
            version: 1,
            description: `Auto-generated from Canvas. ${allClips.length} clips created.`,
            timelines: [{ id: timeline.id, uuid: timeline.uuid, type: 'CutTimeline' }],
            mediaResources: Object.values(resources).map(r => ({ id: r.id, uuid: r.uuid, type: 'MediaResource' })),
            settings: {
                resolution: `${PROJECT_WIDTH}x${PROJECT_HEIGHT}`,
                fps: 30,
                aspectRatio: '16:9'
            },
            sourceCanvasId: board.uuid,
            normalizedState: {
                resources,
                timelines: { [timelineId]: timeline },
                tracks: normalizedTracks,
                clips: normalizedClips,
                layers: {}
            },
            createdAt: now,
            updatedAt: now
        };
    }

    // --- Helper Logic ---
    
    private determineTrackType(clips: CutClip[], resources: Record<string, AnyMediaResource>): CutTrackType {
        let hasVisual = false;
        for (const clip of clips) {
            const res = resources[clip.resource.id];
            if (res) {
                if (res.type === MediaResourceType.VIDEO || res.type === MediaResourceType.IMAGE || res.type === MediaResourceType.TEXT) {
                    hasVisual = true;
                    break;
                }
            }
        }
        return hasVisual ? 'video' : 'audio';
    }

    // --- Graph Building ---

    private filterElements(elements: CanvasElement[], mode: CanvasExportMode): CanvasElement[] {
        return elements.filter(el => {
            if (el.type === 'connector' || el.type === 'group') return false;
            
            // 1. Text/Note/Shape always valid (synthesized resource)
            if (el.type === 'text' || el.type === 'note' || el.type === 'shape') return true;

            // 2. Media Nodes (Image/Video) MUST have a resource with content (Path or URL)
            if (!el.resource) return false;
            
            const res = el.resource;
            const hasPath = res.path && res.path.trim().length > 0;
            const hasUrl = res.url && res.url.trim().length > 0;
            
            // Skip empty placeholders (newly created nodes without uploads)
            // This prevents "ThumbnailGenerator" errors where empty resources are passed downstream
            if (!hasPath && !hasUrl) return false;

            const rType = res.type;
            
            // Handle export modes
            if (mode === 'image_only') {
                return rType === MediaResourceType.IMAGE;
            }
            // For video_only or mixed, we accept most visual types
            return true; 
        });
    }

    private buildGraph(nodes: CanvasElement[], allElements: CanvasElement[]): Map<string, GraphNode> {
        const graph = new Map<string, GraphNode>();
        
        // 1. Create Nodes
        nodes.forEach(el => {
            let duration = 5; // Default fallback

            // STRICT DURATION LOGIC:
            // 1. Check top-level duration property (MediaResource)
            // 2. Check metadata.duration (AssetMetadata)
            // 3. Fallback to type default
            if (el.resource) {
                const r = el.resource as any;
                
                if (typeof r.duration === 'number' && r.duration > 0) {
                    duration = r.duration;
                } else if (r.metadata && typeof r.metadata.duration === 'number' && r.metadata.duration > 0) {
                    duration = r.metadata.duration;
                } else {
                     // Fallback based on type
                     duration = DEFAULT_DURATIONS[el.resource.type] || 5;
                }
            } else {
                duration = DEFAULT_DURATIONS[el.type] || 5;
            }

            // Safety clamp
            if (isNaN(duration) || duration <= 0) duration = 5;

            graph.set(el.id, {
                id: el.id,
                element: el,
                duration,
                parents: [],
                children: [],
                startTime: 0,
                endTime: 0,
                trackIndex: 0
            });
        });

        // 2. Link Edges
        // Iterate all connectors to find relationships between VALID nodes
        const connectors = allElements.filter(e => e.type === 'connector');
        connectors.forEach(conn => {
            const from = conn.data?.connection?.from;
            const to = conn.data?.connection?.to;
            if (from && to && graph.has(from) && graph.has(to)) {
                graph.get(from)!.children.push(to);
                graph.get(to)!.parents.push(from);
            }
        });

        return graph;
    }

    // --- Spatial Clustering ---

    private detectIslands(graph: Map<string, GraphNode>): Island[] {
        const islands: Island[] = [];
        const visited = new Set<string>();

        const traverse = (nodeId: string, currentGroup: GraphNode[]) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            const node = graph.get(nodeId);
            if (!node) return;
            currentGroup.push(node);
            
            // Traverse both directions to find full connected component
            [...node.children, ...node.parents].forEach(pid => traverse(pid, currentGroup));
        };

        for (const nodeId of graph.keys()) {
            if (!visited.has(nodeId)) {
                const group: GraphNode[] = [];
                traverse(nodeId, group);
                
                // Calc Bounds
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                group.forEach(n => {
                    minX = Math.min(minX, n.element.x);
                    minY = Math.min(minY, n.element.y);
                    maxX = Math.max(maxX, n.element.x + n.element.width);
                    maxY = Math.max(maxY, n.element.y + n.element.height);
                });

                islands.push({
                    id: generateUUID(),
                    nodes: group,
                    bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
                });
            }
        }
        return islands;
    }

    private sortIslands(islands: Island[]) {
        // Sort by Y first (Rows), then X (Columns)
        // We use a threshold to determine if islands are roughly on the "same row"
        const ROW_TOLERANCE = 200; 

        islands.sort((a, b) => {
            const yDiff = a.bounds.y - b.bounds.y;
            if (Math.abs(yDiff) > ROW_TOLERANCE) {
                return yDiff; // Different rows
            }
            return a.bounds.x - b.bounds.x; // Same row, sort left-to-right
        });
    }

    // --- Scheduling ---

    private scheduleIsland(island: Island) {
        // Critical Path Method (CPM) for DAG
        // 1. Calculate Earliest Start Time (EST)
        
        // We need Topological Sort first to process dependencies in order
        const sorted = this.topologicalSort(island.nodes);
        
        // Map for fast lookup
        const timeMap = new Map<string, { start: number, end: number }>();
        
        sorted.forEach(node => {
            let maxParentEndTime = 0;
            
            node.parents.forEach(pid => {
                const pTime = timeMap.get(pid);
                if (pTime) {
                    maxParentEndTime = Math.max(maxParentEndTime, pTime.end);
                }
            });
            
            node.startTime = maxParentEndTime;
            node.endTime = node.startTime + node.duration;
            
            timeMap.set(node.id, { start: node.startTime, end: node.endTime });
        });
    }

    private topologicalSort(nodes: GraphNode[]): GraphNode[] {
        const inDegree = new Map<string, number>();
        const queue: GraphNode[] = [];
        const result: GraphNode[] = [];

        nodes.forEach(n => {
            // Count parents ONLY within this island/list
            const validParents = n.parents.filter(p => nodes.some(x => x.id === p));
            inDegree.set(n.id, validParents.length);
            if (validParents.length === 0) queue.push(n);
        });
        
        // Sort initial queue spatially (Y then X) so parallel starts are deterministic
        queue.sort((a, b) => (a.element.y - b.element.y) || (a.element.x - b.element.x));

        while(queue.length > 0) {
            const u = queue.shift()!;
            result.push(u);
            
            u.children.forEach(vId => {
                const v = nodes.find(n => n.id === vId);
                if (v) {
                    inDegree.set(v.id, (inDegree.get(v.id) || 0) - 1);
                    if (inDegree.get(v.id) === 0) queue.push(v);
                }
            });
        }
        
        // Add any remaining (cycles? disjoint?)
        if (result.length < nodes.length) {
            const seen = new Set(result.map(r => r.id));
            const remain = nodes.filter(n => !seen.has(n.id));
            // Just append them sequentially
            let lastEnd = result.length > 0 ? result[result.length-1].endTime : 0;
            remain.forEach(n => {
                n.startTime = lastEnd;
                n.endTime = n.startTime + n.duration;
                result.push(n);
                lastEnd = n.endTime;
            });
        }
        
        return result;
    }

    // --- Track Packing ---

    private packIslandToTracks(
        island: Island, 
        globalOffset: number, 
        trackBuckets: Map<number, CutClip[]>,
        resources: Record<string, AnyMediaResource>
    ): number {
        // Sort nodes by StartTime asc, then Duration desc
        const nodes = [...island.nodes].sort((a, b) => {
            if (Math.abs(a.startTime - b.startTime) > 0.01) return a.startTime - b.startTime;
            return b.duration - a.duration;
        });

        // Initialize free times for tracks based on existing buckets
        const trackFreeTimes: number[] = []; 
        const maxTrackIndex = Math.max(...Array.from(trackBuckets.keys()), -1);
        
        for (let i = 0; i <= maxTrackIndex; i++) {
             const clips = trackBuckets.get(i) || [];
             if (clips.length > 0) {
                 const lastClip = clips[clips.length - 1]; 
                 trackFreeTimes[i] = lastClip.start + lastClip.duration;
             } else {
                 trackFreeTimes[i] = 0;
             }
        }

        let islandMaxEnd = 0;

        for (const node of nodes) {
            // Shift to global time
            const absStart = globalOffset + node.startTime;
            const absEnd = globalOffset + node.endTime;
            islandMaxEnd = Math.max(islandMaxEnd, absEnd);

            let chosenTrack = -1;

            // Greedy Search: Find first track where this fits
            for (let t = 0; t < trackFreeTimes.length; t++) {
                // Check if track is free at absStart (with tiny buffer)
                if (trackFreeTimes[t] <= absStart + 0.01) {
                    chosenTrack = t;
                    break;
                }
            }

            // If no track fits, create new
            if (chosenTrack === -1) {
                chosenTrack = trackFreeTimes.length;
                trackFreeTimes.push(0);
            }

            // Update Track Busy Time
            trackFreeTimes[chosenTrack] = absEnd;

            // Generate Clip
            const clip = this.createClip(node, absStart, resources);
            if (clip) {
                if (!trackBuckets.has(chosenTrack)) trackBuckets.set(chosenTrack, []);
                trackBuckets.get(chosenTrack)!.push(clip);
            }
        }
        
        // Return duration of this island
        return islandMaxEnd - globalOffset;
    }

    private createClip(node: GraphNode, absStart: number, resources: Record<string, AnyMediaResource>): CutClip | null {
        // Synthesize resource if missing (e.g. for Shape/Text nodes that don't have one yet)
        let res = node.element.resource ? resources[node.element.resource.id] : undefined;
        
        if (!res) {
             // Fallback generation for non-resource elements
             if (node.element.type === 'text' || node.element.type === 'note') {
                 // Create text resource
                 res = {
                     id: generateUUID(),
                     uuid: generateUUID(),
                     type: MediaResourceType.TEXT,
                     name: 'Text Node',
                     createdAt: Date.now(), updatedAt: Date.now(),
                     metadata: { text: (node.element.data as any)?.text || "Text" }
                 };
                 // Add to global registry so it can be referenced
                 resources[res.id] = res;
             } else {
                 // Skip unsupported nodes without resource (e.g. connectors, groups, pure shapes)
                 return null;
             }
        }

        const transform = this.calculateFitTransform(
            (res as any).width || node.element.width || 1000, 
            (res as any).height || node.element.height || 1000, 
            PROJECT_WIDTH, PROJECT_HEIGHT
        );

        return {
            id: generateUUID(),
            uuid: generateUUID(),
            track: { id: '', uuid: '', type: 'CutTrack' }, // Populated later by track builder
            resource: { id: res.id, uuid: res.uuid, type: 'MediaResource' },
            start: absStart,
            duration: node.duration,
            offset: 0,
            speed: 1,
            volume: 1,
            layers: [],
            transform: transform,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    private calculateFitTransform(
        mediaW: number, mediaH: number, 
        projectW: number, projectH: number
    ): CutClipTransform {
        // Avoid div by zero
        if (mediaH === 0 || mediaW === 0) return { x: 0, y: 0, width: projectW, height: projectH, rotation: 0, scale: 1, opacity: 1 };

        // Ensure positive dimensions to avoid inversion
        mediaW = Math.abs(mediaW);
        mediaH = Math.abs(mediaH);

        const mediaRatio = mediaW / mediaH;
        const projectRatio = projectW / projectH;
        
        let finalW = projectW;
        let finalH = projectH;

        // Contain Logic (Letterbox) - ensure entire media is visible
        if (mediaRatio > projectRatio) {
            // Media is wider -> Fit Width
            finalW = projectW;
            finalH = projectW / mediaRatio;
        } else {
            // Media is taller -> Fit Height
            finalH = projectH;
            finalW = projectH * mediaRatio;
        }
        
        const x = (projectW - finalW) / 2;
        const y = (projectH - finalH) / 2;

        return {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(finalW),
            height: Math.round(finalH),
            rotation: 0,
            scale: 1, // Absolute
            opacity: 1
        };
    }
}

export const canvasToCutConverter = new CanvasToCutConverter();
