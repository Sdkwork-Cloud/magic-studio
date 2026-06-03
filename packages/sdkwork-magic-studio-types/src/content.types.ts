export interface TagsContent {
    tags?: string[];
    children?: TagsContent[];
}

export interface LocalizedText {
    'en-US': string;
    'zh-CN': string;
}

export type LocalizedTextLike = string | LocalizedText;

export type GalleryItemType = 'video' | 'image' | 'short' | 'music' | 'voice' | 'sfx' | 'character';

export interface GalleryAuthor {
    id: string;
    name: string;
    avatar?: string;
    initial?: string;
    color?: string;
    followers?: string;
    isFollowing?: boolean;
}

export interface GalleryItem {
    id: string;
    type: GalleryItemType;
    title: string;
    prompt: string;
    url: string;
    videoUrl?: string;
    aspectRatio: string;
    author: GalleryAuthor;
    stats: {
        views: number;
        likes: number;
        isLiked?: boolean;
        comments?: number;
    };
    model: string;
    negativePrompt?: string;
    tags?: string[];
    createdAt: string;
    badges?: {
        text?: string;
        color?: string;
        icon?: 'fire' | 'new' | 'trending' | 'official';
    }[];
}

export interface InputAttachmentData {
    id: string | null;
    uuid?: string | null;
    assetId?: string;
    assetUuid?: string;
    type: 'image' | 'video' | 'audio' | 'file' | 'script';
    url?: string;
    name?: string;
    size?: number;
    mimeType?: string;
    thumbnail?: string;
}

export interface StyleAsset {
    path?: string;
    url?: string;
    type?: 'image' | 'video';
    width?: number;
    height?: number;
}

export interface StyleOption {
    id: string;
    name?: string;
    label?: LocalizedTextLike;
    value?: string;
    preview?: string;
    imageUrl?: string;
    category?: string;
    assets?: {
        scene?: StyleAsset;
        portrait?: StyleAsset;
        sheet?: StyleAsset;
        video?: StyleAsset;
    };
    previewColor?: string;
    prompt?: string;
    prompt_zh?: string;
    description?: LocalizedTextLike;
    usage?: LocalizedTextLike | LocalizedTextLike[];
    isCustom?: boolean;
}
