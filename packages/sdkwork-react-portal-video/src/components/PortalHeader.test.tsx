import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortalHeader } from './PortalHeader';

const mockUseRouter = vi.fn();
const mockUseAuthStore = vi.fn();
const mockUseNotificationStore = vi.fn();
const mockUseTranslation = vi.fn();

let mockPlatformMode: 'web' | 'desktop' = 'web';

vi.mock('@sdkwork/react-core', () => ({
  useRouter: () => mockUseRouter(),
  ROUTES: {
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
  createLocalizedText: (en: string, zh: string) => ({ en, zh }),
  resolveLocalizedText: (label: { en: string; zh: string }, locale: string) =>
    locale === 'zh-CN' ? label.zh : label.en,
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
    mockUseTranslation.mockReturnValue({
      locale: 'en-US',
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
});
