
import { CutLayer, CutClip } from '../../../entities/magicCut.entity'
import { EffectDefinition } from '../../../entities/effect.entity'
import React, { useState } from 'react';
import { Sliders, Trash2, Sparkles, Palette, ChevronRight, Eye, EyeOff } from 'lucide-react';
;
import { effectRegistry } from '../../../services/effects/EffectRegistry';
;
import { ScrubbableInput, ColorPicker, Dropdown } from '../widgets/PropertyWidgets';

interface EffectsListPanelProps {
    layers: CutLayer[];
    onUpdateLayers: (layers: CutLayer[]) => void;
}

export const EffectsListPanel: React.FC<EffectsListPanelProps> = ({ layers, onUpdateLayers }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleEffect = (id: string) => {
        onUpdateLayers(layers.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
    };

    const removeLayer = (id: string) => {
        onUpdateLayers(layers.filter(l => l.id !== id));
    };

    const updateLayerParams = (id: string, params: Record<string, any>) => {
        onUpdateLayers(layers.map(l => l.id === id ? { ...l, params: { ...l.params, ...params } } : l));
    };

    return (
        <div className="p-3 space-y-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Effects Stack</span>
                <span className="text-[9px] bg-[#27272a] text-gray-500 px-1.5 py-0.5 rounded border border-[#333] font-mono">{layers.length}</span>
            </div>
            
            {layers.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-[10px] border-2 border-dashed border-[#1f1f22] rounded-lg flex flex-col items-center gap-2 select-none">
                    <Palette size={16} className="opacity-20" />
                    Drop effects from sidebar
                </div>
            ) : (
                <div className="space-y-2">
                    {layers.map((layer, i) => {
                         const def = effectRegistry.get(layer.params.definitionId);
                         const isExpanded = expandedId === layer.id;

                         return (
                            <div key={layer.id} className={`bg-[#18181b] border ${isExpanded ? 'border-blue-500/30' : 'border-[#27272a]'} rounded-lg transition-colors overflow-hidden`}>
                                {/* Header */}
                                <div 
                                    className="flex justify-between items-center p-2 cursor-pointer hover:bg-[#1e1e20]"
                                    onClick={() => setExpandedId(isExpanded ? null : layer.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); toggleEffect(layer.id); }} className={`text-gray-500 hover:text-white transition-colors ${!layer.enabled ? 'opacity-50' : ''}`}>
                                            {layer.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                                        </button>
                                        <div className="w-px h-3 bg-[#333]" />
                                        <span className={`text-[11px] font-bold leading-tight ${layer.enabled ? 'text-gray-300' : 'text-gray-500 line-through'}`}>
                                            {def ? def.name : layer.type}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-1">
                                         <ChevronRight size={12} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                                
                                {/* Parameters Body */}
                                {isExpanded && (
                                    <div className="p-3 border-t border-[#27272a] bg-[#141416] space-y-3 animate-in slide-in-from-top-1 fade-in duration-150">
                                        {def ? (
                                            <EffectParamsEditor 
                                                definition={def} 
                                                values={layer.params} 
                                                onChange={(newParams) => updateLayerParams(layer.id, newParams)} 
                                            />
                                        ) : (
                                            <div className="text-[10px] text-red-500">Effect definition not found.</div>
                                        )}
                                        
                                        <div className="pt-2 mt-2 border-t border-[#27272a] flex justify-end">
                                             <button 
                                                onClick={() => removeLayer(layer.id)} 
                                                className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] rounded transition-colors"
                                            >
                                                <Trash2 size={10} /> Remove Effect
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Sub-component: Parameter Generation ---

const EffectParamsEditor: React.FC<{ 
    definition: EffectDefinition; 
    values: Record<string, unknown>; 
    onChange: (p: Record<string, unknown>) => void;
}> = ({ definition, values, onChange }) => {
    
    const handleChange = (key: string, val: unknown) => {
        onChange({ [key]: val });
    };

    return (
        <>
            {Object.entries(definition.parameters).map(([key, schema]) => {
                const value = values[key] ?? schema.default;
                
                if (schema.type === 'float' || schema.type === 'int') {
                    return (
                        <ScrubbableInput 
                            key={key}
                            label={schema.label}
                            value={Number(value)}
                            onChange={(v) => handleChange(key, v)}
                            min={schema.min}
                            max={schema.max}
                            step={schema.step || 0.01}
                            fullWidth
                        />
                    );
                }

                if (schema.type === 'color') {
                    return (
                        <ColorPicker 
                            key={key}
                            label={schema.label}
                            value={String(value)}
                            onChange={(v) => handleChange(key, v)}
                        />
                    );
                }
                
                if (schema.type === 'vec2') {
                    const vec = (value as {x: number, y: number}) || {x: 0, y: 0};
                    return (
                        <div key={key}>
                            <label className="text-[10px] text-gray-400 font-medium mb-1 block">{schema.label}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <ScrubbableInput label="X" value={vec.x} onChange={(v) => handleChange(key, { ...vec, x: v })} step={0.01} />
                                <ScrubbableInput label="Y" value={vec.y} onChange={(v) => handleChange(key, { ...vec, y: v })} step={0.01} />
                            </div>
                        </div>
                    );
                }
                
                if (schema.type === 'select' && schema.options) {
                     return (
                         <Dropdown 
                            key={key}
                            label={schema.label}
                            value={String(value)}
                            onChange={(v) => handleChange(key, v)}
                            options={schema.options}
                         />
                     );
                }

                return null;
            })}
        </>
    );
};

