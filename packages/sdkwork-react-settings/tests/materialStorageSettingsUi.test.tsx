import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { DEFAULT_MAGICSTUDIO_ROOT_DIR, DEFAULT_SETTINGS } from '../src/constants';
import { StorageSettings } from '../src/components/StorageSettings';

const mockUpdateSettings = vi.fn();

const translationMap: Record<string, string> = {
  'settings.storage.material.title': 'MagicStudio Material Storage',
  'settings.storage.material.subtitle': 'Control where local media is stored for editing.',
  'settings.storage.material.mode.label': 'Storage Mode',
  'settings.storage.material.mode.options.localFirstSync': 'Local First (Recommended)',
  'settings.storage.material.desktop.rootDir': 'MagicStudio Root',
  'settings.storage.material.desktop.workspacesRootDir': 'Workspaces Override',
  'settings.storage.material.desktop.cacheRootDir': 'Cache Override',
  'settings.storage.material.desktop.exportsRootDir': 'Exports Override',
  'common.actions.copy': 'Copy',
  'common.actions.copied': 'Copied',
  'common.actions.browse': 'Browse',
};

vi.mock('../src/store/settingsStore', () => ({
  useSettingsStore: () => ({
    settings: DEFAULT_SETTINGS,
    updateSettings: mockUpdateSettings,
  }),
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => translationMap[key] || key,
  }),
}));

vi.mock('@sdkwork/react-core', () => ({
  storageManager: {
    reload: vi.fn(),
  },
  S3Provider: class {
    async testConnection() {
      return true;
    }
  },
  ServerProvider: class {
    async testConnection() {
      return true;
    }
  },
  platform: {
    getPlatform: () => 'web',
    selectDir: vi.fn(async () => null),
    selectFile: vi.fn(async () => []),
    copy: vi.fn(async () => {}),
  },
}));

vi.mock('@sdkwork/react-commons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/react-commons')>();
  return {
    ...actual,
    Button: ({ children }: { children: React.ReactNode }) =>
      React.createElement('button', null, children),
  };
});

describe('StorageSettings material storage UI', () => {
  it('renders MagicStudio root and material mode controls in settings', () => {
    const html = renderToStaticMarkup(<StorageSettings />);

    expect(html).toContain('MagicStudio Material Storage');
    expect(html).toContain('Local First (Recommended)');
    expect(html).toContain(DEFAULT_MAGICSTUDIO_ROOT_DIR);
    expect(html).toContain('MagicStudio Root');
    expect(html).toContain(`${DEFAULT_MAGICSTUDIO_ROOT_DIR}/cache-root`);
    expect(html).toContain(`${DEFAULT_MAGICSTUDIO_ROOT_DIR}/exports-root`);
    expect(html).not.toContain(
      `${DEFAULT_MAGICSTUDIO_ROOT_DIR}/workspaces/&lt;workspace&gt;/&lt;project&gt;/cache`
    );
    expect(html).not.toContain(
      `${DEFAULT_MAGICSTUDIO_ROOT_DIR}/workspaces/&lt;workspace&gt;/&lt;project&gt;/exports`
    );
  });
});
