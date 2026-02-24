
import { BaseEntity } from '../../../types/core';
import { EditorFile } from '../types';

export interface EditorSession extends BaseEntity {
    // There is typically only one active session in the store with ID 'default'
    // but structure allows for multiple workspaces
    openFiles: EditorFile[];
    activeFilePath: string | null;
    expandedPaths: string[];
    rootPath: string | null;
}
