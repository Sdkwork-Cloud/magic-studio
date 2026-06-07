import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const contractFiles = [
  'videoService.contract-typecheck.ts',
  'videoGeneration.contract-typecheck.ts',
  'imageToVideo.contract-typecheck.ts',
  'videoStyleTransfer.contract-typecheck.ts',
  'videoExtend.contract-typecheck.ts',
  'videoLipSync.contract-typecheck.ts',
  'videoPromptEnhance.contract-typecheck.ts',
  'videoAsset.contract-typecheck.ts',
];

describe('video contract boundaries', () => {
  it.each(contractFiles)('%s uses the canonical runtime server contract', async (fileName) => {
    const source = await readFile(new URL(`./${fileName}`, import.meta.url), 'utf8');

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(false);
    expect(source.includes(`@sdkwork/${'app'}-sdk`)).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });
});
