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

test('editor and drive runtime files use focused subpaths instead of broad root entries on shell-critical paths', () => {
  const expectations = [
    {
      relativePath: 'src/layouts/MainLayout/EditorProjectActions.tsx',
      disallowedPatterns: [
        /from '@sdkwork\/magic-studio-editor'|from "@sdkwork\/magic-studio-editor"/,
      ],
      expectedSubpaths: ['@sdkwork/magic-studio-editor/project-actions'],
    },
    {
      relativePath: 'src/router/registry/runtime.tsx',
      disallowedPatterns: [
        /import\('@sdkwork\/magic-studio-drive'\)/,
        /import\('@sdkwork\/magic-studio-editor'\)/,
      ],
      expectedSubpaths: [
        '@sdkwork/magic-studio-drive/pages',
        '@sdkwork/magic-studio-editor/pages',
        '@sdkwork/magic-studio-editor/store',
      ],
    },
    {
      relativePath: 'src/router/packageRouteLoader.tsx',
      disallowedPatterns: [],
      expectedSubpaths: [
        './registry',
      ],
    },
    {
      relativePath: 'src/router/packageRoutes.tsx',
      disallowedPatterns: [],
      expectedSubpaths: [
        './registry',
      ],
    },
    {
      relativePath: 'src/router/routePreload.ts',
      disallowedPatterns: [
        /import\('@sdkwork\/magic-studio-drive'\)/,
        /import\('@sdkwork\/magic-studio-editor'\)/,
      ],
      expectedSubpaths: [
        '@sdkwork/magic-studio-drive/pages',
        '@sdkwork/magic-studio-editor/pages',
        '@sdkwork/magic-studio-editor/store',
      ],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-drive/src/components/DriveGrid.tsx',
      disallowedPatterns: [
        /from '@sdkwork\/magic-studio-editor'|from "@sdkwork\/magic-studio-editor"/,
      ],
      expectedSubpaths: ['@sdkwork/magic-studio-editor/file-icon'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx',
      disallowedPatterns: [
        /from '@sdkwork\/magic-studio-editor'|from "@sdkwork\/magic-studio-editor"/,
      ],
      expectedSubpaths: ['@sdkwork/magic-studio-editor/file-icon'],
    },
  ];

  for (const { relativePath, disallowedPatterns, expectedSubpaths } of expectations) {
    const source = readSource(relativePath);

    for (const pattern of disallowedPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `Expected ${relativePath} to stop importing through the broad drive/editor root entry.`,
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
