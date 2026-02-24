
import React from 'react';
import { ImageStoreProvider, useImageStore } from '../store/imageStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { uploadHelper } from '../../drive/utils/uploadHelper';
import { GenerationChatWindow } from '../../../components/generate/GenerationChatWindow';

const ImageChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useImageStore();
    const { navigate } = useRouter();

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(true, 'image/*');
            if (files.length > 0) {
                const newImages: string[] = [];
                for (const file of files) {
                    let binary = '';
                    const len = file.data.byteLength;
                    for (let i = 0; i < len; i++) { binary += String.fromCharCode(file.data[i]); }
                    newImages.push(`data:image/png;base64,${btoa(binary)}`);
                }
                const currentImages = config.referenceImages || [];
                const combined = [...currentImages, ...newImages].slice(0, 5);
                setConfig({ referenceImages: combined });
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    const removeReferenceImage = (index: number) => {
        const currentImages = config.referenceImages || [];
        const updated = currentImages.filter((_, i) => i !== index);
        setConfig({ referenceImages: updated });
    };

    return (
        <GenerationChatWindow 
            mode="image"
            title="AI Studio Chat"
            onNavigateBack={() => navigate(ROUTES.IMAGE)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={handleUpload}
            onRemoveReferenceImage={removeReferenceImage}
        />
    );
};

const ImageChatPage: React.FC = () => {
    return (
        <ImageStoreProvider>
            <ImageChatContent />
        </ImageStoreProvider>
    );
};

export default ImageChatPage;
