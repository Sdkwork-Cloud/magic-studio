import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
    createInputAttachment,
    type InputAttachment
} from '@sdkwork/magic-studio-assets/creation-chat';
import { ChooseAssetModal } from '@sdkwork/magic-studio-assets/choose-asset';
import { useAssetUrl } from '@sdkwork/magic-studio-assets/hooks';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import { findByIdOrFirst } from '@sdkwork/magic-studio-commons/utils';
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import type { Asset } from '@sdkwork/magic-studio-types/assets';
import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import {
    buildVideoModeAvailabilityByModel,
    getNearestSupportedDurationByModelMode,
    getSupportedModesByModel,
    resolveVideoDurationOptions,
    VIDEO_MODELS
} from '../constants';
import {
    hasVideoInputResourceReference,
    resolveVideoInputResourceUrl,
    type VideoConfig,
    type VideoGenerationMode,
    type VideoInputResourceType,
} from '../entities';
import { readVideoExecutionTargetFromConfig } from '../services';
import { useVideoStore } from '../store/videoStore';
import {
    toVideoInputResourceRefFromAsset,
    toVideoInputSelectableAsset,
} from '../utils/videoInputResource';
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

const toRenderableAttachmentUrl = (
    rawSource: VideoConfig['image'] | undefined,
    resolvedSource: string | null
): string | undefined => {
    if (typeof resolvedSource === 'string' && isRenderableInputResourceUrl(resolvedSource)) {
        return resolvedSource;
    }
    const directUrl = resolveVideoInputResourceUrl(rawSource);
    if (typeof directUrl === 'string' && isRenderableInputResourceUrl(directUrl)) {
        return directUrl;
    }
    return undefined;
};

type UploadField = 'referenceImages' | null;

