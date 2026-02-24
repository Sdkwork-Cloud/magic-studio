
import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { FileText, Download } from 'lucide-react';

export const FileAttachmentNode: React.FC<NodeViewProps> = (props) => {
  const { node } = props;
  const { name, size, src } = node.attrs;

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <NodeViewWrapper className="file-attachment-component my-3 select-none">
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#333] rounded-lg w-full max-w-sm hover:border-blue-500/50 transition-colors group">
        <div className="w-10 h-10 bg-white dark:bg-[#333] rounded-md flex items-center justify-center border border-gray-200 dark:border-[#444] shadow-sm">
          <FileText size={20} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={name}>
            {name}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {formatSize(size)}
          </div>
        </div>
        <a 
          href={src} 
          download={name}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-[#333] rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Download File"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={16} />
        </a>
      </div>
    </NodeViewWrapper>
  );
};
