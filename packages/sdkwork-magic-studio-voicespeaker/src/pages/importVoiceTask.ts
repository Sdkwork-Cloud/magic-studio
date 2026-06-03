import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';

import { PRESET_VOICES } from '../constants';
import {
    createGeneratedVoiceResult,
    createVoiceTask,
    type VoiceModelType,
    type VoiceTask
} from '../entities';

const readSpeakerIdFromImport = (data: ImportData): string => {
    const metadata = data.resource.metadata;
    if (metadata && typeof metadata === 'object') {
        const speakerId = (metadata as Record<string, unknown>).speakerId;
        if (typeof speakerId === 'string' && speakerId.trim().length > 0) {
            return speakerId.trim();
        }
    }

    return '';
};

const toVoiceModelType = (value: unknown): VoiceModelType => {
    switch (value) {
        case 'gemini-tts':
        case 'eleven-labs-v2':
        case 'openai-tts-1':
        case 'azure-tts':
        case 'custom':
            return value;
        default:
            return 'gemini-tts';
    }
};

export const mapImportDataToVoiceTask = (data: ImportData): VoiceTask => {
    const importTaskKey = resolveImportDataKey(data);
    const importedSpeakerId = readSpeakerIdFromImport(data);
    const fallbackVoiceId = PRESET_VOICES[0]?.id || '';
    const reusableVoiceId = importedSpeakerId || fallbackVoiceId;
    const result = createGeneratedVoiceResult({
        id: data.resource.id ?? null,
        uuid: data.resource.uuid,
        assetId: data.resource.assetId ?? null,
        assetUuid: data.resource.assetUuid ?? null,
        primaryResourceId: data.resource.primaryResourceId ?? null,
        primaryResourceUuid: data.resource.primaryResourceUuid ?? null,
        resourceViewId: data.resource.resourceViewId ?? null,
        resourceViewUuid: data.resource.resourceViewUuid ?? null,
        resource: {
            id: data.resource.id ?? null,
            uuid:
                data.resource.resourceViewUuid ||
                data.resource.primaryResourceUuid ||
                data.resource.assetUuid ||
                data.resource.uuid,
            assetId: data.resource.assetId ?? null,
            primaryResourceId: data.resource.primaryResourceId ?? null,
            resourceViewId: data.resource.resourceViewId ?? null,
            url: data.resource.url,
            name: data.resource.name || 'Imported Voice',
            mimeType: data.resource.mimeType,
            duration: data.duration || 0,
            metadata: data.resource.metadata,
        },
        duration: data.duration || 0,
        text: data.prompt,
        speakerId: reusableVoiceId,
        modelId: data.model,
    });

    return createVoiceTask({
        id: null,
        uuid: importTaskKey,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        status: 'completed',
        speakerId: reusableVoiceId,
        text: data.prompt,
        config: {
            text: data.prompt,
            previewText: data.prompt,
            mode: 'design',
            inputMethod: 'upload',
            voiceId: reusableVoiceId,
            model: toVoiceModelType(data.model),
            speed: 1,
            pitch: 1,
            mediaType: 'voice',
        },
        result,
        results: [result],
    });
};
