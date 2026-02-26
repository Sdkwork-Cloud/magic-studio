
import { assetService } from '@sdkwork/react-assets'
import React, { useEffect, useRef, useState } from 'react';
import { useMagicCutStore } from '../store/magicCutStore';
import { MediaResourceType } from '@sdkwork/react-commons';
import { Film, Image as ImageIcon, Music, Sparkles, AlertCircle, Type } from 'lucide-react';
;

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getTypeConfig = (type: MediaResourceType) => {
    switch (type) {
        case MediaResourceType.VIDEO: return { largeIcon: <Film size={24} />, label: 'Video' };
        case MediaResourceType.IMAGE: return { largeIcon: <ImageIcon size={24} />, label: 'Image' };
        case MediaResourceType.AUDIO: 
        case MediaResourceType.MUSIC: 
        case MediaResourceType.VOICE:
        case MediaResourceType.SPEECH: return { largeIcon: <Music size={24} />, label: 'Audio' };
        case MediaResourceType.EFFECT: return { largeIcon: <Sparkles size={24} />, label: 'Effect' };
        case MediaResourceType.TEXT: return { largeIcon: <Type size={24} />, label: 'Text' };
        default: return { largeIcon: <AlertCircle size={24} />, label: 'File' };
    }
};

export const MagicCutDragOverlay: React.FC = () => {
    const { store, useTransientState } = useMagicCutStore();
    const dragOperation = useTransientState(s => s.dragOperation);
    
    const overlayRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    
    const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(null);

    // Resolve Thumbnail on Drag Start
    useEffect(() => {
        if (dragOperation) {
            const item = dragOperation.payload;
            const isAudio = item.type === MediaResourceType.AUDIO || item.type === MediaResourceType.MUSIC || item.type === MediaResourceType.VOICE || item.type === MediaResourceType.SPEECH;
            const isEffect = item.type === MediaResourceType.EFFECT || item.type === MediaResourceType.TRANSITION;
            const isText = item.type === MediaResourceType.TEXT || item.type === MediaResourceType.SUBTITLE;

            if (item.metadata?.thumbnailUrl) {
                // If explicit thumbnail provided
                assetService.resolveAssetUrl({ path: item.metadata.thumbnailUrl }).then(setResolvedThumbnail);
            } else if (!isAudio && !isEffect && !isText) {
                // If visual media, try resolving the main URL/Path
                assetService.resolveAssetUrl(item).then(setResolvedThumbnail);
            } else {
                setResolvedThumbnail(null);
            }
        } else {
            setResolvedThumbnail(null);
        }
    }, [dragOperation?.payload.id]);

    // 1. Handle Position Updates
    useEffect(() => {
        if (!dragOperation) return;

        const handleDragOver = (e: DragEvent) => {
            if (overlayRef.current) {
                const x = e.clientX;
                const y = e.clientY;

                if (rafRef.current) return;

                rafRef.current = requestAnimationFrame(() => {
                    if (overlayRef.current) {
                        overlayRef.current.style.transform = `translate3d(${x + 15}px, ${y + 15}px, 0)`;
                    }
                    rafRef.current = null;
                });
            }
        };

        window.addEventListener('dragover', handleDragOver);
        
        if (overlayRef.current && dragOperation.initialX !== undefined) {
             overlayRef.current.style.transform = `translate3d(${dragOperation.initialX + 15}px, ${dragOperation.initialY! + 15}px, 0)`;
        }
        
        return () => {
            window.removeEventListener('dragover', handleDragOver);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [dragOperation]);

    // 2. Handle Visibility Updates
    useEffect(() => {
        if (!dragOperation) return;

        const checkVisibility = () => {
            const state = store.getState();
            // Hide overlay if user is dragging "over" the timeline grid itself to let Ghost Element take over visuals
            const shouldHide = state.isDragOverTimeline;
                               
            if (overlayRef.current) {
                overlayRef.current.style.display = shouldHide ? 'none' : 'flex';
            }
        };

        checkVisibility();
        const unsubscribe = store.subscribe(checkVisibility);
        
        return () => unsubscribe();
    }, [dragOperation, store]);

    if (!dragOperation) return null;

    const item = dragOperation.payload;
    const typeConfig = getTypeConfig(item.type);
    const isText = item.type === MediaResourceType.TEXT || item.type === MediaResourceType.SUBTITLE;

    // Special Render for Text
    if (isText) {
        const meta = item.metadata || {};
        const textContent = meta.text || item.name;
        const fontFamily = meta.fontFamily || 'sans-serif';
        const color = meta.color || '#ffffff';
        
        return (
            <div 
                ref={overlayRef}
                className="fixed top-0 left-0 z-[9999] bg-[#1e1e1e]/90 backdrop-blur-md rounded-lg overflow-hidden flex flex-col will-change-transform pointer-events-none border border-[#333] shadow-2xl"
                style={{ 
                    display: 'flex',
                    width: 200, 
                    height: 80,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden">
                    {/* Checkered BG */}
                    <div className="absolute inset-0 opacity-10" 
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} 
                    />
                    
                    <span 
                        className="text-lg font-bold truncate max-w-full text-center z-10"
                        style={{ fontFamily, color, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                        {textContent}
                    </span>
                </div>
                <div className="h-6 bg-[#18181b] border-t border-[#333] flex items-center px-2 gap-1.5">
                    <Type size={10} className="text-yellow-500" />
                    <span className="text-[9px] text-gray-400 font-medium truncate">{item.name}</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={overlayRef}
            className="fixed top-0 left-0 z-[9999] bg-[#18181b] rounded-lg overflow-hidden flex-col will-change-transform pointer-events-none border border-[#333]"
            style={{ 
                display: 'flex',
                width: 192, 
                height: 108, 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' 
            }}
        >
            {/* Visual Content */}
            {resolvedThumbnail ? (
                <img src={resolvedThumbnail} className="w-full h-full object-cover" alt="Drag Preview" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#252526]">
                    {typeConfig.largeIcon}
                </div>
            )}
            
            {/* Duration Badge */}
            {(item as any).duration > 0 && (
                 <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono border border-white/10 shadow-sm backdrop-blur-sm">
                     {formatTime((item as any).duration)}
                 </div>
            )}

            {/* Label Overlay */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent">
                 <span className="text-[11px] text-white font-medium truncate block drop-shadow-md">{item.name}</span>
            </div>

            {/* Type Indicator */}
            <div className="absolute bottom-1.5 left-1.5 bg-blue-600/90 text-white p-1 rounded-md shadow-sm backdrop-blur-sm">
                 {React.cloneElement(typeConfig.largeIcon as React.ReactElement<any>, { size: 12, className: 'text-white' })}
            </div>
        </div>
    );
};

