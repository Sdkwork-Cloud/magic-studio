export const settings = {
    tabs: {
        general: "常规",
        appearance: "外观",
        sidebar: "菜单与布局",
        editor: "编辑器",
        llm: "模型",
        media: "媒体账户",
        storage: "对象存储",
        lsp: "语言服务器",
        mcp: "MCP 服务器",
        agents: "代理",
        opencode: "OpenCode",
        about: "关于"
    },
    sections: {
        application: "应用程序",
        privacy: "隐私",
        window: "窗口与布局",
        typography: "排版与字体",
        visual: "视觉效果",
        formatting: "格式化",
        parameters: "参数",
        integration: "集成"
    },
    general: {
        language: {
            label: "语言",
            desc: "更改界面语言。",
            options: {
                system: "系统默认",
                enUS: "English (US)",
                zhCN: "\u4e2d\u6587\uff08\u7b80\u4f53\uff09"
            }
        },
        checkUpdates: {
            label: "自动更新",
            desc: "启动时自动检查新版本。"
        },
        telemetry: {
            label: "遥测",
            desc: "发送匿名使用数据以帮助我们改进。"
        },
        developerMode: {
            label: "开发者模式",
            desc: "启用高级调试工具。"
        }
    },
    appearance: {
        theme: {
            label: "主题",
            desc: "选择您喜欢的颜色主题。",
            options: {
                dark: "深色",
                light: "浅色",
                system: "跟随系统"
            }
        },
        sidebarPosition: {
            label: "侧边栏位置",
            desc: "选择侧边栏显示的位置。",
            options: {
                left: "左侧",
                right: "右侧"
            }
        },
        fontFamily: {
            label: "界面字体",
            desc: "应用程序界面的主要字体。"
        },
        fontSize: {
            label: "界面字号",
            desc: "界面的基础字体大小。"
        },
        lineHeight: {
            label: "行高",
            desc: "文本行之间的间距。"
        }
    },
    sidebar_layout: {
        title: "菜单与布局",
        subtitle: "自定义侧边栏导航结构。",
        sections: {
            templates: "模板",
            items: "菜单项"
        },
        templates: {
            default: { title: "全功能工作室", desc: "访问所有功能，包括开发、创意工具和市场。" },
            developer: { title: "开发者专注", desc: "为编码优化。隐藏创意媒体工具。" },
            creator: { title: "创意套件", desc: "专注于内容生成。隐藏繁重的开发工具。" },
            minimal: { title: "极简主义", desc: "无干扰环境。仅保留基础功能。" }
        },
        actions: {
            reset: "重置布局"
        }
    },
    editor: {
        fontFamily: {
            label: "字体系列",
            desc: "代码编辑器中使用的字体。"
        },
        fontSize: {
            label: "字体大小",
            desc: "字体大小（像素）。"
        },
        lineHeight: {
            label: "行高",
            desc: "行高倍数。"
        },
        fontLigatures: {
            label: "字体连字",
            desc: "启用字体连字（例如 =>）。"
        },
        minimap: {
            label: "缩略图",
            desc: "在侧边显示代码概览。"
        },
        showLineNumbers: {
            label: "行号",
            desc: "在装订线中显示行号。"
        },
        wordWrap: {
            label: "自动换行",
            desc: "换行长行。",
            options: {
                off: "关闭",
                on: "开启",
                wordWrapColumn: "按列换行"
            }
        },
        tabSize: {
            label: "制表符大小",
            desc: "每个制表符的空格数。"
        },
        formatOnSave: {
            label: "保存时格式化",
            desc: "保存文件时自动格式化。"
        }
    },
    browser: {
        downloadPath: {
            label: "下载路径",
            desc: "下载文件的默认目录。"
        },
        autoImport: {
            label: "自动导入",
            desc: "自动将下载的媒体添加到资产库。"
        }
    },
    ai: {
        defaultModel: {
            label: "默认模型"
        },
        contextLimit: {
            label: "上下文限制",
            desc: "历史记录的最大 Token 数。"
        },
        temperature: {
            label: "随机性 (Temperature)",
            desc: "AI 的随机性程度。"
        }
    },
    storage: {
        title: "对象存储管理",
        subtitle: "配置 S3 兼容的存储服务以进行资产管理。",
        no_accounts: "未配置存储账户。",
        add_account: "添加存储",
        configuration: "配置",
        credentials: "凭证",
        provider: "提供商",
        bucket: "存储桶名称",
        region: "区域 (Region)",
        endpoint: "服务端点 (Endpoint)",
        access_key: "Access Key ID",
        secret_key: "Secret Access Key",
        public_domain: "CDN / 公开域名",
        path_prefix: "路径前缀 (可选)",
        test_connection: "测试连接",
        force_path_style: "强制路径样式",
        is_default: "设为默认存储",
        api_config: "API 配置",
        api_endpoint: "API 端点",
        auth_header: "认证头名称",
        auth_token: "认证令牌",
        status: {
            success: "连接成功。",
            failed: "连接失败，请检查设置。",
            error: "错误: {message}"
        },
        material: {
            title: "MagicStudio \u7d20\u6750\u5b58\u50a8",
            subtitle: "\u9ed8\u8ba4\u4ee5\u672c\u5730\u4f18\u5148\u65b9\u5f0f\u4fdd\u5b58\u7f16\u8f91\u7d20\u6750\uff0c\u5e76\u4fdd\u6301\u4e13\u4e1a\u7684 workspace / project \u6587\u4ef6\u7cfb\u7edf\u7ed3\u6784\u3002\u4e91\u7aef\u5b58\u50a8\u4f5c\u4e3a\u53ef\u9009\u80fd\u529b\u3002",
            mode: {
                label: "\u5b58\u50a8\u6a21\u5f0f",
                desc: "\u9009\u62e9\u9b54\u6620\u662f\u5426\u9ed8\u8ba4\u5148\u5199\u5165\u672c\u5730\u6587\u4ef6\u7cfb\u7edf\uff0c\u6216\u5f3a\u5236\u4ec5\u4f7f\u7528\u670d\u52a1\u7aef\u4e0a\u4f20\u3002",
                options: {
                    localFirstSync: "\u672c\u5730\u4f18\u5148\uff08\u63a8\u8350\uff09",
                    localOnly: "\u4ec5\u672c\u5730",
                    serverOnly: "\u4ec5\u670d\u52a1\u7aef"
                }
            },
            desktop: {
                title: "\u684c\u9762\u7aef\u8def\u5f84",
                rootDir: "MagicStudio \u6839\u76ee\u5f55",
                rootDirDesc: "MagicStudio \u7528\u4e8e\u5b58\u653e users\u3001workspaces\u3001projects \u4ee5\u53ca system \u7d22\u5f15\u7684\u4e3b\u6839\u76ee\u5f55\u3002",
                workspacesRootDir: "Workspace \u6839\u76ee\u5f55\u8986\u76d6",
                workspacesRootDirDesc: "\u53ef\u9009\u5355\u72ec\u6307\u5b9a workspace \u4e0e project \u76ee\u5f55\u7684\u6839\u4f4d\u7f6e\uff0cMagicStudio \u4ecd\u4f1a\u5728\u5176\u4e2d\u81ea\u52a8\u521b\u5efa\u6807\u51c6\u7684 workspace/project \u5c42\u7ea7\u7ed3\u6784\u3002",
                cacheRootDir: "\u7f13\u5b58\u6839\u76ee\u5f55\u8986\u76d6",
                cacheRootDirDesc: "\u53ef\u9009\u5c06 render\u3001waveform\u3001thumbnail \u7b49\u53ef\u91cd\u5efa\u7f13\u5b58\u6307\u5411\u72ec\u7acb\u9ad8\u901f\u6839\u76ee\u5f55\uff0cMagicStudio \u4f1a\u81ea\u52a8\u8ffd\u52a0\u6807\u51c6\u7684 workspace/project/cache \u7ed3\u6784\u3002",
                exportsRootDir: "\u5bfc\u51fa\u6839\u76ee\u5f55\u8986\u76d6",
                exportsRootDirDesc: "\u53ef\u9009\u4e3a draft\u3001master\u3001package \u5bfc\u51fa\u6307\u5b9a\u72ec\u7acb\u6839\u76ee\u5f55\uff0cMagicStudio \u4f1a\u81ea\u52a8\u8ffd\u52a0\u6807\u51c6\u7684 workspace/project/exports \u7ed3\u6784\u3002"
            },
            behavior: {
                title: "\u884c\u4e3a\u7b56\u7565",
                syncEnabled: "\u542f\u7528\u670d\u52a1\u7aef\u540c\u6b65",
                syncEnabledDesc: "\u5f53\u8fdc\u7a0b\u5b58\u50a8\u53ef\u7528\u65f6\uff0c\u5141\u8bb8\u5df2\u672c\u5730\u7ba1\u7406\u7684\u7d20\u6750\u8fdb\u884c\u540e\u53f0\u540c\u6b65\u3002",
                autoUploadOnImport: "\u5bfc\u5165\u540e\u81ea\u52a8\u4e0a\u4f20",
                autoUploadOnImportDesc: "\u542f\u7528\u540c\u6b65\u65f6\uff0c\u5728\u672c\u5730\u5165\u5e93\u540e\u7acb\u5373\u5c06\u4efb\u52a1\u52a0\u5165\u4e0a\u4f20\u961f\u5217\u3002",
                keepOriginalFilename: "\u5728\u5143\u6570\u636e\u4e2d\u4fdd\u7559\u539f\u59cb\u6587\u4ef6\u540d",
                keepOriginalFilenameDesc: "\u786e\u4fdd\u7528\u6237\u53ef\u8bfb\u7684\u539f\u59cb\u6587\u4ef6\u540d\u88ab\u4fdd\u7559\u5728\u5143\u6570\u636e\u4e2d\uff0c\u540c\u65f6\u7ba1\u7406\u6587\u4ef6\u540d\u5728\u78c1\u76d8\u4e0a\u4fdd\u6301\u7a33\u5b9a\u3002"
            }
        },
    },
    lsp: {
        title: "语言服务器",
        subtitle: "配置 LSP 以实现智能代码编辑。",
        no_servers: "未配置服务器。",
        server_config: "服务器配置",
        languages: "语言",
        restart_hint: "更改需要重启。",
        select_server: "选择一个服务器",
        create_new: "或创建一个新的"
    },
    mcp: {
        title: "MCP 服务器",
        subtitle: "Model Context Protocol 配置。",
        no_tools: "未配置 MCP 服务器。",
        configuration: "配置",
        transport: "传输协议",
        execution: "执行",
        connection: "连接",
        url: "URL",
        env_vars: "环境变量",
        env_vars_desc: "环境变量配置即将推出。",
        select_tool: "选择一个服务器"
    },
    agents: {
        title: "代理",
        subtitle: "配置 AI 代理个性。",
        no_agents: "未配置代理。",
        configuration: "配置",
        system_prompt: "系统提示词",
        tools_access: "工具访问权限",
        select_agent: "选择一个代理"
    },
    llm: {
        providers: "提供商",
        select_provider: "选择一个提供商",
        connection: "连接",
        api_key: "API 密钥",
        base_url: "基础 URL",
        models: "模型",
        default_model: "默认模型",
        available_models: "可用模型",
        provider_names: {
            openai: "OpenAI",
            anthropic: "Anthropic",
            google: "Google Gemini",
            mistral: "Mistral",
            groq: "Groq",
            perplexity: "Perplexity",
            ollama: "Ollama",
            deepseek: "DeepSeek",
            moonshot: "月之暗面 (Kimi)",
            zhipu: "智谱 AI",
            alibaba: "阿里云 (通义千问)",
            doubao: "豆包 (字节跳动)",
            yi: "零一万物",
            minimax: "MiniMax",
            openrouter: "OpenRouter",
            "openai-compatible": "自定义 (OpenAI)"
        }
    },
    media: {
        accounts: "账户",
        no_accounts: "未配置账户。",
        select_account: "选择一个账户",
        platform_config: "平台配置",
        platform: "平台",
        credentials: "凭证",
        app_id: "App ID / Key",
        app_secret: "App Secret",
        token: "Token",
        redirect_uri: "重定向 URI",
        encoding_aes_key: "Encoding AES Key",
        endpoint: "服务端点",
        groups: {
            global: "全球",
            video: "视频",
            chat: "聊天",
            china: "中国",
            generic: "通用"
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
            "wechat-mp": "微信公众号",
            toutiao: "今日头条",
            zhihu: "知乎",
            bilibili: "哔哩哔哩",
            weibo: "微博",
            douyin: "抖音",
            xiaohongshu: "小红书",
            custom: "自定义"
        }
    },
    opencode: {
        title: "OpenCode",
        subtitle: "自主编码代理配置。",
        sections: {
            model: "模型与连接",
            agent: "代理行为",
            environment: "环境"
        },
        model: {
            label: "模型",
            desc: "用于代码生成的 AI 模型。"
        },
        base_url: {
            label: "基础 URL",
            desc: "覆盖 API 端点。"
        },
        api_key: {
            label: "API 密钥",
            desc: "所选提供商的 API 密钥。"
        },
        system_prompt: {
            label: "系统提示词"
        },
        temperature: {
            label: "随机性 (Temperature)"
        },
        max_tokens: {
            label: "最大 Token 数"
        },
        confirm_unsafe: {
            label: "确认不安全操作",
            desc: "在执行 Shell 命令或文件写入前询问。"
        },
        tui: {
            title: "界面 (TUI)",
            scroll_speed: "滚动速度",
            diff_style: "Diff 样式",
            scroll_acceleration: {
                label: "滚动加速",
                desc: "启用惯性滚动。"
            }
        },
        server: {
            title: "服务器",
            hostname: "主机名",
            port: "端口",
            mdns: {
                label: "mDNS 发现",
                desc: "在局域网广播服务器。"
            },
            cors: {
                label: "CORS 来源",
                desc: "允许的来源（每行一个）。"
            }
        },
        theme: {
            label: "主题"
        },
        language: {
            label: "语言"
        }
    },
    search: {
        placeholder: "搜索设置...",
        noResults: "无匹配设置",
        tryAnother: "尝试搜索其他内容，如'字体'或'主题'",
        confirmReset: "您确定要将所有设置重置为默认值吗？",
        resetApp: "重置应用",
        invalidConfig: "检测到无效配置"
    }
};
