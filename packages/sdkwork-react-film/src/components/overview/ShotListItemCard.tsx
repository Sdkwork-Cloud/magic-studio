import { FilmShot, useAssetUrl } from '@sdkwork/react-commons'
import React, { useState, useRef, useEffect } from 'react';
import { Clapperboard, Video, Image as ImageIcon, Sparkles, Play, Mic, AlertCircle, Trash2, Edit2, Check, X, Type } from 'lucide-react';
import {
    hasFilmAssetReference,
    resolveFilmAssetUrlByAssetIdFirst,
    toFilmUseAssetSource
} from '../../utils/filmAssetUrlResolver';

export interface ShotListItemCardProps {
    shot: FilmShot;
    onClick: () => void;
    onGenerate: () => void;
    onDelete?: () => void;
    onUpdatePrompt?: (shotId: string, prompt: string) => void;
}

export const ShotListItemCard: React.FC<ShotListItemCardProps> = ({ 
    shot, 
    onClick, 
    onGenerate, 
    onDelete,
    onUpdatePrompt 
}) => {
    const [showActions, setShowActions] = useState(false);
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const initialPrompt = shot.generation?.prompt || shot.description || '';
    const [promptText, setPromptText] = useState(typeof initialPrompt === 'string' ? initialPrompt : String(initialPrompt || ''));
    const promptInputRef = useRef<HTMLTextAreaElement>(null);
    
    const hasVideo = hasFilmAssetReference(shot.generation?.video || null);
    const primaryImageAsset =
        shot.assets?.find((asset) => hasFilmAssetReference(asset)) ?? null;
    const hasImage = !!primaryImageAsset;
    const hasAudio = !!(shot.dialogue?.items && shot.dialogue.items.length > 0);
    const isGenerating = shot.generation?.status === 'GENERATING';
    const isError = shot.generation?.status === 'FAILED';

    const previewSource = hasVideo
        ? shot.generation?.video || null
        : primaryImageAsset;
    const { url: displayUrl } = useAssetUrl(toFilmUseAssetSource(previewSource), {
        resolver: resolveFilmAssetUrlByAssetIdFirst
    });

    // 获取对话文本
    const dialogueText = shot.dialogue?.items?.map(item => item.text).join(' ') || '';
    // Auto focus prompt input when entering edit mode.
    useEffect(() => {
        if (isEditingPrompt && promptInputRef.current) {
            promptInputRef.current.focus();
            promptInputRef.current.select();
        }
    }, [isEditingPrompt]);

    const handleSavePrompt = () => {
        if (onUpdatePrompt && promptText !== (shot.generation?.prompt || shot.description)) {
            onUpdatePrompt(shot.uuid, promptText);
        }
        setIsEditingPrompt(false);
    };

    const handleCancelEdit = () => {
        const rawPrompt = shot.generation?.prompt || shot.description || '';
        setPromptText(typeof rawPrompt === 'string' ? rawPrompt : String(rawPrompt || ''));
        setIsEditingPrompt(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSavePrompt();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };
    // Normalize display prompt to string.
    const rawPrompt = shot.generation?.prompt || shot.description || '';
    const displayPrompt = typeof rawPrompt === 'string' ? rawPrompt : String(rawPrompt || '');

    return (
        <div
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className="group flex items-start gap-5 p-5 bg-[#121214] border border-[#27272a] rounded-xl hover:border-[#3f3f46] hover:bg-[#1a1a1c] transition-all duration-200 cursor-pointer"
            onClick={() => !isEditingPrompt && onClick()}
        >
            {/* Thumbnail - Larger size */}
            <div className="relative w-36 h-24 rounded-lg overflow-hidden bg-[#0a0a0a] shrink-0 mt-0.5">
                {displayUrl ? (
                    <>
                        {hasVideo ? (
                            <video src={displayUrl} className="w-full h-full object-cover" muted />
                        ) : (
                            <img src={displayUrl} className="w-full h-full object-cover" alt="Shot" />
                        )}
                        {hasVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play size={18} fill="white" className="text-white" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {isGenerating ? (
                            <Sparkles size={24} className="text-purple-500 animate-pulse" />
                        ) : isError ? (
                            <AlertCircle size={24} className="text-red-500" />
                        ) : (
                            <Clapperboard size={24} className="text-gray-600" />
                        )}
                    </div>
                )}

                {/* Shot Number Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-bold text-gray-300">
                    #{shot.index}
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-mono text-gray-300">
                    {shot.duration}s
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-1">
                {/* Top Row: Description */}
                <p className="text-sm text-gray-200 line-clamp-2 mb-3 leading-relaxed">
                    {shot.description || <span className="italic text-gray-500">No visual description</span>}
                </p>

                {/* Prompt Section - Editable */}
                <div className="mb-3">
                    {isEditingPrompt ? (
                        <div 
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Type size={12} className="text-blue-400" />
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Generation Prompt</span>
                            </div>
                            <textarea
                                ref={promptInputRef}
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-[#0a0a0a] border border-blue-500/30 rounded-lg px-3 py-2.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none min-h-[60px]"
                                placeholder="Enter generation prompt..."
                                rows={2}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-gray-600">Cmd+Enter to save, Esc to cancel</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#27272a] rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                    <button
                                        onClick={handleSavePrompt}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <Check size={12} />
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="group/prompt"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingPrompt(true);
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <Type size={12} className="text-gray-600 group-hover/prompt:text-blue-400 transition-colors" />
                                <span className="text-[10px] text-gray-600 group-hover/prompt:text-gray-400 uppercase tracking-wider font-medium transition-colors">Generation Prompt</span>
                                <Edit2 size={10} className="text-gray-600 opacity-0 group-hover/prompt:opacity-100 transition-opacity" />
                            </div>
                            {displayPrompt ? (
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed group-hover/prompt:text-gray-300 transition-colors">
                                    {displayPrompt}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-600 italic flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                    Click to add generation prompt
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Row: Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    {/* Status Indicators */}
                    <div className="flex items-center gap-2">
                        <StatusBadge active={hasImage} icon={ImageIcon} label="Image" color="text-purple-400" />
                        <StatusBadge active={hasVideo} icon={Video} label="Video" color="text-pink-400" />
                        <StatusBadge active={hasAudio} icon={Mic} label="Audio" color="text-orange-400" />
                    </div>

                    {/* Dialogue Preview */}
                    {hasAudio && dialogueText && (
                        <div className="flex items-center gap-1.5 text-gray-400 truncate max-w-[250px]">
                            <Mic size={12} />
                            <span className="truncate italic">"{dialogueText.slice(0, 50)}{dialogueText.length > 50 ? '...' : ''}"</span>
                        </div>
                    )}

                    {/* Generation Status */}
                    {isGenerating && (
                        <span className="text-purple-400 flex items-center gap-1.5">
                            <Sparkles size={12} className="animate-pulse" />
                            Generating...
                        </span>
                    )}
                    {isError && (
                        <span className="text-red-400 flex items-center gap-1.5">
                            <AlertCircle size={12} />
                            Failed
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className={`
                flex flex-col items-end gap-2 transition-all duration-200 pt-1
                ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
            `}>
                <div className="flex items-center gap-1.5">
                    {!hasImage && !isGenerating && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Generate Image"
                        >
                            <ImageIcon size={16} />
                        </button>
                    )}

                    {!hasVideo && hasImage && !isGenerating && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                            className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                            title="Generate Video"
                        >
                            <Video size={16} />
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
                        title="Edit Shot"
                    >
                        <Edit2 size={16} />
                    </button>

                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Shot"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

function StatusBadge({ active, icon: Icon, label, color }: {
    active: boolean;
    icon: React.ElementType;
    label: string;
    color: string;
}) {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${active ? 'bg-[#27272a]' : ''}`}>
            <Icon size={12} className={active ? color : 'text-gray-600'} />
            <span className={active ? color : 'text-gray-600'}>{label}</span>
        </div>
    );
}

