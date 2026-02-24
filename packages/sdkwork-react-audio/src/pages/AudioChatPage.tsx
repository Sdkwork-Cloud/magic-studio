
import { useRouter, ROUTES } from 'sdkwork-react-core'
import { GenerationChatWindow } from 'sdkwork-react-assets';
import React from 'react';
import { AudioStoreProvider, useAudioStore } from '../store';

const AudioChatContent: React.FC = () => {
    const {
        history, deleteTask, generate, isGenerating,
        config, setConfig
    } = useAudioStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow
            mode="audio"
            title="Speech Studio Chat"
            onNavigateBack={() => navigate(ROUTES.AUDIO)}
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

const AudioChatPage: React.FC = () => {
    return (
        <AudioStoreProvider>
            <AudioChatContent />
        </AudioStoreProvider>
    );
};

export default AudioChatPage;
