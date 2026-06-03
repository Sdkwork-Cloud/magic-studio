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

const readmeSource = readSource('README.md');
const docsIndexSource = readSource('docs/README.md');
const technologyStackReferenceSource = readSource('docs/00-technology-stack-versions.md');
const agiNativeAuditSource = readSource('docs/2026-04-03-agi-native-standard-audit.md');
const rootPackageJson = JSON.parse(readSource('package.json'));
const unifiedHostStandardSource = readSource('docs/magic-studio-unified-host-api-standard.md');
const tauriArchitectureSource = readSource('docs/tauri-rust-framework-architecture.md');
const rustServerStandardSource = readSource('docs/standards/magic-studio-rust-server-api-standard.md');
const agiNativeApplicationStandardSource = readSource('docs/agi-native-unified-application-standard.md');
const assetCenterBusinessMigrationSource = readSource('docs/asset-center-business-migration.md');
const assetCenterPackagePlanSource = readSource('docs/asset-center-package-plan.md');
const frameworkStandardArchitectureSource = readSource('docs/framework-standard-architecture.md');
const assetCenterUnifiedArchitectureSource = readSource('docs/asset-center-unified-architecture.md');
const assetCenterHighStandardSpecSource = readSource('docs/asset-center-high-standard-spec.md');
const packageRoutingSystemSource = readSource('docs/package-routing-system.md');
const promptSource = readSource('docs/prompt.md');
const tauriBlueprintSource = readSource('docs/tauri-industry-desktop-capability-blueprint.md');
const releaseReadmeSource = readSource('docs/release/README.md');
const reviewReadmeSource = readSource('docs/review/README.md');
const standardsReadmeSource = readSource('docs/standards/README.md');
const historicalArchitectureReadmeSource = readSource('docs/\u67b6\u6784/README.md');
const historicalStepsReadmeSource = readSource('docs/step/README.md');
const historicalReportsReadmeSource = readSource('docs/reports/README.md');
const historicalGapAuditSource = readSource('docs/reports/2026-04-07-step-01-gap-audit.md');
const supersededArchitectureDocs = [
  'docs/architect-standard-react+backend.md',
  'docs/architect-react+capacitor.md',
  'docs/architect-react+tauri.md',
  'docs/architect-standard-react+capacitor.md',
  'docs/architect-react+tauri copy.md',
  'docs/architect-standard-react+tauri.md',
].map((relativePath) => [relativePath, readSource(relativePath)]);

