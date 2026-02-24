
;
;
import { LocalStorageService } from 'sdkwork-react-core';
import { Presentation, Slide } from '../entities/ppt.entity';
import { generateUUID } from 'sdkwork-react-commons';
import { ServiceResult, Result } from 'sdkwork-react-commons';

const STORAGE_KEY_PPT = 'open_studio_ppt_v1';

class ChatPPTService extends LocalStorageService<Presentation> {
    constructor() {
        super(STORAGE_KEY_PPT);
    }

    async createPresentation(title: string): Promise<ServiceResult<Presentation>> {
        const id = generateUUID();
        const newPPT: Presentation = {
            id,
            uuid: id,
            title,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            theme: 'modern',
            slides: [{
                id: generateUUID(),
                title: 'Untitled Slide',
                layout: 'title',
                elements: [{ id: generateUUID(), type: 'text', content: title, x: 10, y: 40, width: 80, style: { fontSize: '3rem', fontWeight: 'bold' } }]
            }]
        };
        return await this.save(newPPT);
    }

    async addSlide(presentationId: string, layout: Slide['layout'] = 'bullet-points'): Promise<ServiceResult<Presentation>> {
        const ppt = await this.findById(presentationId);
        if (!ppt.success || !ppt.data) return Result.error("Presentation not found");

        const newSlide: Slide = {
            id: generateUUID(),
            title: 'New Slide',
            layout,
            elements: [
                 { id: generateUUID(), type: 'text', content: 'New Slide Title', x: 5, y: 10, width: 90, style: { fontSize: '2rem', fontWeight: 'bold' } }
            ]
        };

        const updated = {
            ...ppt.data,
            slides: [...ppt.data.slides, newSlide],
            updatedAt: Date.now()
        };
        
        return await this.save(updated);
    }
}

export const chatPPTService = new ChatPPTService();
