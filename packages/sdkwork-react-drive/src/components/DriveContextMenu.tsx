import React, { useEffect, useRef } from 'react';
import { DriveItem } from '../entities';
import { FileUp, FolderPlus, RefreshCw, Star, StarOff, Trash2, RotateCcw } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

interface DriveContextMenuProps {
  x: number;
  y: number;
  item?: DriveItem;
  isTrashView: boolean;
  onClose: () => void;
  onUpload: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onToggleStar: () => void;
}

export const DriveContextMenu: React.FC<DriveContextMenuProps> = ({
  x,
  y,
  item,
  isTrashView,
  onClose,
  onUpload,
  onNewFolder,
  onRefresh,
  onDelete,
  onRestore,
  onToggleStar,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Viewport bounds check
  const adjustedY = Math.min(y, window.innerHeight - 250);
  const adjustedX = Math.min(x, window.innerWidth - 200);

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedY, left: adjustedX }}
      className="fixed z-[100] w-56 bg-[#252526] border border-[#454545] shadow-2xl rounded-lg py-1.5 flex flex-col text-sm text-gray-200 animate-in fade-in duration-75 select-none"
    >
      {item ? (
        // Item Context Menu
        <>
          <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">
            {item.name}
          </div>

          {isTrashView ? (
            <>
              <MenuItem
                onClick={onRestore}
                icon={<RotateCcw size={16} className="text-green-500" />}
                label={t('drive.context_menu.restore')}
              />
              <MenuItem
                onClick={onDelete}
                icon={<Trash2 size={16} className="text-red-500" />}
                label={t('drive.context_menu.delete_forever')}
              />
            </>
          ) : (
            <>
              <MenuItem
                onClick={onToggleStar}
                icon={
                  item.isStarred ? (
                    <StarOff size={16} className="text-yellow-500" />
                  ) : (
                    <Star size={16} />
                  )
                }
                label={
                  item.isStarred
                    ? t('drive.context_menu.remove_star')
                    : t('drive.context_menu.add_star')
                }
              />
              <div className="h-[1px] bg-[#454545] my-1.5 mx-2" />
              <MenuItem
                onClick={onDelete}
                icon={<Trash2 size={16} className="text-red-400" />}
                label={t('drive.context_menu.move_trash')}
              />
            </>
          )}
        </>
      ) : (
        // Background Context Menu
        <>
          <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            {t('drive.context_menu.current_view')}
          </div>

          {!isTrashView && (
            <>
              <MenuItem
                onClick={onNewFolder}
                icon={<FolderPlus size={16} className="text-yellow-500" />}
                label={t('drive.sidebar.new_folder')}
              />
              <MenuItem
                onClick={onUpload}
                icon={<FileUp size={16} className="text-blue-500" />}
                label={t('drive.sidebar.file_upload')}
              />
              <div className="h-[1px] bg-[#454545] my-1.5 mx-2" />
            </>
          )}

          <MenuItem
            onClick={onRefresh}
            icon={<RefreshCw size={16} />}
            label={t('common.actions.refresh')}
          />
        </>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={() => {
      onClick();
    }}
    className="flex items-center gap-3 px-4 py-2 hover:bg-[#094771] hover:text-white transition-colors w-full text-left"
  >
    <span className="opacity-90">{icon}</span>
    <span>{label}</span>
  </button>
);
