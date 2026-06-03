import { describe, expect, it } from 'vitest';
import {
  MAGIC_STUDIO_DEV_SERVER_MARKER,
  classifyDevServerHtml,
} from '../tauri-dev-server.mjs';

describe('tauri-dev-server', () => {
  it('classifies the current project only when the explicit marker is present', () => {
    const html = `<!doctype html><html><head><meta name="magic-studio-app-id" content="${MAGIC_STUDIO_DEV_SERVER_MARKER}"></head></html>`;

    expect(classifyDevServerHtml(html)).toBe('current-project');
  });

  it('treats generic vite pages as foreign services', () => {
    const html = '<!doctype html><html><body><script type="module" src="/@vite/client"></script></body></html>';

    expect(classifyDevServerHtml(html)).toBe('foreign-service');
  });

  it('treats empty responses as unknown services', () => {
    expect(classifyDevServerHtml('')).toBe('unknown');
  });
});
