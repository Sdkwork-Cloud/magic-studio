import { describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {
    readdir: vi.fn(async () => ['/workspace/src', '/workspace/README.md']),
    stat: vi.fn(async (path: string) => ({
      isDirectory: path.endsWith('/src'),
    })),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
    rename: vi.fn(),
  },
}));

import { editorService } from './editorService';

describe('editorService', () => {
  it('builds file entries with a stable identity derived from path', async () => {
    const result = await editorService.loadProjectTree('/workspace');

    expect(result.success).toBe(true);
    for (const entry of result.data || []) {
      expect(entry.uuid).toBe(entry.id);
    }
  });
});