test('canonical docs lock Magic Studio to one Rust kernel with two host modes', () => {
  assert.match(
    unifiedHostStandardSource,
    /exactly one business capability kernel:[\s\S]*packages\/sdkwork-magic-studio-server\/src-host/,
    'Expected the unified host standard to name the canonical Rust kernel.',
  );
  assert.match(
    unifiedHostStandardSource,
    /That kernel is hosted in exactly two ways:[\s\S]*standalone server deployment[\s\S]*embedded desktop host started by Tauri/,
    'Expected the unified host standard to lock the host model to standalone server and embedded desktop host.',
  );
  assert.match(
    unifiedHostStandardSource,
    /`src-tauri` is a shell-only host layer, not a second application backend\./,
    'Expected the unified host standard to retire the second-backend narrative.',
  );
  assert.match(
    unifiedHostStandardSource,
    /remain only as redirect stubs/,
    'Expected the unified host standard to state that superseded architecture docs are redirect stubs only.',
  );
  assert.match(
    tauriArchitectureSource,
    /thin desktop shell that hosts the canonical Rust HTTP server kernel instead of acting as a second business backend\./,
    'Expected the Tauri specialization doc to frame desktop as a shell-only host.',
  );
  assert.match(
    tauriArchitectureSource,
    /If the capability is part of product behavior/,
    'Expected the Tauri specialization doc to route shared product capabilities back to the canonical Rust kernel.',
  );
  assert.match(
    tauriArchitectureSource,
    /desktop and server deployments/,
    'Expected the Tauri specialization doc to describe the shared multi-host scope of product capabilities.',
  );
  assert.match(
    tauriArchitectureSource,
    /packages\/sdkwork-magic-studio-server\/src-host/,
    'Expected the Tauri specialization doc to point shared product capabilities at the canonical Rust kernel path.',
  );
  assert.match(
    unifiedHostStandardSource,
    /stable semantic route id[\s\S]*OpenAPI `operationId`/,
    'Expected the unified host standard to make stable route ids and derived OpenAPI operationIds part of the canonical API system.',
  );
  assert.match(
    unifiedHostStandardSource,
    /@sdkwork\/magic-studio-host-core[\s\S]*network host\/baseUrl discovery only[\s\S]*must not own canonical health\/docs\/openapi\/route-catalog\/runtime-summary path authority/,
    'Expected the unified host standard to limit host-core to network discovery and keep discovery path authority in the server contract layer.',
  );
  assert.match(
    rustServerStandardSource,
    /OpenAPI `operationId` is derived directly from the canonical route id/,
    'Expected the Rust server API standard to bind OpenAPI operationId directly to canonical route ids.',
  );
  assert.match(
    rustServerStandardSource,
    /@sdkwork\/magic-studio-host-core[\s\S]*host, port, and api baseUrl[\s\S]*canonical discovery endpoint paths and full host descriptors remain owned by `@sdkwork\/magic-studio-server`/,
    'Expected the Rust server API standard to keep host-core subordinate to the server package for descriptor and path authority.',
  );
  assert.match(
    rustServerStandardSource,
    /Public host resolution input typing belongs to `@sdkwork\/magic-studio-server`\./,
    'Expected the Rust server API standard to keep public host resolution input typing owned by the server package.',
  );
  assert.match(
    rustServerStandardSource,
    /Parameterized canonical paths[\s\S]*must be materialized through server contract helpers/,
    'Expected the Rust server API standard to require canonical helper ownership for parameterized route materialization.',
  );
});

test('developer entrypoints expose standalone server and desktop host flows explicitly', () => {
  assert.equal(
    rootPackageJson.scripts?.['server:dev'],
    'node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-server run dev',
    'Expected the root workspace to expose the canonical standalone Rust server dev entrypoint.',
  );
  assert.equal(
    rootPackageJson.scripts?.['server:build'],
    'node scripts/run-magic-studio-server-build.mjs',
    'Expected the root workspace to expose the canonical standalone Rust server build entrypoint.',
  );
  assert.ok(
    typeof rootPackageJson.scripts?.['tauri:dev'] === 'string' &&
      rootPackageJson.scripts['tauri:dev'].includes('run-tauri-command.mjs dev'),
    'Expected the root workspace to expose the desktop shell dev entrypoint.',
  );
  assert.ok(
    typeof rootPackageJson.scripts?.['tauri:build'] === 'string' &&
      /run-tauri-command\.mjs(?:\s+--[^\s]+)*\s+build/.test(rootPackageJson.scripts['tauri:build']),
    'Expected the root workspace to expose the desktop shell build entrypoint.',
  );
  for (const command of ['pnpm server:dev', 'pnpm tauri:dev', 'pnpm server:build']) {
    assert.match(
      readmeSource,
      new RegExp(command.replace(':', '\\:')),
      `Expected README.md to document the canonical workflow command ${command}.`,
    );
  }
  assert.match(
    readmeSource,
    /one canonical Rust business kernel at `packages\/sdkwork-magic-studio-server\/src-host`/,
    'Expected README.md to name the canonical Rust business kernel.',
  );
  assert.match(
    readmeSource,
    /`src-tauri` is shell-only and not a second business backend/,
    'Expected README.md to describe src-tauri as a shell-only host boundary.',
  );
  assert.match(
    readmeSource,
    /legacy React \+ Tauri architecture docs remain only as redirect stubs/,
    'Expected README.md to explain that historical architecture docs are redirect stubs only.',
  );
  assert.match(
    readmeSource,
    /`docs\/README\.md` is the documentation entrypoint and authority map/,
    'Expected README.md to send readers to docs/README.md as the documentation authority map.',
  );
});

