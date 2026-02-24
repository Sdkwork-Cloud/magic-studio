
import React from 'react';
import { createPortal } from 'react-dom';
import { MagicCutEditor, MagicCutEditorProps } from './MagicCutEditor';
import { X } from 'lucide-react';

interface MagicCutModalProps extends MagicCutEditorProps {
    onClose: () => void;
    isOpen: boolean;
}

export const MagicCutModal: React.FC<MagicCutModalProps> = ({ 
    isOpen, onClose, ...editorProps 
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[95vw] h-[95vh] bg-[#09090b] rounded-xl shadow-2xl border border-[#333] overflow-hidden flex flex-col">
                
                {/* Modal Header */}
                <div className="h-10 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between px-4 select-none">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Magic Cut Editor</span>
                    <button onClick={onClose} className="p-1 hover:bg-[#333] rounded text-gray-500 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <MagicCutEditor {...editorProps} minimal={true} />
                </div>
            </div>
        </div>,
        document.body
    );
};

