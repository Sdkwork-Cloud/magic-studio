
import { SidebarItemConfig } from '../entities'
import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '@sdkwork/react-i18n';
import { SettingsSection, SettingToggle } from './SettingsWidgets';
import { SIDEBAR_TEMPLATES } from '../constants';
import { Check, LayoutTemplate, RotateCcw } from 'lucide-react';


const SidebarSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();

    const currentConfig = settings.appearance.sidebarConfig || SIDEBAR_TEMPLATES[0].config;

    const applyTemplate = (templateId: string) => {
        const template = SIDEBAR_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            updateSettings({
                ...settings,
                appearance: {
                    ...settings.appearance,
                    sidebarConfig: template.config
                }
            });
        }
    };

    const toggleItemVisibility = (itemId: string, visible: boolean, parentId?: string) => {
        const newConfig = [...currentConfig];

        if (parentId) {
            const parent = newConfig.find(i => i.id === parentId);
            if (parent && parent.children) {
                const child = parent.children.find(c => c.id === itemId);
                if (child) child.visible = visible;
            }
        } else {
            const item = newConfig.find(i => i.id === itemId);
            if (item) item.visible = visible;
        }

        updateSettings({
            ...settings,
            appearance: {
                ...settings.appearance,
                sidebarConfig: newConfig
            }
        });
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                     <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
                        <LayoutTemplate size={28} className="text-primary-500" />
                        {t('settings.sidebar_layout.title')}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                        {t('settings.sidebar_layout.subtitle')}
                    </p>
                </div>
            </div>

            {/* Templates */}
            <SettingsSection title={t('settings.sidebar_layout.sections.templates')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SIDEBAR_TEMPLATES.map(template => {
                        const isActive = JSON.stringify(template.config) === JSON.stringify(currentConfig);
                        return (
                            <button
                                key={template.id}
                                onClick={() => applyTemplate(template.id)}
                                className={`
                                    relative rounded-2xl p-4 text-left transition-all duration-200
                                    ${isActive
                                        ? 'app-surface-strong border-primary-500 ring-1 ring-primary-500 bg-[color-mix(in_srgb,var(--theme-primary-500)_10%,var(--bg-panel-strong))]'
                                        : 'app-surface-strong hover:border-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--text-primary)_3%,transparent)]'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <h4 className={`text-sm font-bold ${isActive ? 'text-primary-500' : 'text-[var(--text-primary)]'}`}>
                                        {t(template.labelKey)}
                                    </h4>
                                    {isActive && <Check size={16} className="text-primary-500" />}
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                                    {t(template.descriptionKey)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </SettingsSection>

            {/* Item Toggles */}
            <SettingsSection title={t('settings.sidebar_layout.sections.items')}>
                <div className="app-surface-strong rounded-2xl p-4 space-y-2">
                    {currentConfig.map((item: SidebarItemConfig) => {
                        if (item.id.startsWith('separator')) return null;

                        return (
                            <div key={item.id} className="space-y-1">
                                <div className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]">
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                                        {t(item.labelKey)}
                                    </span>
                                    <SettingToggle
                                        checked={item.visible}
                                        onChange={(v) => toggleItemVisibility(item.id, v)}
                                        label=""
                                    />
                                </div>

                                {/* Children */}
                                {item.children && item.children.length > 0 && (
                                    <div className="ml-6 space-y-1 border-l border-[var(--border-color)] pl-2">
                                        {item.children.map(child => (
                                            <div key={child.id} className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]">
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {t(child.labelKey)}
                                                </span>
                                                <SettingToggle
                                                    checked={child.visible}
                                                    onChange={(v) => toggleItemVisibility(child.id, v, item.id)}
                                                    label=""
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end mt-4">
                     <button
                        onClick={() => applyTemplate('default')}
                        className="flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-primary-500"
                     >
                         <RotateCcw size={12} /> {t('settings.sidebar_layout.actions.reset')}
                     </button>
                </div>
            </SettingsSection>
        </div>
    );
};

export default SidebarSettings;
export { SidebarSettings };
