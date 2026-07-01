import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('film service contract boundaries', () => {
  it('keeps film analysis contracts on the canonical runtime server boundary', async () => {
    const source = await readFile(
      new URL('./filmService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });

  it('keeps film project contracts on the canonical runtime server boundary', async () => {
    const source = await readFile(
      new URL('./filmProjectService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });
});
