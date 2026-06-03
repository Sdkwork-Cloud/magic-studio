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

test('image generator wrappers stop statically importing ImageLeftGeneratorPanel directly', () => {
  const aiModalSource = readSource(
    'packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx',
  );
  const modalSource = readSource(
    'packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx',
  );

  for (const [relativePath, source] of [
    ['packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx', aiModalSource],
    ['packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx', modalSource],
  ]) {
    assert.doesNotMatch(
      source,
      /from '\.\/ImageLeftGeneratorPanel'|from "\.\/ImageLeftGeneratorPanel"/,
      `Expected ${relativePath} to stop statically importing ImageLeftGeneratorPanel.`,
    );
  }
});

test('image modal content modules render the panel through LazyImageLeftGeneratorPanel', () => {
  const aiContentSource = readSource(
    'packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModalContent.tsx',
  );
  const modalContentSource = readSource(
    'packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModalContent.tsx',
  );

  for (const [relativePath, source] of [
    ['packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModalContent.tsx', aiContentSource],
    ['packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModalContent.tsx', modalContentSource],
  ]) {
    assert.match(
      source,
      /from '\.\/LazyImageLeftGeneratorPanel'|from "\.\/LazyImageLeftGeneratorPanel"/,
      `Expected ${relativePath} to render the panel through LazyImageLeftGeneratorPanel.`,
    );
  }
});

test('LazyImageLeftGeneratorPanel owns the async import boundary', () => {
  const wrapperSource = readSource(
    'packages/sdkwork-magic-studio-image/src/components/LazyImageLeftGeneratorPanel.tsx',
  );

  assert.match(
    wrapperSource,
    /lazy\(\(\)\s*=>[\s\S]*import\('\.\/ImageLeftGeneratorPanel'\)|lazy\(\(\)\s*=>[\s\S]*import\("\.\/ImageLeftGeneratorPanel"\)/,
    'Expected LazyImageLeftGeneratorPanel to lazy-load the heavy ImageLeftGeneratorPanel module.',
  );
  assert.match(
    wrapperSource,
    /Suspense/,
    'Expected LazyImageLeftGeneratorPanel to own the Suspense fallback for the async panel boundary.',
  );
});
