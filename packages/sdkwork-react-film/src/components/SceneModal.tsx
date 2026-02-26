import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, MapPin, Image as ImageIcon, Users, Box, Check, Plus, Sparkles, Sun, Moon, Sunrise, Sunset, Home, TreePine, Wand2, ChevronDown } from 'lucide-react';

import { Button, FilmScene, FilmLocation, FilmCharacter, FilmProp, MediaScene } from '@sdkwork/react-commons';
import { useFilmStore } from '../store/filmStore';
import { CharacterModal } from './CharacterModal';
import { PropModal } from './PropModal';
import { genAIService } from '@sdkwork/react-core';

interface SceneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<FilmScene>) => void;
    initialData?: FilmScene;
}

const MOOD_PRESETS = [
    { label: 'Tense', color: 'red' },
    { label: 'Romantic', color: 'pink' },
    { label: 'Mysterious', color: 'purple' },
    { label: 'Action', color: 'orange' },
    { label: 'Peaceful', color: 'green' },
    { label: 'Dramatic', color: 'yellow' },
    { label: 'Comedy', color: 'blue' },
    { label: 'Horror', color: 'gray' },
];

const getTimeIcon = (time?: string) => {
    switch (time) {
        case 'NIGHT': return Moon;
        case 'DAWN': return Sunrise;
        case 'DUSK': return Sunset;
        default: return Sun;
    }
};

