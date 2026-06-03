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

test('git sdk preparation reuses existing checkouts unless an explicit refresh is requested', () => {
  const source = readSource('scripts/prepare-git-sdk-sources.mjs');

  assert.doesNotMatch(
    source,
    /hasSharedAppSdkSource/,
    'Expected git SDK preparation to stay independent from local sibling source detection.',
  );
  assert.match(
    source,
    /name:\s*'spring-ai-plus2'[\s\S]*checkoutDir:\s*GIT_SPRING_AI_PLUS2_CHECKOUT/,
    'Expected git SDK preparation to materialize the authoritative spring-ai-plus2 checkout in git mode.',
  );
  assert.match(
    source,
    /spring-ai-plus-business\/apps\/sdkwork-core/,
    'Expected the spring-ai-plus2 checkout to sparse-materialize sdkwork-core for release builds.',
  );
  assert.match(
    source,
    /spring-ai-plus-business\/spring-ai-plus-app-api\/sdkwork-sdk-app/,
    'Expected the spring-ai-plus2 checkout to sparse-materialize the app SDK source for release builds.',
  );
  assert.match(
    source,
    /name:\s*'sdkwork-ui'[\s\S]*checkoutDir:\s*GIT_UI_CHECKOUT/,
    'Expected git SDK preparation to materialize the sdkwork-ui checkout in git mode.',
  );
  assert.match(
    source,
    /name:\s*'sdkwork-appbase'[\s\S]*checkoutDir:\s*GIT_APPBASE_CHECKOUT/,
    'Expected git SDK preparation to materialize the sdkwork-appbase checkout in git mode.',
  );
  assert.match(
    source,
    /--filter',\s*'blob:none'|--filter",\s*"blob:none"/,
    'Expected git SDK preparation to use blob filtering to reduce release checkout disk usage.',
  );
  assert.match(
    source,
    /--sparse/,
    'Expected git SDK preparation to use sparse checkouts for large GitHub release dependencies.',
  );
  assert.match(
    source,
    /sparse-checkout',\s*'set'/,
    'Expected git SDK preparation to pin sparse checkout paths instead of cloning whole repositories.',
  );
  assert.match(
    source,
    /--skip-checks/,
    'Expected git SDK preparation to allow sparse checkout entries that are materialized as git submodules.',
  );
  assert.match(
    source,
    /submodule',\s*'update',\s*'--init',\s*'--depth',\s*'1'/,
    'Expected git SDK preparation to materialize required git submodules with shallow clones for release builds.',
  );
  assert.doesNotMatch(
    source,
    /sdkwork-sdk-app\.git/,
    'Expected git SDK preparation to stop using the stale dedicated sdkwork-sdk-app repository.',
  );
  assert.match(
    source,
    /MAGIC_STUDIO_GIT_SDK_REFRESH/,
    'Expected git SDK preparation to require an explicit refresh flag before mutating existing checkouts.',
  );
  assert.match(
    source,
    /if\s*\([\s\S]*!shouldRefresh[\s\S]*hasEntry[\s\S]*\)\s*\{/,
    'Expected git SDK preparation to short-circuit when a valid checkout already exists and no refresh was requested.',
  );
  assert.match(
    source,
    /if\s*\(\s*shouldRefresh\s*\)\s*\{[\s\S]*runGit\(\s*\[\s*'fetch'/,
    'Expected fetch/reset work to live behind the explicit refresh branch instead of running on every invocation.',
  );
  assert.doesNotMatch(
    source,
    /AssetCenterApi|createAssetCenterApi|api\/asset-center\.ts|validateRequiredSourceChecks|requiredSourceChecks/,
    'Expected git SDK preparation to stop validating the retired app-sdk asset-center surface for host-owned Magic Studio assets.',
  );
});
