import type { BaseEntity as Base } from 'sdkwork-react-types';

// Re-export BaseEntity from types package for consistency
export interface BaseEntity extends Base {
    uuid?: string;
}

export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    code?: number;
    message?: string;
    timestamp: number;
}

export const Result = {
    success: <T>(data: T): ServiceResult<T> => ({
        success: true,
        data,
        code: 200,
        timestamp: Date.now()
    }),
    error: <T>(message: string, code: number = 500): ServiceResult<T> => ({
        success: false,
        message,
        code,
        timestamp: Date.now()
    })
};

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

export interface ObjectRef<T extends string = any> {
    id: string;
    uuid: string;
    type: T;
}

export enum ThemeMode {
    DARK = 'dark',
    LIGHT = 'light',
    SYSTEM = 'system',
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

export interface UserSettings {
    theme: ThemeMode;
    fontSize: number;
    fontFamily: string;
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

export interface TagsContent {
    tags?: string[];
    children?: TagsContent[];
}

export interface MediaResource extends BaseEntity {
    url?: string;
    bytes?: number[];
    base64?: string;
    path?: string;
    localFile?: Record<string, any>;
    type: MediaResourceType;
    mimeType?: string;
    size?: number;
    name: string;
    extension?: string;
    scene?: MediaScene;
    prompt?: string;
    metadata?: Record<string, any>;
    tags?: TagsContent;
    origin?: 'upload' | 'ai' | 'stock' | 'system';
    isFavorite?: boolean;
}

export interface FileMediaResource extends MediaResource {
    mime_type?: string;
}

export interface VideoMediaResource extends MediaResource {
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
    resolution?: string;
    refAssets?: AssetMediaResource[];
}

export interface ImageMediaResource extends MediaResource {
    width?: number;
    height?: number;
    aspectRatio?: string;
    splitImages?: ObjectRef<'ImageMediaResource'>[];
    refAssets?: AssetMediaResource[];
}

export interface AudioMediaResource extends MediaResource {
    format?: AudioFormat;
    bitRate?: string;
    sampleRate?: number;
    channels?: number;
    duration?: number;
}

export interface MusicMediaResource extends AudioMediaResource {
    genre?: string;
    bpm?: number;
    artist?: string;
}

export interface CharacterMediaResource extends MediaResource {
    characterType?: string;
    gender?: string;
    ageGroup?: string;
    avatarUrl?: string;
    avatarVideoUrl?: string;
    speakerId?: string;
    appearanceParams?: Record<string, any>;
    animationParams?: Record<string, any>;
    refAssets?: AssetMediaResource[];
}

export interface AssetMediaResource extends MediaResource {
    image?: ImageMediaResource;
    video?: VideoMediaResource;
    audio?: AudioMediaResource;
    music?: MusicMediaResource;
    character?: CharacterMediaResource;
    file?: FileMediaResource;
    extraProps?: Record<string, any>;
}

export type GenerationProduct = 
    | 'TEXT_TO_VIDEO'
    | 'IMAGE_TO_VIDEO'
    | 'START_END_FRAMES'
    | 'REFERENCE_GUIDED'
    | 'MULTI_FRAME_INTELLIGENT'
    | 'UNIVERSAL_REFERENCE';

export type GenerationPlatform = 
    | 'KELING'
    | 'VIDU'
    | 'JIMENG'
    | 'SORA'
    | 'GOOGLE'
    | 'RUNWAY'
    | 'PIKA';

export type AnyMediaResource =
    | FileMediaResource
    | VideoMediaResource
    | ImageMediaResource
    | AudioMediaResource
    | MusicMediaResource
    | CharacterMediaResource
    | AssetMediaResource;

export enum GenerationType {
    FILM = 'FILM',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
    CHARACTER = 'CHARACTER',
    MUSIC = 'MUSIC',
    SPEECH = 'SPEECH'
}

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
        views: string | number;
        likes: number;
        isLiked?: boolean;
        comments?: number;
    };
    model: string;
    negativePrompt?: string;
    tags?: string[];
    createdAt: number;
    badges?: {
        text?: string;
        color?: string;
        icon?: 'fire' | 'new' | 'trending' | 'official';
    }[];
}

