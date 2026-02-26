import { Page } from '@sdkwork/react-commons';
import { AnyAsset } from '../entities';

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