import {
    CanvasBoard,
    CanvasElement,
    CanvasExportMode,
    resolveCanvasMediaResourceUrl
} from '../entities';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import {
    buildProjectGraphMediaSource,
    type ProjectGraphClip,
    type ProjectGraphDocument,
    type ProjectGraphEntityType,
    type ProjectGraphMediaSource,
    type ProjectGraphScene,
    type ProjectGraphSequence,
    type ProjectGraphShot,
    type ProjectGraphSurface,
    type ProjectGraphSurfaceBinding,
    type ProjectGraphTimeline,
    type ProjectGraphTrack,
} from '@sdkwork/magic-studio-types/project-graph';
import {
    type CutClip,
    type CutClipTransform,
    type CutProject,
    type CutTimeline,
    type CutTrack,
    type CutTrackType,
} from '@sdkwork/magic-studio-types/magiccut';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import {
    resolveEntityKey,
    type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import {
    createLocalCanvasEntityIdentity,
    normalizeCanvasEntityIdentity,
    resolveCanvasEntityKey,
    resolveCanvasEntityKeys
} from '../utils/canvasIdentity';

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
const CUT_TRACK_HEIGHTS = {
    video: 72,
    audio: 48
} as const;

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
    clipId?: string;
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
                // Ensure resource is indexed in the global map under a stable key.
                // Critical: We must preserve the path if it exists (assets://) for the player to resolve it.
                const normalizedResource = this.normalizeCanvasResource(el.resource, now);
                this.setEntityRecord(resources, normalizedResource);
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

            const trackIdentity = createLocalCanvasEntityIdentity();
            
            // Determine Track Type based on majority content
            const type: CutTrackType = this.determineTrackType(bucketClips, resources);

            // Fixup clips with track ID
            const clipsWithTrack = bucketClips.map(c => ({
                ...c,
                track: { id: null, uuid: trackIdentity.uuid, type: 'CutTrack' as const }
            }));
            
            allClips.push(...clipsWithTrack);

            tracks.push({
                id: null,
                uuid: trackIdentity.uuid,
                type: 'CutTrack',
                trackType: type,
                name: trackIdx === 0 ? 'Main Track' : `Track ${trackIdx + 1}`,
                order: trackIdx,
                isMain: trackIdx === 0,
                clips: clipsWithTrack.map(c => ({ id: null, uuid: c.uuid, type: 'CutClip' })),
                height: type === 'video' ? CUT_TRACK_HEIGHTS.video : CUT_TRACK_HEIGHTS.audio,
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
            const emptyTrackIdentity = createLocalCanvasEntityIdentity();
            tracks.push({
                id: null, uuid: emptyTrackIdentity.uuid, type: 'CutTrack', trackType: 'video', name: 'Main Track', order: 0, isMain: true, clips: [],
                height: CUT_TRACK_HEIGHTS.video, visible: true, locked: false, muted: false, volume: 1.0, createdAt: now, updatedAt: now
            });
        }

        const timelineIdentity = createLocalCanvasEntityIdentity();
        const projectIdentity = createLocalCanvasEntityIdentity();

        const timeline: CutTimeline = {
            id: null,
            uuid: timelineIdentity.uuid,
            type: 'CutTimeline',
            name: 'Generated Sequence',
            fps: 30,
            duration: Math.max(60, globalTimeOffset),
            tracks: tracks.map(t => ({ id: null, uuid: t.uuid, type: 'CutTrack' })),
            createdAt: now,
            updatedAt: now
        };

        const normalizedTracks: Record<string, CutTrack> = {};
        tracks.forEach((track) => {
            this.setEntityRecord(normalizedTracks, track);
        });
        
        const normalizedClips: Record<string, CutClip> = {};
        allClips.forEach((clip) => {
            this.setEntityRecord(normalizedClips, clip);
        });

        const projectGraph = this.buildProjectGraph({
            board,
            projectUuid: projectIdentity.uuid,
            projectName: board.title || 'Canvas Export',
            timeline,
            tracks,
            clips: normalizedClips,
            islands,
            resources,
            now
        });

        return {
            id: null,
            uuid: projectIdentity.uuid,
            type: 'CUT_PROJECT',
            name: board.title || 'Canvas Export',
            version: 1,
            description: `Auto-generated from Canvas. ${allClips.length} clips created.`,
            timelines: [{ id: null, uuid: timeline.uuid, type: 'CutTimeline' }],
            mediaResources: Object.values(resources).map(r => ({ id: r.id, uuid: r.uuid, type: 'MediaResource' })),
            settings: {
                resolution: `${PROJECT_WIDTH}x${PROJECT_HEIGHT}`,
                fps: 30,
                aspectRatio: '16:9'
            },
            sourceCanvasId: board.id || undefined,
            sourceCanvasUuid: board.uuid,
            projectGraph,
            normalizedState: {
                resources,
                timelines: { [timelineIdentity.uuid]: timeline },
                tracks: normalizedTracks,
                clips: normalizedClips,
                layers: {},
                projectGraph
            },
            createdAt: now,
            updatedAt: now
        };
    }

    // --- Helper Logic ---
    
    private determineTrackType(clips: CutClip[], resources: Record<string, AnyMediaResource>): CutTrackType {
        let hasVisual = false;
        for (const clip of clips) {
            const res = this.findEntityRecord(resources, clip.resource);
            if (res) {
                const resType = (res as any).type;
                if (resType === 'video' || resType === 'image' || resType === MediaResourceType.VIDEO || resType === MediaResourceType.IMAGE || resType === MediaResourceType.TEXT) {
                    hasVisual = true;
                    break;
                }
            }
        }
        return hasVisual ? 'video' : 'audio';
    }

    private normalizeCanvasResource(
        resource: CanvasElement['resource'],
        now: number
    ): AnyMediaResource {
        const normalizedIdentity = normalizeCanvasEntityIdentity(resource || {});
        const canonicalUrl = resolveCanvasMediaResourceUrl(resource) || '';
        const normalizedType = resource?.type === 'video'
            ? MediaResourceType.VIDEO
            : resource?.type === 'audio'
                ? MediaResourceType.AUDIO
                : MediaResourceType.IMAGE;

        return {
            id: normalizedIdentity.id,
            uuid: normalizedIdentity.uuid,
            type: normalizedType,
            name: resource?.name?.trim() || normalizedIdentity.uuid,
            url: canonicalUrl,
            path: resource?.path,
            metadata: resource?.metadata,
            duration: resource?.duration,
            width: resource?.width,
            height: resource?.height,
            size: resource?.size,
            extension: resource?.format,
            createdAt: now,
            updatedAt: now
        };
    }

    private setEntityRecord<T extends EntityIdentityLike>(records: Record<string, T>, entity: T): string {
        const recordKey = resolveEntityKey(entity);
        records[recordKey] = entity;
        return recordKey;
    }

    private findEntityRecord<T extends EntityIdentityLike>(
        records: Record<string, T>,
        entity: EntityIdentityLike | null | undefined
    ): T | undefined {
        const recordKey = this.findEntityRecordKey(records, entity);
        return recordKey ? records[recordKey] : undefined;
    }

    private findEntityRecordKey<T extends EntityIdentityLike>(
        records: Record<string, T>,
        entity: EntityIdentityLike | null | undefined
    ): string | null {
        if (!entity) {
            return null;
        }

        for (const entityKey of resolveCanvasEntityKeys(entity)) {
            if (records[entityKey]) {
                return entityKey;
            }
        }

        return null;
    }

    private setMappedEntityKeys(
        target: Map<string, string>,
        entity: EntityIdentityLike,
        value: string
    ): void {
        resolveCanvasEntityKeys(entity).forEach((entityKey) => {
            target.set(entityKey, value);
        });
    }

    private resolveMappedEntityKey(
        target: Map<string, string>,
        entity: EntityIdentityLike | null | undefined
    ): string | undefined {
        if (!entity) {
            return undefined;
        }

        for (const entityKey of resolveCanvasEntityKeys(entity)) {
            const mapped = target.get(entityKey);
            if (mapped) {
                return mapped;
            }
        }

        return undefined;
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
            
            if (mode === 'image_only') {
                return rType === 'image';
            }
            return true; 
        });
    }

    private buildGraph(nodes: CanvasElement[], allElements: CanvasElement[]): Map<string, GraphNode> {
        const graph = new Map<string, GraphNode>();
        const entityKeyMap = new Map<string, string>();
        
        // 1. Create Nodes
        nodes.forEach(el => {
            const elementKey = resolveCanvasEntityKey(el);
            resolveCanvasEntityKeys(el).forEach((key) => {
                entityKeyMap.set(key, elementKey);
            });
            let duration: number;

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

            graph.set(elementKey, {
                id: elementKey,
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
            const normalizedFrom = from ? entityKeyMap.get(from) || from : null;
            const normalizedTo = to ? entityKeyMap.get(to) || to : null;
            if (normalizedFrom && normalizedTo && graph.has(normalizedFrom) && graph.has(normalizedTo)) {
                graph.get(normalizedFrom)!.children.push(normalizedTo);
                graph.get(normalizedTo)!.parents.push(normalizedFrom);
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
                node.trackIndex = chosenTrack;
                node.clipId = resolveEntityKey(clip);
                if (!trackBuckets.has(chosenTrack)) trackBuckets.set(chosenTrack, []);
                trackBuckets.get(chosenTrack)!.push(clip);
            }
        }
        
        // Return duration of this island
        return islandMaxEnd - globalOffset;
    }

    private createClip(node: GraphNode, absStart: number, resources: Record<string, AnyMediaResource>): CutClip | null {
        // Synthesize resource if missing (e.g. for Shape/Text nodes that don't have one yet)
        let res = node.element.resource ? this.findEntityRecord(resources, node.element.resource) : undefined;
        
        if (!res) {
             // Fallback generation for non-resource elements
             if (node.element.type === 'text' || node.element.type === 'note') {
                 const synthesizedResourceIdentity = createLocalCanvasEntityIdentity();
                 // Create text resource
                 res = {
                      id: null,
                      uuid: synthesizedResourceIdentity.uuid,
                     type: MediaResourceType.TEXT,
                     name: 'Text Node',
                     createdAt: Date.now(), updatedAt: Date.now(),
                      metadata: { text: (node.element.data as any)?.text || "Text" }
                  };
                  // Add to global registry so it can be referenced
                  this.setEntityRecord(resources, res);
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
        const clipIdentity = createLocalCanvasEntityIdentity();

        return {
            id: null,
            uuid: clipIdentity.uuid,
            type: 'CutClip',
            track: { id: null, uuid: '', type: 'CutTrack' },
            resource: { id: res.id ?? null, uuid: res.uuid, type: 'MediaResource' },
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

    private buildProjectGraph(input: {
        board: CanvasBoard;
        projectUuid: string;
        projectName: string;
        timeline: CutTimeline;
        tracks: CutTrack[];
        clips: Record<string, CutClip>;
        islands: Island[];
        resources: Record<string, AnyMediaResource>;
        now: number;
    }): ProjectGraphDocument {
        const sequenceUuid = generateUUID();
        const timelineUuid = resolveEntityKey(input.timeline);
        const trackUuidByKey = new Map<string, string>();
        const tracks: Record<string, ProjectGraphTrack> = {};
        const clips: Record<string, ProjectGraphClip> = {};
        const scenes: Record<string, ProjectGraphScene> = {};
        const shots: Record<string, ProjectGraphShot> = {};
        const surfaceBindings: ProjectGraphSurfaceBinding[] = [];

        const project: ProjectGraphDocument['project'] = {
            ...this.createGraphIdentity(input.projectUuid, input.now),
            domain: 'unified',
            name: input.projectName,
            description: `Unified graph projected from canvas board ${input.board.uuid}.`,
            workspaceUuid: null,
            sequenceUuids: [sequenceUuid],
            timelineUuids: [timelineUuid],
            publishTargetUuids: [],
            metadata: {
                sourceSurface: 'canvas'
            }
        };

        const sequence: ProjectGraphSequence = {
            ...this.createGraphIdentity(sequenceUuid, input.now),
            projectUuid: project.uuid,
            name: input.board.title || 'Canvas Sequence',
            order: 0,
            boardUuid: input.board.uuid,
            timelineUuid,
            sceneUuids: [],
            shotUuids: [],
            metadata: {
                boardId: input.board.id
            }
        };

        const timelines: Record<string, ProjectGraphTimeline> = {
            [timelineUuid]: {
                ...this.createGraphIdentity(timelineUuid, input.now),
                projectUuid: project.uuid,
                sequenceUuid,
                name: input.timeline.name,
                fps: input.timeline.fps,
                duration: input.timeline.duration,
                trackUuids: input.tracks.map((track) => resolveEntityKey(track)),
                metadata: {
                    sourceTimelineId: input.timeline.id
                }
            }
        };

        input.tracks.forEach((track) => {
            const trackUuid = resolveEntityKey(track);
            this.setMappedEntityKeys(trackUuidByKey, track, trackUuid);
            tracks[trackUuid] = {
                ...this.createGraphIdentity(trackUuid, input.now),
                projectUuid: project.uuid,
                timelineUuid,
                order: track.order,
                trackType: track.trackType,
                name: track.name,
                clipUuids: track.clips.map((clip) => resolveEntityKey(clip)),
                metadata: {
                    sourceTrackId: track.id
                }
            };

            surfaceBindings.push(
                this.createSurfaceBinding(
                        input.now,
                        'magiccut-track',
                        track.id,
                        track.uuid,
                        'track',
                        trackUuid
                    )
            );
        });

        sequence.sceneUuids = [];
        sequence.shotUuids = [];

        input.islands.forEach((island, islandIndex) => {
            const sceneKey = generateUUID();
            const sortedNodes = [...island.nodes].sort((left, right) => {
                if (Math.abs(left.startTime - right.startTime) > 0.01) {
                    return left.startTime - right.startTime;
                }
                return (left.element.y - right.element.y) || (left.element.x - right.element.x);
            });
            const sceneStart = sortedNodes.length > 0 ? Math.min(...sortedNodes.map((node) => node.startTime)) : 0;
            const sceneEnd = sortedNodes.length > 0 ? Math.max(...sortedNodes.map((node) => node.endTime)) : 0;

            const scene: ProjectGraphScene = {
                ...this.createGraphIdentity(sceneKey, input.now),
                projectUuid: project.uuid,
                sequenceUuid,
                order: islandIndex,
                title: `Scene ${islandIndex + 1}`,
                summary: `Canvas island ${island.id}`,
                startTime: sceneStart,
                duration: Math.max(0, sceneEnd - sceneStart),
                shotUuids: [],
                metadata: {
                    islandId: island.id,
                    bounds: island.bounds
                }
            };

            scenes[sceneKey] = scene;
            sequence.sceneUuids.push(sceneKey);

            sortedNodes.forEach((node, shotIndex) => {
                const cutClip = node.clipId ? input.clips[node.clipId] : undefined;
                const cutTrackUuid = cutClip
                    ? this.resolveMappedEntityKey(trackUuidByKey, cutClip.track) || cutClip.track.uuid
                    : undefined;
                const resource = cutClip ? this.findEntityRecord(input.resources, cutClip.resource) : undefined;
                const source = resource ? buildProjectGraphMediaSource(resource) : null;
                const clipUuid = cutClip ? resolveEntityKey(cutClip) : null;
                const shotKey = generateUUID();

                const shot: ProjectGraphShot = {
                    ...this.createGraphIdentity(shotKey, input.now),
                    projectUuid: project.uuid,
                    sequenceUuid,
                    sceneUuid: sceneKey,
                    order: shotIndex,
                    title: this.resolveShotTitle(node.element, shotIndex),
                    prompt: node.element.data?.prompt,
                    product: this.resolveShotProduct(source),
                    mode: this.resolveShotMode(node.element, source),
                    clipUuid,
                    source,
                    metadata: {
                        canvasElementId: node.element.id,
                        canvasElementType: node.element.type
                    }
                };

                shots[shotKey] = shot;
                scene.shotUuids.push(shotKey);
                sequence.shotUuids.push(shotKey);

                surfaceBindings.push(
                    this.createSurfaceBinding(
                        input.now,
                        'canvas-element',
                        node.element.id,
                        node.element.uuid,
                        'shot',
                        shotKey
                    )
                );

                if (cutClip && cutTrackUuid && clipUuid) {
                    clips[clipUuid] = {
                        ...this.createGraphIdentity(clipUuid, input.now),
                        projectUuid: project.uuid,
                        timelineUuid,
                        trackUuid: cutTrackUuid,
                        sequenceUuid,
                        sceneUuid: sceneKey,
                        shotUuid: shotKey,
                        start: cutClip.start,
                        duration: cutClip.duration,
                        offset: cutClip.offset,
                        speed: cutClip.speed,
                        clipType: source?.primaryType || this.resolveFallbackClipType(node.element),
                        source,
                        metadata: {
                            sourceClipId: cutClip.id,
                            resourceViewId: cutClip.resource.id
                        }
                    };

                    surfaceBindings.push(
                        this.createSurfaceBinding(
                            input.now,
                            'magiccut-clip',
                            cutClip.id,
                            cutClip.uuid,
                            'clip',
                            clipUuid
                        )
                    );
                }
            });
        });

        surfaceBindings.push(
            this.createSurfaceBinding(
                input.now,
                'magiccut-project',
                null,
                input.projectUuid,
                'project',
                project.uuid
            ),
            this.createSurfaceBinding(
                input.now,
                'canvas-board',
                input.board.id,
                input.board.uuid,
                'sequence',
                sequence.uuid
            ),
            this.createSurfaceBinding(
                input.now,
                'magiccut-timeline',
                input.timeline.id,
                input.timeline.uuid,
                'timeline',
                timelineUuid
            )
        );

        return {
            version: 1,
            project,
            sequences: {
                [sequence.uuid]: sequence
            },
            scenes,
            shots,
            timelines,
            tracks,
            clips,
            publishTargets: {},
            surfaceBindings,
            metadata: {
                sourceCanvasUuid: input.board.uuid
            }
        };
    }

    private createGraphIdentity(uuid: string, now: number) {
        return {
            id: null,
            uuid,
            createdAt: now,
            updatedAt: now
        };
    }

    private createSurfaceBinding(
        now: number,
        surface: ProjectGraphSurface,
        surfaceEntityId: string | null,
        surfaceEntityUuid: string,
        graphEntityType: ProjectGraphEntityType,
        graphEntityUuid: string
    ): ProjectGraphSurfaceBinding {
        return {
            ...this.createGraphIdentity(generateUUID(), now),
            surface,
            surfaceEntityId,
            surfaceEntityUuid,
            graphEntityType,
            graphEntityId: null,
            graphEntityUuid
        };
    }

    private resolveShotTitle(element: CanvasElement, shotIndex: number): string {
        const explicitLabel = element.data?.label?.trim();
        if (explicitLabel) {
            return explicitLabel;
        }

        const resourceName = element.resource?.name?.trim();
        if (resourceName) {
            return resourceName;
        }

        return `Shot ${shotIndex + 1}`;
    }

    private resolveShotProduct(source: ProjectGraphMediaSource | null): ProjectGraphShot['product'] {
        switch (source?.primaryType) {
            case 'video':
                return 'video';
            case 'image':
                return 'image';
            case 'audio':
            case 'voice':
            case 'sfx':
                return 'audio';
            case 'music':
                return 'music';
            case 'text':
                return 'text';
            default:
                return undefined;
        }
    }

    private resolveShotMode(
        element: CanvasElement,
        source: ProjectGraphMediaSource | null
    ): ProjectGraphShot['mode'] {
        if (element.type === 'video') {
            return source?.primaryType === 'image' ? 'image-to-video' : 'text-to-video';
        }
        if (element.type === 'image') {
            return 'text-to-image';
        }
        return undefined;
    }

    private resolveFallbackClipType(element: CanvasElement): string {
        if (element.type === 'image') {
            return 'image';
        }
        if (element.type === 'video') {
            return 'video';
        }
        if (element.type === 'text' || element.type === 'note' || element.type === 'shape') {
            return 'text';
        }
        return 'file';
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
        
        let finalW: number;
        let finalH: number;

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
