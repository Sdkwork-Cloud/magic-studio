
import { VideoAspectRatio, VideoResolution } from 'sdkwork-react-commons'
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Monitor, Smartphone, Square, X, Lock } from 'lucide-react';
;
import { VIDEO_ASPECT_RATIOS } from '../constants';

interface AspectRatioSelectorProps {
    ratio: VideoAspectRatio;
    resolution: VideoResolution;
    onChangeRatio: (r: VideoAspectRatio) => void;
    onChangeResolution: (r: VideoResolution) => void;
    disabled?: boolean;
}

// Helper to calculate display dimensions
const calculateDimensions = (ratio: VideoAspectRatio, resolution: VideoResolution) => {
    let baseHeight = 1080;
    if (resolution === '720p') baseHeight = 720;
    if (resolution === '4k') baseHeight = 2160;

    const [w, h] = ratio.split(':').map(Number);
    
    let width, height;

    if (w > h) {
        // Landscape
        height = baseHeight;
        width = Math.round(height * (w / h));
    } else if (w < h) {
        // Portrait logic
        if (resolution === '1080p') { width = 1080; height = 1920; } 
        else if (resolution === '720p') { width = 720; height = 1280; } 
        else { width = 2160; height = 3840; }
    } else {
        // Square
        width = baseHeight;
        height = baseHeight;
    }

    return { w: width, h: height };
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
    ratio,
    resolution,
    onChangeRatio,
    onChangeResolution,
    disabled
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { w, h } = calculateDimensions(ratio, resolution);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const activeRatioObj = VIDEO_ASPECT_RATIOS.find(r => r.id === ratio) || VIDEO_ASPECT_RATIOS[0];

    return (
        <div className="relative z-20" ref={containerRef}>
            <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wider">
                Dimensions
            </label>
            
            {/* Trigger Button - Matched Style */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2.5 bg-[#18181b] border border-[#27272a] rounded-xl transition-all
                    ${isOpen ? 'ring-1 ring-pink-500/50 border-pink-500/50 bg-[#202022]' : 'hover:border-gray-600 hover:bg-[#202022]'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <div className="flex items-center gap-3">
                    {/* CSS Shape Icon */}
                    <div className="w-5 h-5 flex items-center justify-center rounded bg-[#27272a] text-gray-400">
                         <div 
                            className="border-[1.5px] border-current rounded-[1px]"
                            style={{ 
                                width: parseInt(ratio.split(':')[0]) > parseInt(ratio.split(':')[1]) ? '16px' : parseInt(ratio.split(':')[0]) === parseInt(ratio.split(':')[1]) ? '12px' : '8px',
                                height: parseInt(ratio.split(':')[0]) < parseInt(ratio.split(':')[1]) ? '16px' : parseInt(ratio.split(':')[0]) === parseInt(ratio.split(':')[1]) ? '12px' : '8px',
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-gray-200">{activeRatioObj.label}</span>
                        <span className="text-[9px] text-gray-500 font-mono">{w} x {h}</span>
                    </div>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Popover Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 w-[300px] mt-2 bg-[#1c1c1e] border border-[#333] rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100 origin-top-left z-50 ring-1 ring-black/50">
                    
                    {/* Section 1: Aspect Ratio Grid */}
                    <div className="mb-4">
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Aspect Ratio</div>
                        <div className="grid grid-cols-3 gap-2">
                            {VIDEO_ASPECT_RATIOS.map(r => {
                                const isActive = ratio === r.id;
                                const [rw, rh] = r.id.split(':').map(Number);
                                const isLandscape = rw > rh;
                                const isPortrait = rh > rw;
                                const isSquare = rw === rh;

                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => onChangeRatio(r.id)}
                                        className={`
                                            flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all h-14
                                            ${isActive 
                                                ? 'bg-[#27272a] border-pink-500/50 text-pink-400 ring-1 ring-pink-500/20' 
                                                : 'bg-[#252526] border-transparent hover:bg-[#2a2a2d] hover:border-[#444] text-gray-400'
                                            }
                                        `}
                                        title={r.label}
                                    >
                                        <div 
                                            className={`border-[1.5px] rounded-[1px] transition-colors ${isActive ? 'border-pink-400' : 'border-gray-500'}`}
                                            style={{
                                                width: isLandscape ? '14px' : isSquare ? '10px' : '6px',
                                                height: isPortrait ? '14px' : isSquare ? '10px' : '6px'
                                            }}
                                        />
                                        <span className="text-[9px] font-mono leading-none">{r.id}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Section 2: Resolution */}
                    <div className="mb-4">
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Quality</div>
                        <div className="flex bg-[#252526] p-1 rounded-lg border border-[#333]">
                            {['720p', '1080p'].map((res) => {
                                const isActive = resolution === res;
                                return (
                                    <button
                                        key={res}
                                        onClick={() => onChangeResolution(res as VideoResolution)}
                                        className={`
                                            flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all
                                            ${isActive 
                                                ? 'bg-[#3a3a3c] text-white shadow-sm ring-1 ring-white/10' 
                                                : 'text-gray-500 hover:text-gray-300'
                                            }
                                        `}
                                    >
                                        {res === '720p' ? 'HD 720p' : 'FHD 1080p'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Readout */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 bg-[#252526] px-3 py-2 rounded-lg border border-[#333]">
                        <span>Final Output</span>
                        <span className="font-mono text-gray-300">{w} x {h}px</span>
                    </div>

                </div>
            )}
        </div>
    );
};
