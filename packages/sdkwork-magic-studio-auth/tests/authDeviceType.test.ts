import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPlatformRuntime: vi.fn(),
  isBrowserHostedRuntimeKind: vi.fn((kind: string) => kind === 'web' || kind === 'server'),
  isDesktopShellRuntimeKind: vi.fn((kind: string) => kind === 'desktop'),
}));

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  getPlatformRuntime: mocks.getPlatformRuntime,
  isBrowserHostedRuntimeKind: mocks.isBrowserHostedRuntimeKind,
  isDesktopShellRuntimeKind: mocks.isDesktopShellRuntimeKind,
}));

import {
  normalizeAuthDeviceType,
  resolveAuthDeviceType,
  resolveAuthDeviceTypeForRuntimeKind,
} from '../src/runtime/authDeviceType';

describe('authDeviceType', () => {
  it('maps browser-hosted server runtime to the web auth device family', () => {
    expect(resolveAuthDeviceTypeForRuntimeKind('server')).toBe('web');
  });

  it('maps desktop shell runtime to the desktop auth device family', () => {
    expect(resolveAuthDeviceTypeForRuntimeKind('desktop')).toBe('desktop');
  });

  it('preserves canonical auth device values', () => {
    expect(normalizeAuthDeviceType('desktop')).toBe('desktop');
    expect(normalizeAuthDeviceType('web')).toBe('web');
  });

  it('normalizes upstream mobile auth device values to the current runtime family', () => {
    mocks.getPlatformRuntime.mockReturnValue({
      system: {
        kind: () => 'desktop',
      },
    });

    expect(normalizeAuthDeviceType('ios')).toBe('desktop');
    expect(normalizeAuthDeviceType('android')).toBe('desktop');
  });

  it('falls back to web when runtime access is unavailable', () => {
    mocks.getPlatformRuntime.mockImplementation(() => {
      throw new Error('runtime unavailable');
    });

    expect(resolveAuthDeviceType()).toBe('web');
  });
});
