export const APP_NAME = 'SDKWork Studio';
export const APP_VERSION = '0.1.0';

export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'zh-CN', 'ja'] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
export const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];

export const Z_INDEX = {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080
} as const;

export * from './styles';
