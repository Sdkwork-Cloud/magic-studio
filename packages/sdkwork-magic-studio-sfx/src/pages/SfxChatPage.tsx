
import { GenerationChatWindow } from '@sdkwork/magic-studio-assets/generation'
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React from 'react';
import { SfxStoreProvider, useSfxStore } from '../index';
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router';

const SfxChatContent: React.FC = () => {
    const { history, deleteTask, generate, isGenerating, config, setConfig } = useSfxStore();
    const { navigate } = useRouter();
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'sfx-generation',
        'create',
        {
            feature: 'SfxChatPage'
        }
    );
    const generateDisabledReason = generationCapability.disabledReason;

    return (
        <GenerationChatWindow
            mode="sfx"
            title="SFX Studio Chat"
            onNavigateBack={() => navigate(ROUTES.SFX)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            canGenerate={generationCapability.ready}
            generateDisabledReason={generateDisabledReason}
        />
    );
};

const SfxChatPage: React.FC = () => {
    return (
        <SfxStoreProvider>
            <SfxChatContent />
        </SfxStoreProvider>
    );
};

export default SfxChatPage;
