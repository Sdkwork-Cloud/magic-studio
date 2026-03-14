import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
    ChooseAssetModal,
    useAssetUrl,
    resolveAssetUrlByAssetIdFirst,
    type InputAttachment
} from '@sdkwork/react-assets';
import type { Asset } from '@sdkwork/react-commons';
import { genAIService } from '@sdkwork/react-core';
import {
    buildVideoModeAvailabilityByModel,
    getNearestSupportedDurationByModelMode,
    getSupportedModesByModel,
    resolveVideoDurationOptions,
    VIDEO_MODELS
} from '../constants';
import type { VideoGenerationMode } from '../entities';
import { useVideoStore } from '../store/videoStore';
import { ModeTabsBar } from './modes';
import {
    canGenerateByPanelSchema,
    createVideoPanelRuntimeState,
    getModeTransitionPatch,
    VideoGenerateFooter,
    VideoModeTabContent,
    VideoOutputSettingsSection,
    VideoPanelHeader,
    VideoPanelLabel,
    VideoPromptStyleSection
} from './panel';

const isRenderableUrl = (value: string): boolean => {
    return (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        value.startsWith('asset:')
    );
};

const toRenderableAttachmentUrl = (
    rawSource: string | undefined,
    resolvedSource: string | null
): string | undefined => {
    if (resolvedSource) {
        return resolvedSource;
    }
    if (rawSource && isRenderableUrl(rawSource)) {
        return rawSource;
    }
    return undefined;
};

type UploadField = 'referenceImages' | null;

