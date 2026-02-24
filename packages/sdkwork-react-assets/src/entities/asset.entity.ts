import { BaseEntity } from 'sdkwork-react-commons';

export type AssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'text' | 'character' | 'digital-human' | 'model3d' | 'lottie' | 'file' | 'effect' | 'transition' | 'subtitle' | 'sfx';

export type AssetOrigin = 'upload' | 'ai' | 'stock' | 'system';

export interface AssetCategory {
    id: string;
    label: string;
    accepts: string[];
}

export interface AssetMetadata {
    originalName?: string;
    extension?: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
    fps?: number;
    thumbnailPath?: string;
    thumbnailUrl?: string;
    source?: string;
    [key: string]: any;
}

export interface Asset extends BaseEntity {
    name: string;
    type: AssetType;
    path: string;
    size: number;
    origin: AssetOrigin;
    metadata: AssetMetadata;
    isFavorite?: boolean;
}
