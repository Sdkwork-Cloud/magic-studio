
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import { LocalStorageService } from '@sdkwork/magic-studio-core/services';
import { workspaceBusinessService } from '@sdkwork/magic-studio-workspace';
import type { EditorSession, EditorSessionProjectScope } from '../types';

const SESSION_KEY = 'magic_studio_editor_session_v1';
const LEGACY_SESSION_KEYS = ['open_studio_editor_session_v1'] as const;
const DEFAULT_SESSION_ID = 'current_workspace';

const normalizeRootPath = (value: string | null | undefined): string | null => {
    const normalized = typeof value === 'string' ? pathUtils.normalize(value.trim()) : '';
    return normalized || null;
};

const normalizeRelativeSessionPath = (value: string | null | undefined): string | null => {
    const normalized = typeof value === 'string'
        ? value.trim().replace(/\\/g, '/')
        : '';
    if (!normalized) {
        return null;
    }
    return normalized;
};

const toRelativeProjectPath = (projectRootPath: string, absolutePath: string): string | null => {
    const normalizedRoot = normalizeRootPath(projectRootPath);
    const normalizedPath = normalizeRootPath(absolutePath);
    if (!normalizedRoot || !normalizedPath) {
        return null;
    }

    if (normalizedPath === normalizedRoot) {
        return null;
    }

    const normalizedRootWithSeparator = `${normalizedRoot}${pathUtils.detectSeparator(normalizedRoot)}`;
    if (!normalizedPath.startsWith(normalizedRootWithSeparator)) {
        return null;
    }

    const relative = normalizedPath.slice(normalizedRootWithSeparator.length).replace(/\\/g, '/');
    return normalizeRelativeSessionPath(relative);
};

const resolveProjectPath = (projectRootPath: string, relativePath: string | null | undefined): string | null => {
    const normalizedRoot = normalizeRootPath(projectRootPath);
    const normalizedRelative = normalizeRelativeSessionPath(relativePath);
    if (!normalizedRoot || !normalizedRelative) {
        return null;
    }

    return pathUtils.join(normalizedRoot, ...normalizedRelative.split('/'));
};

class EditorSessionService extends LocalStorageService<EditorSession> {
    constructor() {
        super(SESSION_KEY, LEGACY_SESSION_KEYS);
    }

    async saveSession(
        rootPath: string | null, 
        openFiles: Array<{ path: string; isPreview?: boolean }>, 
        activeFilePath: string | null, 
        expandedPaths: string[],
        scope?: EditorSessionProjectScope,
        selectedPath?: string | null,
    ): Promise<void> {
        const normalizedRootPath = normalizeRootPath(rootPath);
        if (scope && normalizedRootPath && normalizedRootPath === normalizeRootPath(scope.projectRootPath)) {
            const result = await workspaceBusinessService.saveProjectSession(scope.workspaceId, scope.projectId, {
                openFiles: openFiles
                    .map((file) => ({
                        path: toRelativeProjectPath(scope.projectRootPath, file.path) || '',
                        isPreview: Boolean(file.isPreview),
                    }))
                    .filter((file) => Boolean(file.path)),
                activeFilePath: toRelativeProjectPath(scope.projectRootPath, activeFilePath || ''),
                selectedPath: toRelativeProjectPath(scope.projectRootPath, selectedPath || ''),
                expandedPaths: expandedPaths
                    .map((path) => toRelativeProjectPath(scope.projectRootPath, path) || '')
                    .filter(Boolean),
            });
            if (!result.success) {
                return;
            }
            return;
        }

        const session: EditorSession = {
            id: DEFAULT_SESSION_ID,
            uuid: DEFAULT_SESSION_ID, // Static ID for singleton session
            rootPath: normalizedRootPath,
            openFiles: openFiles.map((file) => ({
                path: normalizeRootPath(file.path) || file.path,
                isPreview: Boolean(file.isPreview),
            })),
            activeFilePath: normalizeRootPath(activeFilePath),
            selectedPath: normalizeRootPath(selectedPath),
            expandedPaths,
            createdAt: Date.now(), // These update on save
            updatedAt: Date.now()
        };
        await this.save(session);
    }

    async loadSession(scope?: EditorSessionProjectScope): Promise<EditorSession | null> {
        if (scope) {
            const response = await workspaceBusinessService.readProjectSession(scope.workspaceId, scope.projectId);
            if (!response.success) {
                return null;
            }
            if (response.data) {
                return {
                    id: response.data.id,
                    uuid: response.data.uuid,
                    rootPath: scope.projectRootPath,
                    openFiles: response.data.openFiles
                        .map((file) => {
                            const path = resolveProjectPath(scope.projectRootPath, file.path);
                            if (!path) {
                                return null;
                            }

                            return {
                                path,
                                isPreview: Boolean(file.isPreview),
                            };
                        })
                        .filter((file): file is { path: string; isPreview: boolean } => Boolean(file)),
                    activeFilePath: resolveProjectPath(scope.projectRootPath, response.data.activeFilePath),
                    selectedPath: resolveProjectPath(scope.projectRootPath, response.data.selectedPath),
                    expandedPaths: response.data.expandedPaths
                        .map((path) => resolveProjectPath(scope.projectRootPath, path))
                        .filter((path): path is string => Boolean(path)),
                    createdAt: response.data.createdAt,
                    updatedAt: response.data.updatedAt,
                };
            }
            return null;
        }

        const res = await this.findById(DEFAULT_SESSION_ID);
        return res.data || null;
    }

    async clearSession(scope?: EditorSessionProjectScope): Promise<void> {
        if (scope) {
            await workspaceBusinessService.clearProjectSession(scope.workspaceId, scope.projectId);
            return;
        }

        await this.deleteById(DEFAULT_SESSION_ID);
    }
}

export const editorSessionService = new EditorSessionService();
