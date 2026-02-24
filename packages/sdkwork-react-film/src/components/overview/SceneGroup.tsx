
import React from 'react';
import { MapPin, Plus, Edit2, Trash2, Image as ImageIcon, Video, Mic, User, Clock, Clapperboard } from 'lucide-react';

import { FilmScene, FilmShot, FilmLocation, FilmCharacter, FilmProp, MediaScene } from 'sdkwork-react-commons';
import { ShotCard } from './ShotCard';

export interface SceneGroupProps {
    scene: FilmScene;
    location?: FilmLocation;
    shots: FilmShot[];
    characters: FilmCharacter[];
    storyProps: FilmProp[];
    onGenerateAllImages: () => void;
    onGenerateAllVideos: () => void;
    onGenerateAllAudio: () => void;
    onEditShot: (shot: FilmShot) => void;
    onAddShot: () => void;
    onGenerateShot: (shotId: string) => void;
    onDeleteShot: (shotId: string) => void;
    onEditScene: () => void;
    onDeleteScene: () => void;
}

export const SceneGroup: React.FC<SceneGroupProps> = ({ 
    scene, location, shots, 
    characters, storyProps, onGenerateAllImages, onGenerateAllVideos, onGenerateAllAudio,
    onEditShot, onAddShot, onGenerateShot, onDeleteShot,
    onEditScene, onDeleteScene
}) => {
    const duration = shots.reduce((acc, s) => acc + s.duration, 0);
    const videoCount = shots.filter(s => s.generation?.video).length;
    const imageCount = shots.filter(s => s.assets?.length).length;
    const progress = shots.length > 0 ? Math.round(((imageCount + videoCount) / (shots.length * 2)) * 100) : 0;
    
    const slatePattern = {
        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)'
    };

    return (
        <div className="bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-all duration-300 shadow-sm hover:shadow-xl group/scene mb-6">
            
            {/* Scene Header */}
            <div className="bg-[#0e0e10] border-b border-[#27272a] relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={slatePattern} />
                
                <div className="p-4 relative z-10 flex flex-col gap-3">
                    {/* Top Row: Scene ID, Location, Stats, Actions */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Left: Scene ID & Location */}
                        <div className="flex items-start gap-3">
                            {/* Clapper Box */}
                            <div 
                                className="flex flex-col items-center justify-center bg-[#1a1a1c] border border-white/10 rounded-lg w-14 h-14 shrink-0 shadow-lg relative group/slate cursor-pointer" 
                                onClick={onEditScene}
                            >
                                <div className="absolute top-0 left-0 w-full h-2.5 bg-white/10 border-b border-black/50 flex">
                                    <div className="w-1/2 h-full border-r border-black/50 transform -skew-x-12 bg-white/5" />
                                </div>
                                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-1.5">SCENE</span>
                                <span className="text-2xl font-black text-white leading-none tracking-tighter">{scene.index}</span>
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/slate:opacity-100 transition-opacity rounded-lg" />
                            </div>
                            
                            <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${location?.indoor ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30' : 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30'}`}>
                                        {location?.indoor ? 'INT' : 'EXT'}
                                    </span>
                                    <h3 className="text-sm font-bold text-gray-100 tracking-wide">
                                        {location?.name || 'No Location'}
                                    </h3>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${location?.timeOfDay === 'NIGHT' ? 'bg-blue-900/40 text-blue-300 border-blue-500/30' : 'bg-amber-900/40 text-amber-300 border-amber-500/30'}`}>
                                        {location?.timeOfDay || 'DAY'}
                                    </span>
                                </div>
                                
                                <p className="text-[11px] text-gray-500 line-clamp-1 italic max-w-md border-l-2 border-gray-700 pl-2">
                                    "{scene.summary || 'No summary'}"
                                </p>
                            </div>
                        </div>

                        {/* Right: Stats & Actions */}
                        <div className="flex items-center gap-3">
                            {/* Cast Avatars */}
                            {characters.length > 0 && (
                                <div className="flex -space-x-1.5">
                                    {characters.slice(0, 3).map(char => {
                                        const avatarAsset = char.refAssets?.find(a => a.scene === MediaScene.AVATAR);
                                        const avatarUrl = avatarAsset?.url || avatarAsset?.image?.url;
                                        return (
                                            <div key={char.uuid} className="w-6 h-6 rounded-full border border-[#0e0e10] bg-[#252526] overflow-hidden" title={char.name}>
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        <User size={10}/>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {characters.length > 3 && (
                                        <div className="w-6 h-6 rounded-full border border-[#0e0e10] bg-[#252526] flex items-center justify-center text-[8px] text-gray-400 font-bold">
                                            +{characters.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono bg-[#1a1a1c] px-2 py-1 rounded-lg border border-[#252528]">
                                <Clock size={10} />
                                <span className="text-gray-300">{duration}s</span>
                                <span className="text-gray-600">|</span>
                                <span>{shots.length} shots</span>
                            </div>

                            {/* Progress */}
                            <div className="w-20 h-1.5 bg-[#1a1a1c] rounded-full overflow-hidden border border-[#252528]">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            
                            {/* Edit/Delete */}
                            <div className="flex items-center gap-0.5">
                                <button 
                                    onClick={onEditScene} 
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252526] rounded-lg transition-colors"
                                >
                                    <Edit2 size={14}/>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteScene(); }} 
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Batch Actions */}
                    <div className="flex items-center justify-between">
                        <div className="text-[9px] text-gray-600 font-mono">
                            UUID: {scene.uuid.slice(0, 8)}
                        </div>
                        <div className="flex gap-1.5">
                            <button 
                                onClick={onGenerateAllImages} 
                                className="text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2.5 py-1 rounded transition-colors flex items-center gap-1 border border-purple-500/10 hover:border-purple-500/30"
                            >
                                <ImageIcon size={10} /> Gen Images
                            </button>
                            <button 
                                onClick={onGenerateAllVideos} 
                                className="text-[10px] text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 px-2.5 py-1 rounded transition-colors flex items-center gap-1 border border-pink-500/10 hover:border-pink-500/30"
                            >
                                <Video size={10} /> Gen Videos
                            </button>
                            <button 
                                onClick={onGenerateAllAudio} 
                                className="text-[10px] text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-2.5 py-1 rounded transition-colors flex items-center gap-1 border border-orange-500/10 hover:border-orange-500/30"
                            >
                                <Mic size={10} /> Gen Audio
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3 bg-[#0a0a0a]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {shots.map(shot => (
                        <ShotCard 
                            key={shot.uuid} 
                            shot={shot}
                            onClick={() => onEditShot(shot)}
                            onGenerate={() => onGenerateShot(shot.uuid)}
                            onDelete={() => onDeleteShot(shot.uuid)}
                        />
                    ))}
                    
                    {/* Add Shot Button */}
                    <button 
                        onClick={onAddShot}
                        className="aspect-video rounded-lg border border-dashed border-[#27272a] hover:border-blue-500/30 bg-[#121214] hover:bg-[#151518] flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 transition-all group gap-1"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#1e1e20] group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                            <Plus size={16} />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">New Shot</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
