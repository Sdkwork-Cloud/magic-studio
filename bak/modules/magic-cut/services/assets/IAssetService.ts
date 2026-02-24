
import { Page, Pageable } from '../../../../types/pagination';
import { AnyAsset } from './AssetTypes';

export interface IAssetService {
    /**
     * Fetch assets with pagination
     */
    findAll(pageable: { page: number; size: number }, query?: string): Promise<Page<AnyAsset>>;
    
    /**
     * Get category ID handled by this service
     */
    getCategory(): string;
}
