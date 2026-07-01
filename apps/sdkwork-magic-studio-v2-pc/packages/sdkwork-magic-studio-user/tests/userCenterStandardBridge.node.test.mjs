import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const packageRoot = path.resolve(import.meta.dirname, '..');
const projectRoot = path.resolve(packageRoot, '..', '..');
const bridgePath = path.join(packageRoot, 'src', 'services', 'userCenterStandard.ts');
const validationPath = path.join(packageRoot, 'src', 'services', 'validation.ts');
const runtimePath = path.join(packageRoot, 'src', 'services', 'userCenterRuntime.ts');
const indexPath = path.join(packageRoot, 'src', 'services', 'index.ts');
const serverIndexPath = path.join(
  projectRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'index.ts',
);
const rootEnvExampleSource = fs.readFileSync(path.join(projectRoot, '.env.example'), 'utf8');
const rootEnvDevelopmentSource = fs.readFileSync(path.join(projectRoot, '.env.development'), 'utf8');
const rootEnvTestSource = fs.readFileSync(path.join(projectRoot, '.env.test'), 'utf8');
const rootEnvStagingSource = fs.readFileSync(path.join(projectRoot, '.env.staging'), 'utf8');
const rootEnvProductionSource = fs.readFileSync(path.join(projectRoot, '.env.production'), 'utf8');
const sdkworkAppbaseIdentityRoot = path.join(
  projectRoot,
  '.sdk-git-sources',
  'sdkwork-appbase',
  'packages',
  'pc-react',
  'identity',
);
const sdkworkAppbasePackageEntries = new Map([
  [
    '@sdkwork/user-center-core-pc-react',
    path.join(
      sdkworkAppbaseIdentityRoot,
      'sdkwork-user-center-core-pc-react',
      'src',
      'index.ts',
    ),
  ],
  [
    '@sdkwork/user-center-validation-pc-react',
    path.join(
      sdkworkAppbaseIdentityRoot,
      'sdkwork-user-center-validation-pc-react',
      'src',
      'index.ts',
    ),
  ],
]);

registerHooks({
  resolve(specifier, context, defaultResolve) {
    const sdkworkAppbaseEntry = sdkworkAppbasePackageEntries.get(specifier);
    if (sdkworkAppbaseEntry) {
      return {
        shortCircuit: true,
        url: pathToFileURL(sdkworkAppbaseEntry).href,
      };
    }

    return defaultResolve(specifier, context, defaultResolve);
  },
});

const bridge = await import(pathToFileURL(bridgePath).href);
const serverContract = await import(pathToFileURL(serverIndexPath).href);

function runtimeResponseDouble(payload, { headers = {}, ok = true, status = 200 } = {}) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    headers: {
      get(name) {
        return normalizedHeaders.get(name.toLowerCase()) ?? null;
      },
    },
    json: async () => payload,
    ok,
    status,
  };
}

