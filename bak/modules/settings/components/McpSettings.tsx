
import React, { useState } from 'react';
import { useSettingsStore } from '../../../store/settingsStore';
import { McpConfig } from '../entities/settings.entity';
import { useTranslation } from '../../../i18n';
import { 
    Database, Plus, Trash2, Edit2, AlertCircle, Terminal, Server, Wifi
} from 'lucide-react';
import { SettingsSection, SettingInput, SettingSelect, SettingTextArea } from './SettingsWidgets';

const McpSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);

    const mcpList = Object.values(settings.mcp || {}) as McpConfig[];

    const updateMcp = (id: string, updates: Partial<McpConfig>) => {
        const newMcp = { ...settings.mcp[id], ...updates };
        const newSettings = {
            ...settings,
            mcp: { ...settings.mcp, [id]: newMcp }
        };
        updateSettings(newSettings);
    };

    const handleCreate = () => {
        const id = `mcp-${Date.now()}`;
        const newMcp: McpConfig = {
            id,
            name: 'New MCP Server',
            enabled: true,
            transport: 'stdio',
            command: '',
            args: []
        };
        const newSettings = {
            ...settings,
            mcp: { ...settings.mcp, [id]: newMcp }
        };
        updateSettings(newSettings);
        setEditingId(id);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('common.actions.delete') + '?')) {
            const nextMcp = { ...settings.mcp };
            delete nextMcp[id];
            updateSettings({ ...settings, mcp: nextMcp });
            if (editingId === id) setEditingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 p-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
                <div>
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Database size={28} className="text-green-500" />
                        {t('settings.mcp.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                        {t('settings.mcp.subtitle')}
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
                <div className="lg:col-span-4 space-y-3">
                    {mcpList.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl bg-gray-50 dark:bg-[#1e1e1e]/50">
                            <AlertCircle size={32} className="opacity-20 mb-3" />
                            <p>{t('settings.mcp.no_tools')}</p>
                        </div>
                    ) : (
                        mcpList.map(mcp => {
                            const isStdio = mcp.transport === 'stdio';
                            
                            return (
                                <div 
                                    key={mcp.id}
                                    onClick={() => setEditingId(mcp.id)}
                                    className={`
                                        group relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200
                                        ${editingId === mcp.id 
                                            ? 'bg-green-50/50 dark:bg-green-900/10 border-green-500/50 shadow-sm' 
                                            : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#52525b] hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${mcp.enabled ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-[#333] text-gray-400'}`}>
                                                {isStdio ? <Terminal size={16} /> : <Wifi size={16} />}
                                            </div>
                                            <h3 className={`font-semibold text-sm ${editingId === mcp.id ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                                {mcp.name}
                                            </h3>
                                        </div>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); updateMcp(mcp.id, { enabled: !mcp.enabled }); }}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border transition-all ${mcp.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-400 border-gray-200 dark:border-[#444]'}`}
                                        >
                                            {mcp.enabled ? t('common.status.enabled') : t('common.status.disabled')}
                                        </div>
                                    </div>
                                    
                                    <div className="pl-[44px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${isStdio ? 'bg-gray-100 dark:bg-[#2d2d2d] border-gray-200 dark:border-[#444] text-gray-500' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'}`}>
                                                {mcp.transport.toUpperCase()}
                                            </span>
                                            {isStdio && mcp.command && (
                                                <span className="text-[10px] text-gray-400 font-mono truncate bg-gray-50 dark:bg-[#252526] px-1.5 py-0.5 rounded">
                                                    {mcp.command}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono truncate opacity-60">
                                            {isStdio ? (mcp.args?.join(' ') || 'No args') : mcp.url}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Editor Column */}
                <div className="lg:col-span-8 relative">
                    {editingId ? (
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-2xl p-6 sticky top-6 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl shadow-black/5">
                             <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-[#2d2d2d]">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Edit2 size={16} className="text-green-500" />
                                        {t('settings.mcp.configuration')}
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
                                    value={settings.mcp[editingId].name}
                                    onChange={(v) => updateMcp(editingId, { name: v })}
                                    fullWidth
                                 />
                                 <SettingSelect 
                                    label={t('settings.mcp.transport')}
                                    value={settings.mcp[editingId].transport}
                                    onChange={(v) => updateMcp(editingId, { transport: v as any })}
                                    options={[
                                        { label: 'Standard Input/Output (stdio)', value: 'stdio' },
                                        { label: 'Server-Sent Events (SSE)', value: 'sse' },
                                    ]}
                                    fullWidth
                                 />
                             </SettingsSection>

                             {settings.mcp[editingId].transport === 'stdio' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <SettingsSection title={t('settings.mcp.execution')}>
                                        <SettingInput 
                                            label={t('common.form.command')}
                                            placeholder="e.g. npx, python3, uv"
                                            value={settings.mcp[editingId].command || ''}
                                            onChange={(v) => updateMcp(editingId, { command: v })}
                                            description="The executable to run. Must be in your system PATH."
                                            fullWidth
                                            fontMono
                                        />
                                        <SettingTextArea
                                            label={t('common.form.args')}
                                            description="Arguments passed to the command (one per line)"
                                            value={(settings.mcp[editingId].args || []).join('\n')}
                                            onChange={(val) => updateMcp(editingId, { args: val.split('\n') })}
                                            rows={4}
                                            fontMono
                                            placeholder="-y&#10;@modelcontextprotocol/server-filesystem"
                                        />
                                    </SettingsSection>
                                </div>
                             )}

                            {settings.mcp[editingId].transport === 'sse' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <SettingsSection title={t('settings.mcp.connection')}>
                                        <SettingInput 
                                            label={t('settings.mcp.url')}
                                            placeholder="http://localhost:8000/sse"
                                            value={settings.mcp[editingId].url || ''}
                                            onChange={(v) => updateMcp(editingId, { url: v })}
                                            description="The endpoint URL for the SSE stream."
                                            fullWidth
                                            fontMono
                                        />
                                    </SettingsSection>
                                </div>
                             )}

                             {/* Environment Variables (Visual placeholder for now) */}
                             <SettingsSection title={t('settings.mcp.env_vars')}>
                                 <div className="bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg p-4 text-center">
                                     <p className="text-xs text-gray-500">{t('settings.mcp.env_vars_desc')}</p>
                                 </div>
                             </SettingsSection>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl">
                             <div className="w-16 h-16 bg-gray-100 dark:bg-[#252526] rounded-full flex items-center justify-center mb-4">
                                <Server size={24} className="opacity-40" />
                            </div>
                            <span className="text-sm font-medium">{t('settings.mcp.select_tool')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default McpSettings;
