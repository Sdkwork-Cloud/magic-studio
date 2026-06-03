
import React from 'react';
import { DriveItem } from '../entities/drive.entity';
import { IViewerRegistry, ViewerRegistration, FileViewerProps } from './types';

class ViewerRegistryImpl implements IViewerRegistry {
    private viewers: ViewerRegistration[] = [];

    register(registration: ViewerRegistration): void {
        this.viewers.push(registration);
        // Keep sorted by priority desc
        this.viewers.sort((a, b) => b.priority - a.priority);
    }

    getViewer(item: DriveItem): React.FC<FileViewerProps> | null {
        const match = this.viewers.find(v => v.supports(item));
        return match ? match.component : null;
    }
}

export const viewerRegistry = new ViewerRegistryImpl();
