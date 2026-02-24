
import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from '../../../../../types/pagination';
import { AnyAsset } from '../AssetTypes';
import { MockDatabase } from '../MockAssetDatabase';

export class TextAssetService implements IAssetService {
    getCategory(): string {
        return 'text';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        return MockDatabase.query('text', pageable.page, pageable.size, query);
    }
}
