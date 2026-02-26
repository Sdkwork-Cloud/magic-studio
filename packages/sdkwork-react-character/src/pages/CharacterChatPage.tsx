
import { useRouter, ROUTES } from '@sdkwork/react-core'
import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import { GenerationChatWindow } from '@sdkwork/react-assets';

const CharacterChatPage: React.FC = () => {
    const {
        history, deleteTask, generate, isGenerating,
        config, setConfig
    } = useCharacterStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow
            mode="character"
            title="Character Studio Chat"
            onNavigateBack={() => navigate(ROUTES.CHARACTER)}
            history={history as any}
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

export default CharacterChatPage;
