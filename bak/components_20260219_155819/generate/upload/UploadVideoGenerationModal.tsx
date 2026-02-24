
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Film, FileVideo, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../Button/Button';
import { VideoUpload, ImageUpload } from '../../upload';
import { PromptTextInput } from '../PromptTextInput';
import { ImportData } from './types';
import { SettingInput, SettingSelect } from '../../../modules/settings/components/SettingsWidgets';
import { useTranslation } from 'sdkwork-react-i18n';
import { PreviewModal, PreviewData } from './PreviewModal';
import { generateUUID } from 'sdkwork-react-commons';

interface UploadVideoGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
}

export const UploadVideoGenerationModal: React.FC<UploadVideoGenerationModalProps> = ({ onClose, onImport }) => {
    const { t } = useTranslation();

    // Result State
    const [resultFileUrl, setResultFileUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    // Configuration
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('External Source');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState('5');
    const [resolution, setResolution] = useState('1080p');
    const [fps, setFps] = useState('30');
    
    const handleImport = () => {
        if (!resultFileUrl) return;

        const importData: ImportData = {
            id: generateUUID(),
            fileUrl: resultFileUrl,
            coverUrl: coverUrl || undefined,
            type: 'video',
            createdAt: Date.now(),
            prompt: prompt || 'Imported Video',
            model,
            aspectRatio,
            duration: parseInt(duration, 10) || 0,
            resolution,
            fps: parseInt(fps, 10) || 30
        };
        onImport(importData);
        onClose();
    };

    return createPortal(
        <>
            <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-200">
                <div 
                    className="w-full max-w-[1200px] w-[90vw] h-[85vh] bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-none px-8 h-20 border-b border-[#27272a] bg-[#18181b] flex justify-between items-center select-none">
                        <h3 className="text-white font-bold text-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-lg shadow-pink-900/20">
                                <Film size={24} className="text-pink-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="leading-tight">{t('studio.common.import')} Generated Video</span>
                                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Video Import Workspace</span>
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
                        
                        {/* LEFT: Video Upload */}
                        <div className="col-span-12 lg:col-span-5 bg-[#121214] p-8 overflow-y-auto custom-scrollbar flex flex-col h-full">
                            <div className="flex-none mb-6">
                                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2">
                                    <FileVideo size={16} className="text-pink-500" />
                                    Source Video
                                </h4>
                                <p className="text-xs text-gray-500">Upload the video file you want to import.</p>
                            </div>

                            <div className="flex-1 min-h-[300px] relative group bg-[#111] rounded-xl overflow-hidden border border-[#27272a] shadow-md hover:border-pink-500/30 transition-all mb-4">
                                <VideoUpload
                                    value={resultFileUrl}
                                    onChange={(f) => setResultFileUrl(f.url)}
                                    onRemove={() => setResultFileUrl(null)}
                                    onPreview={() => resultFileUrl && setPreviewData({ url: resultFileUrl, type: 'video', title: 'Preview' })}
                                    aspectRatio="h-full"
                                    label="Upload Video"
                                    fit="contain" 
                                    className="bg-transparent border-none w-full h-full"
                                />
                            </div>

                            {/* Cover Upload */}
                            <div className="flex-none h-32 relative group bg-[#111] rounded-xl overflow-hidden border border-[#27272a] shadow-sm hover:border-gray-500 transition-all">
                                <ImageUpload
                                    value={coverUrl}
                                    onChange={(f) => setCoverUrl(f.url)}
                                    onRemove={() => setCoverUrl(null)}
                                    aspectRatio="h-full"
                                    label="Upload Cover (Optional)"
                                    fit="cover"
                                    className="bg-transparent border-none w-full h-full"
                                />
                            </div>
                        </div>

                        {/* RIGHT: Config */}
                        <div className="col-span-12 lg:col-span-7 bg-[#18181b] p-8 overflow-y-auto custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-8">
                                
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Generation Metadata</h4>
                                    
                                    <PromptTextInput 
                                        value={prompt}
                                        onChange={setPrompt}
                                        label={t('studio.common.prompt')}
                                        placeholder="Enter the prompt used..."
                                        rows={4}
                                        className="bg-transparent"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parameters</h4>
                                    <div className="grid grid-cols-2 gap-6 bg-[#202023] p-6 rounded-xl border border-[#27272a]">
                                        <SettingInput 
                                            label={t('studio.common.model')}
                                            value={model}
                                            onChange={setModel}
                                            placeholder="e.g. Sora, Runway"
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label={t('studio.image.aspect_ratio')}
                                            value={aspectRatio}
                                            onChange={setAspectRatio}
                                            options={[
                                                { label: '16:9 Landscape', value: '16:9' },
                                                { label: '9:16 Portrait', value: '9:16' },
                                                { label: '1:1 Square', value: '1:1' },
                                                { label: '4:3 Standard', value: '4:3' },
                                                { label: '21:9 Cinematic', value: '21:9' },
                                            ]}
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingInput 
                                            label="Duration (s)"
                                            value={duration}
                                            onChange={setDuration}
                                            type="number"
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label="Resolution"
                                            value={resolution}
                                            onChange={setResolution}
                                            options={[
                                                { label: '720p', value: '720p' },
                                                { label: '1080p', value: '1080p' },
                                                { label: '4k', value: '4k' },
                                            ]}
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingInput 
                                            label="FPS"
                                            value={fps}
                                            onChange={setFps}
                                            type="number"
                                            layout="vertical"
                                            fullWidth
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-none h-20 px-8 bg-[#18181b] border-t border-[#27272a] flex items-center justify-end gap-4 z-10">
                        <Button variant="secondary" size="lg" onClick={onClose} className="px-8">{t('common.actions.cancel')}</Button>
                        <Button 
                            onClick={handleImport} 
                            disabled={!resultFileUrl} 
                            size="lg"
                            className="bg-pink-600 hover:bg-pink-500 border-0 px-8 shadow-lg shadow-pink-900/20 font-bold text-sm"
                        >
                            {t('studio.common.import')} Video
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <PreviewModal 
                data={previewData} 
                onClose={() => setPreviewData(null)} 
            />
        </>,
        document.body,
        "video-import-modal"
    );
};
