
import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { GenerationChatWindow } from '../../../components/generate/GenerationChatWindow';

const CharacterChatPage: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useCharacterStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow 
            mode="agent" // Generic chat for now
            title="Character Studio Chat"
            backLabel="Character Library"
            onNavigateBack={() => navigate(ROUTES.CHARACTER)}
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

export default CharacterChatPage;
