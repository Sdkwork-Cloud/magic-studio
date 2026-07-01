export enum GenerationType {
    FILM = 'FILM',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
    CHARACTER = 'CHARACTER',
    MUSIC = 'MUSIC',
    SPEECH = 'SPEECH',
    SFX = 'SFX'
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

export interface GenerationMode {
    id: string;
    name: string;
    description?: string;
}
