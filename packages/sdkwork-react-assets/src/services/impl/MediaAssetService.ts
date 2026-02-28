import { IAssetService } from '../IAssetService';
import { Page, PageRequest } from '@sdkwork/react-commons';
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
