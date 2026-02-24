
import { useAssetUrl } from 'sdkwork-react-commons'
import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
;
import { Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';

export const ImageNode: React.FC<NodeViewProps> = (props) => {
  const { node, selected } = props;
  const { src, alt, title } = node.attrs;
  
  // Resolve asset URL if it's a protocol path (assets://)
  const { url: resolvedSrc, loading, error } = useAssetUrl(src);

  return (
    <NodeViewWrapper className="image-component inline-flex justify-center my-4 w-full select-none">
      <div 
        className={`
            relative group transition-all duration-200 rounded-lg overflow-hidden
            ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-2 hover:ring-gray-200 dark:hover:ring-gray-700'}
            min-h-[100px] min-w-[200px] flex items-center justify-center bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333]
        `}
      >
        {loading ? (
             <div className="flex flex-col items-center gap-2 text-gray-400 p-8">
                 <Loader2 size={24} className="animate-spin" />
                 <span className="text-xs">Loading image...</span>
             </div>
        ) : error ? (
             <div className="flex flex-col items-center gap-2 text-red-400 p-8">
                 <AlertCircle size={24} />
                 <span className="text-xs">Failed to load image</span>
             </div>
        ) : resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={alt}
              title={title}
              className="block max-w-full h-auto max-h-[600px] object-contain rounded-lg"
              draggable="true" 
              data-drag-handle 
            />
        ) : (
             <div className="flex flex-col items-center gap-2 text-gray-400 p-8">
                 <ImageIcon size={24} className="opacity-50" />
                 <span className="text-xs">No Image Source</span>
             </div>
        )}
        
        {/* Selection Overlay */}
        {selected && (
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
        )}
      </div>
    </NodeViewWrapper>
  );
};
