import { IAssetService } from '../IAssetService';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { AnyAsset } from '../../entities';
import { CoreAssetQueryService } from './CoreAssetQueryService';

const coreQuery = new CoreAssetQueryService({ domain: 'image-studio' });

export class ImageAssetService implements IAssetService {
    getCategory(): string {
        return 'image';
    }

    async findAll(pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
        return coreQuery.query('image', pageRequest);
    }
}
