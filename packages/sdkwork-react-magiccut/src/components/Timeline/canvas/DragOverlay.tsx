
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { Plus, Film, Image as ImageIcon, Music, Type, Sparkles, AlertCircle } from 'lucide-react';

import { AnyMediaResource, MediaResourceType } from 'sdkwork-react-commons';
import { CutClip, CutTrackType } from '../../../entities/magicCut.entity';
import { getRobustResourceUrl } from '../../../utils/resourceUtils';
import { formatTime } from '../../../utils/timeUtils';
import { DragOperation, InteractionState } from '../../../store/types';
import { MagicCutClip } from '../MagicCutClip';

import { ResourceTraitsFactory } from '../../../domain/dnd/ResourceTraitsFactory';
import { TrackFactory } from '../../../services/TrackFactory';
;

interface DragOverlayProps {
    isVisible: boolean;
    dragOperation: DragOperation | null;
    interaction: InteractionState;
    clipsMap: Record<string, CutClip>;
    trackLayouts: { id: string; top: number; height: number }[];
    getResource: (id: string) => AnyMediaResource | undefined;
    pixelsPerSecond: number;
}

const getTrackVisuals = (type: CutTrackType) => {
    switch(type) {
        case 'video': return { color: '#3b82f6', bg: 'bg-blue-500', border: 'border-blue-500', icon: Film, label: 'Video' };
        case 'audio': return { color: '#10b981', bg: 'bg-emerald-500', border: 'border-emerald-500', icon: Music, label: 'Audio' };
        case 'text': return { color: '#eab308', bg: 'bg-yellow-500', border: 'border-yellow-500', icon: Type, label: 'Text' };
        case 'effect': return { color: '#a855f7', bg: 'bg-purple-500', border: 'border-purple-500', icon: Sparkles, label: 'Effect' };
        default: return { color: '#71717a', bg: 'bg-zinc-500', border: 'border-zinc-500', icon: AlertCircle, label: 'Track' };
    }
};

