
;
import { NormalizedState } from '../store/types';
import { vfs } from 'sdkwork-react-fs';
import { CutProject, CutTemplate, CutTimeline, CutTrack, CutClip, CutLayer, TemplateMetadata } from '../entities/magicCut.entity';
import { pathUtils } from 'sdkwork-react-commons';
import { platform } from 'sdkwork-react-core';
import { storageConfig } from 'sdkwork-react-fs';
import { generateUUID } from 'sdkwork-react-commons';

class TemplateService {
    
    private async getTemplatesDir(): Promise<string> {
        const root = await platform.getPath('documents');
        const dir = pathUtils.join(root, storageConfig.templates.root);
        try { await vfs.createDir(dir); } catch { /* Directory may already exist, ignore */ }
        return dir;
    }

    /**
     * Save current project state as a reusable template.
     */
    async saveTemplate(metadata: TemplateMetadata, project: CutProject, state: NormalizedState): Promise<void> {
        const dir = await this.getTemplatesDir();
        const id = generateUUID();
        const filename = `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${id}.json`;
        const path = pathUtils.join(dir, filename);

        // Serialize the full state into the template so we can restore it accurately
        // We embed the NormalizedState inside the ProjectData to keep references intact
        const templateData: CutTemplate = {
            id,
            uuid: id,
            ...metadata,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            projectData: {
                ...project,
                // We add a custom property to store the flattened state, 
                // which makes hydration easier than reconstructing from tree
                normalizedState: state 
            }
        };

        await vfs.writeFile(path, JSON.stringify(templateData, null, 2));
    }

    /**
     * List all available templates
     */
    async listTemplates(): Promise<CutTemplate[]> {
        const dir = await this.getTemplatesDir();
        try {
            const files = await vfs.readDir(dir);
            const templates: CutTemplate[] = [];

            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    try {
                        const content = await vfs.readFile(file.path);
                        const tmpl = JSON.parse(content);
                        templates.push(tmpl);
                    } catch (e) {
                        console.warn(`Failed to parse template ${file.name}`, e);
                    }
                }
            }
            return templates.sort((a, b) => b.createdAt - a.createdAt);
        } catch (e) {
            return [];
        }
    }

    /**
     * Instantiate a template into a new project state.
     * CRITICAL: Must regenerate ALL IDs (UUIDs) to prevent collision if instantiated multiple times.
     */
    instantiateTemplate(template: CutTemplate): { project: CutProject, state: NormalizedState } {
        const sourceProject = template.projectData;
        const sourceState = sourceProject.normalizedState as NormalizedState;

        // ID Mapping: Old ID -> New ID
        const idMap = new Map<string, string>();
        const getNewId = (oldId: string) => {
            if (!idMap.has(oldId)) idMap.set(oldId, generateUUID());
            return idMap.get(oldId)!;
        };

        // 1. Clone Resources (Usually shared, but we might want to deep clone if they are edited)
        // For now, we reuse resource IDs if they are global (like stock assets), 
        // but if they were local to the project, we should technically re-map them.
        // Simplified: Keep resource IDs as is, they are usually immutable pointers.
        const newResources = { ...sourceState.resources }; 

        // 2. Clone Timelines
        const newTimelines: Record<string, CutTimeline> = {};
        Object.values(sourceState.timelines).forEach(tl => {
            const newId = getNewId(tl.id);
            newTimelines[newId] = {
                ...tl,
                id: newId,
                uuid: getNewId(tl.uuid),
                // Tracks will be mapped later
                tracks: [] 
            };
        });

        // 3. Clone Tracks & Clips & Layers
        const newTracks: Record<string, CutTrack> = {};
        const newClips: Record<string, CutClip> = {};
        const newLayers: Record<string, CutLayer> = {};

        // Iterate through original structure to rebuild relationships
        Object.values(sourceState.timelines).forEach(oldTl => {
            const newTlId = idMap.get(oldTl.id)!;
            const newTl = newTimelines[newTlId];

            oldTl.tracks.forEach(trackRef => {
                const oldTrack = sourceState.tracks[trackRef.id];
                if (!oldTrack) return;
                
                const newTrackId = getNewId(oldTrack.id);
                const newTrack: CutTrack = {
                    ...oldTrack,
                    id: newTrackId,
                    uuid: getNewId(oldTrack.uuid),
                    clips: [] // Fill later
                };
                newTracks[newTrackId] = newTrack;
                newTl.tracks.push({ id: newTrackId, uuid: newTrack.uuid, type: 'CutTrack' });

                // Process Clips
                oldTrack.clips.forEach(clipRef => {
                    const oldClip = sourceState.clips[clipRef.id];
                    if (!oldClip) return;

                    const newClipId = getNewId(oldClip.id);
                    const newClip: CutClip = {
                        ...oldClip,
                        id: newClipId,
                        uuid: getNewId(oldClip.uuid),
                        track: { id: newTrackId, uuid: newTrack.uuid, type: 'CutTrack' },
                        layers: [] // Fill later
                    };
                    newClips[newClipId] = newClip;
                    newTrack.clips.push({ id: newClipId, uuid: newClip.uuid, type: 'CutClip' });

                    // Process Layers
                    oldClip.layers.forEach(layerRef => {
                        const oldLayer = sourceState.layers[layerRef.id];
                        if (!oldLayer) return;

                        const newLayerId = getNewId(oldLayer.id);
                        const newLayer: CutLayer = {
                            ...oldLayer,
                            id: newLayerId,
                            uuid: getNewId(oldLayer.uuid),
                            clip: { id: newClipId, uuid: newClip.uuid, type: 'CutClip' }
                        };
                        newLayers[newLayerId] = newLayer;
                        newClip.layers.push({ id: newLayerId, uuid: newLayer.uuid, type: 'CutLayer' });
                    });
                });
            });
        });

        // 4. Construct final Project object
        const newProject: CutProject = {
            ...sourceProject,
            id: generateUUID(),
            uuid: generateUUID(),
            name: `${template.name} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            timelines: Object.keys(newTimelines).map(id => ({ id, uuid: newTimelines[id].uuid, type: 'CutTimeline' }))
        };
        // Clean up internal prop
        delete newProject.normalizedState;

        const newState: NormalizedState = {
            resources: newResources,
            timelines: newTimelines,
            tracks: newTracks,
            clips: newClips,
            layers: newLayers
        };

        return { project: newProject, state: newState };
    }
}

export const templateService = new TemplateService();

