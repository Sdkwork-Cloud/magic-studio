import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockUseSettingsStore = vi.fn();

vi.mock('@sdkwork/react-settings', () => ({
  useSettingsStore: () => mockUseSettingsStore(),
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sdkwork/react-portal-video/pages/PortalPage', () => ({
  default: () => <div data-testid="portal-page">PortalPage</div>,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    lazy: (loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) => {
      let resolvedComponent: React.ComponentType<Record<string, unknown>> | null = null;
      void loader().then((module) => {
        resolvedComponent = module.default;
      });

      return ((props: Record<string, unknown>) =>
        resolvedComponent ? actual.createElement(resolvedComponent, props) : null) as React.ComponentType<Record<string, unknown>>;
    },
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetModules();
    mockUseSettingsStore.mockReset();
  });

  it('keeps rendering the home portal while settings are still hydrating', async () => {
    mockUseSettingsStore.mockReturnValue({
      isLoading: true,
    });

    const { default: HomePage } = await import('./HomePage');
    await Promise.resolve();
    await Promise.resolve();

    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('PortalPage');
    expect(html).not.toContain('app-loading-screen');
  });
});
