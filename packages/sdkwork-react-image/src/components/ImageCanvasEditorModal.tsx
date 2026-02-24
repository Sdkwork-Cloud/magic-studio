
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ImageCanvasEditor } from './ImageCanvasEditor';

interface ImageCanvasEditorModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
    onSave: (newUrl: string) => void;
}

export const ImageCanvasEditorModal: React.FC<ImageCanvasEditorModalProps> = ({ isOpen, imageUrl, onClose, onSave }) => {
    if (!isOpen) return null;
    
    // Mock AI Handler
    const handleAIEdit = async (_mode: string, _mask: string | null): Promise<string | null> => { // eslint-disable-line @typescript-eslint/no-unused-vars
        // In real implementation, this calls genAIService with the image and mask
        return new Promise((resolve) => {
            setTimeout(() => {
                // Just return original for mock, real app would return modified image URL
                resolve(imageUrl);
            }, 2000);
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-[95vw] h-[95vh] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-none h-10 flex items-center justify-between px-4 border-b border-[#333] bg-[#252526]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Canvas Editor</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-[#333] rounded-lg">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ImageCanvasEditor 
                        imageUrl={imageUrl}
                        onSave={(url) => {
                            onSave(url);
                            onClose();
                        }}
                        onAIEdit={handleAIEdit}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};
