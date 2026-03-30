import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSettings = vi.fn();
let storageMap = new Map<string, string>();

vi.mock('@sdkwork/react-settings', () => ({
  DEFAULT_SETTINGS: {
    appearance: {
      theme: 'dark',
      themeColor: 'lobster',
      fontFamily: 'Inter',
      fontSize: 13,
      lineHeight: 1.5,
      sidebarPosition: 'left',
      densityMode: 'standard',
    },
  },
  settingsService: {
    getSettings: mockGetSettings,
  },
}));

describe('ThemeManager', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetSettings.mockReset();
    storageMap = new Map();
    const styleMap = new Map<string, string>();
    const attributes = new Map<string, string>();
    const classes = new Set<string>();

    const root = {
      style: {
        setProperty: (name: string, value: string) => {
          styleMap.set(name, value);
        },
        getPropertyValue: (name: string) => styleMap.get(name) ?? '',
        colorScheme: '',
      },
      classList: {
        add: (...tokens: string[]) => tokens.forEach(token => classes.add(token)),
        remove: (...tokens: string[]) => tokens.forEach(token => classes.delete(token)),
        contains: (token: string) => classes.has(token),
      },
      setAttribute: (name: string, value: string) => {
        attributes.set(name, value);
      },
      getAttribute: (name: string) => attributes.get(name) ?? null,
      removeAttribute: (name: string) => {
        attributes.delete(name);
      },
    };

    Object.defineProperty(globalThis, 'document', {
      writable: true,
      value: {
        documentElement: root,
      },
    });

    Object.defineProperty(globalThis, 'window', {
      writable: true,
      value: {
        matchMedia: vi.fn().mockImplementation(() => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
        localStorage: {
          getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
          setItem: vi.fn((key: string, value: string) => {
            storageMap.set(key, value);
          }),
          removeItem: vi.fn((key: string) => {
            storageMap.delete(key);
          }),
          clear: vi.fn(() => {
            storageMap.clear();
          }),
        },
      },
    });
  });

  it('applies data-theme, dark mode, typography variables, and sidebar position from settings', async () => {
    mockGetSettings.mockResolvedValue({
      success: true,
      data: {
        appearance: {
          theme: 'dark',
          themeColor: 'zinc',
          fontFamily: 'IBM Plex Sans',
          fontSize: 15,
          lineHeight: 1.6,
          sidebarPosition: 'right',
          densityMode: 'comfortable',
        },
        editor: {
          fontFamily: 'JetBrains Mono',
          fontSize: 14,
        },
        terminal: {
          fontFamily: 'Fira Code',
          fontSize: 12,
          lineHeight: 1.3,
        },
      },
    });

    const { themeManager } = await import('./ThemeManager');

    await themeManager.initialize();

    expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('zinc');
    expect(globalThis.document.documentElement.getAttribute('data-density')).toBe('comfortable');
    expect(globalThis.document.documentElement.getAttribute('data-sidebar-position')).toBe('right');
    expect(globalThis.document.documentElement.classList.contains('dark')).toBe(true);
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-font-family')).toBe(
      'IBM Plex Sans',
    );
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-font-size')).toBe(
      '15px',
    );
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-line-height')).toBe(
      '1.6',
    );
  });

  it('primes the document from a persisted appearance snapshot before async hydration', async () => {
    storageMap.set(
      'magic_studio_appearance_snapshot_v1',
      JSON.stringify({
        appearance: {
          theme: 'light',
          themeColor: 'tech-blue',
          fontFamily: 'IBM Plex Sans',
          fontSize: 16,
          lineHeight: 1.7,
          densityMode: 'comfortable',
          sidebarPosition: 'right',
        },
        editor: {
          fontFamily: 'JetBrains Mono',
          fontSize: 15,
        },
        terminal: {
          fontFamily: 'Fira Code',
          fontSize: 14,
          lineHeight: 1.35,
        },
      }),
    );

    const { themeManager } = await import('./ThemeManager');

    themeManager.prime();

    expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('tech-blue');
    expect(globalThis.document.documentElement.getAttribute('data-density')).toBe('comfortable');
    expect(globalThis.document.documentElement.getAttribute('data-sidebar-position')).toBe('right');
    expect(globalThis.document.documentElement.classList.contains('dark')).toBe(false);
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-font-family')).toBe(
      'IBM Plex Sans',
    );
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-font-size')).toBe(
      '16px',
    );
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-line-height')).toBe(
      '1.7',
    );
    expect(
      globalThis.document.documentElement.style.getPropertyValue('--app-code-font-family'),
    ).toBe('JetBrains Mono');
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-code-font-size')).toBe(
      '15px',
    );
    expect(
      globalThis.document.documentElement.style.getPropertyValue('--app-terminal-font-family'),
    ).toBe('Fira Code');
    expect(
      globalThis.document.documentElement.style.getPropertyValue('--app-terminal-font-size'),
    ).toBe('14px');
  });

  it('persists the latest appearance snapshot for the next boot cycle', async () => {
    const { themeManager } = await import('./ThemeManager');

    themeManager.sync(
      {
        theme: 'light',
        themeColor: 'rose',
        fontFamily: 'IBM Plex Sans',
        fontSize: 15,
        lineHeight: 1.6,
        densityMode: 'compact',
        sidebarPosition: 'right',
      },
      {
        editor: {
          fontFamily: 'JetBrains Mono',
          fontSize: 14,
        },
        terminal: {
          fontFamily: 'Fira Code',
          fontSize: 13,
          lineHeight: 1.2,
        },
      },
    );

    const savedSnapshot = storageMap.get('magic_studio_appearance_snapshot_v1');

    expect(savedSnapshot).toBeTruthy();
    expect(savedSnapshot).toContain('"themeColor":"rose"');
    expect(savedSnapshot).toContain('"fontSize":15');
    expect(savedSnapshot).toContain('"sidebarPosition":"right"');
    expect(savedSnapshot).toContain('"fontFamily":"JetBrains Mono"');
    expect(savedSnapshot).toContain('"fontFamily":"Fira Code"');
  });

  it('prefers the desktop-injected appearance snapshot over stale localStorage data', async () => {
    storageMap.set(
      'magic_studio_appearance_snapshot_v1',
      JSON.stringify({
        appearance: {
          theme: 'dark',
          themeColor: 'lobster',
          fontFamily: 'Inter',
          fontSize: 13,
          lineHeight: 1.5,
          densityMode: 'standard',
          sidebarPosition: 'left',
        },
      }),
    );

    (globalThis.window as typeof globalThis.window & {
      __MAGIC_STUDIO_TAURI_APPEARANCE_SNAPSHOT__?: unknown;
    }).__MAGIC_STUDIO_TAURI_APPEARANCE_SNAPSHOT__ = {
      appearance: {
        theme: 'light',
        themeColor: 'tech-blue',
        fontFamily: 'IBM Plex Sans',
        fontSize: 16,
        lineHeight: 1.7,
        densityMode: 'comfortable',
        sidebarPosition: 'right',
      },
      editor: {
        fontFamily: 'JetBrains Mono',
        fontSize: 15,
      },
      terminal: {
        fontFamily: 'Fira Code',
        fontSize: 14,
        lineHeight: 1.35,
      },
    };

    const { themeManager } = await import('./ThemeManager');

    themeManager.prime();

    expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('tech-blue');
    expect(globalThis.document.documentElement.classList.contains('dark')).toBe(false);
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-font-size')).toBe(
      '16px',
    );
  });

  it('keeps the primed appearance when async settings hydration fails', async () => {
    storageMap.set(
      'magic_studio_appearance_snapshot_v1',
      JSON.stringify({
        appearance: {
          theme: 'light',
          themeColor: 'zinc',
          fontFamily: 'IBM Plex Sans',
          fontSize: 16,
          lineHeight: 1.7,
          densityMode: 'comfortable',
          sidebarPosition: 'right',
        },
      }),
    );
    mockGetSettings.mockRejectedValue(new Error('settings unavailable'));

    const { themeManager } = await import('./ThemeManager');

    themeManager.prime();
    await themeManager.initialize();

    expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('zinc');
    expect(globalThis.document.documentElement.getAttribute('data-density')).toBe('comfortable');
    expect(globalThis.document.documentElement.getAttribute('data-sidebar-position')).toBe('right');
    expect(globalThis.document.documentElement.classList.contains('dark')).toBe(false);
    expect(globalThis.document.documentElement.style.getPropertyValue('--app-font-size')).toBe(
      '16px',
    );
  });
});
