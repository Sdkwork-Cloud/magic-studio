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

test('magiccut shell-critical files avoid broad root entry imports and keep the layout behind a lazy boundary', () => {
  const expectations = [
    {
      relativePath: 'src/app/App.tsx',
      disallowedPatterns: [
        /import\s+\{\s*MagicCutLayout\s*\}\s+from\s+['"]\.\.\/layouts\/MagicCutLayout\/MagicCutLayout['"]/,
      ],
      expectedPatterns: [
        /lazy\(\(\)\s*=>\s*import\(['"]\.\.\/layouts\/MagicCutLayout\/MagicCutLayout['"]\)/,
      ],
    },
    {
      relativePath: 'src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-magiccut['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-magiccut\/store/,
      ],
    },
    {
      relativePath: 'src/router/registry/runtime.tsx',
      disallowedPatterns: [
        /import\('@sdkwork\/magic-studio-magiccut'\)/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-magiccut\/pages/,
        /@sdkwork\/magic-studio-magiccut\/store/,
      ],
    },
    {
      relativePath: 'src/router/packageRoutes.tsx',
      disallowedPatterns: [],
      expectedPatterns: [
        /from '\.\/registry'|from "\.\/registry"/,
      ],
    },
    {
      relativePath: 'src/router/packageRouteLoader.tsx',
      disallowedPatterns: [],
      expectedPatterns: [
        /from '\.\/registry'|from "\.\/registry"/,
      ],
    },
    {
      relativePath: 'src/router/routePreload.ts',
      disallowedPatterns: [
        /import\('@sdkwork\/magic-studio-magiccut'\)/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-magiccut\/pages/,
        /@sdkwork\/magic-studio-magiccut\/store/,
      ],
    },
  ];

  for (const { relativePath, disallowedPatterns, expectedPatterns } of expectations) {
    const source = readSource(relativePath);

    for (const pattern of disallowedPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `Expected ${relativePath} to stop using a shell-broad MagicCut import path.`,
      );
    }

    for (const pattern of expectedPatterns) {
      assert.match(
        source,
        pattern,
        `Expected ${relativePath} to use the focused MagicCut boundary.`,
      );
    }
  }
});
