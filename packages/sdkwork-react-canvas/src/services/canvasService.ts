
;
import { canvasHistoryService } from './canvasHistoryService';
import { CanvasBoard, CanvasElement } from '../entities/canvas.entity';
import { IBaseService, ServiceResult, Result, Page, PageRequest, generateUUID, MediaResourceType } from '@sdkwork/react-commons';

class CanvasService implements IBaseService<CanvasBoard> {

    async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<CanvasBoard>>> {
        return await canvasHistoryService.findAll(pageRequest);
    }

    async findById(id: string): Promise<ServiceResult<CanvasBoard | null>> {
        return await canvasHistoryService.findById(id);
    }

    async existsById(id: string): Promise<boolean> {
        return await canvasHistoryService.existsById(id);
    }

    async save(entity: Partial<CanvasBoard>): Promise<ServiceResult<CanvasBoard>> {
        if (!entity.title && !entity.id) {
            entity.title = "Untitled Board";
        }
        return await canvasHistoryService.save(entity);
    }

    async saveAll(entities: Partial<CanvasBoard>[]): Promise<ServiceResult<CanvasBoard[]>> {
        return await canvasHistoryService.saveAll(entities);
    }

    async deleteById(id: string): Promise<ServiceResult<void>> {
        return await canvasHistoryService.deleteById(id);
    }

    async delete(entity: CanvasBoard): Promise<ServiceResult<void>> {
        return await canvasHistoryService.delete(entity);
    }

    async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
        return await canvasHistoryService.deleteAll(ids);
    }
    
    async findAllById(ids: string[]): Promise<ServiceResult<CanvasBoard[]>> {
        return await canvasHistoryService.findAllById(ids);
    }

    async count(): Promise<number> {
        return await canvasHistoryService.count();
    }

    async generateElementsFromPrompt(prompt: string, currentElementCount: number): Promise<ServiceResult<CanvasElement[]>> {
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const elements: CanvasElement[] = [];
            const startX = (currentElementCount % 5) * 350;
            const startY = Math.floor(currentElementCount / 5) * 300;
            const lowerPrompt = prompt.toLowerCase();

            if (lowerPrompt.includes('flowchart') || lowerPrompt.includes('process')) {
                const s1Id = generateUUID();
                const s2Id = generateUUID();
                let zCounter = 0;
                elements.push(
                    {
                        id: s1Id, type: 'shape', x: startX, y: startY, width: 200, height: 100, 
                        zIndex: zCounter++,
                        resource: {
                             id: generateUUID(), uuid: generateUUID(), type: MediaResourceType.TEXT, name: 'Start', 
                             metadata: { text: 'Start' }, createdAt: Date.now(), updatedAt: Date.now()
                        }, 
                        color: '#10b981', style: { borderRadius: '50px' }
                    },
                    {
                        id: generateUUID(), type: 'connector', x: startX + 200, y: startY + 50, width: 100, height: 2, 
                        zIndex: zCounter++,
                        data: { connection: { from: s1Id, to: s2Id } },
                        color: '#666'
                    },
                    {
                        id: s2Id, type: 'shape', x: startX + 300, y: startY, width: 200, height: 100, 
                        zIndex: zCounter++,
                        resource: {
                             id: generateUUID(), uuid: generateUUID(), type: MediaResourceType.TEXT, name: 'Step', 
                             metadata: { text: 'Process Step' }, createdAt: Date.now(), updatedAt: Date.now()
                        },
                        color: '#3b82f6', style: { borderRadius: '8px' }
                    }
                );
            } else if (lowerPrompt.includes('note') || lowerPrompt.includes('brainstorm')) {
                let zCounter = 0;
                elements.push(
                    {
                        id: generateUUID(), type: 'note', x: startX, y: startY, width: 250, height: 250, 
                        zIndex: zCounter++,
                        resource: {
                             id: generateUUID(), uuid: generateUUID(), type: MediaResourceType.TEXT, name: 'Note', 
                             metadata: { text: 'Idea 1: ' + prompt }, createdAt: Date.now(), updatedAt: Date.now()
                        },
                        color: '#fef3c7'
                    },
                    {
                        id: generateUUID(), type: 'note', x: startX + 270, y: startY + 20, width: 250, height: 250, 
                        zIndex: zCounter++,
                        resource: {
                             id: generateUUID(), uuid: generateUUID(), type: MediaResourceType.TEXT, name: 'Note 2', 
                             metadata: { text: 'Idea 2: Expand on...' }, createdAt: Date.now(), updatedAt: Date.now()
                        },
                        color: '#dbeafe'
                    }
                );
            } else {
                elements.push({
                    id: generateUUID(),
                    type: 'text',
                    x: startX,
                    y: startY,
                    width: 400,
                    height: 100,
                    zIndex: 0,
                    resource: {
                         id: generateUUID(), uuid: generateUUID(), type: MediaResourceType.TEXT, name: 'Gen Text', 
                         metadata: { text: `Generated result for: "${prompt}"` }, createdAt: Date.now(), updatedAt: Date.now()
                    },
                    color: 'transparent',
                    style: { fontSize: '24px', fontWeight: 'bold', color: '#fff' }
                });
            }

            return Result.success(elements);
        } catch (e: any) {
            return Result.error(e.message || "AI Generation Failed");
        }
    }
}

export const canvasService = new CanvasService();
