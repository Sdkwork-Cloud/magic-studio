import React, { useEffect, useMemo, useState } from 'react';
import { ChooseAssetModal, importAssetBySdk } from '@sdkwork/react-assets';
import { genAIService } from '@sdkwork/react-core';
import { useImageStore } from '../store/imageStore';
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

export const ImageLeftGeneratorPanel: React.FC<{ initialPrompt?: string; onClose?: () => void }> = ({
    initialPrompt
}) => {
    const { config, setConfig, generate, isGenerating } = useImageStore();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);

    const activeModel = config.model || DEFAULT_IMAGE_MODEL;
    const outputPolicy = useMemo(() => resolveImageOutputPolicy(activeModel), [activeModel]);
    const referenceImages = useMemo(() => {
        const multi = (config.referenceImages || []).filter(
            (item: unknown): item is string => typeof item === 'string' && item.length > 0
        );
        if (multi.length > 0) {
            return multi;
        }
        if (typeof config.referenceImage === 'string' && config.referenceImage.length > 0) {
            return [config.referenceImage];
        }
        return [];
    }, [config.referenceImage, config.referenceImages]);
    const runtimeState = useMemo(
        () => createImagePanelRuntimeState(config, isGenerating),
        [config, isGenerating]
    );
    const canGenerate = canGenerateByImagePanelSchema(runtimeState);

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

    const handleReferenceImagesChange = (images: string[]) => {
        const sanitized = images
            .filter((item): item is string => typeof item === 'string' && item.length > 0)
            .slice(0, outputPolicy.maxReferenceImages);
        setConfig({
            referenceImages: sanitized,
            referenceImage: sanitized[0]
        });
    };

    const handleLocalReferenceUpload = async (files: FileList): Promise<void> => {
        const imported: string[] = [];
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
            const path = uploaded.path || uploaded.id;
            if (path) {
                imported.push(path);
            }
        }

        handleReferenceImagesChange([...referenceImages, ...imported]);
    };

    const handleEnhance = async (text: string) => {
        return genAIService.enhancePrompt(text);
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
                onGenerate={generate}
            />

            <ChooseAssetModal
                isOpen={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                onConfirm={(assets) => {
                    const paths = assets
                        .map((item) => item.path || item.id)
                        .filter((item): item is string => typeof item === 'string' && item.length > 0);
                    handleReferenceImagesChange([...referenceImages, ...paths]);
                    setShowAssetModal(false);
                }}
                accepts={['image']}
                domain="image-studio"
                title="Select Reference Images"
                multiple
            />
        </div>
    );
};
