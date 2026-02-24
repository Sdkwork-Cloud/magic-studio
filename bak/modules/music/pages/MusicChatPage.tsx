
import React from 'react';
import { MusicStoreProvider, useMusicStore } from '../store/musicStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { GenerationChatWindow } from '../../../components/generate/GenerationChatWindow';

const MusicChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useMusicStore();
    const { navigate } = useRouter();

    return (
        <GenerationChatWindow 
            mode="agent" // Reusing agent mode as a generic chat holder for now, or specific music mode if we extend the component
            title="Music Studio Chat"
            backLabel="Music Library"
            onNavigateBack={() => navigate(ROUTES.MUSIC)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={() => {}} // No upload for music chat yet
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
