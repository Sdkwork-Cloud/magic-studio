
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { CutClip, CutTrack } from '../../entities/magicCut.entity';
import {
    resolveMinimapScrollLeft,
    resolveMinimapTimeX,
    resolveMinimapViewport,
} from '../../domain/timeline/minimap';

interface TimelineMinimapProps {
    tracks: CutTrack[];
    clipsMap: Record<string, CutClip>;
    totalDuration: number;
    containerWidth: number;
    scrollLeft: number;
    pixelsPerSecond: number;
    currentTime: number;
    onScroll: (newScrollLeft: number) => void;
}

const HEIGHT = 44;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

const resolveTrackColor = (trackType: CutTrack['trackType']) => {
    if (trackType === 'video') return '#38bdf8';
    if (trackType === 'audio') return '#34d399';
    if (trackType === 'text') return '#fbbf24';
    if (trackType === 'subtitle') return '#fb923c';
    if (trackType === 'effect') return '#a78bfa';
    if (trackType === 'ai') return '#f472b6';
    return '#71717a';
};

export const TimelineMinimap: React.FC<TimelineMinimapProps> = ({
    tracks,
    clipsMap,
    totalDuration,
    containerWidth,
    scrollLeft,
    pixelsPerSecond,
    currentTime,
    onScroll
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const width = useMemo(
        () => Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, containerWidth * 0.28 || MIN_WIDTH))),
        [containerWidth]
    );

    const viewport = useMemo(
        () =>
            resolveMinimapViewport({
                totalDuration,
                pixelsPerSecond,
                containerWidth,
                scrollLeft,
                minimapWidth: width,
            }),
        [totalDuration, pixelsPerSecond, containerWidth, scrollLeft, width]
    );

    const playheadX = useMemo(
        () => resolveMinimapTimeX(currentTime, viewport.safeTotalDuration, width),
        [currentTime, viewport.safeTotalDuration, width]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== width * dpr || canvas.height !== HEIGHT * dpr) {
            canvas.width = width * dpr;
            canvas.height = HEIGHT * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${HEIGHT}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, width, HEIGHT);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, HEIGHT);

        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, HEIGHT * 0.45);

        const trackHeight = Math.max(4, (HEIGHT - 10) / Math.max(1, tracks.length));
        const topInset = 5;

        tracks.forEach((track, i) => {
            const y = topInset + i * trackHeight;
            const h = Math.max(3, trackHeight - 2);

            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(0, y, width, h);

            track.clips.forEach((ref) => {
                const clip = clipsMap[ref.id];
                if (!clip) return;

                const x = (clip.start / viewport.safeTotalDuration) * width;
                const w = Math.max(2, (clip.duration / viewport.safeTotalDuration) * width);

                ctx.fillStyle = resolveTrackColor(track.trackType);
                ctx.fillRect(x, y, w, h);
            });
        });
    }, [tracks, clipsMap, viewport.safeTotalDuration, width]);

    const applyPointerScroll = useCallback((clientX: number, dragOffsetX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pointerX = Math.max(0, Math.min(clientX - rect.left, width));

        onScroll(resolveMinimapScrollLeft({
            pointerX,
            dragOffsetX,
            totalDuration,
            pixelsPerSecond,
            containerWidth,
            minimapWidth: width,
        }));
    }, [onScroll, totalDuration, pixelsPerSecond, containerWidth, width]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const pointerX = Math.max(0, Math.min(e.clientX - e.currentTarget.getBoundingClientRect().left, width));
        const dragOffsetX =
            pointerX >= viewport.x && pointerX <= viewport.x + viewport.width
                ? pointerX - viewport.x
                : viewport.width / 2;

        dragOffsetRef.current = dragOffsetX;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        applyPointerScroll(e.clientX, dragOffsetX);
    }, [applyPointerScroll, viewport.x, viewport.width, width]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || dragOffsetRef.current === null) return;
        applyPointerScroll(e.clientX, dragOffsetRef.current);
    }, [applyPointerScroll, isDragging]);

    const endDrag = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
        if (e && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        dragOffsetRef.current = null;
        setIsDragging(false);
    }, []);

    if (tracks.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md select-none touch-none transition-all ${
                isDragging ? 'border-cyan-300/70 bg-[#0b1220]/95' : 'border-white/10 bg-[#09090b]/90 hover:border-white/20'
            }`}
            style={{ width, height: HEIGHT }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
        >
            <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
            <div
                className="pointer-events-none absolute inset-y-0 left-0 bg-black/35"
                style={{ width: viewport.x }}
            />
            <div
                className="pointer-events-none absolute inset-y-0 bg-black/35"
                style={{ left: viewport.x + viewport.width, width: Math.max(0, width - viewport.x - viewport.width) }}
            />
            <div
                className={`pointer-events-none absolute top-[3px] bottom-[3px] rounded-lg border ${
                    isDragging ? 'border-cyan-300/90 bg-cyan-300/15' : 'border-white/40 bg-white/10'
                }`}
                style={{ left: viewport.x, width: viewport.width }}
            />
            <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.45)]"
                style={{ left: playheadX }}
            />
            <div className="pointer-events-none absolute left-2 top-1 text-[9px] font-semibold tracking-[0.22em] text-white/45">
                OVERVIEW
            </div>
        </div>
    );
};
