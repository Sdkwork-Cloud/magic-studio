
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
    FilmProject,
    FilmShot,
    FilmCharacter,
    FilmLocation,
    FilmProp,
    FilmScene,
    FilmViewMode,
    FilmSettings,
    MediaScene,
    FilmAssetMediaResource,
    generateUUID
} from '@sdkwork/react-commons';
import { filmService, filmProjectService } from '../services';
import { genAIService, inlineDataService } from '@sdkwork/react-core';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';
import { createFilmAssetMediaResource } from '../utils/filmAssetFactories';

type FilmImportType = 'image' | 'video' | 'audio';

interface FilmPreviewItem {
    shot: FilmShot;
    scene: FilmScene;
    startTime: number;
    endTime: number;
    duration: number;
}

const resolveGenerationPrompt = (
    shot: FilmShot,
    fallback: string = 'Cinematic shot'
): string => {
    const promptValue = shot.generation?.prompt;
    if (typeof promptValue === 'string' && promptValue.trim().length > 0) {
        return promptValue;
    }

    const generationRecord = shot.generation as Record<string, unknown> | undefined;
    const nestedPrompt = generationRecord?.prompt;
    if (nestedPrompt && typeof nestedPrompt === 'object') {
        const promptBase = (nestedPrompt as Record<string, unknown>).base;
        if (typeof promptBase === 'string' && promptBase.trim().length > 0) {
            return promptBase;
        }
    }

    const baseValue = generationRecord?.base;
    if (typeof baseValue === 'string' && baseValue.trim().length > 0) {
        return baseValue;
    }

    if (shot.description && shot.description.trim().length > 0) {
        return shot.description;
    }

    return fallback;
};

const createGeneratedShotAsset = ({
    assetId,
    type,
    url,
    name,
    scene = MediaScene.REFERENCE
}: {
    assetId: string;
    type: 'image' | 'video' | 'audio';
    url: string;
    name: string;
    scene?: MediaScene;
}): FilmAssetMediaResource => {
    return createFilmAssetMediaResource({
        assetId,
        type,
        scene,
        url,
        fileName: name
    });
};

const appendGeneratedAsset = (
    shot: FilmShot,
    asset: FilmAssetMediaResource
): FilmAssetMediaResource[] => {
    const existing = shot.generation?.assets || [];
    const incomingAssetId = typeof asset.assetId === 'string' ? asset.assetId : asset.id;
    const deduped = existing.filter((item) => {
        const currentAssetId = typeof item.assetId === 'string' ? item.assetId : item.id;
        return currentAssetId !== incomingAssetId;
    });
    return [...deduped, asset];
};

interface FilmStoreContextType {
    project: FilmProject;
    projects: FilmProject[];
    currentProjectId: string | null;
    currentView: FilmViewMode;
    isProcessing: boolean;
    
    // Batch Progress
    batchProgress: { total: number; current: number; type: string | null };
    
    // Selection
    selectedId: string | null;
    selectedType: string | null;
    selectItem: (id: string | null, type: string | null) => void;
    
    // Navigation
    setView: (view: FilmViewMode) => void;
    switchProject: (id: string) => Promise<void>;
    
    // Project Actions
    createProject: (name: string) => Promise<void>;
    createProjectFromInput: (name: string, input: string) => Promise<void>;
    updateProjectMetadata: (data: Partial<FilmProject>) => void;
    updateProjectSettings: (settings: Partial<FilmSettings>) => void;
    exportProjectToJson: () => void;
    
    // Script
    updateScript: (content: string) => void;
    analyzeScript: () => Promise<void>;
    
    // Scenes
    addScene: (index: number, data: Partial<FilmScene>) => void;
    updateScene: (uuid: string, data: Partial<FilmScene>) => void;
    deleteScene: (uuid: string) => void;
    
    // Shots
    addShot: (sceneUuid?: string, locationUuid?: string) => void;
    updateShot: (sceneUuid: string | undefined, shotUuid: string, data: Partial<FilmShot>) => void;
    deleteShot: (uuid: string) => void;
    generateShotImage: (sceneUuid: string | undefined, shotUuid: string) => Promise<void>;
    generateShotVideo: (sceneUuid: string | undefined, shotUuid: string) => Promise<void>;
    generateShotAudio: (sceneUuid: string | undefined, shotUuid: string) => Promise<void>;
    
    // Batch Actions
    generateAllImages: () => Promise<void>;
    generateAllVideos: () => Promise<void>;
    generateAllAudio: () => Promise<void>;
    
