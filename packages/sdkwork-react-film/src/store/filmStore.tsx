
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { FilmProject, FilmShot, FilmCharacter, FilmLocation, FilmProp, FilmScene, FilmViewMode, FilmSettings, MediaScene, MediaResourceType, AssetMediaResource, generateUUID } from 'sdkwork-react-commons';
import { filmService } from '../services/filmService';
import { filmProjectService } from '../services/filmProjectService';
import { genAIService } from 'sdkwork-react-core';
import { assetService } from 'sdkwork-react-assets';

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
    previewItems: any[];
    previewTime: number;
    previewTotalDuration: number;
    isPreviewPlaying: boolean;
    currentPreviewItem: any | null;
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
            index: index + 1,
            locationUuid: '',
            summary: 'New Scene',
            mood: [],
            moodTags: [],
            characterUuids: [],
            propUuids: [],
            assets: [],
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

    const updateShot = (sceneUuid: string | undefined, shotUuid: string, data: Partial<FilmShot>) => {
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
            const prompt = shot.generation?.prompt?.base || shot.description || "Cinematic shot";
            const url = await filmService.generateImage(prompt, project.settings.aspect);
            const now = Date.now();
            const newAsset: AssetMediaResource = {
                id: generateUUID(),
                uuid: generateUUID(),
                type: MediaResourceType.IMAGE,
                url,
                name: 'Gen Result',
                scene: MediaScene.REFERENCE,
                createdAt: now,
                updatedAt: now
            } as AssetMediaResource;
            
            updateShot(sceneUuid, shotUuid, { 
                generation: { 
                    ...shot.generation, 
                    status: 'SUCCESS',
                    assets: [...(shot.generation?.assets || []), newAsset]
                },
                assets: [{ 
                    id: generateUUID(), 
                    uuid: generateUUID(), 
                    type: MediaResourceType.IMAGE, 
                    url, 
                    name: 'Gen Result', 
                    scene: MediaScene.REFERENCE,
                    createdAt: now, 
                    updatedAt: now 
                } as any]
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
             const prompt = shot.generation?.prompt?.base || shot.description;
             const url = await filmService.generateVideo(prompt);
             const now = Date.now();
             
             updateShot(sceneUuid, shotUuid, { 
                 generation: { 
                     ...shot.generation, 
                     status: 'SUCCESS',
                     video: { 
                         id: generateUUID(), 
                         uuid: generateUUID(), 
                         type: 'VIDEO' as any, 
                         url, 
                         name: 'Gen Video', 
                         createdAt: now, 
                         updatedAt: now 
                     }
                 }
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
        
        try {
             const audioUrl = await genAIService.generateSpeech(text, voice);
             const asset = await assetService.saveGeneratedAsset(audioUrl, 'audio', { prompt: text }, `shot_${shot.index}_audio.wav`);
             
             // Currently FilmShot doesn't strictly have an audio attachment field in the simplified entity,
             // so we attach it as a resource or update metadata. 
             // Ideally we add 'audio' field to FilmShot. For now, we put it in metadata or handle it via UI.
             // Let's assume we update the 'dialogueAudio' field if we had one.
             // We will mock this update for now as entity extension might be needed.
             // We can use `resource` field if it was generic, but it's specific. 
             // Storing as a special reference in `data` or similar.
        } catch (e) {
            console.error("Audio gen failed", e);
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
    const previewItems = useMemo(() => {
        if (!project.scenes) return [];
        let items: any[] = [];
        let timeOffset = 0;
        
        project.scenes.forEach(scene => {
            const sceneShots = project.shots.filter(s => s.sceneUuid === scene.uuid).sort((a,b) => a.index - b.index);
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
    
    const currentPreviewItem = useMemo(() => {
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
