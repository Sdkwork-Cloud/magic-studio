
import { LspConfig } from '../entities'
import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';

import { useTranslation } from '@sdkwork/react-i18n';
import { 
    Network, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Code, TerminalSquare, Info
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
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Network size={28} className="text-purple-500" />
                        {t('settings.lsp.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                        {t('settings.lsp.subtitle')}
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
                    {lspList.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl bg-gray-50 dark:bg-[#1e1e1e]/50">
                            <AlertCircle size={32} className="opacity-20 mb-3" />
                            <p>{t('settings.lsp.no_servers')}</p>
                        </div>
                    ) : (
                        lspList.map(lsp => (
                            <div 
                                key={lsp.id}
                                onClick={() => setEditingId(lsp.id)}
                                className={`
                                    group relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200
                                    ${editingId === lsp.id 
                                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/50 shadow-sm' 
                                        : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#52525b] hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${lsp.enabled ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-[#333] text-gray-400'}`}>
                                            <TerminalSquare size={16} />
                                        </div>
                                        <h3 className={`font-semibold text-sm ${editingId === lsp.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                            {lsp.name}
                                        </h3>
                                    </div>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); updateLsp(lsp.id, { enabled: !lsp.enabled }); }}
                                        className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${lsp.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-[#444]'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${lsp.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                
                                <div className="pl-[44px]">
                                    <div className="flex flex-wrap gap-1.5">
                                        {lsp.languages.slice(0, 3).map(lang => (
                                            <span key={lang} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-[#2d2d2d] text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-[#333] font-mono">
                                                {lang}
                                            </span>
                                        ))}
                                        {lsp.languages.length > 3 && (
                                            <span className="text-[10px] px-1.5 py-0.5 text-gray-400">+{lsp.languages.length - 3}</span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-400 font-mono truncate opacity-60">
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
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-2xl p-6 sticky top-6 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl shadow-black/5">
                             <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-[#2d2d2d]">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Edit2 size={16} className="text-blue-500" />
                                        {t('settings.lsp.server_config')}
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

                             <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 text-xs text-blue-700 dark:text-blue-300">
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <p>
                                    {t('settings.lsp.restart_hint')}
                                </p>
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-[#252526] rounded-full flex items-center justify-center mb-4">
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
