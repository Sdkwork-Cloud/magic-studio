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

const CANVAS_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/services',
      '@sdkwork/magic-studio-assets/creation-chat',
      '@sdkwork/magic-studio-assets/entities',
    ],
  },
];

test('canvas runtime files use focused magic-studio-assets subpaths instead of the broad package root', () => {
  for (const { relativePath, expectedSubpaths } of CANVAS_FILE_EXPECTATIONS) {
    const source = readSource(relativePath);

    assert.doesNotMatch(
      source,
      /from '@sdkwork\/magic-studio-assets'|from "@sdkwork\/magic-studio-assets"/,
      `Expected ${relativePath} to stop importing runtime capabilities from the broad magic-studio-assets root entry.`,
    );

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${relativePath} to import from ${subpath}.`,
      );
    }
  }
});
