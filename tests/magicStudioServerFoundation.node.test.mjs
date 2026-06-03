import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
const workspaceRoot = process.cwd();

const packageJsonPath = path.join(workspaceRoot, 'package.json');
const typesIndexPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'src',
  'index.ts',
);
const typesPackageJsonPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'package.json',
);
const typesTsConfigPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'tsconfig.json',
);
const hostCoreIndexPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-core',
  'src',
  'index.ts',
);
const hostCoreTsConfigPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-core',
  'tsconfig.json',
);
const distributionIndexPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-distribution',
  'src',
  'index.ts',
);
const distributionPackageJsonPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-distribution',
  'package.json',
);
const distributionTsConfigPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-distribution',
  'tsconfig.json',
);
const serverIndexPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'index.ts',
);
const serverCargoPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src-host',
  'Cargo.toml',
);
const serverTsConfigPath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'tsconfig.json',
);
const foundationPaths = [
  'packages/sdkwork-magic-studio-host-types/package.json',
  'packages/sdkwork-magic-studio-host-types/src/host.ts',
  'packages/sdkwork-magic-studio-host-types/src/index.ts',
  'packages/sdkwork-magic-studio-host-types/src/plugin-manifest.ts',
  'packages/sdkwork-magic-studio-host-types/src/server-api.ts',
  'packages/sdkwork-magic-studio-host-types/src/server-assets.ts',
  'packages/sdkwork-magic-studio-host-types/tsconfig.json',
  'packages/sdkwork-magic-studio-host-core/package.json',
  'packages/sdkwork-magic-studio-host-core/src/descriptor.ts',
  'packages/sdkwork-magic-studio-host-core/src/discovery.ts',
  'packages/sdkwork-magic-studio-host-core/src/index.ts',
  'packages/sdkwork-magic-studio-host-core/tsconfig.json',
  'packages/sdkwork-magic-studio-distribution/package.json',
  'packages/sdkwork-magic-studio-distribution/src/index.ts',
  'packages/sdkwork-magic-studio-distribution/tsconfig.json',
  'packages/sdkwork-magic-studio-server/package.json',
  'packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json',
  'packages/sdkwork-magic-studio-server/src/client.ts',
  'packages/sdkwork-magic-studio-server/src/contract.ts',
  'packages/sdkwork-magic-studio-server/src/index.ts',
  'packages/sdkwork-magic-studio-server/tsconfig.json',
  'packages/sdkwork-magic-studio-server/src-host/Cargo.toml',
  'packages/sdkwork-magic-studio-server/src-host/src/config.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/contract.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/lib.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/main.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/response.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/state.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/routes/admin.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/routes/app/assets.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/routes/docs.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/routes/mod.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/app_storage.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/assets.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/compression.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/database.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/filesystem.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/jobs.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/media.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/migration.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/mod.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/policy.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/system.rs',
  'packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs',
];
const serverBuildScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-magic-studio-server-build.mjs',
);

