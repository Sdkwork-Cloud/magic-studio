
import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from '../../../../../types/pagination';
import { AnyAsset } from '../AssetTypes';
import { assetService as coreAssetService } from '../../../../../modules/assets/services/assetService';

export class VideoAssetService implements IAssetService {
    getCategory(): string {
        return 'video';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        const result = await coreAssetService.findAll({ 
            page: pageable.page, 
            size: pageable.size, 
            keyword: query 
        }, 'video'); // Filter by 'video' type

        if (!result.success || !result.data) {
             return {
                content: [],
                pageable: { pageNumber: pageable.page, pageSize: pageable.size },
                last: true,
                totalPages: 0,
                totalElements: 0,
                size: pageable.size,
                number: pageable.page,
                first: true,
                numberOfElements: 0,
                empty: true,
                sort: { sorted: false, unsorted: true, empty: true }
            };
        }

        const assets = result.data.content.map(a => coreAssetService.toMediaResource(a));

        return {
            content: assets,
            pageable: result.data.pageable,
            last: result.data.last,
            totalPages: result.data.totalPages,
            totalElements: result.data.totalElements,
            size: result.data.size,
            number: result.data.number,
            first: result.data.first,
            numberOfElements: result.data.numberOfElements,
            empty: result.data.empty,
            sort: result.data.sort
        };
    }
}
