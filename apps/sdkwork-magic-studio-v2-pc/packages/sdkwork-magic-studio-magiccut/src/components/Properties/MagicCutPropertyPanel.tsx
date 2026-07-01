
import React, { useMemo, useState } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { 
    Volume2, Sparkles, Clock, Type as TypeIcon,
    Move, Ghost, Image as ImageIcon, Mic, Rewind, FastForward
} from 'lucide-react';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import { CutClip } from '../../entities/magicCut.entity';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import { DEFAULT_TEXT_STYLE } from '../../engine/text/TextRenderer';
import { VisualTransformPanel } from './panels/VisualTransformPanel';
import { TextSettingsPanel } from './panels/TextSettingsPanel';
import { AudioSettingsPanel } from './panels/AudioSettingsPanel';
import { EffectsListPanel } from './panels/EffectsListPanel';
import { ImageSettingsPanel } from './panels/ImageSettingsPanel';
import { VoiceSettingsPanel } from './panels/VoiceSettingsPanel';
import { ScrubbableInput } from './widgets/PropertyWidgets';
import type { LucideIcon } from 'lucide-react';

type TabType = 'transform' | 'text' | 'audio' | 'effect' | 'speed' | 'image' | 'voice';

interface TabDefinition {
    id: TabType;
    label: string;
    icon: LucideIcon;
}

const resolvePreferredTabForResource = (resourceType: MediaResourceType): TabType => {
    if (resourceType === MediaResourceType.TEXT || resourceType === MediaResourceType.SUBTITLE) {
        return 'text';
    }
    if (resourceType === MediaResourceType.IMAGE) {
        return 'image';
    }
    if (resourceType === MediaResourceType.VOICE || resourceType === MediaResourceType.SPEECH) {
        return 'voice';
    }
    if (resourceType === MediaResourceType.AUDIO || resourceType === MediaResourceType.MUSIC) {
        return 'audio';
    }
    if (resourceType === MediaResourceType.EFFECT) {
        return 'effect';
    }
    return 'transform';
};

