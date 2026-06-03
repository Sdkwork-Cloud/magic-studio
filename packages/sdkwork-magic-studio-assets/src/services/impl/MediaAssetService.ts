import { IAssetService } from '../IAssetService';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { AnyAsset } from '../../entities';
import { CoreAssetQueryService } from './CoreAssetQueryService';

const coreQuery = new CoreAssetQueryService();

export class MediaAssetService implements IAssetService {
    getCategory(): string {
        return 'media';
    }

    async findAll(pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
        return coreQuery.query('media', pageRequest);
    }
}
