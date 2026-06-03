import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const readSource = (relativePath) =>
  fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('notes shell/runtime files use focused notes and editor subpaths instead of broad root entries', () => {
  const expectations = [
    {
      relativePath: 'src/router/registry/runtime.tsx',
      disallowedPatterns: [/import\('@sdkwork\/magic-studio-notes'\)/],
      expectedSubpaths: ['@sdkwork/magic-studio-notes/pages'],
    },
    {
      relativePath: 'src/router/packageRoutes.tsx',
      disallowedPatterns: [],
      expectedSubpaths: ['./registry'],
    },
    {
      relativePath: 'src/router/packageRouteLoader.tsx',
      disallowedPatterns: [],
      expectedSubpaths: ['./registry'],
    },
    {
      relativePath: 'src/router/routePreload.ts',
      disallowedPatterns: [/import\('@sdkwork\/magic-studio-notes'\)/],
      expectedSubpaths: ['@sdkwork/magic-studio-notes/pages'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-notes/src/pages/NotesPage.tsx',
      disallowedPatterns: [
        /from '\.\.\/index'|from "\.\.\/index"/,
      ],
      expectedSubpaths: ['../components/NoteSidebar', '../components/NoteEditor'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-notes/src/components/NoteEditor.tsx',
      disallowedPatterns: [
        /from '@sdkwork\/magic-studio-editor'|from "@sdkwork\/magic-studio-editor"/,
      ],
      expectedSubpaths: ['@sdkwork/magic-studio-editor/file-picker'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-notes/src/components/menus/BlockFloatingMenu.tsx',
      disallowedPatterns: [
        /from '@sdkwork\/magic-studio-editor'|from "@sdkwork\/magic-studio-editor"/,
      ],
      expectedSubpaths: ['@sdkwork/magic-studio-editor/file-picker'],
    },
  ];

  for (const { relativePath, disallowedPatterns, expectedSubpaths } of expectations) {
    const source = readSource(relativePath);

    for (const pattern of disallowedPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `Expected ${relativePath} to stop importing through the broad notes/editor root entry.`,
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
