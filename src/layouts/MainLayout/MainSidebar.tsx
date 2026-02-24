
import { useRouter } from 'sdkwork-react-core'
import React, { useState, useRef, useEffect } from 'react';
import {
    Settings, User, Crown, ChevronRight, LayoutGrid
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';
import { useAuthStore } from 'sdkwork-react-auth';
import { useSettingsStore } from 'sdkwork-react-settings';
import { PricingModal } from 'sdkwork-react-vip';
import { useTranslation } from 'sdkwork-react-i18n';
import { getIconComponent } from 'sdkwork-react-commons';
import { SidebarItemConfig } from 'sdkwork-react-settings';
import { SIDEBAR_TEMPLATES } from 'sdkwork-react-settings';

const MainSidebar: React.FC = () => {
  const [showPricing, setShowPricing] = useState(false);
  const { navigate, currentPath } = useRouter();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { t } = useTranslation();

  // Debug: Log path changes
  React.useEffect(() => {
      console.log('[MainSidebar] currentPath changed:', currentPath);
  }, [currentPath]);

  // Load Config (Fallback to Default Template if missing)
  const menuConfig = settings.appearance.sidebarConfig || SIDEBAR_TEMPLATES[0].config;

  return (
    <>
      <div className="w-[52px] h-full bg-[#f4f4f5] dark:bg-[#050505] flex flex-col items-center py-4 border-r border-[#e4e4e7] dark:border-[#1a1a1a] select-none transition-colors duration-200 z-50">
        
        {/* --- Top Section: Avatar --- */}
        <div 
          className="mb-6 flex-none"
          onClick={() => navigate(user ? ROUTES.PROFILE : ROUTES.LOGIN)}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-blue-900/20 cursor-pointer hover:scale-105 transition-transform ring-1 ring-black/5 dark:ring-white/10 relative group">
             {user?.avatarUrl ? (
                 <img src={user.avatarUrl} className="w-full h-full object-cover rounded-xl" alt="Avatar"/> 
             ) : (
                 "OS"
             )}
          </div>
        </div>

        {/* --- Middle Section: Dynamic Navigation --- */}
        <div className="flex flex-col gap-3 flex-1 w-full items-center overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar pb-4">
          
          {menuConfig.map((item, index) => {
              if (!item.visible) return null;

              // Separator
              if (item.id.startsWith('separator')) {
                  return <div key={index} className="w-6 h-[1px] bg-gray-200 dark:bg-[#1a1a1a] my-1" />;
              }

              // Group (Accordion/Flyout)
              if (item.children && item.children.length > 0) {
                  // Filter visible children for checking active state
                  const visibleChildren = item.children.filter(c => c.visible);
                  if (visibleChildren.length === 0) return null;

                  const isActive = visibleChildren.some(child => child.route === currentPath);
                  
                  return (
                      <SidebarGroup 
                          key={item.id}
                          config={item}
                          isActive={isActive}
                          navigate={navigate}
                          currentPath={currentPath}
                          t={t}
                      />
                  );
              }

              // Standard Item
              return (
                  <SidebarItem 
                      key={item.id}
                      icon={getIconComponent(item.icon)} 
                      label={t(item.labelKey)}
                      isActive={currentPath === item.route} 
                      onClick={() => navigate(item.route as any)} 
                  />
              );
          })}

        </div>

        {/* --- Bottom Section: Actions --- */}
        <div className="flex flex-col gap-3 items-center flex-none w-full pt-4 pb-2 bg-[#f4f4f5] dark:bg-[#050505] transition-colors duration-200 border-t border-gray-200 dark:border-[#1a1a1a]">
           
           {/* VIP Button */}
           <button
             onClick={() => setShowPricing(true)}
             className={`
                relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 group
                ${showPricing 
                    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' 
                    : 'text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/10'
                }
             `}
             title={t('sidebar.upgrade')}
           >
              <Crown size={18} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
           </button>

           <div className="w-6 h-[1px] bg-gray-200 dark:bg-[#1a1a1a]" />

           <SidebarItem 
             icon={Settings} 
             label={t('sidebar.settings')}
             isActive={currentPath === ROUTES.SETTINGS} 
             onClick={() => navigate(ROUTES.SETTINGS)} 
           />
        </div>
      </div>

      {/* Modals */}
      {showPricing && (
          <PricingModal onClose={() => setShowPricing(false)} />
      )}
    </>
  );
};

// --- Sub Components ---

interface SidebarItemProps {
    icon: any; 
    isActive?: boolean; 
    onClick: () => void; 
    label: string;
    className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    icon: Icon,
    isActive,
    onClick,
    label,
    className = ""
  }) => {
    // Debug: Log active state changes
    React.useEffect(() => {
        console.log('[SidebarItem] isActive changed for', label, ':', isActive);
    }, [isActive, label]);

    // Handle null icon case
    if (!Icon) {
        console.warn('[SidebarItem] Icon is null for label:', label);
        return null;
    }

    return (
    <div className="relative group/item">
        <button
          onClick={onClick}
          data-active={isActive}
          className={`
            relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
            ${isActive
                ? 'bg-gray-200 dark:bg-[#1e1e20] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1c] hover:text-gray-900 dark:hover:text-white'
            }
            ${className}
          `}
        >
          <Icon size={18} strokeWidth={1.5} className="transition-transform duration-200 group-hover/item:scale-105" />
        </button>

        {/* Tooltip */}
        {!isActive && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] border border-[#333]">
                {label}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-t-[4px] border-b-[4px] border-r-[4px] border-t-transparent border-b-transparent border-r-black" />
            </div>
        )}

        {/* Active Indicator Dot */}
        {isActive && (
             <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />
        )}
    </div>
  );
};

