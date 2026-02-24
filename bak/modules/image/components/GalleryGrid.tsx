
import React, { useState } from 'react';
import { useImageStore } from '../store/imageStore';
import { ImageTask } from '../entities/image.entity';
import { Download, Trash2, Eye, Copy, RefreshCw, AlertCircle, Maximize2 } from 'lucide-react';
import { platform } from '../../../platform';

export const GalleryGrid: React.FC = () => {
    const { history, deleteTask } = useImageStore();
    const [previewId, setPreviewId] = useState<string | null>(null);

    const handleDownload = (task: ImageTask) => {
        const url = task.results?.[0]?.url;
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated-${task.id}.png`;
            a.click();
        }
    };

    if (history.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-[#111]">
                <div className="w-24 h-24 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
                    <Maximize2 size={40} className="opacity-20" />
                </div>
                <h3 className="text-lg font-medium text-gray-400">Start Creating</h3>
                <p className="text-sm opacity-60 mt-1">Generated images will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#111] overflow-y-auto p-6 scroll-smooth">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {history.map(task => {
                    const imageUrl = task.results?.[0]?.url;
                    
                    return (
                        <div 
                            key={task.id} 
                            className="group relative bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300"
                        >
                            {/* Image Area */}
                            <div className="aspect-square w-full bg-black/50 relative flex items-center justify-center overflow-hidden">
                                {task.status === 'pending' && (
                                    <div className="flex flex-col items-center gap-3 text-purple-400">
                                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-medium animate-pulse">Dreaming...</span>
                                    </div>
                                )}
                                
                                {task.status === 'failed' && (
                                    <div className="text-red-400 text-center p-4">
                                        <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                                        <span className="text-xs">Generation Failed</span>
                                    </div>
                                )}

                                {task.status === 'completed' && imageUrl && (
                                    <>
                                        <img 
                                            src={imageUrl} 
                                            alt={task.config.prompt} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        />
                                        
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                            <div className="self-end">
                                                <button 
                                                    onClick={() => deleteTask(task.id)}
                                                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors backdrop-blur-md"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleDownload(task)}
                                                    className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <Download size={12} /> Save
                                                </button>
                                                <button 
                                                    onClick={() => setPreviewId(task.id)}
                                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                                    title="View Full"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Metadata Footer */}
                            <div className="p-3 border-t border-[#27272a] bg-[#1c1c1f]">
                                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed" title={task.config.prompt}>
                                    {task.config.prompt}
                                </p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#27272a]/50 text-[10px] text-gray-600 font-mono">
                                    <span>{task.config.aspectRatio}</span>
                                    <span>{new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Preview */}
            {previewId && (
                <ImagePreviewModal 
                    task={history.find(t => t.id === previewId)!} 
                    onClose={() => setPreviewId(null)} 
                />
            )}
        </div>
    );
};

const ImagePreviewModal: React.FC<{ task: ImageTask; onClose: () => void }> = ({ task, onClose }) => {
    const imageUrl = task.results?.[0]?.url;
    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="max-w-[90vw] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                <div className="mt-4 flex justify-center gap-4">
                     <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur text-sm flex items-center gap-2" onClick={() => {
                         const a = document.createElement('a'); a.href = imageUrl; a.download = 'image.png'; a.click();
                     }}>
                         <Download size={16} /> Download High-Res
                     </button>
                     <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur text-sm flex items-center gap-2" onClick={() => {
                         platform.copy(task.config.prompt);
                     }}>
                         <Copy size={16} /> Copy Prompt
                     </button>
                </div>
            </div>
        </div>
    );
}
