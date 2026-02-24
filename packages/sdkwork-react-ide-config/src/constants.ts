import { IdeConfigSchema } from './types';

export const IDE_AND_TOOLS_CONFIG: IdeConfigSchema = {
    schemaVersion: "2.4.0",
    definitions: [
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
        }
    ]
};
