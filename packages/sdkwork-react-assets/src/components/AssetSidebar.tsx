
import { AssetType } from '../entities/asset.entity'
import { ASSET_CATEGORIES } from '../services/assetService'
import React from 'react';
import { useAssetStore } from '../store/assetStore';
import {
    Image, Video, Music, Mic, LayoutGrid, FileAudio,
    Volume2, Smile, Upload, Sparkles, FolderOpen
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

export const AssetSidebar: React.FC = () => {
    const {
        filterType, setFilterType,
        filterOrigin, setFilterOrigin,
        allowedTypes
    } = useAssetStore();
    const { t } = useTranslation(); // eslint-disable-line @typescript-eslint/no-unused-vars

    const getIcon = (id: string) => {
        switch (id) {
            case 'all': return <LayoutGrid size={16} />;
            case 'image': return <Image size={16} />;
            case 'video': return <Video size={16} />;
            case 'character': return <Smile size={16} />;
            case 'audio': return <FileAudio size={16} />;
            case 'music': return <Music size={16} />;
            case 'voice': return <Mic size={16} />;
            case 'speech': return <Volume2 size={16} />;
            default: return <LayoutGrid size={16} />;
        }
    };

    return (
        <div className="w-full bg-[#18181b] flex flex-col p-3 select-none h-full gap-6">
            
            {/* Source Filters */}
            <div className="space-y-1">
                 <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">Source</h2>
                 <SidebarItem 
                    id="all"
                    label="All Assets"
                    active={filterOrigin === 'all'}
                    onClick={() => setFilterOrigin('all')}
                    icon={<FolderOpen size={16} />}
                 />
                 <SidebarItem 
                    id="upload"
                    label="My Uploads"
                    active={filterOrigin === 'upload'}
                    onClick={() => setFilterOrigin('upload')}
                    icon={<Upload size={16} />}
                 />
                 <SidebarItem 
                    id="ai"
                    label="AI Generated"
                    active={filterOrigin === 'ai'}
                    onClick={() => setFilterOrigin('ai')}
                    icon={<Sparkles size={16} />}
                 />
            </div>

            <div className="h-[1px] bg-[#27272a] mx-2" />

            {/* Type Filters */}
            <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">Type</h2>
                <SidebarItem 
                    id="all-types" 
                    label="All Types" 
                    active={filterType === 'all'} 
                    onClick={() => setFilterType('all')} 
                    icon={<LayoutGrid size={16} />}
                />
                
                {ASSET_CATEGORIES.map(cat => {
                    // Check if disabled by allowedTypes constraint
                    const isDisabled = allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(cat.id as AssetType);
                    
                    if (isDisabled) return null; // Hide completely if specific types requested

                    return (
                        <SidebarItem 
                            key={cat.id}
                            id={cat.id}
                            label={cat.label}
                            active={filterType === cat.id}
                            onClick={() => setFilterType(cat.id as AssetType)}
                            icon={getIcon(cat.id)}
                            disabled={isDisabled}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const SidebarItem = ({ id: _id, label, active, onClick, icon, disabled }: any) => ( // eslint-disable-line @typescript-eslint/no-unused-vars
    <button
        onClick={() => !disabled && onClick()}
        disabled={disabled}
        className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group
            ${active
                ? 'bg-blue-600/10 text-blue-400'
                : disabled
                    ? 'text-gray-600 cursor-not-allowed opacity-60'
                    : 'text-gray-400 hover:bg-[#27272a] hover:text-gray-200'
            }
        `}
    >
        <span className={`transition-colors ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
            {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
    </button>
);
