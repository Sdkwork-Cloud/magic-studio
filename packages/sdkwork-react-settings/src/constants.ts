
import { AppSettings, ThemeMode, SidebarItemConfig, SidebarTemplate } from './entities';

export const SETTINGS_STORAGE_KEY = 'open_studio_settings_v1';

const ROUTES = {
    EDITOR: '/editor',
    NOTES: '/notes',
    PROMPT: '/prompt',
    DRIVE: '/drive',
    ASSETS: '/assets',
    PORTAL: '/portal',
    CHAT: '/chat',
    BROWSER: '/browser',
    IMAGE: '/image',
    VIDEO: '/video',
    FILM: '/film',
    MAGIC_CUT: '/magic-cut',
    CHARACTER: '/character',
    MUSIC: '/music',
    SFX: '/sfx',
    VOICE: '/voice',
    AUDIO: '/audio',
    CHAT_PPT: '/chat-ppt',
};

const CORE_TOOLS: SidebarItemConfig[] = [
    { id: 'editor', labelKey: 'sidebar.editor', route: ROUTES.EDITOR, icon: 'Code', visible: true },
    { id: 'notes', labelKey: 'sidebar.notes', route: ROUTES.NOTES, icon: 'BookOpen', visible: true },
    { id: 'prompt', labelKey: 'sidebar.prompt_optimizer', route: ROUTES.PROMPT, icon: 'Sparkles', visible: true },
    { id: 'drive', labelKey: 'sidebar.drive', route: ROUTES.DRIVE, icon: 'Cloud', visible: true },
    { id: 'assets', labelKey: 'sidebar.assets', route: ROUTES.ASSETS, icon: 'Library', visible: true },
    { id: 'portal', labelKey: 'sidebar.portal', route: ROUTES.PORTAL, icon: 'LayoutDashboard', visible: true },
    { id: 'separator-1', labelKey: '', route: '', icon: '', visible: true, children: [] }, 
    { id: 'chat', labelKey: 'sidebar.chat', route: ROUTES.CHAT, icon: 'MessageSquare', visible: true },
    { id: 'browser', labelKey: 'sidebar.browser', route: ROUTES.BROWSER, icon: 'Globe', visible: true },
];

const CREATIVE_TOOLS: SidebarItemConfig = {
    id: 'creative-group',
    labelKey: 'sidebar.group_creative',
    route: '',
    icon: 'Palette',
    visible: true,
    children: [
        { id: 'image', labelKey: 'sidebar.image_gen', route: ROUTES.IMAGE, icon: 'Image', visible: true },
        { id: 'video', labelKey: 'sidebar.video_studio', route: ROUTES.VIDEO, icon: 'Film', visible: true },
        { id: 'film', labelKey: 'sidebar.film_studio', route: ROUTES.FILM, icon: 'Clapperboard', visible: true }, 
        { id: 'magic-cut', labelKey: 'sidebar.magic_cut', route: ROUTES.MAGIC_CUT, icon: 'Scissors', visible: true },
        { id: 'character', labelKey: 'sidebar.character_studio', route: ROUTES.CHARACTER, icon: 'Smile', visible: true },
        { id: 'music', labelKey: 'sidebar.music_studio', route: ROUTES.MUSIC, icon: 'Music', visible: true },
        { id: 'sfx', labelKey: 'sidebar.sfx_studio', route: ROUTES.SFX, icon: 'AudioWaveform', visible: true },
        { id: 'voice', labelKey: 'sidebar.voice_lab', route: ROUTES.VOICE, icon: 'Mic2', visible: true },
        { id: 'speech', labelKey: 'sidebar.speech_studio', route: ROUTES.AUDIO, icon: 'Volume2', visible: true },
        { id: 'chat-ppt', labelKey: 'sidebar.chat_ppt', route: ROUTES.CHAT_PPT, icon: 'Presentation', visible: true },
    ]
};

