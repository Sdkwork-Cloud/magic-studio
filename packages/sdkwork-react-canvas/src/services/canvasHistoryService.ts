import { LocalStorageService } from '@sdkwork/react-core';
import { CanvasBoard } from '../entities';

;
;

const STORAGE_KEY_CANVAS_HISTORY = 'magic_studio_canvas_history_v1';
const LEGACY_STORAGE_KEYS_CANVAS_HISTORY = ['open_studio_canvas_history_v1'] as const;

class CanvasHistoryService extends LocalStorageService<CanvasBoard> {
    constructor() {
        super(STORAGE_KEY_CANVAS_HISTORY, LEGACY_STORAGE_KEYS_CANVAS_HISTORY);
    }
}

export const canvasHistoryService = new CanvasHistoryService();
