import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseDotEnv } from '../check-release-api-target.mjs';

const repoRoot = path.resolve(__dirname, '..', '..');
const referenceRoot = path.resolve(
  repoRoot,
  '..',
  'sdkwork-backend-react-web'
);

function readEnv(relativePath: string) {
  return parseDotEnv(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readReferenceEnv(relativePath: string) {
  return parseDotEnv(fs.readFileSync(path.join(referenceRoot, relativePath), 'utf8'));
}

describe('env access token alignment', () => {
  it('uses the backend reference dev access token for non-production envs', () => {
    const referenceDev = readReferenceEnv('.env.development');
    const expectedToken = referenceDev.VITE_ACCESS_TOKEN;
    const envNames = ['.env.development', '.env.test', '.env.staging'];

    for (const envName of envNames) {
      const env = readEnv(envName);
      expect(env.VITE_ACCESS_TOKEN).toBe(expectedToken);
      expect(env.SDKWORK_ACCESS_TOKEN).toBe(expectedToken);
    }
  });

  it('keeps production access token aligned to the backend production env', () => {
    const referenceProd = readReferenceEnv('.env.production');
    const env = readEnv('.env.production');

    expect(env.VITE_ACCESS_TOKEN).toBe(referenceProd.VITE_ACCESS_TOKEN);
    expect(env.SDKWORK_ACCESS_TOKEN).toBe(referenceProd.VITE_ACCESS_TOKEN);
  });
});
