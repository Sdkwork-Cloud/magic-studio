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
  /(?:from '@sdkwork\/magic-studio-vip'|from "@sdkwork\/magic-studio-vip"|import\('@sdkwork\/magic-studio-vip'\)|import\("@sdkwork\/magic-studio-vip"\))/;

test('vip runtime files use focused store/pages/pricing-modal subpaths instead of the broad vip root entry', () => {
  const expectedImports = [
    {
      relativePath: 'src/app/AppProvider.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-vip/store'],
    },
    {
      relativePath: 'src/router/registry/runtime.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-vip/pages'],
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
      relativePath: 'src/layouts/MainLayout/MainSidebar.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-vip/pricing-modal'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-vip/pricing-modal'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/PortalSidebar.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-vip/pricing-modal'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-trade/src/components/Layout/TradeLayout.tsx',
      expectedSubpaths: ['@sdkwork/magic-studio-vip/pricing-modal'],
    },
  ];

  for (const { relativePath, expectedSubpaths } of expectedImports) {
    const source = readSource(relativePath);

    if (relativePath === 'src/router/registry/runtime.tsx') {
      assert.doesNotMatch(
        source,
        ROOT_IMPORT_PATTERN,
        `Expected ${relativePath} to stop importing runtime capabilities from the broad @sdkwork/magic-studio-vip root entry.`,
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
