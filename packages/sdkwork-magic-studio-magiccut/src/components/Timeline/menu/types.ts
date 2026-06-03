
import React from 'react';

export type MenuContextType = 'clip' | 'track' | 'timeline';

export interface MenuItemConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    separator?: boolean;
    action: () => void;
}

export interface MenuState {
    isOpen: boolean;
    x: number;
    y: number;
    type: MenuContextType;
    targetId: string | null;
    time: number;
}

