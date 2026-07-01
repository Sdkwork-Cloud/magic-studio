
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import { uploadHelper } from '@sdkwork/magic-studio-core/services'
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React, { useEffect, useMemo } from 'react';
import { MusicStoreProvider, useMusicStore } from '../index';
import { GenerationChatWindow } from '@sdkwork/magic-studio-assets/generation';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import { toGeneratedMusicResultFromAsset } from '../utils/musicSourceAsset';

const MUSIC_ACCEPT = 'audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac,.webm';

const resolveMusicMode = (mode: string | undefined): 'generate' | 'similar' | 'remix' | 'extend' => {
    if (mode === 'similar' || mode === 'remix' || mode === 'extend') {
        return mode;
    }
    return 'generate';
};

const resolveCanGenerate = (
    config: ReturnType<typeof useMusicStore>['config']
): boolean => {
    const mode = resolveMusicMode(config.mode);
    if (mode === 'similar') {
        return Boolean(config.sourceMusic);
    }
    if (mode === 'remix') {
        return Boolean(config.sourceMusic && config.style.trim());
    }
    if (mode === 'extend') {
        return Boolean(config.sourceMusic && (config.extendDuration || 0) > 0);
    }
    return Boolean(config.prompt.trim());
};

const MusicChatContent: React.FC = () => {
    const { history, deleteTask, generate, isGenerating, config, setConfig } = useMusicStore();
    const { navigate } = useRouter();
    const mode = resolveMusicMode(config.mode);
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        mode,
        {
            feature: 'MusicChatPage'
        }
    );
    const similarCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'similar',
        {
            feature: 'MusicChatPage'
        }
    );
    const remixCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'remix',
        {
            feature: 'MusicChatPage'
        }
    );
    const extendCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'extend',
        {
            feature: 'MusicChatPage'
        }
    );
    const workflowAvailability = useMemo(
        () => ({
            generate: {
                enabled: generationCapability.ready,
                reason: generationCapability.disabledReason,
            },
            similar: {
                enabled: similarCapability.ready,
                reason: similarCapability.disabledReason,
            },
            remix: {
                enabled: remixCapability.ready,
                reason: remixCapability.disabledReason,
            },
            extend: {
                enabled: extendCapability.ready,
                reason: extendCapability.disabledReason,
            },
        }),
        [extendCapability, generationCapability, remixCapability, similarCapability]
    );
    const generateDisabledReason = workflowAvailability[mode].enabled
        ? null
        : workflowAvailability[mode].reason;
    const canGenerate = workflowAvailability[mode].enabled && resolveCanGenerate(config);

    useEffect(() => {
        if (workflowAvailability[mode].enabled) {
            return;
        }

        const fallbackMode = (['generate', 'similar', 'remix', 'extend'] as const).find(
            (candidate) => workflowAvailability[candidate].enabled
        );
        if (fallbackMode && fallbackMode !== mode) {
            setConfig({ mode: fallbackMode });
        }
    }, [mode, setConfig, workflowAvailability]);

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, MUSIC_ACCEPT);
            if (files.length === 0) {
                return;
            }

            const file = files[0];
            const imported = await importAssetBySdk(
                {
                    name: file.name,
                    data: file.data,
                },
                'music',
                { domain: 'music' }
            );
            const resolvedUrl =
                (await resolveAssetUrlByAssetIdFirst(imported)) ||
                (typeof imported.path === 'string' ? imported.path : undefined);
            const sourceMusic = toGeneratedMusicResultFromAsset(imported, resolvedUrl);
            if (!sourceMusic) {
                return;
            }

            const currentMode = config.mode || 'generate';
            const preferredMode = currentMode === 'generate' && similarCapability.ready ? 'similar' : currentMode;
            setConfig({
                mode: resolveMusicMode(preferredMode),
                sourceMusic,
            });
        } catch (error) {
            console.error('Failed to upload source music in chat', error);
        }
    };

    return (
        <GenerationChatWindow
            mode="music"
            title="Music Studio Chat"
            onNavigateBack={() => navigate(ROUTES.MUSIC)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            canGenerate={canGenerate}
            allowEmptyPromptSubmit={mode !== 'generate'}
            generateDisabledReason={generateDisabledReason}
            onUpload={handleUpload}
        />
    );
};

const MusicChatPage: React.FC = () => {
    return (
        <MusicStoreProvider>
            <MusicChatContent />
        </MusicStoreProvider>
    );
};

export default MusicChatPage;
