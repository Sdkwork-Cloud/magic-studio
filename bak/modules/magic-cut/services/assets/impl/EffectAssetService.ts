
import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from '../../../../../types/pagination';
import { AnyAsset, EffectAsset } from '../AssetTypes';
import { effectRegistry } from '../../effects/EffectRegistry';
import { MediaResourceType } from '../../../../../types';
import { generateUUID } from '../../../../../utils';

export class EffectAssetService implements IAssetService {
    getCategory(): string {
        return 'effects';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        // Fetch real effects from Registry
        const allEffects = effectRegistry.getAll().filter(e => e.type === 'filter' || e.type === 'generator');
        
        let filtered = allEffects;
        if (query) {
            filtered = allEffects.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
        }

        const assets: EffectAsset[] = filtered.map(def => ({
            id: def.id, // Use definition ID as Asset ID for dragging
            uuid: generateUUID(),
            type: MediaResourceType.EFFECT, // Explicit Enum
            name: def.name,
            size: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            category: def.category,
            // Virtual fields for asset usage
            path: '', 
            extension: 'fx',
            mimeType: 'application/x-magic-cut-effect',
            origin: 'stock',
            metadata: {
                thumbnailUrl: def.thumbnailUrl || '' // Optional thumb
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
