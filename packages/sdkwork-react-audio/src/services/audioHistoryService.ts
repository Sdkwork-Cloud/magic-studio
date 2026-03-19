import { LocalStorageService } from '@sdkwork/react-core';
import { AudioTask } from '../entities';
import { STORAGE_KEY_AUDIO_HISTORY } from '../constants';

const LEGACY_STORAGE_KEYS_AUDIO_HISTORY = ['open_studio_audio_history_v1'] as const;

class AudioHistoryService extends LocalStorageService<AudioTask & { uuid: string }> {
    constructor() {
        super(STORAGE_KEY_AUDIO_HISTORY, LEGACY_STORAGE_KEYS_AUDIO_HISTORY);
    }
}

export const audioHistoryService = new AudioHistoryService();