export const MagicCutPropertyPanel: React.FC = () => {
    const { 
        selectedClipId, getClip, getClipResource,
        updateClipTransform, updateClip, updateClipLayers, 
        updateResource,
        setClipSpeed, state
    } = useMagicCutStore();
    
    // Internal state for tab, synchronized with selection
    const [tabState, setTabState] = useState<{ seed: string; activeTab: TabType }>({
        seed: '',
        activeTab: 'transform'
    });
    
    const clip = selectedClipId ? getClip(selectedClipId) : null;
    const resource = selectedClipId ? getClipResource(selectedClipId) : null;

    // Determine Capabilities for Tab Bar
    const tabs: TabDefinition[] = useMemo(() => {
        if (!resource) return [];
        const t = resource.type;
        const list: TabDefinition[] = [];
        
        const isVisual = [MediaResourceType.VIDEO, MediaResourceType.IMAGE].includes(t);
        const isAudio = [MediaResourceType.AUDIO, MediaResourceType.VIDEO, MediaResourceType.MUSIC, MediaResourceType.VOICE, MediaResourceType.SPEECH].includes(t);
        const isText = t === MediaResourceType.TEXT || t === MediaResourceType.SUBTITLE;
        const isImage = t === MediaResourceType.IMAGE;
        const isVoice = t === MediaResourceType.VOICE || t === MediaResourceType.SPEECH;

        if (isText) {
             list.push({ id: 'text', label: 'Text', icon: TypeIcon });
             list.push({ id: 'transform', label: 'Layout', icon: Move });
             list.push({ id: 'effect', label: 'Effects', icon: Sparkles });
        } else if (isImage) {
             list.push({ id: 'image', label: 'Image', icon: ImageIcon });
             list.push({ id: 'effect', label: 'Effects', icon: Sparkles });
        } else if (isVoice) {
             list.push({ id: 'voice', label: 'Voice', icon: Mic });
             list.push({ id: 'audio', label: 'Mixer', icon: Volume2 });
             list.push({ id: 'effect', label: 'Effects', icon: Sparkles });
        } else if (isAudio && !isVisual) {
             list.push({ id: 'audio', label: 'Audio', icon: Volume2 });
             list.push({ id: 'speed', label: 'Speed', icon: Clock });
             list.push({ id: 'effect', label: 'Effects', icon: Sparkles });
        } else {
             // Standard Video
             list.push({ id: 'transform', label: 'Video', icon: Move });
             if (isAudio) list.push({ id: 'audio', label: 'Audio', icon: Volume2 });
             list.push({ id: 'speed', label: 'Speed', icon: Clock });
             list.push({ id: 'effect', label: 'Effects', icon: Sparkles });
        }

        return list;
    }, [resource]);
    const selectionSeed = selectedClipId || '';
    const preferredTab = resource ? resolvePreferredTabForResource(resource.type) : 'transform';
    const activeTab = useMemo(() => {
        const candidate = tabState.seed === selectionSeed ? tabState.activeTab : preferredTab;
        return tabs.some((tab) => tab.id === candidate) ? candidate : (tabs[0]?.id || preferredTab);
    }, [preferredTab, selectionSeed, tabState, tabs]);

    if (!clip || !resource) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#050505] text-gray-500 select-none border-l border-[#1a1a1a]">
                <div className="w-12 h-12 rounded-2xl bg-[#111] flex items-center justify-center mb-3 shadow-inner border border-[#1a1a1a]">
                    <Ghost size={20} className="opacity-20" />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-60">No Selection</p>
                <p className="text-[9px] text-gray-600 mt-1">Select a clip to edit properties</p>
            </div>
        );
    }

    // Handlers
    const clipStyle = clip.style || {};
    const baseMeta = (resource as any).metadata || {};
    const textStyle = { ...DEFAULT_TEXT_STYLE, ...baseMeta, ...clipStyle };
    const PRESET_SPEEDS = [0.5, 1.0, 1.5, 2.0, 4.0];
    const clipKey = resolveEntityKey(clip);
    const resourceKey = resolveEntityKey(resource);
    
    return (
        <div className="h-full flex flex-col bg-[#050505] text-gray-200 overflow-hidden font-sans border-l border-[#1a1a1a]">
            
            {/* 1. Compact Tab Bar (No File Name Header) */}
            <div className="flex-none h-9 border-b border-[#1a1a1a] bg-[#09090b] flex items-center px-1 overflow-x-auto no-scrollbar gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setTabState({ seed: selectionSeed, activeTab: tab.id })}
                        className={`
                            flex items-center gap-1.5 px-3 h-full border-b-2 text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'border-blue-500 text-white' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                            }
                        `}
                    >
                        <tab.icon size={12} className={activeTab === tab.id ? 'text-blue-400' : 'opacity-50'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111] p-1">
                
                {/* SPECIALIZED PANELS */}
                
                {activeTab === 'image' && (
                    <ImageSettingsPanel 
                        clip={clip}
                        onUpdate={(updates) => updateClip(clipKey, updates)}
                        onUpdateTransform={(t) => updateClipTransform(clipKey, t, true)}
                    />
                )}

                {activeTab === 'voice' && (
                    <VoiceSettingsPanel 
                        clip={clip}
                        resource={resource}
                        onUpdate={(updates) => updateClip(clipKey, updates)}
                        onUpdateResource={(updates) => updateResource(resourceKey, updates)}
                    />
                )}

                {/* STANDARD PANELS */}

                {activeTab === 'transform' && (
                    <VisualTransformPanel 
                        transform={clip.transform}
                        blendMode={clip.blendMode}
                        onChange={(k, v) => {
                            updateClipTransform(clipKey, v, true);
                        }}
                        onChangeBlendMode={(k, v) => {
                            updateClip(clipKey, { blendMode: v });
                        }}
                        onReset={() => {
                            updateClipTransform(clipKey, { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 }, true);
                            updateClip(clipKey, { blendMode: 'normal' });
                        }}
                    />
                )}

                {activeTab === 'text' && (
                    <TextSettingsPanel 
                        content={clip.content || resource.metadata?.text || resource.name}
                        onContentChange={(val) => updateClip(clipKey, { content: val })}
                        style={textStyle}
                        onStyleChange={(k, v) => updateClip(clipKey, { style: { ...clip.style, [k]: v } })}
                    />
                )}

                {activeTab === 'audio' && (
                    <AudioSettingsPanel 
                        clip={clip}
                        onUpdate={(updates: Partial<CutClip>) => updateClip(clipKey, updates)}
                    />
                )}
                
                {activeTab === 'speed' && (
                    <div className="p-3 space-y-4">
                         <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock size={12} /> Playback Speed
                                </label>
                                <div className="w-16">
                                    <ScrubbableInput 
                                        value={clip.speed ?? 1} 
                                        onChange={(v) => setClipSpeed(clipKey, Math.max(0.1, v))} 
                                        step={0.1} min={0.1} max={10} 
                                        suffix="x"
                                    />
                                </div>
                            </div>
                            
                            {/* Slider */}
                            <div className="h-6 flex items-center gap-3 bg-[#18181b] border border-[#27272a] rounded-lg px-2 group">
                                <span className="text-[9px] text-gray-500"><Rewind size={10} /></span>
                                <div className="flex-1 relative h-4 flex items-center">
                                    <input 
                                        type="range" 
                                        min="0.1" max="4" step="0.1"
                                        value={clip.speed ?? 1}
                                        onChange={(e) => setClipSpeed(clipKey, parseFloat(e.target.value))}
                                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-75" 
                                            style={{ width: `${((Math.min(4, clip.speed ?? 1) - 0.1) / 3.9) * 100}%` }} 
                                        />
                                    </div>
                                    <div 
                                        className="absolute w-2 h-2 bg-white rounded-full shadow pointer-events-none transition-all duration-75"
                                        style={{ left: `${((Math.min(4, clip.speed ?? 1) - 0.1) / 3.9) * 100}%`, transform: 'translateX(-50%)' }}
                                    />
                                    <div className="absolute left-[23%] top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-[#444]" /> 
                                </div>
                                <span className="text-[9px] text-gray-500"><FastForward size={10} /></span>
                            </div>

                            {/* Presets */}
                            <div className="flex bg-[#18181b] p-0.5 rounded-lg border border-[#27272a]">
                                {PRESET_SPEEDS.map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setClipSpeed(clipKey, val)}
                                        className={`
                                            flex-1 py-1 text-[10px] font-medium rounded transition-all
                                            ${Math.abs((clip.speed ?? 1) - val) < 0.01 
                                                ? 'bg-[#333] text-white shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#252526]'
                                            }
                                        `}
                                    >
                                        {val}x
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                )}

                {activeTab === 'effect' && (
                    <EffectsListPanel 
                        layers={(clip.layers || []).map((ref) => state.layers[resolveEntityKey(ref)]).filter(Boolean)}
                        onUpdateLayers={(layers) => updateClipLayers(clipKey, layers)}
                    />
                )}

            </div>
        </div>
    );
};


