import { LocalStorageService } from 'sdkwork-react-core';
import { AudioTask } from '../entities/audio.entity';

const STORAGE_KEY_AUDIO_HISTORY = 'open_studio_audio_history_v1';

class AudioHistoryService extends LocalStorageService<AudioTask & { uuid: string }> {
    constructor() {
        super(STORAGE_KEY_AUDIO_HISTORY);
    }
}

export const audioHistoryService = new AudioHistoryService();
