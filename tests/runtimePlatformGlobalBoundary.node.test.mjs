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

const bootstrapSource = readSource('src/app/bootstrap.ts');
const envSource = readSource('src/app/env.ts');
const appSdkEnvSource = readSource('packages/sdkwork-magic-studio-core/src/sdk/appSdkEnv.ts');
const globalSource = readSource('src/app/global.d.ts');
const platformSource = readSource('packages/sdkwork-magic-studio-core/src/platform/platform.ts');
const runtimeManagerSource = readSource('packages/sdkwork-magic-studio-core/src/platform/runtime/manager.ts');
const runtimeIndexSource = readSource('packages/sdkwork-magic-studio-core/src/platform/runtime/index.ts');
const runtimeTypesSource = readSource('packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts');
const runtimeFactorySource = readSource('packages/sdkwork-magic-studio-core/src/platform/runtime/createPlatformRuntime.ts');
const runtimeMatrixSource = readSource('docs/platform-runtime-capability-matrix.md');
const runtimeKindsSource = readSource('packages/sdkwork-magic-studio-core/src/platform/runtime/kinds.ts');
const runtimeGlobalSource = readSource(
  'packages/sdkwork-magic-studio-commons/src/services/runtimeGlobal.ts',
);
const runtimeVocabularySource = readSource(
  'packages/sdkwork-magic-studio-types/src/runtime.types.ts',
);
const reactTypesIndexSource = readSource('packages/sdkwork-magic-studio-types/src/index.ts');
const windowControlServiceSource = readSource(
  'packages/sdkwork-magic-studio-commons/src/services/windowControlService.ts',
);
const clipboardServiceSource = readSource(
  'packages/sdkwork-magic-studio-commons/src/services/clipboardService.ts',
);
const uploadRuntimeServiceSource = readSource(
  'packages/sdkwork-magic-studio-commons/src/services/uploadRuntimeService.ts',
);
const baseUploadSource = readSource(
  'packages/sdkwork-magic-studio-commons/src/components/upload/BaseUpload.tsx',
);
const platformToolkitSource = readSource(
  'packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts',
);
const runtimePlatformServiceSource = readSource(
  'packages/sdkwork-magic-studio-fs/src/services/runtimePlatformService.ts',
);
const reactFsPackageSource = readSource('packages/sdkwork-magic-studio-fs/package.json');

test('runtime global injection is standardized on __sdkworkPlatformRuntime only', () => {
  assert.match(
    bootstrapSource,
    /writeWindowPlatformRuntime\(\s*runtime\s*\)|__sdkworkPlatformRuntime\s*=\s*runtime/,
    'Expected bootstrap to inject the canonical runtime global.',
  );
  assert.doesNotMatch(
    bootstrapSource,
    /__sdkworkPlatform\s*=/,
    'Expected bootstrap to stop injecting the legacy platform API global.',
  );
  assert.match(
    globalSource,
    /__sdkworkPlatformRuntime:\s*PlatformRuntime;/,
    'Expected app globals to declare the runtime capability global.',
  );
  assert.doesNotMatch(
    globalSource,
    /__sdkworkPlatform:\s*PlatformAPI;/,
    'Expected app globals to retire the legacy platform API global declaration.',
  );
  assert.doesNotMatch(
    platformSource,
    /__sdkworkPlatform\b/,
    'Expected platform.ts to stop syncing the legacy platform API onto window.',
  );
  assert.doesNotMatch(
    runtimeManagerSource,
    /__sdkworkPlatform\b/,
    'Expected runtime manager to stop syncing the legacy platform API onto window.',
  );
  assert.match(
    runtimeIndexSource,
    /export \* from '\.\/windowGlobal';/,
    'Expected the runtime entrypoint to export the canonical window-global helpers.',
  );
  assert.match(
    runtimeMatrixSource,
    /window\.__sdkworkPlatformRuntime/,
    'Expected runtime capability docs to document the canonical runtime global.',
  );
  assert.doesNotMatch(
    runtimeMatrixSource,
    /-\s+`window\.__sdkworkPlatform`/,
    'Expected runtime capability docs to stop listing the legacy platform API global as an active injection entry.',
  );
});

