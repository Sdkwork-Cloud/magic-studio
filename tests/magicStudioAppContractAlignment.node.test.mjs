import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readWorkspaceSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

test('Magic Studio host-owned asset flows do not require the generated app-sdk asset-center module', () => {
  const coreSdkIndexSource = readWorkspaceSource('packages/sdkwork-magic-studio-core/src/sdk/index.ts');
  const remoteAssetIndexSource = readWorkspaceSource(
    'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts',
  );
  const assetSdkQueryServiceSource = readWorkspaceSource(
    'packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts',
  );

  assert.doesNotMatch(
    coreSdkIndexSource,
    /assetCenterClient/,
    'Expected magic-studio-core/sdk to stop exporting an app-sdk asset-center compatibility helper.',
  );
  assert.doesNotMatch(
    `${remoteAssetIndexSource}\n${assetSdkQueryServiceSource}`,
    /AssetCenterApi|createAssetCenterApi|@sdkwork\/app-sdk/,
    'Expected Magic Studio asset flows to avoid generated app-sdk asset-center surfaces.',
  );
  assert.match(
    remoteAssetIndexSource,
    /getAssetServerClient[\s\S]*upsertAsset/,
    'Expected remote asset indexing to use the canonical Magic Studio server asset client.',
  );
});

test('Magic Studio server contract owns full asset upsert semantics used by the asset-center aggregate', () => {
  const contract = JSON.parse(
    readWorkspaceSource('packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json'),
  );
  const serverClientSource = readWorkspaceSource('packages/sdkwork-magic-studio-server/src/client.ts');
  const hostAssetTypesSource = readWorkspaceSource('packages/sdkwork-magic-studio-host-types/src/server-assets.ts');

  const upsertRoute = contract.routes.find((route) => route.id === 'appAssetsUpsert');

  assert.deepEqual(
    upsertRoute && {
      method: upsertRoute.method,
      path: upsertRoute.path,
      requestBodySchema: upsertRoute.requestBodySchema,
      successResponseSchema: upsertRoute.successResponseSchema,
    },
    {
      method: 'PUT',
      path: '/api/app/v1/assets/:assetId',
      requestBodySchema: 'MagicStudioAssetUpsertRequest',
      successResponseSchema: 'UnifiedDigitalAssetEnvelope',
    },
    'Expected the canonical server contract to expose full UnifiedDigitalAsset upsert semantics.',
  );
  assert.match(
    hostAssetTypesSource,
    /MagicStudioAssetUpsertRequest/,
    'Expected host transport types to publish the canonical asset upsert request type.',
  );
  assert.match(
    serverClientSource,
    /upsertAsset\([^)]*assetId[\s\S]*MagicStudioAssetUpsertRequest[\s\S]*putJson/,
    'Expected MagicStudioServerClient to expose upsertAsset through the canonical PUT route.',
  );
});

test('global platform declarations reuse the canonical PlatformRuntime instead of redefining stale platform globals', () => {
  const source = readWorkspaceSource('src/app/global.d.ts');

  assert.match(
    source,
    /import\s+type\s+\{\s*PlatformRuntime\s*\}\s+from\s+'@sdkwork\/magic-studio-core\/platform'|import\s+type\s+\{\s*PlatformRuntime\s*\}\s+from\s+"@sdkwork\/magic-studio-core\/platform"/,
    'Expected src/app/global.d.ts to import PlatformRuntime from the canonical magic-studio-core platform entry.',
  );
  assert.doesNotMatch(
    source,
    /interface\s+PlatformRuntime\s*\{|type\s+PlatformRuntime\s*=/,
    'Expected src/app/global.d.ts to stop redefining PlatformRuntime locally.',
  );
});

test('order service routes trade order flows through the canonical magic studio server client', () => {
  const source = readWorkspaceSource('packages/sdkwork-magic-studio-trade/src/services/orderService.ts');

  assert.match(
    source,
    /from\s+'@sdkwork\/magic-studio-core\/sdk'|from\s+"@sdkwork\/magic-studio-core\/sdk"/,
    'Expected orderService.ts to use the canonical runtime server client facade.',
  );
  assert.match(
    source,
    /type\s+TradeOrderServerClient\s*=\s*Pick<\s*MagicStudioServerClient[\s\S]*listTradeOrders[\s\S]*>/,
    'Expected orderService.ts to constrain trade order access to the canonical MagicStudioServerClient methods.',
  );
  assert.match(
    source,
    /toTradeOrderQuery\(params\)/,
    'Expected orderService.ts to normalize order list filters before calling the server client.',
  );
});

test('payment service routes recharge through the canonical magic studio trade wallet route', () => {
  const source = readWorkspaceSource('packages/sdkwork-magic-studio-trade/src/services/paymentService.ts');

  assert.match(
    source,
    /from\s+'@sdkwork\/magic-studio-core\/sdk'|from\s+"@sdkwork\/magic-studio-core\/sdk"/,
    'Expected paymentService.ts to use the canonical runtime server client facade.',
  );
  assert.match(
    source,
    /rechargeTradeWallet\(/,
    'Expected paymentService.ts to route recharge through the canonical trade wallet server route.',
  );
  assert.doesNotMatch(
    source,
    /client\.account\.recharge\(|createRechargeCash/,
    'Expected paymentService.ts to avoid retired generated app-sdk recharge entrypoints for Magic Studio trade flows.',
  );
});

