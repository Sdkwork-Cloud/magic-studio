
import { BaseEntity } from '../../../types/core';

export type AssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'speech' | 'character' | 'model3d' | 'lottie' | 'text' | 'subtitle' | 'effect' | 'transition' | 'file' | 'unknown' | 'sfx' | 'animation';

export type AssetOrigin = 'upload' | 'ai' | 'stock' | 'system';

export interface AssetMetadata {
    width?: number;
    height?: number;
    duration?: number;
    mimeType?: string;
    extension?: string;
    originalName?: string;
    thumbnailPath?: string; // Path to thumbnail in VFS
    
    // AI Metadata
    prompt?: string;
    model?: string;
    seed?: number;
    
    // Audio Specific
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
    
    // Text Specific
    fontFamily?: string;
    fontSize?: number;
    color?: string;

    // Generic / App Specific
    title?: string;
    source?: string;
}

/**
 * Unified Asset Entity
 * Represents a reference to a file managed by the system.
 * Does NOT contain binary data (base64/buffer).
 */
export interface Asset extends BaseEntity {
    // Inherited: id, uuid, createdAt, updatedAt
    
    name: string;
    type: AssetType;
    
    /**
     * The Virtual File System path or Storage Key.
     * e.g., "library/images/my_image.png"
     */
    path: string;
    
    size: number;
    origin: AssetOrigin;
    
    /**
     * Publicly accessible URL for remote assets, or null if local only.
     * If local, use AssetService.getAssetUrl() to resolve a viewable URL.
     */
    remoteUrl?: string;
    
    metadata: AssetMetadata;
    
    format?: string;
    
    tags?: string[];
    isFavorite?: boolean;
}

export interface AssetCategory {
    id: AssetType | 'all';
    label: string;
    accepts: string[]; // File extensions (e.g. '.png')
}