
import { Button } from '@sdkwork/react-commons';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText } from 'lucide-react';

interface NoteEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    initialContent: string;
    onSave: (content: string) => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ 
    isOpen, onClose, title = "Story Summary", initialContent, onSave 
}) => {
    const [content, setContent] = useState(initialContent);

    React.useEffect(() => {
        if (isOpen) setContent(initialContent);
    }, [isOpen, initialContent]);

    const handleSave = () => {
        onSave(content);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-6"
            onClick={e => e.stopPropagation()}
        >
            <div 
                className="w-full max-w-4xl h-[85vh] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                        <FileText size={20} className="text-blue-500" />
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative bg-[#111] p-4">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full bg-transparent text-gray-200 resize-none outline-none font-mono text-sm leading-relaxed"
                        placeholder="Enter story summary..."
                    />
                </div>

                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleSave} 
                        className="bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-900/20 px-8 font-bold"
                    >
                        <Save size={16} className="mr-2" /> Save Changes
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
