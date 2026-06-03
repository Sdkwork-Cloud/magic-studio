
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Film, FileVideo } from 'lucide-react';
import { Button, VideoUpload, ImageUpload } from '@sdkwork/magic-studio-commons';
import { PromptTextInput } from '../PromptTextInput';
import {
    createImportData,
    createImportDataResourceFromUpload,
    ImportData,
    type ImportDataResource
} from './types';
import { SettingInput, SettingSelect } from '@sdkwork/magic-studio-settings';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { PreviewModal, PreviewData } from './PreviewModal';
import {
    fetchCreationCapabilities,
    findCreationModel,
    flattenCreationModels,
    resolveCreationEntryCapabilityOptions
} from '../../../services/creationCapabilityService';
import { createPromptTextInputCapabilityProps } from '../../generate/promptCapabilityProps';
import { resolveCanonicalUploadAssetUrl } from './uploadAssetUrlResolver';

interface UploadVideoGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
}

const normalizeSelectableValue = (
    currentValue: string,
    options: Array<{ value: string }>,
    fallbackValue: string
): string => {
    if (options.length === 0) {
        return fallbackValue;
    }
    if (options.some((item) => item.value === currentValue)) {
        return currentValue;
    }
    return options[0]?.value || fallbackValue;
};

export const UploadVideoGenerationModal: React.FC<UploadVideoGenerationModalProps> = ({ onClose, onImport }) => {
    const { t } = useTranslation();

    // Result State
    const [resource, setResource] = useState<ImportDataResource | null>(null);
    const [coverResource, setCoverResource] = useState<ImportDataResource | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    // Configuration
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState('5');
    const [resolution, setResolution] = useState('1080p');
    const [fps, setFps] = useState('30');
    const [capabilityError, setCapabilityError] = useState<string | null>(null);
    const [videoCapabilitySnapshot, setVideoCapabilitySnapshot] = useState<Awaited<ReturnType<typeof fetchCreationCapabilities>> | null>(null);

    useEffect(() => {
        let active = true;
        fetchCreationCapabilities('video')
            .then((snapshot) => {
                if (!active) {
                    return;
                }
                setVideoCapabilitySnapshot(snapshot);
                const firstModel = flattenCreationModels(snapshot)[0];
                if (firstModel?.model) {
                    setModel((current) => current || firstModel.model || '');
                }
            })
            .catch((error) => {
                if (!active) {
                    return;
                }
                setCapabilityError(error instanceof Error ? error.message : 'Failed to load model capabilities.');
            });
        return () => {
            active = false;
        };
    }, []);

    const modelOptions = useMemo(() => {
        if (!videoCapabilitySnapshot) {
            return [];
        }
        return flattenCreationModels(videoCapabilitySnapshot).map((item) => ({
            label: item.name || item.model || 'Model',
            value: item.model || '',
        })).filter((item) => item.value);
    }, [videoCapabilitySnapshot]);

    const displayModelOptions = useMemo(
        () => modelOptions.length > 0 ? modelOptions : [{ label: 'External Source', value: 'External Source' }],
        [modelOptions]
    );
    const effectiveModel = useMemo(
        () => normalizeSelectableValue(model, displayModelOptions, displayModelOptions[0]?.value || ''),
        [displayModelOptions, model]
    );

    const selectedModel = useMemo(() => {
        if (!videoCapabilitySnapshot) {
            return undefined;
        }
        return findCreationModel(videoCapabilitySnapshot, effectiveModel);
    }, [effectiveModel, videoCapabilitySnapshot]);

    const capabilityOptions = useMemo(() => {
        return resolveCreationEntryCapabilityOptions(
            videoCapabilitySnapshot || { target: 'video', channels: [], styleOptions: [] },
            selectedModel?.model || effectiveModel,
        );
    }, [effectiveModel, selectedModel?.model, videoCapabilitySnapshot]);

    const aspectRatioOptions = useMemo(
        () => capabilityOptions.aspectRatioOptions.length > 0
            ? capabilityOptions.aspectRatioOptions
            : [{ label: '16:9', value: '16:9' }],
        [capabilityOptions.aspectRatioOptions]
    );

    const resolutionOptions = useMemo(() => {
        if (capabilityOptions.resolutionOptions.length > 0) {
            return capabilityOptions.resolutionOptions;
        }
        return [
            { label: '720p', value: '720p' },
            { label: '1080p', value: '1080p' },
            { label: '4k', value: '4k' },
        ];
    }, [capabilityOptions.resolutionOptions]);

    const durationOptions = useMemo(() => {
        if (capabilityOptions.durationOptions.length > 0) {
            return capabilityOptions.durationOptions.map((item) => ({
                label: item.label,
                value: item.value.replace(/s$/i, ''),
            }));
        }
        return [
            { label: '5s', value: '5' },
            { label: '10s', value: '10' },
            { label: '15s', value: '15' },
        ];
    }, [capabilityOptions.durationOptions]);
    const effectiveResolution = useMemo(
        () => normalizeSelectableValue(resolution, resolutionOptions, resolutionOptions[0]?.value || '1080p'),
        [resolution, resolutionOptions]
    );
    const effectiveDuration = useMemo(
        () => normalizeSelectableValue(duration, durationOptions, durationOptions[0]?.value || '5'),
        [duration, durationOptions]
    );
    const effectiveAspectRatio = useMemo(
        () => normalizeSelectableValue(aspectRatio, aspectRatioOptions, aspectRatioOptions[0]?.value || '16:9'),
        [aspectRatio, aspectRatioOptions]
    );
    
    const handleImport = () => {
        if (!resource) return;

        const importData: ImportData = createImportData({
            resource,
            ...(coverResource ? { coverResource } : {}),
            type: 'video',
            createdAt: Date.now(),
            prompt: prompt || 'Imported Video',
            model: effectiveModel,
            aspectRatio: effectiveAspectRatio,
            duration: parseInt(effectiveDuration, 10) || 0,
            resolution: effectiveResolution,
            fps: parseInt(fps, 10) || 30
        });
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
                                    value={resource?.url ?? null}
                                    assetUrlResolver={resolveCanonicalUploadAssetUrl}
                                    onChange={(file) => setResource(createImportDataResourceFromUpload(file, 'video'))}
                                    onRemove={() => setResource(null)}
                                    onPreview={() => resource?.url && setPreviewData({ url: resource.url, type: 'video', title: 'Preview' })}
                                    aspectRatio="h-full"
                                    label="Upload Video"
                                    fit="contain" 
                                    className="bg-transparent border-none w-full h-full"
                                />
                            </div>

                            {/* Cover Upload */}
                            <div className="flex-none h-32 relative group bg-[#111] rounded-xl overflow-hidden border border-[#27272a] shadow-sm hover:border-gray-500 transition-all">
                                <ImageUpload
                                    value={coverResource?.url ?? null}
                                    assetUrlResolver={resolveCanonicalUploadAssetUrl}
                                    onChange={(file) => setCoverResource(createImportDataResourceFromUpload(file, 'image'))}
                                    onRemove={() => setCoverResource(null)}
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
                                        {...createPromptTextInputCapabilityProps('VIDEO')}
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
                                        <SettingSelect 
                                            label={t('studio.common.model')}
                                            value={effectiveModel}
                                            onChange={setModel}
                                            options={displayModelOptions}
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label={t('studio.image.aspect_ratio')}
                                            value={effectiveAspectRatio}
                                            onChange={setAspectRatio}
                                            options={aspectRatioOptions}
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label="Duration (s)"
                                            value={effectiveDuration}
                                            onChange={setDuration}
                                            options={durationOptions}
                                            layout="vertical"
                                            fullWidth
                                        />
                                        <SettingSelect 
                                            label="Resolution"
                                            value={effectiveResolution}
                                            onChange={setResolution}
                                            options={resolutionOptions}
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
                                    {capabilityError ? (
                                        <p className="text-xs text-amber-400">{capabilityError}</p>
                                    ) : null}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-none h-20 px-8 bg-[#18181b] border-t border-[#27272a] flex items-center justify-end gap-4 z-10">
                        <Button variant="secondary" size="lg" onClick={onClose} className="px-8">{t('common.actions.cancel')}</Button>
                        <Button 
                            onClick={handleImport} 
                            disabled={!resource} 
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
