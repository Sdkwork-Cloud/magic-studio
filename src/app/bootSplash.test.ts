import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('boot splash lifecycle', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('keeps the splash mounted through the first paint and removes it after the fade completes', async () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    const listeners = new Map<string, EventListener>();
    const splash = {
      dataset: {} as Record<string, string>,
      addEventListener: vi.fn((type: string, callback: EventListener) => {
        listeners.set(type, callback);
      }),
      remove: vi.fn(),
    };

    Object.defineProperty(globalThis, 'document', {
      writable: true,
      value: {
        getElementById: vi.fn((id: string) => (id === 'boot-splash' ? splash : null)),
      },
    });

    Object.defineProperty(globalThis, 'window', {
      writable: true,
      value: {
        requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
          rafCallbacks.push(callback);
          return rafCallbacks.length;
        }),
        setTimeout: vi.fn(),
        clearTimeout: vi.fn(),
      },
    });

    const { dismissBootSplashAfterPaint } = await import('./bootSplash');

    dismissBootSplashAfterPaint();

    expect(rafCallbacks).toHaveLength(1);

    const firstFrame = rafCallbacks.shift();
    firstFrame?.(0);
    expect(rafCallbacks).toHaveLength(1);
    expect(splash.dataset.state).toBeUndefined();

    const secondFrame = rafCallbacks.shift();
    secondFrame?.(16);
    expect(splash.dataset.state).toBe('ready');
    expect(splash.remove).not.toHaveBeenCalled();

    listeners.get('transitionend')?.(new Event('transitionend'));
    expect(splash.remove).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the splash container is already missing', async () => {
    Object.defineProperty(globalThis, 'document', {
      writable: true,
      value: {
        getElementById: vi.fn(() => null),
      },
    });

    Object.defineProperty(globalThis, 'window', {
      writable: true,
      value: {
        requestAnimationFrame: vi.fn(),
        setTimeout: vi.fn(),
        clearTimeout: vi.fn(),
      },
    });

    const { dismissBootSplashAfterPaint } = await import('./bootSplash');

    expect(() => dismissBootSplashAfterPaint()).not.toThrow();
  });
});
