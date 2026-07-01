import React from 'react';
import { File, Image, Video, Volume2, FileText } from 'lucide-react';

export interface InputAttachmentProps {
    name: string;
    type: string;
    url?: string;
    size?: number;
    onRemove?: () => void;
    onClick?: () => void;
}

const renderAttachmentIcon = (type: string): React.ReactNode => {
    if (type.startsWith('image/')) return <Image size={16} className="text-gray-400" />;
    if (type.startsWith('video/')) return <Video size={16} className="text-gray-400" />;
    if (type.startsWith('audio/')) return <Volume2 size={16} className="text-gray-400" />;
    if (type.startsWith('text/')) return <FileText size={16} className="text-gray-400" />;
    return <File size={16} className="text-gray-400" />;
};

export const InputAttachment: React.FC<InputAttachmentProps> = ({
    name,
    type,
    url: _url,
    size,
    onRemove,
    onClick,
}) => {
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
            {renderAttachmentIcon(type)}
            <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{name}</div>
                <div className="text-[10px] text-gray-500">{formatSize(size)}</div>
            </div>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
                        <path
                            d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};
