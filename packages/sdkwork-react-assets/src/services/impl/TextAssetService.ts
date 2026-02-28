import { IAssetService } from '../IAssetService';
import { Page, PageRequest } from '@sdkwork/react-commons';
import { AnyAsset } from '../../entities';
import { CoreAssetQueryService } from './CoreAssetQueryService';

const coreQuery = new CoreAssetQueryService();

export class TextAssetService implements IAssetService {
    getCategory(): string {
        return 'text';
    }

    async findAll(pageRequest: PageRequest = { page: 0, size: 20 }): Promise<Page<AnyAsset>> {
        return coreQuery.query('text', pageRequest);
    }
}
