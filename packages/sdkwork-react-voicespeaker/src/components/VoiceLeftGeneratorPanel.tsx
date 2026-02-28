
import React, { useState, useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { VoiceModelSelector } from './VoiceModelSelector';
import { 
    Mic2, Loader2, Play, Volume2, 
    UserPlus, Sparkles, Upload, Mic, Copy, User, Trash2
} from 'lucide-react';

import { AudioUpload } from '@sdkwork/react-commons';

interface UploadedFile {
    data: Uint8Array | File;
    name: string;
    url: string;
    path?: string;
}
import { AudioRecorder } from '@sdkwork/react-audio';
import {
    PromptTextInput,
    ChooseAsset,
    assetBusinessFacade,
    readWorkspaceScope,
    resolveAssetUrlByAssetIdFirst
} from '@sdkwork/react-assets';
import { AIImageGeneratorModal } from '@sdkwork/react-image';
import { useTranslation } from '@sdkwork/react-i18n';
import { SettingInput, SettingSelect, SettingSlider, SettingTextArea } from '@sdkwork/react-settings';

type VoiceMode = 'design' | 'clone';
type InputMethod = 'upload' | 'mic';

const resolveVoiceScope = (): { workspaceId: string; projectId?: string } => {
    const scope = readWorkspaceScope();
    return {
        workspaceId: scope.workspaceId,
        projectId: scope.projectId
    };
};

export const VoiceLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useVoiceStore();
    const [mode, setMode] = useState<VoiceMode>('design');
    const [inputMethod, setInputMethod] = useState<InputMethod>('upload');
    const [showAIModal, setShowAIModal] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (!config.previewText) {
            setConfig({ previewText: "Hello, this is a preview of my new voice. How do I sound?" });
        }
    }, []);

    const handleRecordingComplete = async (blob: Blob) => {
        const buffer = new Uint8Array(await blob.arrayBuffer());
        const result = await assetBusinessFacade.importVoiceSpeakerAsset({
            scope: resolveVoiceScope(),
            type: 'voice',
            name: `rec_${Date.now()}.webm`,
            data: buffer,
            metadata: {
                origin: 'upload',
                source: 'voice-recorder'
            }
        });
        setConfig({ referenceAudio: result.primaryLocator.uri });
    };

    const handleAudioUpload = async (file: UploadedFile) => {
        const result = await assetBusinessFacade.importVoiceSpeakerAsset({
            scope: resolveVoiceScope(),
            type: 'voice',
            name: file.name,
            data: file.data,
            metadata: {
                origin: 'upload',
                source: 'voice-upload'
            }
        });
        setConfig({ referenceAudio: result.primaryLocator.uri });
    };

    const handleAIImageSuccess = (url: string | string[]) => {
        const finalUrl = Array.isArray(url) ? url[0] : url;
        setConfig({ avatarUrl: finalUrl });
        setShowAIModal(false);
    };

    const handlePlayAudio = async () => {
        if (config.referenceAudio) {
             const url = await resolveAssetUrlByAssetIdFirst({ path: config.referenceAudio });
             if (url) {
                 const audio = new Audio(url);
                 audio.play().catch(e => console.error("Playback failed", e));
             }
        }
    };

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/20 ring-1 ring-white/10">
                            <Mic2 size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">{t('studio.voice.title')}</h2>
                            <span className="text-[10px] text-gray-500 font-medium">Voice Creation</span>
                        </div>
                    </div>
                    
                    <VoiceModelSelector 
                        value={config.model} 
                        onChange={(model) => setConfig({ model: model as any })}
                        className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                    />
                </div>
                
                 <div className="flex items-center px-6 gap-6 border-t border-[#1c1c1f]">
                    <button 
                        onClick={() => setMode('design')}
                        className={`relative py-3 flex items-center gap-2 text-xs font-medium transition-colors select-none ${mode === 'design' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <UserPlus size={14} /> {t('studio.voice.design')}
                        {mode === 'design' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-t-full" />}
                    </button>
                    <button 
                        onClick={() => setMode('clone')}
                        className={`relative py-3 flex items-center gap-2 text-xs font-medium transition-colors select-none ${mode === 'clone' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Copy size={14} /> {t('studio.voice.clone')}
                        {mode === 'clone' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-t-full" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                
                <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label icon={<User size={12} />}>Character Persona</Label>
                    
                    <div className="flex gap-5 mt-2">
                        <div className="flex-shrink-0">
                            <ChooseAsset 
                                value={config.avatarUrl || null}
                                onChange={(asset) => setConfig({ avatarUrl: asset?.path || asset?.id || undefined })}
                                accepts={['image']}
                                domain="voice-speaker"
                                className="w-32 h-32 bg-[#18181b]"
                                label="Avatar"
                                aspectRatio="aspect-square"
                                contextText={config.description || config.name || "A character portrait"}
                                imageFit="contain"
                            />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                             <div className="space-y-3">
                                 <SettingInput 
                                    label="Name" 
                                    value={config.name || ''} 
                                    onChange={(v: string) => setConfig({ name: v })}
                                    placeholder={mode === 'design' ? "e.g. Narrator Pro" : "e.g. My Clone"}
                                    fullWidth
                                    labelClassName="text-[10px] text-gray-500 font-bold uppercase"
                                 />
                                 {mode === 'design' && (
                                    <div className="grid grid-cols-2 gap-3">
                                         <SettingSelect 
                                            label="Gender" 
                                            value={config.voiceId === 'Kore' ? 'female' : 'male'} 
                                            onChange={(_v: string) => { }} 
                                            options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]}
                                            fullWidth
                                            labelClassName="text-[10px] text-gray-500 font-bold uppercase"
                                         />
                                         <SettingSelect 
                                            label="Age" 
                                            value="adult"
                                            onChange={() => {}} 
                                            options={[{ label: 'Young', value: 'young' }, { label: 'Adult', value: 'adult' }, { label: 'Old', value: 'old' }]}
                                            fullWidth
                                            labelClassName="text-[10px] text-gray-500 font-bold uppercase"
                                         />
                                    </div>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>

                {mode === 'design' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                         <div>
                            <Label icon={<Sparkles size={12} className="text-yellow-500" />}>Voice Description</Label>
                            <PromptTextInput 
                                label={null}
                                placeholder="Describe the voice: deep, raspy, cheerful, robotic, accent..."
                                value={config.description || ''}
                                onChange={(val) => setConfig({ description: val })}
                                disabled={isGenerating}
                                rows={4}
                                className="bg-[#121214]"
                            />
                        </div>

                        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-4">
                             <SettingSlider 
                                label="Stability"
                                value={config.stability || 0.5}
                                onChange={(v: number) => setConfig({ stability: v })}
                                min={0} max={1} step={0.05}
                             />
                             <SettingSlider 
                                label="Similarity"
                                value={config.similarityBoost || 0.75}
                                onChange={(v: number) => setConfig({ similarityBoost: v })}
                                min={0} max={1} step={0.05}
                             />
                        </div>
                    </div>
                )}

                {mode === 'clone' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-end">
                            <Label icon={<Upload size={12} />}>Reference Audio</Label>
                            <div className="flex bg-[#121214] p-0.5 rounded-lg border border-[#27272a] mb-2">
                                <button 
                                    onClick={() => setInputMethod('upload')}
                                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${inputMethod === 'upload' ? 'bg-[#27272a] text-white shadow-sm border border-[#333]' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Upload
                                </button>
                                <button 
                                    onClick={() => setInputMethod('mic')}
                                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${inputMethod === 'mic' ? 'bg-[#27272a] text-white shadow-sm border border-[#333]' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Record
                                </button>
                            </div>
                        </div>
                        
                        {config.referenceAudio ? (
                            <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3 relative group transition-all hover:border-green-500/30 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 border border-green-500/20">
                                    <Volume2 size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                     <div className="text-xs font-bold text-gray-200">Audio Sample</div>
                                     <div className="text-[10px] text-gray-500 truncate">Ready to clone</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={handlePlayAudio}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-[#252526] rounded-lg transition-colors"
                                        title="Play"
                                    >
                                        <Play size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setConfig({ referenceAudio: undefined })}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#252526] rounded-lg transition-colors"
                                        title="Remove Audio"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[140px]">
                                {inputMethod === 'upload' ? (
                                    <AudioUpload 
                                        value={null}
                                        onChange={handleAudioUpload}
                                        label="Drop audio file (wav, mp3)"
                                        className="h-36 bg-[#121214] border-[#27272a] hover:border-[#444]"
                                        aspectRatio="h-full"
                                    />
                                ) : (
                                    <AudioRecorder 
                                        onRecordingComplete={handleRecordingComplete}
                                        onDelete={() => {}} 
                                        className="h-36 bg-[#121214] border-[#27272a] p-4"
                                    />
                                )}
                                <p className="text-[10px] text-gray-500 mt-2 ml-1">
                                    * Provide 10-60 seconds of clear speech for best results.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-2 border-t border-[#27272a]">
                    <SettingTextArea 
                        label="Preview Text"
                        description="Text to speak for the generated preview."
                        value={config.previewText || ''}
                        onChange={(v: string) => setConfig({ previewText: v })}
                        rows={2}
                        fullWidth
                        placeholder="Hello, this is a preview of my new voice."
                    />
                </div>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button 
                    onClick={generate} 
                    disabled={isGenerating || (mode === 'clone' && !config.referenceAudio)}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                        ${isGenerating 
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' 
                            : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 hover:shadow-green-500/20 active:scale-[0.98]'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Mic size={16} fill="currentColor" />
                            <span>{mode === 'clone' ? 'Clone Voice' : 'Create Voice'}</span>
                        </>
                    )}
                </button>
            </div>

            {showAIModal && (
                <AIImageGeneratorModal 
                    contextText={config.description ? `Character portrait, ${config.name}, ${config.description}` : (config.name || "Portrait of a person")}
                    config={{ aspectRatio: '1:1' }}
                    onClose={() => setShowAIModal(false)}
                    onSuccess={handleAIImageSuccess}
                />
            )}
        </>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);
