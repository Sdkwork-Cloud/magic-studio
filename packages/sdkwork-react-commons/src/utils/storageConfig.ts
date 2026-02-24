import { pathUtils } from './helpers';

export const APP_ROOT_DIR = 'open-studio';

export const DIR_NAMES = {
    WORKSPACES: 'workspaces',
    LIBRARY: 'library',
    AGENTS: 'agents',
    MCP: 'mcp',
    CACHE: 'global-cache',
    SYSTEM: 'system',
    TEMPLATES: 'templates'
} as const;

export const PROJECT_SUBDIRS = {
    ASSETS: 'assets',
    EXPORTS: 'exports',
    CACHE: '.cache',
    META: '.meta'
} as const;

export const CACHE_SUBDIRS = {
    THUMBNAILS: 'thumbnails',
    WAVEFORMS: 'waveforms',
    TEMP: 'temp'
} as const;

export const LIBRARY_SUBDIRS = {
    DOWNLOADS: 'downloads',
    IMAGES: 'images',
    AUDIO: 'audio',
    VIDEO: 'video',
    MODELS: 'models'
} as const;

export const storageConfig = {

    workspace: (workspaceUuid: string) => {
        const root = pathUtils.join(APP_ROOT_DIR, DIR_NAMES.WORKSPACES, workspaceUuid);
        return {
            root,
            configFile: pathUtils.join(root, 'workspace.json'),
            projectsDir: pathUtils.join(root, 'projects')
        };
    },

    project: (workspaceUuid: string, projectUuid: string) => {
        const wsRoot = pathUtils.join(APP_ROOT_DIR, DIR_NAMES.WORKSPACES, workspaceUuid);
        const root = pathUtils.join(wsRoot, 'projects', projectUuid);

        return {
            root,
            file: pathUtils.join(root, 'project.json'),
            assets: pathUtils.join(root, PROJECT_SUBDIRS.ASSETS),
            exports: pathUtils.join(root, PROJECT_SUBDIRS.EXPORTS),
            cache: pathUtils.join(root, PROJECT_SUBDIRS.CACHE),
            meta: pathUtils.join(root, PROJECT_SUBDIRS.META),
        };
    },

    agents: {
        root: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.AGENTS),
        system: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.AGENTS, 'system'),
        user: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.AGENTS, 'user'),
        get: (agentUuid: string, type: 'system' | 'user' = 'user') =>
            pathUtils.join(APP_ROOT_DIR, DIR_NAMES.AGENTS, type === 'system' ? 'system' : 'user', agentUuid)
    },

    mcp: {
        root: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.MCP),
        registry: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.MCP, 'registry.json'),
        servers: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.MCP, 'servers')
    },

    library: {
        root: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.LIBRARY),
        downloads: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.LIBRARY, LIBRARY_SUBDIRS.DOWNLOADS),
        images: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.LIBRARY, LIBRARY_SUBDIRS.IMAGES),
        audio: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.LIBRARY, LIBRARY_SUBDIRS.AUDIO),
        video: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.LIBRARY, LIBRARY_SUBDIRS.VIDEO),
        models: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.LIBRARY, LIBRARY_SUBDIRS.MODELS),
    },

    system: {
        root: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.SYSTEM),
        logs: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.SYSTEM, 'logs'),
        config: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.SYSTEM, 'config.json')
    },

    globalCache: {
        root: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.CACHE),
        thumbnails: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.CACHE, CACHE_SUBDIRS.THUMBNAILS),
        waveforms: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.CACHE, CACHE_SUBDIRS.WAVEFORMS),
        temp: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.CACHE, CACHE_SUBDIRS.TEMP),
    },

    templates: {
        root: pathUtils.join(APP_ROOT_DIR, DIR_NAMES.TEMPLATES),
        get: (templateId: string) => pathUtils.join(APP_ROOT_DIR, DIR_NAMES.TEMPLATES, templateId)
    }
};
