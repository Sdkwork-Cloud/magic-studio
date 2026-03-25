
import { Button } from '@sdkwork/react-commons'
import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, FolderOpen } from 'lucide-react';
;
import { useMagicCutTranslation } from '../hooks/useMagicCutTranslation';

interface LoadTemplateConfirmModalProps {
    isOpen: boolean;
    templateName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const LoadTemplateConfirmModal: React.FC<LoadTemplateConfirmModalProps> = ({ 
    isOpen, templateName, onClose, onConfirm 
}) => {
    const { t, tc } = useMagicCutTranslation();
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div 
                className="w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-yellow-500">
                            <AlertTriangle size={20} />
                         </div>
                         <div>
                             <h3 className="text-white font-bold text-lg">{t('loadTemplate.title')}</h3>
                         </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {t('loadTemplate.confirmMessage', { name: templateName })}
                    </p>
                    <p className="text-xs text-gray-500 mt-3 bg-[#252526] p-3 rounded-lg border border-[#333] flex gap-2 items-start">
                        <FolderOpen size={14} className="mt-0.5 shrink-0" />
                        {t('loadTemplate.warning')}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>{tc('cancel')}</Button>
                    <Button 
                        onClick={() => { onConfirm(); onClose(); }} 
                        className="bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-900/20"
                    >
                        {t('loadTemplate.confirm')}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