test('shared runtime boundary consumers read the canonical runtime global instead of the legacy platform global', () => {
  for (const [relativePath, source] of [
    ['packages/sdkwork-magic-studio-commons/src/services/windowControlService.ts', windowControlServiceSource],
    ['packages/sdkwork-magic-studio-commons/src/services/clipboardService.ts', clipboardServiceSource],
    ['packages/sdkwork-magic-studio-commons/src/services/uploadRuntimeService.ts', uploadRuntimeServiceSource],
    ['packages/sdkwork-magic-studio-fs/src/services/runtimePlatformService.ts', runtimePlatformServiceSource],
  ]) {
    assert.match(
      source,
      /__sdkworkPlatformRuntime|readWindowPlatformRuntime/,
      `Expected ${relativePath} to depend on the canonical runtime-global access path.`,
    );
    assert.doesNotMatch(
      source,
      /__sdkworkPlatform\b/,
      `Expected ${relativePath} to stop depending on the legacy platform API global.`,
    );
  }

  assert.match(
    runtimePlatformServiceSource,
    /readWindowPlatformRuntime[\s\S]*from '@sdkwork\/magic-studio-commons\/services'/,
    'Expected magic-studio-fs runtime platform service to reuse the shared magic-studio-commons runtime-global helper through a focused package subpath.',
  );
  assert.doesNotMatch(
    runtimePlatformServiceSource,
    /window as Window & \{ __sdkworkPlatformRuntime\?: unknown \}/,
    'Expected magic-studio-fs runtime platform service to stop open-coding window runtime-global access.',
  );
  assert.match(
    reactFsPackageSource,
    /"dependencies"[\s\S]*"@sdkwork\/magic-studio-commons":\s*"workspace:\*"[\s\S]*"@sdkwork\/magic-studio-types":\s*"workspace:\*"/,
    'Expected magic-studio-fs to declare magic-studio-commons and magic-studio-types as runtime dependencies once source entries import them at runtime.',
  );
});

test('runtime window capability exposes maximized state for shared desktop window controls', () => {
  assert.match(
    runtimeTypesSource,
    /isMaximized\(\): Promise<boolean>;/,
    'Expected PlatformWindowCapability to expose maximized state.',
  );
  assert.match(
    runtimeFactorySource,
    /isMaximized:\s*async\s*\(\): Promise<boolean>\s*=> api\.isWindowMaximized\(\)/,
    'Expected createPlatformRuntime to map window maximized state from the raw platform API.',
  );
  assert.match(
    windowControlServiceSource,
    /bridge\?\.window\?\.isMaximized/,
    'Expected shared window controls to resolve maximized state through runtime.window.',
  );
});

test('shared runtime-global consumers centralize runtime kind classification instead of open-coding desktop checks', () => {
  assert.match(
    runtimeVocabularySource,
    /export const SDKWORK_RUNTIME_KINDS[\s\S]*export type SdkworkRuntimeKind[\s\S]*export const isBrowserHostedRuntimeKind[\s\S]*export const isDesktopShellRuntimeKind/,
    'Expected magic-studio-types to own the canonical runtime kind vocabulary and classifiers.',
  );
  assert.match(
    reactTypesIndexSource,
    /export \* from '\.\/runtime\.types';/,
    'Expected magic-studio-types to re-export the canonical runtime vocabulary.',
  );
  assert.match(
    runtimeKindsSource,
    /from '@sdkwork\/magic-studio-types\/runtime'/,
    'Expected magic-studio-core runtime kind helpers to delegate to the focused canonical runtime vocabulary.',
  );
  assert.match(
    runtimeGlobalSource,
    /export const readWindowPlatformRuntimeKind =/,
    'Expected runtimeGlobal.ts to expose a shared runtime-kind reader for shared packages.',
  );
  assert.match(
    runtimeGlobalSource,
    /from '@sdkwork\/magic-studio-types\/runtime'/,
    'Expected runtimeGlobal.ts to consume canonical runtime classifiers from the focused runtime subpath instead of re-defining them.',
  );
  assert.match(
    runtimeGlobalSource,
    /export const isBrowserHostedWindowPlatformRuntimeKind =/,
    'Expected runtimeGlobal.ts to expose a shared browser-hosted runtime classifier for shared packages.',
  );
  assert.match(
    runtimeGlobalSource,
    /export const isDesktopWindowPlatformRuntime =/,
    'Expected runtimeGlobal.ts to expose a shared desktop-shell classifier.',
  );
  assert.match(
    windowControlServiceSource,
    /isDesktopWindowPlatformRuntime/,
    'Expected shared window controls to consume the centralized desktop-shell classifier.',
  );
  assert.doesNotMatch(
    windowControlServiceSource,
    /=== 'desktop'/,
    'Expected shared window controls to stop open-coding desktop runtime string comparisons.',
  );
  assert.match(
    uploadRuntimeServiceSource,
    /readWindowPlatformRuntimeKind|isDesktopWindowPlatformRuntime/,
    'Expected upload runtime service to consume the centralized runtime kind helpers.',
  );
  assert.doesNotMatch(
    uploadRuntimeServiceSource,
    /getPlatform\(\)/,
    'Expected upload runtime service to retire the ambiguous platform-string API.',
  );
  assert.match(
    platformToolkitSource,
    /resolveRuntimeMagicStudioAssetUrl/,
    'Expected platform toolkit media-source normalization to reuse the canonical runtime asset-url helper.',
  );
  assert.doesNotMatch(
    platformToolkitSource,
    /isDesktopShellRuntimeKind\(runtime\.system\.kind\(\)\)\s*&&\s*!isRenderableMediaUrl\(source\)[\s\S]*convertFileSrc\(source\)/,
    'Expected platform toolkit media-source normalization to stop treating desktop as a special local-source branch.',
  );
  assert.match(
    baseUploadSource,
    /uploadRuntimeService\.isDesktopShellRuntime\(\)/,
    'Expected upload UI to consume the canonical desktop-shell helper instead of checking raw runtime strings.',
  );
  assert.doesNotMatch(
    baseUploadSource,
    /getPlatform\(\)\s*===\s*'desktop'/,
    'Expected upload UI to stop branching on raw desktop string comparisons.',
  );
});

