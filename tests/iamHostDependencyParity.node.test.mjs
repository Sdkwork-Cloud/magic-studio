import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8'));
}

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

function resolveSharedUiRuntimePackages() {
  const uiPackage = readJson('../sdkwork-ui/sdkwork-ui-pc-react/package.json');
  const dependencyNames = Object.keys(uiPackage.dependencies ?? {});

  return dependencyNames
    .filter((dependencyName) => (
      dependencyName.startsWith('@radix-ui/react-')
      || dependencyName === '@tanstack/react-table'
      || dependencyName === 'class-variance-authority'
      || dependencyName === 'clsx'
      || dependencyName === 'cmdk'
      || dependencyName === 'lucide-react'
      || dependencyName === 'react-day-picker'
      || dependencyName === 'react-hook-form'
      || dependencyName === 'react-resizable-panels'
      || dependencyName === 'sonner'
      || dependencyName === 'tailwind-merge'
    ))
    .sort();
}

test('host owns and dedupes shared UI React runtime dependencies', () => {
  const hostPackage = readJson('package.json');
  const viteConfigSource = readSource('vite.config.ts');
  const requiredPackages = resolveSharedUiRuntimePackages();

  for (const dependencyName of requiredPackages) {
    assert.ok(
      hostPackage.dependencies?.[dependencyName],
      `Expected Magic Studio to declare ${dependencyName} so shared UI sources resolve through the host runtime.`,
    );
    assert.match(
      viteConfigSource,
      new RegExp(`['"]${dependencyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`),
      `Expected vite.config.ts to dedupe/alias ${dependencyName} through the host runtime.`,
    );
  }
});
