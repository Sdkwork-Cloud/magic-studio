import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
    FileCode,
    Cpu,
    Settings as SettingsIcon,
    Search,
    RotateCcw,
    Info,
    AlertTriangle,
    Network,
    Bot,
    Share2,
    LayoutTemplate,
    Command,
    HardDrive,
    ArrowLeft,
    X,
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useSettingsStore } from '../store/settingsStore';
import { DEFAULT_SETTINGS } from '../constants';
import {
    AppearanceSettings,
    SettingsSection,
    SettingToggle,
    SettingSelect,
    SettingInput,
    SettingSlider,
    AgentsSettings,
    MediaSettings,
    StorageSettings,
    SidebarSettings,
    OpencodeSettings,
} from '../components';
import { SETTING_DEFINITIONS, SettingDefinition } from '../data/definitions';
import {
    applyAppearanceDensityMode,
    applyManualAppearanceMetrics,
} from '../services/appearanceDensityService';
import type { AppSettings, AppearanceDensityMode } from '../entities';

type SettingsTab =
    | 'general'
    | 'appearance'
    | 'sidebar'
    | 'editor'
    | 'llm'
    | 'lsp'
    | 'agents'
    | 'opencode'
    | 'media'
    | 'storage'
    | 'about';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type SettingValue = string | number | boolean;

type TranslatedSettingDefinition = SettingDefinition<unknown> & {
    translatedLabel: string;
    translatedDesc: string;
    translatedSection: string;
};

type SettingsObject = Record<string, unknown>;

const isSettingsObject = (value: unknown): value is SettingsObject =>
    typeof value === 'object' && value !== null;

const cloneSettings = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getValue = (obj: AppSettings, path: string): unknown =>
    path.split('.').reduce<unknown>((acc, part) => {
        if (!isSettingsObject(acc)) {
            return undefined;
        }
        return acc[part];
    }, obj);

const setValue = (obj: AppSettings, path: string, value: unknown): AppSettings => {
    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) {
        return obj;
    }

    const nextSettings = cloneSettings(obj);
    let target: SettingsObject = nextSettings as unknown as SettingsObject;

    for (const key of keys) {
        const current = target[key];
        if (!isSettingsObject(current)) {
            target[key] = {};
        }
        target = target[key] as SettingsObject;
    }

    target[lastKey] = value;
    return nextSettings;
};

const HighlightText = ({ text, query }: { text: string; query: string }) => {
    if (!query) return <>{text}</>;

    try {
        const escapedQuery = escapeRegExp(query);
        const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
        return (
            <span>
                {parts.map((part, index) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <span
                            key={index}
                            className="rounded-sm bg-[color-mix(in_srgb,var(--theme-primary-500)_18%,transparent)] px-0.5 text-[var(--text-primary)]"
                        >
                            {part}
                        </span>
                    ) : (
                        part
                    ),
                )}
            </span>
        );
    } catch {
        return <>{text}</>;
    }
};

