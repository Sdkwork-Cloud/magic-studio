
import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '../../../store/settingsStore';
import { LlmProviderConfig } from '../entities/settings.entity';
import { useTranslation } from '../../../i18n';
import { 
    Cpu, Plus, Trash2, Zap, Server, AlertCircle, CheckCircle2, 
    Link2, Key, List, Code2, Globe, Box, Terminal,
    RefreshCw, Search, Cloud, Smartphone
} from 'lucide-react';
import { SettingsSection, SettingInput, SettingSelect, SettingToggle, SettingTextArea } from './SettingsWidgets';

const LlmSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>('openai');
    const [searchTerm, setSearchTerm] = useState('');

    const providers = Object.values(settings.llm || {}) as LlmProviderConfig[];

    // --- Helper: Get Display Name ---
    const getDisplayName = (provider: LlmProviderConfig) => {
        // 1. If it's a custom user-created provider (id starts with 'custom-'), use its raw name
        if (provider.id.startsWith('custom-')) return provider.name;

        // 2. Try to fetch translated name for built-in providers
        // Using the ID as the key (e.g., 'openai', 'anthropic')
        const translationKey = `settings.llm.provider_names.${provider.id}`;
        const translated = t(translationKey);
        
        // 3. Fallback: If translation matches key (missing), use provider.name from config
        return translated !== translationKey ? translated : provider.name;
    };

    // --- Filtering and Sorting ---
    const filteredProviders = useMemo(() => {
        let list = [...providers];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(p => 
                getDisplayName(p).toLowerCase().includes(lower) || 
                p.name.toLowerCase().includes(lower) || 
                p.providerType.toLowerCase().includes(lower)
            );
        }

        // Define Priority Order for Main Providers
        const PRIORITY_ORDER = [
            'openai', 'anthropic', 'google', 'deepseek', 
            'ollama', 'mistral', 'groq', 'perplexity', 'openrouter',
            // Chinese Models Group
            'alibaba', 'baidu', 'moonshot', 'zhipu', 'doubao', 'yi', 'minimax'
        ];

        return list.sort((a, b) => {
            // Rule 1: OpenAI Compatible / Custom always LAST
            const aIsCustom = a.providerType === 'openai-compatible' || a.id.startsWith('custom');
            const bIsCustom = b.providerType === 'openai-compatible' || b.id.startsWith('custom');
            
            if (aIsCustom && !bIsCustom) return 1;
            if (!aIsCustom && bIsCustom) return -1;

            // Rule 2: Priority List
            const aIdx = PRIORITY_ORDER.indexOf(a.id);
            const bIdx = PRIORITY_ORDER.indexOf(b.id);
            
            // If both are in the priority list, sort by their index
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            
            // If only one is in the priority list, it comes first
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;

            // Rule 3: Enabled first (Active providers float to top among peers)
            if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;

            // Rule 4: Alphabetical by Display Name
            return getDisplayName(a).localeCompare(getDisplayName(b));
        });
    }, [providers, searchTerm, t]);

    const updateProvider = (id: string, updates: Partial<LlmProviderConfig>) => {
        const newProvider = { ...settings.llm[id], ...updates };
        const newSettings = {
            ...settings,
            llm: { ...settings.llm, [id]: newProvider }
        };
        updateSettings(newSettings);
    };

    const handleCreate = () => {
        const id = `custom-${Date.now()}`;
        const newProvider: LlmProviderConfig = {
            id,
            name: 'New Custom Provider',
            providerType: 'openai-compatible',
            enabled: true,
            baseUrl: 'https://api.example.com/v1',
            apiKey: '',
            models: ['my-model'],
            defaultModel: 'my-model'
        };
        const newSettings = {
            ...settings,
            llm: { ...settings.llm, [id]: newProvider }
        };
        updateSettings(newSettings);
        setSelectedProviderId(id);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('common.actions.delete') + '?')) {
            const nextLlm = { ...settings.llm };
            delete nextLlm[id];
            updateSettings({ ...settings, llm: nextLlm });
            if (selectedProviderId === id) setSelectedProviderId(null);
        }
    };

    const getProviderIcon = (type: string) => {
        switch (type) {
            case 'openai': return <OpenAIIcon size={18} />;
            case 'anthropic': return <AnthropicIcon size={18} />;
            case 'google': return <GoogleIcon size={18} />;
            case 'mistral': return <MistralIcon size={18} />;
            case 'groq': return <Zap size={18} className="text-orange-500" />;
            case 'perplexity': return <Globe size={18} className="text-teal-400" />;
            case 'ollama': return <Terminal size={18} className="text-white" />;
            case 'deepseek': return <Code2 size={18} className="text-blue-500" />;
            case 'moonshot': return <div className="text-[10px] font-bold bg-black text-white px-1 rounded">K</div>; // Kimi
            case 'zhipu': return <div className="text-[10px] font-bold bg-blue-600 text-white px-1 rounded">GLM</div>;
            case 'alibaba': return <div className="text-[10px] font-bold bg-[#ff6a00] text-white px-1 rounded">Q</div>;
            case 'doubao': return <div className="text-[10px] font-bold bg-blue-400 text-white px-1 rounded">D</div>;
            case 'yi': return <div className="text-[10px] font-bold bg-green-600 text-white px-1 rounded">01</div>;
            case 'openrouter': return <Zap size={18} className="text-purple-500" />;
            case 'openai-compatible': return <Server size={18} className="text-gray-400" />;
            default: return <Server size={18} className="text-gray-400" />;
        }
    };

    const selectedProvider = selectedProviderId ? settings.llm[selectedProviderId] : null;

    return (
        <div className="flex h-full min-h-[500px]">
             {/* Left Sidebar: Provider List */}
             <div className="w-64 border-r border-gray-200 dark:border-[#333] pr-0 py-2 flex flex-col gap-1 bg-gray-50/50 dark:bg-[#1e1e1e]/50">
                <div className="px-3 mb-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {t('settings.llm.providers')}
                        </div>
                        <button 
                            onClick={handleCreate}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                            title={t('common.actions.add')}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-md pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            placeholder={t('common.actions.search')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar px-2">
                    {filteredProviders.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => setSelectedProviderId(provider.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-md text-left group border border-transparent
                                ${selectedProviderId === provider.id 
                                    ? 'bg-blue-50 dark:bg-[#094771] text-blue-700 dark:text-white font-medium shadow-sm border-blue-200 dark:border-blue-900' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-gray-900 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <span className="flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-[#252526] rounded-md shadow-sm border border-gray-100 dark:border-[#333]">
                                {getProviderIcon(provider.providerType)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="truncate">{getDisplayName(provider)}</div>
                                <div className="text-[10px] text-gray-400 truncate opacity-70">{provider.defaultModel}</div>
                            </div>
                            
                            {provider.enabled ? (
                                <div className={`w-1.5 h-1.5 rounded-full ${provider.apiKey || provider.providerType === 'ollama' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Content: Configuration */}
            <div className="flex-1 pl-8 pr-8 py-4 overflow-y-auto w-full">
                {selectedProvider ? (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-200 w-full max-w-4xl mx-auto">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-[#333]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-[#252526] rounded-xl border border-gray-200 dark:border-[#333] shadow-sm">
                                    {getProviderIcon(selectedProvider.providerType)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        {/* Allow editing name ONLY if it's a custom provider (openai-compatible type) */}
                                        {selectedProvider.providerType === 'openai-compatible' || selectedProvider.providerType === 'custom' ? (
                                            <input 
                                                type="text" 
                                                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none w-auto"
                                                value={selectedProvider.name}
                                                onChange={(e) => updateProvider(selectedProvider.id, { name: e.target.value })}
                                            />
                                        ) : (
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{getDisplayName(selectedProvider)}</h2>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-[#252526] px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#333]">
                                            {selectedProvider.providerType}
                                        </span>
                                        {selectedProvider.enabled && (
                                            <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                                                <CheckCircle2 size={12} /> {t('common.status.enabled')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <SettingToggle 
                                    checked={selectedProvider.enabled} 
                                    onChange={(v) => updateProvider(selectedProvider.id, { enabled: v })}
                                />
                                {(selectedProvider.providerType === 'openai-compatible' || selectedProvider.providerType === 'custom') && (
                                     <button 
                                        onClick={() => handleDelete(selectedProvider.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className={!selectedProvider.enabled ? 'opacity-50 pointer-events-none grayscale transition-opacity' : ''}>
                            
                            {/* Connection Section */}
                            <SettingsSection title={t('settings.llm.connection')}>
                                {selectedProvider.providerType !== 'ollama' && (
                                    <SettingInput 
                                        label={t('settings.llm.api_key')}
                                        type="password"
                                        placeholder="sk-..."
                                        value={selectedProvider.apiKey || ''}
                                        onChange={(v) => updateProvider(selectedProvider.id, { apiKey: v })}
                                        fullWidth
                                        fontMono
                                        description="Stored locally and encrypted."
                                    />
                                )}
                                
                                <SettingInput 
                                    label={t('settings.llm.base_url')}
                                    placeholder="https://api.openai.com/v1"
                                    value={selectedProvider.baseUrl || ''}
                                    onChange={(v) => updateProvider(selectedProvider.id, { baseUrl: v })}
                                    fullWidth
                                    fontMono
                                    description={selectedProvider.providerType === 'openai' ? 'Optional: Override for proxies.' : 'Required for custom providers.'}
                                />
                            </SettingsSection>

                            {/* Models Section */}
                            <SettingsSection title={t('settings.llm.models')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <SettingSelect 
                                        label={t('settings.llm.default_model')}
                                        value={selectedProvider.defaultModel}
                                        onChange={(v) => updateProvider(selectedProvider.id, { defaultModel: v })}
                                        options={selectedProvider.models.map(m => ({ label: m, value: m }))}
                                        fullWidth
                                     />
                                     <div className="flex items-end">
                                         <button className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 mb-3 px-2 transition-colors">
                                             <RefreshCw size={12} /> Fetch Models
                                         </button>
                                     </div>
                                </div>

                                <SettingTextArea 
                                    label={t('settings.llm.available_models')}
                                    description="Comma-separated list of model IDs enabled for this provider."
                                    value={selectedProvider.models.join(', ')}
                                    onChange={(v) => updateProvider(selectedProvider.id, { models: v.split(',').map(s => s.trim()).filter(Boolean) })}
                                    rows={3}
                                    fontMono
                                />
                            </SettingsSection>

                            {/* Advanced Section (Headers) */}
                            <SettingsSection title="Advanced">
                                <div className="bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg p-4">
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Custom Headers</h4>
                                    <p className="text-xs text-gray-400 mb-3">JSON format. Useful for proxies or specialized authentication.</p>
                                    <SettingTextArea 
                                        value={JSON.stringify(selectedProvider.headers || {}, null, 2)}
                                        onChange={(v) => {
                                            try {
                                                const parsed = JSON.parse(v);
                                                updateProvider(selectedProvider.id, { headers: parsed });
                                            } catch (e) {
                                                // Allow editing invalid JSON until valid
                                            }
                                        }}
                                        rows={3}
                                        fontMono
                                        placeholder={'{\n  "X-Custom-Auth": "value"\n}'}
                                    />
                                </div>
                            </SettingsSection>

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Server size={48} className="opacity-20 mb-4" />
                        <p>{t('settings.llm.select_provider')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Custom Icons ---
const OpenAIIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.0462 6.0462 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.4848 4.4848 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.3829l2.0199-1.1685a.0758.0758 0 0 1 .0758 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4163-.6673z"/>
    </svg>
);

const AnthropicIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#d97757]">
        <path d="M17.43 19.07H22L12 1 2 19.07h4.57l2.2-4.22h6.45l2.21 4.22zM12 5.86l2.45 4.53h-4.9L12 5.86z"/>
    </svg>
);

const GoogleIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#4285F4]">
        <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.25 5 12c0-3.26 3.36-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
    </svg>
);

const MistralIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#FBB03B]">
        <path d="M4 18V6l4 4 4-4 4 4 4-4v12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default LlmSettings;
