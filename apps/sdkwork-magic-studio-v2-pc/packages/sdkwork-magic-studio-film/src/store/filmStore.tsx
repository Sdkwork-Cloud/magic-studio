
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
    FilmAssetMediaResource,
} from '@sdkwork/magic-studio-types/film';
import { entityKeysEqual } from '@sdkwork/magic-studio-types/entity';
import { MediaScene } from '@sdkwork/magic-studio-types/vocabulary';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { audioService } from '@sdkwork/magic-studio-audio/services';
import { filmService, filmProjectService } from '../services';
import { filmRepository } from '../repository';
import {
    normalizeFilmProject,
    type FilmAssetBindOptions,
    type FilmPreset
} from '../services/filmService';
import { createFilmAssetMediaResource } from '../utils/filmAssetFactories';
import {
    resolveFilmGeneratedOutcomeAsset,
    resolveImportedFilmAssetUrl
} from '../utils/filmModalAssetImport';

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
    assetUuid,
    type,
    url,
    name,
    scene = MediaScene.REFERENCE
}: {
    assetId: string;
    assetUuid?: string;
    type: 'image' | 'video' | 'audio';
    url: string;
    name: string;
    scene?: MediaScene;
}): FilmAssetMediaResource => {
    return createFilmAssetMediaResource({
        assetId,
        assetUuid,
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
    const deduped = existing.filter((item) => !entityKeysEqual(item, asset));
    return [...deduped, asset];
};

interface FilmStoreContextType {
    project: FilmProject;
    projects: FilmProject[];
    presets: FilmPreset[];
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
    loadPresets: () => Promise<void>;
    applyProjectPreset: (presetId: string) => Promise<void>;
    exportProjectPackage: () => void;
    importProjectPackage: () => Promise<void>;
    bindProjectAsset: (payload: FilmAssetBindOptions) => Promise<void>;
    
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
    const [presets, setPresets] = useState<FilmPreset[]>([]);
    const [project, setProject] = useState<FilmProject>(() => filmService.createProject('Untitled Project'));
    const normalizedProject = useMemo(() => normalizeFilmProject(project), [project]);
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

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const result = await filmProjectService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                const all = result.data.content.map((item) => normalizeFilmProject(item));
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
            void filmService.saveProject(normalizedProject);
        }, 1000);
        return () => clearTimeout(timer);
    }, [normalizedProject]);

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
        await filmService.saveProject(newProj);
    };

    const createProjectFromInput = async (name: string, input: string) => {
        setIsProcessing(true);
        const newProj = filmService.createProject(name);
        newProj.script.content = input;
        
        try {
             const persistedProject = await filmProjectService.save(newProj);
             if (!persistedProject.success || !persistedProject.data) {
                 throw new Error(persistedProject.message || 'Failed to create film project');
             }
             const projectId = persistedProject.data.uuid || persistedProject.data.id;
             if (!projectId) {
                 throw new Error('Created film project is missing canonical id');
             }

             const authoringResult = await filmService.runAuthoringBatch(projectId, {
                 commands: [
                     {
                         command: 'hydrate-analysis',
                         language: 'zh-CN'
                     }
                 ],
                 includeValidation: true
             });
             replaceProjectSnapshot(authoringResult.project);
             setCurrentView('overview');
             return;
        } catch (e) {
             console.error("Auto analysis failed", e);
            const normalizedNewProject = normalizeFilmProject(newProj, {
                preferExistingProjectGraph: false
            });
            setProjects(prev => [normalizedNewProject, ...prev]);
            setProject(normalizedNewProject);
            await filmService.saveProject(normalizedNewProject);
        } finally {
            setIsProcessing(false);
        }
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

    const loadPresets = async () => {
        const nextPresets = await filmService.listPresets();
        setPresets(nextPresets);
    };

    const replaceProjectSnapshot = (nextProject: FilmProject) => {
        const normalizedNextProject = normalizeFilmProject(nextProject);
        setProject(normalizedNextProject);
        setProjects(prev => {
            const existingIndex = prev.findIndex(item => item.uuid === normalizedNextProject.uuid);
            if (existingIndex < 0) {
                return [normalizedNextProject, ...prev];
            }
            return prev.map((item, index) => index === existingIndex ? normalizedNextProject : item);
        });
    };

    const applyProjectPreset = async (presetId: string) => {
        const projectId = project.uuid || project.id;
        if (!projectId) {
            throw new Error('Current film project id is missing');
        }

        setIsProcessing(true);
        try {
            const updatedProject = await filmService.applyPreset(projectId, { presetId });
            replaceProjectSnapshot(updatedProject);
        } catch (error) {
            console.error('Film preset apply failed', error);
            alert('Film preset apply failed. Please inspect the console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    const exportProjectPackage = () => {
        void (async () => {
            try {
                const exportPackage = await filmRepository.exportProject(normalizedProject);
                await filmRepository.saveExportPackage(exportPackage);
            } catch (error) {
                console.error('Film export failed', error);
                alert('Film export failed. Please inspect the console for details.');
            }
        })();
    };

    const importProjectPackage = async () => {
        setIsProcessing(true);
        try {
            const selectedPaths = await filmRepository.selectFile();
            if (selectedPaths.length === 0) {
                return;
            }

            const importedPackage = await filmRepository.importProjectFile(selectedPaths[0]);
            if (importedPackage.warnings.length > 0) {
                console.warn('Film import completed with warnings', importedPackage.warnings);
            }

            replaceProjectSnapshot(importedPackage.project);
            setCurrentView('overview');
        } catch (error) {
            console.error('Film import failed', error);
            alert('Film import failed. Please inspect the console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    const bindProjectAsset = async (payload: FilmAssetBindOptions) => {
        const projectId = project.uuid || project.id;
        if (!projectId) {
            throw new Error('Current film project id is missing');
        }
        const updatedProject = await filmService.bindAsset(projectId, payload);
        replaceProjectSnapshot(updatedProject);
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
        const sceneKey = generateUUID();
        const newScene: FilmScene = {
            id: sceneKey,
            uuid: sceneKey,
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
            const outcome = await filmService.generateImage(prompt, project.settings.aspect);
            const persisted = await resolveFilmGeneratedOutcomeAsset(
                outcome,
                `film_shot_${shot.index || 0}_image_${Date.now()}.png`,
                'image',
                {
                    origin: 'ai',
                    source: 'film-shot-image',
                    shotUuid,
                    sceneUuid,
                    prompt
                }
            );
            const persistedUrl = resolveImportedFilmAssetUrl(persisted);
            const newAsset = createGeneratedShotAsset({
                assetId: persisted.assetId,
                assetUuid: persisted.assetUuid,
                type: 'image',
                url: persistedUrl,
                name: 'Gen Result'
            });
            const generationAssets = appendGeneratedAsset(shot, newAsset);
            
            updateShot(sceneUuid, shotUuid, { 
                generation: { 
                    ...shot.generation, 
                    status: 'SUCCESS',
                    product: outcome.recipe.product,
                    modelId: outcome.execution.providerModel,
                    base: outcome.recipe.prompt || prompt,
                    assets: generationAssets
                },
                assets: [newAsset]
            });
        } catch {
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
             const outcome = await filmService.generateVideo(prompt);
             const persisted = await resolveFilmGeneratedOutcomeAsset(
                 outcome,
                 `film_shot_${shot.index || 0}_video_${Date.now()}.mp4`,
                 'video',
                 {
                     origin: 'ai',
                     source: 'film-shot-video',
                     shotUuid,
                     sceneUuid,
                     prompt
                 }
             );
             const persistedUrl = resolveImportedFilmAssetUrl(persisted);
             const videoAsset = createGeneratedShotAsset({
                 assetId: persisted.assetId,
                 assetUuid: persisted.assetUuid,
                 type: 'video',
                 url: persistedUrl,
                 name: 'Gen Video'
             });
             const generationAssets = appendGeneratedAsset(shot, videoAsset);
             
             updateShot(sceneUuid, shotUuid, { 
                generation: { 
                    ...shot.generation, 
                    status: 'SUCCESS',
                    product: outcome.recipe.product,
                    modelId: outcome.execution.providerModel,
                    base: outcome.recipe.prompt || prompt,
                    video: { 
                        url: persistedUrl,
                        thumbnailUrl: persistedUrl,
                        duration: 5
                    },
                    assets: generationAssets
                },
                assets: [...(shot.assets || []), videoAsset]
            });
         } catch {
             updateShot(sceneUuid, shotUuid, { 
                 generation: { ...shot.generation, status: 'FAILED' } 
             });
         }
    };
    
    const generateShotAudio = async (sceneUuid: string | undefined, shotUuid: string) => {
        const shot = project.shots.find(s => s.uuid === shotUuid);
        if (!shot || !shot.dialogue?.items?.length) return;
        
        const text = shot.dialogue.items.map(d => d.text).join(' ');
        const voice = 'Kore'; 

        updateShot(sceneUuid, shotUuid, {
            generation: { ...shot.generation, status: 'GENERATING' }
        });
        
        try {
             const outcome = await audioService.generateAudio({
                 prompt: text,
                 voice,
             });
             const persisted = await resolveFilmGeneratedOutcomeAsset(
                 outcome,
                 `film_shot_${shot.index || 0}_audio_${Date.now()}.wav`,
                 'audio',
                 {
                     origin: 'ai',
                     source: 'film-shot-audio',
                     shotUuid,
                     sceneUuid,
                     prompt: text,
                     voice
                 }
             );
             const persistedUrl = resolveImportedFilmAssetUrl(persisted);
             const audioAsset = createGeneratedShotAsset({
                 assetId: persisted.assetId,
                 assetUuid: persisted.assetUuid,
                 type: 'audio',
                 url: persistedUrl,
                 name: 'Dialogue Audio'
             });
             const generationAssets = appendGeneratedAsset(shot, audioAsset);

             updateShot(sceneUuid, shotUuid, {
                 generation: {
                     ...shot.generation,
                     status: 'SUCCESS',
                     product: outcome.recipe.product,
                     modelId: outcome.execution.providerModel,
                     base: outcome.recipe.prompt || text,
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
            project: normalizedProject, projects, presets, currentProjectId: normalizedProject.uuid, currentView, isProcessing,
            batchProgress,
            selectedId, selectedType, selectItem,
            setView: setCurrentView, switchProject,
            createProject, createProjectFromInput, updateProjectMetadata, updateProjectSettings, loadPresets, applyProjectPreset, exportProjectPackage, importProjectPackage, bindProjectAsset,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useFilmStore = () => {
    const context = useContext(FilmStoreContext);
    if (!context) throw new Error("useFilmStore must be used within FilmStoreProvider");
    return context;
};
