
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Video, Mic, Layers, Lock, Unlock, Eye, EyeOff, Volume2, VolumeX, Type, Sparkles, Image as ImageIcon, Trash2, Upload, Loader2, X, GripVertical } from 'lucide-react';
import { CutTrack } from '../../entities/magicCut.entity';
import { useMagicCutStore } from '../../store/magicCutStore';
import { uploadHelper } from '../../../../modules/drive/utils/uploadHelper';
import { thumbnailGenerator } from '../../../../services/media/thumbnailGenerator';
import { MediaResourceType } from '../../../../types';
import { platform } from '../../../../platform';
import { Confirm } from '../../../../components/Confirm';
import { useConfirm } from '../../../../components/Confirm';
import { downloadService } from '../../../../services/media/downloadService';
import { assetService } from '../../../assets/services/assetService';

interface MagicCutTrackHeaderProps {
    track: CutTrack;
    height: number;
}

// Helper: Analyze image brightness
const analyzeFrameBrightness = (url: string): Promise<number> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(0);

            try {
                ctx.drawImage(img, 0, 0, 50, 50);
                const imageData = ctx.getImageData(0, 0, 50, 50);
                const data = imageData.data;
                let brightnessSum = 0;

                for (let i = 0; i < data.length; i += 16) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    brightnessSum += (r * 0.299 + g * 0.587 + b * 0.114);
                }

                const pixelCount = data.length / 16;
                const avg = brightnessSum / pixelCount;
                resolve(avg);
            } catch (e) {
                // Canvas tainted (CORS error), assume valid brightness to avoid skipping good frames
                console.warn("[MagicCut] Canvas tainted during analysis, skipping brightness check.");
                resolve(100);
            }
        };
        img.onerror = () => resolve(0);
    });
};

interface ControlBtnProps {
    active: boolean;
    activeIcon: React.ComponentType<{ size: number }>;
    inactiveIcon: React.ComponentType<{ size: number }>;
    onClick: () => void;
    activeClass: string;
    inactiveClass: string;
    title?: string;
}

