
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, FileImage } from 'lucide-react';
import { Button } from '../../Button/Button';
import { ImageUpload } from '../../upload';
import { PromptTextInput } from '../PromptTextInput';
import { ImportData } from './types';
import { SettingInput, SettingSelect } from '../../../modules/settings/components/SettingsWidgets';
import { useTranslation } from '../../../i18n';
import { PreviewModal, PreviewData } from './PreviewModal';
import { generateUUID } from '../../../utils';

interface UploadImageGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
}

export const UploadImageGenerationModal: React.FC<UploadImageGenerationModalProps> = ({ onClose, onImport }) => {
    const { t } = useTranslation();

    // Result State
    const [resultFileUrl, setResultFileUrl] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    // Configuration
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [model, setModel] = useState('External Source');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [style, setStyle] = useState('none');
    
    const handleImport = () => {
        if (!resultFileUrl) return;

        const importData: ImportData = {
            id: generateUUID(),
            fileUrl: resultFileUrl,
            type: 'image',
            createdAt: Date.now(),
            prompt: prompt || 'Imported Image',
            model,
            aspectRatio,
            negativePrompt,
            style
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
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-900/20">
                                <ImageIcon size={24} className="text-purple-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="leading-tight">{t('studio.common.import')} Generated Image</span>
                                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Image Import Workspace</span>
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
                        
                        {/* LEFT: Image Upload */}
                        <div className="col-span-12 lg:col-span-5 bg-[#121214] p-8 overflow-y-auto custom-scrollbar flex flex-col h-full">
                            <div className="flex-none mb-6">
                                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2">
                                    <FileImage size={16} className="text-purple-500" />
                                    Source Image
                                </h4>
                                <p className="text-xs text-gray-500">Upload the image file you want to import.</p>
                            </div>

                            <div className="flex-1 min-w-[300px] relative group bg-[#111] rounded-xl overflow-hidden border border-[#27272a] shadow-md hover:border-purple-500/30 transition-all">
                                <ImageUpload
                                    value={resultFileUrl}
                                    onChange={(f) => setResultFileUrl(f.url)}
                                    onRemove={() => setResultFileUrl(null)}
                                    onPreview={() => resultFileUrl && setPreviewData({ url: resultFileUrl, type: 'image', title: 'Preview' })}
                                    aspectRatio="h-full"
                                    label="Upload Image"
                                    fit="contain" 
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
                                    
                                    <SettingInput 
                                        label={t('studio.common.negative_prompt')}
                                        value={negativePrompt}
                                        onChange={setNegativePrompt}
                                        placeholder="e.g. blurry, low quality"
                                        fullWidth
                                        layout="vertical"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parameters</h4>
                                    <div className="grid grid-cols-2 gap-6 bg-[#202023] p-6 rounded-xl border border-[#27272a]">
                                        <SettingInput 
                                            label={t('studio.common.model')}
                                            value={model}
                                            onChange={setModel}
                                            placeholder="e.g. Midjourney v6"
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label={t('studio.image.aspect_ratio')}
                                            value={aspectRatio}
                                            onChange={setAspectRatio}
                                            options={[
                                                { label: '1:1 Square', value: '1:1' },
                                                { label: '16:9 Landscape', value: '16:9' },
                                                { label: '9:16 Portrait', value: '9:16' },
                                                { label: '4:3 Standard', value: '4:3' },
                                                { label: '3:4 Vertical', value: '3:4' },
                                            ]}
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label={t('studio.image.style')}
                                            value={style}
                                            onChange={setStyle}
                                            options={[
                                                { label: 'None', value: 'none' },
                                                { label: 'Photorealistic', value: 'photorealistic' },
                                                { label: 'Anime', value: 'anime' },
                                                { label: '3D Render', value: '3d-render' },
                                                { label: 'Digital Art', value: 'digital-art' },
                                            ]}
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
                            className="bg-purple-600 hover:bg-purple-500 border-0 px-8 shadow-lg shadow-purple-900/20 font-bold text-sm"
                        >
                            {t('studio.common.import')} Image
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
        "image-import-modal"
    );
};
