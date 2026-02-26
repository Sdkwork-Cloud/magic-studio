// Common/Base type definitions
// Fundamental types used across all packages

import type { BaseEntity } from './base.types';

// ============================================================================
// Service Result Pattern
// ============================================================================

export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    code?: number;
    message?: string;
    timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
}

// Helper function to format date as yyyy-MM-dd HH:mm:ss
const formatDateTime = (date: Date = new Date()): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const Result = {
    success: <T>(data: T): ServiceResult<T> => ({
        success: true,
        data,
        code: 200,
        timestamp: formatDateTime()
    }),
    error: <T>(message: string, code: number = 500): ServiceResult<T> => ({
        success: false,
        message,
        code,
        timestamp: formatDateTime()
    })
};

// ============================================================================
// Pagination Types
// ============================================================================

export interface Sort {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
}

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    offset?: number;
    paged?: boolean;
    unpaged?: boolean;
    sort?: Sort;
}

export interface PageRequest {
    page: number;
    size: number;
    sort?: string[];
    keyword?: string;
}

export interface Page<T> {
    content: T[];
    pageable?: Pageable;
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort?: Sort;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;

// Note: ObjectRef is defined in media.types.ts and exported from there

// ============================================================================
// Base Enums
// ============================================================================

export enum ThemeMode {
    DARK = 'dark',
    LIGHT = 'light',
    SYSTEM = 'system',
}

export enum MediaResourceType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    DOCUMENT = 'DOCUMENT',
    FILE = 'FILE',
    MUSIC = 'MUSIC',
    CHARACTER = 'CHARACTER',
    MODEL_3D = 'MODEL_3D',
    PPT = 'PPT',
    CODE = 'CODE',
    VOICE = 'VOICE',
    SPEECH = 'SPEECH',
    TEXT = 'TEXT',
    SUBTITLE = 'SUBTITLE',
    EFFECT = 'EFFECT',
    TRANSITION = 'TRANSITION',
    LOTTIE = 'LOTTIE',
    ANIMATION = 'ANIMATION'
}

export enum MediaScene {
    AVATAR = 'AVATAR',
    THREE_VIEW = 'THREE_VIEW',
    GRID_IMAGE = 'GRID_IMAGE',
    AVATAR_VIDEO = 'AVATAR_VIDEO',
    REFERENCE = 'REFERENCE',
    FIRST_FRAME = 'FIRST_FRAME',
    END_FRAME = 'END_FRAME',
    SCENE_CONCEPT = 'SCENE_CONCEPT',
    PROP_VISUAL = 'PROP_VISUAL',
    PROP_3D_MODEL = 'PROP_3D_MODEL',
    LOCATION_VISUAL = 'LOCATION_VISUAL',
    LOCATION_REFERENCE = 'LOCATION_REFERENCE',
}

export enum AudioFormat {
    WAV = 'WAV',
    MP3 = 'MP3',
    AAC = 'AAC',
    FLAC = 'FLAC',
    OGG = 'OGG',
    PCM = 'PCM',
    AIFF = 'AIFF',
    AU = 'AU',
    OPUS = 'OPUS'
}

