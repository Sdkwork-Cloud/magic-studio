
import { CutClip, CutClipTransform, BlendMode } from '../../../entities/magicCut.entity'
import React from 'react';
import { 
    Wand2, Scissors, Maximize, Palette, Layers, Sliders, Eraser
} from 'lucide-react';
import { PropertySection, SliderRow, ActionButton } from '../widgets/PropertyWidgets';
;
import { VisualTransformPanel } from './VisualTransformPanel';

interface ImageSettingsPanelProps {
    clip: CutClip;
    onUpdate: (updates: Partial<CutClip>) => void;
    onUpdateTransform: (transform: Partial<CutClipTransform>) => void;
}

export const ImageSettingsPanel: React.FC<ImageSettingsPanelProps> = ({ 
    clip, onUpdate, onUpdateTransform 
}) => {
    // Helper to access style safely
    const getStyle = (key: string, def: number) => (clip.style?.[key] as number) ?? def;
    
    const updateStyle = (key: string, val: number) => {
        onUpdate({ style: { ...clip.style, [key]: val } });
    };

    const handleAITool = (tool: string) => {
    };

    return (
        <>
            {/* 1. AI Toolbox (Top) */}
            <PropertySection title="AI Toolbox" defaultOpen>
                <div className="grid grid-cols-2 gap-2">
                    <ActionButton 
                        label="Remove BG" 
                        icon={<Scissors />} 
                        onClick={() => handleAITool('remove-bg')} 
                    />
                    <ActionButton 
                        label="Upscale 4K" 
                        icon={<Maximize />} 
                        onClick={() => handleAITool('upscale')} 
                    />
                    <ActionButton 
                        label="Magic Eraser" 
                        icon={<Eraser />} 
                        onClick={() => handleAITool('erase')} 
                    />
                    <ActionButton 
                        label="Remix" 
                        icon={<Wand2 />} 
                        onClick={() => handleAITool('remix')} 
                        variant="primary"
                    />
                </div>
            </PropertySection>

            {/* 2. Transform (Composed) */}
            <VisualTransformPanel 
                transform={clip.transform}
                blendMode={clip.blendMode}
                onChange={(k, v) => {
                    onUpdateTransform(v);
                }}
                onChangeBlendMode={(k, v) => {
                    onUpdate({ blendMode: v });
                }}
                onReset={() => onUpdateTransform({ x:0, y:0, scale:1, rotation:0, opacity:1 })}
            />

            {/* 3. Color Adjustments */}
            <PropertySection title="Color Correction">
                <div className="space-y-3 px-1">
                    <SliderRow 
                        label="Brightness" 
                        value={getStyle('brightness', 0)} 
                        onChange={(v) => updateStyle('brightness', v)}
                        min={-1} max={1} step={0.05} defaultValue={0}
                    />
                    <SliderRow 
                        label="Contrast" 
                        value={getStyle('contrast', 1)} 
                        onChange={(v) => updateStyle('contrast', v)}
                        min={0} max={2} step={0.05} defaultValue={1}
                    />
                    <SliderRow 
                        label="Saturation" 
                        value={getStyle('saturation', 1)} 
                        onChange={(v) => updateStyle('saturation', v)}
                        min={0} max={2} step={0.05} defaultValue={1}
                    />
                    <SliderRow 
                        label="Temp" 
                        value={getStyle('temperature', 0)} 
                        onChange={(v) => updateStyle('temperature', v)}
                        min={-1} max={1} step={0.05} defaultValue={0}
                    />
                </div>
            </PropertySection>

            {/* 4. Filters (Placeholder) */}
            <PropertySection title="Filters">
                <div className="text-xs text-gray-500 text-center py-2 italic">
                    Use "Effects" tab to add filters
                </div>
            </PropertySection>
        </>
    );
};

