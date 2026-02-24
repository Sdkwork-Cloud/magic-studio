
import React, { useState } from 'react';
import { Clapperboard, Plus, MapPin, Film } from 'lucide-react';
import { FilmScene, FilmShot, FilmLocation, FilmCharacter, FilmProp } from '../../entities/film.entity';
import { SceneGroup } from './SceneGroup';
import { SceneInsertionZone } from './SceneInsertionZone';
import { SceneModal } from '../SceneModal';
import { useFilmStore } from '../../store/filmStore';
import { ShotCard } from './ShotCard';

interface SceneListPanelProps {
    scenes: FilmScene[];
    shots: FilmShot[];
    locations: FilmLocation[];
    characters: FilmCharacter[];
    props: FilmProp[];
    
    onEditShot: (shot: FilmShot, sceneIndex: number) => void;
    onAddShot: (sceneUuid?: string, locationUuid?: string) => void;
    onGenerateShotImage: (shotId: string) => void;
    onGenerateShotVideo: (shotId: string) => void;
    onGenerateShotAudio: (shotId: string) => void;
}

export const SceneListPanel: React.FC<SceneListPanelProps> = ({ 
    scenes, shots, locations, characters, props,
    onEditShot, onAddShot, onGenerateShotImage, onGenerateShotVideo, onGenerateShotAudio
}) => {
    const { addScene, updateScene, deleteScene, addShot, deleteShot } = useFilmStore();
    
    // Modal State
    const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
    const [editingScene, setEditingScene] = useState<FilmScene | undefined>(undefined);
    const [insertIndex, setInsertIndex] = useState<number | null>(null);
    
    // Standalone Shot Modal
    const [isShotModalOpen, setIsShotModalOpen] = useState(false);
    const [selectedLocationUuid, setSelectedLocationUuid] = useState<string | undefined>(undefined);

    // Get standalone shots (shots without scene)
    const standaloneShots = shots.filter(s => !s.sceneUuid).sort((a, b) => a.index - b.index);
    
    // -- Handlers --
    
    const handleInsertClick = (index: number) => {
        setInsertIndex(index);
        setEditingScene(undefined);
        setIsSceneModalOpen(true);
    };

    const handleEditClick = (scene: FilmScene) => {
        setEditingScene(scene);
        setInsertIndex(null);
        setIsSceneModalOpen(true);
    };

    const handleModalSave = (data: Partial<FilmScene>) => {
        if (editingScene) {
            updateScene(editingScene.uuid, data);
        } else if (insertIndex !== null) {
            addScene(insertIndex, data);
        }
    };
    
    const handleGenerateAllImages = (sceneUuid: string) => {
        const sceneShots = shots.filter(s => s.sceneUuid === sceneUuid);
        sceneShots.forEach(shot => {
             if (!shot.assets || shot.assets.length === 0) {
                 onGenerateShotImage(shot.uuid);
             }
        });
    };

    const handleGenerateAllVideos = (sceneUuid: string) => {
        const sceneShots = shots.filter(s => s.sceneUuid === sceneUuid);
        sceneShots.forEach(shot => {
             if (!shot.generation?.video) {
                 onGenerateShotVideo(shot.uuid);
             }
        });
    };

    const handleGenerateAllAudio = (sceneUuid: string) => {
        const sceneShots = shots.filter(s => s.sceneUuid === sceneUuid);
        sceneShots.forEach(shot => {
             if (shot.dialogue?.items && shot.dialogue.items.length > 0) {
                 onGenerateShotAudio(shot.uuid);
             }
        });
    };
    
    const handleAddStandaloneShot = () => {
        addShot(undefined, selectedLocationUuid);
        setIsShotModalOpen(false);
        setSelectedLocationUuid(undefined);
    };
    
    const handleGenerateStandaloneImages = () => {
        standaloneShots.forEach(shot => {
            if (!shot.assets || shot.assets.length === 0) {
                onGenerateShotImage(shot.uuid);
            }
        });
    };
    
    const handleGenerateStandaloneVideos = () => {
        standaloneShots.forEach(shot => {
            if (!shot.generation?.video) {
                onGenerateShotVideo(shot.uuid);
            }
        });
    };

    // If list is empty, show a big create button
    if (scenes.length === 0 && standaloneShots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#27272a] rounded-xl bg-[#131315] text-gray-500 gap-4">
                <div className="p-4 bg-[#1e1e1e] rounded-full">
                    <Clapperboard size={32} className="text-gray-700" />
                </div>
                <div className="text-center">
                    <p className="font-medium text-lg">No scenes found.</p>
                    <p className="text-sm mt-1 opacity-60">Analyze the script or create your first scene manually.</p>
                </div>
                <button 
                    onClick={() => handleInsertClick(0)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                    <Plus size={18} /> Create First Scene
                </button>
                
                {/* Modal for empty state creation */}
                <SceneModal 
                    isOpen={isSceneModalOpen}
                    onClose={() => setIsSceneModalOpen(false)}
                    onSave={handleModalSave}
                />
                
                {/* Standalone Shot Modal */}
                {isShotModalOpen && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">Add Standalone Shot</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Create a shot without a scene. Optionally select a location.
                            </p>
                            
                            <div className="mb-4">
                                <label className="text-xs text-gray-500 font-medium mb-2 block">Location (Optional)</label>
                                <select 
                                    value={selectedLocationUuid || ''} 
                                    onChange={(e) => setSelectedLocationUuid(e.target.value || undefined)}
                                    className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">No Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.uuid} value={loc.uuid}>
                                            {loc.name} ({loc.indoor ? 'INT' : 'EXT'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => {
                                        setIsShotModalOpen(false);
                                        setSelectedLocationUuid(undefined);
                                    }}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddStandaloneShot}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Add Shot
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-0 pb-20">
            
            {/* Top Insertion Zone */}
            <SceneInsertionZone index={0} onInsert={handleInsertClick} isFirst />

            {scenes.map((scene, i) => {
                const location = locations.find(l => l.uuid === scene.locationUuid);
                const sceneShots = shots.filter(s => s.sceneUuid === scene.uuid).sort((a, b) => a.index - b.index);
                
                const sceneCharacters = characters.filter(c => scene.characterUuids?.includes(c.uuid));
                const sceneProps = props.filter(p => scene.propUuids?.includes(p.uuid));

                return (
                    <React.Fragment key={scene.uuid}>
                        <SceneGroup
                            scene={scene}
                            location={location}
                            shots={sceneShots}
                            characters={sceneCharacters}
                            storyProps={sceneProps}
                            onGenerateAllImages={() => handleGenerateAllImages(scene.uuid)}
                            onGenerateAllVideos={() => handleGenerateAllVideos(scene.uuid)}
                            onGenerateAllAudio={() => handleGenerateAllAudio(scene.uuid)}
                            onEditShot={(shot) => onEditShot(shot, scene.index)}
                            onAddShot={() => onAddShot(scene.uuid)}
                            onGenerateShot={onGenerateShotImage}
                            onDeleteShot={deleteShot}
                            onEditScene={() => handleEditClick(scene)}
                            onDeleteScene={() => deleteScene(scene.uuid)}
                        />
                        <SceneInsertionZone index={i + 1} onInsert={handleInsertClick} isLast={i === scenes.length - 1} />
                    </React.Fragment>
                );
            })}

            {/* Standalone Shots Section */}
            {standaloneShots.length > 0 && (
                <div className="mt-8 bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#0e0e10] border-b border-[#27272a] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                <Film size={16} /> Standalone Shots
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                                {standaloneShots.length} shots without scene
                            </span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handleGenerateStandaloneImages}
                                className="text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-purple-500/10 hover:border-purple-500/30"
                            >
                                Gen Images
                            </button>
                            <button 
                                onClick={handleGenerateStandaloneVideos}
                                className="text-[10px] text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-pink-500/10 hover:border-pink-500/30"
                            >
                                Gen Videos
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 bg-[#0a0a0a]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {standaloneShots.map(shot => {
                                const shotLocation = locations.find(l => l.uuid === shot.locationUuid);
                                return (
                                    <div key={shot.uuid} className="relative">
                                        {shotLocation && (
                                            <div className="absolute top-1 left-1 z-20 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[8px] text-gray-300 font-medium flex items-center gap-1">
                                                <MapPin size={8} /> {shotLocation.name}
                                            </div>
                                        )}
                                        <ShotCard 
                                            shot={shot}
                                            onClick={() => onEditShot(shot, 0)}
                                            onGenerate={() => onGenerateShotImage(shot.uuid)}
                                            onDelete={() => deleteShot(shot.uuid)}
                                        />
                                    </div>
                                );
                            })}
                            
                            {/* Add Standalone Shot Button */}
                            <button 
                                onClick={() => setIsShotModalOpen(true)}
                                className="aspect-video rounded-xl border-2 border-dashed border-[#27272a] hover:border-amber-500/30 bg-[#121214] hover:bg-[#151518] flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 transition-all group gap-2"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#1e1e20] group-hover:bg-amber-500/10 flex items-center justify-center transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">Add Shot</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scene Modal */}
            <SceneModal 
                isOpen={isSceneModalOpen}
                onClose={() => setIsSceneModalOpen(false)}
                onSave={handleModalSave}
                initialData={editingScene}
            />
            
            {/* Standalone Shot Modal */}
            {isShotModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Add Standalone Shot</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Create a shot without a scene. Optionally select a location.
                        </p>
                        
                        <div className="mb-4">
                            <label className="text-xs text-gray-500 font-medium mb-2 block">Location (Optional)</label>
                            <select 
                                value={selectedLocationUuid || ''} 
                                onChange={(e) => setSelectedLocationUuid(e.target.value || undefined)}
                                className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">No Location</option>
                                {locations.map(loc => (
                                    <option key={loc.uuid} value={loc.uuid}>
                                        {loc.name} ({loc.indoor ? 'INT' : 'EXT'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => {
                                    setIsShotModalOpen(false);
                                    setSelectedLocationUuid(undefined);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddStandaloneShot}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                            >
                                Add Shot
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
