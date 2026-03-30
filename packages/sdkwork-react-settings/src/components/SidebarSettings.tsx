
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
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <LayoutTemplate size={28} className="text-blue-500" />
                        {t('settings.sidebar_layout.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
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
                                    relative p-4 rounded-xl border text-left transition-all duration-200
                                    ${isActive 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' 
                                        : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333] hover:border-blue-400'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-sm ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                        {t(template.labelKey)}
                                    </h4>
                                    {isActive && <Check size={16} className="text-blue-500" />}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    {t(template.descriptionKey)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </SettingsSection>

            {/* Item Toggles */}
            <SettingsSection title={t('settings.sidebar_layout.sections.items')}>
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#333] p-4 space-y-2">
                    {currentConfig.map((item: SidebarItemConfig) => {
                        if (item.id.startsWith('separator')) return null;

                        return (
                            <div key={item.id} className="space-y-1">
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252526]">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
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
                                    <div className="ml-6 border-l border-gray-200 dark:border-[#333] pl-2 space-y-1">
                                        {item.children.map(child => (
                                            <div key={child.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252526]">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
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
                        className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1 transition-colors"
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
