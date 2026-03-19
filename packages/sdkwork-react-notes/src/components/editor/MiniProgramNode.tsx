
import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { AppWindow, Image as ImageIcon, Link2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

export const MiniProgramNode: React.FC<NodeViewProps> = (props) => {
  const { t } = useTranslation();
  const { node, selected } = props;
  const { title, image, type, text } = node.attrs;

  return (
    <NodeViewWrapper className="mini-program-component my-4 select-none flex justify-center w-full">
      <div 
        className={`relative transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
      >
        {type === 'card' && (
            // Official WeChat Mini Program Card Style
            // Width is typically restricted in WeChat articles (usually 300-360px centered)
            <div className="flex flex-col bg-white dark:bg-[#252526] border border-[#e5e5e5] dark:border-[#333] rounded-[4px] overflow-hidden w-[360px] shadow-sm hover:shadow-md transition-shadow mx-auto">
                
                {/* Header: Logo + App Name */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#f0f0f0] dark:border-[#333]">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
                        {/* Placeholder for App Icon if we had it, use AppWindow for now */}
                        <AppWindow size={12} className="text-blue-600" />
                    </div>
                    <span className="text-[13px] text-[#666] dark:text-[#aaa] truncate">Mini Program</span>
                </div>

                {/* Body: Title + Cover */}
                <div className="p-3">
                    <div className="flex gap-3">
                         {/* Text Side (If we had separate desc, but title is main here) */}
                         <div className="flex-1 min-w-0 flex flex-col justify-between">
                             <div className="text-[15px] font-bold text-[#333] dark:text-[#eee] leading-snug line-clamp-2 mb-2">
                                 {title || 'Mini Program Title'}
                             </div>
                             {/* Optional: Descriptive text if available, otherwise just Title takes space */}
                         </div>
                    </div>

                    {/* Main Cover Image - Aspect 5:4 roughly */}
                    <div className="relative w-full aspect-[5/4] bg-[#f5f5f5] dark:bg-[#111] overflow-hidden rounded-[2px]">
                        {image ? (
                            <img src={image} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={32} />
                            </div>
                        )}
                        
                        {/* The "Mini Program" Badge Overlay used in some views */}
                        <div className="absolute bottom-1 left-2 flex items-center gap-1 opacity-80">
                             <div className="w-3 h-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Link2 size={8} className="text-white" />
                             </div>
                             <span className="text-[10px] text-white text-shadow-sm">{t('notes.editor.media.mini_program')}</span>
                        </div>
                    </div>
                </div>
                
                {/* Footer: WeChat Branding */}
                <div className="px-3 py-2 border-t border-[#f0f0f0] dark:border-[#333] flex items-center justify-between bg-[#fafafa] dark:bg-[#202022]">
                    <div className="flex items-center gap-1.5 text-[#576b95] dark:text-blue-400">
                        <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center">
                            <span className="text-[8px] font-bold">S</span> 
                        </div>
                        <span className="text-[10px]">WeChat Mini Program</span>
                    </div>
                </div>
            </div>
        )}

        {type === 'text' && (
             // Text Link Style (Standard blue text with icon)
            <span className="inline-flex items-center gap-1 text-[#576b95] dark:text-blue-400 hover:underline cursor-pointer select-none">
                <AppWindow size={14} className="inline align-text-bottom" />
                <span>{text || title || 'Open Mini Program'}</span>
            </span>
        )}

        {type === 'image' && (
            // Image Link Style (Image with overlay hint)
            <div className="relative group max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-[#333] mx-auto">
                {image ? (
                    <img src={image} alt="Mini Program Link" className="w-full h-auto block" />
                ) : (
                    <div className="w-full h-40 bg-gray-100 dark:bg-[#252526] flex items-center justify-center text-gray-400">
                        <ImageIcon size={32} />
                    </div>
                )}
                {/* Overlay Badge to indicate it's an MP link */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none flex items-center gap-1">
                    <AppWindow size={10} /> {t('notes.editor.media.mini_program')}
                </div>
            </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
