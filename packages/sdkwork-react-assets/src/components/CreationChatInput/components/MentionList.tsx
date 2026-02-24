
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { FileText, Image as ImageIcon, Video, Mic } from 'lucide-react';
import type { InputAttachment } from 'sdkwork-react-commons';
import { getAssetLabel } from 'sdkwork-react-commons';

export interface MentionListProps {
  items: InputAttachment[];
  command: (props: any) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      // Use the generated label as the mention ID
      const label = getAssetLabel(index, item.type);
      props.command({ id: item.id, label: label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  const getIcon = (type: string) => {
      switch(type) {
          case 'image': return <ImageIcon size={14} className="text-purple-400" />;
          case 'video': return <Video size={14} className="text-pink-400" />;
          case 'audio': return <Mic size={14} className="text-green-400" />;
          default: return <FileText size={14} className="text-gray-400" />;
      }
  };

  return (
    <div className="bg-[#18181b] border border-[#333] rounded-xl shadow-2xl overflow-hidden min-w-[180px] p-1 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
      {props.items.length ? (
        props.items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const label = getAssetLabel(index, item.type);
            
            return (
              <button
                className={`
                    w-full flex items-center gap-3 px-2 py-1.5 text-xs text-left rounded-lg transition-colors group
                    ${isSelected ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:bg-[#202022]'}
                `}
                key={item.id}
                onClick={() => selectItem(index)}
              >
                {/* Thumbnail Preview */}
                <div className={`
                    w-6 h-6 rounded overflow-hidden flex items-center justify-center flex-shrink-0 border transition-colors
                    ${isSelected ? 'border-gray-500 bg-black/40' : 'border-[#333] bg-[#1a1a1c]'}
                `}>
                    {(item.type === 'image' || item.type === 'video') && item.url ? (
                        <img src={item.url} className="w-full h-full object-cover" alt="" />
                    ) : (
                        getIcon(item.type)
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex justify-between items-center">
                    <span className={`block truncate font-bold ${isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
                        {label}
                    </span>
                    <span className="text-[9px] text-gray-600 truncate max-w-[80px]">
                        {item.name}
                    </span>
                </div>
              </button>
            );
        })
      ) : (
        <div className="px-3 py-2 text-xs text-gray-500 italic text-center">
          No files found
        </div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
