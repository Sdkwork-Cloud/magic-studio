import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('shared magic studio host types own the canonical runtime, governance, and deployment dto surface', () => {
  const hostTypesIndexSource = read('packages/sdkwork-magic-studio-host-types/src/index.ts');
  const serverPackageIndexSource = read('packages/sdkwork-magic-studio-server/src/index.ts');
  const clientSource = read('packages/sdkwork-magic-studio-server/src/client.ts');
  const migrationClientSource = read(
    'packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.ts',
  );
  const policyClientSource = read(
    'packages/sdkwork-magic-studio-core/src/platform/toolkit/policyClient.ts',
  );
  const toolkitTypesSource = read('packages/sdkwork-magic-studio-core/src/platform/toolkit/types.ts');

  for (const dtoName of [
    'MagicStudioPolicyPathValidationRequest',
    'MagicStudioPolicyCommandValidationRequest',
    'MagicStudioPolicyAccessType',
    'MagicStudioServerHealthStatus',
    'MagicStudioRuntimeSummary',
    'MagicStudioMediaProbeRequest',
    'MagicStudioMediaProbeResult',
    'MagicStudioMediaImageResizeRequest',
    'MagicStudioMediaVideoConcatRequest',
    'MagicStudioMediaVideoTranscodeRequest',
    'MagicStudioMediaVideoTrimRequest',
    'MagicStudioMediaVideoExtractAudioRequest',
    'MagicStudioMediaVideoThumbnailRequest',
    'MagicStudioMediaAudioConvertRequest',
    'MagicStudioMediaAudioNormalizeRequest',
    'MagicStudioMediaAudioMixInput',
    'MagicStudioMediaAudioMixRequest',
    'MagicStudioCompressionZipRequest',
    'MagicStudioCompressionUnzipRequest',
    'MagicStudioOperationOkResult',
    'MagicStudioSqlExecuteRequest',
    'MagicStudioSqlExecuteBatchRequest',
    'MagicStudioSqlExecuteResult',
    'MagicStudioSqlRow',
    'MagicStudioToolkitCapabilityMatrix',
    'MagicStudioPolicyValidationResult',
    'MagicStudioPolicySnapshot',
    'MagicStudioMigrationStatusRequest',
    'MagicStudioMigrationScript',
    'MagicStudioMigrationPlan',
    'MagicStudioMigrationApplyRequest',
    'MagicStudioAppliedMigration',
    'MagicStudioMigrationStatus',
    'MagicStudioMigrationApplyResult',
    'MagicStudioToolkitOperation',
    'MagicStudioToolkitFrameworkError',
    'MagicStudioToolkitJobSubmission',
    'MagicStudioToolkitJobSnapshot',
    'MagicStudioServerDeploymentRecord',
  ]) {
    assert.match(
      hostTypesIndexSource,
      new RegExp(`\\b${dtoName}\\b`),
      `Expected @sdkwork/magic-studio-host-types to export ${dtoName}.`,
    );
    assert.match(
      serverPackageIndexSource,
      new RegExp(`\\b${dtoName}\\b`),
      `Expected the server package root to re-export ${dtoName}.`,
    );
  }

  for (const dtoName of [
    'MagicStudioPolicyPathValidationRequest',
    'MagicStudioPolicyCommandValidationRequest',
    'MagicStudioServerHealthStatus',
    'MagicStudioRuntimeSummary',
    'MagicStudioMediaProbeRequest',
    'MagicStudioMediaProbeResult',
    'MagicStudioMediaImageResizeRequest',
    'MagicStudioMediaVideoConcatRequest',
    'MagicStudioMediaVideoTranscodeRequest',
    'MagicStudioMediaVideoTrimRequest',
    'MagicStudioMediaVideoExtractAudioRequest',
    'MagicStudioMediaVideoThumbnailRequest',
    'MagicStudioMediaAudioConvertRequest',
    'MagicStudioMediaAudioNormalizeRequest',
    'MagicStudioMediaAudioMixInput',
    'MagicStudioMediaAudioMixRequest',
    'MagicStudioCompressionZipRequest',
    'MagicStudioCompressionUnzipRequest',
    'MagicStudioOperationOkResult',
    'MagicStudioSqlExecuteRequest',
    'MagicStudioSqlExecuteBatchRequest',
    'MagicStudioSqlExecuteResult',
    'MagicStudioToolkitCapabilityMatrix',
    'MagicStudioPolicyValidationResult',
    'MagicStudioPolicySnapshot',
    'MagicStudioMigrationStatusRequest',
    'MagicStudioMigrationPlan',
    'MagicStudioMigrationApplyRequest',
    'MagicStudioMigrationStatus',
    'MagicStudioMigrationApplyResult',
    'MagicStudioToolkitCommandResult',
    'MagicStudioToolkitOperation',
    'MagicStudioToolkitJobKind',
    'MagicStudioToolkitJobSubmission',
    'MagicStudioToolkitJobSnapshot',
    'MagicStudioServerDeploymentRecord',
  ]) {
    assert.match(
      clientSource,
      new RegExp(`\\b${dtoName}\\b`),
      `Expected the server client to consume the shared ${dtoName} DTO.`,
    );
  }

  for (const localTypeName of [
    'MagicStudioPolicyPathValidationRequest',
    'MagicStudioPolicyCommandValidationRequest',
    'MagicStudioServerHealthStatus',
    'MagicStudioRuntimeSummary',
    'MagicStudioMediaProbeRequest',
    'MagicStudioMediaImageResizeRequest',
    'MagicStudioMediaVideoConcatRequest',
    'MagicStudioMediaVideoTranscodeRequest',
    'MagicStudioMediaVideoTrimRequest',
    'MagicStudioMediaVideoExtractAudioRequest',
    'MagicStudioMediaVideoThumbnailRequest',
    'MagicStudioMediaAudioConvertRequest',
    'MagicStudioMediaAudioNormalizeRequest',
    'MagicStudioMediaAudioMixInput',
    'MagicStudioMediaAudioMixRequest',
    'MagicStudioCompressionZipRequest',
    'MagicStudioCompressionUnzipRequest',
    'MagicStudioOperationOkResult',
    'MagicStudioSqlExecuteRequest',
    'MagicStudioSqlExecuteBatchRequest',
    'MagicStudioSqlExecuteResult',
    'MagicStudioToolkitCapabilityMatrix',
    'MagicStudioPolicyValidationResult',
    'MagicStudioPolicySnapshot',
    'MagicStudioMigrationStatusRequest',
    'MagicStudioMigrationScript',
    'MagicStudioMigrationPlan',
    'MagicStudioMigrationApplyRequest',
    'MagicStudioAppliedMigration',
    'MagicStudioMigrationStatus',
    'MagicStudioMigrationApplyResult',
    'MagicStudioToolkitOperation',
    'MagicStudioToolkitFrameworkError',
    'MagicStudioToolkitJobSubmission',
    'MagicStudioToolkitJobSnapshot',
  ]) {
    assert.doesNotMatch(
      clientSource,
      new RegExp(`export interface ${localTypeName}\\b`),
      `Expected client.ts to stop owning a local ${localTypeName} DTO definition.`,
    );
  }

  assert.match(
    clientSource,
    /healthz\(\): Promise<MagicStudioApiEnvelope<MagicStudioServerHealthStatus>>;/,
    'Expected healthz() to expose the shared health status DTO.',
  );
  assert.match(
    clientSource,
    /readRouteCatalog\(\): Promise<MagicStudioApiListEnvelope<MagicStudioApiRouteCatalogEntry>>;/,
    'Expected readRouteCatalog() to expose the canonical list envelope for route collections.',
  );
  assert.match(
    clientSource,
    /mediaProbe\(payload: MagicStudioMediaProbeRequest\): Promise<MagicStudioApiEnvelope<MagicStudioMediaProbeResult>>;/,
    'Expected mediaProbe() to expose shared request and response DTOs.',
  );
  assert.match(
    clientSource,
    /mediaVideoConcat\(\s*payload: MagicStudioMediaVideoConcatRequest,\s*\): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;/,
    'Expected mediaVideoConcat() to expose the shared request DTO instead of positional arguments.',
  );
  assert.match(
    clientSource,
    /zipLocalPaths\(\s*payload: MagicStudioCompressionZipRequest,\s*\): Promise<MagicStudioApiEnvelope<MagicStudioCompressionZipResult>>;/,
    'Expected zipLocalPaths() to expose the shared compression request DTO.',
  );
  assert.match(
    clientSource,
    /unzipToDirectory\(\s*payload: MagicStudioCompressionUnzipRequest,\s*\): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;/,
    'Expected unzipToDirectory() to expose the shared unzip request DTO and canonical ok result.',
  );
  assert.match(
    clientSource,
    /executeSql\(\s*payload: MagicStudioSqlExecuteRequest,\s*\): Promise<MagicStudioApiEnvelope<MagicStudioSqlExecuteResult>>;/,
    'Expected executeSql() to expose the shared sql execute request DTO.',
  );
  assert.match(
    clientSource,
    /executeSqlBatch\(\s*payload: MagicStudioSqlExecuteBatchRequest,\s*\): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;/,
    'Expected executeSqlBatch() to expose the shared batch request DTO and canonical ok result.',
  );
  assert.match(
    clientSource,
    /submitToolkitJob\(\s*payload: MagicStudioToolkitJobSubmission,\s*\): Promise<MagicStudioApiEnvelope<MagicStudioToolkitJobSnapshot>>;/,
    'Expected submitToolkitJob() to expose the shared job submission DTO.',
  );
  assert.match(
    clientSource,
    /listDeployments\(\): Promise<MagicStudioApiListEnvelope<MagicStudioServerDeploymentRecord>>;/,
    'Expected listDeployments() to expose the shared deployment DTO instead of Record<string, unknown>.',
  );

  for (const dtoName of [
    'MagicStudioMigrationScript',
    'MagicStudioMigrationPlan',
    'MagicStudioAppliedMigration',
    'MagicStudioMigrationStatus',
    'MagicStudioMigrationApplyResult',
  ]) {
    assert.match(
      migrationClientSource,
      new RegExp(`\\b${dtoName}\\b`),
      `Expected migrationClient.ts to consume the shared ${dtoName} DTO.`,
    );
  }

  for (const localTypeName of [
    'MigrationScript',
    'MigrationPlan',
    'AppliedMigration',
    'MigrationStatus',
    'MigrationApplyResult',
  ]) {
    assert.doesNotMatch(
      migrationClientSource,
      new RegExp(`export interface ${localTypeName}\\b`),
      `Expected migrationClient.ts to stop owning a local ${localTypeName} DTO definition.`,
    );
  }

  assert.match(
    migrationClientSource,
    /export type MigrationScript = MagicStudioMigrationScript;/,
    'Expected migrationClient.ts to alias MigrationScript to the shared migration DTO.',
  );
  assert.match(
    migrationClientSource,
    /export type MigrationPlan = MagicStudioMigrationPlan;/,
    'Expected migrationClient.ts to alias MigrationPlan to the shared migration DTO.',
  );
  assert.match(
    migrationClientSource,
    /export type AppliedMigration = MagicStudioAppliedMigration;/,
    'Expected migrationClient.ts to alias AppliedMigration to the shared migration DTO.',
  );
  assert.match(
    migrationClientSource,
    /export type MigrationStatus = MagicStudioMigrationStatus;/,
    'Expected migrationClient.ts to alias MigrationStatus to the shared migration DTO.',
  );
  assert.match(
    migrationClientSource,
    /export type MigrationApplyResult = MagicStudioMigrationApplyResult;/,
    'Expected migrationClient.ts to alias MigrationApplyResult to the shared migration DTO.',
  );

  for (const dtoName of [
    'MagicStudioPolicyAccessType',
    'MagicStudioPolicyValidationResult',
    'MagicStudioPolicySnapshot',
  ]) {
    assert.match(
      policyClientSource,
      new RegExp(`\\b${dtoName}\\b`),
      `Expected policyClient.ts to consume the shared ${dtoName} DTO.`,
    );
  }

  assert.doesNotMatch(
    policyClientSource,
    /export type PolicyPathAccessType = 'read' \| 'write' \| 'ensureDir';/,
    'Expected policyClient.ts to stop owning a local PolicyPathAccessType union.',
  );
  for (const localTypeName of ['PolicyValidationResult', 'PolicySnapshot']) {
    assert.doesNotMatch(
      policyClientSource,
      new RegExp(`export interface ${localTypeName}\\b`),
      `Expected policyClient.ts to stop owning a local ${localTypeName} DTO definition.`,
    );
  }
  assert.match(
    policyClientSource,
    /export type PolicyPathAccessType = MagicStudioPolicyAccessType;/,
    'Expected policyClient.ts to alias PolicyPathAccessType to the shared policy access type.',
  );
  assert.match(
    policyClientSource,
    /export type PolicyValidationResult = MagicStudioPolicyValidationResult;/,
    'Expected policyClient.ts to alias PolicyValidationResult to the shared policy DTO.',
  );
  assert.match(
    policyClientSource,
    /export type PolicySnapshot = MagicStudioPolicySnapshot;/,
    'Expected policyClient.ts to alias PolicySnapshot to the shared policy DTO.',
  );

  for (const dtoName of [
    'MagicStudioMediaProbeResult',
    'MagicStudioToolkitCommandResult',
    'MagicStudioSqlExecuteResult',
    'MagicStudioSqlRow',
  ]) {
    assert.match(
      toolkitTypesSource,
      new RegExp(`\\b${dtoName}\\b`),
      `Expected toolkit/types.ts to consume the shared ${dtoName} DTO.`,
    );
  }
  for (const localTypeName of [
    'ToolkitMediaProbeResult',
    'ToolkitMediaCommandResult',
    'ToolkitSqlExecuteResult',
    'ToolkitDatabaseRow',
  ]) {
    assert.doesNotMatch(
      toolkitTypesSource,
      new RegExp(`export interface ${localTypeName}\\b`),
      `Expected toolkit/types.ts to stop owning a local ${localTypeName} DTO definition.`,
    );
  }
  assert.match(
    toolkitTypesSource,
    /export type ToolkitMediaProbeResult = MagicStudioMediaProbeResult;/,
    'Expected toolkit/types.ts to alias ToolkitMediaProbeResult to the shared media probe result DTO.',
  );
  assert.match(
    toolkitTypesSource,
    /export type ToolkitMediaCommandResult = MagicStudioToolkitCommandResult;/,
    'Expected toolkit/types.ts to alias ToolkitMediaCommandResult to the shared server command result DTO.',
  );
  assert.match(
    toolkitTypesSource,
    /export type ToolkitSqlExecuteResult = MagicStudioSqlExecuteResult;/,
    'Expected toolkit/types.ts to alias ToolkitSqlExecuteResult to the shared sql result DTO.',
  );
  assert.match(
    toolkitTypesSource,
    /export type ToolkitDatabaseRow = MagicStudioSqlRow;/,
    'Expected toolkit/types.ts to alias ToolkitDatabaseRow to the shared sql row DTO.',
  );
  assert.match(
    toolkitTypesSource,
    /probe\(pathOrUrl: string\): Promise<ToolkitMediaProbeResult>;/,
    'Expected PlatformMediaToolkit.probe() to expose the canonical media probe result alias.',
  );
});