test('magic studio server runtime foundation exposes the required workspace skeleton', async () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const typesPackageJson = JSON.parse(fs.readFileSync(typesPackageJsonPath, 'utf8'));
  const typesTsConfig = JSON.parse(fs.readFileSync(typesTsConfigPath, 'utf8'));
  const hostCoreTsConfig = JSON.parse(fs.readFileSync(hostCoreTsConfigPath, 'utf8'));
  const distributionPackageJson = JSON.parse(
    fs.readFileSync(distributionPackageJsonPath, 'utf8'),
  );
  const distributionTsConfig = JSON.parse(
    fs.readFileSync(distributionTsConfigPath, 'utf8'),
  );
  const serverTsConfig = JSON.parse(fs.readFileSync(serverTsConfigPath, 'utf8'));

  for (const scriptName of ['server:dev', 'server:build', 'check:server']) {
    assert.ok(
      packageJson.scripts?.[scriptName],
      `Expected root package.json to define "${scriptName}".`,
    );
  }

  for (const requiredPath of [
    typesIndexPath,
    hostCoreIndexPath,
    distributionIndexPath,
    serverIndexPath,
    serverCargoPath,
    serverBuildScriptPath,
  ]) {
    assert.equal(
      fs.existsSync(requiredPath),
      true,
      `Expected required server foundation file to exist: ${path.relative(workspaceRoot, requiredPath)}`,
    );
  }

  for (const requiredPath of foundationPaths) {
    const absolutePath = path.join(workspaceRoot, requiredPath);
    assert.equal(
      fs.existsSync(absolutePath),
      true,
      `Expected required server host source to exist in the workspace: ${requiredPath}`,
    );
  }

  const typesSource = fs.readFileSync(typesIndexPath, 'utf8');
  const hostCoreSource = fs.readFileSync(hostCoreIndexPath, 'utf8');
  const distributionSource = fs.readFileSync(distributionIndexPath, 'utf8');
  const serverSource = fs.readFileSync(serverIndexPath, 'utf8');

  assert.doesNotMatch(
    typesSource,
    /\bMAGIC_STUDIO_SERVER_API_VERSION\b|\bMAGIC_STUDIO_API_SURFACES\b/,
    'Expected canonical server surface/version authority to stay out of @sdkwork/magic-studio-host-types.',
  );
  assert.doesNotMatch(
    typesSource,
    /MAGIC_STUDIO_API_PREFIXES|\/api\/(core|app|admin)\/v1/,
    'Expected canonical API path ownership to stay out of @sdkwork/magic-studio-host-types.',
  );
  assert.equal(
    typesPackageJson.name,
    '@sdkwork/magic-studio-host-types',
    'Expected the canonical host/runtime schema package to expose the @sdkwork/magic-studio-host-types package identity.',
  );
  assert.equal(
    typesTsConfig.compilerOptions?.strict,
    true,
    'Expected the canonical schema package tsconfig to enforce strict typing.',
  );
  assert.match(hostCoreSource, /MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST/);
  assert.match(hostCoreSource, /MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT/);
  assert.doesNotMatch(
    hostCoreSource,
    /MAGIC_STUDIO_DEFAULT_LOCAL_(?:HEALTH|DOCS|OPENAPI|ROUTE_CATALOG|RUNTIME_SUMMARY)_PATH|createMagicStudioHostDescriptor|resolveMagicStudioHostDescriptor/,
    'Expected host-core to stay limited to network discovery and avoid owning canonical discovery path authority.',
  );
  assert.match(distributionSource, /MAGIC_STUDIO_RELEASE_FAMILIES/);
  assert.equal(
    distributionPackageJson.name,
    '@sdkwork/magic-studio-distribution',
    'Expected the canonical distribution package to expose the @sdkwork/magic-studio-distribution package identity.',
  );
  assert.equal(
    distributionTsConfig.compilerOptions?.strict,
    true,
    'Expected the canonical distribution package tsconfig to enforce strict typing.',
  );
  assert.match(serverSource, /MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH/);
  assert.match(
    serverSource,
    /\bMAGIC_STUDIO_SERVER_API_VERSION\b/,
    'Expected the server contract facade to own the canonical API version constant.',
  );
  assert.match(
    serverSource,
    /\bMAGIC_STUDIO_SERVER_API_SURFACES\b/,
    'Expected the server contract facade to own the canonical surface inventory constant.',
  );
  assert.match(
    serverSource,
    /MAGIC_STUDIO_SERVER_SURFACE_BASE_PATHS/,
    'Expected the server contract facade to own canonical surface base-path constants.',
  );
  assert.match(
    serverSource,
    /createMagicStudioServerHostDescriptor[\s\S]*resolveMagicStudioServerHostDescriptor/,
    'Expected the server package to own canonical host descriptor construction and resolution.',
  );
  assert.match(
    serverSource,
    /\bMagicStudioServerHostResolutionInput\b/,
    'Expected the server package to own the canonical public host resolution input model.',
  );
  assert.doesNotMatch(
    serverSource,
    /\bMagicStudioHostDiscoveryInput\b/,
    'Expected the server package facade to avoid leaking host-core discovery types into its public API.',
  );
  assert.deepEqual(
    hostCoreTsConfig.compilerOptions?.types,
    ['node'],
    'Expected host-core tsconfig to declare Node type coverage for its test-bearing package boundary.',
  );
  assert.deepEqual(
    serverTsConfig.compilerOptions?.types,
    ['node'],
    'Expected server tsconfig to declare Node type coverage for its package and tests.',
  );
  assert.deepEqual(
    serverTsConfig.compilerOptions?.lib,
    ['ES2022', 'DOM', 'DOM.Iterable'],
    'Expected server tsconfig to declare DOM libs for fetch-based client compilation.',
  );
});
