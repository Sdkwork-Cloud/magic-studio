
import type { BaseEntity } from '@sdkwork/magic-studio-types/entity';

export interface DriveMetadata extends Omit<BaseEntity, 'id'> {
    id: string | null;
    path: string;
    isStarred?: boolean;
    trashedAt?: number | null;
    accessedAt?: number;
    labels?: string[];
}
