import { describe, expect, it, vi } from 'vitest';

describe('platform import safety', () => {
  it('loads the core entrypoint in node-like runtimes without eagerly requiring indexeddb', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const coreModule = await import('../../index');

    expect(logSpy).not.toHaveBeenCalled();
    expect(coreModule.platform.getPlatform()).toBe('web');
    expect(coreModule.webPlatform.getPlatform()).toBe('web');
    expect(typeof coreModule.resolveRuntimeMagicStudioRootLayout).toBe('function');
    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
