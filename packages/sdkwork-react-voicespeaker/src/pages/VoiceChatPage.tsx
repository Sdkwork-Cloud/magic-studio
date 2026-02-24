
import { useRouter, ROUTES } from 'sdkwork-react-core'
import { GenerationChatWindow } from 'sdkwork-react-assets'
import React from 'react';
import { VoiceStoreProvider, useVoiceStore } from '../store/voiceStore'; 
const VoiceChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useVoiceStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow 
            mode="agent" 
            title="Voice Lab Chat"
            backLabel="Voice Library"
            onNavigateBack={() => navigate(ROUTES.VOICE)}
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

const VoiceChatPage: React.FC = () => {
    return (
        <VoiceStoreProvider>
            <VoiceChatContent />
        </VoiceStoreProvider>
    );
};

export default VoiceChatPage;
