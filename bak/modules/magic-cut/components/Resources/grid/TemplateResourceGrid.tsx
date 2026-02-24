
import React from 'react';
import { CutTemplate } from '../../../entities/magicCut.entity';
import { Box, Play, Clock, ArrowRight } from 'lucide-react';

interface TemplateResourceGridProps {
    templates: CutTemplate[];
    onLoadTemplate: (template: CutTemplate) => void;
}

export const TemplateResourceGrid: React.FC<TemplateResourceGridProps> = ({
    templates,
    onLoadTemplate
}) => {
    return (
        <div className="grid grid-cols-2 gap-2 content-start pb-10 px-1">
            {templates.map((tmpl) => (
                <div 
                    key={tmpl.id}
                    className="group relative bg-[#252526] border border-[#333] hover:border-[#555] rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg flex flex-col"
                >
                    {/* Preview Area */}
                    <div className="aspect-video bg-[#1e1e1e] relative flex items-center justify-center overflow-hidden">
                        {tmpl.thumbnailUrl ? (
                            <img src={tmpl.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={tmpl.name} />
                        ) : (
                            <Box size={24} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                        )}
                        
                        {/* Overlay Action */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                            <button 
                                onClick={() => onLoadTemplate(tmpl)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                            >
                                <Play size={10} fill="currentColor" /> Open
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                        <h4 className="text-[10px] font-bold text-gray-200 truncate" title={tmpl.name}>{tmpl.name}</h4>
                        <p className="text-[8px] text-gray-500 line-clamp-2 mt-0.5 h-[2.2em] leading-relaxed">
                            {tmpl.description || "No description"}
                        </p>
                        
                        <div className="mt-1.5 pt-1.5 border-t border-[#333] flex justify-between items-center text-[8px] text-gray-600">
                             <span className="flex items-center gap-1">
                                 <Clock size={8} />
                                 {new Date(tmpl.updatedAt).toLocaleDateString()}
                             </span>
                             <span className="bg-[#333] px-1 py-0.5 rounded text-gray-400">
                                 v{tmpl.projectData.version}
                             </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
