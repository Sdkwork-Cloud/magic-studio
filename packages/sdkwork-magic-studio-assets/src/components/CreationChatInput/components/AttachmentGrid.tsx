
import React from 'react';
import { X, FileText, Image as ImageIcon, Video, Mic, FileCode } from 'lucide-react';
import type { InputAttachmentData } from '@sdkwork/magic-studio-commons';
import { getAssetLabel } from '@sdkwork/magic-studio-commons';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { resolveInputAttachmentKey } from '../attachmentIdentity';
import { useAssetUrl } from '../../../hooks/useAssetUrl';

interface AttachmentGridProps {
    attachments: InputAttachmentData[];
    onRemove: (id: string) => void;
}

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({ attachments, onRemove }) => {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="w-full px-5 pt-5 pb-2">
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x mask-fade-right">
                {attachments.map((file, index) => (
                    <AttachmentCard
                        key={resolveInputAttachmentKey(file as any)}
                        file={file}
                        index={index}
                        onRemove={() => onRemove(resolveInputAttachmentKey(file as any))}
                    />
                ))}
            </div>
        </div>
    );
};

const resolveAttachmentCardVisual = (type: InputAttachmentData['type']) => {
    switch (type) {
        case 'image':
            return { Icon: ImageIcon, iconColor: 'text-purple-400' };
        case 'video':
            return { Icon: Video, iconColor: 'text-pink-400' };
        case 'audio':
            return { Icon: Mic, iconColor: 'text-green-400' };
        case 'script':
            return { Icon: FileText, iconColor: 'text-yellow-400' };
        default:
            return { Icon: FileCode, iconColor: 'text-gray-400' };
    }
};

const AttachmentCard: React.FC<{ file: InputAttachmentData; index: number; onRemove: () => void }> = ({ file, index, onRemove }) => {
    const { t } = useTranslation();
    const isVisual = file.type === 'image' || file.type === 'video';
    const label = getAssetLabel(index);

    // Resolve URL (supports assets://, blob:, http:)
    const { url: displayUrl } = useAssetUrl(file.url);

    // Config based on type
    const { Icon, iconColor } = resolveAttachmentCardVisual(file.type);

    return (
        <div className="relative group flex-none snap-start animate-in fade-in zoom-in-95 duration-200">
            <div className={`
                relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#121214]
                w-48 h-28 flex flex-col transition-all duration-300 group-hover:border-[#3f3f46] group-hover:shadow-2xl shadow-black/50
            `}>
                {isVisual && displayUrl ? (
                    <div className="w-full h-full relative overflow-hidden bg-black">
                        {/* 1. Blurred Background Fill (For aspect ratio filling) */}
                        <div className="absolute inset-0 z-0">
                            {file.type === 'video' ? (
                                <video src={displayUrl} className="w-full h-full object-cover opacity-30 blur-lg scale-110" muted />
                            ) : (
                                <img src={displayUrl} className="w-full h-full object-cover opacity-30 blur-lg scale-110" alt="" />
                            )}
                        </div>
                        
                        {/* 2. Main Content (Contained) */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center p-1">
                             {file.type === 'video' ? (
                                <video src={displayUrl} className="w-full h-full object-contain rounded-lg shadow-sm" muted />
                            ) : (
                                <img src={displayUrl} className="w-full h-full object-contain rounded-lg shadow-sm" alt={file.name} />
                            )}
                        </div>

                        {/* 3. Gradient Overlay for Text */}
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-[#18181b] to-[#121212]">
                        <div className={`p-2.5 rounded-xl bg-[#252526] border border-[#333] shadow-inner ${iconColor}`}>
                            <Icon size={24} />
                        </div>
                        <span className="text-[10px] text-gray-400 text-center line-clamp-2 w-full px-2 font-medium leading-relaxed">
                            {file.name}
                        </span>
                    </div>
                )}

                {/* Remove Button (Hover) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-2 right-2 z-30 p-1.5 bg-black/50 hover:bg-red-500/90 text-white/70 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md transform scale-90 group-hover:scale-100 border border-white/5"
                    title={t('assetCenter.creationInput.actions.removeAttachment')}
                >
                    <X size={12} strokeWidth={2.5} />
                </button>

                {/* Label Badge */}
                <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2">
                    <span className="bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                        {!isVisual && <Icon size={10} className={iconColor} />}
                        {label}
                    </span>
                    {isVisual && file.type === 'video' && (
                        <span className="bg-pink-500/20 border border-pink-500/30 text-[8px] font-bold text-pink-300 px-1.5 py-0.5 rounded uppercase">
                            {t('assetCenter.creationInput.preview.types.video')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
