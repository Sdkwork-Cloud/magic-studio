import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MagicCutLayoutHeader } from './MagicCutLayoutHeader';

const mockUseRouter = vi.fn();
const mockUseTranslation = vi.fn();
const mockUseMagicCutStore = vi.fn();

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
      t: (key: string) => ({
        'magicCut.header.back.portal': '门户',
        'magicCut.header.back.canvas': '画布',
        'magicCut.header.brand': '魔映',
        'magicCut.header.beta': '测试版',
        'magicCut.header.subtitle': 'AI 原生视频编辑器',
        'magicCut.header.saved': '已保存',
        'magicCut.header.share': '分享',
        'magicCut.header.export': '导出',
        'magicCut.header.exportVideo': '导出视频',
        'magicCut.header.exportJsonProject': '导出 JSON 项目',
      }[key] ?? key),
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
  });

  it('renders the localized Magic Cut shell copy instead of hardcoded English strings', () => {
    const html = renderToStaticMarkup(<MagicCutLayoutHeader />);

    expect(html).toContain('魔映');
    expect(html).toContain('测试版');
    expect(html).toContain('AI 原生视频编辑器');
    expect(html).toContain('已保存');
    expect(html).toContain('分享');
    expect(html).toContain('导出');
  });
});
