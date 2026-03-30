import { describe, expect, it } from 'vitest';

import { normalizeAppMode, resolveAppMode } from '../app-mode.mjs';

describe('normalizeAppMode', () => {
  it('maps shorthand aliases to vite modes', () => {
    expect(normalizeAppMode('dev')).toBe('development');
    expect(normalizeAppMode('prod')).toBe('production');
  });

  it('keeps explicit test and staging modes intact', () => {
    expect(normalizeAppMode('test')).toBe('test');
    expect(normalizeAppMode('staging')).toBe('staging');
  });
});

describe('resolveAppMode', () => {
  it('defaults dev commands to development mode', () => {
    expect(resolveAppMode({ command: 'dev' })).toBe('development');
  });

  it('defaults build commands to production mode', () => {
    expect(resolveAppMode({ command: 'build' })).toBe('production');
  });

  it('allows an explicit mode to override the command default', () => {
    expect(resolveAppMode({ command: 'build', requestedMode: 'test' })).toBe('test');
  });
});
