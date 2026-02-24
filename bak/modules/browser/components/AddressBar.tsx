
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Star, Lock, Search, ExternalLink, CloudDownload } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useTranslation } from '../../../i18n';
import { platform } from '../../../platform';
import { DownloadsPanel } from './DownloadsPanel';

export const AddressBar: React.FC = () => {
    const { activeTab, navigate, reload, bookmarks, toggleBookmark, downloads } = useBrowserStore();
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showDownloads, setShowDownloads] = useState(false);
    const downloadBtnRef = useRef<HTMLButtonElement>(null);
    const downloadPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab) {
            setInput(activeTab.url === 'about:blank' ? '' : activeTab.url);
        }
    }, [activeTab?.id, activeTab?.url]); 

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                showDownloads &&
                downloadBtnRef.current && 
                !downloadBtnRef.current.contains(e.target as Node) && 
                downloadPanelRef.current &&
                !downloadPanelRef.current.contains(e.target as Node)
            ) {
                setShowDownloads(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDownloads]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            navigate(input);
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleExternalOpen = () => {
        if (activeTab && activeTab.url !== 'about:blank') {
            platform.openExternal(activeTab.url);
        }
    };

    const isBookmarked = activeTab && bookmarks.some(b => b.url === activeTab.url);
    const activeDownloads = downloads.filter(d => d.status === 'downloading').length;

    return (
        <div className="h-12 bg-[#27272a] border-b border-[#18181b] flex items-center px-2 gap-2 flex-none relative z-30">
            {/* Nav Controls */}
            <div className="flex items-center gap-1">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#3f3f46] rounded-md disabled:opacity-30" disabled={!activeTab?.canGoBack}>
                    <ArrowLeft size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#3f3f46] rounded-md disabled:opacity-30" disabled={!activeTab?.canGoForward}>
                    <ArrowRight size={16} />
                </button>
                <button onClick={reload} className="p-2 text-gray-400 hover:text-white hover:bg-[#3f3f46] rounded-md">
                    <RotateCw size={16} className={activeTab?.isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Omnibox */}
            <div className={`
                flex-1 flex items-center h-8 bg-[#18181b] border rounded-full px-3 transition-colors relative
                ${isFocused ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-[#3f3f46] hover:border-[#52525b]'}
            `}>
                <div className="text-gray-500 mr-2">
                    {activeTab?.url.startsWith('https') ? <Lock size={12} className="text-green-500" /> : <Search size={12} />}
                </div>
                
                <input 
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-600 font-normal"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={t('browser.placeholder')}
                />

                <div className="flex items-center gap-1">
                    {activeTab && activeTab.url !== 'about:blank' && (
                        <button 
                            onClick={() => toggleBookmark(activeTab.url, activeTab.title)}
                            className={`p-1 rounded-full hover:bg-[#3f3f46] transition-colors ${isBookmarked ? 'text-yellow-400' : 'text-gray-500'}`}
                        >
                            <Star size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                 {/* Downloads Toggle */}
                 <div className="relative">
                     <button
                        ref={downloadBtnRef}
                        onClick={() => setShowDownloads(!showDownloads)}
                        className={`
                            p-2 rounded-md transition-colors relative
                            ${showDownloads ? 'bg-[#3f3f46] text-white' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}
                        `}
                        title="Downloads"
                     >
                         <CloudDownload size={16} className={activeDownloads > 0 ? 'text-blue-400' : ''} />
                         {activeDownloads > 0 && (
                             <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse border border-[#27272a]" />
                         )}
                     </button>
                     
                     {showDownloads && (
                         <div ref={downloadPanelRef} className="absolute top-full right-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                             <DownloadsPanel />
                         </div>
                     )}
                 </div>

                 <button 
                    onClick={handleExternalOpen}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#3f3f46] rounded-md"
                    title={t('browser.open_external')}
                >
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    );
};
