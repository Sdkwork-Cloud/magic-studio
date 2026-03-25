
import { CutClip, CutClipTransform, BlendMode } from '../../../entities/magicCut.entity'
import React from 'react';
import { 
    Wand2, Scissors, Maximize, Eraser
} from 'lucide-react';
import { PropertySection, SliderRow, ActionButton } from '../widgets/PropertyWidgets';
;
import { VisualTransformPanel } from './VisualTransformPanel';
import {
    resolveImageToolAvailability,
    type ImageToolId
} from '../../../domain/image/imageToolAvailability';
import { useMagicCutTranslation } from '../../../hooks/useMagicCutTranslation';

interface ImageSettingsPanelProps {
    clip: CutClip;
    onUpdate: (updates: Partial<CutClip>) => void;
    onUpdateTransform: (transform: Partial<CutClipTransform>) => void;
}

export const ImageSettingsPanel: React.FC<ImageSettingsPanelProps> = ({ 
    clip, onUpdate, onUpdateTransform 
}) => {
    const { t } = useMagicCutTranslation();
    const aiTools = resolveImageToolAvailability();

    // Helper to access style safely
    const getStyle = (key: string, def: number) => (clip.style?.[key] as number) ?? def;
    
    const updateStyle = (key: string, val: number) => {
        onUpdate({ style: { ...clip.style, [key]: val } });
    };

    const getToolIcon = (toolId: ImageToolId): React.ReactNode => {
        switch (toolId) {
            case 'remove-bg':
                return <Scissors />;
            case 'upscale':
                return <Maximize />;
            case 'erase':
                return <Eraser />;
            case 'remix':
                return <Wand2 />;
            default:
                return null;
        }
    };

    const getToolLabel = (toolId: ImageToolId): string => {
        switch (toolId) {
            case 'remove-bg':
                return t('imageSettings.tools.removeBg');
            case 'upscale':
                return t('imageSettings.tools.upscale4k');
            case 'erase':
                return t('imageSettings.tools.magicEraser');
            case 'remix':
                return t('imageSettings.tools.remix');
            default:
                return '';
        }
    };

    const getToolReason = (toolId: ImageToolId): string => {
        switch (toolId) {
            case 'remove-bg':
                return t('imageSettings.reasons.removeBg');
            case 'upscale':
                return t('imageSettings.reasons.upscale4k');
            case 'erase':
                return t('imageSettings.reasons.magicEraser');
            case 'remix':
                return t('imageSettings.reasons.remix');
            default:
                return '';
        }
    };

    return (
        <>
            {/* 1. AI Toolbox (Top) */}
            <PropertySection title={t('imageSettings.sections.aiToolbox')} defaultOpen>
                <div className="grid grid-cols-2 gap-2">
                    {aiTools.map((tool) => (
                        <ActionButton 
                            key={tool.id}
                            label={getToolLabel(tool.id)} 
                            icon={getToolIcon(tool.id)} 
                            disabled={!tool.available}
                            title={getToolReason(tool.id)}
                            variant={tool.id === 'remix' ? 'primary' : 'secondary'}
                        />
                    ))}
                </div>
                <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-100">
                        {t('imageSettings.messages.assetWorkflowRequired')}
                    </div>
                    <div className="mt-2 space-y-2">
                        {aiTools.map((tool) => (
                            <div key={tool.id}>
                                <div className="text-[11px] font-medium text-gray-100">{getToolLabel(tool.id)}</div>
                                <p className="mt-0.5 text-[10px] leading-4 text-amber-100/75">{getToolReason(tool.id)}</p>
                            </div>
                        ))}
                    </div>
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
                onReset={() => onUpdateTransform({ x:0, y:0, scale:1, scaleX: 1, scaleY: 1, rotation:0, opacity:1 })}
            />

            {/* 3. Color Adjustments */}
            <PropertySection title={t('imageSettings.sections.colorCorrection')}>
                <div className="space-y-3 px-1">
                    <SliderRow 
                        label={t('effects.brightness')} 
                        value={getStyle('brightness', 0)} 
                        onChange={(v) => updateStyle('brightness', v)}
                        min={-1} max={1} step={0.05} defaultValue={0}
                    />
                    <SliderRow 
                        label={t('effects.contrast')} 
                        value={getStyle('contrast', 1)} 
                        onChange={(v) => updateStyle('contrast', v)}
                        min={0} max={2} step={0.05} defaultValue={1}
                    />
                    <SliderRow 
                        label={t('effects.saturation')} 
                        value={getStyle('saturation', 1)} 
                        onChange={(v) => updateStyle('saturation', v)}
                        min={0} max={2} step={0.05} defaultValue={1}
                    />
                    <SliderRow 
                        label={t('imageSettings.fields.temperature')} 
                        value={getStyle('temperature', 0)} 
                        onChange={(v) => updateStyle('temperature', v)}
                        min={-1} max={1} step={0.05} defaultValue={0}
                    />
                </div>
            </PropertySection>

            {/* 4. Filters (Placeholder) */}
            <PropertySection title={t('imageSettings.sections.filters')}>
                <div className="text-xs text-gray-500 text-center py-2 italic">
                    {t('imageSettings.messages.useEffectsTab')}
                </div>
            </PropertySection>
        </>
    );
};