test('app environment platform resolution delegates non-shell classification to the canonical public platform normalizer', () => {
  assert.match(
    envSource,
    /normalizePublicAppPlatform\(/,
    'Expected app env resolution to delegate platform normalization to the canonical SDK helper.',
  );
  assert.doesNotMatch(
    envSource,
    /platformId === 'desktop'/,
    'Expected app env resolution to stop duplicating desktop platform string checks outside the canonical normalizer.',
  );
  assert.match(
    envSource,
    /normalizePublicAppPlatform\(\s*readWindowAppPlatformRuntimeKind\(\),/,
    'Expected app env resolution to consult the canonical runtime global before env aliases.',
  );
  assert.match(
    envSource,
    /export function readEnvConfig\(/,
    'Expected app env resolution to expose a lazy runtime-aware config reader.',
  );
  assert.doesNotMatch(
    envSource,
    /export const ENV = buildEnvConfig\(\);/,
    'Expected app env resolution to stop freezing a pre-bootstrap environment snapshot at module import time.',
  );
});

test('sdk and app env platform normalization preserve server as a first-class public platform', () => {
  assert.match(
    runtimeVocabularySource,
    /export const PUBLIC_APP_PLATFORMS[\s\S]*'web'[\s\S]*'desktop'[\s\S]*'server'[\s\S]*'electron'[\s\S]*'mobile'[\s\S]*export type PublicAppPlatform/,
    'Expected magic-studio-types to own the canonical public app platform vocabulary including server.',
  );
  assert.match(
    appSdkEnvSource,
    /readWindowPlatformRuntime[\s\S]*from '\.\.\/platform\/runtime\/windowGlobal'/,
    'Expected SDK env normalization to reuse the canonical runtime-global helper instead of reading window globals ad hoc.',
  );
  assert.match(
    appSdkEnvSource,
    /normalizePublicAppPlatform\(\s*runtimePlatformKind,/,
    'Expected SDK env normalization to give the canonical runtime kind first precedence.',
  );
  assert.match(
    appSdkEnvSource,
    /normalizePublicAppPlatformValue[\s\S]*type PublicAppPlatform[\s\S]*from '@sdkwork\/magic-studio-types\/runtime'/,
    'Expected SDK env normalization to consume the canonical public app platform vocabulary from the focused runtime subpath.',
  );
  assert.doesNotMatch(
    appSdkEnvSource,
    /normalizeCompatAppPlatform|toLowerCase\(\)\s*===\s*'tauri'|__sdkworkPlatformRuntime/,
    'Expected SDK env normalization to remove legacy tauri alias compatibility paths.',
  );
});