export const SceneModal: React.FC<SceneModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { project, createCharacter, createProp } = useFilmStore();
    const [summary, setSummary] = useState('');
    const [locationUuid, setLocationUuid] = useState('');
    const [moodTags, setMoodTags] = useState<string[]>([]);
    const [visualPrompt, setVisualPrompt] = useState('');
    
    const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
    const [selectedPropIds, setSelectedPropIds] = useState<string[]>([]);

    const [showCharModal, setShowCharModal] = useState(false);
    const [showPropModal, setShowPropModal] = useState(false);
    
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showAllChars, setShowAllChars] = useState(false);
    const [showAllProps, setShowAllProps] = useState(false);

    const locationOptions = [
        { label: 'No Location', value: '' },
        ...project.locations.map(l => ({ label: l.name, value: l.uuid }))
    ];

    const selectedLocation = useMemo(() => 
        project.locations.find(l => l.uuid === locationUuid), 
    [locationUuid, project.locations]);

    useEffect(() => {
        if (isOpen) {
            setSummary(initialData?.summary || '');
            setLocationUuid(initialData?.locationUuid || '');
            setMoodTags(initialData?.moodTags || []);
            setVisualPrompt(initialData?.visualPrompt || '');
            setSelectedCharIds(initialData?.characterUuids || []);
            setSelectedPropIds(initialData?.propUuids || []);
        } else {
            setSummary('');
            setLocationUuid('');
            setMoodTags([]);
            setVisualPrompt('');
            setSelectedCharIds([]);
            setSelectedPropIds([]);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, summary, locationUuid, moodTags, visualPrompt, selectedCharIds, selectedPropIds]);

    const handleSave = useCallback(() => {
        const data: Partial<FilmScene> = {
            summary,
            locationUuid: locationUuid || undefined,
            moodTags,
            visualPrompt,
            characterUuids: selectedCharIds,
            propUuids: selectedPropIds
        };
        onSave(data);
        onClose();
    }, [summary, locationUuid, moodTags, visualPrompt, selectedCharIds, selectedPropIds]);

    const toggleSelection = (id: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    const toggleMoodTag = (tag: string) => {
        if (moodTags.includes(tag)) {
            setMoodTags(moodTags.filter(t => t !== tag));
        } else {
            setMoodTags([...moodTags, tag]);
        }
    };

    const handleCreateCharacter = (data: Partial<FilmCharacter>) => {
        createCharacter(data);
    };

    const handleCreateProp = (data: Partial<FilmProp>) => {
        createProp(data);
    };

    const handleEnhancePrompt = async () => {
        if (!visualPrompt && !summary) return;
        setIsEnhancing(true);
        try {
            const baseText = visualPrompt || summary || 'Cinematic scene';
            const enhanced = await genAIService.enhancePrompt(baseText);
            setVisualPrompt(enhanced);
        } catch (e) {
            console.error("Enhancement failed", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    if (!isOpen) return null;

    const TimeIcon = getTimeIcon(selectedLocation?.timeOfDay);
    const displayChars = showAllChars ? project.characters : project.characters.slice(0, 4);
    const displayProps = showAllProps ? project.props : project.props.slice(0, 4);

    return createPortal(
        <>
            <div 
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-150"
                onClick={onClose}
            >
                <div 
                    className="w-full max-w-5xl bg-[#131315] border border-[#252528] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-none px-5 py-3.5 border-b border-[#252528] flex justify-between items-center bg-[#18181b]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/30 flex items-center justify-center">
                                <MapPin size={16} className="text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-[15px]">
                                    {initialData ? `Edit Scene ${initialData.index}` : 'New Scene'}
                                </h3>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-lg bg-[#252528] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    
                    {/* Body - Single Column Layout */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                        
                        {/* Row 1: Location + Summary */}
                        <div className="grid grid-cols-12 gap-4">
                            {/* Location Selector with Preview */}
                            <div className="col-span-5 space-y-2">
                                <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                    <MapPin size={11} className="text-green-400" />
                                    Location
                                </label>
                                
                                <div className="space-y-2">
                                    <select 
                                        value={locationUuid}
                                        onChange={(e) => setLocationUuid(e.target.value)}
                                        className="w-full bg-[#0a0a0b] border border-[#252528] rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:outline-none focus:border-green-500/50 transition-all"
                                    >
                                        {locationOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    
                                    {/* 16:9 Preview */}
                                    <div className="relative w-full aspect-video bg-[#0a0a0b] border border-[#252528] rounded-lg overflow-hidden">
                                        {selectedLocation?.image?.url ? (
                                            <>
                                                <img 
                                                    src={selectedLocation.image.url} 
                                                    className="w-full h-full object-cover"
                                                    alt={selectedLocation.name}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                                    <span className="text-white text-[11px] font-medium">{selectedLocation.name}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <TimeIcon size={11} className="text-amber-400" />
                                                        {selectedLocation.indoor ? (
                                                            <Home size={11} className="text-blue-400" />
                                                        ) : (
                                                            <TreePine size={11} className="text-green-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                                <MapPin size={18} className="mb-1 opacity-40" />
                                                <span className="text-[10px] opacity-60">No location</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Summary + Mood */}
                            <div className="col-span-7 space-y-3">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                        <ImageIcon size={11} className="text-blue-400" />
                                        Summary
                                    </label>
                                    <textarea
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        rows={2}
                                        placeholder="What happens in this scene..."
                                        className="w-full bg-[#0a0a0b] border border-[#252528] rounded-lg px-3 py-2 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                        <Sparkles size={11} className="text-purple-400" />
                                        Mood
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {MOOD_PRESETS.map(mood => {
                                            const isSelected = moodTags.includes(mood.label);
                                            const colorMap: Record<string, string> = {
                                                red: 'bg-red-500/20 border-red-500/50 text-red-300',
                                                pink: 'bg-pink-500/20 border-pink-500/50 text-pink-300',
                                                purple: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
                                                orange: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
                                                green: 'bg-green-500/20 border-green-500/50 text-green-300',
                                                yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
                                                blue: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
                                                gray: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
                                            };
                                            return (
                                                <button
                                                    key={mood.label}
                                                    onClick={() => toggleMoodTag(mood.label)}
                                                    className={`
                                                        px-2.5 py-1 rounded text-[11px] font-medium border transition-all
                                                        ${isSelected 
                                                            ? colorMap[mood.color]
                                                            : 'bg-[#1a1a1c] border-[#252528] text-gray-500 hover:border-gray-600 hover:text-gray-400'
                                                        }
                                                    `}
                                                >
                                                    {mood.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Characters + Props (Inline) */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Characters */}
                            <div className="bg-[#0d0d0f] border border-[#252528] rounded-xl p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                        <Users size={11} className="text-blue-400" />
                                        Cast
                                        {selectedCharIds.length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px]">
                                                {selectedCharIds.length}
                                            </span>
                                        )}
                                    </label>
                                    <button 
                                        onClick={() => setShowCharModal(true)}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                                    >
                                        <Plus size={10} /> Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.characters.length > 0 ? (
                                        <>
                                            {displayChars.map(char => {
                                                const isSelected = selectedCharIds.includes(char.uuid);
                                                const avatarAsset = char.refAssets?.find(a => a.scene === MediaScene.AVATAR);
                                                const avatarUrl = avatarAsset?.url || avatarAsset?.image?.url;
                                                return (
                                                    <button
                                                        key={char.uuid}
                                                        onClick={() => toggleSelection(char.uuid, selectedCharIds, setSelectedCharIds)}
                                                        className={`
                                                            flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all
                                                            ${isSelected 
                                                                ? 'bg-blue-500/15 border-blue-500/40 text-blue-200' 
                                                                : 'bg-[#141416] border-[#252528] text-gray-400 hover:border-gray-600'
                                                            }
                                                        `}
                                                    >
                                                        <div className="w-5 h-5 rounded bg-[#1a1a1c] overflow-hidden flex-shrink-0">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Users size={8} className="text-gray-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-medium">{char.name}</span>
                                                        {isSelected && <Check size={10} className="text-blue-400" />}
                                                    </button>
                                                );
                                            })}
                                            {project.characters.length > 4 && (
                                                <button
                                                    onClick={() => setShowAllChars(!showAllChars)}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                                                >
                                                    <ChevronDown size={10} className={`transition-transform ${showAllChars ? 'rotate-180' : ''}`} />
                                                    {showAllChars ? 'Less' : `+${project.characters.length - 4} more`}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setShowCharModal(true)}
                                            className="text-[11px] text-gray-500 hover:text-blue-400 transition-colors py-1"
                                        >
                                            + Add characters
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Props */}
                            <div className="bg-[#0d0d0f] border border-[#252528] rounded-xl p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                        <Box size={11} className="text-orange-400" />
                                        Props
                                        {selectedPropIds.length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-[9px]">
                                                {selectedPropIds.length}
                                            </span>
                                        )}
                                    </label>
                                    <button 
                                        onClick={() => setShowPropModal(true)}
                                        className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5 transition-colors"
                                    >
                                        <Plus size={10} /> Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.props.length > 0 ? (
                                        <>
                                            {displayProps.map(prop => {
                                                const isSelected = selectedPropIds.includes(prop.uuid);
                                                const visualAsset = prop.refAssets?.find(a => a.scene === MediaScene.PROP_VISUAL);
                                                const visualUrl = visualAsset?.url || visualAsset?.image?.url;
                                                return (
                                                    <button
                                                        key={prop.uuid}
                                                        onClick={() => toggleSelection(prop.uuid, selectedPropIds, setSelectedPropIds)}
                                                        className={`
                                                            flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all
                                                            ${isSelected 
                                                                ? 'bg-orange-500/15 border-orange-500/40 text-orange-200' 
                                                                : 'bg-[#141416] border-[#252528] text-gray-400 hover:border-gray-600'
                                                            }
                                                        `}
                                                    >
                                                        <div className="w-5 h-5 rounded bg-[#1a1a1c] overflow-hidden flex-shrink-0">
                                                            {visualUrl ? (
                                                                <img src={visualUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Box size={8} className="text-gray-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-medium">{prop.name}</span>
                                                        {isSelected && <Check size={10} className="text-orange-400" />}
                                                    </button>
                                                );
                                            })}
                                            {project.props.length > 4 && (
                                                <button
                                                    onClick={() => setShowAllProps(!showAllProps)}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                                                >
                                                    <ChevronDown size={10} className={`transition-transform ${showAllProps ? 'rotate-180' : ''}`} />
                                                    {showAllProps ? 'Less' : `+${project.props.length - 4} more`}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setShowPropModal(true)}
                                            className="text-[11px] text-gray-500 hover:text-orange-400 transition-colors py-1"
                                        >
                                            + Add props
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Visual Prompt */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                                    <Wand2 size={11} className="text-purple-400" />
                                    Visual Prompt
                                </label>
                                <button
                                    onClick={handleEnhancePrompt}
                                    disabled={isEnhancing || (!visualPrompt && !summary)}
                                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-purple-500/10"
                                >
                                    <Sparkles size={10} className={isEnhancing ? 'animate-spin' : ''} />
                                    {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                                </button>
                            </div>
                            <textarea
                                value={visualPrompt}
                                onChange={(e) => setVisualPrompt(e.target.value)}
                                rows={3}
                                placeholder="Describe visual style, lighting, camera angles..."
                                className="w-full bg-[#0a0a0b] border border-[#252528] rounded-lg px-3 py-2.5 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-mono leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-none px-5 py-3 border-t border-[#252528] bg-[#18181b] flex justify-between items-center">
                        <p className="text-[10px] text-gray-600">
                            <kbd className="px-1 py-0.5 bg-[#252528] rounded text-gray-500 mx-0.5 text-[9px]">?</kbd>
                            <span className="text-gray-600">+</span>
                            <kbd className="px-1 py-0.5 bg-[#252528] rounded text-gray-500 mx-0.5 text-[9px]">Enter</kbd>
                            <span className="ml-1">to save</span>
                        </p>
                        <div className="flex gap-2.5">
                            <button 
                                onClick={onClose}
                                className="px-4 py-2 text-[13px] text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-[13px] font-medium rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <Save size={13} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Modals */}
            <CharacterModal 
                isOpen={showCharModal} 
                onClose={() => setShowCharModal(false)}
                onSave={handleCreateCharacter}
            />
            <PropModal 
                isOpen={showPropModal} 
                onClose={() => setShowPropModal(false)}
                onSave={handleCreateProp}
            />
        </>,
        document.body
    );
};
