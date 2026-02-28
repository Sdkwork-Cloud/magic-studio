import type { LucideIcon } from 'lucide-react';

export interface StyleOption {
    id: string;
    label: string;
    assets: {
        scene?: { url: string };
        portrait?: { url: string };
        video?: { url: string };
        sheet?: { url: string };
    };
    description?: string;
    usage?: string[];
    prompt?: string;
    prompt_zh?: string;
    isCustom?: boolean;
}

export interface PortalMode {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    desc: string;
}

export interface GenMode {
    id: string;
    label: string;
    icon: LucideIcon;
    desc: string;
    validTabs: string[];
}