export interface InputAttachmentData {
    id: string;
    type: 'image' | 'video' | 'audio' | 'file' | 'script';
    url?: string;
    name?: string;
    size?: number;
    mimeType?: string;
    thumbnail?: string;
}

export function getAssetLabel(attachment: InputAttachmentData | number, fallback?: string): string {
    if (typeof attachment === 'number') {
        return fallback || `Attachment ${attachment + 1}`;
    }
    return attachment.name || (attachment.url?.split('/').pop()) || fallback || 'Unknown';
}

export interface FileViewerProps {
    file?: {
        id: string;
        name: string;
        path: string;
        url?: string;
        mimeType?: string;
        size?: number;
    };
    item: any;
    url: string;
    headerElement?: React.ReactNode | HTMLElement;
    onSave?: (content?: string) => Promise<void>;
    isReadOnly?: boolean;
    onClose: () => void;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'ai';
    content: string;
    timestamp: number;
    attachments?: InputAttachmentData[];
    isStreaming?: boolean;
    error?: string;
}

export interface EditorFile {
    id: string;
    name: string;
    path: string;
    content: string;
    language?: string;
    isModified?: boolean;
    isDirty?: boolean;
    isPreview?: boolean;
}

export interface IFileSystemProvider {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    mkdir(path: string): Promise<void>;
    readdir(path: string): Promise<string[]>;
    stat(path: string): Promise<FileStat>;
    unlink(path: string): Promise<void>;
    rmdir(path: string): Promise<void>;
}

export interface FileStat extends BaseEntity {
    name: string;
    path?: string;
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    type: 'file' | 'directory' | 'symlink' | 'unknown';
    mtime?: number;
    lastModified?: number;
    createdAt?: number;
    readonly?: boolean;
}

export interface FileEntry extends FileStat {
    path: string;  // 必需
    uuid?: string;
}

export interface ICompressionProvider {
    compress(sourcePaths: string[]): Promise<Uint8Array>;
    decompress(data: Uint8Array, targetPath: string): Promise<void>;
    decompressFile(sourcePath: string, targetPath: string): Promise<void>;
}

export interface IDEDefinition {
    id: string;
    name: string;
    icon?: string;
    extensions?: string[];
    command?: string;
    args?: string[];
    category?: string;
}

export type PlatformKey = 'windows' | 'macos' | 'linux';

export interface IPlacementStrategy {
    canHandle?(input: DragInput): boolean;
    calculate(input: DragInput, context: DragContext): PlacementResult;
}

export interface DragInput {
    type?: string;
    sourceId?: string;
    targetId?: string;
    position?: { x: number; y: number };
    data?: any;
    clipId?: string;
    trackId?: string;
    frame?: number;
    clientX?: number;
    clientY?: number;
    containerRect?: DOMRect;
    scrollLeft?: number;
    scrollTop?: number;
    pixelsPerSecond?: number;
}

export interface DragContext {
    timeline?: any;
    tracks: any[];
    currentTime?: number;
    zoom?: number;
    state?: any;
    duration?: number;
    frameRate?: number;
    pixelsPerFrame?: number;
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, any>;
    getResource: (id: string) => any;
    validateTrackDrop: (trackId: string, resourceType: string) => boolean;
    checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
    calculateSnap: (rawTime: number, duration: number, ignoreClipId?: string | null) => { time: number; lines: number[] };
}

export interface PlacementResult {
    valid?: boolean;
    trackId: string | null;
    position?: number;
    duration?: number;
    conflicts?: string[];
    time: number;
    insertIndex: number | null;
    isValid: boolean;
    hasCollision: boolean;
    snapLines: number[];
    suggestedTrackType?: 'video' | 'audio' | 'text' | 'subtitle' | 'effect' | 'ai';
}

export interface FBO {
    framebuffer?: WebGLFramebuffer;
    texture: WebGLTexture;
    width: number;
    height: number;
    fbo: WebGLFramebuffer;
}

