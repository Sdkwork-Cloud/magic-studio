
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Folder, File, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { FileEntry } from 'sdkwork-react-core';
import { useEditorStore } from '../../store/editorStore';
import { FileIcon } from './FileIcon';
import { useTranslation } from 'sdkwork-react-i18n';

// --- Inline Input ---
interface InlineInputProps {
  initialValue?: string;
  type: 'file' | 'folder' | 'rename';
  level: number;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export const InlineInput: React.FC<InlineInputProps> = ({ initialValue = '', type, level, onCommit, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      // Small timeout ensures layout is painted before focus
      const timer = setTimeout(() => {
          inputRef.current?.focus();
          if (initialValue) {
              const dotIndex = initialValue.lastIndexOf('.');
              if (dotIndex > 0) {
                inputRef.current?.setSelectionRange(0, dotIndex);
              } else {
                inputRef.current?.select();
              }
          }
      }, 10);
      return () => clearTimeout(timer);
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.stopPropagation();
          if (value.trim()) onCommit(value.trim());
          else onCancel();
      } else if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel();
      }
  };

  const indentSize = 12;
  const basePadding = 10;
  const paddingLeft = level * indentSize + basePadding;

  return (
    <div className="flex items-center h-[22px] bg-[#37373d] border border-blue-500/50 outline-1 outline-blue-500 -ml-[1px] mr-[1px]" style={{ paddingLeft: `${paddingLeft}px` }}>
        <span className="mr-1.5 flex-shrink-0 opacity-100">
           {type === 'folder' ? <Folder size={14} className="text-[#dcb67a]" fill="currentColor" fillOpacity={0.2} /> : <File size={14} className="text-gray-400" />}
        </span>
        <input 
            ref={inputRef}
            type="text"
            className="bg-transparent border-none text-white text-[13px] outline-none w-full p-0 leading-none font-sans"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if(value.trim()) onCommit(value.trim()); else onCancel(); }}
            onClick={(e) => e.stopPropagation()}
            spellCheck={false}
        />
    </div>
  );
};

// --- Tree Node ---
interface FileTreeNodeProps {
    entry: FileEntry;
    level: number;
    isSearching: boolean;
    renamingPath: string | null;
    creationState: { type: 'file' | 'folder'; parentPath: string } | null;
    onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
    onRenameCommit: (entry: FileEntry, newName: string) => void;
    onRenameCancel: () => void;
    onCreateCommit: (name: string) => void;
    onCreateCancel: () => void;
    onTriggerAction: (action: 'rename' | 'delete', entry: FileEntry) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({ 
    entry, level, isSearching, renamingPath, creationState,
    onContextMenu, onRenameCommit, onRenameCancel, onCreateCommit, onCreateCancel, onTriggerAction
}) => {
  const { openFile, toggleDirectory, expandedPaths, selectedExplorerPath, selectExplorerItem, activeFilePath } = useEditorStore();
  const { t } = useTranslation();
  
  const isExpanded = expandedPaths.has(entry.path) || (isSearching && !!entry.children && entry.children.length > 0);
  const hasLoadedChildren = entry.children !== undefined;
  
  // Selection Logic
  const isSelected = selectedExplorerPath === entry.path;
  const isActive = activeFilePath === entry.path; // Open in Editor
  
  const isRenaming = renamingPath === entry.path;
  const isCreatingChild = creationState && creationState.parentPath === entry.path;

  // Visual Metrics
  const indentSize = 12;
  const basePadding = 10;
  const paddingLeft = level * indentSize + basePadding;

  const handleSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (entry.isDirectory) {
          selectExplorerItem(entry.path);
          toggleDirectory(entry.path);
      } else {
          openFile(entry.path, entry.name, true);
      }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (entry.isDirectory) {
          toggleDirectory(entry.path);
      } else {
          openFile(entry.path, entry.name, false);
      }
  };

