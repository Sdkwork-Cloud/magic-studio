import { LocalStorageService } from 'sdkwork-react-core';
import { CanvasBoard } from '../entities/canvas.entity';

;
;

const STORAGE_KEY_CANVAS_HISTORY = 'open_studio_canvas_history_v1';

class CanvasHistoryService extends LocalStorageService<CanvasBoard> {
    constructor() {
        super(STORAGE_KEY_CANVAS_HISTORY);
    }
}

export const canvasHistoryService = new CanvasHistoryService();