export const VideoLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, setMode, enhancePrompt, generate, isGenerating } = useVideoStore();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [activeUploadField, setActiveUploadField] = useState<UploadField>(null);
    const [resolvedReferenceImagesState, setResolvedReferenceImagesState] = useState<string[]>([]);

    const { url: startFrameUrl } = useAssetUrl(toVideoInputSelectableAsset(config.image), {
        resolver: resolveAssetUrlByAssetIdFirst
    });
    const { url: endFrameUrl } = useAssetUrl(toVideoInputSelectableAsset(config.lastFrame), {
        resolver: resolveAssetUrlByAssetIdFirst
    });

    const activeModel = findByIdOrFirst(VIDEO_MODELS, config.model);
    const maxAssets = activeModel?.maxAssetsCount ?? 5;
    const resolvedReferenceImages = useMemo(
        () => ((config.referenceImages?.length ?? 0) === 0 ? [] : resolvedReferenceImagesState),
        [config.referenceImages, resolvedReferenceImagesState]
    );
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
    const generationTarget = useMemo(
        () => readVideoExecutionTargetFromConfig(config),
        [config]
    );
    const isModeEnabled = modeAvailability[config.mode]?.enabled !== false;
    const isLipSyncMode = runtimeState.mode === 'lip-sync';
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'video-generation',
        generationTarget.operation || 'create',
        {
            enabled: !!generationTarget.operation,
            feature: 'VideoLeftGeneratorPanel'
        }
    );
    const promptEnhanceCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'video-generation',
        'enhance-prompt',
        {
            enabled: !isLipSyncMode,
            feature: 'VideoPromptStyleSection'
        }
    );
    const generateDisabledReason = !isModeEnabled
        ? modeAvailability[config.mode]?.reason || null
        : generationTarget.unavailableReason || generationCapability.disabledReason;
    const canGenerate =
        isModeEnabled
        && !generationTarget.unavailableReason
        && generationCapability.ready
        && canGenerateByPanelSchema(runtimeState);
    const promptEnhanceUnavailableReason = promptEnhanceCapability.disabledReason;

    const resolveFieldType = (field: keyof VideoConfig): VideoInputResourceType => {
        if (field === 'targetVideo' || field === 'motionVideo') {
            return 'video';
        }
        if (field === 'driverAudio' || field === 'audioTrack') {
            return 'audio';
        }
        return 'image';
    };

    const handleAssetSelect = (field: keyof typeof config) => (asset: Asset | null) => {
        if (asset) {
            const ref = toVideoInputResourceRefFromAsset(asset, resolveFieldType(field));
            setConfig({ [field]: ref } as Partial<VideoConfig>);
            return;
        }
        setConfig({ [field]: undefined } as Partial<VideoConfig>);
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
        let cancelled = false;
        const resolveSources = async () => {
            const sources = config.referenceImages || [];
            if (sources.length === 0) {
                if (!cancelled) {
                    setResolvedReferenceImagesState([]);
                }
                return;
            }

            const resolved = await Promise.all(
                sources.map(async (source) => {
                    const url = await resolveAssetUrlByAssetIdFirst(
                        (toVideoInputSelectableAsset(source) ||
                            source) as Parameters<typeof resolveAssetUrlByAssetIdFirst>[0]
                    );
                    if (url) {
                        return url;
                    }
                    const directUrl = resolveVideoInputResourceUrl(source);
                    return typeof directUrl === 'string' && isRenderableInputResourceUrl(directUrl)
                        ? directUrl
                        : '';
                })
            );
            if (!cancelled) {
                setResolvedReferenceImagesState(resolved);
            }
        };

        void resolveSources();
        return () => {
            cancelled = true;
        };
    }, [config.referenceImages]);

    const attachments: InputAttachment[] = useMemo(() => {
        const list: InputAttachment[] = [];

        const startFrameAttachmentUrl = toRenderableAttachmentUrl(config.image, startFrameUrl);
        if (hasVideoInputResourceReference(config.image) && startFrameAttachmentUrl) {
            list.push(createInputAttachment({
                id: 'start_frame',
                name: 'Start Frame',
                type: 'image',
                url: startFrameAttachmentUrl
            }));
        }

        const endFrameAttachmentUrl = toRenderableAttachmentUrl(config.lastFrame, endFrameUrl);
        if (hasVideoInputResourceReference(config.lastFrame) && endFrameAttachmentUrl) {
            list.push(createInputAttachment({
                id: 'end_frame',
                name: 'End Frame',
                type: 'image',
                url: endFrameAttachmentUrl
            }));
        }

        if (config.referenceImages && config.referenceImages.length > 0) {
            config.referenceImages.forEach((item, index) => {
                const attachmentUrl = toRenderableAttachmentUrl(item, resolvedReferenceImages[index] || null);
                if (!hasVideoInputResourceReference(item) || !attachmentUrl) {
                    return;
                }
                list.push(createInputAttachment({
                    id: `ref_${index}`,
                    name: `Ref ${index + 1}`,
                    type: 'image',
                    url: attachmentUrl
                }));
            });
        }

        return list;
    }, [config.image, config.lastFrame, config.referenceImages, endFrameUrl, resolvedReferenceImages, startFrameUrl]);

    const handleEnhance = async (text: string) => {
        if (!promptEnhanceCapability.ready) {
            return text;
        }
        return enhancePrompt(text);
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
                            enhanceEnabled={promptEnhanceCapability.ready}
                            enhanceUnavailableReason={promptEnhanceUnavailableReason}
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
                            onAudioTrackChange={handleAssetSelect('audioTrack')}
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
                disabledReason={generateDisabledReason}
                isCapabilityLoading={generationCapability.isLoading}
                onGenerate={generate}
            />

            <ChooseAssetModal
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onConfirm={(assets) => {
                    const refs = assets
                        .map((item) => toVideoInputResourceRefFromAsset(item, 'image'))
                        .filter((value): value is NonNullable<typeof value> => !!value);
                    if (activeUploadField === 'referenceImages') {
                        const existing = config.referenceImages || [];
                        const combined = [...existing, ...refs];
                        setConfig({ referenceImages: combined.slice(0, maxAssets) });
                    }
                    setShowAssetModal(false);
                    setActiveUploadField(null);
                }}
                accepts={['image']}
                domain="video-studio"
                projectReference={{
                    slot: 'video-reference-images',
                    metadata: {
                        source: 'video-left-generator-panel',
                    },
                }}
                title="Select Reference Images"
                multiple
            />
        </div>
    );
};
