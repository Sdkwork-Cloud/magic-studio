import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from '@sdkwork/react-commons';
import { AnyAsset } from '../../entities';
import { MockDatabase } from '../MockAssetDatabase';

export class VideoAssetService implements IAssetService {
    getCategory(): string {
        return 'video';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        return MockDatabase.query('video', pageable.page, pageable.size, query);
    }
}