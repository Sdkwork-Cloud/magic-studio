
import { LspConfig } from '../entities'
import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';

import { useTranslation } from '@sdkwork/react-i18n';
import {
    Network, Plus, Trash2, Edit2, AlertCircle, TerminalSquare, Info
} from 'lucide-react';
import { SettingsSection, SettingToggle, SettingInput, SettingTextArea } from './SettingsWidgets';

const LspSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);

    const lspList = Object.values(settings.lsp || {}) as LspConfig[];

    const updateLsp = (id: string, updates: Partial<LspConfig>) => {
        const newLsp = { ...settings.lsp[id], ...updates };
        const newSettings = {
            ...settings,
            lsp: { ...settings.lsp, [id]: newLsp }
        };
        updateSettings(newSettings);
    };

    const handleCreate = () => {
        const id = `lsp-${Date.now()}`;
        const newLsp: LspConfig = {
            id,
            name: 'New Language Server',
            enabled: true,
            command: 'executable-name',
            args: [],
            languages: ['plaintext']
        };
        const newSettings = {
            ...settings,
            lsp: { ...settings.lsp, [id]: newLsp }
        };
        updateSettings(newSettings);
        setEditingId(id);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('common.actions.delete') + '?')) {
            const nextLsp = { ...settings.lsp };
            delete nextLsp[id];
            updateSettings({ ...settings, lsp: nextLsp });
            if (editingId === id) setEditingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 p-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
                <div>
                     <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
                        <Network size={28} className="text-primary-500" />
                        {t('settings.lsp.title')}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                        {t('settings.lsp.subtitle')}
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
                    {lspList.length === 0 ? (
                         <div className="app-surface-subtle flex flex-col items-center justify-center rounded-3xl border-dashed py-16 text-[var(--text-muted)]">
                            <AlertCircle size={32} className="opacity-20 mb-3" />
                            <p>{t('settings.lsp.no_servers')}</p>
                        </div>
                    ) : (
                        lspList.map(lsp => (
                            <div
                                key={lsp.id}
                                onClick={() => setEditingId(lsp.id)}
                                className={`
                                    group relative flex cursor-pointer flex-col rounded-[1.5rem] p-4 transition-all duration-200
                                    ${editingId === lsp.id
                                        ? 'app-surface-strong border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_8%,var(--bg-panel-strong))] shadow-sm'
                                        : 'app-surface-strong hover:border-[var(--border-strong)] hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="app-status-icon rounded-xl p-2" data-tone={lsp.enabled ? 'success' : 'neutral'}>
                                            <TerminalSquare size={16} />
                                        </div>
                                        <h3 className={`text-sm font-semibold ${editingId === lsp.id ? 'text-primary-500' : 'text-[var(--text-primary)]'}`}>
                                            {lsp.name}
                                        </h3>
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); updateLsp(lsp.id, { enabled: !lsp.enabled }); }}
                                        className="app-status-pill cursor-pointer"
                                        data-tone={lsp.enabled ? 'success' : 'neutral'}
                                    >
                                        {lsp.enabled ? t('common.status.enabled') : t('common.status.disabled')}
                                    </div>
                                </div>

                                <div className="pl-[44px]">
                                    <div className="flex flex-wrap gap-1.5">
                                        {lsp.languages.slice(0, 3).map(lang => (
                                            <span key={lang} className="app-surface-subtle rounded-md border px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                                                {lang}
                                            </span>
                                        ))}
                                        {lsp.languages.length > 3 && (
                                            <span className="px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">+{lsp.languages.length - 3}</span>
                                        )}
                                    </div>
                                    <div className="mt-2 truncate font-mono text-[10px] text-[var(--text-muted)] opacity-60">
                                        $ {lsp.command} {lsp.args.join(' ')}
                                    </div>
                                </div>
                            </div>
                        ))
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
                                        {t('settings.lsp.server_config')}
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
                                    value={settings.lsp[editingId].name}
                                    onChange={(v) => updateLsp(editingId, { name: v })}
                                    fullWidth
                                 />
                                 <SettingInput
                                    label={t('common.form.command')}
                                    description="Command to start the language server (must be in PATH)"
                                    value={settings.lsp[editingId].command}
                                    onChange={(v) => updateLsp(editingId, { command: v })}
                                    fullWidth
                                    fontMono
                                 />
                                  <SettingInput
                                    label={t('settings.lsp.languages')}
                                    description="File extensions or language IDs (comma separated)"
                                    value={settings.lsp[editingId].languages.join(', ')}
                                    onChange={(v) => updateLsp(editingId, { languages: v.split(',').map(s => s.trim()).filter(Boolean) })}
                                    fullWidth
                                    fontMono
                                 />
                             </SettingsSection>

                             <SettingsSection title={t('common.form.optional')}>
                                <SettingTextArea
                                    label={t('common.form.args')}
                                    description="Additional arguments passed to the command (one per line)"
                                    value={settings.lsp[editingId].args.join('\n')}
                                    onChange={(val) => updateLsp(editingId, { args: val.split('\n') })}
                                    rows={5}
                                    fontMono
                                    placeholder="--stdio"
                                />
                             </SettingsSection>

                             <div className="app-banner text-xs" data-tone="info">
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <p>
                                    {t('settings.lsp.restart_hint')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="app-surface-subtle flex h-[400px] flex-col items-center justify-center rounded-3xl border-dashed text-[var(--text-muted)]">
                            <div className="app-surface-strong mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <Edit2 size={24} className="opacity-40" />
                            </div>
                            <span className="text-sm font-medium">{t('settings.lsp.select_server')}</span>
                            <p className="text-xs opacity-50 mt-1">{t('settings.lsp.create_new')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LspSettings;
export { LspSettings };
