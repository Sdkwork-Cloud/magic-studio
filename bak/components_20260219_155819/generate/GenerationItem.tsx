
import React, { useState, useRef } from 'react';
import { 
    Trash2, Copy, Repeat2, Check, Maximize2, Play, Image as ImageIcon, Film, Mic, Music, Volume2, Box, Save
} from 'lucide-react';
import { ImageTask, GeneratedResult, MediaType } from '../../modules/image/entities/image.entity';
import { platform } from 'sdkwork-react-core';
import { PromptText } from './PromptText';
import { assetService } from '../../modules/assets/services/assetService';
import { AssetType } from '../../modules/assets/entities/asset.entity';
import { useAssetUrl } from '../../hooks/useAssetUrl';

interface GenerationItemProps {
    task: ImageTask;
    onDelete: (id: string) => void;
    onReuse: (task: ImageTask) => void;
    onDownload: (url: string, id: string, index: number) => void;
    onPreview: (url: string, type: MediaType) => void;
    onSelect?: (url: string) => void;
    selectedItems?: string[]; // New prop for checking selection state
}

export const GenerationItem: React.FC<GenerationItemProps> = ({ 
    task, onDelete, onReuse, onPreview, onSelect, selectedItems = [] 
}) => {
    const results = task.results || [];
    const mediaType = task.config.mediaType || 'image';
    const aspectRatio = task.config.aspectRatio || '1:1';
    const [isSaving, setIsSaving] = useState(false);

    const handleCopyPrompt = () => {
        platform.copy(task.config.prompt);
    };

    const handleMediaClick = (url: string) => {
        if (onSelect) {
            onSelect(url);
        } else {
            onPreview(url, mediaType);
        }
    };

    const handleSaveToAssets = async () => {
        if (results.length === 0 || isSaving) return;
        setIsSaving(true);
        try {
            // Map generation media type to asset type
            let assetType: AssetType = 'image';
            if (mediaType === 'video') assetType = 'video';
            if (mediaType === 'audio' || mediaType === 'music' || mediaType === 'voice' || mediaType === 'speech') assetType = 'audio';

            for (let i = 0; i < results.length; i++) {
                const res = results[i];
                // Handle different URL types (Data URI vs Remote)
                // For Data URI, we can save directly. For Remote, we fetch first.
                // assetService.saveGeneratedAsset handles both.
                const name = `${mediaType}_gen_${Date.now()}_${i+1}`;
                await assetService.saveGeneratedAsset(res.url, assetType, {}, name, 'ai');
            }
            await platform.notify('Saved', `${results.length} assets saved to library.`);
        } catch (e) {
            console.error("Failed to save asset", e);
            await platform.notify('Error', 'Failed to save to assets.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`
            group relative bg-[#18181b] border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl
            ${onSelect ? 'border-blue-500/20 hover:border-blue-500 cursor-default' : 'border-[#27272a] hover:border-[#3f3f46]'}
        `}>
            {/* 1. Header: Prompt & Meta */}
            <div className="p-3 border-b border-[#222]">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                             <MediaTypeBadge type={mediaType} />
                             <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(task.createdAt).toLocaleString()}
                             </span>
                             <span className="text-[10px] text-gray-600 border border-[#333] px-1.5 py-0.5 rounded uppercase font-medium bg-[#111]">
                                {task.config.aspectRatio}
                             </span>
                             {/* Single Model Label (if not multi) */}
                             {!task.config.useMultiModel && task.config.model && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Box size={10} /> {task.config.model}
                                </span>
                             )}
                        </div>
                        <PromptText 
                            text={task.config.prompt} 
                            className="mt-1 border-0 bg-transparent p-0"
                            style={{ padding: 0 }}
                            compact={true}
                            maxLines={2}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Media Content Area */}
            <div className="p-3 bg-[#101010] flex justify-start">
                {task.status === 'pending' ? (
                    <div className="w-full h-32 bg-[#111] rounded-lg border border-[#27272a] border-dashed flex flex-col items-center justify-center text-purple-400 gap-3">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium animate-pulse">Generating...</span>
                    </div>
                ) : task.status === 'failed' ? (
                    <div className="w-full h-24 bg-red-900/10 border border-red-900/30 rounded-lg flex items-center justify-center text-red-400 gap-2">
                         <span className="text-xs">{task.error || 'Generation failed'}</span>
                    </div>
                ) : (
                    <MediaGrid 
                        results={results} 
                        type={mediaType} 
                        aspectRatio={aspectRatio}
                        onClick={handleMediaClick}
                        selectionMode={!!onSelect}
                        selectedItems={selectedItems}
                    />
                )}
            </div>

            {/* 3. Action Footer */}
            <div className="px-3 py-2 flex items-center justify-between gap-2 bg-[#18181b] border-t border-[#27272a]">
                <div className="flex items-center gap-2">
                    <button onClick={() => onReuse(task)} className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors px-2 py-1 hover:bg-[#252526] rounded">
                        <Repeat2 size={12} /> Regenerate
                    </button>
                    {task.status === 'completed' && (
                         <button 
                            onClick={handleSaveToAssets} 
                            disabled={isSaving}
                            className={`text-xs flex items-center gap-1.5 transition-colors px-2 py-1 rounded ${isSaving ? 'text-green-600' : 'text-gray-500 hover:text-green-400 hover:bg-[#252526]'}`}
                        >
                            {isSaving ? <Check size={12} /> : <Save size={12} />} 
                            {isSaving ? 'Saved' : 'Save to Assets'}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                     <button onClick={handleCopyPrompt} className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2d2d2d] rounded transition-colors" title="Copy Prompt">
                        <Copy size={13} />
                     </button>
                     <div className="w-[1px] h-3 bg-[#333] mx-1" />
                     <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2d2d2d] rounded transition-colors" title="Delete">
                        <Trash2 size={13} />
                     </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const MediaTypeBadge: React.FC<{ type: MediaType }> = ({ type }) => {
    const config = {
        image: { icon: ImageIcon, label: 'Image', color: 'text-purple-400' },
        video: { icon: Film, label: 'Video', color: 'text-pink-400' },
        audio: { icon: Mic, label: 'Audio', color: 'text-orange-400' },
        voice: { icon: Mic, label: 'Voice', color: 'text-green-400' },
        music: { icon: Music, label: 'Music', color: 'text-indigo-400' },
        speech: { icon: Volume2, label: 'Speech', color: 'text-teal-400' },
    }[type] || { icon: ImageIcon, label: 'Media', color: 'text-gray-400' };

    const Icon = config.icon;
    return (
        <div className={`flex items-center gap-1 ${config.color} bg-[#252526] px-1.5 py-0.5 rounded border border-[#333]`}>
            <Icon size={10} />
            <span className="text-[9px] font-bold uppercase">{config.label}</span>
        </div>
    );
};

// Extracted for hooks usage
const VideoThumbnail: React.FC<{ result: GeneratedResult, isSelected: boolean, onClick: (url: string) => void }> = ({ result, isSelected, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { url: videoSrc } = useAssetUrl(result.url);
    const { url: posterSrc } = useAssetUrl(result.posterUrl);

    const handleMouseEnter = () => {
        if (videoRef.current && videoSrc) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div 
            className="w-full h-full relative cursor-pointer group/video bg-black rounded-lg overflow-hidden border border-[#333] hover:border-[#555] transition-colors"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(result.url)}
        >
            {/* Explicit Poster Image when NOT playing */}
            {posterSrc && !isPlaying && (
                <img 
                    src={posterSrc} 
                    className="absolute inset-0 w-full h-full object-contain z-10" 
                    alt="Video Thumbnail"
                />
            )}

            {videoSrc && (
                <video 
                    ref={videoRef}
                    src={videoSrc} 
                    className="w-full h-full object-contain relative z-0"
                    muted 
                    loop
                    playsInline 
                />
            )}
            
            {/* Play Icon Overlay (Shows when NOT playing) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-transparent transition-colors z-20">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 shadow-lg transition-transform group-hover/video:scale-110">
                        <Play size={12} fill="currentColor" className="ml-0.5" />
                    </div>
                </div>
            )}

            {/* Model Badge */}
            {result.modelId && (
                 <div className="absolute top-2 left-2 pointer-events-none z-20">
                     <span className="bg-black/60 text-white/80 text-[8px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-sm font-mono truncate max-w-[80px] block">
                         {result.modelId}
                     </span>
                </div>
            )}

            {/* Duration/Status Badges */}
            <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover/video:opacity-100 transition-opacity z-20">
                 <span className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                     {isPlaying ? 'PREVIEW' : 'VIDEO'}
                 </span>
            </div>

            {/* Selection Overlay */}
            <div className={`
                absolute inset-0 transition-all duration-200 flex items-center justify-center pointer-events-none z-30
                ${isSelected ? 'bg-pink-500/20 ring-2 ring-pink-500' : ''}
            `}>
                 {isSelected && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white p-1 rounded-full shadow-sm">
                        <Check size={10} strokeWidth={3} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Extracted for hooks usage
const ImageThumbnail: React.FC<{ result: GeneratedResult, isSelected: boolean, itemStyle: any, onClick: (url: string) => void }> = ({ result, isSelected, itemStyle, onClick }) => {
    const { url: displayUrl } = useAssetUrl(result.url);

    return (
        <div 
            className={`
                relative rounded-lg overflow-hidden border transition-all cursor-pointer group/image bg-black
                ${isSelected ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-[#333] hover:border-gray-500'}
            `}
            style={itemStyle}
            onClick={() => onClick(result.url)}
        >
            {displayUrl && <img src={displayUrl} className="w-full h-full object-contain" loading="lazy" />}
            
            {/* Model Badge */}
            {result.modelId && (
                <div className="absolute bottom-2 left-2 z-10">
                     <span className="bg-black/50 text-white/90 text-[8px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/5 font-medium shadow-sm">
                         {result.modelId}
                     </span>
                </div>
            )}

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                 <div className="bg-black/50 p-1.5 rounded-full text-white backdrop-blur-sm">
                     <Maximize2 size={16} />
                 </div>
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full shadow-sm z-10">
                    <Check size={10} strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

const AudioThumbnail: React.FC<{ result: GeneratedResult, isSelected: boolean, onClick: (url: string) => void }> = ({ result, isSelected, onClick }) => {
    return (
        <div 
            className={`
                w-full h-12 px-3 flex items-center gap-3 bg-[#1e1e1e] border rounded-lg cursor-pointer transition-colors
                ${isSelected ? 'border-orange-500 bg-orange-900/10' : 'border-[#333] hover:bg-[#252526] hover:border-[#444]'}
            `}
            onClick={() => onClick(result.url)}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-300 ${isSelected ? 'bg-orange-500 text-white' : 'bg-[#2a2a2c]'}`}>
                {isSelected ? <Check size={14} /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </div>
            <div className="flex-1 h-1 bg-[#333] rounded-full overflow-hidden">
                 <div className="h-full bg-gray-500 w-1/3" />
            </div>
            {result.modelId && (
                 <span className="text-[9px] text-gray-500 font-mono bg-[#252526] px-1.5 py-0.5 rounded">
                     {result.modelId}
                 </span>
            )}
        </div>
    );
};

const MediaGrid: React.FC<{ 
    results: GeneratedResult[], 
    type: MediaType,
    aspectRatio: string,
    onClick: (url: string) => void,
    selectionMode: boolean,
    selectedItems: string[]
}> = ({ results, type, aspectRatio, onClick, selectionMode, selectedItems }) => {
    const count = results.length;
    if (count === 0) return null;

    // Parse Ratio
    const [rw, rh] = aspectRatio.split(':').map(Number);
    const isPortrait = rh > rw;
    
    // Layout Constraint Logic
    let gridClass = 'grid-cols-2';
    let containerStyle: React.CSSProperties = { width: '100%' };

    if (count === 1) {
        gridClass = 'grid-cols-1';
        if (type === 'video' || type === 'image') {
            if (isPortrait) containerStyle = { maxWidth: '260px' };
            else if (rw === rh) containerStyle = { maxWidth: '320px' }; // Square
            else containerStyle = { maxWidth: '440px' }; // Landscape
        } else {
            containerStyle = { width: '100%' }; // Audio stretches
        }
    } else if (count === 2) {
        gridClass = 'grid-cols-2';
        containerStyle = { maxWidth: '600px' };
    } else if (count === 3) {
        gridClass = 'grid-cols-3';
        containerStyle = { maxWidth: '800px' };
    } else {
        gridClass = 'grid-cols-2'; // 4 items -> 2x2
        containerStyle = { maxWidth: '500px' };
    }

    // Aspect Style for Items
    const itemStyle = { 
        aspectRatio: `${rw}/${rh}` 
    };

    return (
        <div className={`grid ${gridClass} gap-2`} style={containerStyle}>
            {results.map((res) => {
                const isSelected = selectedItems.includes(res.url);

                if (type === 'video') {
                     return (
                         <div key={res.id} style={itemStyle}>
                             <VideoThumbnail result={res} isSelected={isSelected} onClick={onClick} />
                         </div>
                     );
                }
                
                if (type === 'image') {
                    return (
                        <ImageThumbnail 
                            key={res.id}
                            result={res} 
                            isSelected={isSelected} 
                            itemStyle={itemStyle} 
                            onClick={onClick} 
                        />
                    );
                }

                // Audio / Other
                return (
                    <AudioThumbnail 
                        key={res.id}
                        result={res}
                        isSelected={isSelected}
                        onClick={onClick}
                    />
                );
            })}
        </div>
    );
};
