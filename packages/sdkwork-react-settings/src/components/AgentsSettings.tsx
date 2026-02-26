import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '@sdkwork/react-i18n';
import {
    Bot, Plus, Trash2, Edit2, AlertCircle, Wrench, Brain, Sparkles, Check
} from 'lucide-react';
import { SettingsSection, SettingInput, SettingSelect, SettingSlider } from './SettingsWidgets';

import { genAIService } from '@sdkwork/react-core';
import { AgentConfig, McpConfig } from '../entities/settings.entity';
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
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Bot size={28} className="text-orange-500" />
                        {t('settings.agents.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                        {t('settings.agents.subtitle')}
                    </p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg shadow-blue-900/20"
                >
                    <Plus size={16} /> {t('common.actions.add')}
                </button>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* List Column */}
                <div className="lg:col-span-4 space-y-4">
                    {agentsList.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl bg-gray-50 dark:bg-[#1e1e1e]/50">
                            <AlertCircle size={32} className="opacity-20 mb-3" />
                            <p>{t('settings.agents.no_agents')}</p>
                        </div>
                    ) : (
                        agentsList.map(agent => (
                            <div 
                                key={agent.id}
                                onClick={() => setEditingId(agent.id)}
                                className={`
                                    group relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all duration-200
                                    ${editingId === agent.id 
                                        ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-500/50 shadow-sm scale-[1.02]' 
                                        : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#52525b] hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${agent.enabled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-200 dark:bg-[#333] text-gray-400'}`}>
                                            <Brain size={20} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-base leading-tight ${editingId === agent.id ? 'text-orange-700 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {agent.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 font-mono">{agent.model}</span>
                                        </div>
                                    </div>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); updateAgent(agent.id, { enabled: !agent.enabled }); }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border transition-all ${agent.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-400 border-gray-200 dark:border-[#444]'}`}
                                    >
                                        {agent.enabled ? t('common.status.enabled') : t('common.status.disabled')}
                                    </div>
                                </div>
                                
                                <div className="pl-0 mt-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3 min-h-[32px]">
                                        {agent.systemPrompt}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-[#2d2d2d]">
                                        <Wrench size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-500">{agent.tools.length} tools enabled</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Editor Column */}
                <div className="lg:col-span-8 relative">
                    {editingId ? (
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-2xl p-8 sticky top-6 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl shadow-black/5">
                             <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-[#2d2d2d]">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Edit2 size={16} className="text-orange-500" />
                                        {t('settings.agents.configuration')}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">ID: <span className="font-mono text-[10px]">{editingId}</span></p>
                                </div>
                                <button 
                                    onClick={() => handleDelete(editingId)} 
                                    className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 text-xs font-medium"
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
                                    <label className="block text-sm font-medium leading-none text-gray-700 dark:text-gray-200 mb-1.5">{t('settings.agents.system_prompt')}</label>
                                    <PromptTextInput
                                        value={settings.agents[editingId].systemPrompt}
                                        onChange={(v) => updateAgent(editingId, { systemPrompt: v })}
                                        rows={8}
                                        placeholder="You are an expert software engineer..."
                                        onEnhance={handleEnhancePrompt}
                                        isEnhancing={isEnhancing}
                                        className="bg-gray-50 dark:bg-[#121214]"
                                        label={null}
                                    />
                                    <div className="mt-1.5 text-xs text-gray-500 leading-relaxed text-balance">Define the agent's personality, constraints, and operational guidelines.</div>
                                </div>

                                <div className="mt-6">
                                    <SettingSlider 
                                        label={t('settings.ai.temperature.label')}
                                        value={settings.agents[editingId].temperature}
                                        min={0} max={1} step={0.1}
                                        onChange={(v) => updateAgent(editingId, { temperature: v })}
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
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500/50 text-blue-700 dark:text-blue-300'
                                                        : 'bg-gray-50 dark:bg-[#252526] border-transparent hover:border-gray-300 dark:hover:border-[#444] text-gray-500 dark:text-gray-400'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Wrench size={12} className={isActive ? 'text-blue-500' : 'opacity-50'} />
                                                    <span className="font-medium">{tool.name}</span>
                                                </div>
                                                {isActive && <Check size={12} className="text-blue-500" />}
                                            </button>
                                         );
                                     })}
                                 </div>
                             </SettingsSection>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl">
                             <div className="w-16 h-16 bg-gray-100 dark:bg-[#252526] rounded-full flex items-center justify-center mb-4">
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