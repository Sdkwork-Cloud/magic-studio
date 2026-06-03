import React, { useEffect, useMemo, useState } from 'react';
import {
    ChooseAssetModal,
    persistChooseAssetProjectReference,
    type ChooseAssetProjectReference,
} from '@sdkwork/magic-studio-assets/choose-asset';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import type { Asset } from '@sdkwork/magic-studio-types/assets';
import {
    hasImageInputResourceReference,
    type ImageInputResourceRef
} from '../entities';
import { readImageExecutionTargetFromConfig } from '../services';
import { useImageStore } from '../store/imageStore';
import { toImageInputResourceRefFromAsset } from '../utils/imageInputResource';
import {
    canGenerateByImagePanelSchema,
    createImagePanelRuntimeState,
    DEFAULT_IMAGE_MODEL,
    getImageOutputConfigPatch,
    ImageAdvancedSettingsSection,
    ImageGenerateFooter,
    ImageOutputSettingsSection,
    ImagePanelHeader,
    ImagePromptSection,
    ImageReferenceSection,
    ImageStyleSection,
    resolveImageOutputPolicy
} from './panel';

const IMAGE_REFERENCE_PROJECT_REFERENCE = {
    slot: 'image-reference-images',
    metadata: {
        source: 'image-left-generator-panel',
    },
} satisfies ChooseAssetProjectReference;

export const ImageLeftGeneratorPanel: React.FC<{ initialPrompt?: string; onClose?: () => void }> = ({
    initialPrompt
}) => {
    const { config, setConfig, generate, enhancePrompt, isGenerating } = useImageStore();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);

    const activeModel = config.model || DEFAULT_IMAGE_MODEL;
    const outputPolicy = useMemo(() => resolveImageOutputPolicy(activeModel), [activeModel]);
    const referenceImages = useMemo(() => {
        const multi = (config.referenceImages || []).filter(
            (item): item is ImageInputResourceRef => hasImageInputResourceReference(item)
        );
        if (multi.length > 0) {
            return multi;
        }
        const fallbackReferenceImage = hasImageInputResourceReference(config.referenceImage)
            ? config.referenceImage
            : null;
        if (fallbackReferenceImage) {
            return [fallbackReferenceImage];
        }
        return [];
    }, [config.referenceImage, config.referenceImages]);
    const runtimeState = useMemo(
        () => createImagePanelRuntimeState(config, isGenerating),
        [config, isGenerating]
    );
    const generationTarget = useMemo(
        () => readImageExecutionTargetFromConfig(config),
        [config]
    );
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'image-generation',
        generationTarget.operation,
        {
            feature: 'ImageLeftGeneratorPanel'
        }
    );
    const promptEnhanceCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'image-generation',
        'enhance-prompt',
        {
            feature: 'ImagePromptSection'
        }
    );
    const canGenerate =
        !generationTarget.unavailableReason &&
        generationCapability.ready &&
        canGenerateByImagePanelSchema(runtimeState);
    const generateDisabledReason =
        generationTarget.unavailableReason || generationCapability.disabledReason;
    const promptEnhanceUnavailableReason = promptEnhanceCapability.disabledReason;

    useEffect(() => {
        if (initialPrompt) {
            setConfig({ prompt: initialPrompt });
        }
    }, [initialPrompt, setConfig]);

    useEffect(() => {
        const patch = getImageOutputConfigPatch(activeModel, config);
        if (patch) {
            setConfig(patch);
        }
    }, [activeModel, config, setConfig]);

    const handleReferenceImagesChange = (images: ImageInputResourceRef[]) => {
        const sanitized = images
            .filter((item): item is ImageInputResourceRef => hasImageInputResourceReference(item))
            .slice(0, outputPolicy.maxReferenceImages);
        setConfig({
            referenceImages: sanitized,
            referenceImage: sanitized[0]
        });
    };

    const handleLocalReferenceUpload = async (files: FileList): Promise<void> => {
        const imported: ImageInputResourceRef[] = [];
        for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
            const buffer = await file.arrayBuffer();
            const uploaded = await importAssetBySdk(
                {
                    name: file.name,
                    data: new Uint8Array(buffer)
                },
                'image',
                { domain: 'image-studio' }
            );
            const resolvedUrl =
                (await resolveAssetUrlByAssetIdFirst(
                    uploaded as Parameters<typeof resolveAssetUrlByAssetIdFirst>[0]
                )) ||
                uploaded.path ||
                uploaded.id ||
                '';
            await persistChooseAssetProjectReference({
                uploaded,
                resolvedUrl,
                fallbackType: 'image',
                domain: 'image-studio',
                projectReference: IMAGE_REFERENCE_PROJECT_REFERENCE,
            });
            const ref = toImageInputResourceRefFromAsset({
                ...uploaded,
                path: uploaded.path || uploaded.id,
            } as Asset);
            if (ref) {
                imported.push(ref);
            }
        }

        handleReferenceImagesChange([...referenceImages, ...imported]);
    };

    const handleEnhance = async (text: string) => {
        if (!promptEnhanceCapability.ready) {
            return text;
        }
        return enhancePrompt(text);
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            <ImagePanelHeader
                model={activeModel}
                onModelChange={(model) => setConfig({ model })}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <ImageReferenceSection
                    referenceImages={referenceImages}
                    maxReferenceImages={outputPolicy.maxReferenceImages}
                    onChangeReferences={handleReferenceImagesChange}
                    onUploadLocalFiles={handleLocalReferenceUpload}
                    onOpenAssetModal={() => setShowAssetModal(true)}
                />

                <ImagePromptSection
                    prompt={config.prompt}
                    isGenerating={isGenerating}
                    onPromptChange={(prompt) => setConfig({ prompt })}
                    onEnhance={handleEnhance}
                    enhanceEnabled={promptEnhanceCapability.ready}
                    enhanceUnavailableReason={promptEnhanceUnavailableReason}
                />

                <ImageStyleSection
                    styleId={config.styleId}
                    showStyleMenu={showStyleMenu}
                    onStyleChange={(styleId) => setConfig({ styleId })}
                    onStyleMenuToggle={(open) => setShowStyleMenu(open)}
                />

                <div className="h-px bg-[#27272a]" />

                <ImageOutputSettingsSection
                    aspectRatio={config.aspectRatio}
                    batchSize={config.batchSize}
                    outputPolicy={outputPolicy}
                    onAspectRatioChange={(aspectRatio) => setConfig({ aspectRatio })}
                    onBatchSizeChange={(batchSize) => setConfig({ batchSize })}
                />

                <ImageAdvancedSettingsSection
                    showAdvanced={showAdvanced}
                    negativePrompt={config.negativePrompt}
                    onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
                    onNegativePromptChange={(negativePrompt) => setConfig({ negativePrompt })}
                />
            </div>

            <ImageGenerateFooter
                canGenerate={canGenerate}
                isGenerating={isGenerating}
                batchSize={config.batchSize || outputPolicy.defaultBatchSize}
                disabledReason={generateDisabledReason}
                isCapabilityLoading={generationCapability.isLoading}
                onGenerate={generate}
            />

            <ChooseAssetModal
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onConfirm={(assets) => {
                    const refs = assets
                        .map((item) => toImageInputResourceRefFromAsset(item))
                        .filter((item): item is ImageInputResourceRef => !!item);
                    handleReferenceImagesChange([...referenceImages, ...refs]);
                    setShowAssetModal(false);
                }}
                accepts={['image']}
                domain="image-studio"
                projectReference={IMAGE_REFERENCE_PROJECT_REFERENCE}
                title="Select Reference Images"
                multiple
            />
        </div>
    );
};
