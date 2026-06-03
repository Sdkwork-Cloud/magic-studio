
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ImageCanvasEditor } from './ImageCanvasEditor';
import type { GeneratedImageResult } from '../entities';
import type { ImageEditRequest } from '../entities';
import { imageBusinessService, persistImageGenerationResult } from '../services';

interface ImageCanvasEditorModalProps {
    isOpen: boolean;
    image: GeneratedImageResult;
    onClose: () => void;
    onSave: (result: GeneratedImageResult) => void;
}

export const ImageCanvasEditorModal: React.FC<ImageCanvasEditorModalProps> = ({ isOpen, image, onClose, onSave }) => {
    if (!isOpen) return null;
    
    const handleAIEdit = async (request: ImageEditRequest): Promise<GeneratedImageResult | null> => {
        const outcome = request.mode === 'upscale'
            ? await imageBusinessService.imageService.upscaleImage({
                source: request.source,
                mode: 'upscale',
                prompt: request.prompt,
            })
            : await imageBusinessService.imageService.editImage(request);

        return persistImageGenerationResult({
            outcome,
            name: `image-edit-${request.mode}-${Date.now()}.png`,
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
                        image={image}
                        onSave={(result) => {
                            onSave(result);
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
