
import type { Asset } from '../entities/asset.entity'
import { assetService } from '../services/assetService'
import React, { useState, useEffect } from 'react';
import { useAssetStore } from '../store/assetStore';
import { FileImage, Film, Music, Volume2, Smile, Sparkles, Upload, Trash2 } from 'lucide-react';

interface AssetGridProps {
    onPreview: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ onPreview, onDelete }) => {
    const { assets, isLoading } = useAssetStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 gap-3">
                 <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-sm">Loading library...</span>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-80 select-none">
                <div className="w-20 h-20 bg-[#252526] rounded-2xl flex items-center justify-center mb-4 border border-[#333]">
                    <FileImage size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">No assets found</p>
                <p className="text-xs opacity-60 mt-1">Upload files or generate with AI</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-6 content-start pb-20">
            {assets.map(asset => (
                <AssetCard key={asset.id} asset={asset} onClick={() => onPreview(asset)} onDelete={() => onDelete(asset)} />
            ))}
        </div>
    );
};

const AssetCard: React.FC<{ asset: Asset; onClick: () => void; onDelete: () => void }> = ({ asset, onClick, onDelete }) => {
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const resolve = async () => {
            const url = await assetService.resolveAssetUrl(asset);
            if (isMounted) setDisplayUrl(url);
        };
        resolve();
        return () => { isMounted = false; };
    }, [asset]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '';
        if (bytes < 1024) return bytes + ' B';
        const k = 1024;
        const sizes = ['KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const renderThumbnail = () => {
        if (asset.type === 'image' || asset.type === 'character' || asset.type === 'video') {
            if (displayUrl) {
                if (asset.type === 'video') {
                    return (
                         <div className="w-full h-full relative bg-black flex items-center justify-center">
                             <video src={displayUrl} className="w-full h-full object-cover" muted preload="metadata" onMouseOver={e => e.currentTarget.play().catch(()=>{})} onMouseOut={e => {e.currentTarget.pause(); e.currentTarget.currentTime=0;}} />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <Film size={24} className="text-white/50 drop-shadow-md" />
                             </div>
                         </div>
                    );
                }
                return <img src={displayUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" alt={asset.name} />;
            }
            
            // Fallback Icons
            return (
                <div className="w-full h-full bg-[#1e1e20] flex items-center justify-center text-gray-600">
                    {asset.type === 'character' ? <Smile size={32} /> : 
                     asset.type === 'video' ? <Film size={32} /> :
                     <FileImage size={32} />}
                </div>
            );
        }
        
        // Audio Types
        if (asset.type === 'audio' || asset.type === 'music' || asset.type === 'voice' || asset.type as string === 'speech') {
            return (
                <div className="w-full h-full bg-[#1e1e20] flex flex-col items-center justify-center gap-2 group-hover:bg-[#252528] transition-colors">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/5 ${asset.type === 'music' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {asset.type === 'music' ? <Music size={20} /> : <Volume2 size={20} />}
                    </div>
                </div>
            );
        }
        
        return <div className="w-full h-full bg-[#111]" />;
    };
    
    // Origin Icon
    const OriginIcon = asset.origin === 'ai' ? Sparkles : Upload;
    const originColor = asset.origin === 'ai' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

    const canDelete = asset.origin !== 'stock' && asset.origin !== 'system';

    return (
        <div 
            onClick={onClick}
            className="group relative bg-[#18181b] border border-[#27272a] hover:border-blue-500/40 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 aspect-[1/1.1] flex flex-col"
        >
            <div className="flex-1 relative overflow-hidden bg-[#111]">
                {renderThumbnail()}
                
                {/* Duration Badge */}
                {(asset.type === 'video' || asset.type === 'audio' || asset.type === 'music' || asset.type as string === 'speech') && asset.metadata.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-mono border border-white/10">
                        {Math.floor(asset.metadata.duration)}s
                    </div>
                )}
                
                {/* Origin Badge */}
                <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 border backdrop-blur-md shadow-sm ${originColor}`}>
                    <OriginIcon size={10} />
                    {asset.origin === 'ai' ? 'AI' : 'Upload'}
                </div>

                {/* Delete Button (Hover) */}
                {canDelete && (
                    <button 
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white/70 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Delete Asset"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
            
            <div className="p-3 bg-[#1e1e20] border-t border-[#27272a] relative group-hover:bg-[#252528] transition-colors">
                <h4 className="text-xs font-medium text-gray-200 truncate" title={asset.name}>
                    {asset.name}
                </h4>
                <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-[#111] px-1 rounded">
                        {asset.metadata.extension?.replace('.', '') || asset.type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{formatSize(asset.size)}</span>
                </div>
            </div>
        </div>
    );
};