const DEFAULT_AUTH_TOKEN_HEADERS = {
  accessTokenHeaderName: 'Access-Token',
  authorizationHeaderName: 'Authorization',
  authorizationScheme: 'Bearer',
  refreshTokenHeaderName: 'Refresh-Token',
  sessionHeaderName: 'x-sdkwork-user-center-session-id',
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

test('magic-studio user package exposes canonical user-center server and validation bridges', () => {
  const bridgeSource = fs.readFileSync(bridgePath, 'utf8');
  const indexSource = fs.readFileSync(indexPath, 'utf8');

  assert.match(bridgeSource, /createUserCenterServerPluginDefinition/u);
  assert.match(bridgeSource, /createUserCenterServerValidationPluginDefinition/u);
  assert.match(indexSource, /userCenterStandard/u);
  assert.match(indexSource, /validation/u);
  assert.match(indexSource, /userCenterRuntime/u);

  const localServerPlugin = bridge.createMagicStudioUserCenterServerPluginDefinition();
  assert.equal(localServerPlugin.capability, 'user-center-server');
  assert.equal(localServerPlugin.server.authority.activeIntegrationKind, 'builtin-local');

  const remoteServerPlugin = bridge.createMagicStudioUserCenterServerPluginDefinition({
    mode: 'external-hub',
    provider: {
      baseUrl: 'https://identity.vendor.local/magic',
      kind: 'external-user-center',
      providerKey: 'magic-sso',
    },
  });
  assert.equal(
    remoteServerPlugin.server.authority.activeIntegrationKind,
    'external-user-center',
  );
  assert.equal(
    remoteServerPlugin.server.deployment.externalUserCenter.providerKey,
    'magic-sso',
  );

  const serverValidation = bridge.createMagicStudioUserCenterServerValidationPluginDefinition({
    mode: 'app-api-hub',
    provider: {
      baseUrl: 'https://app-api.sdkwork.local/magic',
      kind: 'sdkwork-cloud-app-api',
      providerKey: 'magic-app-api',
    },
  });
  assert.equal(serverValidation.capability, 'user-center-server-validation');
  assert.equal(serverValidation.dependency.capability, 'user-center-server');
  assert.equal(serverValidation.middleware.handshake.required, true);
});

test('magic-studio user package exposes canonical client user-center, validation, and deployment bridges', async () => {
  assert.equal(fs.existsSync(validationPath), true);
  assert.equal(fs.existsSync(runtimePath), true);

  const bridgeSource = fs.readFileSync(bridgePath, 'utf8');
  const validationSource = fs.readFileSync(validationPath, 'utf8');
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');

  assert.match(bridgeSource, /createUserCenterPluginDefinition/u);
  assert.match(bridgeSource, /createUserCenterBridgeConfig/u);
  assert.match(bridgeSource, /@sdkwork\/magic-studio-server/u);
  assert.doesNotMatch(
    bridgeSource,
    /['"]\/api\/(?:core|app|admin)\/v1/u,
    'Expected user-center bridge to consume canonical API paths from @sdkwork/magic-studio-server instead of hardcoding route literals.',
  );
  assert.match(validationSource, /createUserCenterValidationPluginDefinition/u);
  assert.match(validationSource, /from '\.\/userCenterStandard\.ts'/u);
  assert.match(runtimeSource, /createDefaultUserCenterConfig/u);
  assert.match(runtimeSource, /createUserCenterRuntimeClient/u);
  assert.match(runtimeSource, /from '\.\/userCenterStandard\.ts'/u);
  assert.match(runtimeSource, /from '\.\/validation\.ts'/u);

  const validation = await import(pathToFileURL(validationPath).href);
  const localPlugin = bridge.createMagicStudioUserCenterPluginDefinition();
  assert.equal(localPlugin.capability, 'user-center');
  assert.equal(localPlugin.bridgeConfig.namespace, 'magic-studio');
  assert.equal(
    bridge.MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH,
    serverContract.MAGIC_STUDIO_SERVER_APP_USER_CENTER_LOCAL_API_BASE_PATH,
  );
  assert.equal(
    localPlugin.bridgeConfig.integration.builtinLocal.localApiBasePath,
    serverContract.MAGIC_STUDIO_SERVER_APP_USER_CENTER_LOCAL_API_BASE_PATH,
  );
  assert.deepEqual(localPlugin.capabilities, ['user']);
  assert.equal(localPlugin.integration.activeKind, 'builtin-local');

  const externalPlugin = bridge.createMagicStudioUserCenterPluginDefinition({
    mode: 'external-hub',
    provider: {
      baseUrl: 'https://identity.vendor.local/magic',
      kind: 'external-user-center',
      providerKey: 'magic-sso',
    },
  });
  assert.equal(externalPlugin.bridgeConfig.mode, 'external-hub');
  assert.equal(externalPlugin.bridgeConfig.integration.activeKind, 'external-user-center');
  assert.equal(externalPlugin.deployment.externalUserCenter?.providerKey, 'magic-sso');
  assert.equal(externalPlugin.clientDeployment.activeKind, 'external-user-center');
  assert.equal(externalPlugin.clientDeployment.externalUserCenter?.providerKey, 'magic-sso');
  assert.deepEqual(
    externalPlugin.clientDeployment.externalUserCenter?.artifacts.map((artifact) => artifact.fileName),
    [
      'magic-studio.external-user-center.runtime.env.example',
      'magic-studio.external-user-center.gateway.env.example',
    ],
  );
  assert.deepEqual(
    externalPlugin.clientDeployment.externalUserCenter?.gatewayEnvArtifact.variables
      .filter((entry) => entry.required)
      .map((entry) => entry.envName),
    [
      'MAGIC_STUDIO_USER_CENTER_EXTERNAL_BASE_URL',
      'MAGIC_STUDIO_USER_CENTER_SECRET_ID',
      'MAGIC_STUDIO_USER_CENTER_SHARED_SECRET',
    ],
  );

  const pluginValidation =
    validation.createMagicStudioUserCenterValidationPluginDefinition({
      mode: 'external-hub',
      provider: {
        baseUrl: 'https://identity.vendor.local/magic',
        kind: 'external-user-center',
        providerKey: 'magic-sso',
      },
    });
  assert.equal(pluginValidation.capability, 'user-center-validation');
  assert.equal(pluginValidation.dependency.capability, 'user-center');
  assert.equal(pluginValidation.dependency.providerKey, 'magic-sso');
});

test('magic-studio user package runtime bridge resolves local, app-api, and external user-center modes and fails closed on validation drift', async () => {
  const runtime = await import(pathToFileURL(runtimePath).href);
  const validation = await import(pathToFileURL(validationPath).href);
  const previousWindow = globalThis.window;

  try {
    globalThis.window = {
      __MAGIC_STUDIO_USER_CENTER_MODE__: ' sdkwork-cloud-app-api ',
      __MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL__: ' https://app-api.sdkwork.local/magic/ ',
      __MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY__: ' Magic App API ',
      __MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH__: ' /gateway/user-center ',
    };

    const appApiConfig = runtime.createMagicStudioCanonicalUserCenterConfig();
    assert.equal(appApiConfig.mode, 'app-api-hub');
    assert.equal(appApiConfig.provider.kind, 'sdkwork-cloud-app-api');
    assert.equal(appApiConfig.provider.baseUrl, 'https://app-api.sdkwork.local/magic');
    assert.equal(appApiConfig.provider.providerKey, 'magic-app-api');

    globalThis.window = {
      __MAGIC_STUDIO_USER_CENTER_MODE__: ' external-user-center ',
      __MAGIC_STUDIO_USER_CENTER_EXTERNAL_BASE_URL__: ' https://identity.vendor.local/magic-runtime/ ',
      __MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY__: ' Magic Runtime SSO ',
      __MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH__: ' /external/user-center ',
    };

    const externalConfig = runtime.createMagicStudioCanonicalUserCenterConfig();
    assert.equal(externalConfig.mode, 'external-hub');
    assert.equal(externalConfig.provider.kind, 'external-user-center');
    assert.equal(externalConfig.provider.baseUrl, 'https://identity.vendor.local/magic-runtime');
    assert.equal(externalConfig.provider.providerKey, 'magic-runtime-sso');
    assert.equal(externalConfig.integration.activeKind, 'external-user-center');
    assert.equal(externalConfig.auth.mode, 'upstream-external-token-bridge');
    assert.equal(
      externalConfig.integration.builtinLocal.localApiBasePath,
      '/external/user-center',
    );

    globalThis.window = {
      __MAGIC_STUDIO_USER_CENTER_MODE__: ' builtin-local ',
      __MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY__: ' magic-local-window ',
      __MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH__: ' /window/user-center ',
    };

    const localConfig = runtime.createMagicStudioCanonicalUserCenterConfig();
    assert.equal(localConfig.mode, 'local-native');
    assert.equal(localConfig.provider.kind, 'builtin-local');
    assert.equal(localConfig.provider.providerKey, 'magic-local-window');
    assert.equal(
      localConfig.integration.builtinLocal.localApiBasePath,
      '/window/user-center',
    );
  } finally {
    globalThis.window = previousWindow;
  }

  let requestCount = 0;
  const client = runtime.createMagicStudioUserCenterRuntimeClient(
    {
      mode: 'app-api-hub',
      provider: {
        baseUrl: 'https://app-api.sdkwork.local/magic',
        kind: 'sdkwork-cloud-app-api',
        providerKey: 'magic-app-api',
      },
    },
    {
      fetch: async () => {
        requestCount += 1;
        return runtimeResponseDouble({
          code: '2000',
          data: {
            ok: true,
          },
        });
      },
      validationInteropContract: {
        ...validation.createMagicStudioUserCenterValidationInteropContract({
          mode: 'app-api-hub',
          provider: {
            baseUrl: 'https://app-api.sdkwork.local/magic',
            kind: 'sdkwork-cloud-app-api',
            providerKey: 'magic-app-api',
          },
        }),
        tokenHeaders: {
          ...DEFAULT_AUTH_TOKEN_HEADERS,
          authorizationHeaderName: 'Auth-Token',
        },
      },
    },
  );

  await assert.rejects(() => client.getProfile(), /tokenHeaders\.authorizationHeaderName/u);
  assert.equal(requestCount, 0);
});

test('magic-studio root env files pin the canonical public user-center runtime contract without leaking private bridge authority', () => {
  for (const [label, source] of [
    ['.env.example', rootEnvExampleSource],
    ['.env.development', rootEnvDevelopmentSource],
    ['.env.test', rootEnvTestSource],
    ['.env.staging', rootEnvStagingSource],
    ['.env.production', rootEnvProductionSource],
  ]) {
    assert.match(
      source,
      /VITE_MAGIC_STUDIO_USER_CENTER_MODE=sdkwork-cloud-app-api/u,
      `${label} must pin the canonical cloud user-center runtime mode.`,
    );
    assert.match(
      source,
      /VITE_MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY=magic-studio-app-api/u,
      `${label} must pin the canonical cloud user-center provider key.`,
    );
    assert.match(
      source,
      new RegExp(
        `VITE_MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH=${escapeRegExp(
          serverContract.MAGIC_STUDIO_SERVER_APP_USER_CENTER_LOCAL_API_BASE_PATH,
        )}`,
        'u',
      ),
      `${label} must pin the canonical local fallback API base path.`,
    );
    assert.doesNotMatch(
      source,
      /VITE_MAGIC_STUDIO_USER_CENTER_(?:APP_API_BASE_URL|EXTERNAL_BASE_URL|SECRET_ID|SHARED_SECRET)=/u,
      `${label} must not publish private bridge authority or secret env vars through public Vite runtime env.`,
    );
  }

  assert.match(
    rootEnvExampleSource,
    /MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL/u,
    '.env.example must document the private gateway env name for sdkwork-cloud-app-api deployments.',
  );
  assert.match(
    rootEnvExampleSource,
    /MAGIC_STUDIO_USER_CENTER_SECRET_ID/u,
    '.env.example must document the private gateway secret-id env name.',
  );
  assert.match(
    rootEnvExampleSource,
    /MAGIC_STUDIO_USER_CENTER_SHARED_SECRET/u,
    '.env.example must document the private gateway shared-secret env name.',
  );
  assert.match(
    rootEnvExampleSource,
    /MAGIC_STUDIO_USER_CENTER_EXTERNAL_BASE_URL/u,
    '.env.example must document the private gateway external authority base-url env name.',
  );
});

