import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('auth route metadata', () => {
  it('marks user-account routes as protected across route registries', () => {
    const sources = [
      readSource('src/router/registry.tsx'),
      readSource('src/router/packageRoutes.tsx'),
      readSource('src/router/packageRouteLoader.tsx'),
    ];

    for (const source of sources) {
      expect(source).toMatch(/path:\s*ROUTES\.PROFILE[\s\S]*?requiresAuth:\s*true/);
      expect(source).toMatch(/path:\s*ROUTES\.MY_TASKS[\s\S]*?requiresAuth:\s*true/);
    }
  });
});
