export type ToolCategory = 'IDE' | 'AI_AGENT' | 'SKILL_MANAGER' | 'MCP_MANAGER' | 'PLUGIN_MANAGER';
export type ConfigScope = 'global' | 'project';
export type PlatformKey = 'windows' | 'linux' | 'macos';

export interface PathSpec {
    config?: string;
    install?: string;
    data?: string;
    projectConfig?: string;
}

export interface IDEDefinition {
    id: string;
    name: string;
    description?: string;
    category: ToolCategory;
    executable?: string;
    skill: boolean;
    platforms: {
        windows: PathSpec;
        linux: PathSpec;
        macos: PathSpec;
    };
    format: 'json' | 'yaml' | 'toml' | 'text' | 'xml';
}

export interface IdeConfigSchema {
    schemaVersion: string;
    definitions: IDEDefinition[];
}
