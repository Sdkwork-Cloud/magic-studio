
import React, { useEffect, useRef } from 'react';
import { 
    FilePlus, FolderPlus, Edit2, Trash2, 
    Copy, Scissors, ClipboardPaste, ExternalLink, Link2 
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useTranslation } from 'sdkwork-react-i18n';

interface ContextMenuProps {
    x: number;
    y: number;
    isDirectory: boolean;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onCreateFile: () => void;
    onCreateFolder: () => void;
    onCopy: () => void;
    onCut: () => void;
    onPaste: () => void;
    onCopyPath: () => void;
    onCopyRelPath: () => void;
    onReveal: () => void;
}

export const ExplorerContextMenu: React.FC<ContextMenuProps> = ({ 
    x, y, isDirectory, onClose, 
    onRename, onDelete, onCreateFile, onCreateFolder,
    onCopy, onCut, onPaste, onCopyPath, onCopyRelPath, onReveal
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { internalClipboard } = useEditorStore();
    const { t } = useTranslation();
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Viewport bounds checking
    const style = { 
        top: Math.min(y, window.innerHeight - 300), 
        left: Math.min(x, window.innerWidth - 180) 
    };

    return (
        <div 
            ref={menuRef} 
            style={style} 
            className="fixed z-[100] w-52 bg-[#252526] border border-[#454545] shadow-2xl rounded-lg py-1 flex flex-col text-sm text-[#cccccc] animate-in fade-in zoom-in-95 duration-75 select-none"
        >
            {isDirectory && (
                <>
                    <MenuItem onClick={onCreateFile} icon={<FilePlus size={14} />} label={t('editor.explorer.new_file')} />
                    <MenuItem onClick={onCreateFolder} icon={<FolderPlus size={14} />} label={t('editor.explorer.new_folder')} />
                    <Separator />
                </>
            )}

            <MenuItem onClick={onCut} icon={<Scissors size={14} />} label={t('common.actions.cut')} />
            <MenuItem onClick={onCopy} icon={<Copy size={14} />} label={t('common.actions.copy')} />
            <MenuItem 
                onClick={onPaste} 
                icon={<ClipboardPaste size={14} />} 
                label={t('common.actions.paste')} 
                disabled={!internalClipboard || !isDirectory} 
            />
            
            <Separator />
            
            <MenuItem onClick={onCopyPath} icon={<Link2 size={14} />} label={t('editor.explorer.actions.copy_path')} />
            <MenuItem onClick={onCopyRelPath} icon={<Link2 size={14} />} label={t('editor.explorer.actions.copy_rel_path')} />
            
            <Separator />

            <MenuItem onClick={onRename} icon={<Edit2 size={14} />} label={t('common.actions.rename')} shortcut="F2" />
            <MenuItem onClick={onDelete} icon={<Trash2 size={14} />} label={t('common.actions.delete')} danger shortcut="Del" />

            <Separator />
            
            <MenuItem onClick={onReveal} icon={<ExternalLink size={14} />} label={t('editor.explorer.actions.reveal')} />
        </div>
    );
};

const MenuItem: React.FC<{ 
    onClick: () => void, 
    icon: React.ReactNode, 
    label: string, 
    danger?: boolean,
    disabled?: boolean,
    shortcut?: string
}> = ({ onClick, icon, label, danger, disabled, shortcut }) => (
    <button 
        onClick={() => { if (!disabled) onClick(); }} 
        disabled={disabled}
        className={`
            flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors w-full group relative
            ${disabled 
                ? 'opacity-50 cursor-not-allowed text-gray-500' 
                : danger 
                    ? 'text-red-400 hover:bg-[#4d1f1f] hover:text-red-200' 
                    : 'hover:bg-[#094771] hover:text-white'
            }
        `}
    >
        <span className="opacity-80 group-hover:opacity-100">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {shortcut && <span className="text-[10px] opacity-50 ml-2">{shortcut}</span>}
    </button>
);

const Separator = () => <div className="h-[1px] bg-[#454545] my-1 mx-2" />;
