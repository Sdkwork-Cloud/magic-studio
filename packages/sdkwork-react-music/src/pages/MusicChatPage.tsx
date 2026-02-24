
import { useRouter, ROUTES } from 'sdkwork-react-core'
import React from 'react';
import { MusicStoreProvider, useMusicStore } from '../index';
import { GenerationChatWindow } from 'sdkwork-react-assets';

const MusicChatContent: React.FC = () => {
    const { history, deleteTask, generate, isGenerating, config, setConfig } = useMusicStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow
            mode="music"
            title="Music Studio Chat"
            onNavigateBack={() => navigate(ROUTES.MUSIC)}
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

const MusicChatPage: React.FC = () => {
    return (
        <MusicStoreProvider>
            <MusicChatContent />
        </MusicStoreProvider>
    );
};

export default MusicChatPage;
