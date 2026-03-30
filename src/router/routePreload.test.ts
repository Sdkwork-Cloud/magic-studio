import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('route preload startup policy', () => {
  it('does not eagerly preload heavy home route modules during initial startup', () => {
    const sourcePath = path.resolve(process.cwd(), 'src/router/routePreload.ts');
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).not.toContain("if (isRoute(currentPath, ROUTES.HOME)) {\r\n    return ['portal-video', 'skills', 'plugins', 'film'];\r\n  }");
    expect(source).not.toContain("if (isRoute(currentPath, ROUTES.HOME)) {\n    return ['portal-video', 'skills', 'plugins', 'film'];\n  }");
  });
});
