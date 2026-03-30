import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '@sdkwork/react-i18n';
import {
    Bot, Plus, Trash2, Edit2, AlertCircle, Wrench, Brain, Sparkles, Check
} from 'lucide-react';
import { SettingsSection, SettingInput, SettingSelect, SettingSlider } from './SettingsWidgets';

import { genAIService } from '@sdkwork/react-core';
import { AgentConfig, McpConfig } from '../entities';
import { generateUUID } from '@sdkwork/react-commons';

// PromptTextInput will be implemented locally or moved to commons
const PromptTextInput: React.FC<any> = (props) => <input {...props} />;

const AgentsSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const agentsList = Object.values(settings.agents || {}) as AgentConfig[];

    // Tools Aggregation
    const availableTools = [
        ...(Object.values(settings.mcp || {}) as McpConfig[]).map(m => ({ id: m.id, type: 'MCP', name: m.name })),
        ...Object.keys(settings.skills || {}).map(s => ({ id: s, type: 'SKILL', name: s })),
        { id: 'web-search', type: 'BUILTIN', name: 'Web Search' },
        { id: 'code-interpreter', type: 'BUILTIN', name: 'Code Interpreter' }
    ];

    const updateAgent = (id: string, updates: Partial<AgentConfig>) => {
        const newAgent = { ...settings.agents[id], ...updates };
        const newSettings = {
            ...settings,
            agents: { ...settings.agents, [id]: newAgent }
        };
        updateSettings(newSettings);
    };

    const handleCreate = () => {
        const id = generateUUID();
        const newAgent: AgentConfig = {
            id,
            name: 'New Agent',
            enabled: true,
            model: 'gpt-4o',
            systemPrompt: 'You are a helpful assistant.',
            temperature: 0.7,
            tools: []
        };
        const newSettings = {
            ...settings,
            agents: { ...settings.agents, [id]: newAgent }
        };
        updateSettings(newSettings);
        setEditingId(id);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('common.actions.delete') + '?')) {
            const nextAgents = { ...settings.agents };
            delete nextAgents[id];
            updateSettings({ ...settings, agents: nextAgents });
            if (editingId === id) setEditingId(null);
        }
    };

    const toggleTool = (agentId: string, toolId: string) => {
        const agent = settings.agents[agentId];
        const newTools = agent.tools.includes(toolId)
            ? agent.tools.filter(t => t !== toolId)
            : [...agent.tools, toolId];
        updateAgent(agentId, { tools: newTools });
    };

    const handleEnhancePrompt = async (currentText: string): Promise<string> => {
        if (!currentText) return "";

        setIsEnhancing(true);
        try {
            // Specific prompt for enhancing system instructions
            const response = await genAIService.enhancePrompt(`Optimize this system instruction for an AI Agent to be more effective and robust: "${currentText}"`);
            if (editingId) {
                updateAgent(editingId, { systemPrompt: response });
            }
            return response;
        } catch (e) {
            console.error("Enhancement failed", e);
            return currentText;
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 p-6">
            {/* Toolbar */}
             <div className="flex items-center justify-between mb-8">
                <div>
                     <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
                        <Bot size={28} className="text-primary-500" />
                        {t('settings.agents.title')}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                        {t('settings.agents.subtitle')}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-panel-strong)] shadow-md transition-all hover:bg-primary-600 hover:text-white hover:shadow-lg"
                >
                    <Plus size={16} /> {t('common.actions.add')}
                </button>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* List Column */}
                <div className="lg:col-span-4 space-y-4">
                    {agentsList.length === 0 ? (
                         <div className="app-surface-subtle flex flex-col items-center justify-center rounded-3xl border-dashed py-16 text-[var(--text-muted)]">
                            <AlertCircle size={32} className="opacity-20 mb-3" />
                            <p>{t('settings.agents.no_agents')}</p>
                        </div>
                    ) : (
                        agentsList.map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => setEditingId(agent.id)}
                                    className={`
                                    group relative flex cursor-pointer flex-col rounded-[1.5rem] p-5 transition-all duration-200
                                    ${editingId === agent.id
                                        ? 'app-surface-strong scale-[1.02] border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_8%,var(--bg-panel-strong))] shadow-sm'
                                        : 'app-surface-strong hover:border-[var(--border-strong)] hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-xl p-2 ${agent.enabled ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'app-surface-subtle text-[var(--text-muted)]'}`}>
                                            <Brain size={20} />
                                        </div>
                                        <div>
                                            <h3 className={`text-base font-bold leading-tight ${editingId === agent.id ? 'text-primary-500' : 'text-[var(--text-primary)]'}`}>
                                                {agent.name}
                                            </h3>
                                            <span className="font-mono text-[10px] text-[var(--text-muted)]">{agent.model}</span>
                                        </div>
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); updateAgent(agent.id, { enabled: !agent.enabled }); }}
                                        className="app-status-pill"
                                        data-tone={agent.enabled ? 'success' : 'neutral'}
                                    >
                                        {agent.enabled ? t('common.status.enabled') : t('common.status.disabled')}
                                    </div>
                                </div>

                                <div className="pl-0 mt-2">
                                    <p className="mb-3 min-h-[32px] line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                                        {agent.systemPrompt}
                                    </p>

                                    <div className="flex items-center gap-2 border-t border-[var(--border-color)] pt-3">
                                        <Wrench size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-xs text-[var(--text-muted)]">{agent.tools.length} tools enabled</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Editor Column */}
                <div className="lg:col-span-8 relative">
                    {editingId ? (
                        <div className="app-floating-panel sticky top-6 animate-in fade-in slide-in-from-bottom-4 rounded-[1.75rem] p-8 duration-300">
                             <div className="mb-8 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                                        <Edit2 size={16} className="text-primary-500" />
                                        {t('settings.agents.configuration')}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">ID: <span className="font-mono text-[10px]">{editingId}</span></p>
                                </div>
                                <button
                                    onClick={() => handleDelete(editingId)}
                                    className="app-button-danger flex items-center gap-2 rounded-xl p-2 text-xs font-medium"
                                >
                                    <Trash2 size={14} /> {t('common.actions.delete')}
                                </button>
                             </div>

                             <SettingsSection title={t('common.form.required')}>
                                 <SettingInput
                                    label={t('common.form.name')}
                                    value={settings.agents[editingId].name}
                                    onChange={(v) => updateAgent(editingId, { name: v })}
                                    fullWidth
                                 />
                                 <SettingSelect
                                    label={t('settings.ai.defaultModel.label')}
                                    value={settings.agents[editingId].model}
                                    onChange={(v) => updateAgent(editingId, { model: v })}
                                    options={[
                                        { label: 'GPT-4o', value: 'gpt-4o' },
                                        { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
                                        { label: 'Gemini 3 Flash', value: 'gemini-3-flash-preview' },
                                        { label: 'Gemini 3 Pro', value: 'gemini-3-pro-preview' },
                                    ]}
                                    fullWidth
                                 />
                             </SettingsSection>

                             <SettingsSection title={t('settings.sections.parameters')}>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium leading-none text-[var(--text-secondary)]">{t('settings.agents.system_prompt')}</label>
                                    <PromptTextInput
                                        value={settings.agents[editingId].systemPrompt}
                                        onChange={(v: string) => updateAgent(editingId, { systemPrompt: v })}
                                        rows={8}
                                        placeholder="You are an expert software engineer..."
                                        onEnhance={handleEnhancePrompt}
                                        isEnhancing={isEnhancing}
                                        className="app-surface-subtle min-h-[11rem] w-full rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-primary-500"
                                        label={null}
                                    />
                                    <div className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)] text-balance">Define the agent's personality, constraints, and operational guidelines.</div>
                                </div>

                                <div className="mt-6">
                                    <SettingSlider
                                        label={t('settings.ai.temperature.label')}
                                        value={settings.agents[editingId].temperature}
                                        min={0} max={1} step={0.1}
                                        onChange={(v: number) => updateAgent(editingId, { temperature: v })}
                                    />
                                </div>
                             </SettingsSection>

                             <SettingsSection title={t('settings.agents.tools_access')}>
                                 <div className="grid grid-cols-2 gap-2">
                                     {availableTools.map(tool => {
                                         const isActive = settings.agents[editingId].tools.includes(tool.id);
                                         return (
                                            <button
                                                key={tool.id}
                                                onClick={() => toggleTool(editingId, tool.id)}
                                                className={`
                                                    flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs text-left transition-all
                                                    ${isActive
                                                        ? 'border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_10%,var(--bg-panel-strong))] text-primary-500'
                                                        : 'border-transparent bg-[color-mix(in_srgb,var(--text-primary)_3%,transparent)] text-[var(--text-muted)] hover:border-[var(--border-color)] hover:text-[var(--text-secondary)]'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Wrench size={12} className={isActive ? 'text-primary-500' : 'opacity-50'} />
                                                    <span className="font-medium">{tool.name}</span>
                                                </div>
                                                {isActive && <Check size={12} className="text-primary-500" />}
                                            </button>
                                         );
                                     })}
                                 </div>
                             </SettingsSection>
                        </div>
                    ) : (
                        <div className="app-surface-subtle flex h-[400px] flex-col items-center justify-center rounded-3xl border-dashed text-[var(--text-muted)]">
                             <div className="app-surface-strong mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <Sparkles size={24} className="opacity-40" />
                            </div>
                            <span className="text-sm font-medium">{t('settings.agents.select_agent')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentsSettings;
export { AgentsSettings };
