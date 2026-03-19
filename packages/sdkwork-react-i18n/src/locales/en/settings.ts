export const settings = {
    tabs: {
        general: "General",
        appearance: "Appearance",
        sidebar: "Menu & Layout",
        editor: "Editor",
        llm: "Models",
        media: "Media Accounts",
        storage: "Object Storage",
        lsp: "Language Servers",
        mcp: "MCP Servers",
        agents: "Agents",
        opencode: "OpenCode",
        about: "About"
    },
    sections: {
        application: "Application",
        privacy: "Privacy",
        window: "Window & Layout",
        typography: "Typography",
        visual: "Visual",
        formatting: "Formatting",
        parameters: "Parameters",
        integration: "Integration"
    },
    general: {
        language: {
            label: "Language",
            desc: "Change the UI language.",
            options: {
                system: "System Default",
                enUS: "English (US)",
                zhCN: "Chinese (Simplified)"
            }
        },
        checkUpdates: {
            label: "Check for Updates",
            desc: "Automatically check for new versions on startup."
        },
        telemetry: {
            label: "Telemetry",
            desc: "Send anonymous usage data to help us improve."
        },
        developerMode: {
            label: "Developer Mode",
            desc: "Enable advanced debugging tools."
        }
    },
    appearance: {
        theme: {
            label: "Theme",
            desc: "Select your preferred color theme.",
            options: {
                dark: "Dark",
                light: "Light",
                system: "System"
            }
        },
        sidebarPosition: {
            label: "Sidebar Position",
            desc: "Choose where the sidebar appears.",
            options: {
                left: "Left",
                right: "Right"
            }
        },
        fontFamily: {
            label: "UI Font",
            desc: "Primary font for the application interface."
        },
        fontSize: {
            label: "UI Font Size",
            desc: "Base font size for the interface."
        },
        lineHeight: {
            label: "Line Height",
            desc: "Spacing between lines of text."
        }
    },
    sidebar_layout: {
        title: "Menu & Layout",
        subtitle: "Customize the sidebar navigation structure.",
        sections: {
            templates: "Templates",
            items: "Menu Items"
        },
        templates: {
            default: { title: "Full Studio", desc: "Access all features including development, creative tools, and marketplaces." },
            developer: { title: "Developer Focus", desc: "Optimized for coding. Hides creative media tools." },
            creator: { title: "Creative Suite", desc: "Focus on content generation. Hides heavy dev tools." },
            minimal: { title: "Minimalist", desc: "Distraction-free environment. Just the basics." }
        },
        actions: {
            reset: "Reset Layout"
        }
    },
    editor: {
        fontFamily: {
            label: "Font Family",
            desc: "Font used in the code editor."
        },
        fontSize: {
            label: "Font Size",
            desc: "Size of the font in pixels."
        },
        lineHeight: {
            label: "Line Height",
            desc: "Line height multiplier."
        },
        fontLigatures: {
            label: "Font Ligatures",
            desc: "Enable font ligatures (e.g. =>)."
        },
        minimap: {
            label: "Minimap",
            desc: "Show a code overview on the side."
        },
        showLineNumbers: {
            label: "Line Numbers",
            desc: "Display line numbers in the gutter."
        },
        wordWrap: {
            label: "Word Wrap",
            desc: "Wrap long lines.",
            options: {
                off: "Off",
                on: "On",
                wordWrapColumn: "Wrap at Column"
            }
        },
        tabSize: {
            label: "Tab Size",
            desc: "Number of spaces per tab."
        },
        formatOnSave: {
            label: "Format On Save",
            desc: "Automatically format file on save."
        }
    },
    browser: {
        downloadPath: {
            label: "Download Path",
            desc: "Default directory for downloads."
        },
        autoImport: {
            label: "Auto Import",
            desc: "Automatically add downloaded media to Assets."
        }
    },
    ai: {
        defaultModel: {
            label: "Default Model"
        },
        contextLimit: {
            label: "Context Limit",
            desc: "Max tokens for history."
        },
        temperature: {
            label: "Temperature",
            desc: "Randomness of the AI."
        }
    },
    storage: {
        title: "Object Storage",
        subtitle: "Configure S3-compatible storage providers for asset management.",
        no_accounts: "No storage accounts configured.",
        add_account: "Add Storage",
        configuration: "Configuration",
        credentials: "Credentials",
        provider: "Provider",
        bucket: "Bucket Name",
        region: "Region",
        endpoint: "Endpoint URL",
        access_key: "Access Key ID",
        secret_key: "Secret Access Key",
        public_domain: "Public Domain / CDN",
        path_prefix: "Path Prefix (Optional)",
        test_connection: "Test Connection",
        force_path_style: "Force Path Style",
        is_default: "Set as Default Storage",
        api_config: "API Configuration",
        api_endpoint: "API Endpoint",
        auth_header: "Auth Header Name",
        auth_token: "Auth Token",
        status: {
            success: "Connection successful.",
            failed: "Connection failed. Check settings.",
            error: "Error: {message}"
        },
        material: {
            title: "MagicStudio Material Storage",
            subtitle: "Keep editing media local-first with a professional workspace/project filesystem layout. Cloud storage stays optional and secondary.",
            mode: {
                label: "Storage Mode",
                desc: "Choose whether Magic Cut writes media to the local filesystem first or forces server-only uploads.",
                options: {
                    localFirstSync: "Local First (Recommended)",
                    localOnly: "Local Only",
                    serverOnly: "Server Only"
                }
            },
            desktop: {
                title: "Desktop Paths",
                rootDir: "MagicStudio Root",
                rootDirDesc: "Primary root for MagicStudio users, workspaces, projects, and system indexes.",
                workspacesRootDir: "Workspaces Override",
                workspacesRootDirDesc: "Optional dedicated root for workspace and project folders. MagicStudio still creates the standard workspace/project hierarchy inside this path.",
                cacheRootDir: "Cache Override",
                cacheRootDirDesc: "Optional high-speed root for project cache data. MagicStudio appends the standard workspace/project/cache structure automatically.",
                exportsRootDir: "Exports Override",
                exportsRootDirDesc: "Optional separate root for exports. MagicStudio appends the standard workspace/project/exports structure automatically."
            },
            behavior: {
                title: "Behavior",
                syncEnabled: "Enable Server Sync",
                syncEnabledDesc: "Allow background synchronization for locally managed assets when remote storage is available.",
                autoUploadOnImport: "Auto Upload After Import",
                autoUploadOnImportDesc: "Queue a server upload immediately after local ingest when sync is enabled.",
                keepOriginalFilename: "Preserve Original Filename In Metadata",
                keepOriginalFilenameDesc: "Store the user-visible source filename in metadata while keeping managed files collision-safe on disk."
            }
        }
    },
    lsp: {
        title: "Language Servers",
        subtitle: "Configure LSP for intelligent code editing.",
        no_servers: "No servers configured.",
        server_config: "Server Config",
        languages: "Languages",
        restart_hint: "Changes require a restart.",
        select_server: "Select a server",
        create_new: "Or create a new one"
    },
    mcp: {
        title: "MCP Servers",
        subtitle: "Model Context Protocol configuration.",
        no_tools: "No MCP servers configured.",
        configuration: "Configuration",
        transport: "Transport",
        execution: "Execution",
        connection: "Connection",
        url: "URL",
        env_vars: "Environment Variables",
        env_vars_desc: "Environment variables configuration coming soon.",
        select_tool: "Select a server"
    },
    agents: {
        title: "Agents",
        subtitle: "Configure AI agent personalities.",
        no_agents: "No agents configured.",
        configuration: "Configuration",
        system_prompt: "System Prompt",
        tools_access: "Tools Access",
        select_agent: "Select an agent"
    },
    llm: {
        providers: "Providers",
        select_provider: "Select a provider",
        connection: "Connection",
        api_key: "API Key",
        base_url: "Base URL",
        models: "Models",
        default_model: "Default Model",
        available_models: "Available Models",
        provider_names: {
            openai: "OpenAI",
            anthropic: "Anthropic",
            google: "Google Gemini",
            mistral: "Mistral",
            groq: "Groq",
            perplexity: "Perplexity",
            ollama: "Ollama",
            deepseek: "DeepSeek",
            moonshot: "Moonshot",
            zhipu: "Zhipu AI",
            alibaba: "Alibaba Cloud",
            doubao: "Doubao",
            yi: "01.AI",
            minimax: "MiniMax",
            openrouter: "OpenRouter",
            "openai-compatible": "Custom (OpenAI)"
        }
    },
    media: {
        accounts: "Accounts",
        no_accounts: "No accounts configured.",
        select_account: "Select an account",
        platform_config: "Platform Config",
        platform: "Platform",
        credentials: "Credentials",
        app_id: "App ID / Key",
        app_secret: "App Secret",
        token: "Token",
        redirect_uri: "Redirect URI",
        encoding_aes_key: "Encoding AES Key",
        endpoint: "Endpoint",
        groups: {
            global: "Global",
            video: "Video",
            chat: "Chat",
            china: "China",
            generic: "Generic"
        },
        platforms: {
            twitter: "Twitter",
            facebook: "Facebook",
            instagram: "Instagram",
            linkedin: "LinkedIn",
            youtube: "YouTube",
            tiktok: "TikTok",
            discord: "Discord",
            slack: "Slack",
            telegram: "Telegram",
            whatsapp: "WhatsApp",
            reddit: "Reddit",
            medium: "Medium",
            "wechat-mp": "WeChat MP",
            toutiao: "Toutiao",
            zhihu: "Zhihu",
            bilibili: "Bilibili",
            weibo: "Weibo",
            douyin: "Douyin",
            xiaohongshu: "Xiaohongshu",
            custom: "Custom"
        }
    },
    opencode: {
        title: "OpenCode",
        subtitle: "Autonomous coding agent configuration.",
        sections: {
            model: "Model & Connection",
            agent: "Agent Behavior",
            environment: "Environment"
        },
        model: {
            label: "Model",
            desc: "The AI model used for code generation."
        },
        base_url: {
            label: "Base URL",
            desc: "Override the API endpoint."
        },
        api_key: {
            label: "API Key",
            desc: "Your API key for the selected provider."
        },
        system_prompt: {
            label: "System Prompt"
        },
        temperature: {
            label: "Temperature"
        },
        max_tokens: {
            label: "Max Tokens"
        },
        confirm_unsafe: {
            label: "Confirm Unsafe Ops",
            desc: "Ask before executing shell commands or file writes."
        },
        tui: {
            title: "Interface (TUI)",
            scroll_speed: "Scroll Speed",
            diff_style: "Diff Style",
            scroll_acceleration: {
                label: "Scroll Acceleration",
                desc: "Enable momentum scrolling."
            }
        },
        server: {
            title: "Server",
            hostname: "Hostname",
            port: "Port",
            mdns: {
                label: "mDNS Discovery",
                desc: "Broadcast server on local network."
            },
            cors: {
                label: "CORS Origins",
                desc: "Allowed origins (one per line)."
            }
        },
        theme: {
            label: "Theme"
        },
        language: {
            label: "Language"
        }
    },
    search: {
        placeholder: "Search settings...",
        noResults: "No matching settings",
        tryAnother: "Try searching for something else like \"font\" or \"theme\"",
        confirmReset: "Are you sure you want to reset all settings to default?",
        resetApp: "Reset Application",
        invalidConfig: "Invalid Configuration Detected"
    }
};
