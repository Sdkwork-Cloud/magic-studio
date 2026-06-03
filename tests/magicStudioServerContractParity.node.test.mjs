import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const contractPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'contracts',
  'magic-studio-server.contract.json',
);
const tsContractSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'contract.ts',
);
const tsClientSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'client.ts',
);
const hostCoreSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-core',
  'src',
  'index.ts',
);
const rustContractSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'contract.rs',
);
const rustLibSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'lib.rs',
);
const rustResponseSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'response.rs',
);
const rustRoutesModSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'routes',
  'mod.rs',
);
const rustCoreRoutesSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'routes',
  'core.rs',
);
const rustCoreMediaRoutesSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'routes',
  'core',
  'media.rs',
);
const rustAppRoutesSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'routes',
  'app',
  'mod.rs',
);
const rustTestsSupportSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'src',
  'tests',
  'support.rs',
);
const tauriMainSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'main.rs',
);
const tauriShellSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'shell',
  'mod.rs',
);
const tauriPtySourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'shell',
  'pty.rs',
);
const tauriEmbeddedServerSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'embedded_server.rs',
);
const tauriCommandsModSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'shell',
  'commands',
  'mod.rs',
);
const tauriLegacyShellSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'shell.rs',
);
const tauriLegacyCommandsModSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'commands',
  'mod.rs',
);
const tauriLegacyPtySourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'pty',
  'mod.rs',
);
const tauriLegacySessionSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'session',
  'mod.rs',
);
const tauriLegacyFsDirPath = path.join(workspaceRoot, 'src-tauri', 'src', 'fs');
const tauriLegacyPlatformDirPath = path.join(workspaceRoot, 'src-tauri', 'src', 'platform');
const tauriContextSourcePath = path.join(
  workspaceRoot,
  'src-tauri',
  'src',
  'framework',
  'context.rs',
);
const browserViewportSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-browser',
  'src',
  'components',
  'BrowserViewport.tsx',
);
const runtimeBridgeTypesSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'runtime',
  'types.ts',
);
const runtimeShellVocabularySourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'runtime',
  'shellVocabulary.ts',
);
const desktopBridgeSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'desktopBridge.ts',
);
const platformIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'index.ts',
);
const platformSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'platform.ts',
);
const runtimeIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'runtime',
  'index.ts',
);
const runtimeKindsSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'runtime',
  'kinds.ts',
);
const serverPlatformSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'server.ts',
);
const localServerFileSystemSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'localServerFileSystem.ts',
);
const serverRuntimeSummarySourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'serverRuntimeSummary.ts',
);
const webPlatformSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'web.ts',
);
const runtimeManagerSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'runtime',
  'manager.ts',
);
const magicStudioServerRuntimeSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'toolkit',
  'magicStudioServerRuntime.ts',
);
const toolkitManagerSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'platform',
  'toolkit',
  'manager.ts',
);
const bootstrapSourcePath = path.join(
  workspaceRoot,
  'src',
  'app',
  'bootstrap.ts',
);
const runtimeCompressionServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-compression',
  'src',
  'services',
  'runtimeCompressionService.ts',
);
const downloadServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'services',
  'media',
  'downloadService.ts',
);
const chatServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-chat',
  'src',
  'services',
  'chatService.ts',
);
const driveServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-drive',
  'src',
  'services',
  'driveService.ts',
);
const assetServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-assets',
  'src',
  'services',
  'assetService.ts',
);
const mediaServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'services',
  'media',
  'mediaService.ts',
);
const aspectRatioServiceSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'services',
  'media',
  'aspectRatioService.ts',
);
const runtimeMagicStudioStorageSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'storage',
  'runtimeMagicStudioStorage.ts',
);
const runtimeMagicStudioAssetsSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-core',
  'src',
  'storage',
  'runtimeMagicStudioAssets.ts',
);
const chatStoragePathsSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-chat',
  'src',
  'services',
  'chatStoragePaths.ts',
);
const commonsUtilsIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-commons',
  'src',
  'utils',
  'index.ts',
);
const fsIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-fs',
  'src',
  'index.ts',
);
const legacyStaticStorageConfigSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-commons',
  'src',
  'utils',
  'storageConfig.ts',
);
const unifiedHostApiStandardDocPath = path.join(
  workspaceRoot,
  'docs',
  'magic-studio-unified-host-api-standard.md',
);
const tauriFrameworkArchitectureDocPath = path.join(
  workspaceRoot,
  'docs',
  'tauri-rust-framework-architecture.md',
);
const localMediaToolkitArchitectureDocPath = path.join(
  workspaceRoot,
  'docs',
  'local-media-toolkit-architecture.md',
);
const readmeSourcePath = path.join(
  workspaceRoot,
  'README.md',
);
const legacyArchitectureDocPaths = [
  path.join(workspaceRoot, 'docs', 'architect-react+tauri.md'),
  path.join(workspaceRoot, 'docs', 'architect-react+tauri copy.md'),
  path.join(workspaceRoot, 'docs', 'architect-standard-react+tauri.md'),
];
const boundaryScanRoots = [
  path.join(workspaceRoot, 'packages'),
  path.join(workspaceRoot, 'src'),
];
const boundaryScanExtensions = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);
const boundaryScanIgnoredDirNames = new Set([
  'node_modules',
  'dist',
  '.git',
  '.turbo',
  'coverage',
]);

const collectBoundarySourceFiles = (rootDir) => {
  const files = [];

  const walk = (currentDir) => {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!boundaryScanIgnoredDirNames.has(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
        continue;
      }

      const absolutePath = path.join(currentDir, entry.name);
      if (boundaryScanExtensions.has(path.extname(entry.name))) {
        files.push(absolutePath);
      }
    }
  };

  walk(rootDir);
  return files;
};

