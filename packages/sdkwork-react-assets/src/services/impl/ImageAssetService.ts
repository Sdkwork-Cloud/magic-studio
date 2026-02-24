import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from 'sdkwork-react-commons';
import { AnyAsset } from '../../entities/enhancedAsset.entity';
import { assetService as coreAssetService } from '../assetService';

export class ImageAssetService implements IAssetService {
    getCategory(): string {
        return 'image';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        const result = await coreAssetService.findAll({ 
            page: pageable.page, 
            size: pageable.size, 
            keyword: query 
        }, 'image');

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