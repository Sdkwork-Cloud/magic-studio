import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('app startup boundaries', () => {
  it('keeps shell layouts behind lazy boundaries instead of importing them into the root app chunk', () => {
    const source = readSource('src/app/App.tsx');

    expect(source).not.toContain("from '../layouts/MainLayout/MainLayout'");
    expect(source).not.toContain("from '../layouts/GenerationLayout/GenerationLayout'");
    expect(source).not.toContain("from '../layouts/CreationLayout/CreationLayout'");
    expect(source).not.toContain("from '../layouts/VibeLayout/VibeLayout'");
    expect(source).not.toContain("from '../layouts/MagicCutLayout/MagicCutLayout'");
    expect(source).not.toContain("from '../layouts/NotesLayout/NotesLayout'");
    expect(source).not.toContain("from '../layouts/BlankLayout/BlankLayout'");

    expect(source).toContain("import('../layouts/MainLayout/MainLayout')");
    expect(source).toContain("import('../layouts/BlankLayout/BlankLayout')");
  });

  it('does not mount the chat store provider globally when booting non-chat routes', () => {
    const providerSource = readSource('src/app/AppProvider.tsx');
    const routeRegistrySource = readSource('src/router/registry.tsx');

    expect(providerSource).not.toContain("import { ChatStoreProvider } from '@sdkwork/react-chat'");
    expect(routeRegistrySource).toContain("import('@sdkwork/react-chat').then(m => ({ default: m.ChatStoreProvider }))");
    expect(routeRegistrySource).toContain("path: ROUTES.CHAT");
    expect(routeRegistrySource).toContain("provider: ChatStoreProvider");
  });

  it('does not mount the notification store provider globally when booting the root shell', () => {
    const providerSource = readSource('src/app/AppProvider.tsx');
    const routeRegistrySource = readSource('src/router/registry.tsx');

    expect(providerSource).not.toContain("import { NotificationStoreProvider } from '@sdkwork/react-notifications'");
    expect(routeRegistrySource).toContain("import('@sdkwork/react-notifications').then(m => ({ default: m.NotificationStoreProvider }))");
    expect(routeRegistrySource).toContain("path: ROUTES.HOME");
    expect(routeRegistrySource).toContain("provider: NotificationStoreProvider");
  });
});
