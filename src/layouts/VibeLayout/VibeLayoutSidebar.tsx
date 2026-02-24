
import { useRouter } from 'sdkwork-react-core'
import React from 'react';
import { 
    Home, Presentation, ChevronLeft, Layout 
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';

export const VibeLayoutSidebar: React.FC = () => {
    const { navigate, currentPath } = useRouter();

    const TOOLS = [
        { id: 'home', route: ROUTES.HOME, icon: Home, label: 'Home' },
        { id: 'ppt', route: ROUTES.CHAT_PPT, icon: Presentation, label: 'Chat PPT' },
        { id: 'canvas', route: ROUTES.CANVAS, icon: Layout, label: 'Infinite Canvas' },
    ];

    return (
        <div className="w-16 flex-none bg-[#050505] border-r border-[#1a1a1a] flex flex-col items-center py-4 z-20">
            {/* Back / Home Action */}
            <button 
                onClick={() => navigate(ROUTES.HOME)}
                className="p-3 mb-6 text-gray-400 hover:text-white hover:bg-[#1a1a1c] rounded-xl transition-colors"
                title="Back to Home"
            >
                <ChevronLeft size={20} />
            </button>

            {/* Navigation Items */}
            <div className="flex flex-col gap-4 w-full px-2">
                {TOOLS.map(tool => {
                    const isActive = currentPath === tool.route;
                    const Icon = tool.icon;
                    
                    if (tool.id === 'home') return null; // Skip home in list as we have back button

                    return (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            className={`
                                relative group w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200
                                ${isActive 
                                    ? 'bg-[#1e1e20] text-white shadow-lg ring-1 ring-white/10' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
                                }
                            `}
                            title={tool.label}
                        >
                            <Icon size={20} />
                            
                            {/* Active Dot */}
                            {isActive && (
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-l-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
