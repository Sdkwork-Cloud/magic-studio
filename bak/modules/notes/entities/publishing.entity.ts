
import { Note } from './note.entity';

export type PublishStatus = 'draft' | 'publishing' | 'published' | 'failed';

export interface PublishTarget {
    accountId: string;      // ID from MediaSettings (e.g. 'media-123')
    platform: string;       // e.g. 'wechat-mp', 'toutiao'
    name: string;           // Account Name
    status: PublishStatus;
    resultUrl?: string;     // URL of the published article
    error?: string;
}

export interface ArticlePayload {
    id?: string;            // Optional internal ID for tracking
    title: string;
    content: string;        // HTML content
    markdown?: string;      // Markdown content (optional)
    coverImage?: string;    // URL or Base64
    digest?: string;        // Short summary/abstract
    author?: string;
    originalUrl?: string;   // For platforms supporting "Read Original"
    tags?: string[];
}

export interface PublishResult {
    success: boolean;
    platformId: string;
    message?: string;
    url?: string;           // The public URL of the published post
    postId?: string;        // Platform specific ID
}

export interface PublishingLog {
    id: string;
    noteId: string;
    timestamp: number;
    targets: PublishTarget[];
}
