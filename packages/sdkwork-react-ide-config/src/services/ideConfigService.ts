import { IDE_AND_TOOLS_CONFIG } from '../constants';
import { IDEDefinition, PlatformKey } from '../types';
import { platform } from 'sdkwork-react-core';
import { pathUtils } from 'sdkwork-react-commons';
import { vfs } from 'sdkwork-react-fs';

export const ideConfigService = {
    getToolDefinition: (toolId: string): IDEDefinition | undefined => {
        return IDE_AND_TOOLS_CONFIG.definitions.find(t => t.id === toolId);
    },

    getAllTools: (): IDEDefinition[] => {
        return IDE_AND_TOOLS_CONFIG.definitions;
    },

    getToolsByCategory: (category: IDEDefinition['category']): IDEDefinition[] => {
        return IDE_AND_TOOLS_CONFIG.definitions.filter(t => t.category === category);
    },

    isInstalled: async (toolId: string): Promise<boolean> => {
        const tool = IDE_AND_TOOLS_CONFIG.definitions.find(t => t.id === toolId);
        if (!tool) return false;
        
        if (!tool.executable) return true;

        return await platform.checkCommandExists(tool.executable);
    },

    getConfigPath: async (toolId: string, scope: 'global' | 'project', projectRoot?: string): Promise<string | null> => {
        const config = await ideConfigService._getPlatformConfig(toolId);
        if (!config) return null;

        const rawPath = scope === 'global' ? config.config : config.projectConfig;
        if (!rawPath) return null;

        return await ideConfigService._replaceVariables(rawPath, projectRoot);
    },

    getInstallPath: async (toolId: string): Promise<string | null> => {
        const config = await ideConfigService._getPlatformConfig(toolId);
        if (!config || !config.install) return null;

        return await ideConfigService._replaceVariables(config.install);
    },

    readConfig: async (toolId: string, scope: 'global' | 'project', projectRoot?: string): Promise<string | null> => {
        const path = await ideConfigService.getConfigPath(toolId, scope, projectRoot);
        if (!path) return null;

        try {
            const stats = await vfs.stat(path);
            if (stats.type !== 'file') return null;
            return await vfs.readFile(path);
        } catch (e) {
            return null;
        }
    },

    _getPlatformConfig: async (toolId: string) => {
        const tool = IDE_AND_TOOLS_CONFIG.definitions.find(t => t.id === toolId);
        if (!tool) return null;

        const osType = await platform.getOsType();
        let platformKey: PlatformKey = 'linux';
        if (osType === 'windows') platformKey = 'windows';
        if (osType === 'macos') platformKey = 'macos';

        return tool.platforms[platformKey];
    },

    _replaceVariables: async (rawPath: string, projectRoot?: string): Promise<string> => {
        let resolved = rawPath;

        if (resolved.includes('${HOME}')) {
            const home = await platform.getPath('home');
            resolved = resolved.replace(/\$\{HOME\}/g, home);
        }

        if (resolved.includes('${USERPROFILE}')) {
             const home = await platform.getPath('home');
             resolved = resolved.replace(/\$\{USERPROFILE\}/g, home);
        }

        if (resolved.includes('${APPDATA}')) {
            const appData = await platform.getPath('appData');
            resolved = resolved.replace(/\$\{APPDATA\}/g, appData);
        }

        if (resolved.includes('${PROJECT_ROOT}')) {
            if (!projectRoot) return '';
            resolved = resolved.replace(/\$\{PROJECT_ROOT\}/g, projectRoot);
        }

        return pathUtils.normalize(resolved);
    }
};
