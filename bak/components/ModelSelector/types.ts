
import React from 'react';

export interface ModelOption {
    id: string;
    name: string;
    description?: string;
    badge?: string;
    badgeColor?: string; // Tailwind class e.g., 'bg-blue-500'
    maxAssetsCount?: number;
}

export interface ModelProvider {
    id: string;
    name: string;
    icon: React.ReactNode;
    color?: string; // Tailwind text color class e.g., 'text-blue-500'
    models: ModelOption[];
}

export interface ModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    providers: ModelProvider[];
    className?: string;
    disabled?: boolean;
    label?: string; // Custom label for the button, defaults to selected model name
    
    // Controlled State
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}
