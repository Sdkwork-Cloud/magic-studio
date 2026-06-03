import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const CONTRACT_FILES = [
  'voiceSpeaker.contract-typecheck.ts',
  'voiceSpeakerMarket.contract-typecheck.ts',
  'voiceSpeakerClone.contract-typecheck.ts',
  'voiceSpeakerGeneration.contract-typecheck.ts',
] as const;

describe('voice speaker contract boundaries', () => {
  it.each(CONTRACT_FILES)('%s uses the canonical runtime server contract', async (fileName) => {
    const source = await readFile(new URL(`./${fileName}`, import.meta.url), 'utf8');

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });
});
