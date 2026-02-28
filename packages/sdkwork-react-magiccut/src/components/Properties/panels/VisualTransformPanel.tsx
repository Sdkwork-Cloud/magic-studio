import { CutClipTransform, BlendMode } from '../../../entities/magicCut.entity'
import React from 'react';
import { Scaling, RotateCw, Move, FlipHorizontal, FlipVertical, Maximize } from 'lucide-react';
import { PropertySection, ScrubbableInput, Dropdown } from '../widgets/PropertyWidgets';

interface VideoSettingsPanelProps {
    transform?: CutClipTransform;
    blendMode?: BlendMode;
    onChange: (key: 'transform', value: CutClipTransform) => void;
    onChangeBlendMode: (key: 'blendMode', value: BlendMode) => void;
    onReset: () => void;
}

const BLEND_MODES: { label: string; value: BlendMode }[] = [
    { label: 'Normal', value: 'normal' },
    { label: 'Screen', value: 'screen' },
    { label: 'Multiply', value: 'multiply' },
    { label: 'Overlay', value: 'overlay' },
    { label: 'Add (Linear Dodge)', value: 'add' },
    { label: 'Darken', value: 'darken' },
    { label: 'Lighten', value: 'lighten' },
];

export const VisualTransformPanel: React.FC<VideoSettingsPanelProps> = ({
    transform = { x: 0, y: 0, width: 100, height: 100, scale: 1, rotation: 0, opacity: 1 },
    blendMode = 'normal',
    onChange,
    onChangeBlendMode,
    onReset
}) => {
    const handleUpdateTransform = (key: keyof CutClipTransform, value: number) => {
        const newTransform = { ...transform, [key]: value };
        onChange('transform', newTransform);
    };

    const handleFlip = (_axis: 'h' | 'v') => {
        // Data model currently has only uniform scale, so true axis-specific flipping is not supported yet.
        console.warn('Flip requires separate scaleX/scaleY in the transform model.');
    };

    const handleFit = () => {
        // Reset to center/fit logic
        // This usually requires knowing project resolution, passed via props.
        // Reset transform basics for now.
        onChange('transform', {
            x: 0,
            y: 0,
            width: transform.width,
            height: transform.height,
            scale: 1,
            rotation: 0,
            opacity: transform.opacity
        });
    };

    return (
        <>
            {/* TRANSFORM SECTION */}
            <PropertySection title="Transform" defaultOpen onReset={onReset}>
                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                    <ScrubbableInput
                        label="X"
                        value={Math.round(transform.x)}
                        onChange={(v) => handleUpdateTransform('x', v)}
                        icon={<Move size={10} />}
                    />
                    <ScrubbableInput
                        label="Y"
                        value={Math.round(transform.y)}
                        onChange={(v) => handleUpdateTransform('y', v)}
                    />
                </div>

                {/* Scale & Rotation */}
                <div className="grid grid-cols-2 gap-2">
                    <ScrubbableInput
                        label="Scale"
                        value={Math.round((transform.scale ?? 1) * 100)}
                        onChange={(v) => handleUpdateTransform('scale', v / 100)}
                        suffix="%"
                        icon={<Scaling size={10} />}
                        step={1}
                    />
                    <ScrubbableInput
                        label="Rotate"
                        value={Math.round(transform.rotation ?? 0)}
                        onChange={(v) => handleUpdateTransform('rotation', v)}
                        suffix="deg"
                        icon={<RotateCw size={10} />}
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1 pt-1">
                    <button
                        onClick={handleFit}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#252526] hover:bg-[#333] border border-[#27272a] rounded text-[10px] text-gray-400 hover:text-white transition-colors"
                        title="Reset Position/Scale"
                    >
                        <Maximize size={12} /> Fit
                    </button>
                    <button
                        onClick={() => handleFlip('h')}
                        className="flex-none w-8 flex items-center justify-center bg-[#252526] hover:bg-[#333] border border-[#27272a] rounded text-gray-400 hover:text-white transition-colors"
                        title="Flip Horizontal (WIP)"
                    >
                        <FlipHorizontal size={12} />
                    </button>
                    <button
                        onClick={() => handleFlip('v')}
                        className="flex-none w-8 flex items-center justify-center bg-[#252526] hover:bg-[#333] border border-[#27272a] rounded text-gray-400 hover:text-white transition-colors"
                        title="Flip Vertical (WIP)"
                    >
                        <FlipVertical size={12} />
                    </button>
                </div>
            </PropertySection>

            {/* COMPOSITING SECTION */}
            <PropertySection title="Compositing" defaultOpen>
                <div className="space-y-3">
                    <ScrubbableInput
                        label="Opacity"
                        value={Math.round((transform.opacity ?? 1) * 100)}
                        onChange={(v) => handleUpdateTransform('opacity', v / 100)}
                        min={0}
                        max={100}
                        suffix="%"
                        fullWidth
                    />

                    <Dropdown
                        label="Blend Mode"
                        value={blendMode}
                        onChange={(v) => onChangeBlendMode('blendMode', v as BlendMode)}
                        options={BLEND_MODES}
                    />
                </div>
            </PropertySection>
        </>
    );
};
