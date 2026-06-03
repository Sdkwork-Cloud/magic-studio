import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

const ROOT_IMPORT_PATTERN =
  /(?:from '@sdkwork\/magic-studio-chat'|from "@sdkwork\/magic-studio-chat"|import\('@sdkwork\/magic-studio-chat'\)|import\("@sdkwork\/magic-studio-chat"\))/;

test('chat runtime files use focused store/pages/embedded-pane subpaths instead of the broad chat root entry', () => {
  const expectedImports = [
    {
      relativePath: 'src/app/AppProvider.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/store'],
    },
    {
      relativePath: 'src/router/registry/runtime.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/pages'],
    },
    {
      relativePath: 'src/router/packageRoutes.tsx',
      expectedSubpaths: ['./registry'],
    },
    {
      relativePath: 'src/router/packageRouteLoader.tsx',
      expectedSubpaths: ['./registry'],
    },
    {
      relativePath: 'src/app/bootstrap.ts',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/i18n'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-chatppt/src/components/PPTChatPane.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/embedded-pane'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-editor/src/components/AIChatPane.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/embedded-pane'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-film/src/components/FilmChatPanel.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/embedded-pane'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-notes/src/components/NoteChatPane.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/embedded-pane'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-canvas/src/components/CanvasChatPane.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-chat/embedded-pane'],
    },
  ];

  for (const { relativePath, expectedSubpaths } of expectedImports) {
    const source = readSource(relativePath);

    if (relativePath === 'src/router/registry/runtime.tsx') {
      assert.doesNotMatch(
        source,
        ROOT_IMPORT_PATTERN,
        `Expected ${relativePath} to stop importing runtime capabilities from the broad @sdkwork/magic-studio-chat root entry.`,
      );
    }

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${relativePath} to import from ${subpath}.`,
      );
    }
  }
});
