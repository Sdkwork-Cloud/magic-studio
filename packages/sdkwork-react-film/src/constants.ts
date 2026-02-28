
export const TIMELINE_CONSTANTS = {
    HEADER_WIDTH: 190, 
    TRACK_HEIGHT_MAIN: 80,
    TRACK_HEIGHT_VIDEO: 72,
    TRACK_HEIGHT_AUDIO: 48,
    TRACK_HEIGHT_EFFECT: 32,
    TRACK_HEIGHT_DEFAULT: 48,
    TRACK_MARGIN_BOTTOM: 4,
    RULER_HEIGHT: 22,
    MIN_ZOOM: 0.05,
    MAX_ZOOM: 80,
    DEFAULT_PIXELS_PER_SECOND: 30,
    SNAP_THRESHOLD_PX: 10,
    
    COLOR_MAIN_BG: '#18181b',
    COLOR_VIDEO_BG: '#1e293b',
    COLOR_VIDEO_BORDER: '#334155',
    COLOR_AUDIO_BG: '#064e3b',
    COLOR_AUDIO_BORDER: '#065f46',
    
    WAVEFORM_COLOR: '#10b981',
    
    Z_GRID: 0,
    Z_CLIPS: 10,
    Z_GHOST: 20,
    Z_PLAYHEAD: 50,
    Z_SNAP_GUIDE: 40
};

import { StyleOption } from '@sdkwork/react-commons';

export const FILM_STYLES: StyleOption[] = [
    { id: 'cinematic', label: '🎬 Cinematic', value: 'cinematic' },
    { id: 'realistic', label: '📷 Realistic', value: 'realistic' },
    { id: 'anime', label: '🎨 Anime', value: 'anime' },
    { id: 'cartoon', label: '✏️ Cartoon', value: 'cartoon' },
    { id: 'fantasy', label: '🧙 Fantasy', value: 'fantasy' },
    { id: 'scifi', label: '🚀 Sci-Fi', value: 'scifi' },
    { id: 'horror', label: '👻 Horror', value: 'horror' },
    { id: 'documentary', label: '📹 Documentary', value: 'documentary' },
];
