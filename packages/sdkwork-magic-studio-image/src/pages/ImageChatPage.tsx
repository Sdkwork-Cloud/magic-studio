// GenerationChatWindow is consumed from @sdkwork/magic-studio-assets
import { GenerationChatWindow } from '@sdkwork/magic-studio-assets/generation';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React from 'react';
import {
    readAssetRecordMetadataValue,
    resolveAssetRecordClientUuid,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import { ImageStoreProvider, useImageStore } from '../store/imageStore';
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router';
import { uploadHelper } from '@sdkwork/magic-studio-core/services';
import {
    createImageInputResourceRef,
    type ImageInputResourceRef
} from '../entities';
import {
    hasImageExecutionReferenceImages,
    readImageExecutionTargetFromConfig,
} from '../services';

const ImageChatContent: React.FC = () => {
    const {
        history, deleteTask, generate, isGenerating,
        config, setConfig
    } = useImageStore();
    const { navigate } = useRouter();
    const hasPrompt = config.prompt.trim().length > 0;
    const hasReferenceImages = hasImageExecutionReferenceImages(config);
    const generationTarget = readImageExecutionTargetFromConfig(config);
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'image-generation',
        generationTarget.operation,
        {
            feature: 'ImageChatPage'
        }
    );
    const canGenerate =
        !generationTarget.unavailableReason &&
        generationCapability.ready &&
        (hasPrompt || hasReferenceImages);
    const generateDisabledReason =
        generationTarget.unavailableReason || generationCapability.disabledReason;

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(true, 'image/*');
            if (files.length > 0) {
                const newImages: ImageInputResourceRef[] = [];
                for (const file of files) {
                    const imported = await importAssetBySdk(
                        {
                            name: file.name,
                            data: file.data,
                        },
                        'image',
                        { domain: 'image-studio' }
                    );
                    const runtimeUuid = resolveAssetRecordClientUuid(imported);
                    const assetUuid = readAssetRecordMetadataValue(imported, 'assetUuid');
                    newImages.push(
                        createImageInputResourceRef({
                            id: null,
                            uuid: runtimeUuid,
                            assetId: imported.id,
                            assetUuid,
                            url: imported.path,
                            name: imported.name,
                        })
                    );
                }
                const currentImages = config.referenceImages || [];
                const combined = [...currentImages, ...newImages].slice(0, 5);
                setConfig({ referenceImages: combined });
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    const removeReferenceImage = (index: number) => {
        const currentImages = config.referenceImages || [];
        const updated = currentImages.filter((_, i: number) => i !== index);
        setConfig({ referenceImages: updated });
    };

    return (
        <GenerationChatWindow
            mode="image"
            title="AI Studio Chat"
            onNavigateBack={() => navigate(ROUTES.IMAGE)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            canGenerate={canGenerate}
            allowEmptyPromptSubmit={generationTarget.operation === 'variation'}
            generateDisabledReason={generateDisabledReason}
            onUpload={handleUpload}
            onRemoveReferenceImage={removeReferenceImage}
        />
    );
};

const ImageChatPage: React.FC = () => {
    return (
        <ImageStoreProvider>
            <ImageChatContent />
        </ImageStoreProvider>
    );
};

export default ImageChatPage;
