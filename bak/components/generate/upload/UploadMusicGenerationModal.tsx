
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Music, FileAudio, Layers, Type, Disc } from 'lucide-react';
import { Button } from '../../Button/Button';
import { AudioUpload, ImageUpload } from '../../upload';
import { PromptTextInput } from '../PromptTextInput';
import { ImportData } from './types';
import { SettingInput, SettingToggle } from '../../../modules/settings/components/SettingsWidgets';
import { useTranslation } from '../../../i18n';
import { PreviewModal, PreviewData } from './PreviewModal';
import { generateUUID } from '../../../utils';

interface UploadMusicGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
}

type GenerationMode = 'text' | 'ref_audio';

interface SourceInput {
    id: string;
    label: string;
    fileUrl: string | null;
    prompt: string;
}

export const UploadMusicGenerationModal: React.FC<UploadMusicGenerationModalProps> = ({ onClose, onImport }) => {
    const { t } = useTranslation();

    // Result State
    const [resultFileUrl, setResultFileUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    
    // Preview State (Modal)
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    // Configuration
    const [mode, setMode] = useState<GenerationMode>('text');
    const [title, setTitle] = useState('');
    const [model, setModel] = useState('External Source');
    const [duration, setDuration] = useState('120');
    const [isInstrumental, setIsInstrumental] = useState(false);
    
    // Prompts
    const [mainPrompt, setMainPrompt] = useState('');
    const [lyrics, setLyrics] = useState('');

    // Source Inputs
    const [sourceInputs, setSourceInputs] = useState<SourceInput[]>([]);

    const handleModeChange = (newMode: GenerationMode) => {
        setMode(newMode);
        if (newMode === 'text') {
            setSourceInputs([]);
        } else {
            setSourceInputs([
                { id: 'ref1', label: 'Reference Audio', fileUrl: null, prompt: '' }
            ]);
        }
    };

    const updateSourceInput = (id: string, field: keyof SourceInput, value: any) => {
        setSourceInputs(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleImport = () => {
        if (!resultFileUrl) return;

        let finalPrompt = mainPrompt;
        if (sourceInputs.length > 0) {
             const context = sourceInputs.map(s => `[${s.label}]: ${s.prompt}`).join('\n');
             finalPrompt = `${finalPrompt}\n\n--- Source Context ---\n${context}`;
        }

        onImport({
            id: generateUUID(),
            fileUrl: resultFileUrl,
            coverUrl: coverUrl || undefined,
            type: 'music',
            createdAt: Date.now(),
            prompt: finalPrompt || 'Imported Music',
            title: title || 'Untitled Track',
            model,
            duration: parseInt(duration, 10),
            lyrics,
            isInstrumental
        });
        onClose();
    };

    return createPortal(
        <>
            <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-200">
                <div 
                    className="w-full max-w-[1600px] w-[95vw] h-[90vh] bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-none px-8 h-20 border-b border-[#27272a] bg-[#18181b] flex justify-between items-center select-none">
                        <h3 className="text-white font-bold text-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-900/20">
                                <Music size={24} className="text-indigo-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="leading-tight">{t('studio.common.import')} Generated Music</span>
                                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Audio Import Workspace</span>
                            </div>
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-white transition-colors p-2.5 hover:bg-[#27272a] rounded-xl group"
                            title="Close"
                        >
                            <X size={24} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-[#27272a]">
                        
                        {/* LEFT: Result */}
                        <div className="col-span-12 lg:col-span-4 bg-[#121214] p-8 overflow-y-auto custom-scrollbar flex flex-col h-full">
                            <div className="flex-none mb-6">
                                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2">
                                    <FileAudio size={16} className="text-indigo-500" />
                                    Final Result
                                </h4>
                                <p className="text-xs text-gray-500">Upload the audio file and cover art.</p>
                            </div>

                            {/* Cover Art Upload */}
                            <div className="w-full aspect-square mb-4 relative group bg-[#111] rounded-xl overflow-hidden border border-[#27272a] shadow-md">
                                <ImageUpload
                                    value={coverUrl}
                                    onChange={(f) => setCoverUrl(f.url)}
                                    onRemove={() => setCoverUrl(null)}
                                    onPreview={() => coverUrl && setPreviewData({ url: coverUrl, type: 'image', title: 'Cover Art' })}
                                    aspectRatio="aspect-square"
                                    label="Upload Cover Art"
                                    fit="contain" 
                                    className="bg-[#1c1c1f] border-none w-full h-full hover:bg-[#222] transition-colors"
                                />
                            </div>

                            {/* Audio Upload */}
                            <div className="flex-none flex flex-col relative group">
                                <AudioUpload 
                                    value={resultFileUrl}
                                    onChange={(f) => {
                                        setResultFileUrl(f.url);
                                        if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
                                    }}
                                    onRemove={() => setResultFileUrl(null)}
                                    onPreview={() => resultFileUrl && setPreviewData({ url: resultFileUrl, type: 'audio', title: title || 'Audio Track' })}
                                    aspectRatio="h-24"
                                    label="Upload Audio Track (MP3/WAV)"
                                    className={`bg-[#1c1c1f] border-[#27272a] shadow-inner hover:border-indigo-500/30 transition-colors ${resultFileUrl ? 'border-indigo-500/50 bg-indigo-900/10' : ''}`}
                                />
                            </div>

                            <div className="mt-6 p-4 bg-[#1c1c1f] rounded-xl border border-[#27272a]">
                                <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                                    <span>Format</span>
                                    <span className="text-white">MP3 / WAV / OGG</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>Max Duration</span>
                                    <span className="text-white">10 Minutes</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Config */}
                        <div className="col-span-12 lg:col-span-8 bg-[#18181b] p-8 overflow-y-auto custom-scrollbar">
                            <div className="max-w-5xl mx-auto space-y-10">
                                
                                {/* Mode */}
                                <section>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">Generation Mode</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ModeButton 
                                            active={mode === 'text'} 
                                            onClick={() => handleModeChange('text')} 
                                            icon={<Type size={16} />} 
                                            label="Text to Music" 
                                        />
                                        <ModeButton 
                                            active={mode === 'ref_audio'} 
                                            onClick={() => handleModeChange('ref_audio')} 
                                            icon={<Layers size={16} />} 
                                            label="Audio Remix / Reference" 
                                        />
                                    </div>
                                </section>

                                {/* Source Assets */}
                                {sourceInputs.length > 0 && (
                                    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source Assets</label>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {sourceInputs.map((input) => (
                                                <div key={input.id} className="flex gap-4 p-4 bg-[#202023] rounded-xl border border-[#27272a] group items-start hover:border-[#3f3f46] transition-colors shadow-sm">
                                                    {/* Audio Slot */}
                                                    <div className="w-24 h-24 flex-shrink-0 relative">
                                                        <AudioUpload 
                                                            value={input.fileUrl}
                                                            onChange={(f) => updateSourceInput(input.id, 'fileUrl', f.url)}
                                                            onRemove={() => updateSourceInput(input.id, 'fileUrl', null)}
                                                            onPreview={() => input.fileUrl && setPreviewData({ url: input.fileUrl, type: 'audio', title: input.label })}
                                                            aspectRatio="aspect-square"
                                                            label="Ref Audio"
                                                            className="h-full bg-[#18181b] border-[#333]"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col h-full gap-2">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide bg-[#2a2a2d] px-2 py-0.5 rounded">{input.label}</span>
                                                        </div>
                                                        <textarea 
                                                            value={input.prompt}
                                                            onChange={(e) => updateSourceInput(input.id, 'prompt', e.target.value)}
                                                            placeholder={`Context for ${input.label} (e.g. style, mood)...`}
                                                            className="flex-1 w-full bg-[#18181b] border border-[#333] rounded-lg p-2 text-xs text-gray-200 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-gray-600"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Details */}
                                <section>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">Track Details</label>
                                    <div className="space-y-4 bg-[#202023] p-6 rounded-xl border border-[#27272a]">
                                        <SettingInput 
                                            label="Title"
                                            value={title}
                                            onChange={setTitle}
                                            placeholder="Song Name"
                                            fullWidth
                                            layout="vertical"
                                        />
                                        
                                        <PromptTextInput 
                                            value={mainPrompt}
                                            onChange={setMainPrompt}
                                            label={t('studio.common.prompt')}
                                            placeholder="Describe the music style, mood, instruments..."
                                            rows={3}
                                            className="bg-transparent"
                                        />

                                        {!isInstrumental && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Lyrics</label>
                                                <textarea 
                                                    value={lyrics}
                                                    onChange={(e) => setLyrics(e.target.value)}
                                                    placeholder="Enter lyrics here..."
                                                    className="w-full bg-[#18181b] border border-[#333] rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 resize-y min-h-[100px]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Technical */}
                                <section>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">Parameters</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#202023] rounded-xl border border-[#27272a]">
                                        <SettingInput 
                                            label={t('studio.common.model')}
                                            value={model}
                                            onChange={setModel}
                                            placeholder="e.g. Suno v3.5"
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <div className="space-y-4">
                                            <SettingInput 
                                                label="Duration (s)"
                                                type="number"
                                                value={duration}
                                                onChange={setDuration}
                                                layout="vertical"
                                                fullWidth
                                            />
                                            <SettingToggle 
                                                label="Instrumental"
                                                checked={isInstrumental}
                                                onChange={setIsInstrumental}
                                            />
                                        </div>
                                    </div>
                                </section>

                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-none h-20 px-8 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between z-10">
                        <div className="text-xs text-gray-500">
                            {resultFileUrl ? 'Ready to import' : 'Please upload the audio file'}
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" size="lg" onClick={onClose} className="px-8">{t('common.actions.cancel')}</Button>
                            <Button 
                                onClick={handleImport} 
                                disabled={!resultFileUrl} 
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-500 border-0 px-8 shadow-lg shadow-indigo-900/20 font-bold text-sm"
                            >
                                {t('studio.common.import')} Music
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <PreviewModal 
                data={previewData} 
                onClose={() => setPreviewData(null)} 
            />
        </>,
        document.body
    );
};

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`
            flex flex-col items-center justify-center gap-3 p-4 rounded-xl text-sm font-medium transition-all border
            ${active 
                ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-900/10 scale-[1.02]' 
                : 'bg-[#202023] border-[#27272a] text-gray-400 hover:bg-[#252529] hover:text-gray-200 hover:border-[#3f3f46]'
            }
        `}
    >
        {icon} 
        <span>{label}</span>
    </button>
);
