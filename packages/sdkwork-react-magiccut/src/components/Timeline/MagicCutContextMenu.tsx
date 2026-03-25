
import React, { useEffect, useRef } from 'react';
import { 
    Scissors, Trash2, ArrowLeftToLine, ArrowRightToLine, 
    Copy, MapPin, Minimize2, ZoomIn, Clipboard
} from 'lucide-react';
import { useMagicCutTranslation } from '../../hooks/useMagicCutTranslation';

interface MagicCutContextMenuProps {
    x: number;
    y: number;
    targetType: 'clip' | 'track' | 'empty';
    targetId: string | null;
    onClose: () => void;
    onAction: (action: string, payload?: unknown) => void;
    canPaste?: boolean; // New prop
}

export const MagicCutContextMenu: React.FC<MagicCutContextMenuProps> = ({ 
    x, y, targetType, targetId, onClose, onAction, canPaste 
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { t, tc, tl } = useMagicCutTranslation();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Bounds checking
    const style = {
        top: Math.min(y, window.innerHeight - 250),
        left: Math.min(x, window.innerWidth - 200),
    };

    return (
        <div 
            ref={menuRef}
            className="fixed z-[100] w-48 bg-[#252526] border border-[#454545] shadow-2xl rounded-lg py-1 flex flex-col text-sm text-gray-200 animate-in fade-in zoom-in-95 duration-75 select-none"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            {targetType === 'clip' ? (
                <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        {t('contextMenu.headers.selectedClip')}
                    </div>
                    <MenuItem onClick={() => onAction('split')} icon={<Scissors size={14} />} label={t('contextMenu.actions.split')} shortcut="Ctrl+B" />
                    <MenuItem onClick={() => onAction('trim-start')} icon={<ArrowLeftToLine size={14} />} label={tl('trimStartToPlayhead')} shortcut="Q" />
                    <MenuItem onClick={() => onAction('trim-end')} icon={<ArrowRightToLine size={14} />} label={tl('trimEndToPlayhead')} shortcut="W" />
                    <div className="h-[1px] bg-[#454545] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('copy')} icon={<Copy size={14} />} label={tc('copy')} shortcut="Ctrl+C" />
                    <div className="h-[1px] bg-[#454545] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('delete')} icon={<Trash2 size={14} />} label={tc('delete')} danger shortcut="Del" />
                </>
            ) : targetType === 'track' ? (
                <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        {t('contextMenu.headers.trackOptions')}
                    </div>
                    <MenuItem 
                        onClick={() => onAction('paste')} 
                        icon={<Clipboard size={14} />} 
                        label={tc('paste')} 
                        shortcut="Ctrl+V" 
                        disabled={!canPaste}
                    />
                    <div className="h-[1px] bg-[#454545] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('delete-track')} icon={<Trash2 size={14} />} label={tl('deleteTrack')} danger />
                </>
            ) : (
                <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        {t('contextMenu.headers.timeline')}
                    </div>
                    <MenuItem 
                        onClick={() => onAction('paste')} 
                        icon={<Clipboard size={14} />} 
                        label={tc('paste')} 
                        shortcut="Ctrl+V" 
                        disabled={!canPaste}
                    />
                    <div className="h-[1px] bg-[#454545] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('add-marker')} icon={<MapPin size={14} />} label={tl('addMarker')} shortcut="M" />
                    <div className="h-[1px] bg-[#454545] my-1 mx-2" />
                    <MenuItem onClick={() => onAction('fit-view')} icon={<Minimize2 size={14} />} label={tl('fitToView')} shortcut="Shift+Z" />
                    <MenuItem onClick={() => onAction('zoom-in')} icon={<ZoomIn size={14} />} label={tl('zoomIn')} />
                </>
            )}
        </div>
    );
};

interface MenuItemProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
}

const MenuItem = ({ onClick, icon, label, shortcut, danger, disabled }: MenuItemProps) => (
    <button 
        onClick={(e) => { 
            if (disabled) return;
            e.stopPropagation(); 
            onClick(); 
        }}
        className={`
            flex items-center gap-3 px-3 py-2 text-xs w-full text-left transition-colors relative group
            ${disabled ? 'text-gray-600 cursor-not-allowed opacity-50' : 
              danger ? 'text-red-400 hover:bg-[#4d1f1f] hover:text-red-200' : 'text-gray-300 hover:bg-[#094771] hover:text-white'}
        `}
    >
        <span className="opacity-70 group-hover:opacity-100">{icon}</span>
        <span className="flex-1 font-medium">{label}</span>
        {shortcut && <span className="text-[10px] opacity-40 font-mono">{shortcut}</span>}
    </button>
);

