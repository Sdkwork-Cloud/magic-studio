
import React, { useState } from 'react';
import { useFilmStore } from '../store/filmStore';
import { 
    BookOpen, Palette, Edit2, Clapperboard, MapPin, Users, Box, BarChart3, TrendingUp
} from 'lucide-react';

import {
    FilmShot,
    FilmCharacter,
    FilmLocation,
    FilmProp,
    MediaScene,
    useAssetUrl
} from '@sdkwork/react-commons';
import {
    hasFilmAssetReference,
    resolveFilmAssetUrlByAssetIdFirst,
    toFilmUseAssetSource
} from '../utils/filmAssetUrlResolver';

// Modals
import { ShotModal } from './ShotModal';
import { CharacterModal } from './CharacterModal';
import { LocationModal } from './LocationModal';
import { PropModal } from './PropModal';
import { NoteEditorModal } from './NoteEditorModal';

// Panels
import { CharacterListPanel } from './overview/CharacterListPanel';
import { PropListPanel } from './overview/PropListPanel';
import { LocationListPanel } from './overview/LocationListPanel';
import { StoryboardPanel } from './overview/StoryboardPanel';

export const ProjectOverview: React.FC = () => {
    const { 
        project, setView, 
        updateShot, addShot, generateShotImage, generateShotVideo,
        createCharacter, updateCharacter,
        createLocation, updateLocation,
        createProp, updateProp,
        updateProjectMetadata
    } = useFilmStore();

    // Modal States
    const [isShotModalOpen, setIsShotModalOpen] = useState(false);
    const [editingShot, setEditingShot] = useState<FilmShot | undefined>(undefined);
    const [editingSceneIndex, setEditingSceneIndex] = useState<number>(0);

    const [isCharModalOpen, setIsCharModalOpen] = useState(false);
    const [editingChar, setEditingChar] = useState<FilmCharacter | undefined>(undefined);

    const [isLocModalOpen, setIsLocModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<FilmLocation | undefined>(undefined);

    const [isPropModalOpen, setIsPropModalOpen] = useState(false);
    const [editingProp, setEditingProp] = useState<FilmProp | undefined>(undefined);

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

    // Stats
    const totalShots = project.shots.length;
    const generatedShots = project.shots.filter((shot) => {
        const hasVideo = hasFilmAssetReference(shot.generation?.video || null);
        const hasImage = !!shot.assets?.find((asset) => hasFilmAssetReference(asset));
        return hasVideo || hasImage;
    }).length;
    const progress = totalShots > 0 ? Math.round(((generatedShots / totalShots) * 100)) : 0;

    // Moodboard Logic - Get top 4 images for the header banner
    const moodImageSources = [
        ...project.locations.map(l => {
            const visualAsset = l.refAssets?.find(a => a.scene === MediaScene.LOCATION_VISUAL);
            return visualAsset || l.image || null;
        }),
        ...project.characters.map(c => {
            const avatarAsset = c.refAssets?.find(a => a.scene === MediaScene.AVATAR);
            return avatarAsset || c.faceImage || null;
        }),
        ...project.props.map(p => {
            const visualAsset = p.refAssets?.find(a => a.scene === MediaScene.PROP_VISUAL);
            return visualAsset || p.faceImage || null;
        })
    ]
        .filter((source) => hasFilmAssetReference(source))
        .slice(0, 4);

    // Handlers
    const handleEditShot = (shot: FilmShot, sceneIndex: number) => {
        setEditingShot(shot);
        setEditingSceneIndex(sceneIndex);
        setIsShotModalOpen(true);
    };
    const handleSaveShot = (data: Partial<FilmShot>) => {
        if (editingShot) updateShot(editingShot.sceneUuid, editingShot.uuid, data);
    };

    const handleAddCharacter = () => { setEditingChar(undefined); setIsCharModalOpen(true); };
    const handleEditCharacter = (char: FilmCharacter) => { setEditingChar(char); setIsCharModalOpen(true); };
    const handleSaveCharacter = (data: Partial<FilmCharacter>) => {
        if (editingChar) updateCharacter(editingChar.uuid, data);
        else createCharacter(data);
    };

    const handleAddLocation = () => { setEditingLoc(undefined); setIsLocModalOpen(true); };
    const handleEditLocation = (loc: FilmLocation) => { setEditingLoc(loc); setIsLocModalOpen(true); };
    const handleSaveLocation = (data: Partial<FilmLocation>) => {
        if (editingLoc) updateLocation(editingLoc.uuid, data);
        else createLocation(data);
    };

    const handleAddProp = () => { setEditingProp(undefined); setIsPropModalOpen(true); };
    const handleEditProp = (prop: FilmProp) => { setEditingProp(prop); setIsPropModalOpen(true); };
    const handleSaveProp = (data: Partial<FilmProp>) => {
        if (editingProp) updateProp(editingProp.uuid, data);
        else createProp(data);
    };

    const handleSaveSummary = (content: string) => updateProjectMetadata({ description: content });

    return (
        <div className="h-full w-full bg-[#050505] overflow-y-auto custom-scrollbar p-6 text-gray-200">
            <div className="max-w-[1800px] mx-auto space-y-6 pb-20">
                
                {/* 1. Production Dashboard Header */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Main: Story Bible (Merged Mood + Synopsis) - Takes 8/12 cols */}
                    <div className="xl:col-span-8 flex flex-col h-full">
                         <div className="bg-[#121214] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col shadow-sm group">
                             
                             {/* Mood Header (Cover) */}
                             <div className="relative h-44 shrink-0 w-full bg-[#0a0a0a]">
                                 {moodImageSources.length > 0 ? (
                                     <div className="absolute inset-0 flex">
                                         {moodImageSources.map((source, i) => (
                                             <div key={i} className="flex-1 relative overflow-hidden border-r border-black/20 last:border-0">
                                                 <MoodImageTile source={source} />
                                                 <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/20 to-transparent" />
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                                 )}
                                 
                                 <div className="absolute bottom-0 left-0 p-6 z-10 w-full">
                                     <div className="flex items-end justify-between">
                                         <div>
                                            <h1 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-2xl font-sans">{project.name}</h1>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                                                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                                    <Clapperboard size={12} /> {project.scenes.length} Scenes
                                                </span>
                                                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                                    <Users size={12} /> {project.characters.length} Cast
                                                </span>
                                                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                                    <MapPin size={12} /> {project.locations.length} Sets
                                                </span>
                                            </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Synopsis Body */}
                             <div className="p-6 relative flex-1 bg-[#121214]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                            <BookOpen size={18} /> 
                                        </div>
                                        Synopsis
                                    </div>
                                    <button 
                                        onClick={() => setIsSummaryModalOpen(true)} 
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1c] hover:bg-[#222] text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors border border-[#27272a] hover:border-[#333]"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                </div>
                                
                                <div className="relative text-gray-300 leading-7 font-serif text-base max-w-4xl">
                                    {project.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: project.description }} />
                                    ) : (
                                        <div className="text-gray-600 italic py-4 text-center border-2 border-dashed border-[#27272a] rounded-xl text-sm">
                                            No synopsis available. Click edit to add the story outline.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Stats & Style - Takes 4/12 cols */}
                    <div className="xl:col-span-4 flex flex-col gap-4 sticky top-0">
                         {/* Production Status */}
                         <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                <BarChart3 size={16} className="text-green-500" /> 
                                Production Status
                            </div>
                            
                            <div className="flex flex-col items-center justify-center py-1">
                                <div className="relative w-28 h-28 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="56" cy="56" r="50" fill="none" stroke="#1a1a1c" strokeWidth="10" />
                                        <circle cx="56" cy="56" r="50" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="314" strokeDashoffset={314 - (314 * progress) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-2xl font-bold text-white">{progress}%</span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Complete</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[#27272a]">
                                <div className="bg-[#1a1a1c] p-2.5 rounded-xl border border-[#27272a]">
                                    <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Total Shots</div>
                                    <div className="text-lg font-black text-white">{totalShots}</div>
                                </div>
                                <div className="bg-[#1a1a1c] p-2.5 rounded-xl border border-[#27272a]">
                                    <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Generated</div>
                                    <div className="text-lg font-black text-green-400">{generatedShots}</div>
                                </div>
                            </div>
                        </div>

                         {/* Art Style */}
                         <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                <Palette size={16} className="text-purple-500" /> 
                                Art Style
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.script.styles?.length > 0 ? (
                                    project.script.styles.map(tag => (
                                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-[#1a1a1c] text-purple-300 border border-purple-500/20 text-[10px] font-bold shadow-sm uppercase tracking-wide">
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-600 text-xs italic p-2 w-full text-center border border-dashed border-[#27272a] rounded-lg">Style tags undefined</span>
                                )}
                            </div>
                            
                            <div className="bg-[#1a1a1c] p-3 rounded-xl border border-[#27272a]">
                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-1.5">Technical Specs</div>
                                <div className="flex justify-between items-center text-[10px] font-mono text-gray-300">
                                    <span>{project.settings.resolution}</span>
                                    <span className="text-gray-600">|</span>
                                    <span>{project.settings.aspect}</span>
                                    <span className="text-gray-600">|</span>
                                    <span>{project.settings.fps} FPS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Asset Lanes */}
                <div className="space-y-8">
                    <CharacterListPanel 
                        characters={project.characters}
                        onAdd={handleAddCharacter}
                        onEdit={handleEditCharacter}
                        onViewAll={() => setView('characters')}
                        variant="dashboard"
                    />

                    <LocationListPanel 
                        locations={project.locations}
                        onAdd={handleAddLocation}
                        onEdit={handleEditLocation}
                        onViewAll={() => setView('locations')}
                        variant="dashboard"
                    />
                    
                    <PropListPanel
                        props={project.props}
                        onAdd={handleAddProp}
                        onEdit={handleEditProp}
                        onViewAll={() => setView('props')}
                    />
                </div>

                {/* 3. Storyboard Section */}
                <div className="pt-8 border-t border-[#27272a]">
                    <StoryboardPanel 
                        scenes={project.scenes}
                        shots={project.shots}
                        locations={project.locations}
                        characters={project.characters}
                        props={project.props}
                        onAddShot={addShot}
                        onEditShot={handleEditShot}
                        onGenerateShot={(shotId) => {
                             const shot = project.shots.find(s => s.uuid === shotId);
                             if(shot) generateShotImage(shot.sceneUuid, shot.uuid);
                        }}
                        onViewAll={() => setView('storyboard')}
                    />
                </div>

            </div>

            {/* Modals */}
            <ShotModal 
                isOpen={isShotModalOpen}
                onClose={() => setIsShotModalOpen(false)}
                initialData={editingShot}
                onSave={handleSaveShot}
                sceneIndex={editingSceneIndex}
                characters={project.characters}
            />
            <CharacterModal 
                isOpen={isCharModalOpen}
                onClose={() => setIsCharModalOpen(false)}
                onSave={handleSaveCharacter}
                initialData={editingChar}
            />
            <LocationModal
                isOpen={isLocModalOpen}
                onClose={() => setIsLocModalOpen(false)}
                onSave={handleSaveLocation}
                initialData={editingLoc}
            />
            <PropModal
                isOpen={isPropModalOpen}
                onClose={() => setIsPropModalOpen(false)}
                onSave={handleSaveProp}
                initialData={editingProp}
            />
            <NoteEditorModal 
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                initialContent={project.description || ''}
                onSave={handleSaveSummary}
                title="Edit Synopsis"
            />
        </div>
    );
};

const MoodImageTile: React.FC<{ source: unknown }> = ({ source }) => {
    const { url } = useAssetUrl(toFilmUseAssetSource(source), {
        resolver: resolveFilmAssetUrlByAssetIdFirst
    });

    if (!url) {
        return <div className="w-full h-full bg-[#101012]" />;
    }

    return (
        <img
            src={url}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 hover:scale-105"
            alt="Mood"
        />
    );
};