export interface RenderContext {
    gl: WebGL2RenderingContext | WebGLRenderingContext;
    width: number;
    height: number;
    time?: number;
    deltaTime?: number;
    effectSystem?: any;
    emptyTexture?: WebGLTexture;
    vaoQuad?: WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
    compositor?: any;
    shaderManager?: any;
    resourceManager?: any;
    textureCache?: any;
}

export interface RenderOverrideClip {
    id: string;
    type?: string;
    start?: number;
    startFrame?: number;
    endFrame?: number;
    texture?: WebGLTexture;
    resource?: { id: string };
}

export interface IMediaEncoder {
    requiresRealtime: boolean;
    initialize(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer | null, config: ExportConfig): Promise<void>;
    addFrame?(frame: ImageData): Promise<void>;
    finalize?(): Promise<Blob>;
    supported?(): boolean;
    start(): Promise<void> | void;
    captureFrame(timestamp: number, duration: number): Promise<void>;
    finish(): Promise<Blob>;
    dispose(): void;
}

export interface IFileSaveStrategy {
    save(blob: Blob, filename: string, destinationPath?: string): Promise<void>;
    canSave?(): boolean;
}

export type ExportResolution = '480p' | '720p' | '1080p' | '2k' | '4k';

export interface ExportConfig {
    width?: number;
    height?: number;
    fps?: number;
    frameRate?: number;
    duration?: number;
    format?: 'mp4' | 'webm' | 'gif' | 'txt' | 'mov';
    quality?: 'low' | 'medium' | 'high';
    resolution?: string | ExportResolution;
    bitrate?: number | 'lower' | 'higher' | 'recommended';
    exportAudio?: boolean;
    exportVideo?: boolean;
}

export interface ExportOptions {
    timeline: any;
    state: any;
    config: ExportConfig & {
        fileName?: string;
        resolution?: ExportResolution;
        destinationPath?: string;
        startTime?: number;
        endTime?: number;
    };
    signal?: AbortSignal;
}

export type ExportProgressCallback = (progress: number) => void;

export interface IStorageProvider {
    upload(path: string, file: Uint8Array | Blob | File, mimeType?: string): Promise<UploadResult>;
    download?(path: string): Promise<Blob>;
    delete(path: string): Promise<void>;
    list(prefix: string): Promise<StorageObject[]>;
    exists?(path: string): Promise<boolean>;
}

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

export interface ServerStorageProtocol {
    baseUrl: string;
    headers?: Record<string, string>;
    uploadIntent?: string;
    access?: string;
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

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | 'speech';

// Project Types
export type ProjectType = 'APP' | 'VIDEO' | 'AUDIO';

export interface ImageStyle {
    id: string;
    label: string;
    value: string;
    previewColor: string;
}

export interface GenerationConfig {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: AspectRatio;
    styleId: string;
    
    model?: string; 
    
    useMultiModel?: boolean;
    models?: string[];

    quality?: 'standard' | 'hd' | 'ultra';
    referenceImage?: string;
    referenceImages?: string[];
    batchSize: number;
    mediaType?: MediaType;

