
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Video, Mic, Layers, Lock, Unlock, Eye, EyeOff, Volume2, VolumeX, Type, Sparkles, Image as ImageIcon, Trash2, Upload, Loader2, X, GripVertical, Captions } from 'lucide-react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { uploadHelper } from '@sdkwork/react-core';
import { CutTrack } from '../../entities/magicCut.entity';
import { thumbnailGenerator } from '@sdkwork/react-core';
import { downloadService } from '@sdkwork/react-core';
import { Confirm, useConfirm } from '@sdkwork/react-commons';
import { MediaResourceType } from '@sdkwork/react-commons';
import { resolveAssetUrlByAssetIdFirst } from '../../utils/assetUrlResolver';
import {
    importMagicCutTrackCoverFile,
    importMagicCutTrackCoverFromUrl,
} from '../../utils/magicCutTrackCoverImport';
import { useMagicCutTranslation } from '../../hooks/useMagicCutTranslation';

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
            } catch {
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
        className={`app-toolbar-button flex items-center justify-center rounded-lg p-1.5 transition-all ${active ? activeClass : inactiveClass}`}
        data-active={active ? 'true' : 'false'}
        title={title}
    >
        {active ? <ActiveIcon size={14} /> : <InactiveIcon size={14} />}
    </button>
);

