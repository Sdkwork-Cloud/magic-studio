
export enum ThemeMode {
    DARK = 'dark',
    LIGHT = 'light',
    SYSTEM = 'system',
}

export interface SidebarItemConfig {
    id: string;
    labelKey: string;
    route: string;
    icon: string;
    visible: boolean;
    runtimeVisibility?: 'all' | 'web-only' | 'desktop-only';
    children?: SidebarItemConfig[];
}

export interface SidebarTemplate {
    id: string;
    name: string;
    description: string;
    labelKey: string;
    descriptionKey: string;
    config: SidebarItemConfig[];
}

export interface OpencodeConfig {
    enabled: boolean;
    model: string;
    temperature: number;
    maxTokens?: number;
    systemPrompt: string;
    confirmUnsafe: boolean;
    plugins: string[];
    theme: string;
    language: string;
    baseUrl?: string;
    apiKey?: string;
    tui?: {
        scrollSpeed: number;
        scrollAcceleration: boolean;
        diffStyle: 'auto' | 'stacked';
    };
    server?: {
        port: number;
        hostname: string;
        mdns: boolean;
        cors: string[];
    };
}

export interface LspConfig {
    id: string;
    name: string;
    enabled: boolean;
    command: string;
    args: string[];
    languages: string[];
}

export interface McpConfig {
    id: string;
    name: string;
    enabled: boolean;
    transport: 'stdio' | 'sse';
    command?: string;
    args?: string[];
    url?: string;
}

export interface SkillToolConfig {
    enabled: boolean;
    customInstallPath?: string;
    customConfigPath?: string;
}

export interface AgentConfig {
    id: string;
    name: string;
    enabled: boolean;
    model: string;
    systemPrompt: string;
    temperature: number;
    tools: string[];
}

export type LlmProviderType = 
    | 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq' | 'perplexity' 
    | 'ollama' | 'deepseek' | 'moonshot' | 'zhipu' | 'alibaba' | 'doubao' | 'yi' | 'minimax'
    | 'openrouter' | 'openai-compatible' | 'custom';

export interface LlmProviderConfig {
    id: string;
    name: string;
    providerType: LlmProviderType;
    enabled: boolean;
    baseUrl?: string;
    apiKey?: string;
    models: string[];
    defaultModel: string;
    headers?: Record<string, string>;
}

export type MediaPlatformType = 
    | 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' 
    | 'discord' | 'slack' | 'telegram' | 'whatsapp' | 'reddit' | 'medium'
    | 'wechat-mp' | 'toutiao' | 'zhihu' | 'bilibili' | 'weibo' | 'douyin' | 'xiaohongshu'
    | 'custom';

export interface MediaAccountConfig {
    id: string;
    name: string;
    platform: MediaPlatformType;
    enabled: boolean;
    
    appId?: string;
    appSecret?: string;
    token?: string;
    redirectUri?: string;
    
    encodingAesKey?: string;
    endpoint?: string;
}

export type StorageProviderType = 
  | 'aws' 
  | 'aliyun' 
  | 'tencent' 
  | 'volcengine' 
  | 'google' 
  | 'azure' 
  | 'cloudflare' 
  | 'minio' 
  | 'custom';

export type StorageConnectionMode = 'client' | 'server';

export interface StorageConfig {
  id: string;
  name: string;
  provider: StorageProviderType;
  enabled: boolean;
  isDefault: boolean;
  
  mode: StorageConnectionMode;

  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  region?: string;
  endpoint?: string; 
  forcePathStyle?: boolean;

  apiEndpoint?: string;
  authHeaderName?: string;
  authToken?: string;
  
  pathPrefix?: string; 
  publicDomain?: string; 
}

export type MaterialStorageMode = 'local-first-sync' | 'local-only' | 'server-only';

export interface MaterialStorageDesktopConfig {
  rootDir: string;
  workspacesRootDir?: string;
  cacheRootDir?: string;
  exportsRootDir?: string;
}

export interface MaterialStorageSyncConfig {
  enabled: boolean;
  autoUploadOnImport: boolean;
}

export interface MaterialStorageNamingConfig {
  keepOriginalFilenameInMetadata: boolean;
}

export interface MaterialStorageConfig {
  mode: MaterialStorageMode;
  desktop: MaterialStorageDesktopConfig;
  sync: MaterialStorageSyncConfig;
  naming: MaterialStorageNamingConfig;
}

export type AppMode = 'creator' | 'developer';

export interface AppSettings {
  general: {
    appMode: AppMode;
    language: string;
    checkUpdates: boolean;
    telemetry: boolean;
    developerMode: boolean;
  };
  appearance: {
    theme: ThemeMode;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    sidebarPosition: 'left' | 'right';
    sidebarConfig?: SidebarItemConfig[];
  };
  editor: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number; 
    fontLigatures: boolean; 
    minimap: boolean;
    wordWrap: 'off' | 'on' | 'wordWrapColumn';
    formatOnSave: boolean;
    tabSize: number;
    showLineNumbers: boolean;
  };
  terminal: {
    defaultShell: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontLigatures: boolean;
    cursorStyle: 'block' | 'underline' | 'bar';
    blinkingCursor: boolean;
  };
  browser: {
    downloadPath: string;
    autoImportToAssets: boolean;
  };
  ai: {
    defaultModel: string;
    apiKey?: string; 
    contextLimit: number;
    temperature: number;
  };
  opencode: OpencodeConfig;
  
  lsp: Record<string, LspConfig>;
  mcp: Record<string, McpConfig>;
  skills: Record<string, SkillToolConfig>;
  agents: Record<string, AgentConfig>;
  llm: Record<string, LlmProviderConfig>;
  media: Record<string, MediaAccountConfig>;
  storage: Record<string, StorageConfig>; 
  materialStorage: MaterialStorageConfig;
}
