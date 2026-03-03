
import { useRouter } from '@sdkwork/react-core'
import React from 'react';
import { 
    Scissors, Layout, BookOpen, ChevronLeft, FolderOpen, HardDrive
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';

interface CreationLayoutSidebarProps {
    className?: string;
}

export const CreationLayoutSidebar: React.FC<CreationLayoutSidebarProps> = ({ className = '' }) => {
    const { navigate, currentPath } = useRouter();

    const TOOLS = [
        { id: 'magic-cut', label: 'Magic Cut', route: ROUTES.MAGIC_CUT, icon: Scissors, color: 'text-red-500' },
        { id: 'canvas', label: 'Canvas', route: ROUTES.CANVAS, icon: Layout, color: 'text-blue-500' },
        { id: 'notes', label: 'Notes', route: ROUTES.NOTES, icon: BookOpen, color: 'text-yellow-500' },
        { id: 'assets', label: 'Assets', route: ROUTES.ASSETS, icon: FolderOpen, color: 'text-purple-500' },
        { id: 'drive', label: 'Drive', route: ROUTES.DRIVE, icon: HardDrive, color: 'text-cyan-500' },
    ];

    return (
        <div className={`w-16 flex-none bg-[#050505] border-r border-[#1a1a1a] flex flex-col h-full items-center py-4 z-20 ${className}`}>
            {/* Back Button */}
            <button 
                onClick={() => navigate(ROUTES.HOME)}
                className="p-2 mb-4 text-gray-500 hover:text-white hover:bg-[#1a1a1c] rounded-xl transition-colors"
                title="Back to Home"
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="w-8 h-[1px] bg-[#1a1a1a] mb-4" />

            {/* Icons List */}
            <div className="flex flex-col gap-2 w-full px-2">
                {TOOLS.map(tool => {
                    const ToolIcon = tool.icon;
                    const isActive = currentPath === tool.route;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            className={`
                                relative group w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200
                                ${isActive 
                                    ? `bg-[#1e1e20] text-white shadow-lg ring-1 ring-white/5` 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
                                }
                            `}
                            title={tool.label}
                        >
                            <ToolIcon size={20} className={isActive ? tool.color : ''} />
                            
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white/50 rounded-r-full" />
                            )}

                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#333]">
                                {tool.label}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
