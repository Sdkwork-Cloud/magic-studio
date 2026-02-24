
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { Presentation } from '../entities/ppt.entity';

const STORAGE_KEY_PPT_HISTORY = 'open_studio_ppt_history_v1';

class PPTHistoryService extends LocalStorageService<Presentation> {
    constructor() {
        super(STORAGE_KEY_PPT_HISTORY);
    }
}

export const pptHistoryService = new PPTHistoryService();
