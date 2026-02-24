
import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
    submenu?: MenuItem[];
    action?: () => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    items: MenuItem[];
}

interface ContextMenuContextType {
    show: (x: number, y: number, items: MenuItem[]) => void;
    hide: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = () => {
    const context = useContext(ContextMenuContext);
    if (!context) {
        throw new Error('useContextMenu must be used within ContextMenuProvider');
    }
    return context;
};

const SubMenuItem: React.FC<{
    item: MenuItem;
    onAction: (action: () => void) => void;
    onClose: () => void;
}> = ({ item, onAction, onClose }) => {
    const [showSubmenu, setShowSubmenu] = useState(false);
    const submenuRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowSubmenu(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setShowSubmenu(false), 150);
    };

    if (item.divider) {
        return <div className="h-[1px] bg-[#454545] my-1 mx-2" />;
    }

    return (
        <div
            className="relative"
            onMouseEnter={item.submenu ? handleMouseEnter : undefined}
            onMouseLeave={item.submenu ? handleMouseLeave : undefined}
        >
            <button
                onClick={() => {
                    if (item.disabled || !item.action) return;
                    onAction(item.action);
                }}
                className={`
                    flex items-center gap-3 px-3 py-2 text-xs w-full text-left transition-colors relative group
                    ${item.disabled 
                        ? 'text-gray-600 cursor-not-allowed opacity-50' 
                        : item.danger 
                            ? 'text-red-400 hover:bg-[#4d1f1f] hover:text-red-200' 
                            : 'text-gray-300 hover:bg-[#094771] hover:text-white'
                    }
                `}
            >
                {item.icon && <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>}
                <span className="flex-1 font-medium">{item.label}</span>
                {item.shortcut && <span className="text-[10px] opacity-40 font-mono">{item.shortcut}</span>}
                {item.submenu && <ChevronRight size={14} className="opacity-50" />}
            </button>

            {showSubmenu && item.submenu && (
                <div
                    ref={submenuRef}
                    className="absolute left-full top-0 ml-1 w-48 bg-[#252526] border border-[#454545] shadow-2xl rounded-lg py-1 flex flex-col"
                >
                    {item.submenu.map(sub => (
                        <SubMenuItem
                            key={sub.id}
                            item={sub}
                            onAction={onAction}
                            onClose={onClose}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ContextMenuContent: React.FC<{
    state: ContextMenuState;
    onClose: () => void;
}> = ({ state, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleAction = useCallback((action: () => void) => {
        action();
        onClose();
    }, [onClose]);

    const style = {
        top: Math.min(state.y, window.innerHeight - 300),
        left: Math.min(state.x, window.innerWidth - 220),
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] w-52 bg-[#252526] border border-[#454545] shadow-2xl rounded-lg py-1 flex flex-col text-sm text-gray-200 animate-in fade-in zoom-in-95 duration-75 select-none"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            {state.items.map(item => (
                <SubMenuItem
                    key={item.id}
                    item={item}
                    onAction={handleAction}
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ContextMenuState | null>(null);
    const [domReady, setDomReady] = useState(false);

    useEffect(() => {
        setDomReady(true);
    }, []);

    const show = useCallback((x: number, y: number, items: MenuItem[]) => {
        setState({ x, y, items });
    }, []);

    const hide = useCallback(() => {
        setState(null);
    }, []);

    return (
        <ContextMenuContext.Provider value={{ show, hide }}>
            {children}
            {domReady && state && createPortal(
                <ContextMenuContent state={state} onClose={hide} />,
                document.body
            )}
        </ContextMenuContext.Provider>
    );
};

export const createContextMenuHandler = (
    show: (x: number, y: number, items: MenuItem[]) => void,
    items: MenuItem[] | ((e: React.MouseEvent) => MenuItem[])
) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const menuItems = typeof items === 'function' ? items(e) : items;
    show(e.clientX, e.clientY, menuItems);
};

export type { MenuItem };
