
import type { ModelProvider } from '../../types';

export interface ModelOption {
    id: string;
    name: string;
    description?: string;
    badge?: string;
    badgeColor?: string; // Tailwind class e.g., 'bg-blue-500'
    maxAssetsCount?: number;
}

// Use ModelProvider from main types.ts to avoid duplicate definitions
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

// Re-export ModelProvider for convenience
export type { ModelProvider };
