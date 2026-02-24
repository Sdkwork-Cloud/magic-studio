
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Box, Video, Music, Check, AlertCircle } from 'lucide-react';
import { ProjectType, Button, ImageUpload } from 'sdkwork-react-commons';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { SettingInput, SettingTextArea } from 'sdkwork-react-settings';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialType?: ProjectType;
}

const PROJECT_TYPES: { id: ProjectType; label: string; icon: any; desc: string; color: string }[] = [
    { id: 'APP', label: 'Application', icon: Box, desc: 'Full-stack web or desktop app', color: 'text-blue-500' },
    { id: 'VIDEO', label: 'Video Project', icon: Video, desc: 'AI video generation & editing', color: 'text-pink-500' },
    { id: 'AUDIO', label: 'Audio Project', icon: Music, desc: 'Music & speech generation', color: 'text-indigo-500' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, initialType = 'APP' }) => {
    const { addProject, currentWorkspace } = useWorkspaceStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ProjectType>(initialType);
    const [coverFile, setCoverFile] = useState<{ data: Uint8Array | File, name: string, url: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Default to APP if initialType was one of the removed types
            const validType = PROJECT_TYPES.find(t => t.id === initialType) ? initialType : 'APP';
            setType(validType);
            setName('');
            setDescription('');
            setCoverFile(null);
            setError(null);
        }
    }, [isOpen, initialType]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            let data: Uint8Array | undefined;
            if (coverFile) {
                if (coverFile.data instanceof File) {
                    const buf = await coverFile.data.arrayBuffer();
                    data = new Uint8Array(buf);
                } else {
                    data = coverFile.data;
                }
            }
            
            await addProject(
                name, 
                type, 
                description, 
                data && coverFile ? { data, name: coverFile.name } : undefined
            );
            onClose();
        } catch (e: any) {
            console.error("Create project failed:", e);
            setError(e.message || "Failed to create project");
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
                className="w-full max-w-2xl bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-600/30 text-purple-500">
                            <Box size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base">New Project</h3>
                            <p className="text-xs text-gray-400">
                                In {currentWorkspace?.name || 'Workspace'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Project Type Grid */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Project Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {PROJECT_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setType(t.id)}
                                    className={`
                                        flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                                        ${type === t.id 
                                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' 
                                            : 'bg-[#252526] border-[#333] hover:border-[#555] hover:bg-[#2a2a2d]'
                                        }
                                    `}
                                >
                                    <div className={`p-2 rounded-lg bg-[#1e1e1e] border border-[#333] ${t.color}`}>
                                        <t.icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-sm font-bold mb-0.5 ${type === t.id ? 'text-white' : 'text-gray-300'}`}>{t.label}</div>
                                        <div className="text-[10px] text-gray-500 leading-tight">{t.desc}</div>
                                    </div>
                                    {type === t.id && <div className="ml-auto text-blue-500"><Check size={16} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-4">
                                <SettingInput 
                                    label="Project Name" 
                                    value={name} 
                                    onChange={setName} 
                                    fullWidth 
                                    placeholder="e.g. NextGen Dashboard"
                                    autoFocus
                                />
                                <SettingTextArea 
                                    label="Description (Optional)" 
                                    value={description} 
                                    onChange={setDescription} 
                                    rows={2} 
                                    fullWidth 
                                    placeholder="Briefly describe your project..."
                                />
                            </div>
                            <div className="w-[180px]">
                                <label className="block text-sm font-medium leading-none text-gray-400 mb-2">Cover Image</label>
                                <div className="aspect-video w-full">
                                    <ImageUpload
                                        value={coverFile?.url}
                                        onChange={(f) => setCoverFile(f)}
                                        onRemove={() => setCoverFile(null)}
                                        className="h-full bg-[#111] border border-[#333]"
                                        label="Upload Cover"
                                        aspectRatio="aspect-video"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-500 border-0"
                    >
                        {isSubmitting ? 'Creating...' : <><Check size={16} className="mr-2" /> Create Project</>}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
