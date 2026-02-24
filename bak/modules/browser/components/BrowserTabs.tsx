
import React from 'react';
import { X, Plus, Globe } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { browserService } from '../services/browserService';

export const BrowserTabs: React.FC = () => {
    const { tabs, activeTabId, setActiveTab, closeTab, createTab } = useBrowserStore();

    return (
        <div className="flex items-end h-10 bg-[#18181b] px-2 pt-1 gap-1 overflow-x-auto no-scrollbar border-b border-[#27272a] select-none">
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                const favicon = tab.url !== 'about:blank' ? browserService.getFaviconUrl(tab.url) : null;

                return (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            group relative flex items-center min-w-[160px] max-w-[240px] h-9 px-3 rounded-t-lg cursor-pointer transition-all duration-150 border-r border-[#27272a]/50
                            ${isActive 
                                ? 'bg-[#27272a] text-gray-100 z-10' 
                                : 'bg-transparent text-gray-500 hover:bg-[#27272a]/50 hover:text-gray-300'
                            }
                        `}
                    >
                        {/* Icon */}
                        <div className="mr-2 flex-shrink-0 flex items-center justify-center w-4 h-4">
                            {tab.isLoading ? (
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : favicon ? (
                                <img src={favicon} alt="" className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                            ) : (
                                <Globe size={14} className="opacity-70" />
                            )}
                        </div>

                        {/* Title */}
                        <span className="text-xs truncate flex-1 font-medium">{tab.title || 'New Tab'}</span>

                        {/* Close */}
                        <button
                            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                            className={`
                                ml-1 p-0.5 rounded-md hover:bg-[#3f3f46] hover:text-white transition-opacity
                                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}
                        >
                            <X size={12} />
                        </button>
                        
                        {/* Active Indicator Line */}
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />}
                    </div>
                );
            })}

            <button 
                onClick={() => createTab()}
                className="p-1.5 hover:bg-[#27272a] rounded-md text-gray-500 hover:text-white transition-colors mb-1 ml-1"
                title="New Tab"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};
