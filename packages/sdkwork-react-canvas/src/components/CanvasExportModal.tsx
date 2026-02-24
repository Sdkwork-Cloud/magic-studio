
import { Button } from 'sdkwork-react-commons'
import { CanvasExportMode } from '../entities/canvas.entity'
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clapperboard, Layers, Image as ImageIcon, Video, ArrowRight } from 'lucide-react'; 
interface CanvasExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mode: CanvasExportMode) => void;
}

export const CanvasExportModal: React.FC<CanvasExportModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedMode, setSelectedMode] = useState<CanvasExportMode>('video_only');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(selectedMode);
        onClose();
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#27272a] bg-[#252526] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 text-pink-500">
                             <Clapperboard size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight">Export to Magic Cut</h3>
                            <p className="text-xs text-gray-400">Convert canvas to timeline</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-300 font-medium mb-2">Select content to export:</p>
                    
                    <div className="space-y-3">
                        <ExportOption 
                            mode="video_only" 
                            label="Video Only" 
                            description="Filter only video elements for the timeline."
                            icon={<Video size={18} />}
                            isSelected={selectedMode === 'video_only'}
                            onSelect={() => setSelectedMode('video_only')}
                        />
                        <ExportOption 
                            mode="mixed" 
                            label="Images & Videos" 
                            description="Include all visual media elements."
                            icon={<Layers size={18} />}
                            isSelected={selectedMode === 'mixed'}
                            onSelect={() => setSelectedMode('mixed')}
                        />
                        <ExportOption 
                            mode="image_only" 
                            label="Images Only" 
                            description="Create a slideshow from image elements."
                            icon={<ImageIcon size={18} />}
                            isSelected={selectedMode === 'image_only'}
                            onSelect={() => setSelectedMode('image_only')}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#27272a] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} className="bg-[#333] border-[#444] text-white hover:bg-[#444]">Cancel</Button>
                    <Button 
                        onClick={handleConfirm}
                        className="bg-pink-600 hover:bg-pink-500 text-white font-bold border-0 shadow-lg shadow-pink-900/20 gap-2"
                    >
                        Export <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ExportOption: React.FC<{ 
    mode: CanvasExportMode; 
    label: string; 
    description: string; 
    icon: React.ReactNode; 
    isSelected: boolean; 
    onSelect: () => void 
}> = ({ label, description, icon, isSelected, onSelect }) => (
    <button 
        onClick={onSelect}
        className={`
            w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group
            ${isSelected 
                ? 'bg-pink-500/10 border-pink-500 shadow-inner' 
                : 'bg-[#18181b] border-[#333] hover:border-[#555] hover:bg-[#222]'
            }
        `}
    >
        <div className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0
            ${isSelected ? 'bg-pink-500 text-white shadow-lg' : 'bg-[#2a2a2c] text-gray-400 group-hover:text-gray-200'}
        `}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold mb-0.5 ${isSelected ? 'text-pink-400' : 'text-gray-200'}`}>{label}</h4>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
            ${isSelected ? 'border-pink-500 bg-pink-500 text-white' : 'border-[#444] group-hover:border-[#666]'}
        `}>
            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
    </button>
);