    resolution?: string;
    duration?: string | number;
}

export interface GeneratedResult {
    url: string;
    id: string;
    modelId?: string;
    posterUrl?: string;
}

export interface ImageTask extends BaseEntity {
    config: GenerationConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedResult[];
    error?: string;
    isFavorite?: boolean;
}

// Asset Entity
export interface Asset extends BaseEntity {
    name: string;
    type: string;
    path?: string;
    url?: string;
    thumbnail?: string;
    size?: number;
    mimeType?: string;
    metadata?: Record<string, any>;
}

// Note Entity
export interface Note extends BaseEntity {
    title: string;
    content: string;
    type: NoteType;
    folderId?: string;
    parentId?: string;
    tags?: string[];
    isFavorite?: boolean;
    preview?: string;
    snippet?: string;
    publishStatus?: string;
    metadata?: Record<string, any>;
}

export enum NoteType {
    TEXT = 'TEXT',
    MARKDOWN = 'MARKDOWN',
    RICH_TEXT = 'RICH_TEXT',
    DOC = 'DOC'
}

export interface NoteSummary extends BaseEntity {
    title: string;
    preview: string;
    type: NoteType;
    folderId?: string;
    parentId?: string;
    tags?: string[];
    isFavorite?: boolean;
    snippet?: string;
}

export interface NoteFolder extends BaseEntity {
    name: string;
    parentId?: string;
    children?: NoteFolder[];
}

export interface TreeItem extends BaseEntity {
    kind: 'note' | 'folder';
    label: string;
    name?: string;
    title?: string;
    type?: string;
    children?: TreeItem[];
    isExpanded?: boolean;
    isFavorite?: boolean;
    parentId?: string;
}

// User Entity
export interface User extends BaseEntity {
    username: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    isVip?: boolean;
    role?: string;
}

// Article Draft
export interface ArticleDraft extends BaseEntity {
    title: string;
    content: string;
    digest?: string;
    coverImage?: Asset;
    author?: string;
    originalUrl?: string;
    status?: 'draft' | 'published' | 'archived';
}

export interface ArticlePayload {
    title: string;
    content: string;
    coverImage?: string;
    digest?: string;
    author?: string;
    originalUrl?: string;
    tags?: string[];
}

export interface PublishResult {
    success: boolean;
    url?: string;
    id?: string;
    message?: string;
}

export enum PublishTarget {
    WECHAT = 'WECHAT',
    TOUTIAO = 'TOUTIAO',
    ZHIHU = 'ZHIHU'
}

// Music Task
export interface MusicTask extends BaseEntity {
    prompt: string;
    style?: string;
    duration?: number;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
}

// Video Task
export interface VideoTask extends BaseEntity {
    prompt: string;
    config: VideoConfig;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    resultUrl?: string;
    posterUrl?: string;
    error?: string;
}

export interface VideoConfig extends GenerationConfig {
    aspectRatio: string;
    duration: number;
    model?: string;
    mode?: 'text-to-video' | 'image-to-video' | 'video-extend';
    startFrame?: AssetMediaResource;
    endFrame?: AssetMediaResource;
}

// SFX Task
export interface SfxTask extends BaseEntity {
    prompt: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
}

// Voice Task
export interface VoiceConfig extends GenerationConfig {
    text: string;
    voiceId?: string;
    model?: string;
}

export interface VoiceTask extends BaseEntity {
    config?: VoiceConfig;
    text: string;
    voiceId?: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
}

// Generated Music Result
export interface GeneratedMusicResult {
    url: string;
    id: string;
    duration?: number;
    coverUrl?: string;
    title?: string;
    lyrics?: string;
    style?: string;
}

// Music Task
export interface MusicTask extends BaseEntity {
    config?: any;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    results?: GeneratedMusicResult[];
    error?: string;
    isFavorite?: boolean;
}

// Window Controls
export interface WindowControlsProps {
    className?: string;
}

// Portal Types
export interface PortalTab {
    id: string;
    label: string;
    icon: string;
    path: string;
}

export interface StyleOption {
    id: string;
    name?: string;
    label?: string;
    preview?: string;
    assets?: {
        scene?: {
            url: string;
        };
        portrait?: {
            url: string;
        };
        sheet?: {
            url: string;
        };
    };
    previewColor?: string;
    prompt?: string;
    prompt_zh?: string;
    description?: string;
    usage?: string | string[];
    isCustom?: boolean;
}

export interface GalleryCard {
    id: string;
    title: string;
    url: string;
    author: string;
    views: number;
    likes: number;
}

// Uploaded File
export interface UploadedFile {
    name: string;
    path?: string;
    url?: string;
    size?: number;
    type?: string;
}

// Setting Widgets
export interface SettingInputProps {
    label?: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export interface SettingSelectProps {
    label?: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    disabled?: boolean;
}

export interface SettingToggleProps {
    label?: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

// Base Props
export interface BaseProps {
    label?: string;
    description?: string;
    disabled?: boolean;
    isModified?: boolean;
    onReset?: () => void;
    error?: string;
    layout?: string;
    fullWidth?: boolean;
    labelClassName?: string;
}

// Model Provider ID
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

// Model Provider for AI services
export interface ModelProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    color?: string;
    models: Array<{
        id: string;
        name: string;
        description?: string;
        badge?: string;
        badgeColor?: string;
        maxAssetsCount?: number;
        [key: string]: any; // Allow additional properties for flexibility
    }>;
}

// Video Generation Mode
export enum VideoGenerationMode {
    TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
    IMAGE_TO_VIDEO = 'IMAGE_TO_VIDEO',
    SUBJECT_REFERENCE = 'SUBJECT_REFERENCE',
    STYLE_TRANSFER = 'STYLE_TRANSFER'
}

// Asset Type
export enum AssetType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    MUSIC = 'MUSIC',
    SFX = 'SFX',
    VOICE = 'VOICE',
    CHARACTER = 'CHARACTER',
    TEXT = 'TEXT'
}

// Remix Intent
export enum RemixIntent {
    NONE = 'NONE',
    EXPAND = 'EXPAND',
    STYLE_TRANSFER = 'STYLE_TRANSFER',
    SUBJECT_REPLACE = 'SUBJECT_REPLACE',
    BACKGROUND_REPLACE = 'BACKGROUND_REPLACE'
}

// Video Resolution
export enum VideoResolution {
    HD_720P = '720p',
    FULL_HD_1080P = '1080p',
    QHD_2K = '2k',
    UHD_4K = '4k'
}

export type VideoAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// Notification
export enum NotificationType {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

export interface AppNotification extends BaseEntity {
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    actionUrl?: string;
    actionLabel?: string;
}

// Card Props
export interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

// Additional types for Magic Cut and other modules
// Note: Rect and TrackIntervalIndex are exported from algorithms package

export interface GenerationMode {
    id: string;
    name: string;
    description?: string;
}

export interface FilmProject extends BaseEntity {
    type: 'FILM_PROJECT';
    name: string;
    description?: string;
    status: string;
    input: FilmUserInput;
    script: FilmScript;
    characters: FilmCharacter[];
    props: FilmProp[];
    locations: FilmLocation[];
    scenes: FilmScene[];
    shots: FilmShot[];
    media: MediaResource[];
    settings: FilmSettings;
}

export interface FilmUserInput extends BaseEntity {
    type: 'FILM_USER_INPUT';
    text: string;
    language: string;
}

export interface FilmScript extends BaseEntity {
    type: 'FILM_SCRIPT';
    title: string;
    genres: string[];
    styles: string[];
    content: string;
    standardized: boolean;
    duration?: number;
    version: string;
}

export interface FilmCharacter extends BaseEntity {
    type: 'FILM_CHARACTER';
    name: string;
    characterType: string;
    refAssets: AssetMediaResource[];
    faceImage?: ImageMediaResource;
    threeViewImage?: ImageMediaResource;
    gridViewImage?: ImageMediaResource;
    agentId?: string;
    speakerId?: string;
    description?: string;
    status: string;
    personality?: {
        traits: string[];
        background?: string;
        motivation?: string;
    };
    appearance?: {
        gender?: string;
        age?: string;
        ageGroup?: string;
        height?: string;
        build?: string;
        hair?: string;
        hairColor?: string;
        eyes?: string;
        clothing?: string;
        accessories?: string[];
        features?: string[];
    };
    interactionSettings?: {
        greeting?: string;
        tone?: string;
        formality?: string;
    };
}

export interface FilmLocation extends BaseEntity {
    type: 'FILM_LOCATION';
    name: string;
    description?: string;
    indoor?: boolean;
    timeOfDay?: string;
    tags: string[];
    atmosphereTags?: string[];
    visualDescription?: string;
    faceImage?: ImageMediaResource;
    threeViewImage?: ImageMediaResource;
    gridViewImage?: ImageMediaResource;
    refAssets?: AssetMediaResource[];
}

export interface FilmProp extends BaseEntity {
    type: 'FILM_PROP';
    name: string;
    description?: string;
    tags: string[];
    faceImage?: ImageMediaResource;
    threeViewImage?: ImageMediaResource;
    gridViewImage?: ImageMediaResource;
    characterUuids?: string[];
    refAssets?: AssetMediaResource[];
}

export interface FilmScene extends BaseEntity {
    type: 'FILM_SCENE';
    sceneNumber: number;
    index?: number;
    summary: string;
    locationId?: string;
    locationUuid?: string;
    characterIds?: string[];
    characterUuids?: string[];
    propUuids?: string[];
    moodTags?: string[];
    visualPrompt?: string;
}

export interface FilmShot extends BaseEntity {
    type: 'FILM_SHOT';
    shotNumber: number;
    index?: number;
    sceneId?: string;
    sceneUuid?: string;
    locationUuid?: string;
    description: string;
    dialogue?: string | { items: FilmDialogueItem[] };
    duration?: number;
    generation?: {
        status?: string;
        prompt?: string | { base: string };
        assets?: AssetMediaResource[];
        product?: string;
        modelId?: string;
        video?: { url?: string };
    };
    assets?: AssetMediaResource[];
    characterIds?: string[];
    characterUuids?: string[];
    propUuids?: string[];
}

export interface FilmDialogueItem {
    id: string;
    characterId: string;
    text: string;
}

export interface FilmSettings extends BaseEntity {
    theme?: string;
    style?: string;
    aspect?: string;
    aspectRatio?: string;
    resolution?: string;
    fps?: number;
    quality?: string;
    language?: string;
    defaultLanguage?: string;
    imageModel?: string;
    videoModel?: string;
    generation?: {
        autoImage?: boolean;
        autoVideo?: boolean;
        parallel?: boolean;
        maxConcurrent?: number;
    };
}

export type FilmViewMode = 'script' | 'storyboard' | 'timeline' | 'overview' | 'characters' | 'locations' | 'props' | 'preview';

export interface CutProject {
    id: string;
    uuid: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface CutTimeline {
    id: string;
    uuid: string;
    name: string;
    tracks: CutTrack[];
    createdAt: number;
    updatedAt: number;
}

export interface CutTrack {
    id: string;
    uuid: string;
    name: string;
    type: string;
    clips: CutClip[];
    layers?: CutLayer[];
}

export interface CutClip {
    id: string;
    uuid: string;
    name: string;
    startTime: number;
    endTime: number;
    media?: AnyMediaResource;
}

export interface CutLayer {
    id: string;
    uuid: string;
    name: string;
    clipIds: string[];
}

export interface CutTemplate {
    id: string;
    name: string;
    project?: CutProject;
}

export interface CharacterTask {
    id: string;
    name: string;
    status: string;
}

export interface ChatSession {
    id: string;
    title?: string;
    messages?: any[];
}

export interface Presentation {
    id: string;
    title: string;
    slides?: any[];
}

export interface Bookmark {
    id: string;
    url: string;
    title: string;
}

export interface HistoryItem {
    id: string;
    type: string;
    timestamp: number;
}

export interface DriveMetadata {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
}

export interface CanvasBoard {
    id: string;
    name: string;
    elements?: any[];
}

export interface Effect {
    id: string;
    name: string;
    type: string;
}

export interface ServerStorageProtocol {
    endpoint: string;
    bucket: string;
    region?: string;
}

// Workspace and Project types
export interface StudioProject extends BaseEntity {
    id: string;          // Directory Name (slug)
    uuid: string;        // Unique ID
    name: string;
    type: ProjectType;
    description: string;
    workspaceId: string; // Reference to parent
    path?: string;       // Absolute or Relative path (computed)
    thumbnailUrl?: string;
    coverImage?: ImageMediaResource;
}

export interface StudioWorkspace extends BaseEntity {
    id: string;          // Directory Name (slug)
    uuid: string;        // Unique ID
    name: string;
    description?: string;
    projects: StudioProject[];
    path?: string;       // Absolute or Relative path (computed)
    icon?: string;
}
