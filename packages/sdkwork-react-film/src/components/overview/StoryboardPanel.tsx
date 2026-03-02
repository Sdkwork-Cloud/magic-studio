
import { FilmScene, FilmShot, FilmLocation, FilmCharacter, FilmProp } from '@sdkwork/react-commons';
import React from 'react';
import { Clapperboard, Video, Mic, Image as ImageIcon } from 'lucide-react';

import { useFilmStore } from '../../store/filmStore';
import { SceneListPanel } from './SceneListPanel';

interface StoryboardPanelProps {
    scenes: FilmScene[];
    shots: FilmShot[];
    locations: FilmLocation[];
    characters: FilmCharacter[];
    props: FilmProp[];
    
    onEditShot: (shot: FilmShot, sceneIndex: number) => void;
    onAddShot: (sceneUuid?: string, locationUuid?: string) => void;
    onGenerateShot: (shotId: string) => void; 
    onViewAll?: () => void;
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ 
    scenes, shots, locations, characters, props,
    onEditShot, onAddShot, onGenerateShot, onViewAll: _onViewAll
}) => {
    const { 
        generateAllImages, 
        generateAllVideos, 
        generateAllAudio,
        generateShotVideo,
        generateShotAudio,
        isProcessing,
        batchProgress
    } = useFilmStore();

    const sceneUuids = new Set(scenes.map(s => s.uuid));
    const standaloneShots = shots.filter(s => !s.sceneUuid || !sceneUuids.has(s.sceneUuid));
    const sceneShots = shots.filter(s => s.sceneUuid && sceneUuids.has(s.sceneUuid));

    const handleGenerateVideo = async (shotId: string) => {
        const shot = shots.find(s => s.uuid === shotId);
        if (shot) {
            await generateShotVideo(shot.sceneUuid, shotId);
        }
    };

    const handleGenerateAudio = async (shotId: string) => {
        const shot = shots.find(s => s.uuid === shotId);
        if (shot) {
            await generateShotAudio(shot.sceneUuid, shotId);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Global Toolbar (Sticky) */}
            <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] py-4 -mx-4 px-4 mb-8 flex items-center justify-between shadow-lg">
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-green-400 uppercase tracking-wider bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <Clapperboard size={16} /> Storyboard
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        {shots.length} shots ({sceneShots.length} in scenes, {standaloneShots.length} standalone)
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    {isProcessing && batchProgress.total > 0 ? (
                        <div className="flex items-center gap-3 mr-4 animate-in fade-in slide-in-from-right-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                                    Generating {batchProgress.type}...
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {batchProgress.current} / {batchProgress.total}
                                </span>
                            </div>
                            <div className="w-24 h-1.5 bg-[#252526] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <ActionButton 
                                onClick={generateAllImages} 
                                icon={<ImageIcon size={14} />} 
                                label="Gen All Images" 
                                color="purple"
                            />
                            <div className="w-px h-6 bg-[#27272a] mx-1" />
                            <ActionButton 
                                onClick={generateAllVideos} 
                                icon={<Video size={14} />} 
                                label="Gen All Videos" 
                                color="pink"
                            />
                            <ActionButton 
                                onClick={generateAllAudio} 
                                icon={<Mic size={14} />} 
                                label="Gen All Audio" 
                                color="orange"
                            />
                        </>
                    )}
                </div>
            </div>

            <SceneListPanel 
                scenes={scenes}
                shots={shots}
                locations={locations}
                characters={characters}
                props={props}
                onEditShot={onEditShot}
                onAddShot={onAddShot}
                onGenerateShotImage={onGenerateShot}
                onGenerateShotVideo={handleGenerateVideo}
                onGenerateShotAudio={handleGenerateAudio}
            />
        </div>
    );
};

const ActionButton: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, color: 'purple'|'pink'|'orange' }> = ({ onClick, icon, label, color }) => {
    const colors = {
        purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
        pink: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20',
        orange: 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20',
    };
    
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wide hover:shadow-lg ${colors[color]}`}
        >
            {icon} {label}
        </button>
    );
};