export const DragOverlay: React.FC<DragOverlayProps> = ({
    isVisible,
    dragOperation,
    interaction,
    clipsMap,
    trackLayouts,
    getResource,
    pixelsPerSecond
}) => {
    const ghostRef = useRef<HTMLDivElement>(null);
    const insertGuideRef = useRef<HTMLDivElement>(null);
    const snapGuideRef = useRef<HTMLDivElement>(null);
    const infoPillRef = useRef<HTMLDivElement>(null);

    // Calculate Ghost Data
    const ghostData = useMemo(() => {
        if (!isVisible) return null;

        let clip: CutClip | null = null;
        let resource: AnyMediaResource | undefined;
        let resourceUrl = '';
        
        // Priority: If currentTrackId is set, we are dropping INSIDE. Insert index is irrelevant visually.
        // If currentTrackId is null, THEN we check insertTrackIndex.
        const isDropInside = !!interaction.currentTrackId;
        const isInsert = !isDropInside && interaction.insertTrackIndex !== null;
        
        // If neither, we have no valid target
        const hasTarget = isDropInside || isInsert;

        let isValid = interaction.validDrop && !interaction.hasCollision;
        let operationLabel = "Add";
        
        // Case A: Dragging New Resource
        if (dragOperation) {
            resource = dragOperation.payload;
            clip = {
                id: 'ghost-drag',
                resource: { id: resource.id, type: 'MediaResource', uuid: '' },
                start: 0,
                duration: dragOperation.duration,
                offset: 0,
                track: { id: 'ghost', type: 'CutTrack', uuid: '' },
                layers: [],
                createdAt: 0, updatedAt: 0, speed: 1, volume: 1,
                content: (resource.type === MediaResourceType.TEXT || resource.type === MediaResourceType.SUBTITLE) 
                    ? (resource.metadata?.text || resource.name) 
                    : undefined,
                transform: { x: 0, y: 0, width: 0, height: 0, rotation: 0, scale: 1, opacity: 1 }
            } as CutClip;
            
            operationLabel = isInsert ? "New Track" : "Add Clip";

        } 
        // Case B: Moving Existing Clip
        else if (interaction.type === 'move' && interaction.clipId) {
            clip = { ...clipsMap[interaction.clipId], id: 'ghost-move' };
            resource = getResource(clipsMap[interaction.clipId].resource.id);
            operationLabel = "Move";
        }

        if (!clip || !resource) return null;

        resourceUrl = getRobustResourceUrl(resource);
        
        // Determine Track Type for visuals
        const trackType = isInsert 
             ? TrackFactory.inferTrackType(resource.type) // New track takes resource type
             : (interaction.currentTrackId ? 'video' : TrackFactory.inferTrackType(resource.type)); // Existing track type (simplified)

        // Height Logic
        const isEffect = resource.type === MediaResourceType.EFFECT || resource.type === MediaResourceType.TRANSITION;
        let trackHeight = 0;
        
        if (isEffect) {
            trackHeight = 32; // Fixed Effect Height
        } else if (interaction.currentTrackId) {
             const layout = trackLayouts.find(l => l.id === interaction.currentTrackId);
             if (layout) trackHeight = layout.height;
        } 
        
        if (!trackHeight) {
             trackHeight = TrackFactory.getTrackConfig(trackType).height;
        }

        const traits = ResourceTraitsFactory.getTraits(resource.type);
        const visualConfig = traits.getGhostConfig(isValid, isInsert, trackHeight);

        return { clip, resource, resourceUrl, visualConfig, operationLabel, trackHeight, trackType, isInsert, isDropInside, hasTarget };
    }, [isVisible, dragOperation?.payload?.id, interaction, trackLayouts, getResource]);

    // Direct DOM Update
    useLayoutEffect(() => {
        if (!isVisible || !ghostData || !ghostData.hasTarget) {
            // Hide everything if not visible OR no valid target (e.g. dragging over clip which handles drop locally)
            if (ghostRef.current) ghostRef.current.style.display = 'none';
            if (insertGuideRef.current) insertGuideRef.current.style.display = 'none';
            if (snapGuideRef.current) snapGuideRef.current.style.display = 'none';
            if (infoPillRef.current) infoPillRef.current.style.display = 'none';
            return;
        }

        const { currentTime, currentTrackId, insertTrackIndex, snapLines } = interaction;
        const { clip, visualConfig, operationLabel, trackHeight, trackType, isInsert, isDropInside } = ghostData;
        const left = Math.round(currentTime * pixelsPerSecond);

        let top = 0;
        const ghostH = visualConfig.height;

        // --- Position Logic ---
        
        if (isDropInside && currentTrackId) {
            // SCENARIO 1: Inside a Track
            const layout = trackLayouts.find(l => l.id === currentTrackId);
            if (layout) {
                top = layout.top + (layout.height - ghostH) / 2;
            }
            // FORCE HIDE INSERT GUIDE
            if (insertGuideRef.current) insertGuideRef.current.style.display = 'none';
        
        } else if (isInsert && insertTrackIndex !== null) {
            // SCENARIO 2: Inserting New Track
            if (trackLayouts.length === 0) {
                 top = 20;
            } else if (insertTrackIndex === 0) {
                 const first = trackLayouts[0];
                 top = first.top; 
            } else if (insertTrackIndex >= trackLayouts.length) {
                 const last = trackLayouts[trackLayouts.length - 1];
                 top = last.top + last.height;
            } else {
                 const next = trackLayouts[insertTrackIndex];
                 top = next.top;
            }
            
            // Render Insertion Line
            if (insertGuideRef.current) {
                const visuals = getTrackVisuals(trackType);
                
                insertGuideRef.current.style.display = 'flex';
                // Center the line on the gap (visually 2px high)
                insertGuideRef.current.style.top = `${top - 1}px`; 
                
                // Color update
                const line = insertGuideRef.current.querySelector('.guide-line') as HTMLElement;
                if (line) {
                    line.style.background = `linear-gradient(90deg, transparent, ${visuals.color}, transparent)`;
                    line.style.boxShadow = `0 0 10px ${visuals.color}`;
                }
                
                // Badge update
                const badge = insertGuideRef.current.querySelector('.guide-badge') as HTMLElement;
                if (badge) {
                    badge.style.borderColor = visuals.color;
                    badge.style.color = visuals.color;
                    badge.style.backgroundColor = '#09090b'; 
                }
                const badgeText = insertGuideRef.current.querySelector('.guide-text');
                if (badgeText) badgeText.textContent = `New ${visuals.label} Track`;
            }
        } else {
            // Should be caught by !hasTarget check at top, but just in case
            if (insertGuideRef.current) insertGuideRef.current.style.display = 'none';
            if (ghostRef.current) ghostRef.current.style.display = 'none';
            return;
        }

        // Update Ghost Clip
        if (ghostRef.current) {
            const el = ghostRef.current;
            el.style.display = 'block';
            
            let ghostY = top;
            // If insert, ghost floats on the line
            if (isInsert) {
                ghostY = top - (ghostH / 2);
                el.style.opacity = '0.7'; 
                el.style.zIndex = '60'; 
            } else {
                el.style.opacity = visualConfig.opacity.toString();
                el.style.zIndex = '40';
            }

            el.style.transform = `translate3d(${left}px, ${ghostY}px, 0)`;
            el.style.width = `${Math.max(2, Math.round(clip.duration * pixelsPerSecond))}px`;
            el.style.height = `${ghostH}px`;
            
            el.style.filter = visualConfig.filter;
            el.style.border = `2px solid ${visualConfig.borderColor}`;
            el.style.boxShadow = visualConfig.boxShadow;
            el.style.backgroundColor = visualConfig.backgroundColor;
        }
        
        // Update Info Pill
        if (infoPillRef.current) {
             infoPillRef.current.style.display = 'flex';
             const pillLeft = left;
             // If insert, pill above the line; if drop, pill above clip
             const ghostY = isInsert ? top - (ghostH / 2) : top;
             const pillTop = ghostY - 26;
             infoPillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;
             
             const timeStr = formatTime(currentTime);
             const pillText = infoPillRef.current.querySelector('span');
             if (pillText) pillText.innerText = `${operationLabel} ? ${timeStr}`;
        }

        // Update Snap Lines
        if (snapGuideRef.current) {
            const container = snapGuideRef.current;
            if (snapLines && snapLines.length > 0) {
                container.style.display = 'block';
                while (container.firstChild) container.removeChild(container.firstChild);
                
                snapLines.forEach(lineTime => {
                    const lineX = Math.round(lineTime * pixelsPerSecond);
                    const lineEl = document.createElement('div');
                    lineEl.className = 'absolute top-0 bottom-0 w-px bg-[#F59E0B] z-[45] shadow-[0_0_8px_rgba(245,158,11,0.8)]';
                    lineEl.style.transform = `translate3d(${lineX}px, 0, 0)`;
                    container.appendChild(lineEl);
                });
            } else {
                container.style.display = 'none';
            }
        }

    }, [isVisible, interaction, ghostData, trackLayouts, pixelsPerSecond]);

    if (!isVisible || !ghostData) return null;
    
    return (
        <>
            {/* 1. Aurora Insertion Guide (New Design) */}
            <div 
                ref={insertGuideRef} 
                className="absolute left-0 right-0 z-[60] pointer-events-none flex items-center"
                style={{ display: 'none', height: '2px' }}
            >
                 <div className="guide-line absolute left-0 right-0 h-[2px] rounded-full transition-colors duration-150" />
                 <div className="guide-badge absolute left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-black z-10 shadow-lg transform -translate-y-[1px]">
                     <div className="guide-icon">
                        <Plus size={10} strokeWidth={3} />
                     </div>
                     <span className="guide-text text-[9px] font-bold uppercase tracking-wider">New Track</span>
                 </div>
            </div>

            {/* 2. Ghost Clip */}
            <div ref={ghostRef} className="absolute z-[40] pointer-events-none transition-all duration-75 ease-out rounded-md overflow-hidden" style={{ display: 'none' }}>
                <MagicCutClip
                    clip={ghostData.clip}
                    resourceName={ghostData.resource.name}
                    resourceType={ghostData.resource.type}
                    resourceUrl={ghostData.resourceUrl}
                    resourceMetadata={ghostData.resource.metadata} // Pass metadata for filmstrip
                    pixelsPerSecond={pixelsPerSecond}
                    isSelected={false}
                    onSelect={() => {}}
                    trackHeight={ghostData.visualConfig.height}
                    isGhost={true}
                    setInteraction={() => {}}
                    playerController={{ skim: () => {}, scrub: () => {}, previewFrame: () => {} } as any}
                />
            </div>
            
            {/* 3. Info Pill */}
            <div 
                ref={infoPillRef}
                className="absolute z-[70] pointer-events-none bg-[#1e1e1e] text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 shadow-xl flex items-center gap-1.5 whitespace-nowrap will-change-transform"
                style={{ display: 'none' }}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${interaction.hasCollision ? 'bg-red-500' : 'bg-green-500'}`} />
                <span />
            </div>

            {/* 4. Snap Lines */}
            <div ref={snapGuideRef} className="absolute inset-0 pointer-events-none z-[45]" style={{ display: 'none' }} />
        </>
    );
};

export default DragOverlay;

