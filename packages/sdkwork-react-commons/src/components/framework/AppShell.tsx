import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { cn } from '../../utils/helpers';
import type { FrameworkComponentProps } from './types';
import { buildFrameworkStyle, DEFAULT_FRAMEWORK_THEME, type FrameworkTheme } from './tokens';

export interface AppShellProps extends FrameworkComponentProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  sidebarWidth?: number;
  sidebarCollapsedWidth?: number;
  theme?: FrameworkTheme;
}

export interface AppShellHandle {
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const AppShell = forwardRef<AppShellHandle, AppShellProps>(
  (
    {
      id,
      className,
      style,
      testId,
      header,
      sidebar,
      content,
      footer,
      sidebarCollapsed,
      defaultSidebarCollapsed = false,
      onSidebarCollapsedChange,
      sidebarWidth = 280,
      sidebarCollapsedWidth = 72,
      theme = DEFAULT_FRAMEWORK_THEME
    },
    ref
  ) => {
    const [internalSidebarCollapsed, setInternalSidebarCollapsed] = useState(defaultSidebarCollapsed);
    const collapsed = sidebarCollapsed ?? internalSidebarCollapsed;

    const setCollapsed = (next: boolean) => {
      if (sidebarCollapsed === undefined) {
        setInternalSidebarCollapsed(next);
      }
      onSidebarCollapsedChange?.(next);
    };

    useImperativeHandle(
      ref,
      () => ({
        setSidebarCollapsed: setCollapsed,
        toggleSidebar: () => setCollapsed(!collapsed)
      }),
      [collapsed]
    );

    const resolvedStyle = useMemo(() => {
      return {
        ...buildFrameworkStyle(theme),
        ...style
      };
    }, [theme, style]);

    const currentSidebarWidth = collapsed ? sidebarCollapsedWidth : sidebarWidth;

    return (
      <div
        id={id}
        data-testid={testId}
        className={cn('flex h-full w-full flex-col overflow-hidden', className)}
        style={resolvedStyle}
      >
        {header ? <header className="shrink-0 border-b border-[var(--sdk-border)]">{header}</header> : null}
        <div className="flex min-h-0 flex-1 bg-[var(--sdk-surface)] text-[var(--sdk-text-primary)]">
          {sidebar ? (
            <aside
              className="shrink-0 overflow-hidden border-r border-[var(--sdk-border)] transition-all duration-200"
              style={{ width: currentSidebarWidth }}
            >
              {sidebar}
            </aside>
          ) : null}
          <main className="min-h-0 min-w-0 flex-1 overflow-auto">{content}</main>
        </div>
        {footer ? <footer className="shrink-0 border-t border-[var(--sdk-border)]">{footer}</footer> : null}
      </div>
    );
  }
);

AppShell.displayName = 'AppShell';

