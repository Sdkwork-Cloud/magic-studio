
import { IDE_AND_TOOLS_CONFIG } from '../constants';
import { IDEDefinition, PlatformKey } from '../types';
import { platform } from '../../../platform';
import { pathUtils } from '../../../utils/pathUtils';
import { vfs } from '../../fs/vfs';

export const ideConfigService = {
    /**
     * Get the static definition of a tool
     */
    getToolDefinition: (toolId: string): IDEDefinition | undefined => {
        return IDE_AND_TOOLS_CONFIG.definitions.find(t => t.id === toolId);
    },

    /**
     * Get all supported tools
     */
    getAllTools: (): IDEDefinition[] => {
        return IDE_AND_TOOLS_CONFIG.definitions;
    },

    /**
     * Get all supported tools by category
     */
    getToolsByCategory: (category: IDEDefinition['category']): IDEDefinition[] => {
        return IDE_AND_TOOLS_CONFIG.definitions.filter(t => t.category === category);
    },

    /**
     * Check if the tool is installed (executable exists in PATH)
     * Returns true for internal managers (no executable defined)
     */
    isInstalled: async (toolId: string): Promise<boolean> => {
        const tool = IDE_AND_TOOLS_CONFIG.definitions.find(t => t.id === toolId);
        if (!tool) return false;
        
        // Internal tools are always "installed"
        if (!tool.executable) return true;

        return await platform.checkCommandExists(tool.executable);
    },

    /**
     * Resolve the absolute path to the configuration file
     */
    getConfigPath: async (toolId: string, scope: 'global' | 'project', projectRoot?: string): Promise<string | null> => {
        const config = await ideConfigService._getPlatformConfig(toolId);
        if (!config) return null;

        const rawPath = scope === 'global' ? config.config : config.projectConfig;
        if (!rawPath) return null;

        return await ideConfigService._replaceVariables(rawPath, projectRoot);
    },

    /**
     * Resolve the absolute path to the installation directory (for Skills, Plugins, etc.)
     */
    getInstallPath: async (toolId: string): Promise<string | null> => {
        const config = await ideConfigService._getPlatformConfig(toolId);
        if (!config || !config.install) return null;

        return await ideConfigService._replaceVariables(config.install);
    },

    /**
     * Read the configuration file content
     */
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

    // --- Private Helpers ---

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