interface GroupProps {
    config: SidebarItemConfig;
    isActive: boolean;
    navigate: (path: any) => void;
    currentPath: string;
    t: (key: string) => string;
}

const SidebarGroup: React.FC<GroupProps> = ({ config, isActive, navigate, currentPath, t }) => {
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef<any>(null);
    const Icon = getIconComponent(config.icon);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 150);
    };

    return (
        <div 
            className="relative group/group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button 
              className={`
                relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                ${isActive || isHovered
                    ? 'bg-gray-200 dark:bg-[#1e1e20] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1c] hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon size={18} strokeWidth={1.5} className="transition-transform duration-200" />
            </button>

            {/* Active Indicator */}
            {isActive && (
                 <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />
            )}

            {/* Flyout Menu */}
            {isHovered && (
                <div 
                    className="fixed left-[56px] top-auto z-[60] ml-2 w-56 bg-[#1e1e1e] dark:bg-[#0a0a0a] border border-[#333] dark:border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-left"
                    style={{ marginTop: '-20px' }}
                >
                    <div className="px-4 py-3 border-b border-[#333] dark:border-[#1a1a1a] bg-[#252526] dark:bg-[#111] flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{t(config.labelKey)}</span>
                        <Icon size={14} className="text-gray-500" />
                    </div>
                    
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {config.children?.filter(c => c.visible).map((item) => {
                            const isItemActive = currentPath === item.route;
                            const ItemIcon = getIconComponent(item.icon);
                            
                            return (
                                <button
                                    key={item.route}
                                    onClick={() => { navigate(item.route); setIsHovered(false); }}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left group/item
                                        ${isItemActive 
                                            ? 'bg-[#2b2d31] dark:bg-[#1e1e20] text-white' 
                                            : 'text-gray-400 hover:bg-[#2b2d31] dark:hover:bg-[#1a1a1c] hover:text-gray-200'
                                        }
                                    `}
                                >
                                    <ItemIcon 
                                        size={16} 
                                        className={`transition-colors ${isItemActive ? 'text-blue-400' : 'text-gray-500 group-hover/item:text-gray-300'}`} 
                                    />
                                    <span className="flex-1">{t(item.labelKey)}</span>
                                    {isItemActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    {!isItemActive && <ChevronRight size={12} className="opacity-0 group-hover/item:opacity-50 transition-opacity" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainSidebar;
