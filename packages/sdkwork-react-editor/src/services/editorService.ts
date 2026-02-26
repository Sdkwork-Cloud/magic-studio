// Editor Service Implementation
import { ServiceResult, Result, pathUtils } from '@sdkwork/react-commons';
import { FileEntry } from '@sdkwork/react-core';
import { vfs } from '@sdkwork/react-fs';

class EditorServiceImpl {
    async loadProjectTree(rootPath: string): Promise<ServiceResult<FileEntry[]>> {
        try {
            const entries = await vfs.readDir(rootPath);
            const sorted = this.sortEntries(entries);
            return Result.success(sorted);
        } catch (e: any) {
            return Result.error(e.message);
        }
    }

    async refreshDirectory(path: string): Promise<ServiceResult<FileEntry[]>> {
        try {
            const entries = await vfs.readDir(path);
            const sorted = this.sortEntries(entries);
            return Result.success(sorted);
        } catch (e: any) {
            return Result.error(e.message);
        }
    }

    async readFile(path: string): Promise<ServiceResult<string>> {
        try {
            const content = await vfs.readFile(path);
            return Result.success(content);
        } catch (e: any) {
            return Result.error(`Failed to read file: ${e.message}`);
        }
    }

    async writeFile(path: string, content: string): Promise<ServiceResult<void>> {
        try {
            await vfs.writeFile(path, content);
            return Result.success(undefined);
        } catch (e: any) {
            return Result.error(`Failed to save file: ${e.message}`);
        }
    }

    async createItem(path: string, type: 'file' | 'folder'): Promise<ServiceResult<void>> {
        try {
            if (type === 'file') {
                await vfs.writeFile(path, '');
            } else {
                await vfs.createDir(path);
            }
            return Result.success(undefined);
        } catch (e: any) {
            return Result.error(e.message);
        }
    }

    async deleteItem(path: string): Promise<ServiceResult<void>> {
        try {
            await vfs.delete(path);
            return Result.success(undefined);
        } catch (e: any) {
            return Result.error(e.message);
        }
    }

    async renameItem(oldPath: string, newName: string): Promise<ServiceResult<string>> {
        try {
            const dir = pathUtils.dirname(oldPath);
            const newPath = pathUtils.join(dir, newName);
            await vfs.rename(oldPath, newPath);
            return Result.success(newPath);
        } catch (e: any) {
            return Result.error(e.message);
        }
    }

    private sortEntries(entries: FileEntry[]): FileEntry[] {
        return entries.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });
    }
}

export const editorService = new EditorServiceImpl();
