import { IAssetService } from '../IAssetService';
import { Page, DEFAULT_PAGE_SIZE } from 'sdkwork-react-commons';
import { AnyAsset } from '../../entities/enhancedAsset.entity';
import { MockDatabase } from '../MockAssetDatabase';

export class SfxAssetService implements IAssetService {
    getCategory(): string {
        return 'sfx';
    }

    async findAll(pageable: { page: number; size: number } = { page: 0, size: DEFAULT_PAGE_SIZE }, query?: string): Promise<Page<AnyAsset>> {
        // For now, use mock data - in production this would query the actual SFX assets
        return MockDatabase.query('sfx', pageable.page, pageable.size, query);
    }
}