test('rust server route handlers use typed canonical payloads for discovery, runtime, plugin, and deployment endpoints', () => {
  const coreDiscoveryRouteSource = read(
    'packages/sdkwork-magic-studio-server/src-host/src/routes/core/discovery.rs',
  );
  const appPluginsRouteSource = read(
    'packages/sdkwork-magic-studio-server/src-host/src/routes/app/plugins.rs',
  );
  const adminRouteSource = read('packages/sdkwork-magic-studio-server/src-host/src/routes/admin.rs');

  assert.match(
    coreDiscoveryRouteSource,
    /\bstruct HealthStatusResponse\b/,
    'Expected the health route to use a typed response DTO.',
  );
  assert.match(
    coreDiscoveryRouteSource,
    /\bstruct RuntimeSummaryResponse\b/,
    'Expected the core runtime summary route to use a typed response DTO.',
  );
  assert.match(
    appPluginsRouteSource,
    /\bstruct PluginManifestResponse\b/,
    'Expected the app plugins route to use a typed response DTO.',
  );
  assert.match(
    adminRouteSource,
    /\bstruct DeploymentRecordResponse\b/,
    'Expected the admin deployments route to use a typed response DTO.',
  );
  assert.match(
    coreDiscoveryRouteSource,
    /pub async fn healthz[\s\S]*success\(HealthStatusResponse\s*\{/,
    'Expected healthz() to return a HealthStatusResponse struct instead of an anonymous json! payload.',
  );
  assert.match(
    coreDiscoveryRouteSource,
    /pub async fn route_catalog[\s\S]*ApiListEnvelope<crate::contract::ServerRouteCatalogEntry>/,
    'Expected route_catalog() to use the canonical list envelope for route collections.',
  );
  assert.doesNotMatch(
    coreDiscoveryRouteSource,
    /ApiEnvelope<Vec<crate::contract::ServerRouteCatalogEntry>>/,
    'Expected route_catalog() to stop using a singular envelope for list data.',
  );
  assert.match(
    coreDiscoveryRouteSource,
    /pub async fn runtime_summary[\s\S]*success\(RuntimeSummaryResponse\s*\{/,
    'Expected runtime_summary() to return a RuntimeSummaryResponse struct instead of an anonymous json! payload.',
  );
  assert.doesNotMatch(
    appPluginsRouteSource,
    /ApiListEnvelope<Value>/,
    'Expected app route payloads to stop using serde_json::Value envelopes.',
  );
  assert.doesNotMatch(
    adminRouteSource,
    /ApiListEnvelope<Value>/,
    'Expected admin route payloads to stop using serde_json::Value envelopes.',
  );
  assert.match(
    adminRouteSource,
    /\bchecksum\b/,
    'Expected deployment records to expose checksum metadata.',
  );
  assert.match(
    adminRouteSource,
    /\bopen_api_version\b/,
    'Expected deployment records to expose OpenAPI version metadata.',
  );
});
