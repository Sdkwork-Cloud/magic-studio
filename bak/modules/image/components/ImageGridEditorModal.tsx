
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ImageGridEditor } from './ImageGridEditor';

interface ImageGridEditorModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
    onSave: (newUrl: string) => void;
    onUpscale?: (imgUrl: string) => void; // New Prop
}

export const ImageGridEditorModal: React.FC<ImageGridEditorModalProps> = ({ isOpen, imageUrl, onClose, onSave, onUpscale }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full h-full bg-[#050505] flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Floating Close Button */}
                <div className="absolute top-4 right-6 z-[2100]">
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-[#27272a]/80 hover:bg-[#333] text-gray-400 hover:text-white rounded-full transition-colors backdrop-blur-md border border-white/10 shadow-xl"
                        title="Close Editor"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ImageGridEditor 
                        imageUrl={imageUrl}
                        onSave={(url) => {
                            onSave(url);
                            onClose();
                        }}
                        onUpscale={onUpscale}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};
