
import { assetService as _assetService, GenerationChatWindow } from '@sdkwork/react-assets' // eslint-disable-line @typescript-eslint/no-unused-vars
import React from 'react';
import { SfxStoreProvider, useSfxStore } from '../index';
import { useRouter, ROUTES } from '@sdkwork/react-core';

const SfxChatContent: React.FC = () => {
    const { history, deleteTask, generate, isGenerating, config, setConfig } = useSfxStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow
            mode="sfx"
            title="SFX Studio Chat"
            onNavigateBack={() => navigate(ROUTES.SFX)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)} // eslint-disable-line @typescript-eslint/no-unused-vars
            config={config as any}
            setConfig={setConfig as any}
            onGenerate={generate}
            onUpload={async () => {}} // eslint-disable-line @typescript-eslint/no-unused-vars
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
