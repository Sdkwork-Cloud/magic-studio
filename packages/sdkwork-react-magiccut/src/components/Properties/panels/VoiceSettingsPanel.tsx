import React, { useState, useEffect } from 'react';
import { RefreshCw, User, Settings2, Captions, Type } from 'lucide-react';
import { PropertySection, ScrubbableInput, Dropdown, ActionButton } from '../widgets/PropertyWidgets';
import { PRESET_VOICES } from '@sdkwork/react-voicespeaker';
import { AnyMediaResource } from '@sdkwork/react-commons';
import { CutClip } from '../../../entities/magicCut.entity';
import { useMagicCutStore } from '../../../store/magicCutStore';
import { PromptTextInput } from '@sdkwork/react-assets';
import { genAIService } from '@sdkwork/react-core';

interface VoiceSettingsPanelProps {
    clip: CutClip;
    resource: AnyMediaResource;
    onUpdate: (updates: Partial<CutClip>) => void;
    onUpdateResource: (updates: Partial<AnyMediaResource>) => void;
}

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ clip, resource, onUpdate, onUpdateResource }) => {
    const { setClipSpeed } = useMagicCutStore(); // Access store for speed control

    const [script, setScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    
    // Metadata holds voice configuration
    const meta = resource.metadata || {};
    const voiceId = meta.voiceId || 'Kore';
    const speed = clip.speed || 1.0;
    const pitch = meta.pitch || 1.0;

    // Load initial script from clip content or metadata
    useEffect(() => {
        setScript(clip.content || meta.text || "Hello World");
    }, [clip.id]);

    const handleRegenerate = async () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            onUpdate({ content: script }); // Save script
        }, 1500);
    };

    const handleEnhanceScript = async (currentText: string): Promise<string> => {
        if (!currentText) return "";
        setIsEnhancing(true);
        try {
            const enhanced = await genAIService.enhancePrompt(currentText);
            setScript(enhanced);
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
            {/* 1. Script Editor */}
            <div className="p-3 border-b border-[#1f1f22] bg-[#141414]">
                <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-wider">
                        <Type size={12} /> Script
                    </div>
                </div>
                
                <PromptTextInput 
                    label={null}
                    value={script}
                    onChange={setScript}
                    className="bg-[#09090b]"
                    placeholder="Enter text to speak..."
                    rows={4}
                    onEnhance={handleEnhanceScript}
                    isEnhancing={isEnhancing}
                />

                <div className="mt-2">
                    <ActionButton 
                        label="Regenerate Audio" 
                        icon={<RefreshCw />} 
                        onClick={handleRegenerate} 
                        isLoading={isGenerating}
                        className="w-full bg-green-900/20 text-green-400 border-green-500/30 hover:bg-green-900/30"
                    />
                </div>
            </div>

            {/* 2. Voice Persona */}
            <PropertySection title="Speaker">
                <Dropdown 
                    label="Voice ID"
                    value={voiceId as string}
                    onChange={(v: string) => onUpdateResource({ 
                         metadata: { ...meta, voiceId: v } 
                    })}
                    options={PRESET_VOICES.map((v: { id: string; name: string }) => ({ label: v.name, value: v.id, icon: <User size={12}/> }))}
                />
            </PropertySection>

            {/* 3. Audio Properties */}
            <PropertySection title="Properties">
                <div className="space-y-3">
                    <ScrubbableInput 
                        label="Speed" 
                        value={speed} 
                        onChange={(v) => setClipSpeed(clip.id, v)} 
                        step={0.1} min={0.5} max={3.0} 
                        suffix="x"
                    />
                    <ScrubbableInput 
                        label="Pitch" 
                        value={pitch} 
                        onChange={(v) => onUpdateResource({ metadata: { ...meta, pitch: v } })} 
                        step={0.1} min={0.5} max={2.0} 
                    />
                    <ScrubbableInput 
                        label="Volume" 
                        value={clip.volume || 1} 
                        onChange={(v) => onUpdate({ volume: v })} 
                        step={0.1} min={0} max={2} 
                    />
                </div>
            </PropertySection>
            
            {/* 4. Subtitles */}
            <PropertySection title="Captions">
                 <div className="flex gap-2">
                     <ActionButton label="Auto-Caption" icon={<Captions />} onClick={() => {}} className="flex-1" />
                     <ActionButton label="Export SRT" icon={<Settings2 />} onClick={() => {}} className="flex-1" />
                 </div>
            </PropertySection>
        </>
    );
};
