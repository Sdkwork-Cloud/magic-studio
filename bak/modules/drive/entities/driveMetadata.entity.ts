
import { BaseEntity } from '../../../types/core';

export interface DriveMetadata extends BaseEntity {
    // id is the file path or UUID
    isStarred?: boolean;
    trashedAt?: number | null;
    accessedAt?: number;
    labels?: string[];
}
