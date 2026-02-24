
import React, { useRef, useEffect } from 'react';
import { useMenuLogic } from './useMenuLogic';
import { MenuState } from './types';

interface TimelineContextMenuProps {
    menuState: MenuState;
    onClose: () => void;
}

export const TimelineContextMenu: React.FC<TimelineContextMenuProps> = ({ menuState, onClose }) => {
    const { x, y, type, targetId, time } = menuState;
    const menuRef = useRef<HTMLDivElement>(null);
    const { actions, handleAction } = useMenuLogic(type, targetId, time, onClose);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Bounds checking
    const style = {
        top: Math.min(y, window.innerHeight - (actions.length * 32 + 20)),
        left: Math.min(x, window.innerWidth - 200),
    };

    // Header Title
    const getHeader = () => {
        if (type === 'clip') return 'Selected Clip';
        if (type === 'track') return 'Track Options';
        return 'Timeline';
    };

    return (
        <div 
            ref={menuRef}
            className="fixed z-[9999] w-52 bg-[#1e1e1e]/95 backdrop-blur-xl border border-[#333] shadow-2xl rounded-xl py-1.5 flex flex-col text-sm text-gray-200 animate-in fade-in zoom-in-95 duration-75 select-none ring-1 ring-white/5"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 border-b border-white/5 mx-1">
                {getHeader()}
            </div>

            {actions.map((item, idx) => {
                if (item.separator) {
                    return <div key={`sep-${idx}`} className="h-[1px] bg-[#333] my-1 mx-2" />;
                }

                return (
                    <button 
                        key={item.id}
                        onClick={(e) => { e.stopPropagation(); handleAction(item); }}
                        disabled={item.disabled}
                        className={`
                            flex items-center gap-3 px-3 py-2 text-xs w-full text-left transition-all relative group mx-1 rounded-lg max-w-[calc(100%-8px)]
                            ${item.disabled 
                                ? 'text-gray-600 cursor-not-allowed opacity-50' 
                                : item.danger 
                                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                                    : 'text-gray-300 hover:bg-[#333] hover:text-white'
                            }
                        `}
                    >
                        <span className={`opacity-70 group-hover:opacity-100 ${item.danger ? 'text-red-500' : 'text-gray-400 group-hover:text-white'}`}>
                            {item.icon}
                        </span>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-[9px] opacity-40 font-mono bg-[#2a2a2c] px-1 rounded border border-[#333]">
                                {item.shortcut}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
