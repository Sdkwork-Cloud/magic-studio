
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LayoutGrid, Check } from 'lucide-react';
import { Button } from '../../../../components/Button/Button';
import { useWorkspaceStore } from '../../../../store/workspaceStore';
import { SettingInput, SettingTextArea } from '../../../settings/components/SettingsWidgets';

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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-600/30 text-blue-500">
                            <LayoutGrid size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base">New Workspace</h3>
                            <p className="text-xs text-gray-400">Organize your projects and assets</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
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
                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-500 border-0"
                    >
                        {isSubmitting ? 'Creating...' : <><Check size={16} className="mr-2" /> Create Workspace</>}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