  const handleToggleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (entry.isDirectory) {
          toggleDirectory(entry.path);
      }
  };

  if (isRenaming) {
      return (
          <InlineInput 
              type={entry.isDirectory ? 'folder' : 'file'}
              level={level}
              initialValue={entry.name}
              onCommit={(val) => onRenameCommit(entry, val)}
              onCancel={onRenameCancel}
          />
      );
  }

  return (
    <div>
      {/* Node Row */}
      <div 
        className={`
            group/item flex items-center h-[22px] cursor-pointer select-none text-[13px] relative border border-transparent box-border overflow-hidden
            ${isSelected 
                ? 'bg-[#094771] text-white' 
                : isActive 
                    ? 'bg-[#2a2d2e] text-white' 
                    : 'text-[#cccccc] hover:bg-[#2a2d2e]'
            }
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => {
            if (!isSelected) selectExplorerItem(entry.path);
            onContextMenu(e, entry);
        }}
      >
        {/* Expansion Arrow Area */}
        <div 
            className="flex items-center justify-center w-[16px] h-[16px] -ml-4 mr-0.5 hover:bg-white/10 rounded cursor-pointer z-10"
            onClick={handleToggleClick}
        >
            {entry.isDirectory && (
               <ChevronRight 
                  size={12} 
                  strokeWidth={2}
                  className={`transition-transform duration-100 ${isExpanded ? 'rotate-90 text-gray-200' : 'text-gray-400 opacity-80'}`} 
               />
            )}
        </div>
        
        <span className="mr-1.5 flex-shrink-0">
          <FileIcon name={entry.name} isDirectory={entry.isDirectory} expanded={isExpanded} />
        </span>
        <span className={`truncate leading-none flex-1 ${entry.name.startsWith('.') ? 'opacity-60' : ''}`}>
            {entry.name}
        </span>

        {/* Hover Action Bar: Only visible when hovering THIS specific item */}
        <div className="hidden group-hover/item:flex items-center h-full bg-[#2a2d2e] shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.5)] pr-2 pl-2 absolute right-0 top-0 z-20">
            <button 
                className="p-1 hover:bg-[#333] hover:text-white text-gray-400 rounded transition-colors"
                title={t('common.actions.rename')}
                onClick={(e) => { e.stopPropagation(); onTriggerAction('rename', entry); }}
            >
                <Edit2 size={12} />
            </button>
            <button 
                className="p-1 hover:bg-[#333] hover:text-red-400 text-gray-400 rounded transition-colors"
                title={t('common.actions.delete')}
                onClick={(e) => { e.stopPropagation(); onTriggerAction('delete', entry); }}
            >
                <Trash2 size={12} />
            </button>
            <button 
                className="p-1 hover:bg-[#333] hover:text-white text-gray-400 rounded transition-colors"
                title={t('common.actions.more')}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!isSelected) selectExplorerItem(entry.path);
                    onContextMenu(e, entry);
                }}
            >
                <MoreHorizontal size={12} />
            </button>
        </div>
      </div>
      
      {/* Creation Input (Prepend to children) */}
      {isExpanded && isCreatingChild && (
          <InlineInput 
              type={creationState!.type} 
              level={level + 1} 
              onCommit={onCreateCommit} 
              onCancel={onCreateCancel} 
          />
      )}

      {/* Children */}
      {isExpanded && hasLoadedChildren && entry.children!.map(child => (
        <FileTreeNode 
            key={child.uuid} 
            entry={child} 
            level={level + 1} 
            isSearching={isSearching}
            renamingPath={renamingPath}
            creationState={creationState}
            onContextMenu={onContextMenu}
            onRenameCommit={onRenameCommit}
            onRenameCancel={onRenameCancel}
            onCreateCommit={onCreateCommit}
            onCreateCancel={onCreateCancel}
            onTriggerAction={onTriggerAction}
        />
      ))}
    </div>
  );
};