const SettingsPage: React.FC = () => {
    const { settings, updateSettings, resetToDefaults, isLoading } = useSettingsStore();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        window.location.href = '/';
    };

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    const tabs = useMemo(
        () => [
            { id: 'general', label: t('settings.tabs.general'), icon: <SettingsIcon size={16} /> },
            { id: 'appearance', label: t('settings.tabs.appearance'), icon: <Layout size={16} /> },
            { id: 'sidebar', label: t('settings.tabs.sidebar'), icon: <LayoutTemplate size={16} /> },
            { id: 'editor', label: t('settings.tabs.editor'), icon: <FileCode size={16} /> },
            { id: 'llm', label: t('settings.tabs.llm'), icon: <Cpu size={16} /> },
            { id: 'media', label: t('settings.tabs.media'), icon: <Share2 size={16} /> },
            { id: 'storage', label: t('settings.tabs.storage'), icon: <HardDrive size={16} /> },
            { id: 'lsp', label: t('settings.tabs.lsp'), icon: <Network size={16} /> },
            { id: 'agents', label: t('settings.tabs.agents'), icon: <Bot size={16} /> },
            { id: 'opencode', label: t('settings.tabs.opencode'), icon: <Command size={16} /> },
            { id: 'about', label: t('settings.tabs.about'), icon: <Info size={16} /> },
        ],
        [t],
    );

    const displayDefinitions = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const enrichedDefs = SETTING_DEFINITIONS.map((def) => ({
            ...def,
            translatedLabel: t(def.labelKey),
            translatedDesc: def.descriptionKey ? t(def.descriptionKey) : '',
            translatedSection: t(def.sectionKey),
        }));

        const filtered = query
            ? enrichedDefs.filter(
                  (def) =>
                      def.translatedLabel.toLowerCase().includes(query) ||
                      def.translatedDesc.toLowerCase().includes(query) ||
                      def.translatedSection.toLowerCase().includes(query) ||
                      def.tags?.some((tag) => tag.includes(query)),
              )
            : enrichedDefs.filter((def) => def.category === activeTab);

        const groups: Record<string, typeof enrichedDefs> = {};
        filtered.forEach((def) => {
            const tabLabel = tabs.find((tab) => tab.id === def.category)?.label || def.category;
            const sectionTitle = query ? `${tabLabel} · ${def.translatedSection}` : def.translatedSection;

            if (!groups[sectionTitle]) {
                groups[sectionTitle] = [];
            }
            groups[sectionTitle].push(def);
        });

        return groups;
    }, [activeTab, searchQuery, t, tabs]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)] animate-pulse">
                {t('common.status.loading')}
            </div>
        );
    }

    const handleChange = (def: SettingDefinition, value: SettingValue) => {
        if (def.validator) {
            const error = def.validator(value as never);
            if (error) {
                setValidationErrors((prev) => ({ ...prev, [def.key]: error }));
            } else {
                setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[def.key];
                    return next;
                });
            }
        }

        let nextSettings = setValue(settings, def.key, value);

        if (def.key === 'appearance.densityMode') {
            nextSettings = {
                ...settings,
                appearance: applyAppearanceDensityMode(
                    settings.appearance,
                    (value === 'custom' ? 'standard' : value) as AppearanceDensityMode,
                ),
            };
        } else if (def.key === 'appearance.fontSize') {
            nextSettings = {
                ...settings,
                appearance: applyManualAppearanceMetrics(settings.appearance, {
                    fontSize: value as number,
                }),
            };
        } else if (def.key === 'appearance.lineHeight') {
            nextSettings = {
                ...settings,
                appearance: applyManualAppearanceMetrics(settings.appearance, {
                    lineHeight: value as number,
                }),
            };
        }

        updateSettings(nextSettings);
    };

    const handleReset = (def: SettingDefinition) => {
        handleChange(def, getValue(DEFAULT_SETTINGS, def.key) as SettingValue);
        setValidationErrors((prev) => {
            const next = { ...prev };
            delete next[def.key];
            return next;
        });
    };

    const isModified = (key: string) =>
        JSON.stringify(getValue(settings, key)) !== JSON.stringify(getValue(DEFAULT_SETTINGS, key));

    const renderWidget = (def: TranslatedSettingDefinition) => {
        const value = getValue(settings, def.key);
        const modified = isModified(def.key);
        const error = validationErrors[def.key];

        const commonProps = {
            key: def.key,
            label: <HighlightText text={def.translatedLabel} query={searchQuery} />,
            description: def.translatedDesc ? (
                <HighlightText text={def.translatedDesc} query={searchQuery} />
            ) : undefined,
            isModified: modified,
            onReset: modified ? () => handleReset(def) : undefined,
            error,
        };

        const translatedOptions = def.options?.map((opt) => ({
            label: opt.labelKey ? t(opt.labelKey) : opt.label || String(opt.value),
            value: String(opt.value),
        }));

        switch (def.type) {
            case 'toggle':
                return (
                    <SettingToggle
                        {...commonProps}
                        checked={Boolean(value)}
                        onChange={(nextValue) => handleChange(def, nextValue)}
                    />
                );
            case 'select':
                return (
                    <SettingSelect
                        {...commonProps}
                        value={value as string}
                        options={translatedOptions || []}
                        onChange={(nextValue) => handleChange(def, nextValue)}
                    />
                );
            case 'input':
                return (
                    <SettingInput
                        {...commonProps}
                        value={String(value ?? '')}
                        placeholder={def.placeholder}
                        type={def.inputType}
                        onChange={(nextValue) => handleChange(def, nextValue)}
                    />
                );
            case 'slider':
                return (
                    <SettingSlider
                        {...commonProps}
                        value={typeof value === 'number' ? value : Number(value ?? 0)}
                        min={def.min || 0}
                        max={def.max || 100}
                        step={def.step || 1}
                        unit={def.unit}
                        onChange={(nextValue) => handleChange(def, nextValue)}
                    />
                );
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (!searchQuery) {
            if (activeTab === 'appearance') return <AppearanceSettings />;
            if (activeTab === 'lsp') return <div>{t('settings.page.comingSoon.lsp')}</div>;
            if (activeTab === 'agents') return <AgentsSettings />;
            if (activeTab === 'llm') return <div>{t('settings.page.comingSoon.llm')}</div>;
            if (activeTab === 'media') return <MediaSettings />;
            if (activeTab === 'storage') return <StorageSettings />;
            if (activeTab === 'sidebar') return <SidebarSettings />;
            if (activeTab === 'opencode') return <OpencodeSettings />;
        }

        if (activeTab === 'about' && !searchQuery) {
            return (
                <div className="animate-in fade-in duration-300">
                    <div className="app-floating-panel mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[2rem] px-10 py-16 text-center">
                        <div className="app-surface-subtle relative mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/12 to-transparent opacity-100" />
                            <SettingsIcon size={48} className="text-primary-500 drop-shadow-md" />
                        </div>
                        <h2 className="mb-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{t('appShell.brand')}</h2>
                        <p className="mb-8 text-sm font-medium text-[var(--text-muted)]">
                            {t('settings.page.about.version', {
                                version: '0.1.0',
                                channel: t('settings.page.about.channel.beta'),
                            })}
                        </p>

                        <div className="app-surface-strong max-w-md w-full overflow-hidden rounded-2xl divide-y divide-[var(--border-color)]">
                            <div className="flex justify-between p-4 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_3%,transparent)]">
                                <span className="text-[var(--text-muted)]">{t('settings.page.about.runtime.electron')}</span>
                                <span className="font-mono text-[var(--text-secondary)]">28.0.0</span>
                            </div>
                            <div className="flex justify-between p-4 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_3%,transparent)]">
                                <span className="text-[var(--text-muted)]">{t('settings.page.about.runtime.chromium')}</span>
                                <span className="font-mono text-[var(--text-secondary)]">120.0.6099.109</span>
                            </div>
                            <div className="flex justify-between p-4 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_3%,transparent)]">
                                <span className="text-[var(--text-muted)]">{t('settings.page.about.runtime.node')}</span>
                                <span className="font-mono text-[var(--text-secondary)]">18.18.2</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const sections = Object.entries(displayDefinitions);
        if (sections.length === 0) {
            return (
                <div className="app-surface-subtle mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[2rem] border-dashed py-20 text-center">
                    <Search size={48} className="mb-4 opacity-20 text-[var(--text-muted)]" />
                    <p className="text-lg font-medium text-[var(--text-secondary)]">{t('settings.search.noResults')}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{t('settings.search.tryAnother', { query: searchQuery })}</p>
                </div>
            );
        }

        return (
            <div className="space-y-10">
                {sections.map(([sectionTitle, defs]) => (
                    <SettingsSection key={sectionTitle} title={sectionTitle}>
                        {defs.map(renderWidget)}
                    </SettingsSection>
                ))}
            </div>
        );
    };

    const isFluid = !searchQuery && ['agents', 'llm', 'media', 'storage', 'sidebar', 'opencode', 'lsp'].includes(activeTab);

    return (
        <div className="w-full h-full flex bg-[var(--bg-app)] overflow-hidden text-sm text-[var(--text-primary)]">
            <div className="w-[260px] app-surface-subtle border-r border-[var(--border-color)] flex flex-col flex-none z-10 bg-[var(--bg-panel-subtle)]">
                <div className="p-3 border-b border-[var(--border-color)]">
                    <button
                        onClick={handleGoBack}
                        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition-colors px-2 py-1.5 rounded-md hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]"
                    >
                        <ArrowLeft size={14} />
                        <span>{t('common.actions.back')}</span>
                    </button>
                </div>

                <div className="p-4 border-b border-[var(--border-color)]">
                    <div className="relative group">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-primary-500 transition-colors"
                        />
                        <input
                            type="text"
                            placeholder={t('settings.search.placeholder')}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-full bg-[var(--bg-panel-strong)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md pl-9 pr-8 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-[var(--text-muted)]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                <span className="sr-only">{t('settings.page.search.clear')}</span>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                <nav
                    className={`flex-1 overflow-y-auto py-2 ${searchQuery ? 'opacity-40 pointer-events-none grayscale' : ''}`}
                    aria-label={t('settings.page.aria.tabs')}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 transition-all border-l-2 text-left relative ${
                                activeTab === tab.id
                                    ? 'bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] text-[var(--text-primary)] border-primary-500 font-medium'
                                    : 'text-[var(--text-muted)] border-transparent hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <span className={`flex-shrink-0 ${activeTab === tab.id ? 'text-primary-500' : 'text-[var(--text-muted)]'}`}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--border-color)]">
                    <button
                        onClick={() => {
                            if (confirm(t('settings.search.confirmReset'))) {
                                resetToDefaults();
                            }
                        }}
                        className="app-button-danger w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs"
                    >
                        <RotateCcw size={14} /> {t('settings.search.resetApp')}
                    </button>
                </div>
            </div>

            <div ref={contentRef} className="flex-1 overflow-y-auto min-w-0 bg-[var(--bg-app)] scroll-smooth relative">
                <div
                    className={`${
                        isFluid
                            ? 'sticky top-0 z-20 bg-[color-mix(in_srgb,var(--bg-app)_92%,transparent)] backdrop-blur-sm px-6 py-4 border-b border-[var(--border-color)]'
                            : 'max-w-4xl mx-auto px-12 py-10 pb-4'
                    }`}
                >
                    <div
                        className={`${
                            isFluid
                                ? 'flex items-center justify-between'
                                : 'mb-10 flex items-end justify-between sticky top-0 bg-[color-mix(in_srgb,var(--bg-app)_95%,transparent)] backdrop-blur-sm z-20 py-4 -mt-4 border-b border-transparent data-[scrolled=true]:border-[var(--border-color)]'
                        }`}
                    >
                        <div>
                            {!isFluid && (
                                <div className="text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                                    {t('sidebar.settings')}
                                </div>
                            )}
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                                {searchQuery
                                    ? `${t('common.actions.search')}: "${searchQuery}"`
                                    : tabs.find((tab) => tab.id === activeTab)?.label}
                            </h1>
                        </div>
                        {Object.keys(validationErrors).length > 0 && (
                            <div className="app-banner" data-tone="danger">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-bold">{t('settings.search.invalidConfig')}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${isFluid ? 'h-[calc(100%-70px)]' : 'max-w-4xl mx-auto px-12 pb-24'}`}>
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">{renderContent()}</div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
