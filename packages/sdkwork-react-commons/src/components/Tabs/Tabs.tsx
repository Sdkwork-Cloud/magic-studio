
import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Circle } from 'lucide-react';

export interface TabItem {
  id: string;
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  isDirty?: boolean;
  isItalic?: boolean;
  isEditing?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onDoubleClick?: (id: string) => void;
  addonAfterTabs?: React.ReactNode; 
  rightContent?: React.ReactNode;
  onReorder?: (srcId: string, destId: string) => void;
  
  // Customization
  height?: string | number;
  className?: string;
  // Deprecated individual class props in favor of internal consistent styling, 
  // but kept for compatibility if needed.
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  showScrollButtons?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ 
  items, 
  activeId, 
  onSelect, 
  onClose, 
  onContextMenu,
  onDoubleClick,
  addonAfterTabs,
  rightContent,
  onReorder,
  height = 36,
  className = '',
  showScrollButtons = true
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // --- Scroll Logic ---
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  useEffect(() => {
    if (activeId && scrollContainerRef.current) {
        const index = items.findIndex(item => item.id === activeId);
        if (index !== -1 && scrollContainerRef.current.children[index]) {
            const tab = scrollContainerRef.current.children[index] as HTMLElement;
            const { offsetLeft, offsetWidth } = tab;
            const { scrollLeft, clientWidth } = scrollContainerRef.current;

            if (offsetLeft < scrollLeft) {
                scrollContainerRef.current.scrollTo({ left: offsetLeft, behavior: 'smooth' });
            } else if (offsetLeft + offsetWidth > scrollLeft + clientWidth) {
                scrollContainerRef.current.scrollTo({ left: offsetLeft + offsetWidth - clientWidth, behavior: 'smooth' });
            }
        }
    }
  }, [activeId, items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 200;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (scrollContainerRef.current && e.deltaY !== 0) {
          scrollContainerRef.current.scrollLeft += e.deltaY;
      }
  };

  const cssHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`flex items-end w-full select-none relative bg-[#18181b] border-b border-[#27272a] ${className}`}
      style={{ height: cssHeight }}
    >
        {/* Scroll Left Button */}
        {showScrollButtons && (
            <div className={`flex-none transition-all duration-200 z-20 ${canScrollLeft ? 'w-[20px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <button onClick={() => scroll('left')} className="h-full w-full flex items-center justify-center hover:bg-[#333] text-gray-400 rounded-sm">
                    <ChevronLeft size={12} />
                </button>
            </div>
        )}

        {/* Tabs Container */}
        <div 
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onScroll={checkScroll}
          className="flex-initial flex overflow-x-auto overflow-y-hidden no-scrollbar h-full items-end relative scroll-smooth min-w-0"
        >
            {items.map((item) => {
                const isActive = activeId === item.id;
                const isDraggingThis = draggingId === item.id;
                
                return (
                    <div
                        key={item.id}
                        onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
                        onContextMenu={(e) => onContextMenu && onContextMenu(e, item.id)}
                        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick && onDoubleClick(item.id); }}
                        draggable={!!onReorder && !item.isEditing}
                        onDragStart={(e) => {
                            if (onReorder && !item.isEditing) {
                                setDraggingId(item.id);
                                e.dataTransfer.setData('tab-id', item.id);
                                e.dataTransfer.effectAllowed = 'move';
                            }
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onDragOver={(e) => {
                            if (onReorder) e.preventDefault();
                        }}
                        onDrop={(e) => {
                            if (onReorder) {
                                e.preventDefault();
                                const srcId = e.dataTransfer.getData('tab-id');
                                if (srcId && srcId !== item.id) {
                                    onReorder(srcId, item.id);
                                }
                            }
                        }}
                        className={`
                            group relative flex items-center justify-between
                            px-3 cursor-pointer text-xs
                            transition-colors duration-100 flex-shrink-0
                            min-w-[120px] max-w-[200px] border-r border-[#27272a]/50
                            ${isActive 
                                ? 'bg-[#1e1e1e] text-white z-10 border-t-2 border-t-blue-500' // Active: Match content BG, Blue Top Border
                                : 'bg-transparent text-gray-500 hover:bg-[#252526] hover:text-gray-300' // Inactive
                            }
                            ${isDraggingThis ? 'opacity-50' : ''}
                        `}
                        style={{ height: '100%' }}
                        title={item.tooltip || (typeof item.title === 'string' ? item.title : undefined)}
                    >
                        <div className="flex items-center overflow-hidden flex-1 min-w-0">
                            {item.icon && (
                                <span className={`mr-2 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                    {item.icon}
                                </span>
                            )}
                            <span className={`truncate font-medium leading-none mt-0.5 ${item.isItalic ? 'italic' : ''}`}>
                                {item.title}
                            </span>
                        </div>
                        
                        {!item.isEditing && (
                            <div 
                                onClick={(e) => { e.stopPropagation(); onClose(item.id); }}
                                className={`
                                    ml-1 p-0.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-opacity flex-shrink-0
                                    ${isActive || item.isDirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}
                            >
                                {item.isDirty ? (
                                    <Circle size={8} fill="currentColor" className="text-white" />
                                ) : (
                                    <X size={12} />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Scroll Right Button */}
        {showScrollButtons && (
            <div className={`flex-none transition-all duration-200 z-20 ${canScrollRight ? 'w-[20px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <button onClick={() => scroll('right')} className="h-full w-full flex items-center justify-center hover:bg-[#333] text-gray-400 rounded-sm">
                    <ChevronRight size={12} />
                </button>
            </div>
        )}

        {/* Addon Content (Add Button) */}
        {addonAfterTabs && (
             <div className="flex-none z-20 ml-1 flex items-center h-full">{addonAfterTabs}</div>
        )}

        {/* Drag Region Spacer */}
        <div className="flex-1 h-full min-w-[50px]" data-tauri-drag-region />

        {/* Right Content (Window Controls) */}
        {rightContent && (
            <div className="flex-none z-50 h-full">{rightContent}</div>
        )}
    </div>
  );
};
