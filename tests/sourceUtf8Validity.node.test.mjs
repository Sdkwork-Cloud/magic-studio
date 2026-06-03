import fs from 'node:fs';
import assert from 'node:assert/strict';

const decoder = new TextDecoder('utf-8', { fatal: true });

const sourceFiles = [
  'packages/sdkwork-magic-studio-core/src/services/media/mediaService.ts',
  'packages/sdkwork-magic-studio-magiccut/src/engine/config/RenderConfig.ts',
];

for (const file of sourceFiles) {
  const buffer = fs.readFileSync(new URL(`../${file}`, import.meta.url));
  assert.doesNotThrow(
    () => decoder.decode(buffer),
    `${file} should be valid UTF-8 so Vite dependency scanning can read it`
  );
}