const ControlBtn = ({ active, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon, onClick, activeClass, inactiveClass, title }: ControlBtnProps) => (
    <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center hover:bg-white/5 ${active ? activeClass : inactiveClass}`}
        title={title}
    >
        {active ? <ActiveIcon size={14} /> : <InactiveIcon size={14} />}
    </button>
);

export const MagicCutTrackHeader: React.FC<MagicCutTrackHeaderProps> = React.memo(({
    track, height
}) => {
    const { resizeTrack, updateTrack, removeTrack, selectedTrackId, selectTrack, state, getResource } = useMagicCutStore();

    const [isResizing, setIsResizing] = useState(false);
    const [coverMenuPos, setCoverMenuPos] = useState<{ x: number, y: number } | null>(null);
    const [candidateFrames, setCandidateFrames] = useState<string[]>([]);
    const [isLoadingFrames, setIsLoadingFrames] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    // Confirm dialog state
    const { isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel, confirm } = useConfirm();

    useEffect(() => {
        if (coverMenuPos) {
            const handleClickOutside = (e: MouseEvent) => {
                if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
                    setCoverMenuPos(null);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [coverMenuPos]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            resizeTrack(track.id, height + e.movementY);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ns-resize';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, height, track.id, resizeTrack]);

    const getTrackIcon = () => {
        switch (track.type) {
            case 'video': return <Video size={14} />;
            case 'audio': return <Mic size={14} />;
            case 'text': return <Type size={14} />;
            case 'effect': return <Sparkles size={14} />;
            case 'ai': return <ImageIcon size={14} />;
            default: return <Layers size={14} />;
        }
    };

    const getTypeColorClass = () => {
        if (track.isMain) return 'text-blue-400 bg-blue-500/5 border-l-blue-500';
        switch (track.type) {
            case 'video': return 'text-cyan-400 bg-cyan-500/5 border-l-cyan-500';
            case 'audio': return 'text-emerald-400 bg-emerald-500/5 border-l-emerald-500';
            case 'text': return 'text-yellow-400 bg-yellow-500/5 border-l-yellow-500';
            case 'effect': return 'text-purple-400 bg-purple-500/5 border-l-purple-500';
            default: return 'text-gray-400 bg-gray-500/5 border-l-gray-500';
        }
    };

    const generateTrackKeyframes = async () => {
        setIsLoadingFrames(true);
        setCandidateFrames([]);

        // 1. Filter and Sort Clips
        const trackClips = track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .filter(c => {
                const r = getResource(c.resource.id);
                return r && (r.type === MediaResourceType.VIDEO || r.type === MediaResourceType.IMAGE);
            })
            .sort((a, b) => a.start - b.start);

        if (trackClips.length === 0) {
            setIsLoadingFrames(false);
            return;
        }

        // 2. Map "Content Time" to specific Clips to enable uniform sampling across the track
        let totalContentDuration = 0;
        const mappedClips = trackClips.map(clip => {
            const start = totalContentDuration;
            totalContentDuration += clip.duration;
            return { clip, contentStart: start, contentEnd: totalContentDuration };
        });

        // 3. Create Sampling Points
        const TARGET_CANDIDATES = 12;
        const tasks: { clip: typeof trackClips[0], time: number }[] = [];
        const step = Math.max(1, totalContentDuration / TARGET_CANDIDATES);

        for (let i = 0; i < TARGET_CANDIDATES; i++) {
            // Sample from middle of step segment to avoid edge transitions
            const t = Math.min(totalContentDuration - 0.1, (i * step) + (step * 0.5));

            const match = mappedClips.find(m => t >= m.contentStart && t < m.contentEnd);
            if (match) {
                const timeInClip = t - match.contentStart;
                const resourceTime = (match.clip.offset || 0) + timeInClip;
                tasks.push({ clip: match.clip, time: resourceTime });
            }
        }

        // 4. Resolve URLs and Extract (Parallelize resource resolution)
        const extractionPromises = tasks.map(async (task) => {
            const resource = getResource(task.clip.resource.id);
            if (!resource) return null;

            // Ensure ready
            await downloadService.hydrateState(resource);
            const url = await assetService.resolveAssetUrl(resource);
            if (!url) return null;

            return {
                url,
                time: task.time,
                isVideo: resource.type === MediaResourceType.VIDEO
            };
        });

        const resolvedTasks = (await Promise.all(extractionPromises)).filter(Boolean) as { url: string, time: number, isVideo: boolean }[];

        // 5. Extract Frames sequentially (Thumbnail generator handles concurrency internally if needed, but we limit here)
        const validFrames: string[] = [];

        for (const task of resolvedTasks) {
            if (validFrames.length >= 9) break;

            let blobUrl = task.url; // Default to full url for images

            if (task.isVideo) {
                try {
                    const blob = await thumbnailGenerator.extractVideoFrame(task.url, task.time, 0.6, 200);
                    if (blob) {
                        blobUrl = URL.createObjectURL(blob);
                    } else {
                        continue;
                    }
                } catch (e) { continue; }
            }

            // Brightness check to avoid black frames
            const brightness = await analyzeFrameBrightness(blobUrl);
            if (brightness > 15) { // Skip extremely dark frames
                validFrames.push(blobUrl);
            } else {
                // If generated blob (video frame), revoke it to save memory
                if (blobUrl !== task.url) URL.revokeObjectURL(blobUrl);
            }
        }

        setCandidateFrames(validFrames);
        setIsLoadingFrames(false);
    };

    const handleOpenCoverSelector = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (coverMenuPos) {
            setCoverMenuPos(null);
            return;
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setCoverMenuPos({ x: rect.right + 8, y: rect.top });
        generateTrackKeyframes();
    };

    const handleSelectCover = (url: string) => {
        updateTrack(track.id, { coverImage: url });
        setCoverMenuPos(null);
    };

    const handleUploadCover = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const files = await uploadHelper.pickFiles(false, 'image/*');
            if (files.length > 0) {
                const file = files[0];
                const blob = new Blob([new Uint8Array(file.data)]);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    updateTrack(track.id, { coverImage: base64 });
                    setCoverMenuPos(null);
                };
                reader.readAsDataURL(blob);
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteTrack = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const confirmed = await confirm({
            title: 'Delete Track?',
            message: `Are you sure you want to delete "${track.name}"? This will also remove all clips inside this track. This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            removeTrack(track.id);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('magic-cut/track-id', track.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const isVisual = track.type !== 'audio';
    const isMain = track.isMain;
    const canHaveVolume = track.type === 'video' || track.type === 'audio';
    const isSelected = selectedTrackId === track.id;

    const baseClasses = `
        border-b border-[#27272a] bg-[#09090b] 
        transition-all duration-200 select-none group relative box-border flex items-center
        border-l-[4px] ${track.locked ? 'bg-[repeating-linear-gradient(45deg,#0e0e0e,#0e0e0e_10px,#141414_10px,#141414_20px)]' : 'hover:bg-[#111]'}
        ${getTypeColorClass().split(' ').pop()} 
        ${isSelected ? 'bg-[#18181b] border-l-4' : ''}
    `;

    return (
        <div
            className={baseClasses}
            style={{ height }}
            data-track-header-id={track.id}
            draggable
            onDragStart={handleDragStart}
            onClick={() => selectTrack(track.id)}
        >
            {/* 1. Drag Handle (Visual Grip) */}
            <div className="w-4 h-full flex-none flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={12} />
            </div>

            {/* 2. Icon Section */}
            <div
                className={`w-8 h-8 rounded-lg flex-none flex items-center justify-center mr-2 shadow-sm border border-white/5 ${getTypeColorClass().split(' ').slice(0, 2).join(' ')}`}
                title={`${track.type.toUpperCase()} Track`}
            >
                {getTrackIcon()}
            </div>

            {/* 3. Controls & Name Section - Centered */}
            <div className="flex-1 flex flex-col justify-center min-w-0 h-full py-1">
                <div className="text-[11px] font-bold text-gray-300 truncate mb-1 leading-none">{track.name}</div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <ControlBtn
                        active={track.locked}
                        activeIcon={Lock} inactiveIcon={Unlock}
                        onClick={() => updateTrack(track.id, { locked: !track.locked })}
                        activeClass="text-red-500 bg-red-500/10"
                        inactiveClass="text-gray-500 hover:text-gray-300"
                        title={track.locked ? "Unlock Track" : "Lock Track"}
                    />
                    {isVisual && (
                        <ControlBtn
                            active={!track.visible}
                            activeIcon={EyeOff} inactiveIcon={Eye}
                            onClick={() => updateTrack(track.id, { visible: !track.visible })}
                            activeClass="text-gray-400 bg-gray-500/20"
                            inactiveClass="text-gray-500 hover:text-white"
                            title={!track.visible ? "Show Track" : "Hide Track"}
                        />
                    )}
                    {(canHaveVolume) && (
                        <ControlBtn
                            active={track.muted}
                            activeIcon={VolumeX} inactiveIcon={Volume2}
                            onClick={() => updateTrack(track.id, { muted: !track.muted })}
                            activeClass="text-orange-500 bg-orange-500/10"
                            inactiveClass="text-gray-500 hover:text-white"
                            title={track.muted ? "Unmute Track" : "Mute Track"}
                        />
                    )}
                </div>
            </div>

            {/* 4. Right Section: Cover Upload & Delete */}
            <div className="h-full flex-none flex items-center justify-center px-2 gap-2 relative">
                {isMain && (
                    <div
                        onClick={handleOpenCoverSelector}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`
                            w-10 h-10 rounded-md cursor-pointer overflow-hidden relative group/cover flex items-center justify-center transition-all
                            ${track.coverImage ? 'bg-black border-0' : 'bg-[#18181b] border border-dashed border-[#444] hover:border-gray-400'}
                        `}
                        title="Change Cover"
                    >
                        {track.coverImage ? (
                            <>
                                <img src={track.coverImage} className="w-full h-full object-cover" alt="Cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[8px] text-white font-medium">Edit</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-[9px] font-medium text-gray-500 group-hover/cover:text-gray-300 transform scale-90">Cover</span>
                        )}
                    </div>
                )}

                {!isMain && (
                    <button
                        onClick={handleDeleteTrack}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-md"
                        title="Delete Track"
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    >
                        <Trash2 size={13} />
                    </button>
                )}

                {/* Cover Selector Popover */}
                {coverMenuPos && createPortal(
                    <div
                        ref={selectorRef}
                        className="fixed w-64 bg-[#18181b] border border-[#333] rounded-xl shadow-2xl z-[9999] animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col"
                        style={{ top: Math.min(coverMenuPos.y, window.innerHeight - 300), left: coverMenuPos.x }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <div className="px-3 py-2 border-b border-[#333] flex justify-between items-center bg-[#1e1e1e]">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set Cover</span>
                            <button onClick={() => setCoverMenuPos(null)} className="text-gray-500 hover:text-white"><X size={12} /></button>
                        </div>

                        <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <button
                                onClick={handleUploadCover}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#252526] hover:bg-[#2a2a2d] text-xs text-gray-300 transition-colors border border-transparent hover:border-[#444] font-medium"
                            >
                                <Upload size={12} /> Upload Custom
                            </button>

                            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-1 pt-1 border-t border-[#333] mt-1">From Track Clips</div>

                            {isLoadingFrames ? (
                                <div className="flex justify-center py-6 text-gray-500 flex-col items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                    <span className="text-[10px]">Scanning content...</span>
                                </div>
                            ) : candidateFrames.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {candidateFrames.map((frame, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectCover(frame)}
                                            className="aspect-video rounded overflow-hidden border border-[#333] hover:border-blue-500 transition-all hover:scale-105 bg-black relative group/frame"
                                        >
                                            <img src={frame} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-[10px] text-gray-500 bg-[#1e1e1e] rounded-lg border border-[#333] border-dashed">
                                    No suitable frames found.
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {/* Resize Handle */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/50 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); }}
            />

            {/* Confirm Dialog */}
            {isConfirmOpen && confirmOptions && (
                <Confirm
                    isOpen={isConfirmOpen}
                    {...confirmOptions}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
});
