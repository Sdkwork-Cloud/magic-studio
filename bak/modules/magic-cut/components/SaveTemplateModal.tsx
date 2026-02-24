
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, LayoutTemplate, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { SettingInput, SettingTextArea, SettingToggle } from '../../settings/components/SettingsWidgets';
import { TemplateMetadata } from '../entities/magicCut.entity';
import { ImageUpload } from '../../../components/upload';
import { logger } from '../utils/logger';

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
                                    onChange={(f) => setCoverUrl(f.url)}
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
                            <SettingInput 
                                label="Template Name"
                                value={name}
                                onChange={setName}
                                placeholder="e.g. Cinematic Vlog Intro"
                                fullWidth
                                error={!name.trim() ? "Name is required" : undefined}
                            />
                            
                            <SettingTextArea 
                                label="Description"
                                value={description}
                                onChange={setDescription}
                                placeholder="Describe what this template is for..."
                                rows={3}
                                fullWidth
                            />
                            
                            <div className="h-[1px] bg-[#333] my-2" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <SettingToggle 
                                    label="Public Template"
                                    description="Share this template with the community market."
                                    checked={isPublic}
                                    onChange={setIsPublic}
                                />
                                
                                <div className={!isPublic ? 'opacity-50 pointer-events-none' : ''}>
                                     <SettingInput 
                                        label="Price ($)"
                                        value={price}
                                        onChange={setPrice}
                                        type="number"
                                        placeholder="0.00"
                                        fullWidth
                                        description="Set to 0 for free templates."
                                    />
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