export const VideoLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, setMode, generate, isGenerating } = useVideoStore();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [activeUploadField, setActiveUploadField] = useState<UploadField>(null);
    const [resolvedReferenceImages, setResolvedReferenceImages] = useState<string[]>([]);

    const { url: startFrameUrl } = useAssetUrl(config.image || null, {
        resolver: resolveAssetUrlByAssetIdFirst
    });
    const { url: endFrameUrl } = useAssetUrl(config.lastFrame || null, {
        resolver: resolveAssetUrlByAssetIdFirst
    });

    const activeModel = VIDEO_MODELS.find((item) => item.id === config.model) || VIDEO_MODELS[0];
    const maxAssets = activeModel.maxAssetsCount || 5;
    const modeAvailability = useMemo(
        () => buildVideoModeAvailabilityByModel(config.model),
        [config.model]
    );
    const supportedModes = useMemo(
        () => getSupportedModesByModel(config.model),
        [config.model]
    );
    const durationOptions = useMemo(
        () => resolveVideoDurationOptions(config.model, config.mode),
        [config.model, config.mode]
    );
    const runtimeState = useMemo(
        () => createVideoPanelRuntimeState(config, isGenerating),
        [config, isGenerating]
    );
    const isModeEnabled = modeAvailability[config.mode]?.enabled !== false;
    const canGenerate = isModeEnabled && canGenerateByPanelSchema(runtimeState);
    const isLipSyncMode = runtimeState.mode === 'lip-sync';

    const handleAssetSelect = (field: keyof typeof config) => (asset: Asset | null) => {
        if (asset) {
            setConfig({ [field]: asset.path || asset.id });
            return;
        }
        setConfig({ [field]: undefined });
    };

    const handleModeChange = (mode: VideoGenerationMode) => {
        if (modeAvailability[mode]?.enabled === false) {
            return;
        }
        setMode(mode);
        const patch = getModeTransitionPatch(mode, config);
        if (patch) {
            setConfig(patch);
        }
    };

    useEffect(() => {
        if (modeAvailability[config.mode]?.enabled === false) {
            const nextMode = supportedModes.find((mode) => modeAvailability[mode]?.enabled);
            if (nextMode) {
                setMode(nextMode);
                const patch = getModeTransitionPatch(nextMode, config);
                if (patch) {
                    setConfig(patch);
                }
            }
        }
    }, [config, config.mode, modeAvailability, setConfig, setMode, supportedModes]);

    useEffect(() => {
        if (!durationOptions.some((item) => item.id === config.duration)) {
            setConfig({
                duration: getNearestSupportedDurationByModelMode(config.model, config.mode, config.duration)
            });
        }
    }, [config.duration, config.mode, config.model, durationOptions, setConfig]);

    const handleSwapStartEndFrames = () => {
        setConfig({
            image: config.lastFrame,
            lastFrame: config.image
        });
    };

    useEffect(() => {
        const sources = config.referenceImages || [];
        if (sources.length === 0) {
            setResolvedReferenceImages([]);
            return;
        }

        let cancelled = false;
        const resolveSources = async () => {
            const resolved = await Promise.all(
                sources.map(async (source) => {
                    const url = await resolveAssetUrlByAssetIdFirst(source);
                    if (url) {
                        return url;
                    }
                    return isRenderableUrl(source) ? source : '';
                })
            );
            if (!cancelled) {
                setResolvedReferenceImages(resolved);
            }
        };

        void resolveSources();
        return () => {
            cancelled = true;
        };
    }, [config.referenceImages]);

    const attachments: InputAttachment[] = useMemo(() => {
        const list: InputAttachment[] = [];

        if (config.image) {
            list.push({
                id: 'start_frame',
                name: 'Start Frame',
                type: 'image',
                url: toRenderableAttachmentUrl(config.image, startFrameUrl)
            });
        }

        if (config.lastFrame) {
            list.push({
                id: 'end_frame',
                name: 'End Frame',
                type: 'image',
                url: toRenderableAttachmentUrl(config.lastFrame, endFrameUrl)
            });
        }

        if (config.referenceImages && config.referenceImages.length > 0) {
            config.referenceImages.forEach((item, index) => {
                list.push({
                    id: `ref_${index}`,
                    name: `Ref ${index + 1}`,
                    type: 'image',
                    url: toRenderableAttachmentUrl(item, resolvedReferenceImages[index] || null)
                });
            });
        }

        return list;
    }, [config.image, config.lastFrame, config.referenceImages, endFrameUrl, resolvedReferenceImages, startFrameUrl]);

    const handleEnhance = async (text: string) => {
        return await genAIService.enhancePrompt(text);
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            <VideoPanelHeader
                model={config.model}
                onModelChange={(model) => setConfig({ model })}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="space-y-2">
                    <VideoPanelLabel icon={<Sparkles size={12} className="text-blue-400" />}>
                        Modes
                    </VideoPanelLabel>
                    <ModeTabsBar mode={config.mode} onModeChange={handleModeChange} availability={modeAvailability} />
                </div>

                <div className="space-y-6">
                    <VideoModeTabContent
                        config={config}
                        isGenerating={isGenerating}
                        maxAssets={maxAssets}
                        resolvedReferenceImages={resolvedReferenceImages}
                        onConfigChange={setConfig}
                        onStartFrameChange={handleAssetSelect('image')}
                        onEndFrameChange={handleAssetSelect('lastFrame')}
                        onSubjectReferenceChange={handleAssetSelect('image')}
                        onTargetVideoChange={handleAssetSelect('targetVideo')}
                        onTargetImageChange={handleAssetSelect('targetImage')}
                        onDriverAudioChange={handleAssetSelect('driverAudio')}
                        onSwapStartEndFrames={handleSwapStartEndFrames}
                        onOpenReferenceAssetModal={() => {
                            setActiveUploadField('referenceImages');
                            setShowAssetModal(true);
                        }}
                    />

                    {!isLipSyncMode && (
                        <VideoPromptStyleSection
                            config={config}
                            isGenerating={isGenerating}
                            attachments={attachments}
                            showStyleMenu={showStyleMenu}
                            showAdvanced={showAdvanced}
                            onPromptChange={(value) => setConfig({ prompt: value })}
                            onNegativePromptChange={(value) => setConfig({ negativePrompt: value })}
                            onStyleChange={(styleId) => setConfig({ styleId })}
                            onStyleMenuToggle={(open) => setShowStyleMenu(open)}
                            onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
                            onPromptExtendChange={(promptExtend) => setConfig({ promptExtend })}
                            onWatermarkChange={(watermark) => setConfig({ watermark })}
                            onGenerateAudioChange={(generateAudio) => setConfig({ generateAudio })}
                            onCameraFixedChange={(cameraFixed) => setConfig({ cameraFixed })}
                            onShotTypeChange={(shotType) => setConfig({ shotType })}
                            onAudioUrlChange={(audioUrl) => setConfig({ audioUrl })}
                            onEnhance={handleEnhance}
                        />
                    )}
                </div>

                {!isLipSyncMode && (
                    <>
                        <div className="h-px bg-[#27272a]" />
                        <VideoOutputSettingsSection
                            aspectRatio={config.aspectRatio}
                            duration={config.duration}
                            durationOptions={durationOptions}
                            onAspectRatioChange={(aspectRatio) => setConfig({ aspectRatio })}
                            onDurationChange={(duration) => setConfig({ duration })}
                        />
                    </>
                )}
            </div>

            <VideoGenerateFooter
                canGenerate={canGenerate}
                isGenerating={isGenerating}
                isLipSyncMode={isLipSyncMode}
                onGenerate={generate}
            />

            <ChooseAssetModal
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onConfirm={(assets) => {
                    const paths = assets
                        .map((item) => item.path || item.id)
                        .filter((value): value is string => !!value);
                    if (activeUploadField === 'referenceImages') {
                        const existing = config.referenceImages || [];
                        const combined = [...existing, ...paths];
                        setConfig({ referenceImages: combined.slice(0, maxAssets) });
                    }
                    setShowAssetModal(false);
                    setActiveUploadField(null);
                }}
                accepts={['image']}
                domain="video-studio"
                title="Select Reference Images"
                multiple
            />
        </div>
    );
};
