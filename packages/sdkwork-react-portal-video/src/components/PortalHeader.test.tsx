import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortalHeader } from './PortalHeader';

const mockUseRouter = vi.fn();
const mockUseAuthStore = vi.fn();
const mockUseNotificationStore = vi.fn();
const mockUseTranslation = vi.fn();
const mockUsePointsAccountBalance = vi.fn();

let mockPlatformMode: 'web' | 'desktop' = 'web';

vi.mock('@sdkwork/react-core', () => ({
  useRouter: () => mockUseRouter(),
  usePointsAccountBalance: () => mockUsePointsAccountBalance(),
  ROUTES: {
    PORTAL: '/portal',
    LOGIN: '/login',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    MY_TASKS: '/my-tasks',
    PORTAL_VIDEO: '/portal/video',
    PORTAL_COMMUNITY: '/portal/community',
    PORTAL_THEATER: '/portal/theater',
    PORTAL_SKILLS: '/portal/skills',
    PORTAL_PLUGINS: '/portal/plugins',
    TASK_MARKET: '/task-market',
  },
  platform: {
    getPlatform: () => mockPlatformMode,
  },
}));

vi.mock('@sdkwork/react-auth', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

vi.mock('@sdkwork/react-workspace', () => ({
  WorkspaceProjectSelector: () =>
    React.createElement('div', { 'data-testid': 'workspace-selector' }, 'WorkspaceSelector'),
}));

vi.mock('@sdkwork/react-notifications', () => ({
  useNotificationStore: () => mockUseNotificationStore(),
  NotificationCenter: () => null,
}));

vi.mock('@sdkwork/react-vip', () => ({
  PricingModal: () => null,
}));

vi.mock('@sdkwork/react-commons', () => ({
  WindowControls: () =>
    React.createElement('div', { 'data-testid': 'window-controls' }, 'Minimize Maximize Close'),
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe('PortalHeader', () => {
  beforeEach(() => {
    mockPlatformMode = 'web';
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/portal/video',
    });
    mockUseAuthStore.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });
    mockUseNotificationStore.mockReturnValue({
      unreadCount: 0,
    });
    mockUsePointsAccountBalance.mockReturnValue({
      pointsBalance: null,
      isLoading: false,
    });
    mockUseTranslation.mockReturnValue({
      locale: 'en-US',
      t: (key: string, params?: Record<string, string>) => {
        const translations: Record<string, string> = {
          'sidebar.download_app_title': 'Download App',
          'market.nav.sign_in': 'Sign In',
          'market.nav.sign_out': 'Sign Out',
          'market.nav.my_profile': 'My Profile',
          'market.nav.my_tasks': 'My Tasks',
          'market.nav.billing_plans': 'Billing & Plans',
          'market.nav.switch_workspace': 'Switch Workspace',
          'market.nav.preferences': 'Preferences',
          'market.nav.home': 'Home',
          'market.nav.community': 'Community',
          'market.nav.theater': 'Theater',
          'market.nav.skills': 'Skills',
          'market.nav.plugins': 'Plugins',
          'market.nav.task_market': 'Task Market',
          'market.nav.credits': `${params?.count || '0'} Credits`,
          'header.breadcrumbs.user': 'User',
        };

        return translations[key] ?? key;
      },
    });
  });

  it('renders desktop window controls alongside the sign in action on desktop', () => {
    mockPlatformMode = 'desktop';

    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).toContain('Sign In');
    expect(html).toContain('data-testid="window-controls"');
  });

  it('keeps desktop window controls out of the web header', () => {
    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).not.toContain('data-testid="window-controls"');
  });

  it('keeps the desktop navigation rail on a single horizontal line', () => {
    mockPlatformMode = 'desktop';

    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('whitespace-nowrap');
  });

  it('shows a download app action on the portal home header', () => {
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/portal/video',
    });

    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).toContain('Download App');
    expect(html).toContain(
      'href="https://clawstudio.sdkwork.com/download/app/mobile"'
    );
  });

  it('shows the download app action on the desktop portal root route', () => {
    mockPlatformMode = 'desktop';
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/portal',
    });

    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).toContain('Download App');
    expect(html).toContain(
      'href="https://clawstudio.sdkwork.com/download/app/mobile"'
    );
  });

  it('shows the download app action on non-home portal headers too', () => {
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/portal/community',
    });

    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).toContain('Download App');
    expect(html).toContain(
      'href="https://clawstudio.sdkwork.com/download/app/mobile"'
    );
  });

  it('renders the real points balance from the points account hook when the user is signed in', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        name: 'Alex',
        email: 'alex@example.com',
      },
      logout: vi.fn(),
    });
    mockUsePointsAccountBalance.mockReturnValue({
      pointsBalance: 2468,
      isLoading: false,
    });

    const html = renderToStaticMarkup(<PortalHeader />);

    expect(html).toContain('2468 Credits');
    expect(html).not.toContain('880 Credits');
  });
});
