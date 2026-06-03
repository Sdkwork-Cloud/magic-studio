import { TIMELINE_CONSTANTS } from '../../constants';
import React, { useMemo } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';

export const InOutPointOverlay: React.FC = () => {
    const { 
        inPoint, 
        outPoint, 
        useTransientState
    } = useMagicCutStore();
    
    const zoomLevel = useTransientState(s => s.zoomLevel);
    const scrollLeft = useTransientState(s => s.scrollLeft);
    const containerWidth = useTransientState(s => s.containerWidth);
    
    const pps = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoomLevel;
    
    const inPointStyle = useMemo(() => {
        if (inPoint === null) return null;
        const projectPos = inPoint * pps;
        return {
            left: `${projectPos}px`,
            display: projectPos >= scrollLeft - 10 && projectPos <= scrollLeft + containerWidth + 10 ? 'block' : 'none'
        };
    }, [inPoint, pps, scrollLeft, containerWidth]);
    
    const outPointStyle = useMemo(() => {
        if (outPoint === null) return null;
        const projectPos = outPoint * pps;
        return {
            left: `${projectPos}px`,
            display: projectPos >= scrollLeft - 10 && projectPos <= scrollLeft + containerWidth + 10 ? 'block' : 'none'
        };
    }, [outPoint, pps, scrollLeft, containerWidth]);
    
    const rangeStyle = useMemo(() => {
        if (inPoint === null || outPoint === null) return null;
        const start = inPoint * pps;
        const end = outPoint * pps;
        return {
            left: `${start}px`,
            width: `${end - start}px`
        };
    }, [inPoint, outPoint, pps]);
    
    if (!inPointStyle && !outPointStyle) return null;
    
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30">
            {rangeStyle && (
                <div 
                    className="absolute top-0 h-full bg-blue-500/10 border-x-2 border-blue-500"
                    style={rangeStyle}
                />
            )}
            
            {inPointStyle && (
                <div 
                    className="absolute top-0 h-full w-0.5 bg-blue-400"
                    style={inPointStyle}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-blue-400 text-[9px] font-bold text-white px-1 rounded">
                        I
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-blue-400 text-[8px] font-mono text-white px-1 rounded whitespace-nowrap">
                        {formatTime(inPoint!)}
                    </div>
                </div>
            )}
            
            {outPointStyle && (
                <div 
                    className="absolute top-0 h-full w-0.5 bg-orange-400"
                    style={outPointStyle}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-orange-400 text-[9px] font-bold text-white px-1 rounded">
                        O
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-orange-400 text-[8px] font-mono text-white px-1 rounded whitespace-nowrap">
                        {formatTime(outPoint!)}
                    </div>
                </div>
            )}
        </div>
    );
};

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default InOutPointOverlay;

