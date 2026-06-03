import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, ScanFace } from 'lucide-react';
import { Button, ImageUpload } from '@sdkwork/magic-studio-commons';
import { SettingInput, SettingSelect } from '@sdkwork/magic-studio-settings';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { PromptTextInput } from '../PromptTextInput';
import { createPromptTextInputCapabilityProps } from '../../generate/promptCapabilityProps';
import { resolveCanonicalUploadAssetUrl } from './uploadAssetUrlResolver';
import {
    createImportData,
    createImportDataResourceFromUpload,
    type ImportData,
    type ImportDataResource,
} from './types';

interface UploadCharacterGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
}

export const UploadCharacterGenerationModal: React.FC<UploadCharacterGenerationModalProps> = ({
    onClose,
    onImport,
}) => {
    const { t } = useTranslation();
    const [resource, setResource] = useState<ImportDataResource | null>(null);
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('External Source');
    const [aspectRatio, setAspectRatio] = useState('9:16');

    const handleImport = () => {
        if (!resource) {
            return;
        }

        onImport(
            createImportData({
                resource,
                type: 'character',
                createdAt: Date.now(),
                prompt: prompt || 'Imported Character',
                model,
                aspectRatio,
            })
        );
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-[1100px] w-[90vw] h-[82vh] bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex-none px-8 h-20 border-b border-[#27272a] bg-[#18181b] flex justify-between items-center select-none">
                    <h3 className="text-white font-bold text-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-900/20">
                            <User size={24} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="leading-tight">{t('studio.common.import')} Character</span>
                            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Character Import Workspace</span>
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

                <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-[#27272a]">
                    <div className="col-span-12 lg:col-span-5 bg-[#121214] p-8 overflow-y-auto custom-scrollbar flex flex-col h-full">
                        <div className="flex-none mb-6">
                            <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-2">
                                <ScanFace size={16} className="text-blue-400" />
                                Character Portrait
                            </h4>
                            <p className="text-xs text-gray-500">Upload the final rendered character image.</p>
                        </div>

                        <div className="flex-1 min-h-[300px] bg-[#111] rounded-xl overflow-hidden border border-[#27272a] shadow-md hover:border-blue-500/30 transition-all">
                            <ImageUpload
                                value={resource?.url ?? null}
                                assetUrlResolver={resolveCanonicalUploadAssetUrl}
                                onChange={(file) => setResource(createImportDataResourceFromUpload(file, 'image'))}
                                onRemove={() => setResource(null)}
                                aspectRatio="h-full"
                                label="Upload Character Image"
                                fit="contain"
                                className="bg-transparent border-none w-full h-full"
                            />
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-7 bg-[#18181b] p-8 overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Generation Metadata</h4>

                                <PromptTextInput
                                    {...createPromptTextInputCapabilityProps('IMAGE')}
                                    value={prompt}
                                    onChange={setPrompt}
                                    label={t('studio.common.prompt')}
                                    placeholder="Describe the imported character appearance..."
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
                                        placeholder="e.g. gemini-2.5-flash-image"
                                        layout="vertical"
                                        fullWidth
                                    />
                                    <SettingSelect
                                        label={t('studio.image.aspect_ratio')}
                                        value={aspectRatio}
                                        onChange={setAspectRatio}
                                        options={[
                                            { label: '9:16 Portrait', value: '9:16' },
                                            { label: '1:1 Square', value: '1:1' },
                                            { label: '16:9 Landscape', value: '16:9' },
                                            { label: '3:4 Vertical', value: '3:4' },
                                        ]}
                                        layout="vertical"
                                        fullWidth
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-none h-20 px-8 bg-[#18181b] border-t border-[#27272a] flex items-center justify-end gap-4 z-10">
                    <Button variant="secondary" size="lg" onClick={onClose} className="px-8">
                        {t('common.actions.cancel')}
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!resource}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-500 border-0 px-8 shadow-lg shadow-blue-900/20 font-bold text-sm"
                    >
                        {t('studio.common.import')} Character
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
        'character-import-modal'
    );
};