test('magic studio uses one canonical rust server contract across server and desktop hosts', () => {
  assert.equal(
    fs.existsSync(contractPath),
    true,
    'Expected a canonical server contract JSON file to exist.',
  );

  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const routes = Array.isArray(contract.routes) ? contract.routes : [];
  const routePaths = routes.map((route) => route.path);
  const routeIds = routes.map((route) => route.id);

  assert.ok(
    routeIds.every((routeId) => typeof routeId === 'string' && routeId.trim().length > 0),
    'Expected every canonical contract route to declare a stable non-empty route id.',
  );
  assert.equal(
    new Set(routeIds).size,
    routeIds.length,
    'Expected canonical contract route ids to be globally unique.',
  );
  assert.equal(
    contract.meta?.healthRouteId,
    'coreHealthStatusRead',
    'Expected contract meta.healthRouteId to reference the canonical health route id.',
  );
  assert.equal(
    contract.meta?.routeCatalogRouteId,
    'coreRoutesList',
    'Expected contract meta.routeCatalogRouteId to reference the canonical route catalog route id.',
  );
  assert.equal(
    contract.meta?.runtimeSummaryRouteId,
    'coreRuntimeSummaryRead',
    'Expected contract meta.runtimeSummaryRouteId to reference the canonical runtime summary route id.',
  );
  assert.equal(
    'healthPath' in (contract.meta ?? {}),
    false,
    'Expected contract meta to stop duplicating health path authority.',
  );
  assert.equal(
    'routeCatalogPath' in (contract.meta ?? {}),
    false,
    'Expected contract meta to stop duplicating route catalog path authority.',
  );
  assert.equal(
    'runtimeSummaryPath' in (contract.meta ?? {}),
    false,
    'Expected contract meta to stop duplicating runtime summary path authority.',
  );

  for (const requiredPath of [
    '/api/app/v1/plugins',
    '/api/admin/v1/deployments',
    '/api/core/v1/filesystem/read-dir',
    '/api/core/v1/filesystem/read-text',
    '/api/core/v1/filesystem/read-bytes',
    '/api/core/v1/filesystem/write-text',
    '/api/core/v1/filesystem/write-bytes',
    '/api/core/v1/filesystem/stat',
    '/api/core/v1/filesystem/exists',
    '/api/core/v1/filesystem/ensure-dir',
    '/api/core/v1/filesystem/remove',
    '/api/core/v1/filesystem/rename',
    '/api/core/v1/filesystem/copy-file',
    '/api/core/v1/policy/validate-path',
    '/api/core/v1/migrations/status',
    '/api/core/v1/media/probe',
    '/api/core/v1/media/image/resize',
    '/api/core/v1/media/video/concat',
    '/api/core/v1/media/video/transcode',
    '/api/core/v1/media/video/trim',
    '/api/core/v1/media/video/extract-audio',
    '/api/core/v1/media/video/thumbnail',
    '/api/core/v1/media/audio/convert',
    '/api/core/v1/media/audio/normalize',
    '/api/core/v1/media/audio/mix',
    '/api/core/v1/compression/zip',
    '/api/core/v1/compression/unzip',
    '/api/core/v1/database/sqlite/execute',
    '/api/core/v1/database/sqlite/query',
    '/api/core/v1/database/sqlite/execute-batch',
    '/api/core/v1/jobs',
    '/api/core/v1/jobs/:jobId',
    '/api/core/v1/jobs/:jobId/cancel',
  ]) {
    assert.ok(
      routePaths.includes(requiredPath),
      `Expected canonical contract to include route ${requiredPath}.`,
    );
  }

  assert.equal(
    routePaths.includes('/api/core/v1/media/ffprobe'),
    false,
    'Expected canonical contract to remove the legacy ffprobe-named public route.',
  );

  assert.equal(contract.meta?.docsPath, '/docs');
  assert.equal(contract.meta?.liveOpenApiPath, '/openapi.json');

  const tsSource = fs.readFileSync(tsContractSourcePath, 'utf8');
  const tsClientSource = fs.readFileSync(tsClientSourcePath, 'utf8');
  const hostCoreSource = fs.readFileSync(hostCoreSourcePath, 'utf8');
  const rustSource = fs.readFileSync(rustContractSourcePath, 'utf8');
  const rustLibSource = fs.readFileSync(rustLibSourcePath, 'utf8');
  const rustResponseSource = fs.readFileSync(rustResponseSourcePath, 'utf8');
  const rustRoutesModSource = fs.readFileSync(rustRoutesModSourcePath, 'utf8');
  const rustAppRoutesSource = fs.readFileSync(rustAppRoutesSourcePath, 'utf8');
  const rustCoreRoutesSource = fs.readFileSync(rustCoreRoutesSourcePath, 'utf8');
  const rustCoreMediaRoutesSource = fs.readFileSync(rustCoreMediaRoutesSourcePath, 'utf8');
  const rustTestsSupportSource = fs.readFileSync(rustTestsSupportSourcePath, 'utf8');
  const tauriMainSource = fs.readFileSync(tauriMainSourcePath, 'utf8');
  const tauriShellSource = fs.readFileSync(tauriShellSourcePath, 'utf8');
  const tauriPtySource = fs.readFileSync(tauriPtySourcePath, 'utf8');
  const tauriEmbeddedServerSource = fs.readFileSync(tauriEmbeddedServerSourcePath, 'utf8');
  const tauriCommandsModSource = fs.readFileSync(tauriCommandsModSourcePath, 'utf8');
  const tauriContextSource = fs.readFileSync(tauriContextSourcePath, 'utf8');
  const browserViewportSource = fs.readFileSync(browserViewportSourcePath, 'utf8');
  const runtimeBridgeTypesSource = fs.readFileSync(runtimeBridgeTypesSourcePath, 'utf8');
  const runtimeShellVocabularySource = fs.readFileSync(runtimeShellVocabularySourcePath, 'utf8');
  const desktopBridgeSource = fs.readFileSync(desktopBridgeSourcePath, 'utf8');
  const platformIndexSource = fs.readFileSync(platformIndexSourcePath, 'utf8');
  const platformSource = fs.readFileSync(platformSourcePath, 'utf8');
  const runtimeIndexSource = fs.readFileSync(runtimeIndexSourcePath, 'utf8');
  const runtimeKindsSource = fs.readFileSync(runtimeKindsSourcePath, 'utf8');
  const serverPlatformSource = fs.readFileSync(serverPlatformSourcePath, 'utf8');
  const localServerFileSystemSource = fs.readFileSync(
    localServerFileSystemSourcePath,
    'utf8',
  );
  const serverRuntimeSummarySource = fs.readFileSync(serverRuntimeSummarySourcePath, 'utf8');
  const webPlatformSource = fs.readFileSync(webPlatformSourcePath, 'utf8');
  const runtimeManagerSource = fs.readFileSync(runtimeManagerSourcePath, 'utf8');
  const magicStudioServerRuntimeSource = fs.readFileSync(
    magicStudioServerRuntimeSourcePath,
    'utf8',
  );
  const toolkitManagerSource = fs.readFileSync(toolkitManagerSourcePath, 'utf8');
  const bootstrapSource = fs.readFileSync(bootstrapSourcePath, 'utf8');
  const runtimeCompressionServiceSource = fs.readFileSync(runtimeCompressionServiceSourcePath, 'utf8');
  const downloadServiceSource = fs.readFileSync(downloadServiceSourcePath, 'utf8');
  const chatServiceSource = fs.readFileSync(chatServiceSourcePath, 'utf8');
  const driveServiceSource = fs.readFileSync(driveServiceSourcePath, 'utf8');
  const assetServiceSource = fs.readFileSync(assetServiceSourcePath, 'utf8');
  const mediaServiceSource = fs.readFileSync(mediaServiceSourcePath, 'utf8');
  const aspectRatioServiceSource = fs.readFileSync(aspectRatioServiceSourcePath, 'utf8');
  const runtimeMagicStudioStorageSource = fs.readFileSync(runtimeMagicStudioStorageSourcePath, 'utf8');
  const runtimeMagicStudioAssetsSource = fs.readFileSync(runtimeMagicStudioAssetsSourcePath, 'utf8');
  const chatStoragePathsSource = fs.readFileSync(chatStoragePathsSourcePath, 'utf8');
  const commonsUtilsIndexSource = fs.readFileSync(commonsUtilsIndexSourcePath, 'utf8');
  const fsIndexSource = fs.readFileSync(fsIndexSourcePath, 'utf8');
  const unifiedHostApiStandardSource = fs.readFileSync(unifiedHostApiStandardDocPath, 'utf8');
  const tauriFrameworkArchitectureSource = fs.readFileSync(tauriFrameworkArchitectureDocPath, 'utf8');
  const localMediaToolkitArchitectureSource = fs.readFileSync(
    localMediaToolkitArchitectureDocPath,
    'utf8',
  );
  const readmeSource = fs.readFileSync(readmeSourcePath, 'utf8');

  assert.match(
    tsSource,
    /magic-studio-server\.contract\.json/,
    'Expected the TypeScript contract facade to consume the canonical contract JSON.',
  );
  assert.match(
    tsSource,
    /createRouteDefinitionsById[\s\S]*route\.id/,
    'Expected the TypeScript contract facade to index canonical routes by stable route id.',
  );
  assert.match(
    tsSource,
    /createMagicStudioServerHostDescriptor[\s\S]*resolveMagicStudioServerHostDescriptor/,
    'Expected the server contract facade to own canonical host descriptor construction and resolution.',
  );
  assert.match(
    tsSource,
    /resolveMagicStudioServerRoutePath[\s\S]*resolveMagicStudioServerOpenApiPath/,
    'Expected the TypeScript contract facade to expose route-id-based helpers for materialized public paths and OpenAPI paths.',
  );
  assert.match(
    tsSource,
    /requireMetaRouteId[\s\S]*meta\.healthRouteId[\s\S]*meta\.routeCatalogRouteId[\s\S]*meta\.runtimeSummaryRouteId/,
    'Expected the TypeScript contract facade to derive discovery paths from meta route ids.',
  );
  assert.doesNotMatch(
    hostCoreSource,
    /createMagicStudioHostDescriptor|resolveMagicStudioHostDescriptor|MAGIC_STUDIO_DEFAULT_LOCAL_(?:HEALTH|DOCS|OPENAPI|ROUTE_CATALOG|RUNTIME_SUMMARY)_PATH/,
    'Expected host-core to avoid owning canonical discovery path constants or full host descriptor authority.',
  );
  assert.match(
    magicStudioServerRuntimeSource,
    /resolveMagicStudioServerHostDescriptor/,
    'Expected magic-studio-core runtime to resolve host descriptors through the server package facade.',
  );
  assert.doesNotMatch(
    magicStudioServerRuntimeSource,
    /sdkwork-magic-studio-host-core/,
    'Expected magic-studio-core runtime to stop importing host descriptor authority from host-core directly.',
  );
  assert.doesNotMatch(
    tsSource,
    /requireContractRoutePath\(/,
    'Expected the TypeScript contract facade to remove the legacy path-only lookup helper.',
  );
  assert.match(
    rustSource,
    /magic-studio-server\.contract\.json/,
    'Expected the Rust server to consume the canonical contract JSON.',
  );
  assert.match(
    rustSource,
    /validate_server_contract[\s\S]*duplicate route id[\s\S]*route_catalog_route_id[\s\S]*runtime_summary_route_id/,
    'Expected the Rust contract loader to reject duplicate canonical route ids at load time.',
  );
  assert.match(
    rustSource,
    /pub fn require_route_path_by_id/,
    'Expected the Rust contract loader to expose route-id-based path lookup.',
  );
  assert.match(
    rustSource,
    /pub fn openapi_path_for_route_id[\s\S]*pub fn axum_path_for_route_id[\s\S]*pub fn materialize_route_path/,
    'Expected the Rust contract loader to expose canonical helpers for OpenAPI, Axum, and materialized public route paths.',
  );
  assert.doesNotMatch(
    rustSource,
    /pub fn require_route_path\(/,
    'Expected the Rust contract loader to remove the legacy method-plus-path lookup helper.',
  );
  assert.doesNotMatch(
    rustSource,
    /pub fn require_surface_route_path\(/,
    'Expected the Rust contract loader to remove the legacy surface-plus-suffix path lookup helper.',
  );
  assert.match(
    rustLibSource,
    /create_app_state[\s\S]*create_default_app_state[\s\S]*create_desktop_app_state/,
    'Expected the Rust host facade to expose explicit server and desktop app-state constructors.',
  );
  assert.match(
    rustLibSource,
    /routes::build_router\(&state\)/,
    'Expected the Rust host facade to delegate public route composition to the dedicated routes module.',
  );
  assert.match(
    rustRoutesModSource,
    /core::mount_routes[\s\S]*docs::mount_routes[\s\S]*app::mount_routes[\s\S]*admin::mount_routes/,
    'Expected the Rust routes module to compose core, docs, app, and admin surfaces explicitly.',
  );
  assert.match(
    rustCoreRoutesSource,
    /require_route_path_by_id\(&meta\.health_route_id\)[\s\S]*require_route_path_by_id\(&meta\.route_catalog_route_id\)[\s\S]*require_route_path_by_id\(&meta\.runtime_summary_route_id\)/,
    'Expected the Rust core surface to bind discovery routes through canonical meta route ids.',
  );
  assert.match(
    rustCoreRoutesSource,
    /require_route_path_by_id\("coreFileSystemReadDir"\)[\s\S]*require_route_path_by_id\("coreMediaProbe"\)[\s\S]*require_route_path_by_id\("corePolicySnapshotRead"\)/,
    'Expected the Rust core surface to bind canonical core route ids directly from the shared contract.',
  );
  assert.match(
    rustCoreRoutesSource,
    /axum_path_for_route_id\("coreJobsRead"\)[\s\S]*axum_path_for_route_id\("coreJobsCancel"\)/,
    'Expected the Rust core surface to derive parameterized Axum route bindings from canonical route ids.',
  );
  assert.match(
    rustTestsSupportSource,
    /fn route_path[\s\S]*fn openapi_path[\s\S]*fn route_path_with_params/,
    'Expected Rust route tests to expose contract-driven helpers for request and OpenAPI path resolution.',
  );
  assert.doesNotMatch(
    rustTestsSupportSource,
    /\.uri\("\/(?:healthz|docs|openapi\.json|api\/core\/v1\/routes|api\/core\/v1\/runtime\/summary|api\/core\/v1\/toolkit\/capabilities|api\/app\/v1\/plugins|api\/admin\/v1\/deployments|api\/core\/v1\/jobs|api\/core\/v1\/media\/probe|api\/core\/v1\/media\/image\/resize|api\/core\/v1\/media\/video\/concat|api\/core\/v1\/media\/video\/transcode|api\/core\/v1\/media\/video\/trim|api\/core\/v1\/media\/video\/extract-audio|api\/core\/v1\/media\/video\/thumbnail|api\/core\/v1\/media\/audio\/convert|api\/core\/v1\/media\/audio\/normalize|api\/core\/v1\/media\/audio\/mix|api\/core\/v1\/compression\/zip|api\/core\/v1\/database\/sqlite\/execute-batch|api\/core\/v1\/database\/sqlite\/query|api\/core\/v1\/database\/sqlite\/execute)/,
    'Expected Rust positive route tests to resolve canonical request paths through contract helpers instead of hardcoded public URI strings.',
  );
  assert.doesNotMatch(
    rustLibSource,
    /require_surface_route_path|require_route_path_by_id\("core|require_route_path\("/,
    'Expected lib.rs to stay limited to host composition instead of inlining per-route ownership.',
  );
  assert.doesNotMatch(
    rustSource,
    /base_path:\s*"\/api"(?:\.to_string\(\))?/,
    'Expected Rust gateway summary metadata to derive the gateway base path from the canonical surface base paths instead of hardcoding /api.',
  );
  assert.doesNotMatch(
    rustResponseSource,
    /API_VERSION:\s*&str\s*=\s*"v1"/,
    'Expected Rust response envelopes to derive API version metadata from the canonical contract instead of hardcoding v1.',
  );
  assert.doesNotMatch(
    rustAppRoutesSource,
    /route_prefix:\s*"\/api\/app\/v1/,
    'Expected Rust app route payload metadata to derive plugin route prefixes from the canonical app surface base path instead of hardcoding /api/app/v1.',
  );
  assert.doesNotMatch(
    tsClientSource,
    /joinUrl\(baseUrl,\s*[`'"]\/api\/(?:core|app|admin)\/v1/,
    'Expected the TypeScript client to resolve canonical route paths through the contract facade instead of hardcoded API strings.',
  );
  assert.match(
    tsClientSource,
    /MAGIC_STUDIO_SERVER_[A-Z0-9_]+_PATH/,
    'Expected the TypeScript client to consume canonical route-path constants from the contract facade.',
  );
  assert.match(
    tsClientSource,
    /resolveMagicStudioServerRoutePath\('coreJobsRead'[\s\S]*resolveMagicStudioServerRoutePath\('coreJobsCancel'/,
    'Expected the TypeScript client to materialize parameterized job routes through the server contract facade.',
  );
  assert.doesNotMatch(
    tsClientSource,
    /function fillPathTemplate\(/,
    'Expected the TypeScript client to stop owning ad hoc route-template filling logic.',
  );
  assert.match(
    rustCoreMediaRoutesSource,
    /MediaVideoConcatRequest/,
    'Expected the Rust core route DTO naming to align with the canonical video concat route vocabulary.',
  );
  assert.doesNotMatch(
    rustCoreMediaRoutesSource,
    /MediaFfmpegConcatRequest/,
    'Expected the Rust core route DTO naming to drop legacy ffmpeg concat terminology.',
  );

  assert.match(
    tauriMainSource,
    /start_embedded_magic_studio_server\(\)\?/,
    'Expected desktop startup to host the embedded canonical Rust server.',
  );
  assert.match(
    tauriMainSource,
    /mod shell;[\s\S]*\.invoke_handler\(shell::invoke_handler!\(\)\)/,
    'Expected desktop startup to centralize invoke registration behind the shell registry module.',
  );
  assert.doesNotMatch(
    tauriMainSource,
    /mod commands;|mod pty;|mod session;/,
    'Expected desktop startup to keep native shell implementation modules nested under the shell namespace.',
  );
  assert.doesNotMatch(
    tauriMainSource,
    /tauri::generate_handler!\[/,
    'Expected main.rs to stop inlining the invoke allowlist directly.',
  );
  assert.doesNotMatch(
    tauriMainSource,
    /mod events;/,
    'Expected desktop startup to stop carrying a separate shell events module once shell authority is centralized.',
  );
  assert.match(
    tauriEmbeddedServerSource,
    /create_desktop_app_state|desktop_local|serve_app/,
    'Expected the embedded server bootstrap to reuse the canonical Rust server host helpers.',
  );

  for (const retiredDesktopShellModulePath of [
    tauriLegacyShellSourcePath,
    tauriLegacyCommandsModSourcePath,
    tauriLegacyPtySourcePath,
    tauriLegacySessionSourcePath,
    tauriLegacyFsDirPath,
    tauriLegacyPlatformDirPath,
  ]) {
    assert.equal(
      fs.existsSync(retiredDesktopShellModulePath),
      false,
      `Expected ${path.relative(workspaceRoot, retiredDesktopShellModulePath)} to be retired once desktop shell ownership moves under src-tauri/src/shell/.`,
    );
  }

  assert.match(
    tauriCommandsModSource,
    /pub mod pty;[\s\S]*pub mod system;/,
    'Expected the shell command module surface to stay shell-only under the dedicated shell namespace.',
  );
  assert.doesNotMatch(
    tauriCommandsModSource,
    /filesystem_commands|media_commands|compression_commands|database_commands|job_commands|migration_commands|policy_commands|toolkit_commands/,
    'Expected the Tauri command module surface to remove all business command modules.',
  );

  assert.match(
    tauriShellSource,
    /pub\(crate\)\s+mod commands;[\s\S]*mod pty;[\s\S]*mod session;/,
    'Expected the shell registry module to own the full private desktop shell namespace.',
  );
  assert.match(
    tauriShellSource,
    /pub const SHELL_COMMAND_MODULES:[\s\S]*"commands::pty"[\s\S]*"commands::system"/,
    'Expected the shell registry to own the closed module allowlist for native commands.',
  );
  assert.match(
    tauriShellSource,
    /pub const SHELL_COMMAND_NAMES:[\s\S]*"create_pty"[\s\S]*"start_pty"[\s\S]*"write_pty"[\s\S]*"resize_pty"[\s\S]*"kill_pty"[\s\S]*"sync_pty_sessions"[\s\S]*"system_command_exists"/,
    'Expected the shell registry to keep PTY and system shell commands only.',
  );
  assert.match(
    tauriShellSource,
    /pub const PTY_OUTPUT_EVENT_PREFIX:[\s\S]*pub const SHELL_EVENT_PREFIXES:[\s\S]*pub fn pty_output_event/,
    'Expected the shell registry to own shell event prefix authority and PTY event materialization.',
  );
  assert.match(
    tauriShellSource,
    /macro_rules!\s*invoke_handler[\s\S]*crate::shell::commands::pty::create_pty[\s\S]*crate::shell::commands::pty::sync_pty_sessions[\s\S]*crate::shell::commands::system::system_command_exists[\s\S]*pub\(crate\)\s*use invoke_handler;/,
    'Expected the shell registry to be the sole owner of the native invoke handler.',
  );
  assert.doesNotMatch(
    tauriShellSource,
    /fs_ensure_dir|fs_exists|fs_read_dir|fs_read_string|fs_read_bytes|fs_write_bytes|fs_remove|fs_rename|fs_copy_file|fs_stat|media_probe_available|media_command_execute|media_probe|compression_unzip|compression_zip_bytes|database_execute|database_query|database_execute_batch|migration_status|migration_apply|policy_validate_path|policy_validate_command|job_get|job_list|job_cancel|toolkit_execute|system_runtime_info/,
    'Expected the shell registry to remove all business invoke command registrations.',
  );
  assert.match(
    tauriPtySource,
    /use super::\{pty_output_event, session::Session\};/,
    'Expected PTY emission to consume the centralized shell event helper.',
  );
  assert.doesNotMatch(
    tauriPtySource,
    /use crate::events::pty_output_event;|use crate::session::Session;|format!\("pty-output:/,
    'Expected PTY emission to avoid a separate events module and handwritten event strings.',
  );

  assert.match(
    tauriContextSource,
    /use crate::shell::PtyState;[\s\S]*SystemService[\s\S]*PtyService/,
    'Expected AppContext to compose only shell-native services from the unified shell namespace.',
  );
  assert.doesNotMatch(
    tauriContextSource,
    /use crate::pty::PtyState;/,
    'Expected AppContext to stop importing PTY state from a sibling top-level module.',
  );
  assert.doesNotMatch(
    tauriContextSource,
    /FileSystemService|MediaService|CompressionService|DatabaseService|MigrationService|ToolkitService|JobService/,
    'Expected AppContext to remove all business-service wiring.',
  );

  assert.match(
    runtimeBridgeTypesSource,
    /from '\.\/shellVocabulary'[\s\S]*PlatformShellCommandName[\s\S]*PlatformShellEventName/,
    'Expected platform runtime bridge types to define a closed shell-only command and event vocabulary.',
  );
  assert.match(
    runtimeShellVocabularySource,
    /PLATFORM_SHELL_COMMAND_NAMES[\s\S]*isPlatformShellCommandName[\s\S]*PTY_OUTPUT_SHELL_EVENT_PREFIX[\s\S]*createPtyOutputShellEventName[\s\S]*isPlatformShellEventName/,
    'Expected magic-studio-core to centralize desktop shell command and event vocabulary in one runtime module.',
  );
  assert.match(
    desktopBridgeSource,
    /isPlatformShellCommandName[\s\S]*isPlatformShellEventName/,
    'Expected desktop bridge validation to reuse the shared runtime shell vocabulary helpers.',
  );
  assert.doesNotMatch(
    desktopBridgeSource,
    /new Set<PlatformShellCommandName>|startsWith\('pty-output:'\)/,
    'Expected desktop bridge validation to stop owning duplicate shell vocabulary logic.',
  );
  assert.doesNotMatch(
    runtimeBridgeTypesSource,
    /fs_read_dir|fs_stat|fs_remove|fs_rename|fs_copy_file/,
    'Expected platform runtime bridge types to drop filesystem commands once the canonical Rust server owns filesystem transport.',
  );
  assert.match(
    platformSource,
    /export const isDesktopShellRuntime/,
    'Expected the public platform probe to use desktop-shell terminology.',
  );
  assert.doesNotMatch(
    platformSource,
    /export const isTauri/,
    'Expected the public platform probe to stop exposing Tauri-specific naming.',
  );
  assert.match(
    platformIndexSource,
    /isDesktopShellRuntime/,
    'Expected the platform index surface to export the neutral desktop-shell runtime probe.',
  );
  assert.match(
    platformIndexSource,
    /createServerPlatform[\s\S]*serverPlatform/,
    'Expected the platform index surface to export a standalone server platform profile.',
  );
  assert.doesNotMatch(
    platformIndexSource,
    /\bisTauri\b/,
    'Expected the platform index surface to stop exporting the legacy isTauri helper.',
  );
  assert.match(
    platformSource,
    /configurePlatformApi[\s\S]*new Proxy/,
    'Expected the platform surface to delegate through a reconfigurable platform proxy.',
  );
  assert.match(
    platformSource,
    /currentPlatformApi: PlatformAPI \| null = null[\s\S]*ensurePlatformApi/,
    'Expected the platform surface to lazily initialize the active platform API instead of creating it at import time.',
  );
  assert.doesNotMatch(
    platformSource,
    /console\.log\('\[Platform\]/,
    'Expected platform initialization to avoid import-time logging side effects.',
  );
  assert.match(
    runtimeKindsSource,
    /export\s*\{[\s\S]*isBrowserHostedRuntimeKind[\s\S]*isDesktopShellRuntimeKind[\s\S]*\}\s*from '@sdkwork\/magic-studio-types\/runtime';/,
    'Expected the runtime layer to delegate canonical runtime-kind classification to magic-studio-types/runtime.',
  );
  assert.match(
    bootstrapSource,
    /isBrowserHostedRuntimeKind[\s\S]*runtime\.system\.kind\(\)/,
    'Expected bootstrap to use the canonical browser-hosted runtime classification when promoting same-origin Rust server delivery.',
  );
  assert.doesNotMatch(
    bootstrapSource,
    /runtime\.system\.kind\(\)\s*!==\s*'web'/,
    'Expected bootstrap to stop treating literal web as the only browser-hosted runtime.',
  );
  assert.match(
    runtimeMagicStudioStorageSource,
    /loadMagicStudioStorageConfigFromRuntime[\s\S]*resolveRuntimeMagicStudioRootLayout[\s\S]*resolveRuntimeMagicStudioUserLayout/,
    'Expected the storage layer to expose runtime-backed canonical MagicStudio layout resolvers.',
  );
  assert.match(
    runtimeMagicStudioAssetsSource,
    /MAGIC_STUDIO_ASSET_PROTOCOL[\s\S]*resolveRuntimeMagicStudioAssetAbsolutePath[\s\S]*resolveRuntimeMagicStudioAssetUrl/,
    'Expected the storage layer to expose canonical runtime asset-protocol path and URL resolvers.',
  );
  assert.match(
    runtimeIndexSource,
    /export \* from '\.\/kinds';/,
    'Expected the runtime index surface to re-export the canonical runtime classification helpers.',
  );
  assert.match(
    runtimeManagerSource,
    /currentPlatformRuntime: PlatformRuntime \| null = null[\s\S]*ensurePlatformRuntime/,
    'Expected platform runtime management to initialize lazily instead of creating a runtime at module import time.',
  );
  assert.match(
    toolkitManagerSource,
    /currentPlatformToolKit: PlatformToolKit \| null = null[\s\S]*currentToolKitRuntime: PlatformRuntime \| null = null[\s\S]*ensurePlatformToolKit/,
    'Expected platform toolkit management to initialize lazily instead of creating a toolkit at module import time.',
  );
  assert.match(
    toolkitManagerSource,
    /currentToolKitRuntime !== runtime[\s\S]*createPlatformToolKit\(runtime\)/,
    'Expected platform toolkit management to recreate the toolkit when the active runtime changes.',
  );
  assert.match(
    serverPlatformSource,
    /getPlatform:\s*\(\)\s*=>\s*'server'/,
    'Expected the browser-hosted server platform to report the standalone server runtime kind.',
  );
  assert.match(
    localServerFileSystemSource,
    /createMagicStudioServerClient[\s\S]*resolveMagicStudioServerHostDescriptor/,
    'Expected the shared local Rust server file-system adapter to use the canonical server client and host descriptor.',
  );
  assert.match(
    serverRuntimeSummarySource,
    /readRuntimeSummary\(\)\.then\(\(response\)\s*=>\s*response\.data\)[\s\S]*systemPaths\[name\]/,
    'Expected browser-hosted server runtime paths to come from the canonical Rust runtime summary.',
  );
  assert.match(
    serverPlatformSource,
    /readServerRuntimeSystemPath[\s\S]*createLocalServerFileSystemApi/,
    'Expected the browser-hosted server platform to compose canonical runtime system paths and shared Rust HTTP filesystem access.',
  );
  assert.doesNotMatch(
    serverPlatformSource,
    /\.\.\.webPlatform|getWebFileSystem|MagicStudio_VFS/,
    'Expected the browser-hosted server platform to stop inheriting web IndexedDB filesystem semantics.',
  );
  assert.match(
    webPlatformSource,
    /requireIndexedDb[\s\S]*getWebFileSystem/,
    'Expected the web platform to gate IndexedDB access behind lazy helper functions.',
  );
  assert.doesNotMatch(
    webPlatformSource,
    /const fs = new WebFileSystem\(\)/,
    'Expected the web platform to avoid eagerly constructing its filesystem at module import time.',
  );
  assert.match(
    bootstrapSource,
    /createRuntimeMagicStudioServerClient[\s\S]*readRuntimeSummary[\s\S]*configurePlatformRuntime[\s\S]*createServerPlatform/,
    'Expected application bootstrap to promote same-origin Rust host delivery into the server runtime profile.',
  );
  assert.match(
    downloadServiceSource,
    /resolveRuntimeMagicStudioAssetAbsolutePath[\s\S]*resolveRuntimeMagicStudioAssetUrl/,
    'Expected download runtime logic to resolve managed asset paths and URLs through canonical runtime asset helpers.',
  );
  assert.doesNotMatch(
    downloadServiceSource,
    /replace\('assets:\/\/', ''\)|Stub: assets:\/\/ protocol handling/,
    'Expected download runtime logic to remove protocol-stripping placeholders for assets:// handling.',
  );
  assert.match(
    chatServiceSource,
    /resolveRuntimeMagicStudioChatDirectory/,
    'Expected chat storage logic to resolve transcripts through the canonical runtime-backed chat directory resolver.',
  );
  assert.doesNotMatch(
    chatServiceSource,
    /\/mock\/chats/,
    'Expected chat storage logic to stop using ad hoc mock chat roots.',
  );
  assert.match(
    chatStoragePathsSource,
    /resolveRuntimeMagicStudioChatDirectory[\s\S]*resolveRuntimeMagicStudioUserLayout/,
    'Expected chat storage path helpers to delegate runtime-backed path resolution to the canonical storage layout layer.',
  );
  assert.doesNotMatch(
    commonsUtilsIndexSource,
    /storageConfig|APP_ROOT_DIR|DIR_NAMES|PROJECT_SUBDIRS|CACHE_SUBDIRS|SYSTEM_LIBRARY_DIRS/,
    'Expected magic-studio-commons utils surface to stop exporting retired static MagicStudio storage constants.',
  );
  assert.doesNotMatch(
    fsIndexSource,
    /storageConfig|APP_ROOT_DIR|DIR_NAMES|PROJECT_SUBDIRS|CACHE_SUBDIRS|SYSTEM_LIBRARY_DIRS/,
    'Expected magic-studio-fs surface to stop re-exporting retired static MagicStudio storage constants.',
  );
  assert.match(
    driveServiceSource,
    /resolveRuntimeMagicStudioRootLayout[\s\S]*systemLibraryRoot/,
    'Expected drive default-path logic to resolve the canonical MagicStudio system library root.',
  );
  assert.match(
    driveServiceSource,
    /listMagicStudioSystemLibraryDirs/,
    'Expected drive library initialization to create the canonical typed system-library directories.',
  );
  assert.doesNotMatch(
    driveServiceSource,
    /\/mock\/assets|system\.path\('documents'\)|LIBRARY_SUBDIRS|downloads|images|models/,
    'Expected drive default-path logic to stop using mock roots, legacy library subdirs, or generic documents fallbacks.',
  );
  assert.match(
    assetServiceSource,
    /resolveMagicStudioSystemLibraryDir[\s\S]*listMagicStudioSystemLibraryDirs/,
    'Expected asset import and indexing flows to consume the canonical system-library taxonomy helpers.',
  );
  assert.match(
    assetServiceSource,
    /isCanonicalMagicStudioAssetReference[\s\S]*isLocalFilePath[\s\S]*isExplicitLocalAssetLocator[\s\S]*isManagedAssetLocator[\s\S]*assetCenterService\.resolveLocatorUrl[\s\S]*resolveRuntimeMagicStudioAssetUrl/,
    'Expected legacy asset service URL resolution to delegate canonical locator and local-path handling to shared storage helpers and the asset-center resolver.',
  );
  assert.doesNotMatch(
    assetServiceSource,
    /LIBRARY_SUBDIRS|downloads|images|models|misc/,
    'Expected asset storage logic to remove legacy library bucket names from canonical MagicStudio flows.',
  );
  assert.match(
    mediaServiceSource,
    /isBrowserHostedRuntimeKind[\s\S]*resolveRuntimeMagicStudioAssetUrl/,
    'Expected media runtime logic to use the canonical browser-hosted classification and asset URL resolver.',
  );
  assert.doesNotMatch(
    mediaServiceSource,
    /kind\(\)\s*===\s*'web'|replace\('assets:\/\/', ''\)/,
    'Expected media runtime logic to stop treating literal web as the only browser-hosted runtime or stripping asset protocol prefixes.',
  );
  assert.match(
    aspectRatioServiceSource,
    /resolveRuntimeMagicStudioAssetUrl/,
    'Expected aspect-ratio metadata logic to resolve managed assets through the canonical runtime asset URL helper.',
  );
  assert.doesNotMatch(
    aspectRatioServiceSource,
    /convertFileSrc/,
    'Expected aspect-ratio metadata logic to stop duplicating desktop-only file URL conversion.',
  );
  assert.match(
    browserViewportSource,
    /browser\.supported\(\)/,
    'Expected browser viewport to guard embedded-browser behavior through the runtime browser capability boundary.',
  );
  assert.doesNotMatch(
    browserViewportSource,
    /bridge\.listen\('browser:new-tab-requested'/,
    'Expected browser viewport to stop depending on a non-existent browser shell event surface.',
  );
  assert.doesNotMatch(
    browserViewportSource,
    /@tauri-apps\/api\/event/,
    'Expected browser viewport to avoid direct Tauri event imports.',
  );
  assert.match(
    runtimeCompressionServiceSource,
    /getPlatformRuntime|getPlatformToolKit/,
    'Expected compression runtime service to depend on canonical platform runtime and toolkit APIs.',
  );
  assert.doesNotMatch(
    runtimeCompressionServiceSource,
    /@tauri-apps\/api\/core|compression_zip_bytes|compression_unzip|compress_files|decompress_file|decompress_buffer/,
    'Expected compression runtime service to avoid direct Tauri invoke command transport.',
  );
  assert.doesNotMatch(
    driveServiceSource,
    /replace\('assets:\/\/', ''\)/,
    'Expected drive runtime logic to avoid protocol-stripping placeholders.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /packages\/sdkwork-magic-studio-server\/src-host/,
    'Expected the unified architecture standard to declare the canonical Rust server kernel path.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /\/api\/core\/v1[\s\S]*\/api\/app\/v1[\s\S]*\/api\/admin\/v1/,
    'Expected the unified architecture standard to define the canonical core, app, and admin API surfaces.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /requestBodySchema[\s\S]*successResponseSchema/,
    'Expected the unified architecture standard to require canonical request and success schema ownership.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /assets:\/\//,
    'Expected the unified architecture standard to define the managed asset protocol.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /system\/library\/video[\s\S]*system\/library\/image[\s\S]*system\/library\/audio[\s\S]*system\/library\/text[\s\S]*system\/library\/other/,
    'Expected the unified architecture standard to define the canonical system-library taxonomy.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /shell-only/,
    'Expected the unified architecture standard to preserve the shell-only Tauri boundary.',
  );
  assert.match(
    tauriFrameworkArchitectureSource,
    /magic-studio-unified-host-api-standard\.md/,
    'Expected the Tauri framework architecture doc to point to the unified host/API standard.',
  );
  assert.match(
    localMediaToolkitArchitectureSource,
    /magic-studio-unified-host-api-standard\.md/,
    'Expected the local media toolkit architecture doc to point to the unified host/API standard.',
  );
  assert.match(
    readmeSource,
    /magic-studio-unified-host-api-standard\.md/,
    'Expected the project README to point to the unified host/API standard.',
  );

  for (const legacyArchitectureDocPath of legacyArchitectureDocPaths) {
    const legacyArchitectureSource = fs.readFileSync(legacyArchitectureDocPath, 'utf8');

    assert.match(
      legacyArchitectureSource,
      /Superseded for Magic Studio V2 on 2026-04-19\./,
      `Expected ${path.basename(legacyArchitectureDocPath)} to be marked as superseded.`,
    );
    assert.match(
      legacyArchitectureSource,
      /magic-studio-unified-host-api-standard\.md/,
      `Expected ${path.basename(legacyArchitectureDocPath)} to point to the unified host/API standard.`,
    );
  }

  for (const retiredFile of [
    legacyStaticStorageConfigSourcePath,
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'media_commands.rs'),
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'compression_commands.rs'),
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'database_commands.rs'),
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'job_commands.rs'),
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'migration_commands.rs'),
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'policy_commands.rs'),
    path.join(workspaceRoot, 'src-tauri', 'src', 'commands', 'toolkit_commands.rs'),
  ]) {
    assert.equal(
      fs.existsSync(retiredFile),
      false,
      `Expected retired Tauri business command file to be removed: ${path.basename(retiredFile)}`,
    );
  }
});

test('workspace sources consume public package exports for shared runtime and settings contracts', () => {
  const disallowedImports = [
    {
      label: '@sdkwork/magic-studio-core private source import',
      pattern: /(?:from\s+['"]|import\s*\(\s*['"]|vi\.mock\(\s*['"])[^'"]*sdkwork-magic-studio-core\/src\/[^'"]*['"]/g,
    },
    {
      label: '@sdkwork/magic-studio-settings private source import',
      pattern: /(?:from\s+['"]|import\s*\(\s*['"]|vi\.mock\(\s*['"])[^'"]*sdkwork-magic-studio-settings\/src\/[^'"]*['"]/g,
    },
  ];

  const offenders = [];

  for (const rootDir of boundaryScanRoots) {
    for (const sourcePath of collectBoundarySourceFiles(rootDir)) {
      const source = fs.readFileSync(sourcePath, 'utf8');

      for (const rule of disallowedImports) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(source)) {
          offenders.push(`${path.relative(workspaceRoot, sourcePath)} -> ${rule.label}`);
        }
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected workspace sources to consume public package exports only.\n${offenders.join('\n')}`,
  );
});

test('canonical asset vocabulary stays desktop-shell neutral', () => {
  const assetCenterTypesPath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-types',
    'src',
    'asset-center.types.ts',
  );
  const projectGraphTypesPath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-types',
    'src',
    'project-graph.types.ts',
  );
  const runtimeAssetVfsSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'infrastructure',
    'RuntimeAssetVfs.ts',
  );
  const defaultAssetUrlResolverSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'infrastructure',
    'DefaultAssetUrlResolver.ts',
  );
  const assetUrlResolverSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'application',
    'assetUrlResolver.ts',
  );
  const assetCenterServiceSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'application',
    'AssetCenterService.ts',
  );
  const useAssetUrlSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'hooks',
    'useAssetUrl.ts',
  );
  const chooseAssetSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'ChooseAsset.tsx',
  );
  const attachmentGridSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'CreationChatInput',
    'components',
    'AttachmentGrid.tsx',
  );
  const magicCutResourceUtilsSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'utils',
    'resourceUtils.ts',
  );
  const magicCutResourceManagerSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'engine',
    'renderer',
    'ResourceManager.ts',
  );
  const magicCutExportModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'components',
    'Export',
    'ExportModal.tsx',
  );
  const magicCutStoreSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'store',
    'magicCutStore.tsx',
  );
  const legacyRuntimeAssetVfsSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'infrastructure',
    'BrowserTauriAssetVfs.ts',
  );
  const assetCenterIndexSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'index.ts',
  );
  const createDefaultAssetCenterSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'infrastructure',
    'createDefaultAssetCenter.ts',
  );
  const magicCutAssetStateSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'domain',
    'assets',
    'magicCutAssetState.ts',
  );
  const resourcePanelAssetsSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'domain',
    'assets',
    'resourcePanelAssets.ts',
  );
  const filmServiceSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-film',
    'src',
    'services',
    'filmService.ts',
  );
  const canvasVideoNodeSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-canvas',
    'src',
    'components',
    'nodes',
    'VideoNode.tsx',
  );
  const magicCutVideoNodeSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'components',
    'nodes',
    'VideoNode.tsx',
  );
  const notesImageNodeSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-notes',
    'src',
    'components',
    'editor',
    'ImageNode.tsx',
  );
  const notesMediaNodeSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-notes',
    'src',
    'components',
    'editor',
    'MediaNode.tsx',
  );
  const notesFileAttachmentNodeSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-notes',
    'src',
    'components',
    'editor',
    'FileAttachmentNode.tsx',
  );
  const notesMiniProgramNodeSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-notes',
    'src',
    'components',
    'editor',
    'MiniProgramNode.tsx',
  );
  const imageCanvasEditorSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-image',
    'src',
    'components',
    'ImageCanvasEditor.tsx',
  );
  const imageGridEditorSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-image',
    'src',
    'components',
    'ImageGridEditor.tsx',
  );
  const filePreviewModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-drive',
    'src',
    'components',
    'FilePreviewModal.tsx',
  );
  const driveBusinessServiceSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-drive',
    'src',
    'services',
    'driveBusinessService.ts',
  );
  const canvasExportServiceSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-canvas',
    'src',
    'services',
    'canvasExportService.ts',
  );
  const generationHistoryAssetResolverSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-generation-history',
    'src',
    'assetUrlResolver.ts',
  );
  const generationItemSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-generation-history',
    'src',
    'components',
    'GenerationItem.tsx',
  );
  const generationPreviewSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-generation-history',
    'src',
    'components',
    'GenerationPreview.tsx',
  );
  const runtimeMagicStudioAssetReferenceSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-core',
    'src',
    'storage',
    'runtimeMagicStudioAssetReference.ts',
  );
  const workspaceServiceSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-workspace',
    'src',
    'services',
    'workspaceService.ts',
  );
  const assetLocatorSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'asset-center',
    'domain',
    'assetLocator.ts',
  );
  const commonsUploadTypesSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'components',
    'upload',
    'types.ts',
  );
  const commonsUseAssetUrlSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'hooks',
    'useAssetUrl.ts',
  );
  const commonsHooksIndexSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'hooks',
    'index.ts',
  );
  const commonsIndexSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'index.ts',
  );
  const imageUploadSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'components',
    'upload',
    'ImageUpload.tsx',
  );
  const videoUploadSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'components',
    'upload',
    'VideoUpload.tsx',
  );
  const audioUploadSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'components',
    'upload',
    'AudioUpload.tsx',
  );
  const fileUploadSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-commons',
    'src',
    'components',
    'upload',
    'FileUpload.tsx',
  );
  const canonicalUploadAssetResolverSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'uploadAssetUrlResolver.ts',
  );
  const uploadImageGenerationModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'UploadImageGenerationModal.tsx',
  );
  const uploadVideoGenerationModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'UploadVideoGenerationModal.tsx',
  );
  const uploadMusicGenerationModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'UploadMusicGenerationModal.tsx',
  );
  const uploadAudioGenerationModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'UploadAudioGenerationModal.tsx',
  );
  const uploadCharacterGenerationModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'UploadCharacterGenerationModal.tsx',
  );
  const uploadPreviewModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'upload',
    'PreviewModal.tsx',
  );
  const generationChatWindowSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-assets',
    'src',
    'components',
    'generate',
    'GenerationChatWindow.tsx',
  );
  const imageGeneratorModalContentSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-image',
    'src',
    'components',
    'AIImageGeneratorModalContent.tsx',
  );
  const saveTemplateModalSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'components',
    'SaveTemplateModal.tsx',
  );
  const magicCutTrackHeaderSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'components',
    'Timeline',
    'MagicCutTrackHeader.tsx',
  );
  const magicCutTrackCoverImportSourcePath = path.join(
    workspaceRoot,
    'packages',
    'sdkwork-magic-studio-magiccut',
    'src',
    'utils',
    'magicCutTrackCoverImport.ts',
  );
  const platformRuntimeCapabilityMatrixDocPath = path.join(
    workspaceRoot,
    'docs',
    'platform-runtime-capability-matrix.md',
  );

  assert.equal(
    fs.existsSync(runtimeAssetVfsSourcePath),
    true,
    'Expected the neutral runtime asset VFS implementation to exist.',
  );
  assert.equal(
    fs.existsSync(legacyRuntimeAssetVfsSourcePath),
    false,
    'Expected the legacy BrowserTauriAssetVfs source file to be retired.',
  );

  const assetCenterTypesSource = fs.readFileSync(assetCenterTypesPath, 'utf8');
  const projectGraphTypesSource = fs.readFileSync(projectGraphTypesPath, 'utf8');
  const runtimeAssetVfsSource = fs.readFileSync(runtimeAssetVfsSourcePath, 'utf8');
  const defaultAssetUrlResolverSource = fs.readFileSync(defaultAssetUrlResolverSourcePath, 'utf8');
  const assetUrlResolverSource = fs.readFileSync(assetUrlResolverSourcePath, 'utf8');
  const assetCenterServiceSource = fs.readFileSync(assetCenterServiceSourcePath, 'utf8');
  const useAssetUrlSource = fs.readFileSync(useAssetUrlSourcePath, 'utf8');
  const chooseAssetSource = fs.readFileSync(chooseAssetSourcePath, 'utf8');
  const attachmentGridSource = fs.readFileSync(attachmentGridSourcePath, 'utf8');
  const magicCutResourceUtilsSource = fs.readFileSync(magicCutResourceUtilsSourcePath, 'utf8');
  const magicCutResourceManagerSource = fs.readFileSync(magicCutResourceManagerSourcePath, 'utf8');
  const magicCutExportModalSource = fs.readFileSync(magicCutExportModalSourcePath, 'utf8');
  const magicCutStoreSource = fs.readFileSync(magicCutStoreSourcePath, 'utf8');
  const assetCenterIndexSource = fs.readFileSync(assetCenterIndexSourcePath, 'utf8');
  const createDefaultAssetCenterSource = fs.readFileSync(createDefaultAssetCenterSourcePath, 'utf8');
  const magicCutAssetStateSource = fs.readFileSync(magicCutAssetStateSourcePath, 'utf8');
  const resourcePanelAssetsSource = fs.readFileSync(resourcePanelAssetsSourcePath, 'utf8');
  const filmServiceSource = fs.readFileSync(filmServiceSourcePath, 'utf8');
  const canvasVideoNodeSource = fs.readFileSync(canvasVideoNodeSourcePath, 'utf8');
  const magicCutVideoNodeSource = fs.readFileSync(magicCutVideoNodeSourcePath, 'utf8');
  const notesImageNodeSource = fs.readFileSync(notesImageNodeSourcePath, 'utf8');
  const notesMediaNodeSource = fs.readFileSync(notesMediaNodeSourcePath, 'utf8');
  const notesFileAttachmentNodeSource = fs.readFileSync(notesFileAttachmentNodeSourcePath, 'utf8');
  const notesMiniProgramNodeSource = fs.readFileSync(notesMiniProgramNodeSourcePath, 'utf8');
  const imageCanvasEditorSource = fs.readFileSync(imageCanvasEditorSourcePath, 'utf8');
  const imageGridEditorSource = fs.readFileSync(imageGridEditorSourcePath, 'utf8');
  const filePreviewModalSource = fs.readFileSync(filePreviewModalSourcePath, 'utf8');
  const driveBusinessServiceSource = fs.readFileSync(driveBusinessServiceSourcePath, 'utf8');
  const canvasExportServiceSource = fs.readFileSync(canvasExportServiceSourcePath, 'utf8');
  const generationHistoryAssetResolverSource = fs.readFileSync(
    generationHistoryAssetResolverSourcePath,
    'utf8',
  );
  const generationItemSource = fs.readFileSync(generationItemSourcePath, 'utf8');
  const generationPreviewSource = fs.readFileSync(generationPreviewSourcePath, 'utf8');
  const runtimeMagicStudioAssetsSource = fs.readFileSync(
    runtimeMagicStudioAssetsSourcePath,
    'utf8',
  );
  const runtimeMagicStudioAssetReferenceSource = fs.readFileSync(
    runtimeMagicStudioAssetReferenceSourcePath,
    'utf8',
  );
  const workspaceServiceSource = fs.readFileSync(workspaceServiceSourcePath, 'utf8');
  const assetLocatorSource = fs.readFileSync(assetLocatorSourcePath, 'utf8');
  const commonsUploadTypesSource = fs.readFileSync(commonsUploadTypesSourcePath, 'utf8');
  const commonsUseAssetUrlSource = fs.readFileSync(commonsUseAssetUrlSourcePath, 'utf8');
  const commonsHooksIndexSource = fs.readFileSync(commonsHooksIndexSourcePath, 'utf8');
  const commonsIndexSource = fs.readFileSync(commonsIndexSourcePath, 'utf8');
  const imageUploadSource = fs.readFileSync(imageUploadSourcePath, 'utf8');
  const videoUploadSource = fs.readFileSync(videoUploadSourcePath, 'utf8');
  const audioUploadSource = fs.readFileSync(audioUploadSourcePath, 'utf8');
  const fileUploadSource = fs.readFileSync(fileUploadSourcePath, 'utf8');
  const canonicalUploadAssetResolverSource = fs.readFileSync(
    canonicalUploadAssetResolverSourcePath,
    'utf8',
  );
  const uploadImageGenerationModalSource = fs.readFileSync(
    uploadImageGenerationModalSourcePath,
    'utf8',
  );
  const uploadVideoGenerationModalSource = fs.readFileSync(
    uploadVideoGenerationModalSourcePath,
    'utf8',
  );
  const uploadMusicGenerationModalSource = fs.readFileSync(
    uploadMusicGenerationModalSourcePath,
    'utf8',
  );
  const uploadAudioGenerationModalSource = fs.readFileSync(
    uploadAudioGenerationModalSourcePath,
    'utf8',
  );
  const uploadCharacterGenerationModalSource = fs.readFileSync(
    uploadCharacterGenerationModalSourcePath,
    'utf8',
  );
  const uploadPreviewModalSource = fs.readFileSync(
    uploadPreviewModalSourcePath,
    'utf8',
  );
  const generationChatWindowSource = fs.readFileSync(
    generationChatWindowSourcePath,
    'utf8',
  );
  const imageGeneratorModalContentSource = fs.readFileSync(
    imageGeneratorModalContentSourcePath,
    'utf8',
  );
  const saveTemplateModalSource = fs.readFileSync(saveTemplateModalSourcePath, 'utf8');
  const magicCutTrackHeaderSource = fs.readFileSync(magicCutTrackHeaderSourcePath, 'utf8');
  const magicCutTrackCoverImportSource = fs.readFileSync(
    magicCutTrackCoverImportSourcePath,
    'utf8',
  );
  const unifiedHostApiStandardSource = fs.readFileSync(unifiedHostApiStandardDocPath, 'utf8');
  const platformRuntimeCapabilityMatrixSource = fs.readFileSync(
    platformRuntimeCapabilityMatrixDocPath,
    'utf8',
  );

  for (const [label, source] of [
    ['asset-center types', assetCenterTypesSource],
    ['project-graph types', projectGraphTypesSource],
    ['runtime asset VFS', runtimeAssetVfsSource],
    ['default asset URL resolver', defaultAssetUrlResolverSource],
    ['asset URL resolver', assetUrlResolverSource],
    ['asset-center service', assetCenterServiceSource],
    ['useAssetUrl hook', useAssetUrlSource],
    ['ChooseAsset component', chooseAssetSource],
    ['attachment grid', attachmentGridSource],
    ['magiccut resource utils', magicCutResourceUtilsSource],
    ['magiccut resource manager', magicCutResourceManagerSource],
    ['magiccut export modal', magicCutExportModalSource],
    ['magiccut store', magicCutStoreSource],
    ['asset-center index', assetCenterIndexSource],
    ['default asset-center factory', createDefaultAssetCenterSource],
    ['magiccut asset state', magicCutAssetStateSource],
    ['magiccut resource-panel assets', resourcePanelAssetsSource],
    ['film service', filmServiceSource],
    ['canvas video node', canvasVideoNodeSource],
    ['magiccut video node', magicCutVideoNodeSource],
    ['notes image node', notesImageNodeSource],
    ['notes media node', notesMediaNodeSource],
    ['notes file attachment node', notesFileAttachmentNodeSource],
    ['notes mini program node', notesMiniProgramNodeSource],
    ['image canvas editor', imageCanvasEditorSource],
    ['image grid editor', imageGridEditorSource],
    ['drive file preview modal', filePreviewModalSource],
    ['drive business service', driveBusinessServiceSource],
    ['canvas export service', canvasExportServiceSource],
    ['unified host standard doc', unifiedHostApiStandardSource],
    ['runtime capability matrix doc', platformRuntimeCapabilityMatrixSource],
  ]) {
    assert.doesNotMatch(
      source,
      /tauri-fs|BrowserTauriAssetVfs|tauri:\/\//,
      `Expected ${label} to drop legacy Tauri asset naming.`,
    );
  }

  assert.match(
    assetCenterTypesSource,
    /AssetStorageMode = 'browser-vfs' \| 'desktop-fs' \| 'remote-url' \| 'hybrid'/,
    'Expected shared asset storage modes to use the neutral desktop-fs vocabulary.',
  );
  assert.match(
    assetCenterTypesSource,
    /AssetLocatorProtocol = 'assets' \| 'file' \| 'http' \| 'https' \| 'desktop'/,
    'Expected shared asset locator protocols to use the neutral desktop locator vocabulary.',
  );
  assert.match(
    runtimeAssetVfsSource,
    /export class RuntimeAssetVfs[\s\S]*'desktop-fs'/,
    'Expected the asset VFS implementation to expose the neutral RuntimeAssetVfs class and desktop-fs mode.',
  );
  assert.match(
    assetCenterIndexSource,
    /export \{ RuntimeAssetVfs \}/,
    'Expected asset-center public exports to expose RuntimeAssetVfs.',
  );
  assert.match(
    createDefaultAssetCenterSource,
    /new RuntimeAssetVfs\(\)/,
    'Expected the default asset-center factory to compose the neutral RuntimeAssetVfs implementation.',
  );
  assert.match(
    runtimeMagicStudioAssetReferenceSource,
    /@sdkwork\/magic-studio-types\/asset-reference/,
    'Expected magic-studio-core storage to re-export canonical MagicStudio asset-reference primitives from the shared magic-studio-types owner.',
  );
  assert.match(
    runtimeMagicStudioAssetsSource,
    /runtimeMagicStudioAssetReference\.ts[\s\S]*stripMagicStudioAssetProtocol[\s\S]*resolveRuntimeMagicStudioAssetUrl/,
    'Expected runtime asset path and URL resolution to compose the shared asset-reference helpers.',
  );
  assert.doesNotMatch(
    runtimeMagicStudioAssetsSource,
    /const FILE_ASSET_PROTOCOL|const DESKTOP_ASSET_PROTOCOL|const WINDOWS_ABSOLUTE_PATH/,
    'Expected runtime asset path and URL resolution to stop re-owning low-level asset-reference protocol constants.',
  );
  assert.match(
    workspaceServiceSource,
    /normalizeMagicStudioAssetReference[\s\S]*resolveMagicStudioAssetReferenceName[\s\S]*isCanonicalMagicStudioAssetReference/,
    'Expected workspace service cover-image normalization to reuse shared magic-studio-core storage asset-reference helpers.',
  );
  assert.doesNotMatch(
    workspaceServiceSource,
    /const MANAGED_ASSET_PROTOCOL|const FILE_ASSET_PROTOCOL|const DESKTOP_ASSET_PROTOCOL|const WINDOWS_ABSOLUTE_PATH/,
    'Expected workspace service to stop owning local asset-reference protocol constants.',
  );
  assert.match(
    assetLocatorSource,
    /@sdkwork\/magic-studio-core\/storage[\s\S]*isMagicStudioAssetPath/,
    'Expected asset-center locator helpers to reuse the canonical magic-studio-core storage asset-reference primitives.',
  );
  assert.doesNotMatch(
    assetLocatorSource,
    /export const FILE_ASSET_PROTOCOL = 'file:\/\/'|export const DESKTOP_ASSET_PROTOCOL = 'desktop:\/\/'/,
    'Expected asset-center locator helpers to stop re-owning explicit local protocol constants.',
  );
  assert.match(
    magicCutAssetStateSource,
    /isManagedAssetLocator[\s\S]*isDesktopAssetLocator[\s\S]*isExplicitLocalAssetLocator[\s\S]*return 'desktop-fs'/,
    'Expected MagicCut asset normalization to derive locator protocol and desktop-fs storage from canonical asset-center helpers.',
  );
  assert.doesNotMatch(
    magicCutAssetStateSource,
    /prefix: 'assets:\/\/'|prefix: 'desktop:\/\/'|prefix: 'file:\/\/'/,
    'Expected MagicCut asset normalization to stop re-owning managed and explicit local locator prefix tables.',
  );
  assert.match(
    resourcePanelAssetsSource,
    /isManagedAssetLocator[\s\S]*isExplicitLocalAssetLocator/,
    'Expected MagicCut resource-panel local asset detection to reuse canonical asset-center locator helpers.',
  );
  assert.match(
    filmServiceSource,
    /metadata\.storageMode[\s\S]*isExplicitLocalAssetLocator[\s\S]*isManagedAssetLocator[\s\S]*return 'hybrid'/,
    'Expected Film project graph storage-mode inference to derive from canonical asset metadata and locator semantics instead of raw render URLs only.',
  );
  assert.match(
    assetUrlResolverSource,
    /isManagedAssetLocator\(value\)[\s\S]*isExplicitLocalAssetLocator\(value\)[\s\S]*isLocalFilePath\(value\)[\s\S]*isRenderableAssetUrl\(value\)[\s\S]*isManagedAssetLocator\(directLocator\)[\s\S]*isExplicitLocalAssetLocator\(directLocator\)[\s\S]*isLocalFilePath\(directLocator\)/,
    'Expected asset URL resolution to reuse canonical locator and renderable-URL helpers instead of hardcoded protocol parsing.',
  );
  assert.match(
    assetCenterServiceSource,
    /protocol:\s*isDesktopAssetLocator\(locator\)\s*\?\s*'desktop'\s*:\s*'file'[\s\S]*isManagedAssetLocator\(candidate\)[\s\S]*isDesktopAssetLocator\(candidate\)[\s\S]*isFileAssetLocator\(candidate\)[\s\S]*isLocalFilePath\(candidate\)/,
    'Expected asset-center service to resolve local asset locators through canonical asset-center locator helpers and protocol mapping.',
  );
  assert.match(
    defaultAssetUrlResolverSource,
    /isExplicitLocalAssetLocator[\s\S]*stripExplicitLocalAssetLocatorProtocol/,
    'Expected the default asset URL resolver to normalize explicit local locators such as file:// and desktop:// before runtime URL conversion.',
  );
  assert.match(
    useAssetUrlSource,
    /useRenderableAssetUrl[\s\S]*resolveRenderableAssetSourceUrl[\s\S]*resolveAssetUrlByAssetIdFirst/,
    'Expected magic-studio-assets useAssetUrl to compose the low-level renderable hook with the canonical assetId-first resolver.',
  );
  assert.doesNotMatch(
    useAssetUrlSource,
    /useState,\s*useEffect|useEffect,\s*useState/,
    'Expected magic-studio-assets useAssetUrl to delegate hook state ownership to the commons renderable hook.',
  );
  assert.match(
    commonsUseAssetUrlSource,
    /export const useRenderableAssetUrl/,
    'Expected commons hooks to expose the low-level renderable asset URL hook.',
  );
  assert.match(
    commonsUseAssetUrlSource,
    /isRenderableAssetUrl as isCanonicalRenderableAssetUrl[\s\S]*@sdkwork\/magic-studio-types\/asset-reference/,
    'Expected commons hooks to reuse the canonical asset-reference classifier from magic-studio-types.',
  );
  assert.match(
    commonsUseAssetUrlSource,
    /sanitizeResolvedAssetUrl[\s\S]*isCanonicalRenderableAssetUrl/,
    'Expected commons hooks to reject unresolved locators by delegating to the canonical renderable URL classifier.',
  );
  assert.doesNotMatch(
    commonsUseAssetUrlSource,
    /INTERNAL_ASSET_PROTOCOL|FILE_ASSET_PROTOCOL|DESKTOP_ASSET_PROTOCOL/,
    'Expected commons hooks to stop owning asset protocol constants locally.',
  );
  assert.match(
    commonsHooksIndexSource,
    /useRenderableAssetUrl/,
    'Expected magic-studio-commons hooks to expose the low-level renderable asset URL hook.',
  );
  assert.match(
    commonsHooksIndexSource,
    /resolveRenderableAssetSourceUrl/,
    'Expected magic-studio-commons hooks to expose the low-level renderable asset URL resolver.',
  );
  assert.doesNotMatch(
    commonsHooksIndexSource,
    /export\s*\{[^}]*useAssetUrl[^}]*\}/,
    'Expected magic-studio-commons hooks to stop exporting the legacy useAssetUrl name.',
  );
  assert.doesNotMatch(
    commonsIndexSource,
    /useRenderableAssetUrl|useAssetUrl/,
    'Expected magic-studio-commons root exports to avoid owning asset URL hook authority.',
  );
  assert.match(
    generationHistoryAssetResolverSource,
    /resolveRuntimeMagicStudioAssetUrl/,
    'Expected generation-history to resolve managed and explicit local locators through the shared runtime asset URL helper.',
  );
  assert.doesNotMatch(
    generationHistoryAssetResolverSource,
    /FILE_ASSET_PROTOCOL|DESKTOP_ASSET_PROTOCOL|stripExplicitLocalAssetLocatorProtocol/,
    'Expected generation-history to delegate explicit local locator normalization to magic-studio-core storage helpers.',
  );
  assert.match(
    generationItemSource,
    /@sdkwork\/magic-studio-commons\/hooks[\s\S]*useRenderableAssetUrl[\s\S]*resolveGenerationHistoryAssetUrl[\s\S]*resolver:\s*resolveGenerationHistoryAssetUrl/,
    'Expected generation-history item cards to opt into the runtime-backed canonical asset resolver.',
  );
  assert.doesNotMatch(
    generationItemSource,
    /import\s*\{[^}]*useAssetUrl[^}]*\}\s*from '@sdkwork\/magic-studio-commons'/,
    'Expected generation-history items to stop importing useAssetUrl from magic-studio-commons root.',
  );
  assert.match(
    generationPreviewSource,
    /@sdkwork\/magic-studio-commons\/hooks[\s\S]*useRenderableAssetUrl[\s\S]*resolveGenerationHistoryAssetUrl[\s\S]*resolver:\s*resolveGenerationHistoryAssetUrl/,
    'Expected generation-history preview surfaces to opt into the runtime-backed canonical asset resolver.',
  );
  assert.doesNotMatch(
    generationPreviewSource,
    /import\s*\{[^}]*useAssetUrl[^}]*\}\s*from '@sdkwork\/magic-studio-commons'/,
    'Expected generation-history previews to stop importing useAssetUrl from magic-studio-commons root.',
  );
  assert.match(
    commonsUploadTypesSource,
    /assetUrlResolver\?:\s*UseRenderableAssetUrlOptions\['resolver'\]/,
    'Expected commons upload props to expose an explicit assetUrlResolver injection point.',
  );
  for (const [label, source] of [
    ['image upload', imageUploadSource],
    ['video upload', videoUploadSource],
    ['audio upload', audioUploadSource],
    ['file upload', fileUploadSource],
  ]) {
    assert.match(
      source,
      /useRenderableAssetUrl\(props\.value,\s*\{[\s\S]*resolver:\s*props\.assetUrlResolver/,
      `Expected ${label} to resolve previews through the explicit assetUrlResolver boundary.`,
    );
  }
  assert.match(
    canonicalUploadAssetResolverSource,
    /resolveAssetUrlByAssetIdFirst/,
    'Expected upload resolver helper to delegate to the canonical assetId-first resolver.',
  );
  const canonicalAssetHookPackageRoots = [
    path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-assets', 'src'),
    path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-canvas', 'src'),
    path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-magiccut', 'src'),
    path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-notes', 'src'),
    path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-image', 'src'),
    path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-film', 'src'),
  ];
  const legacyCommonsAssetHookOffenders = [];
  for (const rootDir of canonicalAssetHookPackageRoots) {
    for (const sourcePath of collectBoundarySourceFiles(rootDir)) {
      const source = fs.readFileSync(sourcePath, 'utf8');
      if (/import\s*\{[^}]*useAssetUrl[^}]*\}\s*from '@sdkwork\/magic-studio-commons'/.test(source)) {
        legacyCommonsAssetHookOffenders.push(path.relative(workspaceRoot, sourcePath));
      }
    }
  }
  assert.deepEqual(
    legacyCommonsAssetHookOffenders,
    [],
    `Expected asset-aware packages to consume useAssetUrl from magic-studio-assets instead of magic-studio-commons.\n${legacyCommonsAssetHookOffenders.join('\n')}`,
  );
  for (const [label, source, expectedImport] of [
    ['canvas video node', canvasVideoNodeSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['magiccut video node', magicCutVideoNodeSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['notes image node', notesImageNodeSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['notes media node', notesMediaNodeSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['notes file attachment node', notesFileAttachmentNodeSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['notes mini program node', notesMiniProgramNodeSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['image canvas editor', imageCanvasEditorSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['image grid editor', imageGridEditorSource, /from '@sdkwork\/magic-studio-assets\/hooks'/],
    ['attachment grid', attachmentGridSource, /from '\.\.\/\.\.\/\.\.\/hooks\/useAssetUrl'/],
  ]) {
    assert.match(
      source,
      expectedImport,
      `Expected ${label} to consume the canonical magic-studio-assets useAssetUrl hook.`,
    );
    assert.doesNotMatch(
      source,
      /import\s*\{[^}]*useAssetUrl[^}]*\}\s*from '@sdkwork\/magic-studio-commons'/,
      `Expected ${label} to stop importing useAssetUrl from magic-studio-commons.`,
    );
  }
  assert.match(
    filePreviewModalSource,
    /const previewSource = item\.previewUrl \|\| resolvedPath[\s\S]*assetService\.resolveAssetUrl\(\{ path: previewSource \}\)/,
    'Expected drive file preview resolution to route previewUrl and path through the canonical asset resolver.',
  );
  assert.doesNotMatch(
    filePreviewModalSource,
    /setUrl\(item\.previewUrl\)/,
    'Expected drive file preview resolution to stop trusting previewUrl as a directly renderable URL.',
  );
  assert.match(
    chooseAssetSource,
    /isRenderableAssetUrl[\s\S]*loading && !displayUrl[\s\S]*const canRenderImagePreview[\s\S]*isRenderableAssetUrl\(finalSrc\)/,
    'Expected ChooseAsset preview rendering to wait for canonical resolution and only render image previews for renderable URLs.',
  );
  assert.doesNotMatch(
    chooseAssetSource,
    /finalSrc\.startsWith\('assets:\/\/'\)/,
    'Expected ChooseAsset preview rendering to stop treating assets:// locators as directly renderable image URLs.',
  );
  assert.match(
    magicCutResourceUtilsSource,
    /isManagedAssetLocator[\s\S]*isExplicitLocalAssetLocator[\s\S]*requiresCanonicalAssetUrlResolution/,
    'Expected MagicCut resource utilities to treat managed and explicit local locators as canonical resolver inputs.',
  );
  assert.doesNotMatch(
    magicCutResourceUtilsSource,
    /runtime\.fileSystem\.convertFileSrc|convertFileSrc\(candidate\)/,
    'Expected MagicCut resource utilities to stop converting raw locator/path inputs directly with runtime.fileSystem.convertFileSrc.',
  );
  assert.match(
    magicCutResourceManagerSource,
    /requiresCanonicalAssetUrlResolution[\s\S]*resolveAssetUrlByAssetIdFirst\(resource\)/,
    'Expected MagicCut renderer resource resolution to route unresolved locator/path inputs through the canonical asset resolver.',
  );
  assert.doesNotMatch(
    magicCutResourceManagerSource,
    /url\.startsWith\('assets:\/\/'\)/,
    'Expected MagicCut renderer resource resolution to stop special-casing assets:// ahead of the canonical resolver.',
  );
  assert.match(
    magicCutExportModalSource,
    /useAssetUrl[\s\S]*resolveAssetUrlByAssetIdFirst/,
    'Expected MagicCut export preview cover resolution to reuse the shared asset URL resolver path.',
  );
  assert.doesNotMatch(
    magicCutExportModalSource,
    /runtime\.fileSystem\.convertFileSrc\(url\)/,
    'Expected MagicCut export preview cover resolution to stop converting locator strings directly with runtime.fileSystem.convertFileSrc.',
  );
  assert.match(
    magicCutStoreSource,
    /isManagedAssetLocator[\s\S]*isExplicitLocalAssetLocator[\s\S]*resolveLocatorUrl\(source\)/,
    'Expected MagicCut resource import flows to resolve managed and explicit local locators through the canonical asset-center resolver.',
  );
  assert.match(
    driveBusinessServiceSource,
    /assetService\.resolveAssetUrl\(\{ path: directUrl \}\)[\s\S]*assetService\.resolveAssetUrl\(\{ path: detailUrl \}\)/,
    'Expected drive download resolution to canonicalize preview and detail resource URLs before handing them to transport layers.',
  );
  assert.doesNotMatch(
    driveBusinessServiceSource,
    /url:\s*directUrl/,
    'Expected drive download resolution to stop returning unresolved previewUrl locators directly.',
  );
  assert.doesNotMatch(
    driveBusinessServiceSource,
    /url:\s*detailUrl/,
    'Expected drive download resolution to stop returning unresolved detail resource locators directly.',
  );
  assert.match(
    canvasExportServiceSource,
    /isManagedAssetLocator\(res\.path\)[\s\S]*isExplicitLocalAssetLocator\(res\.path\)[\s\S]*isLocalFilePath\(res\.path\)[\s\S]*res\.url = ''/,
    'Expected canvas export cleanup to clear stale URLs when canonical managed, explicit local, or filesystem paths become authoritative.',
  );
  assert.doesNotMatch(
    canvasExportServiceSource,
    /res\.path && res\.path\.startsWith\('assets:\/\/'\)/,
    'Expected canvas export cleanup to stop treating assets:// as the only path authority.',
  );
  for (const [label, source] of [
    ['upload image generation modal', uploadImageGenerationModalSource],
    ['upload video generation modal', uploadVideoGenerationModalSource],
    ['upload music generation modal', uploadMusicGenerationModalSource],
    ['upload audio generation modal', uploadAudioGenerationModalSource],
    ['upload character generation modal', uploadCharacterGenerationModalSource],
  ]) {
    assert.match(
      source,
      /assetUrlResolver=\{resolveCanonicalUploadAssetUrl\}/,
      `Expected ${label} to pass the canonical upload asset resolver into commons upload previews.`,
    );
  }
  assert.match(
    uploadPreviewModalSource,
    /useAssetUrl\(data\?\.url\)/,
    'Expected upload preview modal rendering to resolve locator-backed preview URLs through the canonical asset hook.',
  );
  assert.match(
    generationChatWindowSource,
    /const previewSource = toResolverAssetSource[\s\S]*useAssetUrl\(previewSource,\s*\{\s*resolver:\s*resolveAssetUrlByAssetIdFirst\s*\}\)/,
    'Expected generation chat result previews to resolve generated artifacts through explicit canonical resolver sources.',
  );
  assert.match(
    generationChatWindowSource,
    /useAssetUrl\(source,\s*\{\s*resolver:\s*resolveAssetUrlByAssetIdFirst\s*\}\)/,
    'Expected generation chat reference images to resolve locator-backed inputs through the canonical asset resolver.',
  );
  assert.doesNotMatch(
    imageGeneratorModalContentSource,
    /if \(!url \|\| url\.startsWith\('assets:\/\/'\)\)/,
    'Expected image generator save-to-assets flow to stop rejecting asset-backed selections before persistence.',
  );
  assert.match(
    imageGeneratorModalContentSource,
    /persistGeneratedSelectionAsset\(\{/,
    'Expected image generator save-to-assets flow to delegate canonical persistence to persistGeneratedSelectionAsset.',
  );
  assert.match(
    saveTemplateModalSource,
    /assetUrlResolver=\{resolveAssetUrlByAssetIdFirst\}/,
    'Expected MagicCut template cover upload previews to reuse the canonical asset resolver.',
  );
  assert.match(
    magicCutTrackCoverImportSource,
    /isCanonicalMagicStudioAssetReference as isStableTrackCoverSource[\s\S]*isManagedAssetLocator\(candidate\)[\s\S]*isFileAssetLocator\(candidate\)[\s\S]*isDesktopAssetLocator\(candidate\)/,
    'Expected MagicCut track cover import to preserve stable managed or explicit local cover sources through canonical locator helpers.',
  );
  assert.match(
    magicCutTrackHeaderSource,
    /useAssetUrl\(track\.coverImage \|\| null,\s*\{\s*resolver:\s*resolveAssetUrlByAssetIdFirst\s*\}\)/,
    'Expected MagicCut track header cover previews to resolve persisted cover sources through the canonical asset resolver.',
  );
  assert.doesNotMatch(
    magicCutTrackHeaderSource,
    /<img src=\{track\.coverImage\}/,
    'Expected MagicCut track header to stop rendering persisted cover sources as raw img URLs.',
  );
  assert.match(
    unifiedHostApiStandardSource,
    /desktop-fs[\s\S]*desktop:\/\/[\s\S]*useAssetUrl[\s\S]*resolveAssetUrlByAssetIdFirst/,
    'Expected the unified host standard to document the neutral desktop asset vocabulary.',
  );
  assert.match(
    platformRuntimeCapabilityMatrixSource,
    /desktop-fs[\s\S]*desktop:\/\//,
    'Expected the runtime capability matrix to document the neutral desktop asset vocabulary.',
  );
});
