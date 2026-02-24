
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { AnyAsset } from 'sdkwork-react-assets';
import { MediaResourceType } from 'sdkwork-react-commons';
import { Film, Image as ImageIcon, Music, Heart, Sparkles, LayoutTemplate, MoreHorizontal, AlertCircle, Loader2, Upload, Type, Trash2 } from 'lucide-react';
import { assetService } from 'sdkwork-react-assets';
import { useResourceSkimming } from '../../hooks/useResourceSkimming';
import { playerPreviewService } from '../../services';
import { formatTime } from '../../utils/timeUtils';

// Static empty image for drag ghost removal (performance optimized)
const EMPTY_DRAG_IMAGE = new Image();
EMPTY_DRAG_IMAGE.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface SkimmableAssetCardProps {
    item: AnyAsset;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onDragEnd: () => void;
    onDoubleClick?: (item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onHover?: (item: AnyAsset | null) => void;
    onDelete?: (item: AnyAsset) => void;
}

export const SkimmableAssetCard: React.FC<SkimmableAssetCardProps> = React.memo(({ 
    item, onDragStart, onDragEnd, onDoubleClick, onToggleFavorite, onHover, onDelete
}) => {
    const isVideo = item.type === MediaResourceType.VIDEO;
    const isEffect = item.type === MediaResourceType.EFFECT || item.type === MediaResourceType.TRANSITION;
    const isText = item.type === MediaResourceType.TEXT || item.type === MediaResourceType.SUBTITLE;
    
    const isFavorite = !!item.isFavorite; 
    const isAI = item.origin === 'ai';
    const isUpload = item.origin === 'upload';
    
    // Duration fallback logic: metadata.duration -> top level duration -> default
    const effectiveDuration = item.metadata?.duration || (item as any).duration || 0;

    // --- Unified URL State ---
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    // Interaction State
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scrubberLineRef = useRef<HTMLDivElement>(null);
    const scrubberTimeRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // --- 1. Resolution Effect (The Single Source of Truth) ---
    useEffect(() => {
        let isMounted = true;
        
        const resolve = async () => {
            // Effects and Text don't need media URLs usually, just metadata
            if (isEffect || isText) return;

            setIsLoading(true);
            try {
                // A. Resolve Main Media URL (Video/Image)
                // This handles assets://, file://, http://, and hydration of VFS
                const src = await assetService.resolveAssetUrl(item);
                
                // B. Resolve Thumbnail
                // Robustness: Check both legacy `thumbnailUrl` and new VFS `thumbnailPath`
                const thumbPath = item.metadata?.thumbnailPath || item.metadata?.thumbnailUrl;
                let thumb = null;

                if (thumbPath) {
                     // Check if it is a special internal protocol like 'text-preview:'
                     if (thumbPath.startsWith('text-preview:')) {
                         thumb = null; // Handled by text rendering
                     } else {
                         thumb = await assetService.resolveAssetUrl({ path: thumbPath });
                     }
                } else if (!isVideo) {
                     // Use main src as thumb for images if no explicit thumb exists
                     thumb = src;
                }

                if (isMounted) {
                    setResolvedSrc(src);
                    setThumbnailUrl(thumb);
                }
            } catch (e) {
                console.warn("[AssetCard] Failed to resolve asset:", item.id, e);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        resolve();
        return () => { isMounted = false; };
    }, [item.id, item.path, item.url, isEffect, isVideo, isText, item.metadata?.thumbnailPath, item.metadata?.thumbnailUrl]);

    // --- Skimming Hook ---
    const { handleMouseMove: performSkim, handleMouseLeave: stopSkim } = useResourceSkimming({
        resourceId: item.id,
        duration: effectiveDuration,
        containerRef,
        scrubberLineRef,
        scrubberTimeRef,
        videoRef,
        isReady: !!resolvedSrc,
        isEffect,
        isVideo,
        isDragging
    });

    // --- Handlers ---
    
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (onHover) onHover(item);
    }, [onHover, item]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isHovered) setIsHovered(true);
        performSkim(e);
    }, [isHovered, performSkim]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        stopSkim();
        if (!isDragging && onHover) onHover(null);
    }, [isDragging, onHover, stopSkim]);

    const handleDragStartInternal = (e: React.DragEvent) => {
        e.dataTransfer.setDragImage(EMPTY_DRAG_IMAGE, 0, 0);
        if (onHover) onHover(null); 
        playerPreviewService.clearPreview();
        
        setIsHovered(false);
        setIsDragging(true);
        
        onDragStart(e, item);
    };

    const typeConfig = getTypeConfig(item.type);

    // Text Content
    const textContent = isText ? (item.metadata?.text || item.name) : '';
    const textStyle = isText ? {
        fontFamily: item.metadata?.fontFamily || 'sans-serif',
        color: item.metadata?.color || '#ffffff',
        fontSize: '14px',
        lineHeight: 1.2
    } : {};
    
    const canDelete = item.origin !== 'stock' && item.origin !== 'system' && onDelete;

    return (
        <div 
            ref={containerRef}
            draggable
            onDragStart={handleDragStartInternal}
            onDragEnd={() => { setIsDragging(false); onDragEnd(); }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onDoubleClick={() => onDoubleClick && onDoubleClick(item)}
            className={`
                group relative aspect-[16/9] bg-[#0a0a0a] rounded-md overflow-hidden select-none
                transition-all duration-200 border
                ${isDragging ? 'opacity-40 grayscale ring-2 ring-blue-500/50' : ''}
                ${!resolvedSrc && !isEffect && !isText && !error ? 'cursor-wait border-transparent' : 'cursor-grab active:cursor-grabbing border-[#2a2a2c] hover:border-[#444]'}
                ${error ? 'border-red-900/30' : ''}
            `}
            title={item.name}
        >
            {/* Visual Content */}
            {isText ? (
                // Text Preview
                <div className="absolute inset-0 flex items-center justify-center p-2 bg-[#1e1e1e]">
                    <div className="absolute inset-0 opacity-10" 
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} 
                    />
                    <div className="z-10 text-center font-bold truncate max-w-full" style={textStyle}>
                        {textContent}
                    </div>
                </div>
            ) : !resolvedSrc && !isEffect ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#333]">
                    {error ? (
                        <>
                            <AlertCircle size={20} className="text-red-900/50 mb-1" />
                            <span className="text-[9px] text-red-900/50">Load Error</span>
                        </>
                    ) : (
                        <Loader2 size={20} className="animate-spin text-[#333]" />
                    )}
                </div>
            ) : (
                <>
                    {/* Layer 1: Thumbnail / Icon - ADAPTIVE with Blurred Background */}
                    {thumbnailUrl ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
                             {/* Blurred Background for Fill */}
                             <img 
                                src={thumbnailUrl} 
                                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110" 
                                aria-hidden="true"
                             />
                             {/* Actual Thumbnail (Contained) */}
                             <img 
                                src={thumbnailUrl} 
                                className={`relative w-full h-full object-contain z-10 transition-opacity duration-300 ${isHovered && isVideo && resolvedSrc ? 'opacity-0' : 'opacity-100'}`} 
                                alt=""
                                draggable={false}
                                loading="lazy"
                            />
                         </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a] z-10">
                            {/* Fallback Icon if thumb missing */}
                            {typeConfig.largeIcon}
                            {isEffect && <div className="text-[9px] font-bold text-gray-600 mt-2 uppercase tracking-wide">{item.name}</div>}
                        </div>
                    )}

                    {/* Layer 2: Video Preview (Skimming) */}
                    {isVideo && resolvedSrc && (
                        <video 
                            ref={videoRef}
                            src={resolvedSrc}
                            className={`absolute inset-0 w-full h-full object-contain z-10 pointer-events-none transition-opacity duration-200 bg-black ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                            muted
                            playsInline
                            preload="metadata"
                        />
                    )}
                </>
            )}

            {/* Gradient Overlay */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />

            {/* Badges (Top Left) */}
            <div className="absolute top-1 left-1 z-30 flex gap-1 pointer-events-none">
                {isAI && (
                    <div className="bg-purple-600/90 text-white p-0.5 rounded shadow-sm">
                        <Sparkles size={8} />
                    </div>
                )}
                {isUpload && (
                    <div className="bg-blue-600/90 text-white p-0.5 rounded shadow-sm">
                        <Upload size={8} />
                    </div>
                )}
            </div>

            {/* Favorite Button */}
            <div className={`absolute top-1 right-1 z-30 transition-opacity duration-200 ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, !isFavorite); }}
                    className="p-1 text-white/80 hover:text-red-500 hover:scale-110 transition-all"
                >
                    <Heart size={12} fill={isFavorite ? "#ef4444" : "none"} className={isFavorite ? "text-red-500" : "text-white drop-shadow-md"} />
                </button>
            </div>
            
            {/* Delete Button (Top Right, below favorite if exists) */}
            {canDelete && (
                <div className="absolute top-1 right-5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        className="p-1 text-white/80 hover:text-red-400 hover:scale-110 transition-all"
                        title="Delete"
                    >
                        <Trash2 size={12} className="text-white drop-shadow-md hover:text-red-400" />
                    </button>
                </div>
            )}
            
            {/* Scrubber Elements (Direct DOM) */}
            <div 
                ref={scrubberLineRef}
                className="absolute top-0 bottom-0 w-[1px] bg-white/80 shadow-sm z-30 pointer-events-none"
                style={{ left: '0%', display: 'none' }}
            />
            <div 
                ref={scrubberTimeRef}
                className="absolute bottom-6 -translate-x-1/2 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono pointer-events-none border border-white/10 z-30"
                style={{ left: '0%', display: 'none' }}
            >
                0:00
            </div>

            {/* Footer Info */}
            <div className={`absolute bottom-0 left-0 right-0 h-6 flex items-end justify-between px-1.5 pb-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-200 z-20 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <span className="text-[10px] text-gray-200 font-medium truncate max-w-[70%] drop-shadow-md leading-none">{item.name}</span>
                {effectiveDuration > 0 && (
                    <span className="text-[9px] text-gray-300 font-mono drop-shadow-md leading-none bg-black/40 px-1 rounded">
                        {formatTime(effectiveDuration)}
                    </span>
                )}
            </div>
            
            {/* Hover Footer */}
            {isHovered && (
                <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-between px-1.5 bg-black/60 backdrop-blur-sm pointer-events-none border-t border-white/5 z-20">
                     <span className="text-[9px] text-gray-300 truncate max-w-[60%]">{item.name}</span>
                    <MoreHorizontal size={12} className="text-gray-400" />
                </div>
            )}
        </div>
    );
});

const getTypeConfig = (type: MediaResourceType) => {
    switch (type) {
        case MediaResourceType.VIDEO: return { largeIcon: <Film size={16} className="opacity-20" />, label: 'Video' };
        case MediaResourceType.IMAGE: return { largeIcon: <ImageIcon size={16} className="opacity-20" />, label: 'Image' };
        case MediaResourceType.AUDIO: 
        case MediaResourceType.MUSIC: 
        case MediaResourceType.VOICE:
        case MediaResourceType.SPEECH: return { largeIcon: <Music size={16} className="opacity-20" />, label: 'Audio' };
        case MediaResourceType.EFFECT: return { largeIcon: <Sparkles size={24} className="opacity-20 text-purple-400" />, label: 'Effect' };
        case MediaResourceType.TRANSITION: return { largeIcon: <LayoutTemplate size={24} className="opacity-20 text-pink-400" />, label: 'Transition' };
        case MediaResourceType.TEXT: return { largeIcon: <Type size={24} className="opacity-20 text-yellow-400" />, label: 'Text' };
        default: return { largeIcon: <AlertCircle size={16} className="opacity-20" />, label: 'File' };
    }
};

