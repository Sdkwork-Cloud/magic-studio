
import React, { useMemo } from 'react';

import { MagicCutClip } from './MagicCutClip';
import { WaveformOverlay } from './WaveformOverlay';
import { AnyMediaResource } from '@sdkwork/react-commons';
import { CutTrack, CutClip } from '../../entities/magicCut.entity';
import { getRobustResourceUrl } from '../../utils/resourceUtils';
import { Film } from 'lucide-react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../../events';

interface MagicCutTrackProps {
    track: CutTrack;
    clips: CutClip[];
    getResource: (id: string) => AnyMediaResource | undefined;
    pixelsPerSecond: number;
    selectedClipId: string | null;
    selectedClipIds: Set<string>;
    onClipSelect: (id: string, multi?: boolean) => void;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    height: number;
    onTrackSelect: (id: string) => void;
    onClipDragStart?: (clipId: string, clientX: number, clientY: number) => void;
}

export const MagicCutTrack: React.FC<MagicCutTrackProps> = React.memo(({
    track, clips, getResource, pixelsPerSecond, selectedClipIds, onClipSelect,
    visibleTimeStart, visibleTimeEnd, height,
    onTrackSelect, onClipDragStart
}) => {
    const { setInteraction, playerController, useTransientState } = useMagicCutStore();
    const bus = useMagicCutBus();
    
    const scrollLeft = useTransientState(s => s.scrollLeft);

    const visibleClips = useMemo(() => {
        const BUFFER = 2; 
        const renderStart = Math.max(0, visibleTimeStart - BUFFER);
        const renderEnd = visibleTimeEnd + BUFFER;
        return clips.filter(clip => {
            const clipEnd = clip.start + clip.duration;
            return clip.start < renderEnd && clipEnd > renderStart;
        });
    }, [clips, visibleTimeStart, visibleTimeEnd]);

    const containerClass = `border-b border-[#27272a] relative group box-border overflow-hidden transition-colors`;

    const viewportWidth = (visibleTimeEnd - visibleTimeStart) * pixelsPerSecond;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onTrackSelect(track.id);
        
        const rect = e.currentTarget.getBoundingClientRect();
        const relX = (e.clientX - rect.left) + scrollLeft;
        const time = Math.max(0, relX / pixelsPerSecond);

        bus.emit(MagicCutEvents.UI_CONTEXT_MENU, {
            x: e.clientX,
            y: e.clientY,
            type: 'track',
            id: track.id,
            time
        });
    };

    return (
        <div 
            className={containerClass}
            style={{ height }}
            data-track-id={track.id} 
            onMouseDown={(e) => {
                if (!e.defaultPrevented && e.button === 0) {
                     onTrackSelect(track.id);
                }
            }}
            onContextMenu={handleContextMenu}
        >
            <div 
                style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    width: '100%', 
                    height: '100%', 
                    zIndex: 15,
                    pointerEvents: 'none'
                }}
            >
                <WaveformOverlay 
                    width={viewportWidth}
                    height={height}
                    scrollLeft={scrollLeft}
                    pixelsPerSecond={pixelsPerSecond}
                    clips={visibleClips}
                    trackType={track.trackType}
                    getResource={getResource}
                />
            </div>

            {track.isMain && clips.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none z-0">
                    <div className="flex flex-col items-center gap-2">
                        <Film size={32} />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Main Storyline</span>
                    </div>
                </div>
            )}

            {(track.locked || track.visible === false) && (
                <div className="absolute inset-0 bg-[#09090b]/60 z-40 pointer-events-none backdrop-grayscale flex items-center justify-center">
                    <div className="bg-black/80 px-3 py-1.5 rounded-full text-[10px] font-bold text-white/50 border border-white/10 shadow-lg uppercase tracking-wider flex items-center gap-2">
                        {track.locked && <span>Locked</span>}
                        {track.visible === false && <span>Hidden</span>}
                    </div>
                </div>
            )}

            <div className="relative w-full h-full z-10 pointer-events-none">
                {visibleClips.map(clip => {
                    const resource = getResource(clip.resource.id);
                    const resourceUrl = getRobustResourceUrl(resource);
                    const isSelected = selectedClipIds.has(clip.id);
                    
                    return (
                        <div key={clip.id} className="pointer-events-auto">
                            <MagicCutClip
                                clip={clip}
                                resourceName={resource?.name}
                                resourceType={resource?.type}
                                pixelsPerSecond={pixelsPerSecond}
                                isSelected={isSelected}
                                onSelect={(id, multi) => onClipSelect(id, multi)}
                                trackHeight={height}
                                isLocked={!!track.locked}
                                setInteraction={setInteraction}
                                playerController={playerController}
                                resourceUrl={resourceUrl}
                                resourceSource={resource || resourceUrl}
                                resourceMetadata={resource?.metadata}
                                onDragStart={(e) => onClipDragStart?.(clip.id, e.clientX, e.clientY)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClipSelect(clip.id, false);

                                    const trackElement = e.currentTarget.closest('[data-track-id]');
                                    const rect = trackElement?.getBoundingClientRect();
                                    const relativeX = rect
                                        ? (e.clientX - rect.left) + scrollLeft
                                        : clip.start * pixelsPerSecond;
                                    const time = Math.max(0, relativeX / pixelsPerSecond);

                                    bus.emit(MagicCutEvents.UI_CONTEXT_MENU, {
                                        x: e.clientX,
                                        y: e.clientY,
                                        type: 'clip',
                                        id: clip.id,
                                        time
                                    });
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            
            <div 
                className="absolute inset-0 z-30 pointer-events-none opacity-0 transition-opacity duration-150 track-highlight-overlay
                    border-y-2 border-r-2 border-emerald-500
                    bg-emerald-500/10
                    shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
            />
        </div>
    );
});
