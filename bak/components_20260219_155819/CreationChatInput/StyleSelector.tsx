
import React, { useState, useRef, useMemo } from 'react';
import { Palette, ChevronDown, Check, Sparkles, Image as ImageIcon, User, ScanFace, LayoutTemplate, Search, X, Copy, Languages } from 'lucide-react';
import { Popover } from '../Popover';
import { platform } from 'sdkwork-react-core';
import { useTranslation } from 'sdkwork-react-i18n';

export interface StyleAsset {
    url: string;
    type?: 'image' | 'video';
    width?: number;
    height?: number;
}

export interface StyleOption {
    id: string;
    label: string;
    description?: string;
    usage?: string[];
    isCustom?: boolean;
    prompt?: string;
    prompt_zh?: string;
    
    assets?: {
        scene?: StyleAsset;
        portrait?: StyleAsset;
        sheet?: StyleAsset;
        video?: StyleAsset;
    };
    previewColor?: string;
}

interface StyleSelectorProps {
    value: string;
    onChange: (id: string) => void;
    options: StyleOption[];
    disabled?: boolean;
    className?: string;
    label?: string;
    
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ 
    value, 
    onChange, 
    options, 
    disabled = false,
    className = '',
    label = 'Art Style',
    isOpen: controlledIsOpen,
    onToggle
}) => {
    const { t } = useTranslation();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [promptLang, setPromptLang] = useState<'en' | 'zh'>('en');
    
    const [hoveredStyleId, setHoveredStyleId] = useState<string | null>(null);

    const activeOption = options.find(o => o.id === value) || options[0];
    
    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const q = searchQuery.toLowerCase();
        return options.filter(opt => 
            opt.label.toLowerCase().includes(q) || 
            opt.usage?.some(u => u.toLowerCase().includes(q))
        );
    }, [options, searchQuery]);

    const displayOption = options.find(o => o.id === hoveredStyleId) || activeOption || options[0];

    const handleToggle = () => {
        if (!disabled) {
            const nextState = !isOpen;
            if (onToggle) onToggle(nextState);
            else setInternalIsOpen(nextState);
            
            if (nextState) setSearchQuery('');
        }
    };
    
    const handleClose = () => {
        if (onToggle) onToggle(false);
        else setInternalIsOpen(false);
        setHoveredStyleId(null);
    };

    const getCurrentPrompt = () => {
        if (promptLang === 'zh' && displayOption.prompt_zh) return displayOption.prompt_zh;
        return displayOption.prompt || '';
    };

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = getCurrentPrompt();
        if (text) {
            platform.copy(text);
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border group
                    ${isOpen 
                        ? 'bg-[#27272a] border-white/20 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
                        : 'bg-[#202022] border-transparent hover:border-[#333] hover:bg-[#2a2a2d] text-gray-300'
                    }
                    ${className}
                `}
                title="Select Style"
            >
                <div className={`p-1 rounded-full ${isOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                    <Palette size={12} />
                </div>
                <span className="truncate max-w-[100px]">{activeOption?.label || label}</span>
                <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <Popover
                isOpen={isOpen}
                onClose={handleClose}
                triggerRef={triggerRef}
                width={1050} 
                className="flex bg-[#09090b] overflow-hidden border border-[#27272a] shadow-2xl rounded-xl ring-1 ring-white/10"
                align="start" 
                offset={12}
            >
                <div className="w-[500px] flex flex-col border-r border-[#27272a] bg-[#121212] flex-shrink-0 max-h-[650px]">
                    
                    <div className="px-4 py-3 border-b border-[#27272a] bg-[#141414] space-y-3 z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={12} className="text-orange-500" /> {t('styleSelector.styleLibrary')}
                            </span>
                            <span className="text-[9px] text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#27272a] font-mono">
                                {filteredOptions.length} / {options.length}
                            </span>
                        </div>
                        
                        <div className="relative group">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('styleSelector.searchPlaceholder')} 
                                className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:bg-[#202022] transition-all placeholder-gray-600"
                                autoFocus
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-12">
                        <div className="grid grid-cols-4 gap-2">
                            {filteredOptions.map((style) => {
                                const isActive = style.id === value;
                                const isHovered = style.id === displayOption.id;
                                const thumbnail = style.assets?.scene?.url || style.assets?.portrait?.url;
                                
                                return (
                                    <button
                                        key={style.id}
                                        onClick={() => { onChange(style.id); handleClose(); }}
                                        onMouseEnter={() => setHoveredStyleId(style.id)}
                                        className={`
                                            relative flex flex-col items-start gap-1.5 p-1.5 rounded-lg border text-left transition-all duration-200 group h-full
                                            ${isActive 
                                                ? 'bg-[#1e1e20] border-indigo-500/50 ring-1 ring-indigo-500/20' 
                                                : isHovered
                                                    ? 'bg-[#1a1a1c] border-[#333]'
                                                    : 'bg-transparent border-transparent hover:bg-[#1a1a1c] hover:border-[#27272a]'
                                            }
                                        `}
                                    >
                                        <div className="w-full aspect-[4/3] rounded bg-black overflow-hidden relative border border-white/5">
                                            {thumbnail ? (
                                                <img src={thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#222]">
                                                    <Palette size={16} className="text-gray-600" />
                                                </div>
                                            )}
                                            
                                            {isActive && (
                                                <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center backdrop-blur-[0.5px]">
                                                    <div className="bg-indigo-500 rounded-full p-0.5 shadow-sm">
                                                        <Check size={10} className="text-white" strokeWidth={4} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="w-full min-w-0 px-0.5">
                                            <span className={`block text-[9px] font-medium truncate leading-tight ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {style.label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {filteredOptions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <Search size={24} className="opacity-20 mb-2" />
                                <p className="text-xs">{t('styleSelector.noStylesFound')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-[#050505] relative min-w-0 max-h-[650px] overflow-y-auto custom-scrollbar">
                    
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                    {displayOption.label}
                                    {displayOption.isCustom && <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider align-middle relative -top-0.5">{t('styleSelector.custom')}</span>}
                                </h2>
                                <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-md">
                                    {displayOption.description || t('styleSelector.defaultDescription')}
                                </p>
                            </div>
                            {displayOption.usage && (
                                <div className="flex flex-wrap justify-end gap-1.5 max-w-[150px]">
                                    {displayOption.usage.slice(0, 4).map(tag => (
                                        <span key={tag} className="text-[10px] font-medium text-gray-400 bg-[#1a1a1c] border border-[#27272a] px-2.5 py-1 rounded-full whitespace-nowrap">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {(displayOption.prompt || displayOption.prompt_zh) && (
                            <div className="mt-5 p-3 bg-[#131315] border border-[#27272a] rounded-lg group relative">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Sparkles size={10} className="text-purple-400" /> {t('styleSelector.stylePrompt')}
                                        </span>
                                        
                                        <div className="flex items-center bg-[#1a1a1c] rounded-md border border-[#333] p-0.5">
                                            <button 
                                                onClick={() => setPromptLang('en')}
                                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${promptLang === 'en' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                EN
                                            </button>
                                            <button 
                                                onClick={() => setPromptLang('zh')}
                                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${promptLang === 'zh' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                ZH
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleCopyPrompt}
                                        className={`flex items-center gap-1 text-[10px] transition-colors ${copiedPrompt ? 'text-green-500' : 'text-indigo-400 hover:text-indigo-300'}`}
                                    >
                                        {copiedPrompt ? <Check size={10} /> : <Copy size={10} />}
                                        {copiedPrompt ? t('styleSelector.copied') : t('styleSelector.copy')}
                                    </button>
                                </div>
                                <div className="text-xs text-gray-300 font-mono leading-relaxed bg-[#0a0a0a] p-2 rounded border border-[#1f1f22] select-all line-clamp-3 hover:line-clamp-none transition-all">
                                    {getCurrentPrompt() || <span className="text-gray-600 italic">{t('styleSelector.noTranslation')}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 pt-2 flex-1">
                        <div className="grid grid-cols-3 gap-4 h-[380px]">
                            
                            <div className="col-span-3 row-span-4 relative bg-[#121214] rounded-xl overflow-hidden border border-[#27272a] group shadow-lg">
                                 <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-200 border border-white/10 flex items-center gap-1.5 shadow-sm">
                                    <ImageIcon size={12} className="text-indigo-400" /> {t('styleSelector.sceneConcept')}
                                 </div>
                                 {displayOption.assets?.scene?.url ? (
                                    <img src={displayOption.assets.scene.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Scene" />
                                 ) : (
                                    <EmptyState icon={<ImageIcon size={32} />} label={t('styleSelector.noScenePreview')} />
                                 )}
                            </div>

                            <div className="col-span-1 row-span-3 relative bg-[#121214] rounded-xl overflow-hidden border border-[#27272a] group shadow-lg">
                                <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-200 border border-white/10 flex items-center gap-1.5 shadow-sm">
                                    <User size={12} className="text-blue-400" /> {t('styleSelector.avatar')}
                                 </div>
                                 {displayOption.assets?.portrait?.url ? (
                                    <img src={displayOption.assets.portrait.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Portrait" />
                                 ) : displayOption.assets?.scene?.url ? (
                                    <img src={displayOption.assets.scene.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: 'center 20%' }} alt="Portrait Fallback" />
                                 ) : (
                                    <EmptyState icon={<User size={24} />} label={t('styleSelector.noPortrait')} />
                                 )}
                            </div>

                            <div className="col-span-2 row-span-3 relative bg-[#121214] rounded-xl overflow-hidden border border-[#27272a] group shadow-lg">
                                 <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-200 border border-white/10 flex items-center gap-1.5 shadow-sm">
                                    <ScanFace size={12} className="text-green-400" /> {t('styleSelector.characterSheet')}
                                 </div>
                                 {displayOption.assets?.sheet?.url ? (
                                    <img src={displayOption.assets.sheet.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Sheet" />
                                 ) : (
                                    <EmptyState icon={<LayoutTemplate size={24} />} label={t('styleSelector.noSheetData')} />
                                 )}
                            </div>

                        </div>
                    </div>
                </div>
            </Popover>
        </>
    );
};

const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#161618]">
        <div className="opacity-40 mb-2">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</span>
    </div>
);
