import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WindowControls } from './WindowControls';
import {
  resetWindowControlServiceAdapter,
  setWindowControlServiceAdapter,
} from '../../../services/windowControlService';

const clearWindow = () => {
  Reflect.deleteProperty(globalThis as Record<string, unknown>, 'window');
};

describe('WindowControls', () => {
  afterEach(() => {
    resetWindowControlServiceAdapter();
    clearWindow();
  });

  it('renders nothing when no desktop bridge is available', () => {
    clearWindow();
    expect(renderToStaticMarkup(<WindowControls />)).toBe('');
  });

  it('renders desktop window actions when a bridge is available', () => {
    setWindowControlServiceAdapter({
      isAvailable: () => true,
      isMaximized: async () => false,
      minimize: async () => undefined,
      maximize: async () => false,
      close: async () => undefined,
    });

    const html = renderToStaticMarkup(<WindowControls />);

    expect(html).toContain('Minimize');
    expect(html).toContain('Maximize');
    expect(html).toContain('Close');
  });
});
