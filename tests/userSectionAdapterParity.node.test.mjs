import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const sharedRoot = path.resolve(workspaceRoot, '..', 'sdkwork-appbase');

const read = (absolutePath) => fs.readFileSync(absolutePath, 'utf8');

test('localized user section adapter keeps the shared section exports and stable shell classes', () => {
  const localSource = read(path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-user/src/components/user-sections.tsx'));
  const sharedSource = read(path.resolve(sharedRoot, 'packages/pc-react/iam/sdkwork-user-pc-react/src/components/user-sections.tsx'));

  for (const exportName of [
    'SdkworkUserOverviewSection',
    'SdkworkUserProfileSection',
    'SdkworkUserNotificationsSection',
    'SdkworkUserSecuritySection',
  ]) {
    assert.match(localSource, new RegExp(`export function ${exportName}`), `Expected localized adapter to preserve shared export ${exportName}.`);
    assert.match(sharedSource, new RegExp(`export function ${exportName}`), `Expected shared source to expose ${exportName} for parity comparison.`);
  }

  for (const stableToken of [
    'rounded-[1.5rem]',
    'grid gap-4 md:grid-cols-3',
    'rounded-[1rem] border border-[var(--sdk-color-border-subtle)] px-4 py-3',
    'md:col-span-2 flex justify-end',
    'StatusNotice',
  ]) {
    assert.match(localSource, new RegExp(stableToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Expected localized adapter to keep shared structural token ${stableToken}.`);
    assert.match(sharedSource, new RegExp(stableToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Expected shared source to include structural token ${stableToken}.`);
  }

  assert.match(localSource, /useTranslation/, 'Expected localized adapter to drive visible copy through i18n.');
  assert.doesNotMatch(localSource, /Claw-quality|Claw-inspired|Profile saved\./i, 'Expected localized adapter to stop inheriting shared English host copy.');
});
