
import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from '../../../../../types/pagination';
import { AnyAsset, TransitionAsset } from '../AssetTypes';
import { effectRegistry } from '../../effects/EffectRegistry';
import { MediaResourceType } from '../../../../../types';
import { generateUUID } from '../../../../../utils';

export class TransitionAssetService implements IAssetService {
    getCategory(): string {
        return 'transitions';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        // Fetch real transitions from Registry
        const allTransitions = effectRegistry.getAll().filter(e => e.type === 'transition');
        
        let filtered = allTransitions;
        if (query) {
            filtered = allTransitions.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
        }

        const assets: TransitionAsset[] = filtered.map(def => ({
            id: def.id, 
            uuid: generateUUID(),
            type: MediaResourceType.TRANSITION,
            name: def.name,
            size: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            duration: 1.0, // Default duration
            path: '', 
            extension: 'trans',
            mimeType: 'application/x-magic-cut-transition',
            origin: 'stock',
            metadata: {
                thumbnailUrl: def.thumbnailUrl || ''
            }
        }));

        // Pagination Logic
        const start = pageable.page * pageable.size;
        const end = start + pageable.size;
        const pageContent = assets.slice(start, end);

        return {
            content: pageContent,
            pageable: { pageNumber: pageable.page, pageSize: pageable.size },
            last: end >= assets.length,
            totalPages: Math.ceil(assets.length / pageable.size),
            totalElements: assets.length,
            size: pageable.size,
            number: pageable.page,
            first: pageable.page === 0,
            numberOfElements: pageContent.length,
            empty: pageContent.length === 0,
            sort: { sorted: false, unsorted: true, empty: true }
        };
    }
}
