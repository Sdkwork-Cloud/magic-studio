
import React from 'react';
import { Box, Package } from 'lucide-react';

import { FilmProp, useAssetUrl, MediaScene } from '@sdkwork/react-commons';

export interface PropCardProps {
    prop: FilmProp;
    onClick?: () => void;
    isSelected?: boolean;
}

export const PropCard: React.FC<PropCardProps> = ({ prop, onClick, isSelected }) => {
    const faceImageUrl = prop.faceImage?.url;
    const visualAsset = prop.refAssets?.find(a => a.scene === MediaScene.PROP_VISUAL);
    const mediaUrl = faceImageUrl || visualAsset?.url || visualAsset?.image?.url;
    const { url: displayUrl } = useAssetUrl(mediaUrl || null);

    return (
        <div 
            onClick={onClick}
            className={`
                group bg-[#1e1e1e] border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg flex flex-col h-full
                ${isSelected ? 'border-orange-500 ring-1 ring-orange-500' : 'border-[#333] hover:border-orange-500/50'}
            `}
        >
            <div className="aspect-square bg-[#111] relative overflow-hidden flex items-center justify-center p-6">
                {displayUrl ? (
                    <img 
                        src={displayUrl} 
                        className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" 
                        alt={prop.name} 
                    />
                ) : (
                    <Package size={40} className="text-gray-700 opacity-50" />
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col border-t border-[#27272a]">
                <h3 className="font-bold text-gray-200 text-xs truncate mb-1">{prop.name}</h3>
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed opacity-70">
                    {prop.description || "No description"}
                </p>
                
                {prop.tags && prop.tags.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-2">
                        {prop.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[8px] bg-[#252526] text-gray-500 px-1 rounded border border-[#333]">
                                {tag}
                            </span>
                        ))}
                     </div>
                )}
            </div>
        </div>
    );
};
