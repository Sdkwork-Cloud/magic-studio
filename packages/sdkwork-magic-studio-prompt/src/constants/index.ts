export const PROMPT_TYPES = {
    IMAGE: 'image' as const,
    VIDEO: 'video' as const,
};

export const OPTIMIZATION_MODES = {
    TEXT_TO_PROMPT: 'text-to-prompt' as const,
    IMAGE_TO_PROMPT: 'image-to-prompt' as const,
    VIDEO_TO_PROMPT: 'video-to-prompt' as const,
};

export const DEFAULT_IMAGE_PROMPT_TEMPLATES = [
    {
        id: null,
        uuid: 'portrait-basic',
        name: 'Basic Portrait',
        description: 'Generate a professional portrait',
        type: 'image' as const,
        template: 'A professional portrait of {subject}, {style}, {lighting}, high quality, detailed',
        variables: [
            { id: null, uuid: 'portrait-basic-subject', name: 'subject', description: 'Subject description', required: true },
            { id: null, uuid: 'portrait-basic-style', name: 'style', description: 'Art style', defaultValue: 'photorealistic', required: false },
            { id: null, uuid: 'portrait-basic-lighting', name: 'lighting', description: 'Lighting setup', defaultValue: 'soft studio lighting', required: false },
        ],
    },
    {
        id: null,
        uuid: 'landscape-basic',
        name: 'Landscape Scene',
        description: 'Generate a beautiful landscape',
        type: 'image' as const,
        template: 'A stunning landscape of {location}, {time}, {weather}, {style}, ultra detailed, 8k',
        variables: [
            { id: null, uuid: 'landscape-basic-location', name: 'location', description: 'Location description', required: true },
            { id: null, uuid: 'landscape-basic-time', name: 'time', description: 'Time of day', defaultValue: 'golden hour', required: false },
            { id: null, uuid: 'landscape-basic-weather', name: 'weather', description: 'Weather conditions', defaultValue: 'clear sky', required: false },
            { id: null, uuid: 'landscape-basic-style', name: 'style', description: 'Art style', defaultValue: 'photorealistic', required: false },
        ],
    },
];

export const DEFAULT_VIDEO_PROMPT_TEMPLATES = [
    {
        id: null,
        uuid: 'cinematic-basic',
        name: 'Cinematic Shot',
        description: 'Generate a cinematic video shot',
        type: 'video' as const,
        template: 'A cinematic shot of {subject}, {camera_movement}, {mood}, {lighting}, high quality, smooth motion',
        variables: [
            { id: null, uuid: 'cinematic-basic-subject', name: 'subject', description: 'Main subject', required: true },
            { id: null, uuid: 'cinematic-basic-camera-movement', name: 'camera_movement', description: 'Camera movement', defaultValue: 'slow push in', required: false },
            { id: null, uuid: 'cinematic-basic-mood', name: 'mood', description: 'Mood/atmosphere', defaultValue: 'dramatic', required: false },
            { id: null, uuid: 'cinematic-basic-lighting', name: 'lighting', description: 'Lighting style', defaultValue: 'cinematic lighting', required: false },
        ],
    },
    {
        id: null,
        uuid: 'action-basic',
        name: 'Action Scene',
        description: 'Generate an action video sequence',
        type: 'video' as const,
        template: 'An action sequence showing {action}, {environment}, {camera_style}, dynamic movement, high quality',
        variables: [
            { id: null, uuid: 'action-basic-action', name: 'action', description: 'Action description', required: true },
            { id: null, uuid: 'action-basic-environment', name: 'environment', description: 'Setting/environment', defaultValue: 'urban street', required: false },
            { id: null, uuid: 'action-basic-camera-style', name: 'camera_style', description: 'Camera technique', defaultValue: 'handheld tracking shot', required: false },
        ],
    },
];
