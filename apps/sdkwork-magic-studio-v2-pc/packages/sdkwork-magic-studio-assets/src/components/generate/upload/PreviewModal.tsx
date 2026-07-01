
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Music } from 'lucide-react';
import { useAssetUrl } from '../../../hooks/useAssetUrl';

export interface PreviewData {
    url: string;
    type: 'image' | 'video' | 'audio';
    title?: string;
}

interface PreviewModalProps {
    data: PreviewData | null;
    onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ data, onClose }) => {
    const { url: displayUrl, loading } = useAssetUrl(data?.url);
    if (!data) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-4xl bg-[#121212] border border-[#333] rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col items-center gap-6" 
                onClick={e => e.stopPropagation()}
            >
                 <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-[#222] hover:bg-[#333] rounded-full transition-colors z-50"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-gray-200 w-full text-center pr-8 truncate">
                    {data.title || 'Preview'}
                </h3>

                <div className="flex-1 w-full flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-hidden">
                    {loading && (
                        <div className="text-sm text-gray-500">Loading preview...</div>
                    )}

                    {!loading && data.type === 'image' && displayUrl && (
                        <img 
                            src={displayUrl} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg" 
                            alt="Preview" 
                        />
                    )}

                    {!loading && data.type === 'video' && displayUrl && (
                        <video 
                            src={displayUrl} 
                            controls 
                            autoPlay 
                            className="max-w-full max-h-full rounded-lg shadow-lg"
                        />
                    )}

                    {!loading && data.type === 'audio' && displayUrl && (
                        <div className="w-full flex flex-col items-center gap-8 py-8">
                            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 animate-pulse shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <Music size={80} className="text-indigo-400" />
                            </div>
                            <audio 
                                src={displayUrl} 
                                controls 
                                autoPlay 
                                className="w-full max-w-md"
                            />
                        </div>
                    )}

                    {!loading && !displayUrl && (
                        <div className="text-sm text-red-400">Preview unavailable</div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
