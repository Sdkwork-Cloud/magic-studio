
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import { uploadHelper } from '@sdkwork/magic-studio-core/services'
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import { GenerationChatWindow } from '@sdkwork/magic-studio-assets/generation';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import { toCharacterAvatarAssetFields } from '../utils/characterAvatarAsset';
import type { CharacterConfig, CharacterTask } from '../entities';

const IMAGE_ACCEPT = 'image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp';

const characterChatAdapter = {
    getConfigPrompt: (config: CharacterConfig) => config.description || config.prompt || '',
    getTaskPrompt: (task: CharacterTask) => task.config?.description || task.config?.prompt || '',
    createPromptPatch: (prompt: string, config: CharacterConfig): Partial<CharacterConfig> => ({
        description: prompt,
        ...(config.prompt !== undefined ? { prompt } : {}),
    }),
};

const CharacterChatPage: React.FC = () => {
    const {
        history, deleteTask, generate, isGenerating,
        config, setConfig
    } = useCharacterStore();
    const { navigate } = useRouter();
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'character-generation',
        'create',
        {
            feature: 'CharacterChatPage'
        }
    );
    const generateDisabledReason = generationCapability.disabledReason;
    const canGenerate =
        generationCapability.ready &&
        (!!config.description?.trim() || !!config.prompt?.trim() || !!config.name?.trim());

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, IMAGE_ACCEPT);
            if (files.length === 0) {
                return;
            }

            const file = files[0];
            const imported = await importAssetBySdk(
                {
                    name: file.name,
                    data: file.data,
                },
                'image',
                { domain: 'character' }
            );

            setConfig(toCharacterAvatarAssetFields(imported));
        } catch (error) {
            console.error('Failed to upload character reference image', error);
        }
    };

    return (
        <GenerationChatWindow
            mode="character"
            title="Character Studio Chat"
            onNavigateBack={() => navigate(ROUTES.CHARACTER)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={handleUpload}
            canGenerate={canGenerate}
            generateDisabledReason={generateDisabledReason}
            adapter={characterChatAdapter}
        />
    );
};

export default CharacterChatPage;
