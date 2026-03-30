import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('portal route loading boundaries', () => {
  it('loads the home portal from a dedicated PortalPage entrypoint instead of the root barrel', () => {
    const source = readSource('src/pages/HomePage.tsx');

    expect(source).toContain("@sdkwork/react-portal-video/pages/PortalPage");
    expect(source).not.toContain("import('@sdkwork/react-portal-video')");
  });

  it('keeps route registries on page-level portal entrypoints', () => {
    const sources = [
      readSource('src/router/registry.tsx'),
      readSource('src/router/packageRoutes.tsx'),
      readSource('src/router/packageRouteLoader.tsx'),
    ];

    for (const source of sources) {
      expect(source).toContain("@sdkwork/react-portal-video/pages/PortalPage");
      expect(source).toContain("@sdkwork/react-portal-video/pages/AIToolsPage");
      expect(source).toContain("@sdkwork/react-portal-video/pages/CommunityPage");
      expect(source).not.toContain("import('@sdkwork/react-portal-video').then");
    }
  });

  it('preloads only the portal home entrypoint for portal routes', () => {
    const source = readSource('src/router/routePreload.ts');

    expect(source).toContain("import('@sdkwork/react-portal-video/pages/PortalPage')");
    expect(source).not.toContain("import('@sdkwork/react-portal-video')");
  });

  it('keeps the home portal lazy instead of preloading it during module evaluation', () => {
    const source = readSource('src/pages/HomePage.tsx');

    expect(source).toContain("lazy(() => import('@sdkwork/react-portal-video/pages/PortalPage'))");
    expect(source).not.toContain('portalPagePromise =');
    expect(source).not.toContain('preloadHomePortalPage()');
    expect(source).not.toContain('void portalPagePromise');
  });
});
