import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..');

describe('release bundle verification scripts', () => {
  it('defines a verified desktop release pipeline before bundling', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
    ) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['verify:sdk-mode-parity']).toBe(
      'node scripts/check-sdk-mode-parity.mjs'
    );
    expect(packageJson.scripts?.['verify:iam-route-css-budget']).toBe(
      'node scripts/check-iam-route-css-budget.mjs'
    );
    expect(packageJson.scripts?.['verify:release:artifacts']).toBe(
      'node scripts/run-pnpm-cli.mjs run verify:iam-route-css-budget && node scripts/run-pnpm-cli.mjs run verify:bundle:self-contained && node scripts/run-pnpm-cli.mjs run verify:release:api-target && node scripts/run-pnpm-cli.mjs run verify:tauri:embedded-assets'
    );
    expect(packageJson.scripts?.['verify:tauri:embedded-assets']).toBe(
      'node scripts/check-tauri-embedded-assets.mjs'
    );
    expect(packageJson.scripts?.['tauri:bundle:verified']).toBe(
      'node scripts/run-pnpm-cli.mjs run verify:mode-style-parity && node scripts/run-pnpm-cli.mjs run verify:sdk-mode-parity && node scripts/run-pnpm-cli.mjs run tauri:build && node scripts/run-pnpm-cli.mjs run verify:release:artifacts && node scripts/run-pnpm-cli.mjs run tauri:bundle'
    );
  });
});