export enum NotificationType {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

export enum GenerationType {
    FILM = 'FILM',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
    CHARACTER = 'CHARACTER',
    MUSIC = 'MUSIC',
    SPEECH = 'SPEECH'
}

export enum ModelProviderId {
    GOOGLE = 'GOOGLE',
    OPENAI = 'OPENAI',
    ANTHROPIC = 'ANTHROPIC',
    MIDJOURNEY = 'MIDJOURNEY',
    STABILITY = 'STABILITY',
    RUNWAY = 'RUNWAY',
    KELING = 'KELING',
    VIDU = 'VIDU',
    JIMENG = 'JIMENG'
}

// Note: VideoGenerationMode and VideoResolution are defined in video.types.ts

export enum RemixIntent {
    NONE = 'NONE',
    EXPAND = 'EXPAND',
    STYLE_TRANSFER = 'STYLE_TRANSFER',
    SUBJECT_REPLACE = 'SUBJECT_REPLACE',
    BACKGROUND_REPLACE = 'BACKGROUND_REPLACE'
}

// ============================================================================
// User Types
// ============================================================================

export interface User extends BaseEntity {
    username: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    isVip?: boolean;
    role?: string;
}

export interface UserSettings {
    theme: ThemeMode;
    fontSize: number;
    fontFamily: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface AppNotification extends BaseEntity {
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    actionUrl?: string;
    actionLabel?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageObject {
    key: string;
    size: number;
    lastModified: Date;
    eTag?: string;
}

export interface UploadResult {
    url: string;
    key: string;
    eTag?: string;
}

export interface UploadIntentResponse {
    uploadUrl: string;
    headers?: Record<string, string>;
    key: string;
    url?: string;
}

export interface AccessUrlResponse {
    url: string;
}

export interface ServerStorageProtocol {
    baseUrl: string;
    headers?: Record<string, string>;
    uploadIntent?: string;
    access?: string;
    endpoint?: string;
    bucket?: string;
    region?: string;
}

export interface IStorageProvider {
    upload(path: string, file: Uint8Array | Blob | File, mimeType?: string): Promise<UploadResult>;
    download?(path: string): Promise<Blob>;
    delete(path: string): Promise<void>;
    list(prefix: string): Promise<StorageObject[]>;
    exists?(path: string): Promise<boolean>;
}

// ============================================================================
// Tags Content
// ============================================================================

export interface TagsContent {
    tags?: string[];
    children?: TagsContent[];
}

// ============================================================================
// Base Service Interface
// ============================================================================

export interface IBaseService<T extends BaseEntity, ID = string> {
    save(entity: Partial<T>): Promise<ServiceResult<T>>;
    saveAll(entities: Partial<T>[]): Promise<ServiceResult<T[]>>;
    
    findById(id: ID): Promise<ServiceResult<T | null>>;
    existsById(id: ID): Promise<boolean>;
    
    findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<T>>>;
    findAllById(ids: ID[]): Promise<ServiceResult<T[]>>;
    
    count(): Promise<number>;
    
    deleteById(id: ID): Promise<ServiceResult<void>>;
    delete(entity: T): Promise<ServiceResult<void>>;
    deleteAll(ids: ID[]): Promise<ServiceResult<void>>;
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectType = 'APP' | 'VIDEO' | 'AUDIO' | 'FILM' | 'CANVAS' | 'NOTES' | 'CUT';

// ============================================================================
// Common Type Aliases
// ============================================================================

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | 'speech';
// Note: VideoAspectRatio is defined in video.types.ts
export type ExportResolution = '480p' | '720p' | '1080p' | '2k' | '4k';

// ============================================================================
// Model Types
// ============================================================================

export interface ModelInfo {
    id: string;
    model: string;
    description?: string;
    badge?: string;
    badgeColor?: string;
}

export interface ChannelInfo {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    models: ModelInfo[];
}

export interface ModelInfoResponse {
    channels: ChannelInfo[];
}

// ============================================================================
// Gallery Types
// ============================================================================

export type GalleryItemType = 'video' | 'image' | 'short';

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
    createdAt: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
    badges?: {
        text?: string;
        color?: string;
        icon?: 'fire' | 'new' | 'trending' | 'official';
    }[];
}

// ============================================================================
// Input Attachment
// ============================================================================

export interface InputAttachmentData {
    id: string;
    type: 'image' | 'video' | 'audio' | 'file' | 'script';
    url?: string;
    name?: string;
    size?: number;
    mimeType?: string;
    thumbnail?: string;
}

// ============================================================================
// Style Option
// ============================================================================

export interface StyleOption {
    id: string;
    name?: string;
    label?: string;
    preview?: string;
    assets?: {
        scene?: { url: string };
        portrait?: { url: string };
        sheet?: { url: string };
    };
    previewColor?: string;
    prompt?: string;
    prompt_zh?: string;
    description?: string;
    usage?: string | string[];
    isCustom?: boolean;
}

// ============================================================================
// Generation Mode
// ============================================================================

export interface GenerationMode {
    id: string;
    name: string;
    description?: string;
}

// ============================================================================
// Platform Key
// ============================================================================

export type PlatformKey = 'windows' | 'macos' | 'linux';
