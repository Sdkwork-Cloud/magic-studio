
import { BaseEntity } from 'sdkwork-react-commons';

export interface DriveMetadata extends BaseEntity {
    isStarred?: boolean;
    trashedAt?: number | null;
    accessedAt?: number;
    labels?: string[];
}
