import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortalSidebar } from './PortalSidebar';

const mockUseRouter = vi.fn();
const mockUseTranslation = vi.fn();

let mockPlatformMode: 'web' | 'desktop' = 'web';

vi.mock('@sdkwork/react-core', () => ({
  useRouter: () => mockUseRouter(),
  ROUTES: {
    HOME: '/',
    PORTAL: '/portal',
    PORTAL_DISCOVER: '/portal/discover',
    ASSETS: '/assets',
    DRIVE: '/drive',
    FILM: '/film',
    MAGIC_CUT: '/magic-cut',
    CANVAS: '/canvas',
    NOTES: '/notes',
    PROMPT: '/prompt',
    VIDEO: '/video',
    IMAGE: '/image',
    CHARACTER: '/character',
    MUSIC: '/music',
    AUDIO: '/audio',
    VOICE: '/voice',
    DOWNLOAD: '/app/download',
    SETTINGS: '/settings',
    LOGIN: '/login',
  },
  platform: {
    getPlatform: () => mockPlatformMode,
  },
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('@sdkwork/react-vip', () => ({
  PricingModal: () => null,
}));

describe('PortalSidebar', () => {
  beforeEach(() => {
    mockPlatformMode = 'web';
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/portal',
    });
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('shows the download app card on web', () => {
    const html = renderToStaticMarkup(<PortalSidebar />);
    expect(html).toContain('sidebar.download_app_title');
  });

  it('hides the download app card on desktop', () => {
    mockPlatformMode = 'desktop';
    const html = renderToStaticMarkup(<PortalSidebar />);
    expect(html).not.toContain('sidebar.download_app_title');
  });
});
