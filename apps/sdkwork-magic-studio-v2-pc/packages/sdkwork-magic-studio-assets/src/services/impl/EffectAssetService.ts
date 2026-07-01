import { IAssetService } from '../IAssetService';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { AnyAsset } from '../../entities';
import { CoreAssetQueryService } from './CoreAssetQueryService';

const coreQuery = new CoreAssetQueryService();

export class EffectAssetService implements IAssetService {
    getCategory(): string {
        return 'effects';
    }

    async findAll(pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
        return coreQuery.query('effects', pageRequest);
    }
}
