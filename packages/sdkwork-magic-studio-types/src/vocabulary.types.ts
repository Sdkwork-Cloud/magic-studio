export enum MediaResourceType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    SFX = 'SFX',
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

export enum RemixIntent {
    NONE = 'NONE',
    EXPAND = 'EXPAND',
    STYLE_TRANSFER = 'STYLE_TRANSFER',
    SUBJECT_REPLACE = 'SUBJECT_REPLACE',
    BACKGROUND_REPLACE = 'BACKGROUND_REPLACE'
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | 'speech' | 'sfx' | 'character';
export type ExportResolution = '480p' | '720p' | '1080p' | '2k' | '4k';
export type PlatformKey = 'windows' | 'macos' | 'linux';
