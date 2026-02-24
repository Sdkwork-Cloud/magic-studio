
import React, { useEffect, useRef, useState } from 'react';
import { 
    Type, Image as ImageIcon, Film, StickyNote, 
    Sparkles, Square, ArrowRight 
} from 'lucide-react';

interface CanvasDropMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onSelect: (type: string) => void;
}

export const CanvasDropMenu: React.FC<CanvasDropMenuProps> = ({ x, y, onClose, onSelect }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Focus input on mount
    useEffect(() => {
        const input = menuRef.current?.querySelector('input');
        if (input) input.focus();
    }, []);

    const options = [
        { id: 'note', label: 'Sticky Note', icon: StickyNote, color: 'text-yellow-400' },
        { id: 'text', label: 'Text', icon: Type, color: 'text-gray-300' },
        { id: 'image', label: 'Generate Image', icon: ImageIcon, color: 'text-purple-400', ai: true },
        { id: 'video', label: 'Generate Video', icon: Film, color: 'text-pink-400', ai: true },
        { id: 'shape', label: 'Shape', icon: Square, color: 'text-blue-400' },
    ];

    const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));

    // Adjust position to not cover the cursor or connection point immediately
    // Shift slightly to the bottom-right of the cursor
    const offsetX = 20; 
    const offsetY = 10;

    return (
        <div 
            ref={menuRef}
            className="fixed z-[100] w-64 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left"
            style={{ top: y + offsetY, left: x + offsetX }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div className="p-2 border-b border-[#333]">
                <input 
                    type="text" 
                    placeholder="Add element... (Enter to select)" 
                    className="w-full bg-[#252526] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && filteredOptions.length > 0) {
                            onSelect(filteredOptions[0].id);
                        }
                        if (e.key === 'Escape') onClose();
                    }}
                />
            </div>
            
            <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredOptions.map((opt, idx) => (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`
                            w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group
                            hover:bg-[#2a2a2c]
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <opt.icon size={16} className={opt.color} />
                            <span className="text-gray-300 group-hover:text-white font-medium">{opt.label}</span>
                        </div>
                        {opt.ai && <Sparkles size={12} className="text-blue-500 opacity-0 group-hover:opacity-100" />}
                        {idx === 0 && search && <ArrowRight size={12} className="text-gray-500" />}
                    </button>
                ))}
                
                {filteredOptions.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-gray-500">
                        No results found
                    </div>
                )}
            </div>
        </div>
    );
};
