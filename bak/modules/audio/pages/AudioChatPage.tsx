
import React from 'react';
import { AudioStoreProvider, useAudioStore } from '../store/audioStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { GenerationChatWindow } from '../../../components/generate/GenerationChatWindow';

const AudioChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useAudioStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow 
            mode="agent" 
            title="Speech Studio Chat"
            backLabel="Speech Library"
            onNavigateBack={() => navigate(ROUTES.AUDIO)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={() => {}}
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
