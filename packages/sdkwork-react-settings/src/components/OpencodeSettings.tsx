
import { OpencodeConfig } from '../entities/settings.entity'
import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from 'sdkwork-react-i18n';
import { Terminal } from 'lucide-react';
import { SettingsSection, SettingInput, SettingSelect, SettingToggle, SettingTextArea, SettingSlider } from './SettingsWidgets';


const OpencodeSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();

    const config = settings.opencode;

    const updateConfig = (updates: Partial<OpencodeConfig>) => {
        updateSettings({
            ...settings,
            opencode: { ...config, ...updates }
        });
    };

    // Helper for nested updates
    const updateTui = (updates: Partial<NonNullable<OpencodeConfig['tui']>>) => {
        updateConfig({ tui: { ...(config.tui || { scrollSpeed: 3, scrollAcceleration: true, diffStyle: 'auto' }), ...updates } });
    };

    const updateServer = (updates: Partial<NonNullable<OpencodeConfig['server']>>) => {
        updateConfig({ server: { ...(config.server || { port: 4096, hostname: '0.0.0.0', mdns: true, cors: [] }), ...updates } });
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-[#333]">
                <div>
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Terminal size={28} className="text-blue-500" />
                        {t('settings.opencode.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                        {t('settings.opencode.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <SettingToggle 
                        checked={config.enabled} 
                        onChange={(v) => updateConfig({ enabled: v })}
                        label=""
                    />
                </div>
            </div>

            <div className={!config.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}>
                
                {/* 1. Core Model Config */}
                <SettingsSection title={t('settings.opencode.sections.model')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SettingSelect 
                            label={t('settings.opencode.model.label')}
                            description={t('settings.opencode.model.desc')}
                            value={config.model}
                            onChange={(v) => updateConfig({ model: v })}
                            options={[
                                { label: 'GPT-4o', value: 'gpt-4o' },
                                { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
                                { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' }
                            ]}
                            fullWidth
                        />
                        <SettingInput 
                            label={t('settings.opencode.base_url.label')}
                            description={t('settings.opencode.base_url.desc')}
                            value={config.baseUrl || ''}
                            onChange={(v) => updateConfig({ baseUrl: v })}
                            placeholder="https://api.openai.com/v1"
                            fullWidth
                            fontMono
                        />
                    </div>
                    
                    <SettingInput 
                        label={t('settings.opencode.api_key.label')}
                        description={t('settings.opencode.api_key.desc')}
                        value={config.apiKey || ''}
                        onChange={(v) => updateConfig({ apiKey: v })}
                        type="password"
                        fullWidth
                        fontMono
                    />
                </SettingsSection>

                {/* 2. Agent Behavior */}
                <SettingsSection title={t('settings.opencode.sections.agent')}>
                    <SettingTextArea 
                        label={t('settings.opencode.system_prompt.label')}
                        value={config.systemPrompt}
                        onChange={(v) => updateConfig({ systemPrompt: v })}
                        rows={4}
                        fullWidth
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <SettingSlider 
                            label={t('settings.opencode.temperature.label')}
                            value={config.temperature}
                            min={0} max={1} step={0.1}
                            onChange={(v) => updateConfig({ temperature: v })}
                        />
                        <SettingInput 
                            label={t('settings.opencode.max_tokens.label')}
                            value={(config.maxTokens || 4096).toString()}
                            onChange={(v) => updateConfig({ maxTokens: parseInt(v) })}
                            type="number"
                            fullWidth
                        />
                    </div>
                    
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl">
                        <SettingToggle 
                            label={t('settings.opencode.confirm_unsafe.label')}
                            description={t('settings.opencode.confirm_unsafe.desc')}
                            checked={config.confirmUnsafe}
                            onChange={(v) => updateConfig({ confirmUnsafe: v })}
                        />
                    </div>
                </SettingsSection>

                {/* 3. TUI / Interface */}
                <SettingsSection title={t('settings.opencode.tui.title')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SettingSlider 
                            label={t('settings.opencode.tui.scroll_speed')}
                            value={config.tui?.scrollSpeed ?? 3}
                            min={1} max={10} step={1}
                            onChange={(v) => updateTui({ scrollSpeed: v })}
                        />
                         <SettingSelect 
                            label={t('settings.opencode.tui.diff_style')}
                            value={config.tui?.diffStyle ?? 'auto'}
                            onChange={(v) => updateTui({ diffStyle: v as any })}
                            options={[
                                { label: 'Auto (Responsive)', value: 'auto' },
                                { label: 'Stacked (Single Column)', value: 'stacked' },
                            ]}
                            fullWidth
                        />
                    </div>
                    <div className="mt-4">
                        <SettingToggle 
                            label={t('settings.opencode.tui.scroll_acceleration.label')}
                            description={t('settings.opencode.tui.scroll_acceleration.desc')}
                            checked={config.tui?.scrollAcceleration ?? true}
                            onChange={(v) => updateTui({ scrollAcceleration: v })}
                        />
                    </div>
                </SettingsSection>

                {/* 4. Server & Network */}
                <SettingsSection title={t('settings.opencode.server.title')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SettingInput 
                            label={t('settings.opencode.server.hostname')}
                            value={config.server?.hostname ?? '0.0.0.0'}
                            onChange={(v) => updateServer({ hostname: v })}
                            fontMono
                            fullWidth
                        />
                        <SettingInput 
                            label={t('settings.opencode.server.port')}
                            type="number"
                            value={(config.server?.port ?? 4096).toString()}
                            onChange={(v) => updateServer({ port: parseInt(v) })}
                            fontMono
                            fullWidth
                        />
                    </div>
                    
                    <div className="mt-4 space-y-4">
                        <SettingToggle 
                            label={t('settings.opencode.server.mdns.label')}
                            description={t('settings.opencode.server.mdns.desc')}
                            checked={config.server?.mdns ?? true}
                            onChange={(v) => updateServer({ mdns: v })}
                        />
                        
                        <SettingTextArea
                            label={t('settings.opencode.server.cors.label')}
                            description={t('settings.opencode.server.cors.desc')}
                            value={(config.server?.cors ?? []).join('\n')}
                            onChange={(v) => updateServer({ cors: v.split('\n').map(s => s.trim()).filter(Boolean) })}
                            rows={3}
                            fontMono
                            placeholder="http://localhost:5173"
                        />
                    </div>
                </SettingsSection>

                {/* 5. Environment */}
                <SettingsSection title={t('settings.opencode.sections.environment')}>
                    <SettingInput 
                        label={t('settings.opencode.plugins.label')}
                        description={t('settings.opencode.plugins.desc')}
                        value={config.plugins.join(', ')}
                        onChange={(v) => updateConfig({ plugins: v.split(',').map(s => s.trim()).filter(Boolean) })}
                        fullWidth
                        fontMono
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <SettingSelect 
                            label={t('settings.opencode.theme.label')}
                            value={config.theme}
                            onChange={(v) => updateConfig({ theme: v })}
                            options={[
                                { label: 'Dark', value: 'dark' },
                                { label: 'Light', value: 'light' },
                                { label: 'Terminal', value: 'terminal' }
                            ]}
                            fullWidth
                        />
                        <SettingSelect 
                            label={t('settings.opencode.language.label')}
                            value={config.language}
                            onChange={(v) => updateConfig({ language: v })}
                            options={[
                                { label: 'English', value: 'en' },
                                { label: 'Chinese', value: 'zh' },
                                { label: 'Japanese', value: 'ja' }
                            ]}
                            fullWidth
                        />
                    </div>
                </SettingsSection>

            </div>
        </div>
    );
};

export default OpencodeSettings;
export { OpencodeSettings };
