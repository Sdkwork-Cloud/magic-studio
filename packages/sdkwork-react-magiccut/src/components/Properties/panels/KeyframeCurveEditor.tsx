import { KeyframePoint, EasingType, KeyframeMap } from '../../../entities/magicCut.entity'
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMagicCutStore } from '../../../store/magicCutStore';

interface KeyframeCurveEditorProps {
    clipId: string;
    propertyName: string;
    clipDuration: number;
    minValue?: number;
    maxValue?: number;
    defaultValue?: number;
    height?: number;
    color?: string;
}

const EASING_CURVES: Record<EasingType, (t: number) => number> = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    step: (t) => t < 1 ? 0 : 1,
};

const EASING_LABELS: Record<EasingType, string> = {
    linear: 'Linear',
    easeIn: 'Ease In',
    easeOut: 'Ease Out',
    easeInOut: 'Ease In/Out',
    step: 'Step',
};

export const KeyframeCurveEditor: React.FC<KeyframeCurveEditorProps> = ({
    clipId,
    propertyName,
    clipDuration,
    minValue = 0,
    maxValue = 1,
    defaultValue = 1,
    height = 120,
    color = '#3b82f6',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(300);
    const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showEasingMenu, setShowEasingMenu] = useState(false);
    
    const { state, updateClip, playerController } = useMagicCutStore();
    const clip = state.clips[clipId];
    const keyframes = clip?.keyframes?.[propertyName] || [];
    
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setWidth(entries[0].contentRect.width);
            }
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        return () => resizeObserver.disconnect();
    }, []);
    
    const sortedKeyframes = useMemo(() => {
        return [...keyframes].sort((a, b) => a.time - b.time);
    }, [keyframes]);
    
    const valueToY = useCallback((value: number) => {
        const normalized = (value - minValue) / (maxValue - minValue);
        return height - (normalized * height * 0.9) - height * 0.05;
    }, [minValue, maxValue, height]);
    
    const yToValue = useCallback((y: number) => {
        const normalized = 1 - ((y - height * 0.05) / (height * 0.9));
        return minValue + normalized * (maxValue - minValue);
    }, [minValue, maxValue, height]);
    
    const timeToX = useCallback((time: number) => {
        return (time / clipDuration) * width;
    }, [clipDuration, width]);
    
    const xToTime = useCallback((x: number) => {
        return (x / width) * clipDuration;
    }, [clipDuration, width]);
    
    const drawCurve = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = height * 0.05 + (i / 4) * height * 0.9;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        for (let i = 0; i <= 4; i++) {
            const x = (i / 4) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        if (sortedKeyframes.length === 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            const y = valueToY(defaultValue);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.globalAlpha = 1;
            return;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const firstKf = sortedKeyframes[0];
        if (firstKf.time > 0) {
            ctx.moveTo(0, valueToY(firstKf.value));
        } else {
            ctx.moveTo(timeToX(firstKf.time), valueToY(firstKf.value));
        }
        
        for (let i = 0; i < sortedKeyframes.length; i++) {
            const kf = sortedKeyframes[i];
            const x = timeToX(kf.time);
            const y = valueToY(kf.value);
            
            if (i === 0 && kf.time > 0) {
                ctx.lineTo(x, y);
            } else if (i > 0) {
                const prevKf = sortedKeyframes[i - 1];
                const prevX = timeToX(prevKf.time);
                const prevY = valueToY(prevKf.value);
                
                const easingFn = EASING_CURVES[prevKf.easing];
                const steps = 50;
                
                for (let j = 1; j <= steps; j++) {
                    const t = j / steps;
                    const easedT = easingFn(t);
                    const interpX = prevX + (x - prevX) * t;
                    const interpY = prevY + (y - prevY) * easedT;
                    ctx.lineTo(interpX, interpY);
                }
            }
        }
        
        const lastKf = sortedKeyframes[sortedKeyframes.length - 1];
        if (lastKf.time < clipDuration) {
            ctx.lineTo(width, valueToY(lastKf.value));
        }
        
        ctx.stroke();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `${color}33`);
        gradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        if (sortedKeyframes[0].time > 0) {
            ctx.lineTo(0, valueToY(sortedKeyframes[0].value));
        }
        
        sortedKeyframes.forEach(kf => {
            ctx.lineTo(timeToX(kf.time), valueToY(kf.value));
        });
        
        ctx.lineTo(width, valueToY(sortedKeyframes[sortedKeyframes.length - 1].value));
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        
        sortedKeyframes.forEach(kf => {
            const x = timeToX(kf.time);
            const y = valueToY(kf.value);
            const isSelected = kf.id === selectedKeyframe;
            
            ctx.beginPath();
            ctx.arc(x, y, isSelected ? 8 : 6, 0, Math.PI * 2);
            ctx.fillStyle = isSelected ? '#fff' : color;
            ctx.fill();
            ctx.strokeStyle = isSelected ? color : '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }, [sortedKeyframes, width, height, color, selectedKeyframe, clipDuration, defaultValue, timeToX, valueToY]);
    
    useEffect(() => {
        drawCurve();
    }, [drawCurve]);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (const kf of sortedKeyframes) {
            const kfX = timeToX(kf.time);
            const kfY = valueToY(kf.value);
            const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);
            
            if (distance < 12) {
                setSelectedKeyframe(kf.id);
                setIsDragging(true);
                return;
            }
        }
        
        const newTime = xToTime(x);
        const newValue = yToValue(y);
        
        addKeyframe(newTime, newValue);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !selectedKeyframe) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newTime = Math.max(0, Math.min(clipDuration, xToTime(x)));
        const newValue = Math.max(minValue, Math.min(maxValue, yToValue(y)));
        
        updateKeyframe(selectedKeyframe, newTime, newValue);
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const addKeyframe = (time: number, value: number) => {
        const newKf: KeyframePoint = {
            id: `kf_${Date.now()}`,
            time,
            value,
            easing: 'linear'
        };
        
        const existingKfs = clip?.keyframes?.[propertyName] || [];
        const newKeyframes = [...existingKfs, newKf];
        
        updateClip(clipId, {
            keyframes: {
                ...clip?.keyframes,
                [propertyName]: newKeyframes
            }
        });
        
        setSelectedKeyframe(newKf.id);
    };
    
    const updateKeyframe = (kfId: string, time: number, value: number) => {
        const existingKfs = clip?.keyframes?.[propertyName] || [];
        const newKeyframes = existingKfs.map(kf => 
            kf.id === kfId ? { ...kf, time, value } : kf
        );
        
        updateClip(clipId, {
            keyframes: {
                ...clip?.keyframes,
                [propertyName]: newKeyframes
            }
        });

        // Live preview at the keyframe's absolute timeline time without changing play state
        if (clip && playerController) {
            const absoluteTime = clip.start + time;
            playerController.previewFrame(absoluteTime);
        }
    };
    
    const updateEasing = (easing: EasingType) => {
        if (!selectedKeyframe) return;
        
        const existingKfs = clip?.keyframes?.[propertyName] || [];
        const newKeyframes = existingKfs.map(kf => 
            kf.id === selectedKeyframe ? { ...kf, easing } : kf
        );
        
        updateClip(clipId, {
            keyframes: {
                ...clip?.keyframes,
                [propertyName]: newKeyframes
            }
        });
        
        setShowEasingMenu(false);
    };
    
    const deleteSelectedKeyframe = () => {
        if (!selectedKeyframe) return;
        
        const existingKfs = clip?.keyframes?.[propertyName] || [];
        const newKeyframes = existingKfs.filter(kf => kf.id !== selectedKeyframe);
        
        const updatedKeyframes: KeyframeMap = {
            ...clip?.keyframes,
        };
        if (newKeyframes.length > 0) {
            updatedKeyframes[propertyName] = newKeyframes;
        } else {
            delete updatedKeyframes[propertyName];
        }
        
        updateClip(clipId, {
            keyframes: updatedKeyframes
        });
        
        setSelectedKeyframe(null);
    };
    
    const selectedKf = sortedKeyframes.find(kf => kf.id === selectedKeyframe);
    
    return (
        <div ref={containerRef} className="bg-[#18181b] rounded-lg p-3 border border-[#27272a]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 capitalize">{propertyName}</span>
                <div className="flex items-center gap-2">
                    {selectedKf && (
                        <>
                            <span className="text-[10px] text-gray-500">
                                {selectedKf.time.toFixed(2)}s / {selectedKf.value.toFixed(2)}
                            </span>
                            <button
                                onClick={() => setShowEasingMenu(!showEasingMenu)}
                                className="text-[10px] px-2 py-0.5 bg-[#27272a] rounded hover:bg-[#3f3f46] text-gray-300"
                            >
                                {EASING_LABELS[selectedKf.easing]}
                            </button>
                            <button
                                onClick={deleteSelectedKeyframe}
                                className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {showEasingMenu && selectedKf && (
                <div className="absolute z-50 bg-[#27272a] rounded-md shadow-lg border border-[#3f3f46] py-1">
                    {(Object.keys(EASING_LABELS) as EasingType[]).map(easing => (
                        <button
                            key={easing}
                            onClick={() => updateEasing(easing)}
                            className={`block w-full text-left px-3 py-1 text-xs hover:bg-[#3f3f46] ${
                                selectedKf.easing === easing ? 'text-blue-400' : 'text-gray-300'
                            }`}
                        >
                            {EASING_LABELS[easing]}
                        </button>
                    ))}
                </div>
            )}
            
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="cursor-crosshair rounded"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
            
            <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-600">0s</span>
                <span className="text-[10px] text-gray-600">{clipDuration.toFixed(1)}s</span>
            </div>
        </div>
    );
};

export default KeyframeCurveEditor;

