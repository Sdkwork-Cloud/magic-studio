import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MainSidebar from './MainSidebar';

const mockUseRouter = vi.fn();
const mockUseAuthStore = vi.fn();
const mockUseSettingsStore = vi.fn();
const mockUseTranslation = vi.fn();

let mockPlatformMode: 'web' | 'desktop' = 'web';

const { sidebarConfig } = vi.hoisted(() => ({
  sidebarConfig: [
    { id: 'notes', labelKey: 'sidebar.notes', route: '/notes', icon: 'BookOpen', visible: true },
    { id: 'download', labelKey: 'sidebar.download', route: '/app/download', icon: 'Download', visible: true },
  ],
}));

vi.mock('@sdkwork/react-core', () => ({
  useRouter: () => mockUseRouter(),
  platform: {
    getPlatform: () => mockPlatformMode,
  },
}));

vi.mock('@sdkwork/react-auth', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

vi.mock('@sdkwork/react-settings', () => ({
  useSettingsStore: () => mockUseSettingsStore(),
  SIDEBAR_TEMPLATES: [{ config: sidebarConfig }],
}));

vi.mock('@sdkwork/react-vip', () => ({
  PricingModal: () => null,
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('@sdkwork/react-commons', () => ({
  getIconComponent: () => () => React.createElement('span', null, 'icon'),
}));

describe('MainSidebar', () => {
  beforeEach(() => {
    mockPlatformMode = 'web';
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/notes',
    });
    mockUseAuthStore.mockReturnValue({ user: null });
    mockUseSettingsStore.mockReturnValue({
      settings: {
        appearance: {
          sidebarConfig,
        },
      },
    });
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('shows the download app entry on web', () => {
    const html = renderToStaticMarkup(<MainSidebar />);
    expect(html).toContain('sidebar.download');
  });

  it('hides the download app entry on desktop', () => {
    mockPlatformMode = 'desktop';
    const html = renderToStaticMarkup(<MainSidebar />);
    expect(html).not.toContain('sidebar.download');
  });
});
