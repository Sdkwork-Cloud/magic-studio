
import { GenerationChatWindow } from '@sdkwork/react-assets'
import React from 'react';
import { VideoStoreProvider, useVideoStore } from '../store/videoStore';
;
;
;
import { useRouter, ROUTES, uploadHelper } from '@sdkwork/react-core';

const VideoChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useVideoStore();
    const { navigate } = useRouter();

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, 'image/*'); // Single frame for now in chat mode
            if (files.length > 0) {
                const file = files[0];
                let binary = '';
                const len = file.data.byteLength;
                for (let i = 0; i < len; i++) { binary += String.fromCharCode(file.data[i]); }
                const base64 = btoa(binary);
                setConfig({ image: `data:image/png;base64,${base64}`, mode: 'image' });
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    const removeStartFrame = () => {
        setConfig({ image: undefined, mode: 'text' });
    };

    return (
        <GenerationChatWindow 
            mode="video"
            title="Video Studio Chat"
            onNavigateBack={() => navigate(ROUTES.VIDEO)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={handleUpload}
            onRemoveStartFrame={removeStartFrame}
        />
    );
};

const VideoChatPage: React.FC = () => {
    return (
        <VideoStoreProvider>
            <VideoChatContent />
        </VideoStoreProvider>
    );
};

export default VideoChatPage;
