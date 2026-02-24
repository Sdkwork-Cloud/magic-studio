
import React from 'react';
import { SfxStoreProvider, useSfxStore } from '../store/sfxStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { GenerationChatWindow } from '../../../components/generate/GenerationChatWindow';

const SfxChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useSfxStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow 
            mode="agent" // Using generic agent mode for now as specific SFX mode not defined in chat input yet
            title="SFX Studio Chat"
            backLabel="SFX Library"
            onNavigateBack={() => navigate(ROUTES.SFX)}
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

const SfxChatPage: React.FC = () => {
    return (
        <SfxStoreProvider>
            <SfxChatContent />
        </SfxStoreProvider>
    );
};

export default SfxChatPage;
