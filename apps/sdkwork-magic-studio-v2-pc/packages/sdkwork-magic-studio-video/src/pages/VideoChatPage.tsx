
import { GenerationChatWindow } from '@sdkwork/magic-studio-assets/generation'
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React, { useEffect, useMemo } from 'react';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import { VideoStoreProvider, useVideoStore } from '../store/videoStore';
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router';
import { uploadHelper } from '@sdkwork/magic-studio-core/services';
import { buildVideoModeAvailabilityByModel, getSupportedModesByModel } from '../constants';
import {
    canGenerateByPanelSchema,
    createVideoPanelRuntimeState,
    getModeTransitionPatch,
} from '../components/panel';
import { readVideoExecutionTargetFromConfig } from '../services';
import { toVideoInputResourceRefFromAsset } from '../utils/videoInputResource';

const shouldAllowEmptyPromptSubmit = (
    state: ReturnType<typeof createVideoPanelRuntimeState>
): boolean => {
    if (state.mode === 'extend') {
        return true;
    }

    return state.mode === 'lip-sync' && state.lipSyncDriverType !== 'tts';
};

const VideoChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig, setMode
    } = useVideoStore();
    const { navigate } = useRouter();
    const runtimeState = useMemo(
        () => createVideoPanelRuntimeState(config, isGenerating),
        [config, isGenerating]
    );
    const generationTarget = useMemo(
        () => readVideoExecutionTargetFromConfig(config),
        [config]
    );
    const modeAvailability = useMemo(
        () => buildVideoModeAvailabilityByModel(config.model),
        [config.model]
    );
    const supportedModes = useMemo(
        () => getSupportedModesByModel(config.model),
        [config.model]
    );
    const isModeEnabled = modeAvailability[config.mode]?.enabled !== false;
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'video-generation',
        generationTarget.operation || 'create',
        {
            enabled: !!generationTarget.operation,
            feature: 'VideoChatPage'
        }
    );
    const canGenerate =
        isModeEnabled &&
        !generationTarget.unavailableReason &&
        generationCapability.ready &&
        canGenerateByPanelSchema(runtimeState);
    const generateDisabledReason = !isModeEnabled
        ? modeAvailability[config.mode]?.reason || null
        : generationTarget.unavailableReason || generationCapability.disabledReason;
    const allowEmptyPromptSubmit = shouldAllowEmptyPromptSubmit(runtimeState);

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

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, 'image/*'); // Single frame for now in chat mode
            if (files.length > 0) {
                const file = files[0];
                const imported = await importAssetBySdk(
                    {
                        name: file.name,
                        data: file.data,
                    },
                    'image',
                    { domain: 'video-studio' }
                );
                const imageRef = toVideoInputResourceRefFromAsset(imported, 'image');
                if (!imageRef) {
                    return;
                }
                setConfig({
                    image: imageRef,
                    mode: 'subject_ref'
                });
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    return (
        <GenerationChatWindow 
            mode="video"
            title="Video Studio Chat"
            onNavigateBack={() => navigate(ROUTES.VIDEO)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            canGenerate={canGenerate}
            allowEmptyPromptSubmit={allowEmptyPromptSubmit}
            generateDisabledReason={generateDisabledReason}
            onUpload={handleUpload}
        />
    );
};

const VideoChatPage: React.FC = () => {
    return (
        <VideoStoreProvider>
            <VideoChatContent />
        </VideoStoreProvider>
    );
};

export default VideoChatPage;
