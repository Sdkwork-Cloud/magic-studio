
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router'
import { uploadHelper } from '@sdkwork/magic-studio-core/services'
import {
    GenerationChatWindow,
    type GenerationChatWindowAdapter,
} from '@sdkwork/magic-studio-assets/generation'
import React from 'react';
import { VoiceStoreProvider, useVoiceStore } from '../store/voiceStore'; 
import { voiceBusinessService } from '../services';
import type { VoiceConfig, VoiceTask } from '../entities';
import { toVoiceInputResourceRefFromAsset } from '../utils/voiceInputResource';

const AUDIO_ACCEPT = 'audio/*,.wav,.mp3,.m4a,.flac,.ogg,.aac,.webm';
const VOICE_CHAT_ADAPTER: GenerationChatWindowAdapter<VoiceConfig, VoiceTask> = {
    getConfigPrompt: (config) => config.text,
    getTaskPrompt: (task) => task.config?.text || task.text,
    createPromptPatch: (text) => ({ text }),
};

const VoiceChatContent: React.FC = () => {
    const { 
        history, deleteTask, generate, isGenerating, 
        config, setConfig 
    } = useVoiceStore();
    const { navigate } = useRouter();

    const handleUpload = async () => {
        try {
            const files = await uploadHelper.pickFiles(false, AUDIO_ACCEPT);
            if (files.length === 0) {
                return;
            }

            const file = files[0];
            const imported = await voiceBusinessService.voiceSpeakerService.importReferenceAudioFromUpload(
                file,
                'voice-chat-upload'
            );
            const referenceAudio = toVoiceInputResourceRefFromAsset(imported, 'audio');
            if (!referenceAudio) {
                return;
            }

            setConfig({
                mode: 'clone',
                inputMethod: 'upload',
                referenceAudio
            });
        } catch (error) {
            console.error('Failed to upload chat reference audio', error);
        }
    };

    return (
        <GenerationChatWindow 
            mode="voice" 
            title="Voice Lab Chat"
            backLabel="Voice Library"
            onNavigateBack={() => navigate(ROUTES.VOICE)}
            history={history}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onReuse={(task) => {
                if (task.config) {
                    setConfig(task.config);
                }
            }}
            config={config}
            setConfig={setConfig}
            onGenerate={generate}
            onUpload={handleUpload}
            adapter={VOICE_CHAT_ADAPTER}
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
