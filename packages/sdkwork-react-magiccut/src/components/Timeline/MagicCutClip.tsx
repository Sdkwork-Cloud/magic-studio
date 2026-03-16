
import React, { useMemo, useRef } from 'react';
;
import { useAssetUrl, MediaResourceType, AnyMediaResource } from '@sdkwork/react-commons';
import { CutClip } from '../../entities/magicCut.entity';
import { PlayerController } from '../../controllers/PlayerController';
import { Film, Image as ImageIcon, Music, Type, Sparkles, AlertCircle, Lock, Link2 } from 'lucide-react';
import { EditTool, InteractionState } from '../../store/types';
import { ClipFilmstrip } from './visuals/ClipFilmstrip';
import { resolveAssetUrlByAssetIdFirst } from '../../utils/assetUrlResolver';
import { resolveClipToolInteraction } from '../../domain/timeline/clipInteraction';
;

interface MagicCutClipProps {
    clip: CutClip;
    resourceName?: string;
    resourceType?: MediaResourceType;
    resourceUrl?: string;
    resourceSource?: string | AnyMediaResource;
    resourceMetadata?: any; 
    pixelsPerSecond: number;
    editTool: EditTool;
    isSelected: boolean;
    onSelect: (id: string, multi?: boolean) => void;
    trackHeight: number;
    isLocked?: boolean;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    playerController: PlayerController;
    isGhost?: boolean;
    onDragStart?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

const HEADER_HEIGHT = 20;

export const MagicCutClip: React.FC<MagicCutClipProps> = React.memo(({
    clip,
    resourceName,
    resourceType,
    resourceUrl,
    resourceSource,
    resourceMetadata,
    pixelsPerSecond,
    editTool,
    isSelected,
    onSelect,
    trackHeight,
    isLocked,
    setInteraction,
    isGhost,
    onDragStart,
    onContextMenu
}) => {
    const clipRef = useRef<HTMLDivElement>(null);
    const left = clip.start * pixelsPerSecond;
    const width = clip.duration * pixelsPerSecond;

    const visualConfig = useMemo(() => {
        let bg = 'bg-[#18181b]'; 
        let border = 'border-[#3f3f46]';
        let headerBg = 'bg-[#27272a]'; 
        let headerText = 'text-gray-400';
        let icon = <AlertCircle size={10} />;
        
        switch (resourceType) {
            case MediaResourceType.VIDEO:
                bg = 'bg-[#0f172a]';
                border = 'border-blue-600/50';
                headerBg = 'bg-[#1e293b]';
                headerText = 'text-blue-200';
                icon = <Film size={10} className="text-blue-400" />;
                break;
            case MediaResourceType.IMAGE:
                bg = 'bg-[#1e1b4b]';
                border = 'border-indigo-500/50';
                headerBg = 'bg-[#312e81]';
                headerText = 'text-indigo-200';
                icon = <ImageIcon size={10} className="text-indigo-400" />;
                break;
            case MediaResourceType.AUDIO:
            case MediaResourceType.MUSIC:
            case MediaResourceType.VOICE:
            case MediaResourceType.SPEECH:
                bg = 'bg-[#022c22]';
                border = 'border-emerald-600/50';
                headerBg = 'bg-[#064e3b]';
                headerText = 'text-emerald-200';
                icon = <Music size={10} className="text-emerald-400" />;
                break;
            case MediaResourceType.TEXT:
            case MediaResourceType.SUBTITLE:
                bg = 'bg-[#451a03]';
                border = 'border-amber-600/50';
                headerBg = 'bg-[#78350f]';
                headerText = 'text-amber-200';
                icon = <Type size={10} className="text-amber-400" />;
                break;
            case MediaResourceType.EFFECT:
            case MediaResourceType.TRANSITION:
                bg = 'bg-[#3b0764]';
                border = 'border-purple-600/50';
                headerBg = 'bg-[#581c87]';
                headerText = 'text-purple-200';
                icon = <Sparkles size={10} className="text-purple-400" />;
                break;
        }

        return { bg, border, icon, headerBg, headerText };
    }, [resourceType]);

    const { url: resolvedUrl } = useAssetUrl(resourceSource || resourceUrl || null, {
        resolver: resolveAssetUrlByAssetIdFirst
    });

    const filmstripSource = resolvedUrl || '';

    const resolvePointerTime = (clientX: number) => {
        const rect = clipRef.current?.getBoundingClientRect();
        if (!rect || rect.width <= 0) return clip.start;

        const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        return clip.start + (relativeX / pixelsPerSecond);
    };

    const beginInteraction = (e: React.MouseEvent, zone: 'body' | 'start-edge' | 'end-edge') => {
        if (isLocked || isGhost) return;
        e.stopPropagation();
        e.preventDefault();

        const interactionType = resolveClipToolInteraction({ tool: editTool, zone });
        if (!interactionType) {
            return;
        }

        const baseCurrentTime = zone === 'start-edge'
            ? clip.start
            : zone === 'end-edge'
                ? clip.start + clip.duration
                : interactionType === 'razor-cut'
                    ? resolvePointerTime(e.clientX)
                    : clip.start;

        setInteraction({
            type: interactionType,
            clipId: clip.id,
            initialX: e.clientX,
            initialY: e.clientY,
            initialStartTime: clip.start,
            initialDuration: clip.duration,
            initialTrackId: clip.track.id,
            initialOffset: clip.offset || 0,
            currentTrackId: clip.track.id,
            currentTime: baseCurrentTime,
            isSnapping: true,
            snapLines: [],
            validDrop: true,
            hasCollision: false,
            insertTrackIndex: null,
            editTool,
            trimEdge: zone === 'start-edge' ? 'start' : zone === 'end-edge' ? 'end' : undefined,
            razorTime: interactionType === 'razor-cut' ? baseCurrentTime : undefined
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLocked || isGhost) return;
        e.stopPropagation();

        const isMultiSelect = e.shiftKey;
        if (!isSelected || isMultiSelect) {
            onSelect(clip.id, isMultiSelect);
        }

        const interactionType = resolveClipToolInteraction({ tool: editTool, zone: 'body' });
        if (interactionType && interactionType !== 'move') {
            beginInteraction(e, 'body');
            return;
        }

        if (interactionType === 'move' && onDragStart) {
            onDragStart(e);
        }
    };

    const showTrimHandles = !isLocked && !isGhost && width > 24 && (
        isSelected ||
        editTool === 'trim' ||
        editTool === 'ripple' ||
        editTool === 'roll' ||
        editTool === 'slide'
    );
    const isTiny = width < 30;
    const isShortTrack = trackHeight < 30; 
    const showHeader = !isShortTrack && !isTiny;
    
    const contentHeight = showHeader ? Math.max(0, trackHeight - HEADER_HEIGHT - 2) : trackHeight - 2;

    const hasVisuals = resourceType === MediaResourceType.VIDEO || resourceType === MediaResourceType.IMAGE;

    const bodyCursor = editTool === 'razor'
        ? 'cursor-crosshair'
        : editTool === 'slip'
            ? 'cursor-grab'
            : editTool === 'slide'
                ? 'cursor-move'
                : editTool === 'select'
                    ? 'cursor-grab'
                    : 'cursor-default';

    const trimCursorClass = editTool === 'razor'
        ? 'cursor-crosshair'
        : 'cursor-ew-resize';

    return (
        <div
            ref={clipRef}
            className={`
                absolute top-0 bottom-0 rounded-md overflow-hidden select-none group flex flex-col box-border ${bodyCursor}
                ${visualConfig.bg}
                ${isSelected 
                    ? `ring-2 ring-white z-20 shadow-lg` 
                    : `border-r border-black/20 opacity-95 hover:opacity-100`
                }
                ${isGhost ? 'opacity-50 pointer-events-none ring-1 ring-white/50' : ''}
                transition-[transform,opacity,box-shadow] duration-75 ease-out
            `}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                height: `${trackHeight - 2}px`,
                top: '1px'
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={onContextMenu}
        >
            {showHeader && (
                <div 
                    className={`
                        flex items-center gap-1.5 px-1.5 w-full flex-none overflow-hidden relative z-20
                        ${visualConfig.headerBg} border-b border-black/10
                    `}
                    style={{ height: `${HEADER_HEIGHT}px` }}
                >
                    <div className="flex items-center justify-center w-3 h-3 rounded bg-black/20 opacity-90 shrink-0">
                        {visualConfig.icon}
                    </div>
                    <span className={`text-[10px] font-semibold truncate tracking-wide flex-1 leading-none pt-0.5 ${visualConfig.headerText}`}>
                        {clip.content || resourceName || 'Unknown Clip'}
                    </span>
                    {(clip.linkGroupId || clip.linkedClipId) && (
                        <span className="flex items-center justify-center w-3 h-3 rounded bg-black/25 text-white/70 shrink-0" title="Linked clip">
                            <Link2 size={8} />
                        </span>
                    )}
                    {isLocked && <Lock size={8} className="text-gray-400 shrink-0" />}
                </div>
            )}

            <div className="flex-1 relative w-full overflow-hidden z-10 min-h-0">
                <div className="absolute inset-0 bg-black/10" />

                {hasVisuals && !isTiny && contentHeight > 8 && (
                    <ClipFilmstrip 
                        resourceId={clip.resource.id}
                        resourceUrl={filmstripSource}
                        resourceType={resourceType}
                        height={contentHeight}
                        offset={clip.offset || 0}
                        pixelsPerSecond={pixelsPerSecond}
                        metadata={resourceMetadata}
                        className="opacity-90"
                    />
                )}
                
                {/* Text Preview for Non-Visuals */}
                {(!hasVisuals || isTiny) && (
                     <div className="absolute inset-0 flex items-center justify-center px-2">
                         <span className="text-[9px] text-white/40 truncate font-medium select-none">
                             {isTiny ? (resourceType === MediaResourceType.AUDIO ? 'Audio' : 'Clip') : (clip.content || resourceName)}
                         </span>
                     </div>
                )}
                
                {/* Selected Gloss Overlay */}
                {isSelected && <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay" />}
            </div>

            {/* --- TRIM HANDLES --- */}
            {showTrimHandles && (
                <>
                    <div 
                        className={`absolute left-0 top-0 bottom-0 w-3 z-30 flex items-center justify-start group/trim pl-0.5 ${trimCursorClass}`}
                        onMouseDown={(e) => beginInteraction(e, 'start-edge')}
                    >
                        <div className="w-[4px] h-full bg-white rounded-l-sm shadow-md group-hover/trim:bg-blue-400 transition-colors" />
                    </div>
                    <div 
                        className={`absolute right-0 top-0 bottom-0 w-3 z-30 flex items-center justify-end group/trim pr-0.5 ${trimCursorClass}`}
                        onMouseDown={(e) => beginInteraction(e, 'end-edge')}
                    >
                        <div className="w-[4px] h-full bg-white rounded-r-sm shadow-md group-hover/trim:bg-blue-400 transition-colors" />
                    </div>
                </>
            )}

            {/* --- LOCKED OVERLAY --- */}
            {isLocked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none backdrop-grayscale-[0.5] z-40 pattern-diagonal-lines-sm text-white/20" />
            )}
        </div>
    );
});
