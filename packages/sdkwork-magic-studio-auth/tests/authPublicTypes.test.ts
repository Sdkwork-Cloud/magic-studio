import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('auth public type surface', () => {
  it('does not re-export generated SDK types from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('../src/index.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('ships local auth public type definitions', async () => {
    await expect(
      access(
        new URL('../src/contracts/authPublicTypes.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships an auth public contract typecheck guard', async () => {
    await expect(
      access(
        new URL('../src/authPublicTypes.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('keeps the contract guard on the runtime server auth boundary', async () => {
    const source = await readFile(
      new URL('../src/authPublicTypes.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(
      false,
    );
    expect(source.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });

  it('ships a dedicated auth contract tsconfig', async () => {
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships an auth contract typecheck script', async () => {
    const packageJson = JSON.parse(
      await readFile(
        new URL('../package.json', import.meta.url),
        'utf8',
      ),
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['typecheck:contract']).toBe(
      'node ../../scripts/run-package-typecheck.mjs tsconfig.contract.json',
    );
  });
});
