
import { Button } from '@sdkwork/react-commons';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, FileCode } from 'lucide-react';
;
import { platform } from '@sdkwork/react-core';
import { useTranslation } from '@sdkwork/react-i18n';

interface HtmlSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
}

export const HtmlSourceModal: React.FC<HtmlSourceModalProps> = ({ isOpen, onClose, content }) => {
    const [source, setSource] = useState('');
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            // Pretty print logic could go here, but raw is often safer for copy-paste
            setSource(content);
        }
    }, [isOpen, content]);

    const handleCopy = () => {
        platform.copy(source);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-6">
            <div 
                className="w-full max-w-4xl h-[80vh] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#333] rounded-lg border border-[#444]">
                            <FileCode size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">HTML Source</h3>
                            <p className="text-xs text-gray-400">Copy this code to WeChat Official Account Editor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 relative">
                    <textarea 
                        className="w-full h-full bg-[#111] text-gray-300 font-mono text-xs p-6 resize-none focus:outline-none leading-relaxed"
                        value={source}
                        readOnly
                        spellCheck={false}
                    />
                </div>

                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button 
                        onClick={handleCopy} 
                        className={`w-32 transition-all ${copied ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {copied ? <><Check size={16} className="mr-2" /> Copied</> : <><Copy size={16} className="mr-2" /> Copy HTML</>}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
