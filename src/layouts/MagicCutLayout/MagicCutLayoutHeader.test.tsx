import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MagicCutLayoutHeader } from './MagicCutLayoutHeader';

const mockUseRouter = vi.fn();
const mockUseTranslation = vi.fn();
const mockUseMagicCutStore = vi.fn();
const LOCALIZED_COPY: Record<string, string> = {
  'magicCut.header.back.portal': 'portal-label',
  'magicCut.header.back.canvas': 'canvas-label',
  'magicCut.header.brand': 'magic-cut-brand',
  'magicCut.header.beta': 'beta-badge',
  'magicCut.header.subtitle': 'localized-shell-subtitle',
  'magicCut.header.saved': 'saved-indicator',
  'magicCut.header.share': 'share-action',
  'magicCut.header.export': 'export-action',
  'magicCut.header.exportVideo': 'export-video-action',
  'magicCut.header.exportJsonProject': 'export-json-project-action',
};

let mockPlatformMode: 'web' | 'desktop' = 'desktop';

vi.mock('@sdkwork/react-core', () => ({
  ROUTES: {
    PORTAL: '/portal',
    CANVAS: '/canvas',
  },
  useRouter: () => mockUseRouter(),
  platform: {
    getPlatform: () => mockPlatformMode,
    saveFile: vi.fn(),
  },
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('@sdkwork/react-workspace', () => ({
  WorkspaceProjectSelector: () =>
    React.createElement('div', { 'data-testid': 'workspace-selector' }, 'WorkspaceSelector'),
}));

vi.mock('@sdkwork/react-magiccut', () => ({
  useMagicCutStore: () => mockUseMagicCutStore(),
}));

vi.mock('@sdkwork/react-commons', () => ({
  WindowControls: () =>
    React.createElement('div', { 'data-testid': 'window-controls' }, 'Minimize Maximize Close'),
}));

describe('MagicCutLayoutHeader', () => {
  beforeEach(() => {
    mockPlatformMode = 'desktop';
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentQuery: '',
    });
    mockUseTranslation.mockReturnValue({
      t: (key: string) => LOCALIZED_COPY[key] ?? key,
    });
    mockUseMagicCutStore.mockReturnValue({
      project: {
        name: 'Desktop Demo',
      },
    });
  });

  it('keeps a single workspace selector centered in the desktop header', () => {
    const html = renderToStaticMarkup(<MagicCutLayoutHeader />);
    const matches = html.match(/data-testid="workspace-selector"/g) ?? [];

    expect(matches).toHaveLength(1);
    expect(html).toContain('data-testid="window-controls"');
    expect(html).toContain('app-header-glass');
  });

  it('renders the localized Magic Cut shell copy from the i18n layer', () => {
    const html = renderToStaticMarkup(<MagicCutLayoutHeader />);

    expect(html).toContain(LOCALIZED_COPY['magicCut.header.brand']);
    expect(html).toContain(LOCALIZED_COPY['magicCut.header.beta']);
    expect(html).toContain(LOCALIZED_COPY['magicCut.header.subtitle']);
    expect(html).toContain(LOCALIZED_COPY['magicCut.header.saved']);
    expect(html).toContain(LOCALIZED_COPY['magicCut.header.share']);
    expect(html).toContain(LOCALIZED_COPY['magicCut.header.export']);
  });
});
