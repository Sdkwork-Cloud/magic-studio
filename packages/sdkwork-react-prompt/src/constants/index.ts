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
        id: 'portrait-basic',
        name: 'Basic Portrait',
        description: 'Generate a professional portrait',
        type: 'image' as const,
        template: 'A professional portrait of {subject}, {style}, {lighting}, high quality, detailed',
        variables: [
            { name: 'subject', description: 'Subject description', required: true },
            { name: 'style', description: 'Art style', defaultValue: 'photorealistic', required: false },
            { name: 'lighting', description: 'Lighting setup', defaultValue: 'soft studio lighting', required: false },
        ],
    },
    {
        id: 'landscape-basic',
        name: 'Landscape Scene',
        description: 'Generate a beautiful landscape',
        type: 'image' as const,
        template: 'A stunning landscape of {location}, {time}, {weather}, {style}, ultra detailed, 8k',
        variables: [
            { name: 'location', description: 'Location description', required: true },
            { name: 'time', description: 'Time of day', defaultValue: 'golden hour', required: false },
            { name: 'weather', description: 'Weather conditions', defaultValue: 'clear sky', required: false },
            { name: 'style', description: 'Art style', defaultValue: 'photorealistic', required: false },
        ],
    },
];

export const DEFAULT_VIDEO_PROMPT_TEMPLATES = [
    {
        id: 'cinematic-basic',
        name: 'Cinematic Shot',
        description: 'Generate a cinematic video shot',
        type: 'video' as const,
        template: 'A cinematic shot of {subject}, {camera_movement}, {mood}, {lighting}, high quality, smooth motion',
        variables: [
            { name: 'subject', description: 'Main subject', required: true },
            { name: 'camera_movement', description: 'Camera movement', defaultValue: 'slow push in', required: false },
            { name: 'mood', description: 'Mood/atmosphere', defaultValue: 'dramatic', required: false },
            { name: 'lighting', description: 'Lighting style', defaultValue: 'cinematic lighting', required: false },
        ],
    },
    {
        id: 'action-basic',
        name: 'Action Scene',
        description: 'Generate an action video sequence',
        type: 'video' as const,
        template: 'An action sequence showing {action}, {environment}, {camera_style}, dynamic movement, high quality',
        variables: [
            { name: 'action', description: 'Action description', required: true },
            { name: 'environment', description: 'Setting/environment', defaultValue: 'urban street', required: false },
            { name: 'camera_style', description: 'Camera technique', defaultValue: 'handheld tracking shot', required: false },
        ],
    },
];
