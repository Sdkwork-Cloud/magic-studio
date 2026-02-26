
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LayoutGrid, Check } from 'lucide-react';
import { Button } from '@sdkwork/react-commons';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { SettingInput, SettingTextArea } from '@sdkwork/react-settings';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
    const { addWorkspace } = useWorkspaceStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        try {
            await addWorkspace(name, description);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-white/5 bg-[#1e1e20] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <LayoutGrid size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base">New Workspace</h3>
                            <p className="text-xs text-gray-500">Organize your projects and assets</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <SettingInput 
                        label="Workspace Name" 
                        value={name} 
                        onChange={setName} 
                        fullWidth 
                        placeholder="e.g. My Creative Studio"
                        autoFocus
                    />
                    <SettingTextArea 
                        label="Description (Optional)" 
                        value={description} 
                        onChange={setDescription} 
                        rows={3} 
                        fullWidth 
                        placeholder="What is this workspace for?"
                    />
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-white/5 bg-[#1e1e20] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} className="bg-white/5 hover:bg-white/10 border-white/10 text-gray-300">Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || isSubmitting}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 text-white shadow-lg shadow-blue-900/20"
                    >
                        {isSubmitting ? 'Creating...' : <><Check size={16} className="mr-2" /> Create Workspace</>}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
