
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Layout, FileCode, Cpu, Settings as SettingsIcon, 
    Search, RotateCcw, Info, AlertTriangle, 
    Network, Bot, Share2, LayoutTemplate, Command,
    HardDrive, ArrowLeft
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { DEFAULT_SETTINGS } from '../constants';
import {
    SettingsSection, SettingToggle, SettingSelect, SettingInput, SettingSlider,
    AgentsSettings, MediaSettings, StorageSettings, SidebarSettings, OpencodeSettings
} from '../components';
import { SETTING_DEFINITIONS, SettingDefinition } from '../data/definitions';
import { useTranslation, Locale } from '@sdkwork/react-i18n';

type SettingsTab = 'general' | 'appearance' | 'sidebar' | 'editor' | 'llm' | 'lsp' | 'agents' | 'opencode' | 'media' | 'storage' | 'about';

// Helper: Escape RegExp special characters
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper: Highlight text matches
const HighlightText = ({ text, query }: { text: string, query: string }) => {
    if (!query) return <>{text}</>;
    
    try {
        const escapedQuery = escapeRegExp(query);
        const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() 
                    ? <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded-sm px-0.5">{part}</span> 
                    : part
                )}
            </span>
        );
    } catch (e) {
        // Fallback if regex fails despite escaping (unlikely)
        return <>{text}</>;
    }
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDefaults, isLoading } = useSettingsStore();
  const { t, locale } = useTranslation();
  
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset scroll on tab change
  const contentRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeTab]);

  // --- Dynamic Tab Definitions (Translated) ---
  const tabs = [
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
  ];

  // --- Filtering & Grouping Logic with Translation ---

  const displayDefinitions = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      
      // 1. Enrich definitions with translated strings
      const enrichedDefs = SETTING_DEFINITIONS.map(def => ({
          ...def,
          translatedLabel: t(def.labelKey),
          translatedDesc: def.descriptionKey ? t(def.descriptionKey) : '',
          translatedSection: t(def.sectionKey)
      }));

      let filtered = enrichedDefs;

      if (query) {
          // Filter by translated content
          filtered = enrichedDefs.filter(def => 
             def.translatedLabel.toLowerCase().includes(query) || 
             def.translatedDesc.toLowerCase().includes(query) || 
             def.translatedSection.toLowerCase().includes(query) ||
             def.tags?.some(tag => tag.includes(query))
          );
      } else {
          filtered = enrichedDefs.filter(def => def.category === activeTab);
      }

      // Group by Section
      const groups: Record<string, typeof enrichedDefs> = {};
      filtered.forEach(def => {
          const tabLabel = tabs.find(tab => tab.id === def.category)?.label || def.category;
          const sectionTitle = query ? `${tabLabel} ? ${def.translatedSection}` : def.translatedSection;
          
          if (!groups[sectionTitle]) groups[sectionTitle] = [];
          groups[sectionTitle].push(def);
      });

      return groups;
  }, [searchQuery, activeTab, locale, t]); // Re-compute on locale change

  if (isLoading) return <div className="h-full flex items-center justify-center text-gray-500 animate-pulse">{t('common.status.loading')}</div>;

  // --- Helpers ---
  const getValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const setValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const newSettings = JSON.parse(JSON.stringify(obj));
    let target = newSettings;
    for (const key of keys) {
        if (!target[key]) target[key] = {};
        target = target[key];
    }
    target[lastKey] = value;
    return newSettings;
  };

  const handleChange = (def: SettingDefinition, value: any) => {
      if (def.validator) {
          const error = def.validator(value);
          if (error) {
              setValidationErrors(prev => ({ ...prev, [def.key]: error }));
          } else {
              setValidationErrors(prev => {
                  const next = { ...prev };
                  delete next[def.key];
                  return next;
              });
          }
      }
      const nextSettings = setValue(settings, def.key, value);
      updateSettings(nextSettings);
  };

  const handleReset = (def: SettingDefinition) => {
      const defaultVal = getValue(DEFAULT_SETTINGS, def.key);
      handleChange(def, defaultVal);
      setValidationErrors(prev => {
          const next = { ...prev };
          delete next[def.key];
          return next;
              });
  };

  const isModified = (key: string) => {
      return JSON.stringify(getValue(settings, key)) !== JSON.stringify(getValue(DEFAULT_SETTINGS, key));
  };


  // --- Renderers ---

  const renderWidget = (def: any) => {
      const value = getValue(settings, def.key);
      const modified = isModified(def.key);
      const error = validationErrors[def.key];

      const commonProps = {
          key: def.key,
          label: <HighlightText text={def.translatedLabel} query={searchQuery} />,
          description: def.translatedDesc ? <HighlightText text={def.translatedDesc} query={searchQuery} /> : undefined,
          isModified: modified,
          onReset: modified ? () => handleReset(def) : undefined,
          error: error
      };

      // Translate Options if needed
      const translatedOptions = def.options?.map((opt: any) => ({
          label: opt.labelKey ? t(opt.labelKey) : (opt.label || String(opt.value)),
          value: opt.value
      }));

      switch (def.type) {
          case 'toggle':
              return (
                  <SettingToggle 
                      {...commonProps} 
                      checked={value as boolean} 
                      onChange={(v) => handleChange(def, v)} 
                  />
              );
          case 'select':
              return (
                  <SettingSelect 
                      {...commonProps} 
                      value={value as string}
                      options={translatedOptions || []}
                      onChange={(v) => handleChange(def, v)} 
                  />
              );
          case 'input':
              return (
                  <SettingInput 
                      {...commonProps}
                      value={value as string}
                      placeholder={def.placeholder}
                      type={def.inputType}
                      onChange={(v) => handleChange(def, v)}
                  />
              );
          case 'slider':
              return (
                  <SettingSlider 
                      {...commonProps} 
                      value={value as number}
                      min={def.min || 0}
                      max={def.max || 100}
                      step={def.step || 1}
                      unit={def.unit}
                      onChange={(v) => handleChange(def, v)}
                  />
              );
          default:
              return null;
      }
  };

  const renderContent = () => {
      // Fluid Views (Custom Components)
      if (!searchQuery) {
          if (activeTab === 'lsp') return <div>LSP Settings (Coming Soon)</div>;
          if (activeTab === 'agents') return <AgentsSettings />;
          if (activeTab === 'llm') return <div>LLM Settings (Coming Soon)</div>;
          if (activeTab === 'media') return <MediaSettings />;
          if (activeTab === 'storage') return <StorageSettings />; 
          if (activeTab === 'sidebar') return <SidebarSettings />;
          if (activeTab === 'opencode') return <OpencodeSettings />;
      }

      // About Page
      if (activeTab === 'about' && !searchQuery) {
          return (
             <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
                <div className="w-24 h-24 bg-[#252526] rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-[#333] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <SettingsIcon size={48} className="text-blue-500 drop-shadow-md" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Magic Studio</h2>
                <p className="text-gray-500 text-sm mb-8 font-medium">Version 0.1.0 (Beta)</p>
                
                <div className="max-w-md w-full bg-[#18181b] rounded-xl border border-[#333] overflow-hidden divide-y divide-[#27272a]">
                     <div className="flex justify-between p-4 text-sm hover:bg-[#202023] transition-colors">
                         <span className="text-gray-500">Electron</span>
                         <span className="text-gray-300 font-mono">28.0.0</span>
                     </div>
                     <div className="flex justify-between p-4 text-sm hover:bg-[#202023] transition-colors">
                         <span className="text-gray-500">Chromium</span>
                         <span className="text-gray-300 font-mono">120.0.6099.109</span>
                     </div>
                     <div className="flex justify-between p-4 text-sm hover:bg-[#202023] transition-colors">
                         <span className="text-gray-500">Node</span>
                         <span className="text-gray-300 font-mono">18.18.2</span>
                     </div>
                </div>
            </div>
          );
      }

      const sections = Object.entries(displayDefinitions);
      if (sections.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Search size={48} className="opacity-20 mb-4" />
                  <p className="text-lg font-medium text-gray-400">{t('settings.search.noResults')}</p>
                  <p className="text-sm opacity-60 mt-1">{t('settings.search.tryAnother', { query: searchQuery })}</p>
              </div>
          );
      }

      return (
          <div className="space-y-10">
              {sections.map(([sectionTitle, defs]) => (
                  <SettingsSection key={sectionTitle} title={sectionTitle}>
                      {(defs as any[]).map(renderWidget)}
                  </SettingsSection>
              ))}
          </div>
      );
  };

  const isFluid = !searchQuery && ['agents', 'llm', 'media', 'storage', 'sidebar', 'opencode', 'lsp'].includes(activeTab);

  return (
    <div className="w-full h-full flex bg-[#1e1e1e] overflow-hidden text-sm">
        {/* Left Sidebar */}
        <div className="w-[260px] bg-[#252526] border-r border-[#333] flex flex-col flex-none z-10">
             {/* Back Button */}
             <div className="p-3 border-b border-[#333]">
                 <button 
                    onClick={handleGoBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-xs transition-colors px-2 py-1.5 rounded-md hover:bg-[#323233]"
                 >
                     <ArrowLeft size={14} />
                     <span>{t('common.actions.back')}</span>
                 </button>
             </div>
             
             {/* Header / Search */}
             <div className="p-4 border-b border-[#333]">
                 <div className="relative group">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                     <input 
                        type="text" 
                        placeholder={t('settings.search.placeholder')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3f3f46] text-gray-200 rounded-md pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                     />
                     {searchQuery && (
                         <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                             <span className="sr-only">Clear</span>
                             ��
                         </button>
                     )}
                 </div>
             </div>
             
             {/* Tabs List */}
             <nav className={`flex-1 overflow-y-auto py-2 ${searchQuery ? 'opacity-40 pointer-events-none grayscale' : ''}`} aria-label="Settings Categories">
                 {tabs.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`
                            w-full flex items-center gap-3 px-5 py-2.5 transition-all border-l-2 text-left relative
                            ${activeTab === tab.id 
                                ? 'bg-[#323233] text-white border-blue-500 font-medium' 
                                : 'text-gray-400 border-transparent hover:bg-[#2a2a2d] hover:text-gray-200'
                            }
                        `}
                     >
                         <span className={`flex-shrink-0 ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'}`}>{tab.icon}</span>
                         {tab.label}
                     </button>
                 ))}
             </nav>

             {/* Footer Actions */}
             <div className="p-4 border-t border-[#333]">
                 <button 
                    onClick={() => { if(confirm(t('settings.search.confirmReset'))) resetToDefaults(); }}
                    className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-400 py-2.5 rounded-lg hover:bg-[#2d2d2d] transition-all border border-transparent hover:border-red-900/30"
                 >
                     <RotateCcw size={14} /> {t('settings.search.resetApp')}
                 </button>
             </div>
        </div>

        {/* Right Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto min-w-0 bg-[#1e1e1e] scroll-smooth relative">
             {/* Conditional Header Wrapper */}
             <div className={`
                ${isFluid ? 'sticky top-0 z-20 bg-[#1e1e1e]/95 backdrop-blur-sm px-6 py-4 border-b border-[#333]' : 'max-w-4xl mx-auto px-12 py-10 pb-4'}
             `}>
                 <div className={`${isFluid ? 'flex items-center justify-between' : 'mb-10 flex items-end justify-between sticky top-0 bg-[#1e1e1e]/95 backdrop-blur-sm z-20 py-4 -mt-4 border-b border-transparent data-[scrolled=true]:border-[#333]'}`}>
                     <div>
                         {!isFluid && <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{t('sidebar.settings')}</div>}
                         <h1 className="text-3xl font-bold text-white">
                            {searchQuery ? `${t('common.actions.search')}: "${searchQuery}"` : tabs.find(t => t.id === activeTab)?.label}
                         </h1>
                     </div>
                     {Object.keys(validationErrors).length > 0 && (
                         <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-1.5 rounded-full border border-red-900/50 animate-pulse">
                             <AlertTriangle size={14} />
                             <span className="text-xs font-bold">{t('settings.search.invalidConfig')}</span>
                         </div>
                     )}
                 </div>
             </div>
             
             {/* Content Wrapper */}
             <div className={`${isFluid ? 'h-[calc(100%-70px)]' : 'max-w-4xl mx-auto px-12 pb-24'}`}>
                <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 h-full`}>
                    {renderContent()}
                </div>
             </div>
        </div>
    </div>
  );
};

export default SettingsPage;
