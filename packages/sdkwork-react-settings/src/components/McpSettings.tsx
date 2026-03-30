
import { McpConfig } from '../entities'
import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';

import { useTranslation } from '@sdkwork/react-i18n';
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
                     <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
                        <Database size={28} className="text-primary-500" />
                        {t('settings.mcp.title')}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                        {t('settings.mcp.subtitle')}
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
                <div className="lg:col-span-4 space-y-3">
                    {mcpList.length === 0 ? (
                         <div className="app-surface-subtle flex flex-col items-center justify-center rounded-3xl border-dashed py-16 text-[var(--text-muted)]">
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
                                        group relative flex cursor-pointer flex-col rounded-[1.5rem] p-4 transition-all duration-200
                                        ${editingId === mcp.id
                                            ? 'app-surface-strong border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_8%,var(--bg-panel-strong))] shadow-sm'
                                            : 'app-surface-strong hover:border-[var(--border-strong)] hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="app-status-icon rounded-xl p-2" data-tone={mcp.enabled ? 'success' : 'neutral'}>
                                                {isStdio ? <Terminal size={16} /> : <Wifi size={16} />}
                                            </div>
                                            <h3 className={`text-sm font-semibold ${editingId === mcp.id ? 'text-primary-500' : 'text-[var(--text-primary)]'}`}>
                                                {mcp.name}
                                            </h3>
                                        </div>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); updateMcp(mcp.id, { enabled: !mcp.enabled }); }}
                                            className="app-status-pill"
                                            data-tone={mcp.enabled ? 'success' : 'neutral'}
                                        >
                                            {mcp.enabled ? t('common.status.enabled') : t('common.status.disabled')}
                                        </div>
                                    </div>

                                    <div className="pl-[44px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="app-status-pill normal-case tracking-normal" data-tone={isStdio ? 'neutral' : 'primary'}>
                                                {mcp.transport.toUpperCase()}
                                            </span>
                                            {isStdio && mcp.command && (
                                                <span className="app-surface-subtle rounded px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] truncate">
                                                    {mcp.command}
                                                </span>
                                            )}
                                        </div>
                                        <div className="truncate font-mono text-[10px] text-[var(--text-muted)] opacity-60">
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
                        <div className="app-floating-panel sticky top-6 animate-in fade-in slide-in-from-bottom-4 rounded-[1.75rem] p-6 duration-300">
                             <div className="mb-6 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                                        <Edit2 size={16} className="text-primary-500" />
                                        {t('settings.mcp.configuration')}
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
                                 <div className="app-surface-subtle rounded-2xl p-4 text-center">
                                     <p className="text-xs text-[var(--text-muted)]">{t('settings.mcp.env_vars_desc')}</p>
                                 </div>
                             </SettingsSection>
                        </div>
                    ) : (
                        <div className="app-surface-subtle flex h-[400px] flex-col items-center justify-center rounded-3xl border-dashed text-[var(--text-muted)]">
                             <div className="app-surface-strong mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
export { McpSettings };
