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

test('AIImageGeneratorModal lazy-loads its heavy image workspace content', () => {
  const modalSource = readSource('packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx');

  assert.match(
    modalSource,
    /lazy\(\(\)\s*=>[\s\S]*import\('\.\/AIImageGeneratorModalContent'\)|lazy\(\(\)\s*=>[\s\S]*import\("\.\/AIImageGeneratorModalContent"\)/,
    'Expected AIImageGeneratorModal to lazy-load AIImageGeneratorModalContent.',
  );
  assert.doesNotMatch(
    modalSource,
    /from '\.\.\/store\/imageStore'|from "\.\.\/store\/imageStore"|from '@sdkwork\/magic-studio-generation-history'|from "@sdkwork\/magic-studio-generation-history"|from '\.\/ImageGridEditorModal'|from "\.\/ImageGridEditorModal"|from '\.\/ImageCanvasEditorModal'|from "\.\/ImageCanvasEditorModal"|from '@sdkwork\/magic-studio-assets\/services'|from "@sdkwork\/magic-studio-assets\/services"|from '\.\/LazyImageLeftGeneratorPanel'|from "\.\/LazyImageLeftGeneratorPanel"/,
    'Expected AIImageGeneratorModal wrapper to stop statically importing heavy image workspace dependencies.',
  );
});

test('AIImageGeneratorModalContent owns the heavy image workspace dependencies', () => {
  const contentSource = readSource('packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModalContent.tsx');

  assert.match(
    contentSource,
    /from '\.\.\/store\/imageStore'|from "\.\.\/store\/imageStore"/,
    'Expected AIImageGeneratorModalContent to import ImageStoreProvider and useImageStore behind the lazy boundary.',
  );
  assert.match(
    contentSource,
    /from '@sdkwork\/magic-studio-generation-history'|from "@sdkwork\/magic-studio-generation-history"/,
    'Expected AIImageGeneratorModalContent to import generation history behind the lazy boundary.',
  );
  assert.match(
    contentSource,
    /from '\.\/ImageGridEditorModal'|from "\.\/ImageGridEditorModal"/,
    'Expected AIImageGeneratorModalContent to import ImageGridEditorModal behind the lazy boundary.',
  );
  assert.match(
    contentSource,
    /from '\.\/ImageCanvasEditorModal'|from "\.\/ImageCanvasEditorModal"/,
    'Expected AIImageGeneratorModalContent to import ImageCanvasEditorModal behind the lazy boundary.',
  );
});

test('ImageGeneratorModal lazy-loads its heavy image picker workspace content', () => {
  const modalSource = readSource('packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx');

  assert.match(
    modalSource,
    /lazy\(\(\)\s*=>[\s\S]*import\('\.\/ImageGeneratorModalContent'\)|lazy\(\(\)\s*=>[\s\S]*import\("\.\/ImageGeneratorModalContent"\)/,
    'Expected ImageGeneratorModal to lazy-load ImageGeneratorModalContent.',
  );
  assert.doesNotMatch(
    modalSource,
    /from '\.\.\/store\/imageStore'|from "\.\.\/store\/imageStore"|from '@sdkwork\/magic-studio-assets\/generation'|from "@sdkwork\/magic-studio-assets\/generation"|from '\.\/LazyImageLeftGeneratorPanel'|from "\.\/LazyImageLeftGeneratorPanel"/,
    'Expected ImageGeneratorModal wrapper to stop statically importing heavy picker workspace dependencies.',
  );
});

test('ImageGeneratorModalContent owns the heavy picker workspace dependencies', () => {
  const contentSource = readSource('packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModalContent.tsx');

  assert.match(
    contentSource,
    /from '\.\.\/store\/imageStore'|from "\.\.\/store\/imageStore"/,
    'Expected ImageGeneratorModalContent to import ImageStoreProvider and useImageStore behind the lazy boundary.',
  );
  assert.match(
    contentSource,
    /from '@sdkwork\/magic-studio-assets\/generation'|from "@sdkwork\/magic-studio-assets\/generation"/,
    'Expected ImageGeneratorModalContent to import GenerationHistoryListPane behind the lazy boundary.',
  );
  assert.match(
    contentSource,
    /from '\.\/LazyImageLeftGeneratorPanel'|from "\.\/LazyImageLeftGeneratorPanel"/,
    'Expected ImageGeneratorModalContent to render the generator panel behind the lazy content boundary.',
  );
});