    // Assets (Characters, Locations, Props)
    createCharacter: (data: Partial<FilmCharacter>) => void;
    updateCharacter: (uuid: string, data: Partial<FilmCharacter>) => void;
    createLocation: (data: Partial<FilmLocation>) => void;
    updateLocation: (uuid: string, data: Partial<FilmLocation>) => void;
    createProp: (data: Partial<FilmProp>) => void;
    updateProp: (uuid: string, data: Partial<FilmProp>) => void;
    
    // AI Extraction
    autoExtractCharacters: () => Promise<void>;
    autoExtractProps: () => Promise<void>;
    
    // Preview Player State
    previewItems: FilmPreviewItem[];
    previewTime: number;
    previewTotalDuration: number;
    isPreviewPlaying: boolean;
    currentPreviewItem: FilmPreviewItem | null;
    showSubtitles: boolean;
    isMuted: boolean;
    
    seekPreview: (time: number) => void;
    togglePreviewPlay: () => void;
    toggleSubtitles: () => void;
    toggleMute: () => void;
}

const FilmStoreContext = createContext<FilmStoreContextType | undefined>(undefined);

export const FilmStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<FilmProject[]>([]);
    const [project, setProject] = useState<FilmProject>(() => filmService.createProject('Untitled Project'));
    const [currentView, setCurrentView] = useState<FilmViewMode>('overview');
    const [isProcessing, setIsProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ total: 0, current: 0, type: null as string | null });
    
    // Selection
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Preview State
    const [previewTime, setPreviewTime] = useState(0);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    const resolveFilmScope = (): { workspaceId: string; projectId?: string } => {
        const scope = readWorkspaceScope();
        return {
            workspaceId: scope.workspaceId,
            projectId: project.uuid || scope.projectId
        };
    };

    const importGeneratedAssetToFilmCenter = async (
        sourceUrl: string,
        type: FilmImportType,
        name: string,
        metadata: Record<string, unknown>
    ): Promise<string> => {
        const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
        const result = await assetBusinessFacade.importFilmAsset({
            scope: resolveFilmScope(),
            type,
            name,
            data: inlineData,
            remoteUrl: inlineData ? undefined : sourceUrl,
            metadata
        });
        return result.asset.assetId;
    };

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const result = await filmProjectService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                const all = result.data.content;
                setProjects(all);
                if (all.length > 0) {
                    setProject(all[0]);
                }
            }
        };
        load();
    }, []);

    // Persist
    useEffect(() => {
        const timer = setTimeout(() => {
            filmProjectService.save(project);
        }, 1000);
        return () => clearTimeout(timer);
    }, [project]);

    // --- Batch Queue Helper ---
    const runBatchQueue = async (tasks: (() => Promise<void>)[], type: string) => {
        setBatchProgress({ total: tasks.length, current: 0, type });
        setIsProcessing(true);
        
        // Simple concurrency limit (3)
        const CONCURRENCY = 3;
        let index = 0;
        let active = 0;
        
        return new Promise<void>((resolve) => {
            const next = () => {
                // Check if all done
                if (index >= tasks.length && active === 0) {
                    setIsProcessing(false);
                    setBatchProgress({ total: 0, current: 0, type: null });
                    resolve();
                    return;
                }

                while (active < CONCURRENCY && index < tasks.length) {
                    const i = index++;
                    active++;
                    tasks[i]().finally(() => {
                        active--;
                        setBatchProgress(prev => ({ ...prev, current: prev.current + 1 }));
                        next();
                    });
                }
            };
            next();
        });
    };

    // --- Actions ---

    const createProject = async (name: string) => {
        const newProj = filmService.createProject(name);
        setProjects(prev => [newProj, ...prev]);
        setProject(newProj);
        setCurrentView('overview');
        await filmProjectService.save(newProj);
    };

    const createProjectFromInput = async (name: string, input: string) => {
        setIsProcessing(true);
        const newProj = filmService.createProject(name);
        newProj.script.content = input;
        
        try {
             const analysis = await filmService.analyzeScript(input);
             newProj.script.standardized = true;
             newProj.scenes = analysis.scenes as FilmScene[];
             newProj.characters = analysis.characters as FilmCharacter[];
             newProj.locations = analysis.locations as FilmLocation[];
             newProj.props = analysis.props as FilmProp[];
             newProj.status = 'SCRIPT_READY';
        } catch (e) {
             console.error("Auto analysis failed", e);
        }
        
        setProjects(prev => [newProj, ...prev]);
        setProject(newProj);
        await filmProjectService.save(newProj);
        setIsProcessing(false);
    };

    const switchProject = async (uuid: string) => {
        const found = projects.find(p => p.uuid === uuid);
        if (found) setProject(found);
    };

    const updateProjectMetadata = (data: Partial<FilmProject>) => {
        setProject(prev => ({ ...prev, ...data }));
    };

    const updateProjectSettings = (settings: Partial<FilmSettings>) => {
        setProject(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    };

    const exportProjectToJson = () => {
        const dataStr = JSON.stringify(project, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name || 'film-project'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const updateScript = (content: string) => {
        setProject(prev => ({ ...prev, script: { ...prev.script, content } }));
    };

    const analyzeScript = async () => {
        if (!project.script.content.trim()) return;
        setIsProcessing(true);
        try {
            const result = await filmService.analyzeScript(project.script.content);
            setProject(prev => ({
                ...prev,
                scenes: result.scenes as FilmScene[],
                characters: result.characters as FilmCharacter[],
                locations: result.locations as FilmLocation[],
                props: result.props as FilmProp[],
                status: 'SCRIPT_READY'
            }));
        } catch (e) {
            console.error(e);
            alert("Analysis failed. Please check API key.");
        } finally {
            setIsProcessing(false);
        }
    };

    const addScene = (index: number, data: Partial<FilmScene>) => {
        const newScene: FilmScene = {
            id: generateUUID(),
            uuid: generateUUID(),
            type: 'FILM_SCENE',
            sceneNumber: index + 1,
            index: index + 1,
            locationUuid: '',
            summary: 'New Scene',
            moodTags: [],
            characterUuids: [],
            propUuids: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...data
        };
        
        setProject(prev => {
            const newScenes = [...prev.scenes];
            newScenes.splice(index, 0, newScene);
            for(let i=index + 1; i<newScenes.length; i++) {
                newScenes[i].index = i + 1;
            }
            return { ...prev, scenes: newScenes };
        });
    };

    const updateScene = (uuid: string, data: Partial<FilmScene>) => {
        setProject(prev => ({
            ...prev,
            scenes: prev.scenes.map(s => s.uuid === uuid ? { ...s, ...data } : s)
        }));
    };

    const deleteScene = (uuid: string) => {
        setProject(prev => ({
            ...prev,
            scenes: prev.scenes.filter(s => s.uuid !== uuid)
        }));
    };

    const addShot = (sceneUuid?: string, locationUuid?: string) => {
        let newIndex: number;
        if (sceneUuid) {
            const sceneShots = project.shots.filter(s => s.sceneUuid === sceneUuid);
            newIndex = sceneShots.length + 1;
        } else {
            const standaloneShots = project.shots.filter(s => !s.sceneUuid);
            newIndex = standaloneShots.length + 1;
        }
        const newShot = filmService.createEmptyShot(sceneUuid, newIndex, locationUuid);
        
        setProject(prev => ({
            ...prev,
            shots: [...prev.shots, newShot]
        }));
    };

    const updateShot = (_sceneUuid: string | undefined, shotUuid: string, data: Partial<FilmShot>) => {
        setProject(prev => ({
            ...prev,
            shots: prev.shots.map(s => s.uuid === shotUuid ? { ...s, ...data } : s)
        }));
    };

    const deleteShot = (uuid: string) => {
        setProject(prev => ({
            ...prev,
            shots: prev.shots.filter(s => s.uuid !== uuid)
        }));
    };

    const generateShotImage = async (sceneUuid: string | undefined, shotUuid: string) => {
        const shot = project.shots.find(s => s.uuid === shotUuid);
        if (!shot) return;
        
        updateShot(sceneUuid, shotUuid, { 
            generation: { ...shot.generation, status: 'GENERATING' } 
        });
        
        try {
            const prompt = resolveGenerationPrompt(shot);
            const url = await filmService.generateImage(prompt, project.settings.aspect);
            const assetId = await importGeneratedAssetToFilmCenter(
                url,
                'image',
                `film_shot_${shot.index || 0}_image_${Date.now()}.png`,
                {
                    origin: 'ai',
                    source: 'film-shot-image',
                    shotUuid,
                    sceneUuid,
                    prompt
                }
            );
            const newAsset = createGeneratedShotAsset({
                assetId,
                type: 'image',
                url,
                name: 'Gen Result'
            });
            const generationAssets = appendGeneratedAsset(shot, newAsset);
            
            updateShot(sceneUuid, shotUuid, { 
                generation: { 
                    ...shot.generation, 
                    status: 'SUCCESS',
                    assets: generationAssets
                },
                assets: [newAsset]
            });
        } catch (e) {
            updateShot(sceneUuid, shotUuid, { 
                generation: { ...shot.generation, status: 'FAILED' } 
            });
        }
    };

    const generateShotVideo = async (sceneUuid: string | undefined, shotUuid: string) => {
         const shot = project.shots.find(s => s.uuid === shotUuid);
         if (!shot) return;
         
         updateShot(sceneUuid, shotUuid, { 
             generation: { ...shot.generation, status: 'GENERATING' } 
         });

         try {
             const prompt = resolveGenerationPrompt(shot, shot.description || 'Cinematic shot');
             const url = await filmService.generateVideo(prompt);
             const assetId = await importGeneratedAssetToFilmCenter(
                 url,
                 'video',
                 `film_shot_${shot.index || 0}_video_${Date.now()}.mp4`,
                 {
                     origin: 'ai',
                     source: 'film-shot-video',
                     shotUuid,
                     sceneUuid,
                     prompt
                 }
             );
             const videoAsset = createGeneratedShotAsset({
                 assetId,
                 type: 'video',
                 url,
                 name: 'Gen Video'
             });
             const generationAssets = appendGeneratedAsset(shot, videoAsset);
             
             updateShot(sceneUuid, shotUuid, { 
                generation: { 
                    ...shot.generation, 
                    status: 'SUCCESS',
                    video: { 
                        url,
                        thumbnailUrl: url,
                        duration: 5
                    },
                    assets: generationAssets
                },
                assets: [...(shot.assets || []), videoAsset]
            });
         } catch (e) {
             updateShot(sceneUuid, shotUuid, { 
                 generation: { ...shot.generation, status: 'FAILED' } 
             });
         }
    };
    
    const generateShotAudio = async (sceneUuid: string | undefined, shotUuid: string) => {
        const shot = project.shots.find(s => s.uuid === shotUuid);
        if (!shot || !shot.dialogue?.items?.length) return;
        
        const text = shot.dialogue.items.map(d => d.text).join(' ');
        let voice = 'Kore'; 

        updateShot(sceneUuid, shotUuid, {
            generation: { ...shot.generation, status: 'GENERATING' }
        });
        
        try {
             const audioUrl = await genAIService.generateSpeech(text, voice);
             const assetId = await importGeneratedAssetToFilmCenter(
                 audioUrl,
                 'audio',
                 `film_shot_${shot.index || 0}_audio_${Date.now()}.wav`,
                 {
                     origin: 'ai',
                     source: 'film-shot-audio',
                     shotUuid,
                     sceneUuid,
                     prompt: text,
                     voice
                 }
             );
             const audioAsset = createGeneratedShotAsset({
                 assetId,
                 type: 'audio',
                 url: audioUrl,
                 name: 'Dialogue Audio'
             });
             const generationAssets = appendGeneratedAsset(shot, audioAsset);

             updateShot(sceneUuid, shotUuid, {
                 generation: {
                     ...shot.generation,
                     status: 'SUCCESS',
                     assets: generationAssets
                 },
                 assets: [...(shot.assets || []), audioAsset]
             });
        } catch (e) {
            console.error("Audio gen failed", e);
            updateShot(sceneUuid, shotUuid, { 
                generation: { ...shot.generation, status: 'FAILED' } 
            });
        }
    };

    const generateAllImages = async () => {
        const tasks = project.shots
            .filter(s => !s.assets || s.assets.length === 0)
            .map(s => () => generateShotImage(s.sceneUuid, s.uuid));
        await runBatchQueue(tasks, 'Images');
    };

    const generateAllVideos = async () => {
        const tasks = project.shots
            .filter(s => !s.generation?.video)
            .map(s => () => generateShotVideo(s.sceneUuid, s.uuid));
        await runBatchQueue(tasks, 'Videos');
    };
    
    const generateAllAudio = async () => {
         const tasks = project.shots
            .filter(s => s.dialogue?.items && s.dialogue.items.length > 0)
            .map(s => () => generateShotAudio(s.sceneUuid, s.uuid));
         await runBatchQueue(tasks, 'Audio');
    };

    // ... (Assets & Extraction methods unchanged) ...
    const createCharacter = (data: Partial<FilmCharacter>) => {
        const newChar = { ...filmService.createEmptyCharacter(), ...data };
        setProject(prev => ({
            ...prev,
            characters: [...prev.characters, newChar]
        }));
    };

    const updateCharacter = (uuid: string, data: Partial<FilmCharacter>) => {
        setProject(prev => ({
            ...prev,
            characters: prev.characters.map(c =>
                c.uuid === uuid ? { ...c, ...data } : c
            )
        }));
    };

    const createLocation = (data: Partial<FilmLocation>) => {
        const newLoc = { ...filmService.createEmptyLocation(), ...data };
        setProject(prev => ({
            ...prev,
            locations: [...prev.locations, newLoc]
        }));
    };

    const updateLocation = (uuid: string, data: Partial<FilmLocation>) => {
        setProject(prev => ({
            ...prev,
            locations: prev.locations.map(l =>
                l.uuid === uuid ? { ...l, ...data } : l
            )
        }));
    };

    const createProp = (data: Partial<FilmProp>) => {
        const newProp = { ...filmService.createEmptyProp(), ...data };
        setProject(prev => ({
            ...prev,
            props: [...prev.props, newProp]
        }));
    };

    const updateProp = (uuid: string, data: Partial<FilmProp>) => {
        setProject(prev => ({
            ...prev,
            props: prev.props.map(p =>
                p.uuid === uuid ? { ...p, ...data } : p
            )
        }));
    };
    const autoExtractCharacters = async () => {
        if (!project.script.content) return;
        setIsProcessing(true);
        try {
            const chars = await filmService.extractCharacters(project.script.content);
            setProject(prev => ({
                ...prev,
                characters: [...prev.characters, ...chars]
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const autoExtractProps = async () => {
        if (!project.script.content) return;
        setIsProcessing(true);
        try {
            const props = await filmService.extractProps(project.script.content);
            setProject(prev => ({
                ...prev,
                props: [...prev.props, ...props]
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const selectItem = (id: string | null, type: string | null) => {
        setSelectedId(id);
        setSelectedType(type);
    };

    // --- Preview Player Logic ---
    const previewItems = useMemo<FilmPreviewItem[]>(() => {
        if (!project.scenes) return [];
        const items: FilmPreviewItem[] = [];
        let timeOffset = 0;
        
        project.scenes.forEach(scene => {
            const sceneShots = project.shots.filter(s => s.sceneUuid === scene.uuid).sort((a,b) => (a.index || 0) - (b.index || 0));
            sceneShots.forEach(shot => {
                items.push({
                    shot,
                    scene,
                    startTime: timeOffset,
                    endTime: timeOffset + shot.duration,
                    duration: shot.duration
                });
                timeOffset += shot.duration;
            });
        });
        return items;
    }, [project.scenes, project.shots]);

    const previewTotalDuration = previewItems.length > 0 ? previewItems[previewItems.length - 1].endTime : 0;
    
    const currentPreviewItem = useMemo<FilmPreviewItem | null>(() => {
        return previewItems.find(i => previewTime >= i.startTime && previewTime < i.endTime) || null;
    }, [previewTime, previewItems]);

    const seekPreview = (time: number) => {
        setPreviewTime(Math.max(0, Math.min(time, previewTotalDuration)));
    };

    const togglePreviewPlay = () => setIsPreviewPlaying(!isPreviewPlaying);

    return (
        <FilmStoreContext.Provider value={{
            project, projects, currentProjectId: project.uuid, currentView, isProcessing,
            batchProgress,
            selectedId, selectedType, selectItem,
            setView: setCurrentView, switchProject,
            createProject, createProjectFromInput, updateProjectMetadata, updateProjectSettings, exportProjectToJson,
            updateScript, analyzeScript,
            addScene, updateScene, deleteScene,
            addShot, updateShot, deleteShot, generateShotImage, generateShotVideo, generateShotAudio,
            generateAllImages, generateAllVideos, generateAllAudio,
            createCharacter, updateCharacter, createLocation, updateLocation, createProp, updateProp,
            autoExtractCharacters, autoExtractProps,
            
            previewItems, previewTime, previewTotalDuration, isPreviewPlaying, currentPreviewItem,
            seekPreview, togglePreviewPlay,
            showSubtitles, toggleSubtitles: () => setShowSubtitles(!showSubtitles),
            isMuted, toggleMute: () => setIsMuted(!isMuted)
        }}>
            {children}
        </FilmStoreContext.Provider>
    );
};

export const useFilmStore = () => {
    const context = useContext(FilmStoreContext);
    if (!context) throw new Error("useFilmStore must be used within FilmStoreProvider");
    return context;
};
