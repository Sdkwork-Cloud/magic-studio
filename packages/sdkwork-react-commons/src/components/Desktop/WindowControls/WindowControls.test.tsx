import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WindowControls } from './WindowControls';

const clearWindow = () => {
  Reflect.deleteProperty(globalThis as Record<string, unknown>, 'window');
};

describe('WindowControls', () => {
  afterEach(() => {
    clearWindow();
  });

  it('renders nothing when no desktop bridge is available', () => {
    clearWindow();
    expect(renderToStaticMarkup(<WindowControls />)).toBe('');
  });

  it('renders desktop window actions when a bridge is available', () => {
    Reflect.set(globalThis as Record<string, unknown>, 'window', {
      __sdkworkPlatform: {
        getPlatform: () => 'desktop',
        minimizeWindow: () => undefined,
        maximizeWindow: () => undefined,
        closeWindow: () => undefined,
      },
    });

    const html = renderToStaticMarkup(<WindowControls />);

    expect(html).toContain('Minimize');
    expect(html).toContain('Maximize');
    expect(html).toContain('Close');
  });
});
