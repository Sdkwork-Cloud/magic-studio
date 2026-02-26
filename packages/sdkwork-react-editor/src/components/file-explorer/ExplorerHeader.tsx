
import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, RefreshCw, Search, MinusSquare, 
    FilePlus, FolderPlus, FileUp, FileArchive, Download,
    Share, Github, Rocket, ChevronDown
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useTranslation } from '@sdkwork/react-i18n';

interface ExplorerHeaderProps {
  hasRoot: boolean;
  onRefresh: () => void;
  onToggleSearch: () => void;
  isSearchActive: boolean;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  // New props for triggering modals
  onSyncToGitHub: () => void;
  onPublishApp: () => void;
}

export const ExplorerHeader: React.FC<ExplorerHeaderProps> = ({ 
  hasRoot, onRefresh, onToggleSearch, isSearchActive, onCreateFile, onCreateFolder,
  onSyncToGitHub, onPublishApp
}) => {
  const { collapseAll, uploadFiles, uploadZip, downloadWorkspaceAsZip } = useEditorStore();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  
  const createMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
      action();
      setIsCreateMenuOpen(false);
      setIsShareMenuOpen(false);
  };

  return (
    <div className="h-[40px] flex items-center justify-between pl-4 pr-2 bg-gray-50 dark:bg-[#252526] border-b border-gray-200 dark:border-[#333] flex-none select-none relative z-30 transition-colors duration-200">
      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">
        {t('editor.explorer.title')}
      </span>
      
      {/* Buttons */}
      <div className={`flex items-center relative gap-0.5 ${!hasRoot ? 'opacity-70' : ''}`}>
          
          {/* Share/Publish Dropdown */}
          <div className="relative" ref={shareMenuRef}>
              <button
                 onClick={(e) => { e.stopPropagation(); setIsShareMenuOpen(!isShareMenuOpen); }}
                 className={`p-1 rounded transition-colors pointer-events-auto ${isShareMenuOpen ? 'bg-gray-200 dark:bg-[#333] text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#333]'}`}
                 title={t('editor.explorer.project_actions')}
                 disabled={!hasRoot}
              >
                  <Share size={14} />
              </button>

              {isShareMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#454545] rounded-lg shadow-2xl z-50 flex flex-col py-1 animate-in fade-in duration-100">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('editor.explorer.project_actions')}</div>
                      <MenuOption onClick={() => handleAction(onSyncToGitHub)} icon={<Github size={14} />} label={t('editor.explorer.git.title')} disabled={!hasRoot} />
                      <MenuOption onClick={() => handleAction(onPublishApp)} icon={<Rocket size={14} />} label={t('editor.explorer.publish.title')} disabled={!hasRoot} />
                      <div className="h-[1px] bg-gray-100 dark:bg-[#333] my-1 mx-2" />
                      <MenuOption onClick={() => handleAction(downloadWorkspaceAsZip)} icon={<Download size={14} />} label={t('editor.explorer.download_zip')} disabled={!hasRoot} />
                  </div>
              )}
          </div>

          {/* Create Dropdown */}
          <div className="relative" ref={createMenuRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCreateMenuOpen(!isCreateMenuOpen); }}
              className={`p-1 rounded transition-colors pointer-events-auto ${isCreateMenuOpen ? 'bg-gray-200 dark:bg-[#333] text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#333]'}`}
              title={t('common.actions.create') + "..."}
            >
                <Plus size={14} />
            </button>
            
            {isCreateMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#454545] rounded-lg shadow-2xl z-50 flex flex-col py-1 animate-in fade-in duration-100">
                <MenuOption onClick={() => handleAction(uploadFiles)} icon={<FileUp size={14} />} label={t('editor.explorer.upload_files')} disabled={!hasRoot} />
                <MenuOption onClick={() => handleAction(uploadZip)} icon={<FileArchive size={14} />} label={t('editor.explorer.upload_archive')} disabled={!hasRoot} />
                <div className="h-[1px] bg-gray-100 dark:bg-[#333] my-1 mx-2" />
                <MenuOption onClick={() => handleAction(onCreateFile)} icon={<FilePlus size={14} />} label={t('editor.explorer.new_file')} disabled={!hasRoot} />
                <MenuOption onClick={() => handleAction(onCreateFolder)} icon={<FolderPlus size={14} />} label={t('editor.explorer.new_folder')} disabled={!hasRoot} />
              </div>
            )}
          </div>

          <button onClick={onRefresh} disabled={!hasRoot} className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent" title={t('common.actions.refresh')}>
              <RefreshCw size={13} />
          </button>
          <button onClick={collapseAll} disabled={!hasRoot} className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent" title={t('editor.explorer.collapse_all')}>
              <MinusSquare size={13} />
          </button>
          <button onClick={onToggleSearch} disabled={!hasRoot} className={`p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent ${isSearchActive ? 'text-blue-600 dark:text-blue-400 bg-gray-200 dark:bg-[#333]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title={t('common.actions.search')}>
              <Search size={13} />
          </button>
      </div>
    </div>
  );
};

const MenuOption: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean }> = ({ onClick, icon, label, disabled }) => (
    <button 
        onClick={() => { if(!disabled) onClick(); }} 
        disabled={disabled}
        className={`
            flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors w-full
            ${disabled ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-[#cccccc] hover:bg-blue-50 dark:hover:bg-[#094771] hover:text-blue-700 dark:hover:text-white'}
        `}
    >
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
    </button>
);
