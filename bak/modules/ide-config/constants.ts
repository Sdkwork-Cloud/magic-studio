
import { IdeConfigSchema } from './types';

export const IDE_AND_TOOLS_CONFIG: IdeConfigSchema = {
    schemaVersion: "2.4.0",
    definitions: [
        // ==================================================================================
        // SYSTEM MANAGERS
        // ==================================================================================
        {
            id: "skill-manager",
            name: "Magic Studio Skills",
            category: "SKILL_MANAGER",
            skill: true,
            format: "json",
            platforms: {
                macos: {
                    install: "${HOME}/.openstudio/skills",
                    config: "${HOME}/.openstudio/skills/registry.json"
                },
                linux: {
                    install: "${HOME}/.openstudio/skills",
                    config: "${HOME}/.openstudio/skills/registry.json"
                },
                windows: {
                    install: "${USERPROFILE}/.openstudio/skills",
                    config: "${USERPROFILE}/.openstudio/skills/registry.json"
                }
            }
        },
        {
            id: "mcp-manager",
            name: "Model Context Protocol",
            category: "MCP_MANAGER",
            skill: false,
            format: "json",
            platforms: {
                macos: {
                    install: "${HOME}/.openstudio/mcp",
                    config: "${HOME}/.openstudio/mcp_settings.json"
                },
                linux: {
                    install: "${HOME}/.openstudio/mcp",
                    config: "${HOME}/.openstudio/mcp_settings.json"
                },
                windows: {
                    install: "${USERPROFILE}/.openstudio/mcp",
                    config: "${USERPROFILE}/.openstudio/mcp_settings.json"
                }
            }
        },
        {
            id: "plugin-manager",
            name: "Magic Studio Plugins",
            category: "PLUGIN_MANAGER",
            skill: false,
            format: "json",
            platforms: {
                macos: {
                    install: "${HOME}/.openstudio/plugins",
                    config: "${HOME}/.openstudio/plugins.json"
                },
                linux: {
                    install: "${HOME}/.openstudio/plugins",
                    config: "${HOME}/.openstudio/plugins.json"
                },
                windows: {
                    install: "${USERPROFILE}/.openstudio/plugins",
                    config: "${USERPROFILE}/.openstudio/plugins.json"
                }
            }
        },

        // ==================================================================================
        // AI IDEs (Support Skills)
        // ==================================================================================
        {
            id: "cursor",
            name: "Cursor",
            category: "IDE",
            skill: true,
            executable: "cursor",
            format: "json",
            platforms: {
                macos: {
                    config: "${HOME}/Library/Application Support/Cursor/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.cursor/settings.json",
                    install: "${HOME}/.cursor/skills"
                },
                linux: {
                    config: "${HOME}/.config/Cursor/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.cursor/settings.json",
                    install: "${HOME}/.cursor/skills"
                },
                windows: {
                    config: "${APPDATA}/Cursor/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.cursor/settings.json",
                    install: "${USERPROFILE}/.cursor/skills"
                }
            }
        },
        {
            id: "trae",
            name: "Trae",
            category: "IDE",
            skill: true,
            executable: "trae",
            format: "json",
            platforms: {
                macos: {
                    config: "${HOME}/Library/Application Support/Trae/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.trae/config.json",
                    install: "${HOME}/.trae/skills"
                },
                linux: {
                    config: "${HOME}/.config/Trae/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.trae/config.json",
                    install: "${HOME}/.trae/skills"
                },
                windows: {
                    config: "${APPDATA}/Trae/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.trae/config.json",
                    install: "${USERPROFILE}/.trae/skills"
                }
            }
        },

        // ==================================================================================
        // STANDARD IDEs (Do NOT support Skills)
        // ==================================================================================
        {
            id: "vscode",
            name: "Visual Studio Code",
            category: "IDE",
            skill: false,
            executable: "code",
            format: "json",
            platforms: {
                macos: {
                    config: "${HOME}/Library/Application Support/Code/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.vscode/settings.json",
                    install: "${HOME}/.vscode/extensions"
                },
                linux: {
                    config: "${HOME}/.config/Code/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.vscode/settings.json",
                    install: "${HOME}/.vscode/extensions"
                },
                windows: {
                    config: "${APPDATA}/Code/User/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.vscode/settings.json",
                    install: "${USERPROFILE}/.vscode/extensions"
                }
            }
        },
        {
            id: "zed",
            name: "Zed",
            category: "IDE",
            skill: false,
            executable: "zed",
            format: "json",
            platforms: {
                macos: {
                    config: "${HOME}/.config/zed/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.zed/settings.json",
                    install: "${HOME}/.config/zed/extensions"
                },
                linux: {
                    config: "${HOME}/.config/zed/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.zed/settings.json",
                    install: "${HOME}/.config/zed/extensions"
                },
                windows: {
                    config: "${APPDATA}/Zed/settings.json",
                    projectConfig: "${PROJECT_ROOT}/.zed/settings.json",
                    install: "${APPDATA}/Zed/extensions"
                }
            }
        },
        {
            id: "intellij",
            name: "IntelliJ IDEA",
            category: "IDE",
            skill: false,
            executable: "idea",
            format: "xml",
            platforms: {
                macos: {
                    config: "${HOME}/Library/Application Support/JetBrains/IntelliJIdea2024.1/options/jdk.table.xml",
                    projectConfig: "${PROJECT_ROOT}/.idea/misc.xml",
                    install: "${HOME}/Library/Application Support/JetBrains/IntelliJIdea2024.1/plugins"
                },
                linux: {
                    config: "${HOME}/.config/JetBrains/IntelliJIdea2024.1/options/jdk.table.xml",
                    projectConfig: "${PROJECT_ROOT}/.idea/misc.xml",
                    install: "${HOME}/.local/share/JetBrains/IntelliJIdea2024.1"
                },
                windows: {
                    config: "${APPDATA}/JetBrains/IntelliJIdea2024.1/options/jdk.table.xml",
                    projectConfig: "${PROJECT_ROOT}/.idea/misc.xml",
                    install: "${APPDATA}/JetBrains/IntelliJIdea2024.1/plugins"
                }
            }
        },
        {
            id: "webstorm",
            name: "WebStorm",
            category: "IDE",
            skill: false,
            executable: "webstorm",
            format: "xml",
            platforms: {
                macos: {
                    config: "${HOME}/Library/Application Support/JetBrains/WebStorm2024.1/options/web-types.xml",
                    projectConfig: "${PROJECT_ROOT}/.idea/misc.xml",
                    install: "${HOME}/Library/Application Support/JetBrains/WebStorm2024.1/plugins"
                },
                linux: {
                    config: "${HOME}/.config/JetBrains/WebStorm2024.1/options/web-types.xml",
                    projectConfig: "${PROJECT_ROOT}/.idea/misc.xml",
                    install: "${HOME}/.local/share/JetBrains/WebStorm2024.1"
                },
                windows: {
                    config: "${APPDATA}/JetBrains/WebStorm2024.1/options/web-types.xml",
                    projectConfig: "${PROJECT_ROOT}/.idea/misc.xml",
                    install: "${APPDATA}/JetBrains/WebStorm2024.1/plugins"
                }
            }
        },
        {
            id: "pycharm",
            name: "PyCharm",
            category: "IDE",
            skill: false,
            executable: "pycharm",
            format: "xml",
            platforms: {
                macos: { 
                    config: "${HOME}/Library/Application Support/JetBrains/PyCharm2024.1/options/jdk.table.xml",
                    install: "${HOME}/Library/Application Support/JetBrains/PyCharm2024.1/plugins"
                },
                linux: { 
                    config: "${HOME}/.config/JetBrains/PyCharm2024.1/options/jdk.table.xml",
                    install: "${HOME}/.local/share/JetBrains/PyCharm2024.1"
                },
                windows: { 
                    config: "${APPDATA}/JetBrains/PyCharm2024.1/options/jdk.table.xml",
                    install: "${APPDATA}/JetBrains/PyCharm2024.1/plugins"
                }
            }
        },
        {
            id: "android-studio",
            name: "Android Studio",
            category: "IDE",
            skill: false,
            executable: "studio",
            format: "xml",
            platforms: {
                macos: { 
                    config: "${HOME}/Library/Application Support/Google/AndroidStudio2024.1/options",
                    install: "${HOME}/Library/Application Support/Google/AndroidStudio2024.1/plugins"
                },
                linux: { 
                    config: "${HOME}/.config/Google/AndroidStudio2024.1",
                    install: "${HOME}/.local/share/Google/AndroidStudio2024.1"
                },
                windows: { 
                    config: "${APPDATA}/Google/AndroidStudio2024.1",
                    install: "${APPDATA}/Google/AndroidStudio2024.1/plugins"
                }
            }
        },
        {
            id: "xcode",
            name: "Xcode",
            category: "IDE",
            skill: false,
            executable: "xcodebuild",
            format: "text",
            platforms: {
                macos: { 
                    config: "${HOME}/Library/Preferences/com.apple.dt.Xcode.plist",
                    install: "${HOME}/Library/Developer/Xcode/UserData/CodeSnippets"
                },
                linux: { config: "", install: "" }, 
                windows: { config: "", install: "" } 
            }
        },
        {
            id: "sublime",
            name: "Sublime Text",
            category: "IDE",
            skill: false,
            executable: "subl",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/Library/Application Support/Sublime Text/Packages/User/Preferences.sublime-settings",
                    install: "${HOME}/Library/Application Support/Sublime Text/Packages"
                },
                linux: { 
                    config: "${HOME}/.config/sublime-text/Packages/User/Preferences.sublime-settings",
                    install: "${HOME}/.config/sublime-text/Packages"
                },
                windows: { 
                    config: "${APPDATA}/Sublime Text/Packages/User/Preferences.sublime-settings",
                    install: "${APPDATA}/Sublime Text/Packages"
                }
            }
        },
        {
            id: "neovim",
            name: "Neovim",
            category: "IDE",
            skill: false,
            executable: "nvim",
            format: "text",
            platforms: {
                macos: { 
                    config: "${HOME}/.config/nvim/init.lua",
                    install: "${HOME}/.local/share/nvim/site/pack/packer/start"
                },
                linux: { 
                    config: "${HOME}/.config/nvim/init.lua",
                    install: "${HOME}/.local/share/nvim/site/pack/packer/start"
                },
                windows: { 
                    config: "${APPDATA}/nvim/init.lua",
                    install: "${APPDATA}/nvim-data/site/pack/packer/start"
                }
            }
        },
        {
            id: "eclipse",
            name: "Eclipse",
            category: "IDE",
            skill: false,
            executable: "eclipse",
            format: "xml",
            platforms: {
                macos: { 
                    config: "${HOME}/.eclipse",
                    install: "${HOME}/.eclipse/dropins"
                },
                linux: { 
                    config: "${HOME}/.eclipse",
                    install: "${HOME}/.eclipse/dropins"
                },
                windows: { 
                    config: "${USERPROFILE}/.eclipse",
                    install: "${USERPROFILE}/.eclipse/dropins"
                }
            }
        },

        // ==================================================================================
        // AI AGENTS & CLI TOOLS (Standardized to use ~/.agent/skills)
        // ==================================================================================
        {
            id: "opencode",
            name: "OpenCode",
            category: "AI_AGENT",
            skill: true,
            executable: "opencode",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/.opencode/config.json",
                    projectConfig: "${PROJECT_ROOT}/.opencode/config.json",
                    install: "${HOME}/.opencode/skills"
                },
                linux: { 
                    config: "${HOME}/.opencode/config.json", 
                    projectConfig: "${PROJECT_ROOT}/.opencode/config.json",
                    install: "${HOME}/.opencode/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.opencode/config.json",
                    projectConfig: "${PROJECT_ROOT}/.opencode/config.json",
                    install: "${USERPROFILE}/.opencode/skills"
                }
            }
        },
        {
            id: "claude-code",
            name: "Claude Code",
            category: "AI_AGENT",
            skill: true,
            executable: "claude",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/.claude/config.json",
                    install: "${HOME}/.claude/skills"
                },
                linux: { 
                    config: "${HOME}/.claude/config.json",
                    install: "${HOME}/.claude/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.claude/config.json",
                    install: "${USERPROFILE}/.claude/skills"
                }
            }
        },
        {
            id: "gemini-cli",
            name: "Gemini CLI",
            category: "AI_AGENT",
            skill: true,
            executable: "gemini",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/.gemini/config.json",
                    install: "${HOME}/.gemini/skills"
                },
                linux: { 
                    config: "${HOME}/.gemini/config.json",
                    install: "${HOME}/.gemini/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.gemini/config.json",
                    install: "${USERPROFILE}/.gemini/skills"
                }
            }
        },
        {
            id: "codex-cli",
            name: "Codex",
            category: "AI_AGENT",
            skill: true,
            executable: "codex",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/.codex/config.json",
                    install: "${HOME}/.codex/skills"
                },
                linux: { 
                    config: "${HOME}/.codex/config.json",
                    install: "${HOME}/.codex/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.codex/config.json",
                    install: "${USERPROFILE}/.codex/skills"
                }
            }
        },
        {
            id: "amazon-q",
            name: "Amazon Q",
            category: "AI_AGENT",
            skill: true,
            executable: "q",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/.aws/q/settings.json",
                    install: "${HOME}/.aws/q/skills"
                },
                linux: { 
                    config: "${HOME}/.aws/q/settings.json",
                    install: "${HOME}/.aws/q/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.aws/q/settings.json",
                    install: "${USERPROFILE}/.aws/q/skills"
                }
            }
        },
        {
            id: "grok-cli",
            name: "xAI Grok",
            category: "AI_AGENT",
            skill: true,
            executable: "grok",
            format: "toml",
            platforms: {
                macos: { 
                    config: "${HOME}/.grok/config.toml",
                    install: "${HOME}/.grok/skills"
                },
                linux: { 
                    config: "${HOME}/.grok/config.toml",
                    install: "${HOME}/.grok/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.grok/config.toml",
                    install: "${USERPROFILE}/.grok/skills"
                }
            }
        },
        {
            id: "meta-code-llama",
            name: "Meta Code Llama",
            category: "AI_AGENT",
            skill: true,
            executable: "codellama",
            format: "yaml",
            platforms: {
                macos: { 
                    config: "${HOME}/.codellama/config.yaml",
                    install: "${HOME}/.codellama/skills"
                },
                linux: { 
                    config: "${HOME}/.codellama/config.yaml",
                    install: "${HOME}/.codellama/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.codellama/config.yaml",
                    install: "${USERPROFILE}/.codellama/skills"
                }
            }
        },
        {
            id: "qoder",
            name: "Qoder",
            category: "AI_AGENT",
            skill: true,
            executable: "qoder",
            format: "yaml",
            platforms: {
                macos: { 
                    config: "${HOME}/.qoder/qoder.yaml",
                    install: "${HOME}/.qoder/skills"
                },
                linux: { 
                    config: "${HOME}/.qoder/qoder.yaml",
                    install: "${HOME}/.qoder/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.qoder/qoder.yaml",
                    install: "${USERPROFILE}/.qoder/skills"
                }
            }
        },
        {
            id: "codebuddy",
            name: "CodeBuddy",
            category: "AI_AGENT",
            skill: true,
            executable: "codebuddy",
            format: "json",
            platforms: {
                macos: { 
                    config: "${HOME}/.config/codebuddy/config.json",
                    install: "${HOME}/.config/codebuddy/skills"
                },
                linux: { 
                    config: "${HOME}/.config/codebuddy/config.json",
                    install: "${HOME}/.config/codebuddy/skills"
                },
                windows: { 
                    config: "${APPDATA}/CodeBuddy/config.json",
                    install: "${APPDATA}/CodeBuddy/skills"
                }
            }
        },
        {
            id: "antigravity",
            name: "Antigravity",
            category: "AI_AGENT",
            skill: true,
            executable: "antigravity",
            format: "toml",
            platforms: {
                macos: { 
                    config: "${HOME}/.antigravity/config.toml",
                    install: "${HOME}/.antigravity/skills"
                },
                linux: { 
                    config: "${HOME}/.antigravity/config.toml",
                    install: "${HOME}/.antigravity/skills"
                },
                windows: { 
                    config: "${USERPROFILE}/.antigravity/config.toml",
                    install: "${USERPROFILE}/.antigravity/skills"
                }
            }
        }
    ]
};
