import React, { useState } from 'react';
import { 
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
    Type, MoveHorizontal, MoveVertical,
    Heading1
} from 'lucide-react';
import { PropertySection, ScrubbableInput, ColorPicker, SegmentedControl } from '../widgets/PropertyWidgets';
import { DEFAULT_TEXT_STYLE, TextStyle } from '../../../engine/text/TextRenderer';
import { PromptTextInput } from '@sdkwork/react-assets';
import { genAIService } from '@sdkwork/react-core';
import { useMagicCutTranslation } from '../../../hooks/useMagicCutTranslation';

interface TextSettingsPanelProps {
    content: string;
    onContentChange: (val: string) => void;
    style: Partial<TextStyle>;
    onStyleChange: (key: string, value: TextStyle[keyof TextStyle]) => void;
}

export const TextSettingsPanel: React.FC<TextSettingsPanelProps> = ({ 
    content, onContentChange, style, onStyleChange 
}) => {
    const { t } = useMagicCutTranslation();
    const [isEnhancing, setIsEnhancing] = useState(false);

    const getStyle = <K extends keyof TextStyle>(key: K): TextStyle[K] => {
        return (style[key] ?? DEFAULT_TEXT_STYLE[key]) as TextStyle[K];
    };
    
    // Derived values
    const strokeWidth = getStyle('strokeWidth') || 0;
    const hasStroke = strokeWidth > 0;
    const bgColor = getStyle('backgroundColor');
    const hasBg = !!(bgColor && bgColor !== 'transparent');
    const shadowColor = getStyle('shadowColor');
    const hasShadow = !!(shadowColor && shadowColor !== 'transparent' && shadowColor !== 'rgba(0,0,0,0)' && ((getStyle('shadowBlur') || 0) > 0 || getStyle('shadowOffsetX') !== 0));

    // Color helpers
    const handleColorChange = (key: string, newVal: string) => {
        onStyleChange(key, newVal);
    };

    const handleEnhanceText = async (currentText: string): Promise<string> => {
        if (!currentText) return "";
        setIsEnhancing(true);
        try {
            // Contextually different prompt for titles vs long scripts
            const enhanced = await genAIService.enhancePrompt(currentText);
            onContentChange(enhanced);
            return enhanced;
        } catch (e) {
            console.error(e);
            return currentText;
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <>
            {/* 1. Content Input (Always visible) */}
            <div className="p-3 border-b border-[#1f1f22] bg-[#141414]">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <Type size={12} /> {t('textSettings.sections.content')}
                </div>
                
                <PromptTextInput 
                    label={null}
                    value={content}
                    onChange={onContentChange}
                    className="bg-[#09090b]"
                    placeholder={t('textSettings.placeholders.enterText')}
                    rows={3}
                    onEnhance={handleEnhanceText}
                    isEnhancing={isEnhancing}
                />
            </div>

            {/* 2. Character (Font, Weight, Size) */}
            <PropertySection title={t('textSettings.sections.character')}>
                <div className="space-y-3">
                    <select 
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-2 py-1.5 text-[11px] text-gray-200 outline-none focus:border-blue-500 hover:border-[#3f3f46] transition-colors cursor-pointer"
                        value={getStyle('fontFamily')}
                        onChange={(e) => onStyleChange('fontFamily', e.target.value)}
                    >
                        <optgroup label={t('textSettings.fontGroups.sansSerif')}>
                            <option value="Inter, system-ui, sans-serif">Inter</option>
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="Impact, sans-serif">Impact</option>
                            <option value="Helvetica, sans-serif">Helvetica</option>
                        </optgroup>
                        <optgroup label={t('textSettings.fontGroups.serif')}>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="Georgia, serif">Georgia</option>
                        </optgroup>
                        <optgroup label={t('textSettings.fontGroups.monospace')}>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                        </optgroup>
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                        <ScrubbableInput 
                            label={<Heading1 size={12} />} 
                            value={getStyle('fontSize')} 
                            onChange={(v) => onStyleChange('fontSize', v)} 
                            min={1} max={500} 
                            suffix="px"
                        />
                        <div className="flex gap-1">
                             <button 
                                onClick={() => onStyleChange('fontWeight', getStyle('fontWeight') === 'bold' ? 'normal' : 'bold')} 
                                className={`flex-1 flex justify-center items-center rounded-md border text-gray-400 hover:text-white transition-colors ${getStyle('fontWeight') === 'bold' ? 'bg-[#27272a] border-[#444] text-white' : 'bg-[#09090b] border-[#27272a]'}`}
                                title={t('textSettings.actions.bold')}
                             >
                                 <Bold size={14} />
                             </button>
                             <button 
                                onClick={() => onStyleChange('fontStyle', getStyle('fontStyle') === 'italic' ? 'normal' : 'italic')} 
                                className={`flex-1 flex justify-center items-center rounded-md border text-gray-400 hover:text-white transition-colors ${getStyle('fontStyle') === 'italic' ? 'bg-[#27272a] border-[#444] text-white' : 'bg-[#09090b] border-[#27272a]'}`}
                                title={t('textSettings.actions.italic')}
                             >
                                 <Italic size={14} />
                             </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <ScrubbableInput 
                            label={<MoveVertical size={12} />}
                            value={getStyle('lineHeight') || 1} 
                            onChange={(v: number) => onStyleChange('lineHeight', v)} 
                            step={0.1} min={0.5} max={3} 
                            suffix="em"
                            className="text-gray-400"
                        />
                         <ScrubbableInput 
                            label={<MoveHorizontal size={12} />}
                            value={getStyle('letterSpacing') || 0} 
                            onChange={(v: number) => onStyleChange('letterSpacing', v)} 
                            step={0.01} min={-0.5} max={1} 
                            suffix="em"
                            className="text-gray-400"
                        />
                    </div>
                </div>
            </PropertySection>

            {/* 3. Paragraph (Alignment) */}
            <PropertySection title={t('textSettings.sections.paragraph')}>
                <SegmentedControl 
                    value={getStyle('textAlign') || 'left'}
                    onChange={(v) => onStyleChange('textAlign', v)}
                    options={[
                        { value: 'left', icon: <AlignLeft size={14} /> },
                        { value: 'center', icon: <AlignCenter size={14} /> },
                        { value: 'right', icon: <AlignRight size={14} /> },
                    ]}
                />
            </PropertySection>

            {/* 4. Appearance (Fill & Stroke) */}
            <PropertySection title={t('textSettings.sections.appearance')}>
                <div className="space-y-4">
                    {/* Fill */}
                    <div>
                         <ColorPicker 
                            label={t('textSettings.fields.fillColor')} 
                            value={getStyle('color')} 
                            onChange={(v) => handleColorChange('color', v)} 
                        />
                    </div>
                    
                    <div className="h-px bg-[#1f1f22]" />

                    {/* Stroke */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[11px] text-gray-400 font-medium">{t('textSettings.fields.stroke')}</label>
                            <button 
                                onClick={() => onStyleChange('strokeWidth', hasStroke ? 0 : 2)}
                                className={`w-8 h-4 rounded-full relative transition-colors ${hasStroke ? 'bg-blue-600' : 'bg-[#333]'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${hasStroke ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        
                        {hasStroke && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <ColorPicker 
                                    label={t('textSettings.fields.color')} 
                                    value={getStyle('strokeColor') as string} 
                                    onChange={(v: string) => handleColorChange('strokeColor', v)} 
                                />
                                <ScrubbableInput 
                                    label={t('textSettings.fields.width')} 
                                    value={strokeWidth} 
                                    onChange={(v: number) => onStyleChange('strokeWidth', Math.max(0, v))} 
                                    min={0} max={100} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </PropertySection>

            {/* 5. Background */}
            <PropertySection 
                title={t('textSettings.sections.background')} 
                enabled={hasBg} 
                onToggle={(val: boolean) => onStyleChange('backgroundColor', val ? '#000000' : 'transparent')}
            >
                <div className="space-y-2">
                    <ColorPicker 
                        label={t('textSettings.fields.color')} 
                        value={(hasBg ? bgColor : '#000000') as string} 
                        onChange={(v: string) => onStyleChange('backgroundColor', v)} 
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <ScrubbableInput 
                            label={t('textSettings.fields.padding')} 
                            value={getStyle('backgroundPadding') || 0} 
                            onChange={(v: number) => onStyleChange('backgroundPadding', v)} 
                            min={0} max={200} 
                        />
                        <ScrubbableInput 
                            label={t('textSettings.fields.radius')} 
                            value={getStyle('backgroundCornerRadius') || 0} 
                            onChange={(v: number) => onStyleChange('backgroundCornerRadius', v)} 
                            min={0} max={100} 
                        />
                    </div>
                </div>
            </PropertySection>

            {/* 6. Drop Shadow */}
            <PropertySection 
                title={t('textSettings.sections.dropShadow')}
                enabled={hasShadow}
                onToggle={(val: boolean) => {
                    if (val) {
                        onStyleChange('shadowColor', 'rgba(0,0,0,0.5)');
                        onStyleChange('shadowBlur', 10);
                        onStyleChange('shadowOffsetY', 5);
                    } else {
                        onStyleChange('shadowColor', 'transparent');
                        onStyleChange('shadowBlur', 0);
                        onStyleChange('shadowOffsetX', 0);
                        onStyleChange('shadowOffsetY', 0);
                    }
                }}
            >
                 <div className="space-y-2">
                    <ColorPicker 
                        label={t('textSettings.fields.color')} 
                        value={(getStyle('shadowColor') || '#000000') as string} 
                        onChange={(v: string) => onStyleChange('shadowColor', v)} 
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <ScrubbableInput label="X" value={getStyle('shadowOffsetX') || 0} onChange={(v: number) => onStyleChange('shadowOffsetX', v)} />
                        <ScrubbableInput label="Y" value={getStyle('shadowOffsetY') || 0} onChange={(v: number) => onStyleChange('shadowOffsetY', v)} />
                    </div>
                    <ScrubbableInput label={t('textSettings.fields.blur')} value={getStyle('shadowBlur') || 0} onChange={(v: number) => onStyleChange('shadowBlur', v)} min={0} max={100} />
                </div>
            </PropertySection>
        </>
    );
};
