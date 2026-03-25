
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Box, Video, Music, Check, AlertCircle } from 'lucide-react';
import { ProjectType, Button, ImageUpload } from '@sdkwork/react-commons';
import { useTranslation } from '@sdkwork/react-i18n';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { SettingInput, SettingTextArea } from '@sdkwork/react-settings';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialType?: ProjectType;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, initialType = 'APP' }) => {
    const { addProject, currentWorkspace } = useWorkspaceStore();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ProjectType>(initialType);
    const [coverFile, setCoverFile] = useState<{ data: Uint8Array | File, name: string, url: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const projectTypes = useMemo(() => ([
        {
            id: 'APP' as ProjectType,
            label: t('workspaceDialogs.createProject.types.application.label'),
            icon: Box,
            desc: t('workspaceDialogs.createProject.types.application.description'),
            color: 'text-blue-500',
        },
        {
            id: 'VIDEO' as ProjectType,
            label: t('workspaceDialogs.createProject.types.video.label'),
            icon: Video,
            desc: t('workspaceDialogs.createProject.types.video.description'),
            color: 'text-pink-500',
        },
        {
            id: 'AUDIO' as ProjectType,
            label: t('workspaceDialogs.createProject.types.audio.label'),
            icon: Music,
            desc: t('workspaceDialogs.createProject.types.audio.description'),
            color: 'text-indigo-500',
        },
    ]), [t]);

    useEffect(() => {
        if (isOpen) {
            // Default to APP if initialType was one of the removed types
            const validType = projectTypes.find(projectType => projectType.id === initialType) ? initialType : 'APP';
            setType(validType);
            setName('');
            setDescription('');
            setCoverFile(null);
            setError(null);
        }
    }, [initialType, isOpen, projectTypes]);

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
        } catch (error: unknown) {
            console.error("Create project failed:", error);
            setError(error instanceof Error ? error.message : t('workspaceDialogs.createProject.createFailed'));
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
                className="w-full max-w-2xl bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-white/5 bg-[#1e1e20] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <Box size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base">{t('workspaceDialogs.createProject.title')}</h3>
                            <p className="text-xs text-gray-500">
                                {t('workspaceDialogs.createProject.subtitle', {
                                    workspace: currentWorkspace?.name || t('workspaceDialogs.createProject.workspaceFallback'),
                                })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Project Type Grid */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">{t('workspaceDialogs.createProject.typeLabel')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {projectTypes.map(projectType => (
                                <button
                                    key={projectType.id}
                                    onClick={() => setType(projectType.id)}
                                    className={`
                                        flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                                        ${type === projectType.id 
                                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' 
                                            : 'bg-[#252526] border-[#333] hover:border-[#555] hover:bg-[#2a2a2d]'
                                        }
                                    `}
                                >
                                    <div className={`p-2 rounded-lg bg-[#1e1e1e] border border-[#333] ${projectType.color}`}>
                                        <projectType.icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-sm font-bold mb-0.5 ${type === projectType.id ? 'text-white' : 'text-gray-300'}`}>{projectType.label}</div>
                                        <div className="text-[10px] text-gray-500 leading-tight">{projectType.desc}</div>
                                    </div>
                                    {type === projectType.id && <div className="ml-auto text-blue-500"><Check size={16} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-4">
                                <SettingInput 
                                    label={t('workspaceDialogs.createProject.nameLabel')} 
                                    value={name} 
                                    onChange={setName} 
                                    fullWidth 
                                    placeholder={t('workspaceDialogs.createProject.namePlaceholder')}
                                    autoFocus
                                />
                                <SettingTextArea 
                                    label={t('workspaceDialogs.createProject.descriptionLabel')} 
                                    value={description} 
                                    onChange={setDescription} 
                                    rows={2} 
                                    fullWidth 
                                    placeholder={t('workspaceDialogs.createProject.descriptionPlaceholder')}
                                />
                            </div>
                            <div className="w-[180px]">
                                <label className="block text-sm font-medium leading-none text-gray-400 mb-2">{t('workspaceDialogs.createProject.coverLabel')}</label>
                                <div className="aspect-video w-full">
                                    <ImageUpload
                                        value={coverFile?.url}
                                        onChange={(f) => setCoverFile(f)}
                                        onRemove={() => setCoverFile(null)}
                                        className="h-full bg-[#111] border border-[#333]"
                                        label={t('workspaceDialogs.createProject.uploadCover')}
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
                <div className="flex-none px-6 py-4 border-t border-white/5 bg-[#1e1e20] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="bg-white/5 hover:bg-white/10 border-white/10 text-gray-300">{t('common.actions.cancel')}</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || isSubmitting}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 text-white shadow-lg shadow-purple-900/20"
                    >
                        {isSubmitting ? t('workspaceDialogs.createProject.creating') : <><Check size={16} className="mr-2" /> {t('workspaceDialogs.createProject.confirm')}</>}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
