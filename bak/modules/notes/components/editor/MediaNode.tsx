
import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useAssetUrl } from '../../../../hooks/useAssetUrl';
import { Loader2, AlertCircle, Video, Music } from 'lucide-react';

export const MediaNode: React.FC<NodeViewProps> = (props) => {
  const { node, selected } = props;
  const { src, controls } = node.attrs;
  const isVideo = node.type.name === 'video';
  
  const { url: resolvedSrc, loading, error } = useAssetUrl(src);

  return (
    <NodeViewWrapper className="media-component my-4 w-full select-none">
      <div 
        className={`
            relative group transition-all duration-200 rounded-lg overflow-hidden bg-black
            ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-2 hover:ring-gray-700'}
            flex items-center justify-center
        `}
        style={isVideo ? { aspectRatio: '16/9', width: '100%' } : { width: '100%', padding: '1rem', background: '#18181b' }}
      >
         {loading ? (
             <div className="flex flex-col items-center gap-2 text-gray-400">
                 <Loader2 size={24} className="animate-spin" />
                 <span className="text-xs">Loading media...</span>
             </div>
        ) : error ? (
             <div className="flex flex-col items-center gap-2 text-red-400">
                 <AlertCircle size={24} />
                 <span className="text-xs">Failed to load media</span>
             </div>
        ) : resolvedSrc ? (
            isVideo ? (
                <video
                  src={resolvedSrc}
                  controls={controls}
                  className="w-full h-full object-contain"
                />
            ) : (
                <audio
                  src={resolvedSrc}
                  controls={controls}
                  className="w-full"
                />
            )
        ) : (
             <div className="flex flex-col items-center gap-2 text-gray-500">
                 {isVideo ? <Video size={32} className="opacity-50" /> : <Music size={32} className="opacity-50" />}
                 <span className="text-xs">No Media Source</span>
             </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
