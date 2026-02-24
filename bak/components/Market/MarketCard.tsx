
import React from 'react';
import { Download, Check, Play, Pause } from 'lucide-react';
import { Button } from '../Button/Button';

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: string;
  isInstalled: boolean;
  icon?: React.ReactNode;
  version?: string;
  previewUrl?: string;
}

interface MarketCardProps {
  item: MarketItem;
  onInstall: (id: string) => void;
  isInstalling?: boolean;
  onPreview?: (id: string) => void;
  isPlaying?: boolean;
}

export const MarketCard: React.FC<MarketCardProps> = ({ item, onInstall, isInstalling, onPreview, isPlaying }) => {
  return (
    <div className="bg-[#252526] border border-[#333] hover:border-[#444] rounded-xl p-4 flex flex-col h-full transition-all hover:shadow-lg group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center text-gray-300 overflow-hidden shrink-0 group/icon">
            {item.icon}
            
            {/* Preview Overlay */}
            {onPreview && (
                <div 
                    onClick={(e) => { e.stopPropagation(); onPreview(item.id); }}
                    className={`
                        absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer transition-opacity backdrop-blur-[1px]
                        ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/icon:opacity-100'}
                    `}
                >
                    {isPlaying ? (
                        <Pause size={16} className="text-white fill-white" />
                    ) : (
                        <Play size={16} className="text-white fill-white ml-0.5" />
                    )}
                </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-100 leading-tight line-clamp-1">{item.name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
              <span className="truncate max-w-[100px]">{item.author}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Download size={10} /> {item.downloads}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-4 flex-1 line-clamp-3">
        {item.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#333]">
        <span className="text-[10px] text-gray-600 font-mono">{item.version || 'v1.0.0'}</span>
        
        {item.isInstalled ? (
          <button 
            disabled 
            className="px-3 py-1.5 bg-[#2d2d2d] text-green-500 text-xs rounded-md font-medium flex items-center gap-1.5 cursor-default"
          >
            <Check size={12} />
            Installed
          </button>
        ) : (
          <Button 
            size="sm" 
            className="h-7 text-xs bg-[#094771] hover:bg-[#0c598c]"
            onClick={() => onInstall(item.id)}
            disabled={isInstalling}
          >
            {isInstalling ? 'Installing...' : 'Install'}
          </Button>
        )}
      </div>
    </div>
  );
};
