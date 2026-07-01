import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { AnyAsset } from '../entities';

export interface IAssetService {
    /**
     * Spring Boot style pagination query:
     * page/size/sort/keyword
     */
    findAll(pageRequest?: PageRequest): Promise<Page<AnyAsset>>;
    
    /**
     * Get category ID handled by this service
     */
    getCategory(): string;
}
