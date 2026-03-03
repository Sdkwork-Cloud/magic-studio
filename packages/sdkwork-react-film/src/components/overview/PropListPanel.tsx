
import React, { useState } from 'react';
import { Box, ArrowRight, Sparkles, Plus, Loader2 } from 'lucide-react';

import { PropCard } from './PropCard';

import { useFilmStore } from '../../store/filmStore';
import { FilmProp, MediaScene } from '@sdkwork/react-commons';
import { filmService } from '../../services';
import { hasFilmAssetReference } from '../../utils/filmAssetUrlResolver';
import { importFilmAssetFromUrl } from '../../utils/filmModalAssetImport';
import {
    createFilmAssetMediaResource,
    upsertFilmRefAssetByScene
} from '../../utils/filmAssetFactories';

interface PropListPanelProps {
    props: FilmProp[];
    onEdit: (prop: FilmProp) => void;
    onAdd: () => void;
    onViewAll: () => void;
}

export const PropListPanel: React.FC<PropListPanelProps> = ({ props, onEdit, onAdd, onViewAll }) => {
    const { updateProp } = useFilmStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAll = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        
        for (const prop of props) {
            const visualAsset = prop.refAssets?.find(a => a.scene === MediaScene.PROP_VISUAL);
            if (hasFilmAssetReference(visualAsset || prop.faceImage || null)) continue;
            
            const prompt = `Prop design, ${prop.name}, ${prop.description || ''}, isolated on black background, high quality, 8k`;
            try {
                const url = await filmService.generateImage(prompt, '1:1');
                const imported = await importFilmAssetFromUrl(
                    url,
                    `${prop.name}_visual`,
                    'image',
                    {
                        origin: 'film-prop-auto-gen',
                        propUuid: prop.uuid
                    }
                );
                const newAsset = createFilmAssetMediaResource({
                    assetId: imported.assetId,
                    type: 'image',
                    scene: MediaScene.PROP_VISUAL,
                    url: imported.url,
                    fileName: `${prop.name}_visual`
                });
                
                updateProp(prop.uuid, { 
                    refAssets: upsertFilmRefAssetByScene(prop.refAssets, newAsset)
                });
            } catch (e) {
                console.error(`Failed to generate prop ${prop.name}`, e);
            }
        }
        setIsGenerating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-wider">
                    <Box size={16} /> Props
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleGenerateAll}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded-lg border border-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {isGenerating ? 'Generating...' : 'Generate All'}
                    </button>
                    <button onClick={onViewAll} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                        View All <ArrowRight size={12} />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {props.slice(0, 11).map(prop => (
                    <PropCard 
                        key={prop.uuid} 
                        prop={prop} 
                        onClick={() => onEdit(prop)} 
                    />
                ))}
                 <button 
                    onClick={onAdd}
                    className="aspect-square bg-[#121212] border-2 border-dashed border-[#27272a] hover:border-gray-500 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 transition-colors group"
                >
                     <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Plus size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Add Prop</span>
                </button>
            </div>
        </div>
    );
};