export const MagicCutTrackHeader: React.FC<MagicCutTrackHeaderProps> = React.memo(({
    track, height
}) => {
    const { t, tl } = useMagicCutTranslation();
    const { resizeTrack, updateTrack, removeTrack, selectedTrackId, selectTrack, state, getResource } = useMagicCutStore();

    const [isResizing, setIsResizing] = useState(false);
    const [coverMenuPos, setCoverMenuPos] = useState<{ x: number, y: number } | null>(null);
    const [candidateFrames, setCandidateFrames] = useState<string[]>([]);
    const [isLoadingFrames, setIsLoadingFrames] = useState(false);
    const [isSavingCover, setIsSavingCover] = useState(false);
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
        return () => {
            candidateFrames.forEach((frame) => {
                if (frame.startsWith('blob:')) {
                    URL.revokeObjectURL(frame);
                }
            });
        };
    }, [candidateFrames]);

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
        switch (track.trackType) {
            case 'video': return <Video size={14} />;
            case 'audio': return <Mic size={14} />;
            case 'text': return <Type size={14} />;
            case 'subtitle': return <Captions size={14} />;
            case 'effect': return <Sparkles size={14} />;
            case 'ai': return <ImageIcon size={14} />;
            default: return <Layers size={14} />;
        }
    };

    const getTrackAccentColor = () => {
        if (track.isMain) return '#60a5fa';
        switch (track.trackType) {
            case 'video': return '#22d3ee';
            case 'audio': return '#34d399';
            case 'text': return '#facc15';
            case 'subtitle': return '#fb923c';
            case 'effect': return '#c084fc';
            case 'ai': return '#f9a8d4';
            default: return '#a1a1aa';
        }
    };

    const getTrackTypeTitle = () => {
        if (track.isMain) return tl('mainTrack');
        switch (track.trackType) {
            case 'video': return tl('videoTrack');
            case 'audio': return tl('audioTrack');
            case 'text': return tl('textTrack');
            case 'subtitle': return tl('subtitleTrack');
            case 'effect': return tl('effectTrack');
            case 'ai': return tl('aiTrack');
            default: return tl('track');
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
            const url = await resolveAssetUrlByAssetIdFirst(resource);
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
                } catch { continue; }
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

    const handleSelectCover = async (url: string) => {
        setIsSavingCover(true);
        try {
            const imported = await importMagicCutTrackCoverFromUrl(
                url,
                `magiccut_track_cover_${track.id}_${Date.now()}.png`
            );
            updateTrack(track.id, { coverImage: imported.url });
            setCoverMenuPos(null);
        } catch (error) {
            console.error('Failed to persist selected track cover', error);
        } finally {
            setIsSavingCover(false);
        }
    };

    const handleUploadCover = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const files = await uploadHelper.pickFiles(false, 'image/*');
            if (files.length > 0) {
                const file = files[0];
                setIsSavingCover(true);
                const imported = await importMagicCutTrackCoverFile({
                    name: file.name || `magiccut_track_cover_${track.id}.png`,
                    data: new Uint8Array(file.data),
                });
                updateTrack(track.id, { coverImage: imported.url });
                setCoverMenuPos(null);
            }
        } catch (e) { console.error(e); }
        finally {
            setIsSavingCover(false);
        }
    };

    const handleDeleteTrack = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const confirmed = await confirm({
            title: t('trackHeader.deleteDialogTitle'),
            message: t('trackHeader.deleteDialogMessage', { name: track.name }),
            type: 'danger',
            confirmText: tl('deleteTrack'),
            cancelText: t('common.cancel'),
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

    const isVisual = track.trackType !== 'audio';
    const isMain = track.isMain;
    const canHaveVolume = track.trackType === 'video' || track.trackType === 'audio';
    const isSelected = selectedTrackId === track.id;
    const trackAccentColor = getTrackAccentColor();

    const baseClasses = `
        app-surface-subtle border-b border-[var(--border-color)]
        transition-all duration-200 select-none group relative box-border flex items-center
        border-l-[4px] ${track.locked ? '' : 'hover:bg-[color-mix(in_srgb,var(--text-primary)_3%,var(--bg-panel-subtle))]'}
        ${isSelected ? 'shadow-sm' : ''}
    `;

    const trackSurfaceStyle: React.CSSProperties = {
        height,
        borderLeftColor: trackAccentColor,
        backgroundColor: isSelected
            ? 'color-mix(in srgb, var(--theme-primary-500) 8%, var(--bg-panel-subtle))'
            : undefined,
        backgroundImage: track.locked
            ? 'repeating-linear-gradient(45deg, color-mix(in srgb, var(--text-primary) 3%, var(--bg-panel-subtle)), color-mix(in srgb, var(--text-primary) 3%, var(--bg-panel-subtle)) 10px, color-mix(in srgb, var(--text-primary) 6%, var(--bg-panel-subtle)) 10px, color-mix(in srgb, var(--text-primary) 6%, var(--bg-panel-subtle)) 20px)'
            : undefined,
    };

    return (
        <div
            className={baseClasses}
            style={trackSurfaceStyle}
            data-track-header-id={track.id}
            draggable
            onDragStart={handleDragStart}
            onClick={() => selectTrack(track.id)}
        >
            {/* 1. Drag Handle (Visual Grip) */}
            <div className="flex h-full w-4 flex-none items-center justify-center text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing">
                <GripVertical size={12} />
            </div>

            {/* 2. Icon Section */}
            <div
                className="app-surface-strong mr-2 flex h-8 w-8 flex-none items-center justify-center rounded-lg shadow-sm"
                style={{
                    color: trackAccentColor,
                    background: `color-mix(in srgb, ${trackAccentColor} 10%, var(--bg-panel-strong))`,
                    borderColor: `color-mix(in srgb, ${trackAccentColor} 22%, var(--border-color))`
                }}
                title={getTrackTypeTitle()}
            >
                {getTrackIcon()}
            </div>

            {/* 3. Controls & Name Section - Centered */}
            <div className="flex-1 flex flex-col justify-center min-w-0 h-full py-1">
                <div className="mb-1 truncate text-[11px] font-bold leading-none text-[var(--text-primary)]">{track.name}</div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <ControlBtn
                        active={track.locked || false}
                        activeIcon={Lock} inactiveIcon={Unlock}
                        onClick={() => updateTrack(track.id, { locked: !track.locked })}
                        activeClass="bg-[color-mix(in_srgb,var(--status-danger-fg)_12%,transparent)] text-[var(--status-danger-fg)]"
                        inactiveClass="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        title={track.locked ? tl('unlockTrack') : tl('lockTrack')}
                    />
                    {isVisual && (
                        <ControlBtn
                            active={!track.visible}
                            activeIcon={EyeOff} inactiveIcon={Eye}
                            onClick={() => updateTrack(track.id, { visible: !track.visible })}
                            activeClass="bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] text-[var(--text-secondary)]"
                            inactiveClass="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title={!track.visible ? tl('showTrack') : tl('hideTrack')}
                        />
                    )}
                    {(canHaveVolume) && (
                        <ControlBtn
                            active={track.muted || false}
                            activeIcon={VolumeX} inactiveIcon={Volume2}
                            onClick={() => updateTrack(track.id, { muted: !track.muted })}
                            activeClass="bg-[color-mix(in_srgb,var(--status-warning-fg)_12%,transparent)] text-[var(--status-warning-fg)]"
                            inactiveClass="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title={track.muted ? tl('unmuteTrack') : tl('muteTrack')}
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
                            app-surface-strong relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg transition-all group/cover
                            ${track.coverImage ? 'border-transparent bg-black' : 'border border-dashed border-[var(--border-strong)] hover:border-primary-500/40'}
                        `}
                        title={t('trackHeader.changeCover')}
                    >
                        {track.coverImage ? (
                            <>
                                <img src={track.coverImage} className="w-full h-full object-cover" alt={t('trackHeader.coverAlt')} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[8px] text-white font-medium">{t('trackHeader.editCover')}</span>
                                </div>
                            </>
                        ) : (
                            <span className="scale-90 text-[9px] font-medium text-[var(--text-muted)] transition-colors group-hover/cover:text-[var(--text-secondary)]">{t('trackHeader.coverLabel')}</span>
                        )}
                    </div>
                )}

                {!isMain && (
                    <button
                        onClick={handleDeleteTrack}
                        className="app-toolbar-button app-button-danger rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                        title={t('trackHeader.deleteTrack')}
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    >
                        <Trash2 size={13} />
                    </button>
                )}

                {/* Cover Selector Popover */}
                {coverMenuPos && createPortal(
                    <div
                        ref={selectorRef}
                        className="app-floating-panel fixed z-[9999] flex w-64 flex-col overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: Math.min(coverMenuPos.y, window.innerHeight - 300), left: coverMenuPos.x }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <div className="app-header-glass flex items-center justify-between px-3 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('trackHeader.setCover')}</span>
                            <button onClick={() => setCoverMenuPos(null)} className="app-header-action rounded-lg p-1"><X size={12} /></button>
                        </div>

                        <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <button
                                onClick={handleUploadCover}
                                disabled={isSavingCover}
                                className="app-surface-subtle flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                            >
                                {isSavingCover ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} {isSavingCover ? t('trackHeader.savingCover') : t('trackHeader.uploadCustom')}
                            </button>

                            <div className="mt-1 border-t border-[var(--border-color)] px-1 pt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('trackHeader.fromTrackClips')}</div>

                            {isLoadingFrames ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-6 text-[var(--text-muted)]">
                                    <Loader2 size={16} className="animate-spin text-primary-500" />
                                    <span className="text-[10px]">{t('trackHeader.scanningContent')}</span>
                                </div>
                            ) : isSavingCover ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-6 text-[var(--text-muted)]">
                                    <Loader2 size={16} className="animate-spin text-primary-500" />
                                    <span className="text-[10px]">{t('trackHeader.savingCover')}</span>
                                </div>
                            ) : candidateFrames.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {candidateFrames.map((frame, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectCover(frame)}
                                            disabled={isSavingCover}
                                            className="app-surface-strong group/frame relative aspect-video overflow-hidden rounded-xl border transition-all hover:scale-105 hover:border-primary-500/40"
                                        >
                                            <img src={frame} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="app-surface-subtle rounded-xl border border-dashed py-6 text-center text-[10px] text-[var(--text-muted)]">
                                    {t('trackHeader.noSuitableFrames')}
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
