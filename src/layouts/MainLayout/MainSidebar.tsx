import { platform, useRouter } from '@sdkwork/react-core'
import React, { useState, useRef } from 'react';
import {
    Settings, Crown, ChevronRight
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';
import { useAuthStore } from '@sdkwork/react-auth';
import { useSettingsStore } from '@sdkwork/react-settings';
import { PricingModal } from '@sdkwork/react-vip';
import { useTranslation } from '@sdkwork/react-i18n';
import { getIconComponent } from '@sdkwork/react-commons';
import { SidebarItemConfig } from '@sdkwork/react-settings';
import { SIDEBAR_TEMPLATES } from '@sdkwork/react-settings';

const MainSidebar: React.FC = () => {
  const [showPricing, setShowPricing] = useState(false);
  const { navigate, currentPath } = useRouter();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { t } = useTranslation();
  const isDesktopRuntime = platform.getPlatform() === 'desktop';

  // Load Config (Fallback to Default Template if missing)
  const menuConfig = settings.appearance.sidebarConfig || SIDEBAR_TEMPLATES[0].config;
  const runtimeMenuConfig = menuConfig
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => isSidebarItemVisible(child, isDesktopRuntime)),
    }))
    .filter((item) => isSidebarItemVisible(item, isDesktopRuntime));

  return (
    <>
      <div className="app-sidebar-rail w-[72px] h-full flex flex-col items-center py-4 select-none transition-colors duration-200 z-50">

        {/* --- Top Section: Avatar --- */}
        <div
          className="mb-6 flex-none"
          onClick={() => navigate(user ? ROUTES.PROFILE : ROUTES.LOGIN)}
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-[10px] shadow-lg cursor-pointer hover:scale-105 transition-transform relative group bg-primary-600">
             {user?.avatarUrl ? (
                 <img src={user.avatarUrl} className="w-full h-full object-cover rounded-xl" alt="Avatar"/>
             ) : (
                 "OS"
             )}
          </div>
        </div>

        {/* --- Middle Section: Dynamic Navigation --- */}
        <div className="app-ghost-scrollbar flex flex-col gap-3 flex-1 w-full items-center overflow-y-auto overflow-x-hidden min-h-0 pb-4">

          {runtimeMenuConfig.map((item, index) => {
              if (!item.visible) return null;

              // Separator
              if (item.id.startsWith('separator')) {
                  return <div key={index} className="app-sidebar-divider w-6 h-px my-1" />;
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
        <div className="flex flex-col gap-3 items-center flex-none w-full pt-4 pb-2 transition-colors duration-200 border-t border-white/5">

           {/* VIP Button */}
           <button
             onClick={() => setShowPricing(true)}
             className={`
                app-sidebar-item relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 group
                ${showPricing
                    ? 'bg-primary-500/15 text-primary-300'
                    : 'text-primary-300 hover:bg-primary-500/10'
                }
             `}
             title={t('sidebar.upgrade')}
           >
              <Crown size={18} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
           </button>

           <div className="app-sidebar-divider w-6 h-px" />

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
            app-sidebar-item relative w-10 h-10 flex items-center justify-center rounded-2xl
            ${className}
          `}
        >
          <Icon size={18} strokeWidth={1.5} className="transition-transform duration-200 group-hover/item:scale-105" />
        </button>

        {/* Tooltip */}
        {!isActive && (
            <div className="app-sidebar-tooltip absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 text-[10px] rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
                {label}
            </div>
        )}

        {/* Active Indicator Dot */}
        {isActive && (
             <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary-500 rounded-r-full" />
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

    if (!Icon) {
        return null;
    }

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
              data-active={isActive || isHovered}
              className={`
                app-sidebar-item relative w-10 h-10 flex items-center justify-center rounded-2xl
              `}
            >
              <Icon size={18} strokeWidth={1.5} className="transition-transform duration-200" />
            </button>

            {/* Active Indicator */}
            {isActive && (
                 <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary-500 rounded-r-full" />
            )}

            {/* Flyout Menu */}
            {isHovered && (
                <div
                    className="app-floating-panel fixed left-[72px] top-auto z-[60] ml-2 w-56 rounded-[1.25rem] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-left"
                    style={{ marginTop: '-20px' }}
                >
                    <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-panel-subtle)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.16em]">{t(config.labelKey)}</span>
                        <Icon size={14} className="text-[var(--text-muted)]" />
                    </div>

                    <div className="p-1.5 flex flex-col gap-0.5">
                        {config.children?.filter((c: SidebarItemConfig) => c.visible).map((item: SidebarItemConfig) => {
                            const isItemActive = currentPath === item.route;
                            const ItemIcon = getIconComponent(item.icon);

                            if (!ItemIcon) {
                                return null;
                            }

                            return (
                                <button
                                    key={item.route}
                                    onClick={() => { navigate(item.route); setIsHovered(false); }}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left group/item
                                        ${isItemActive
                                            ? 'bg-[var(--text-primary)] text-[var(--bg-panel-strong)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] hover:text-[var(--text-primary)]'
                                        }
                                    `}
                                >
                                    <ItemIcon
                                        size={16}
                                        className={`transition-colors ${isItemActive ? 'text-primary-400' : 'text-[var(--text-muted)] group-hover/item:text-[var(--text-secondary)]'}`}
                                    />
                                    <span className="flex-1">{t(item.labelKey)}</span>
                                    {isItemActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                    {!isItemActive && <ChevronRight size={12} className="opacity-0 group-hover/item:opacity-50 transition-opacity text-[var(--text-muted)]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const isSidebarItemVisible = (item: SidebarItemConfig, isDesktopRuntime: boolean): boolean => {
    if (!item.visible) {
        return false;
    }

    if (item.runtimeVisibility === 'web-only' && isDesktopRuntime) {
        return false;
    }

    if (item.runtimeVisibility === 'desktop-only' && !isDesktopRuntime) {
        return false;
    }

    if (item.route === ROUTES.DOWNLOAD && isDesktopRuntime) {
        return false;
    }

    if (item.children) {
        return item.children.some((child) => isSidebarItemVisible(child, isDesktopRuntime));
    }

    return true;
};

export default MainSidebar;
