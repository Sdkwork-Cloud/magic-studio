
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnyMediaResource, MediaResourceType } from 'sdkwork-react-commons';
import { CutClip, CutTrackType } from '../../entities/magicCut.entity';
import { mediaService } from 'sdkwork-react-core';
import { TIMELINE_CONSTANTS } from '../../constants';
;

interface WaveformOverlayProps {
    width: number;
    height: number;
    scrollLeft: number;
    pixelsPerSecond: number;
    clips: CutClip[];
    trackType: CutTrackType;
    getResource: (id: string) => AnyMediaResource | undefined;
    draggedClipId?: string | null;
}

export const WaveformOverlay: React.FC<WaveformOverlayProps> = React.memo(({
    width,
    height,
    scrollLeft,
    pixelsPerSecond,
    clips,
    trackType,
    getResource,
    draggedClipId
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Cache for local component rendering state (peaks data is cached in service)
    const [peaksMap, setPeaksMap] = useState<Map<string, Float32Array>>(new Map());
    
    // 1. Data Loading Effect
    useEffect(() => {
        let isMounted = true;
        
        const loadWaveforms = async () => {
             for (const clip of clips) {
                if (!clip.resource || !clip.resource.id) continue;
                
                const resource = getResource(clip.resource.id);
                if (!resource) continue;

                const hasAudio = 
                    resource.type === MediaResourceType.AUDIO || 
                    resource.type === MediaResourceType.VIDEO || 
                    resource.type === MediaResourceType.MUSIC || 
                    resource.type === MediaResourceType.VOICE || 
                    resource.type === MediaResourceType.SPEECH;

                if (!hasAudio) continue;
                
                // Check if we already have peaks locally to avoid re-fetching service promise
                if (peaksMap.has(resource.id)) continue;

                try {
                    // Pass the whole resource object to the unified service
                    const peaks = await mediaService.getAudioWaveform(resource);
                    
                    if (isMounted && peaks) {
                        setPeaksMap(prev => new Map(prev).set(resource.id, peaks));
                    }
                } catch (e) {
                    console.warn(`[Waveform] Failed to load waveform for ${resource.name}`, e);
                }
             }
        };

        loadWaveforms();
        
        return () => { isMounted = false; };
    }, [clips, getResource, peaksMap]);

    // 2. Optimized Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.ceil(width * dpr);
        const targetHeight = Math.ceil(height * dpr);
        
        // Ensure canvas physical size matches viewport request
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            // Style size is handled in render style prop
            ctx.scale(dpr, dpr);
        } else {
             // Reset transform to identity then scale for DPR
             ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
             ctx.clearRect(0, 0, width, height);
        }

        const isVideoTrack = trackType === 'video';
        
        let waveHeight = height;
        let waveBaseY = height / 2;
        let waveColor = TIMELINE_CONSTANTS.WAVEFORM_COLOR;
        let useGradientBg = false;

        if (isVideoTrack) {
            waveHeight = height * 0.22;
            waveBaseY = height - (waveHeight / 2) - 2; 
            waveColor = 'rgba(255, 255, 255, 0.75)';
            useGradientBg = true;
        } else {
            waveHeight = height * 0.7;
            waveBaseY = height / 2;
            waveColor = '#a7f3d0';
        }

        clips.forEach(clip => {
            if (draggedClipId === clip.id) return;
            
            const resource = getResource(clip.resource.id);
            if (!resource) return;

            const peaks = peaksMap.get(resource.id);
            
            const drawStart = clip.start;
            const drawDuration = clip.duration;
            const drawOffset = clip.offset || 0;

            // Calculate X relative to the viewport (canvas start)
            // Note: Since we translate the canvas to scrollLeft, the canvas local 0 IS the scrollLeft position.
            // clipX (absolute) - scrollLeft = clipX (relative to viewport)
            const clipX = (drawStart * pixelsPerSecond) - scrollLeft;
            const clipW = drawDuration * pixelsPerSecond;

            // Visibility Check (Culling)
            if (clipX + clipW < 0 || clipX > width) return;

            if (useGradientBg) {
                const bgHeight = waveHeight + 8;
                const gradient = ctx.createLinearGradient(0, height - bgHeight, 0, height);
                gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
                gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
                ctx.fillStyle = gradient;
                ctx.fillRect(Math.max(0, clipX), height - bgHeight, Math.min(clipW, width - clipX), bgHeight);
            }

            if (!peaks) {
                if (!isVideoTrack) {
                     ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                     ctx.setLineDash([2, 4]);
                     ctx.beginPath();
                     ctx.moveTo(Math.max(0, clipX), waveBaseY);
                     ctx.lineTo(Math.min(width, clipX + clipW), waveBaseY);
                     ctx.stroke();
                     ctx.setLineDash([]);
                }
                return;
            }

            ctx.fillStyle = waveColor;
            
            const drawStartPx = Math.max(0, clipX);
            const drawEndPx = Math.min(width, clipX + clipW);
            
            const pixelStep = pixelsPerSecond > 100 ? 1 : 2; 
            const peaksPerSec = 100;
            const volume = Math.min(1.5, Math.max(0, clip.volume ?? 1.0));
            const halfH = waveHeight / 2 * 0.9; 
            
            ctx.beginPath();
            
            for (let x = drawStartPx; x < drawEndPx; x += pixelStep) {
                const relativeX = x - clipX;
                const timeInClip = relativeX / pixelsPerSecond;
                const resourceTime = drawOffset + timeInClip;
                const peakIdx = Math.floor(resourceTime * peaksPerSec);
                
                let val = 0;
                if (peakIdx >= 0 && peakIdx < peaks.length) {
                    val = peaks[peakIdx];
                    if (pixelsPerSecond < 50) {
                        const lookAhead = Math.max(1, Math.ceil(100 / pixelsPerSecond));
                        for(let i=1; i<lookAhead && peakIdx+i < peaks.length; i++) {
                             val = Math.max(val, peaks[peakIdx+i]);
                        }
                    }
                }
                
                const hPx = Math.max(0.5, val * volume * halfH);
                ctx.lineTo(x, waveBaseY - hPx);
            }

            for (let x = drawEndPx; x >= drawStartPx; x -= pixelStep) {
                const relativeX = x - clipX;
                const timeInClip = relativeX / pixelsPerSecond;
                const resourceTime = drawOffset + timeInClip;
                const peakIdx = Math.floor(resourceTime * peaksPerSec);
                let val = 0;
                if (peakIdx >= 0 && peakIdx < peaks.length) {
                    val = peaks[peakIdx];
                    if (pixelsPerSecond < 50) {
                        const lookAhead = Math.max(1, Math.ceil(100 / pixelsPerSecond));
                        for(let i=1; i<lookAhead && peakIdx+i < peaks.length; i++) {
                             val = Math.max(val, peaks[peakIdx+i]);
                        }
                    }
                }
                const hPx = Math.max(0.5, val * volume * halfH);
                ctx.lineTo(x, waveBaseY + hPx);
            }
            
            ctx.closePath();
            ctx.fill();
        });

    }, [width, height, scrollLeft, pixelsPerSecond, clips, trackType, draggedClipId, getResource, peaksMap]); 

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            <canvas 
                ref={canvasRef}
                style={{ 
                    width: `${width}px`, 
                    height: `${height}px`,
                    // Move the canvas to follow the scroll window, so the internal
                    // (clipX - scrollLeft) calculation renders in the visible frame
                    transform: `translate3d(${scrollLeft}px, 0, 0)` 
                }}
            />
        </div>
    );
});

