
import React, { useCallback } from 'react';
import { CutTrack, CutClip } from '../../../entities/magicCut.entity';
import { AnyMediaResource } from '../../../../../types';
import { MagicCutTrack } from '../MagicCutTrack';

interface TrackLayerProps {
    tracks: CutTrack[];
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, CutClip>;
    getResource: (id: string) => AnyMediaResource | undefined;
    pixelsPerSecond: number;
    selectedClipId: string | null;
    selectedClipIds: Set<string>;
    onClipSelect: (id: string | null, multi?: boolean) => void;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    visibleTrackIndices: number[];
    onTrackSelect: (id: string | null) => void;
    onClipDragStart?: (clipId: string, clientX: number, clientY: number) => void;
}

export const TrackLayer: React.FC<TrackLayerProps> = React.memo(({
    tracks,
    trackLayouts,
    clipsMap,
    getResource,
    pixelsPerSecond,
    selectedClipId,
    selectedClipIds,
    onClipSelect,
    visibleTimeStart,
    visibleTimeEnd,
    visibleTrackIndices,
    onTrackSelect,
    onClipDragStart
}) => {
    
    const handleClipSelect = useCallback((id: string, multi?: boolean) => {
        onClipSelect(id, multi);
    }, [onClipSelect]);

    return (
        <>
            {visibleTrackIndices.map(index => {
                const track = tracks[index];
                const layout = trackLayouts[index];
                
                if (!track || !layout) return null;

                return (
                    <div 
                        key={track.id} 
                        style={{ 
                            position: 'absolute', 
                            top: layout.top, 
                            height: layout.height, 
                            width: '100%', 
                            zIndex: 10 
                        }}
                    >
                        <MagicCutTrack 
                            track={track}
                            clips={track.clips.map(ref => clipsMap[ref.id]).filter(Boolean)}
                            getResource={getResource}
                            pixelsPerSecond={pixelsPerSecond}
                            selectedClipId={selectedClipId}
                            selectedClipIds={selectedClipIds}
                            onClipSelect={handleClipSelect} 
                            visibleTimeStart={visibleTimeStart}
                            visibleTimeEnd={visibleTimeEnd}
                            height={layout.height}
                            onTrackSelect={onTrackSelect}
                            onClipDragStart={onClipDragStart}
                        />
                    </div>
                );
            })}
        </>
    );
});

export default TrackLayer;
