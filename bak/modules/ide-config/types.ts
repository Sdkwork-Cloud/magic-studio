
export type ToolCategory = 'IDE' | 'AI_AGENT' | 'SKILL_MANAGER' | 'MCP_MANAGER' | 'PLUGIN_MANAGER';
export type ConfigScope = 'global' | 'project';
export type PlatformKey = 'windows' | 'linux' | 'macos';

export interface PathSpec {
    /** 
     * Path to the configuration file (e.g. settings.json, config.yaml) 
     */
    config?: string;
    
    /** 
     * Directory where assets/extensions are installed 
     */
    install?: string;

    /**
     * Runtime logs or data directory
     */
    data?: string;

    /**
     * Project specific configuration file path (Workspace level) 
     * usually relative, e.g., ".vscode/settings.json"
     */
    projectConfig?: string;
}

export interface IDEDefinition {
    id: string;
    name: string;
    description?: string;
    category: ToolCategory;
    executable?: string; // Command to check existence (e.g. 'code', 'cursor')
    
    /** 
     * Whether this tool supports Open Studio Skills injection 
     */
    skill: boolean;

    /** Configuration paths for each platform */
    platforms: {
        windows: PathSpec;
        linux: PathSpec;
        macos: PathSpec;
    };

    /** Config format (for parsing) */
    format: 'json' | 'yaml' | 'toml' | 'text' | 'xml';
}

export interface IdeConfigSchema {
    schemaVersion: string;
    definitions: IDEDefinition[];
}
