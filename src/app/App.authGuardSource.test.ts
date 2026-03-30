import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('App auth guard wiring', () => {
  it('gates protected routes on auth restoration before redirecting to login', () => {
    const source = readSource('src/app/App.tsx');

    expect(source).toContain('useAuthStore');
    expect(source).toContain('resolveAuthRouteAccess');
    expect(source).toContain('buildLoginRedirectQuery');
    expect(source).toContain("accessDecision === 'pending'");
    expect(source).toContain('navigate(ROUTES.LOGIN, buildLoginRedirectQuery(currentPath, currentQuery))');
  });
});
