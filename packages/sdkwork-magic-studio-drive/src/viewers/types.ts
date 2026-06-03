
import React from 'react';
import { DriveItem } from '../entities/drive.entity';

/**
 * Standard properties passed to any registered file viewer.
 */
export interface FileViewerProps {
    item: DriveItem;
    url: string; // Blob URL or Remote URL
    content?: string; // Text content if pre-loaded
    onClose: () => void;
    onSave?: (content: string | Uint8Array) => Promise<void>; // If editable
    isReadOnly?: boolean;
    /**
     * A DOM element in the parent modal's header.
     * Viewers can use React.createPortal to render custom actions (like "Save") here.
     */
    headerElement: HTMLElement | null;
}

export interface ViewerRegistration {
    id: string;
    name: string;
    component: React.FC<FileViewerProps>;
    /**
     * Priority of the viewer (higher wins).
     */
    priority: number;
    /**
     * Function to check if this viewer handles the file.
     */
    supports: (item: DriveItem) => boolean;
}

export interface IViewerRegistry {
    register(registration: ViewerRegistration): void;
    getViewer(item: DriveItem): React.FC<FileViewerProps> | null;
}
