
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import { uploadHelper } from '@sdkwork/magic-studio-core/services'
import { GenerationChatWindow } from '@sdkwork/magic-studio-assets/generation';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import React from 'react';
import { AudioStoreProvider, useAudioStore } from '../store';
import { toAudioInputResourceRefFromAsset } from '../utils/audioInputResource';
import { TRANSCRIPTION_AUDIO_MODEL } from '../utils/audioModel';

const AUDIO_ACCEPT = 'audio/*,.wav,.mp3,.m4a,.flac,.ogg,.aac,.webm';

const AudioChatContent: React.FC = () => {
    const {
        history, deleteTask, generate, isGenerating,
        config, setConfig
    } = useAudioStore();
    const { navigate } = useRouter();

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, AUDIO_ACCEPT);
            if (files.length === 0) {
                return;
            }

            const file = files[0];
            const imported = await importAssetBySdk(
                {
                    name: file.name,
                    data: file.data,
                },
                'audio',
                { domain: 'audio-studio' }
            );
            const sourceAudio = toAudioInputResourceRefFromAsset(imported, 'audio');
            if (!sourceAudio) {
                return;
            }

            const currentMode = config.mode || 'text-to-speech';
            const nextMode = currentMode === 'translation' ? 'translation' : 'transcription';
            setConfig({
                mode: nextMode,
                model: TRANSCRIPTION_AUDIO_MODEL,
                format: config.format || 'text',
                sourceAudio,
            });
        } catch (error) {
            console.error('Failed to upload chat source audio', error);
        }
    };

    return (
        <GenerationChatWindow
            mode="audio"
            title="Speech Studio Chat"
            onNavigateBack={() => navigate(ROUTES.AUDIO)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => setConfig(task.config)}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={handleUpload}
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