export const SIDEBAR_TEMPLATES: SidebarTemplate[] = [
    {
        id: 'default',
        name: 'Full Studio',
        description: 'Access all features including development, creative tools, and marketplaces.',
        labelKey: 'settings.sidebar_layout.templates.default.title',
        descriptionKey: 'settings.sidebar_layout.templates.default.desc',
        config: [...CORE_TOOLS, { ...CREATIVE_TOOLS, visible: true }]
    },
    {
        id: 'creator',
        name: 'Creative Suite',
        description: 'Focus on content generation. Hides heavy dev tools.',
        labelKey: 'settings.sidebar_layout.templates.creator.title',
        descriptionKey: 'settings.sidebar_layout.templates.creator.desc',
        config: [
            CORE_TOOLS[1], // Notes
            CORE_TOOLS[2], // Prompt
            CORE_TOOLS[3], // Drive
            CORE_TOOLS[4], // Assets
            CORE_TOOLS[7], // Chat
            { ...CREATIVE_TOOLS, visible: true }
        ]
    },
    {
        id: 'minimal',
        name: 'Minimalist',
        description: 'Distraction-free environment. Just the basics.',
        labelKey: 'settings.sidebar_layout.templates.minimal.title',
        descriptionKey: 'settings.sidebar_layout.templates.minimal.desc',
        config: [
            CORE_TOOLS[1], // Notes
            CORE_TOOLS[2], // Prompt
            CORE_TOOLS[7], // Chat
            CORE_TOOLS[8]  // Browser
        ]
    }
];

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    appMode: 'creator',
    language: 'system',
    checkUpdates: true,
    telemetry: false,
    developerMode: false,
  },
  appearance: {
    theme: ThemeMode.DARK,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 13,
    lineHeight: 1.5,
    sidebarPosition: 'left',
    sidebarConfig: SIDEBAR_TEMPLATES[0].config
  },
  editor: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
    fontSize: 14,
    lineHeight: 1.5,
    fontLigatures: true,
    minimap: true,
    wordWrap: 'on',
    formatOnSave: false,
    tabSize: 2,
    showLineNumbers: true,
  },
  terminal: {
    defaultShell: 'default',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace",
    fontSize: 13,
    lineHeight: 1.2,
    fontLigatures: true,
    cursorStyle: 'block',
    blinkingCursor: true,
  },
  browser: {
    downloadPath: '/Downloads',
    autoImportToAssets: true,
  },
  ai: {
    defaultModel: 'gemini-3-flash-preview',
    contextLimit: 4096,
    temperature: 0.7,
  },
  opencode: {
      enabled: true,
      model: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 4096,
      systemPrompt: 'You are OpenCode, an expert coding assistant.',
      confirmUnsafe: true,
      plugins: ['git', 'fs'],
      theme: 'dark',
      language: 'en',
      baseUrl: '',
      apiKey: '',
      tui: {
          scrollSpeed: 3,
          scrollAcceleration: true,
          diffStyle: 'auto'
      },
      server: {
          port: 4096,
          hostname: '0.0.0.0',
          mdns: true,
          cors: ['http://localhost:5173']
      }
  },
  lsp: {
    'typescript-language-server': {
      id: 'typescript-language-server',
      name: 'TypeScript/JavaScript',
      enabled: true,
      command: 'typescript-language-server',
      args: ['--stdio'],
      languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact']
    },
    'rust-analyzer': {
      id: 'rust-analyzer',
      name: 'Rust Analyzer',
      enabled: true,
      command: 'rust-analyzer',
      args: [],
      languages: ['rust']
    }
  },
  mcp: {
    'filesystem': {
      id: 'filesystem',
      name: 'Local File System',
      enabled: true,
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/username/Desktop']
    },
  },
  skills: {},
  agents: {
     'default-assistant': {
        id: 'default-assistant',
        name: 'General Assistant',
        enabled: true,
        model: 'gpt-4o',
        systemPrompt: 'You are a helpful AI assistant integrated into Magic Studio.',
        temperature: 0.7,
        tools: ['web-search']
     }
  },
  media: {},
  storage: {},
  llm: {
    'openai': {
      id: 'openai',
      name: 'OpenAI',
      providerType: 'openai',
      enabled: true,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o'
    },
    'anthropic': {
      id: 'anthropic',
      name: 'Anthropic',
      providerType: 'anthropic',
      enabled: true,
      baseUrl: 'https://api.anthropic.com',
      apiKey: '',
      models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-5-sonnet-20240620'
    },
    'google': {
      id: 'google',
      name: 'Google Gemini',
      providerType: 'google',
      enabled: true,
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiKey: '',
      models: ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.0-flash'],
      defaultModel: 'gemini-3-flash-preview'
    },
    'openrouter': {
      id: 'openrouter',
      name: 'OpenRouter',
      providerType: 'openrouter',
      enabled: false,
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'],
      defaultModel: 'openai/gpt-4o'
    },
    'deepseek': {
      id: 'deepseek',
      name: 'DeepSeek',
      providerType: 'deepseek',
      enabled: false,
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      models: ['deepseek-chat', 'deepseek-coder'],
      defaultModel: 'deepseek-chat'
    },
    'moonshot': {
      id: 'moonshot',
      name: 'Moonshot AI (Kimi)',
      providerType: 'moonshot',
      enabled: false,
      baseUrl: 'https://api.moonshot.cn/v1',
      apiKey: '',
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      defaultModel: 'moonshot-v1-8k'
    },
    'zhipu': {
      id: 'zhipu',
      name: 'Zhipu AI (ChatGLM)',
      providerType: 'zhipu',
      enabled: false,
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '',
      models: ['glm-4', 'glm-4-flash', 'glm-4-air', 'glm-3-turbo'],
      defaultModel: 'glm-4-flash'
    },
    'alibaba': {
      id: 'alibaba',
      name: 'Alibaba Cloud (Qwen)',
      providerType: 'alibaba',
      enabled: false,
      baseUrl: 'https://dashscope.aliyunscs.com/compatible-mode/v1',
      apiKey: '',
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      defaultModel: 'qwen-plus'
    },
    'doubao': {
      id: 'doubao',
      name: 'Doubao (ByteDance)',
      providerType: 'doubao',
      enabled: false,
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      apiKey: '',
      models: ['doubao-pro-32k', 'doubao-lite-32k'],
      defaultModel: 'doubao-lite-32k'
    },
    'yi': {
      id: 'yi',
      name: '01.AI (Yi)',
      providerType: 'yi',
      enabled: false,
      baseUrl: 'https://api.lingyiwanwu.com/v1',
      apiKey: '',
      models: ['yi-large', 'yi-medium', 'yi-vision'],
      defaultModel: 'yi-large'
    },
    'minimax': {
      id: 'minimax',
      name: 'Minimax',
      providerType: 'minimax',
      enabled: false,
      baseUrl: 'https://api.minimax.chat/v1',
      apiKey: '',
      models: ['abab6.5-chat', 'abab6.5s-chat'],
      defaultModel: 'abab6.5s-chat'
    },
    'ollama': {
      id: 'ollama',
      name: 'Ollama (Local)',
      providerType: 'ollama',
      enabled: false,
      baseUrl: 'http://localhost:11434/v1',
      models: ['llama3', 'mistral', 'codellama', 'gemma2'],
      defaultModel: 'llama3'
    },
    'mistral': {
      id: 'mistral',
      name: 'Mistral AI',
      providerType: 'mistral',
      enabled: false,
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: '',
      models: ['mistral-large-latest', 'mistral-medium', 'mistral-small'],
      defaultModel: 'mistral-large-latest'
    },
    'groq': {
      id: 'groq',
      name: 'Groq',
      providerType: 'groq',
      enabled: false,
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: '',
      models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
      defaultModel: 'llama3-70b-8192'
    },
    'perplexity': {
      id: 'perplexity',
      name: 'Perplexity',
      providerType: 'perplexity',
      enabled: false,
      baseUrl: 'https://api.perplexity.ai',
      apiKey: '',
      models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'],
      defaultModel: 'llama-3.1-sonar-large-128k-online'
    },
    'openai-compatible': {
      id: 'openai-compatible',
      name: 'Custom (OpenAI Compatible)',
      providerType: 'openai-compatible',
      enabled: false,
      baseUrl: 'https://your-custom-endpoint/v1',
      apiKey: '',
      models: ['custom-model'],
      defaultModel: 'custom-model'
    }
  }
};
