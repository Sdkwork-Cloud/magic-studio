import type { PublishTarget } from '@sdkwork/magic-studio-types/notes';

export type {
    ArticlePayload,
    PublishResult,
    PublishStatus,
    PublishTarget,
} from '@sdkwork/magic-studio-types/notes';

export interface PublishingLog {
    id: string;
    noteId: string;
    timestamp: number;
    targets: PublishTarget[];
}
