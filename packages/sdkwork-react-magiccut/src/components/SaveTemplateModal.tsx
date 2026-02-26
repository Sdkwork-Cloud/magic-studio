
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, LayoutTemplate } from 'lucide-react';
;
;
import { Button, ImageUpload } from '@sdkwork/react-commons';
import { logger } from '@sdkwork/react-commons';
import { TemplateMetadata } from '../entities/magicCut.entity';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (metadata: TemplateMetadata) => Promise<void>;
    initialName?: string;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onConfirm, initialName = '' }) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState('');
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [price, setPrice] = useState<string>('0');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            logger.warn("Template name is required");
            return;
        }

        setIsSaving(true);
        try {
            await onConfirm({
                name,
                description,
                thumbnailUrl: coverUrl || undefined,
                isPublic,
                price: parseFloat(price) || 0
            });
            onClose();
        } catch (e) {
            console.error("Failed to save template", e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div 
                className="w-full max-w-2xl bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-[#333] rounded-lg border border-[#444]">
                            <LayoutTemplate size={20} className="text-blue-500" />
                         </div>
                         <div>
                             <h3 className="text-white font-bold text-lg">Save as Template</h3>
                             <p className="text-xs text-gray-400">Save current project structure for reuse</p>
                         </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="flex gap-6 items-start">
                        {/* Left: Cover Upload */}
                        <div className="w-1/3 flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cover Image</label>
                            <div className="aspect-video w-full bg-[#18181b] border border-[#333] rounded-lg overflow-hidden relative group">
                                <ImageUpload 
                                    value={coverUrl}
                                    onChange={(f: { url: string }) => setCoverUrl(f.url)}
                                    onRemove={() => setCoverUrl(null)}
                                    label="Upload Cover"
                                    className="w-full h-full border-0"
                                    aspectRatio="aspect-video"
                                    fit="cover"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500">
                                Recommend 16:9 ratio. Used for previews in the template gallery.
                            </p>
                        </div>

                        {/* Right: Metadata Form */}
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Template Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Cinematic Vlog Intro"
                                    className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                {!name.trim() && <p className="text-xs text-red-400">Name is required</p>}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe what this template is for..."
                                    rows={3}
                                    className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>
                            
                            <div className="h-[1px] bg-[#333] my-2" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-white">Public Template</label>
                                        <p className="text-xs text-gray-500">Share this template with the community market.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsPublic(!isPublic)}
                                        className={`w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                
                                <div className={!isPublic ? 'opacity-50 pointer-events-none' : ''}>
                                     <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price ($)</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                        <p className="text-[10px] text-gray-500">Set to 0 for free templates.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={!name.trim() || isSaving}
                        className="bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-900/20"
                    >
                        {isSaving ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Template</>}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

