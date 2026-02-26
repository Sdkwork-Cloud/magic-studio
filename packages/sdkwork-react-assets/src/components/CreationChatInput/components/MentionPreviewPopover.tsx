
import React from 'react';
import { Popover } from '@sdkwork/react-commons';
import type { InputAttachment } from '@sdkwork/react-commons';
import { Music, Video, Image as ImageIcon, FileText, Maximize2 } from 'lucide-react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { getAssetLabel } from '@sdkwork/react-commons';

interface MentionPreviewPopoverProps {
    anchorEl: HTMLElement | null;
    attachment: InputAttachment | null;
    index: number;
    onClose: () => void;
}

export const MentionPreviewPopover: React.FC<MentionPreviewPopoverProps> = ({ anchorEl, attachment, index, onClose }) => {
    if (!anchorEl || !attachment) return null;

    // Create a ref object that points to the anchor element for the Popover component
    const triggerRef = { current: anchorEl };
    const label = getAssetLabel(index);

    return (
        <Popover
            isOpen={!!anchorEl}
            onClose={onClose}
            triggerRef={triggerRef}
            width={280}
            align="center"
            offset={8}
            className="p-0 overflow-hidden bg-[#18181b] border border-[#333] shadow-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#202022] border-b border-[#27272a]">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                 <span className="text-[9px] text-gray-500 truncate max-w-[150px]">{attachment.name}</span>
            </div>

            {/* Content */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
                {attachment.url ? (
                    attachment.type === 'image' ? (
                        <img src={attachment.url} className="w-full h-full object-contain" alt={label} />
                    ) : attachment.type === 'video' ? (
                        <video src={attachment.url} className="w-full h-full object-contain" controls autoPlay muted />
                    ) : attachment.type === 'audio' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                             <Music size={32} className="text-gray-600" />
                             <audio src={attachment.url} controls className="w-[90%] h-8" />
                        </div>
                    ) : (
                        <FileText size={32} className="text-gray-600" />
                    )
                ) : (
                     <span className="text-xs text-gray-500">No preview available</span>
                )}
                
                {/* Fullscreen Hint */}
                <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-black/50 hover:bg-black/80 rounded text-white backdrop-blur-md">
                        <Maximize2 size={12} />
                    </button>
                </div>
            </div>
            
            {/* Footer Metadata */}
            <div className="px-3 py-2 text-[9px] text-gray-500 border-t border-[#27272a] bg-[#1a1a1c] flex justify-between">
                <span>Type: {attachment.type.toUpperCase()}</span>
                {attachment.size && <span>{(attachment.size / 1024).toFixed(1)} KB</span>}
            </div>
        </Popover>
    );
};