test('historical architecture docs stay marked as superseded and redirect to the canonical standards', () => {
  for (const [relativePath, source] of supersededArchitectureDocs) {
    assert.match(
      source,
      /> \*\*Superseded for Magic Studio V2 on 2026-04-19\.\*\*/,
      `Expected ${relativePath} to carry a hard superseded banner.`,
    );
    for (const canonicalDoc of ['docs/README.md', 'docs/magic-studio-unified-host-api-standard.md']) {
      assert.match(
        source,
        new RegExp(canonicalDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${relativePath} to redirect readers to ${canonicalDoc}.`,
      );
    }
    if (relativePath.includes('capacitor')) {
      assert.match(
        source,
        /Capacitor\/mobile host architecture is not part of the Magic Studio V2 runtime standard\./,
        `Expected ${relativePath} to explicitly retire the Capacitor/mobile host model for Magic Studio V2.`,
      );
    }
    if (relativePath.includes('backend')) {
      assert.match(
        source,
        /typed server client instead of generic shadow backend standards\./,
        `Expected ${relativePath} to redirect backend authority to the canonical Rust server contract system.`,
      );
    }
    if (relativePath.includes('tauri')) {
      for (const canonicalDoc of [
        'docs/tauri-rust-framework-architecture.md',
        'docs/platform-runtime-capability-matrix.md',
      ]) {
        assert.match(
          source,
          new RegExp(canonicalDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
          `Expected ${relativePath} to redirect readers to ${canonicalDoc}.`,
        );
      }
    }
    assert.match(
      source,
      /redirect stub to prevent architectural drift/,
      `Expected ${relativePath} to explain why the superseded document was reduced to a redirect stub.`,
    );
    assert.match(
      source,
      /Historical content was intentionally removed/,
      `Expected ${relativePath} to remove its historical full-text content instead of keeping a shadow standard.`,
    );
    assert.ok(
      source.length < 2400,
      `Expected ${relativePath} to stay a compact redirect stub instead of a large shadow architecture document.`,
    );
  }
});

test('documentation index classifies canonical standards and subordinate directories explicitly', () => {
  assert.match(
    docsIndexSource,
    /This file defines the documentation authority model for Magic Studio V2/,
    'Expected docs/README.md to define the documentation authority model.',
  );
  assert.match(
    docsIndexSource,
    /one canonical Rust business kernel[\s\S]*exactly two host modes/,
    'Expected docs/README.md to describe the one-kernel two-host-mode model.',
  );
  assert.match(
    docsIndexSource,
    /`src-tauri` remains a shell-only host layer and is not a second backend/,
    'Expected docs/README.md to keep src-tauri classified as a shell-only host boundary.',
  );
  assert.match(
    docsIndexSource,
    /Any document not listed in this section is non-authoritative by default and must not override the canonical standards\./,
    'Expected docs/README.md to demote non-indexed documents by default so they cannot become shadow standards.',
  );
  for (const supersededDoc of [
    'docs/architect-standard-react+backend.md',
    'docs/architect-react+capacitor.md',
    'docs/architect-react+tauri.md',
    'docs/architect-standard-react+capacitor.md',
    'docs/architect-react+tauri copy.md',
    'docs/architect-standard-react+tauri.md',
  ]) {
    assert.match(
      docsIndexSource,
      new RegExp(supersededDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected docs/README.md to list ${supersededDoc} as a superseded redirect stub.`,
    );
  }
  for (const canonicalDoc of [
    'docs/magic-studio-unified-host-api-standard.md',
    'docs/tauri-rust-framework-architecture.md',
    'docs/platform-runtime-capability-matrix.md',
    'docs/local-media-toolkit-architecture.md',
    'docs/standards/magic-studio-rust-server-api-standard.md',
  ]) {
    assert.match(
      docsIndexSource,
      new RegExp(canonicalDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected docs/README.md to index ${canonicalDoc}.`,
    );
  }
  for (const directoryLabel of [
    'docs/standards/',
    'docs/release/',
    'docs/review/',
    'docs/plans/',
    'docs/superpowers/',
    'docs/step/',
    'docs/reports/',
    'docs/\u67b6\u6784/',
  ]) {
    assert.match(
      docsIndexSource,
      new RegExp(directoryLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected docs/README.md to classify ${directoryLabel}.`,
    );
  }
  for (const supportingDoc of [
    'docs/00-technology-stack-versions.md',
    'docs/framework-standard-architecture.md',
    'docs/package-routing-system.md',
    'docs/asset-center-unified-architecture.md',
    'docs/asset-center-high-standard-spec.md',
    'docs/asset-center-business-migration.md',
    'docs/asset-center-package-plan.md',
    'docs/agi-native-unified-application-standard.md',
    'docs/tauri-industry-desktop-capability-blueprint.md',
  ]) {
    assert.match(
      docsIndexSource,
      new RegExp(supportingDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected docs/README.md to classify ${supportingDoc} as a supporting top-level reference.`,
    );
  }
});

test('supporting and historical documentation stays explicitly subordinate to the canonical standards', () => {
  for (const [label, source] of [
    ['docs/\u67b6\u6784/README.md', historicalArchitectureReadmeSource],
    ['docs/step/README.md', historicalStepsReadmeSource],
    ['docs/reports/README.md', historicalReportsReadmeSource],
    ['docs/release/README.md', releaseReadmeSource],
    ['docs/review/README.md', reviewReadmeSource],
  ]) {
    assert.match(
      source,
      /not the current source of truth|not the canonical source of truth/,
      `Expected ${label} to explicitly reject source-of-truth status.`,
    );
    for (const canonicalDoc of [
      'docs/magic-studio-unified-host-api-standard.md',
      'docs/tauri-rust-framework-architecture.md',
      'docs/platform-runtime-capability-matrix.md',
    ]) {
      assert.match(
        source,
        new RegExp(canonicalDoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${label} to redirect readers to ${canonicalDoc}.`,
      );
    }
  }

  assert.match(
    standardsReadmeSource,
    /primary source of truth remains `docs\/magic-studio-unified-host-api-standard\.md`/,
    'Expected docs/standards/README.md to subordinate specialized standards to the unified host standard.',
  );
  assert.match(
    standardsReadmeSource,
    /must not redefine host ownership or invent a parallel backend model/,
    'Expected docs/standards/README.md to reject parallel-backend drift.',
  );
  assert.match(
    rustServerStandardSource,
    /specializes `docs\/magic-studio-unified-host-api-standard\.md` for route-contract, DTO, and OpenAPI governance/,
    'Expected the Rust server API standard to declare itself subordinate to the unified host standard.',
  );
  assert.match(
    technologyStackReferenceSource,
    /supporting technology-stack reference subordinate to:[\s\S]*docs\/README\.md[\s\S]*docs\/magic-studio-unified-host-api-standard\.md/,
    'Expected the technology stack reference to declare itself subordinate to the canonical documentation authority model.',
  );
  assert.match(
    technologyStackReferenceSource,
    /Capacitor\/mobile host architecture is not part of the active Magic Studio V2 stack\./,
    'Expected the technology stack reference to retire the Capacitor/mobile host model.',
  );
  assert.match(
    frameworkStandardArchitectureSource,
    /subordinate to:[\s\S]*docs\/magic-studio-unified-host-api-standard\.md[\s\S]*docs\/platform-runtime-capability-matrix\.md/,
    'Expected the framework standard architecture doc to declare itself subordinate to the unified host/runtime standards.',
  );
  assert.match(
    frameworkStandardArchitectureSource,
    /browser-hosted runtime and desktop shell runtime share the same domain and UI contracts/,
    'Expected the framework standard architecture doc to use runtime-neutral browser-hosted and desktop-shell vocabulary.',
  );
  assert.match(
    agiNativeApplicationStandardSource,
    /It does not redefine host ownership, API transport boundaries, or shell-only capability rules\./,
    'Expected the AGI-native application standard to stay subordinate to the canonical host/runtime boundaries.',
  );
  assert.match(
    agiNativeAuditSource,
    /^> \*\*Historical AGI-native audit snapshot from 2026-04-03\.\*\*/,
    'Expected the AGI-native audit doc to start with a hard historical snapshot banner.',
  );
  assert.match(
    agiNativeAuditSource,
    /does not define the current canonical architecture or the current implementation state/,
    'Expected the AGI-native audit doc to reject present-state authority.',
  );
  assert.match(
    assetCenterUnifiedArchitectureSource,
    /specializes the canonical Magic Studio standards for asset-center data ownership and storage behavior/,
    'Expected the asset-center unified architecture doc to declare its subordinate specialization role.',
  );
  assert.match(
    assetCenterUnifiedArchitectureSource,
    /`desktop-fs`: desktop local filesystem/,
    'Expected the asset-center unified architecture doc to use canonical desktop-fs storage vocabulary.',
  );
  assert.doesNotMatch(
    assetCenterUnifiedArchitectureSource,
    /tauri-fs|BrowserTauriAssetVfs|tauri local path/,
    'Expected the asset-center unified architecture doc to retire Tauri-local storage vocabulary.',
  );
  assert.match(
    assetCenterHighStandardSpecSource,
    /strict storage abstraction: browser vfs, desktop fs, remote url, no business-side direct fs coupling/,
    'Expected the asset-center high standard spec to use canonical desktop-fs vocabulary.',
  );
  assert.doesNotMatch(
    assetCenterHighStandardSpecSource,
    /`tauri-fs`|`tauri`/,
    'Expected the asset-center high standard spec to retire Tauri storage vocabulary.',
  );
  assert.match(
    assetCenterBusinessMigrationSource,
    /migration and rollout reference subordinate to:[\s\S]*docs\/asset-center-unified-architecture\.md[\s\S]*docs\/asset-center-high-standard-spec\.md/,
    'Expected the asset-center business migration doc to declare its subordinate migration-only role.',
  );
  assert.match(
    assetCenterBusinessMigrationSource,
    /`browser-vfs`, `desktop-fs`, `remote-url`/,
    'Expected the asset-center business migration doc to use canonical desktop-fs vocabulary.',
  );
  assert.match(
    assetCenterPackagePlanSource,
    /package-ownership and rollout reference subordinate to:[\s\S]*docs\/asset-center-unified-architecture\.md[\s\S]*docs\/framework-standard-architecture\.md/,
    'Expected the asset-center package plan doc to declare its subordinate rollout role.',
  );
  assert.doesNotMatch(
    assetCenterPackagePlanSource,
    /browser\/tauri providers|browser\+tauri VFS bridge/,
    'Expected the asset-center package plan doc to retire Tauri-specific VFS bridge wording.',
  );
  assert.match(
    packageRoutingSystemSource,
    /routing specialization subordinate to:[\s\S]*docs\/README\.md[\s\S]*docs\/framework-standard-architecture\.md/,
    'Expected the package routing system doc to declare its subordinate routing-specialization role.',
  );
  assert.match(
    packageRoutingSystemSource,
    /does not redefine host ownership or runtime capability boundaries\./,
    'Expected the package routing system doc to reject host/runtime authority drift.',
  );
  assert.match(
    promptSource,
    /^# Historical Prompt Artifact/,
    'Expected docs/prompt.md to be reduced to a historical prompt artifact stub.',
  );
  assert.match(
    promptSource,
    /not a current architecture, implementation, or standards source/,
    'Expected docs/prompt.md to reject present-state authority.',
  );
  assert.match(
    tauriBlueprintSource,
    /It does not define Magic Studio V2 business\/backend ownership\./,
    'Expected the Tauri desktop capability blueprint to reject business/backend authority.',
  );
  assert.match(
    tauriBlueprintSource,
    /If a capability must exist in both standalone server deployment and desktop mode, it belongs in `packages\/sdkwork-magic-studio-server\/src-host`/,
    'Expected the Tauri blueprint to route shared cross-host capabilities back to the canonical Rust kernel.',
  );

  assert.match(
    historicalGapAuditSource,
    /^> \*\*Historical gap-audit snapshot from 2026-04-07\.\*\*/,
    'Expected the historical gap audit to start with a hard historical snapshot banner.',
  );
  assert.match(
    historicalGapAuditSource,
    /does not define the current canonical architecture or the current implementation state/,
    'Expected the historical gap audit to reject present-state authority.',
  );
  assert.match(
    historicalGapAuditSource,
    /Later code and standards may have closed findings recorded here\./,
    'Expected the historical gap audit to acknowledge that later iterations may have closed recorded gaps.',
  );
});
