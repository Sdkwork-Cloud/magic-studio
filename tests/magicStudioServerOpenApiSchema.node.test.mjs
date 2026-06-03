import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT,
  MAGIC_STUDIO_SERVER_ADMIN_DEPLOYMENTS_PATH,
  MAGIC_STUDIO_SERVER_APP_PLUGINS_PATH,
  MAGIC_STUDIO_SERVER_COMPRESSION_UNZIP_PATH,
  MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH,
  MAGIC_STUDIO_SERVER_HEALTH_PATH,
  MAGIC_STUDIO_SERVER_JOBS_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_AUDIO_CONVERT_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_AUDIO_MIX_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_AUDIO_NORMALIZE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_IMAGE_RESIZE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_EXTRACT_AUDIO_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_THUMBNAIL_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRANSCODE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRIM_PATH,
  MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH,
  MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH,
  MAGIC_STUDIO_SERVER_POLICY_SNAPSHOT_PATH,
  MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH,
  MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH,
  MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH,
  MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH,
  MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_BATCH_PATH,
  MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH,
  MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH,
  MAGIC_STUDIO_SERVER_TOOLKIT_CAPABILITIES_PATH,
  createMagicStudioServerOpenApiDocument,
  resolveMagicStudioServerOpenApiPath,
} from '../packages/sdkwork-magic-studio-server/src/index.ts';

function requireRoute(method, path) {
  const route = MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes.find(
    (candidate) => candidate.method === method && candidate.path === path,
  );

  assert.ok(route, `Expected contract route ${method} ${path} to exist.`);
  return route;
}

test('magic studio server openapi document publishes typed schemas for canonical governance, runtime, plugins, and deployments', () => {
  const document = createMagicStudioServerOpenApiDocument();
  const schemas = document.components?.schemas ?? {};
  const routeIds = MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes.map((route) => route.id);

  assert.ok(
    routeIds.every((routeId) => typeof routeId === 'string' && routeId.trim().length > 0),
    'Expected every canonical server route to declare a stable non-empty route id.',
  );
  assert.equal(
    new Set(routeIds).size,
    routeIds.length,
    'Expected canonical server route ids to be unique.',
  );
  assert.equal(
    MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.healthRouteId,
    requireRoute('GET', MAGIC_STUDIO_SERVER_HEALTH_PATH).id,
    'Expected discovery meta to reference the canonical health route id.',
  );
  assert.equal(
    MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.routeCatalogRouteId,
    requireRoute('GET', MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH).id,
    'Expected discovery meta to reference the canonical route catalog route id.',
  );
  assert.equal(
    MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.runtimeSummaryRouteId,
    requireRoute('GET', MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH).id,
    'Expected discovery meta to reference the canonical runtime summary route id.',
  );

  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_HEALTH_PATH).successResponseSchema,
    'MagicStudioServerHealthStatusEnvelope',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH).successResponseSchema,
    'MagicStudioApiRouteCatalogEnvelope',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH).successResponseSchema,
    'MagicStudioRuntimeSummaryEnvelope',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_TOOLKIT_CAPABILITIES_PATH).successResponseSchema,
    'MagicStudioToolkitCapabilityMatrixEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH).requestBodySchema,
    'MagicStudioMediaProbeRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH).successResponseSchema,
    'MagicStudioMediaProbeResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_IMAGE_RESIZE_PATH).requestBodySchema,
    'MagicStudioMediaImageResizeRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_IMAGE_RESIZE_PATH).successResponseSchema,
    'MagicStudioToolkitCommandResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH).requestBodySchema,
    'MagicStudioMediaVideoConcatRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH).successResponseSchema,
    'MagicStudioToolkitCommandResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRANSCODE_PATH).requestBodySchema,
    'MagicStudioMediaVideoTranscodeRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRIM_PATH).requestBodySchema,
    'MagicStudioMediaVideoTrimRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_VIDEO_EXTRACT_AUDIO_PATH).requestBodySchema,
    'MagicStudioMediaVideoExtractAudioRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_VIDEO_THUMBNAIL_PATH).requestBodySchema,
    'MagicStudioMediaVideoThumbnailRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_AUDIO_CONVERT_PATH).requestBodySchema,
    'MagicStudioMediaAudioConvertRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_AUDIO_NORMALIZE_PATH).requestBodySchema,
    'MagicStudioMediaAudioNormalizeRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MEDIA_AUDIO_MIX_PATH).requestBodySchema,
    'MagicStudioMediaAudioMixRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH).requestBodySchema,
    'MagicStudioCompressionZipRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH).successResponseSchema,
    'MagicStudioCompressionZipResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_COMPRESSION_UNZIP_PATH).requestBodySchema,
    'MagicStudioCompressionUnzipRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_COMPRESSION_UNZIP_PATH).successResponseSchema,
    'MagicStudioOperationOkResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH).requestBodySchema,
    'MagicStudioSqlExecuteRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH).successResponseSchema,
    'MagicStudioSqlExecuteResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH).requestBodySchema,
    'MagicStudioSqlExecuteRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH).successResponseSchema,
    'MagicStudioSqlRowListEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_BATCH_PATH).requestBodySchema,
    'MagicStudioSqlExecuteBatchRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_BATCH_PATH).successResponseSchema,
    'MagicStudioOperationOkResultEnvelope',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_POLICY_SNAPSHOT_PATH).successResponseSchema,
    'MagicStudioPolicySnapshotEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH).successResponseSchema,
    'MagicStudioPolicyValidationResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH).requestBodySchema,
    'MagicStudioPolicyPathValidationRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH).successResponseSchema,
    'MagicStudioPolicyValidationResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH).requestBodySchema,
    'MagicStudioPolicyCommandValidationRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH).successResponseSchema,
    'MagicStudioMigrationStatusEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH).requestBodySchema,
    'MagicStudioMigrationStatusRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH).successResponseSchema,
    'MagicStudioMigrationApplyResultEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH).requestBodySchema,
    'MagicStudioMigrationApplyRequest',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_JOBS_PATH).successResponseSchema,
    'MagicStudioToolkitJobSnapshotEnvelope',
  );
  assert.equal(
    requireRoute('POST', MAGIC_STUDIO_SERVER_JOBS_PATH).requestBodySchema,
    'MagicStudioToolkitJobSubmission',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_JOBS_PATH).successResponseSchema,
    'MagicStudioToolkitJobSnapshotListEnvelope',
  );
  assert.equal(
    MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes.find((route) => route.id === 'coreJobsRead')
      ?.successResponseSchema,
    'MagicStudioToolkitJobSnapshotEnvelope',
  );
  assert.equal(
    MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes.find((route) => route.id === 'coreJobsCancel')
      ?.successResponseSchema,
    'MagicStudioToolkitJobSnapshotEnvelope',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_APP_PLUGINS_PATH).successResponseSchema,
    'MagicStudioPluginManifestListEnvelope',
  );
  assert.equal(
    requireRoute('GET', MAGIC_STUDIO_SERVER_ADMIN_DEPLOYMENTS_PATH).successResponseSchema,
    'MagicStudioServerDeploymentRecordListEnvelope',
  );

  for (const schemaName of [
    'MagicStudioApiProblemEnvelope',
    'MagicStudioServerHealthStatus',
    'MagicStudioServerHealthStatusEnvelope',
    'MagicStudioApiRouteCatalogEntry',
    'MagicStudioApiRouteCatalogEnvelope',
    'MagicStudioRuntimeSummary',
    'MagicStudioRuntimeSummaryEnvelope',
    'MagicStudioMediaProbeRequest',
    'MagicStudioMediaProbeResult',
    'MagicStudioMediaProbeResultEnvelope',
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
    'MagicStudioCompressionZipResult',
    'MagicStudioCompressionZipResultEnvelope',
    'MagicStudioCompressionUnzipRequest',
    'MagicStudioOperationOkResult',
    'MagicStudioOperationOkResultEnvelope',
    'MagicStudioSqlExecuteRequest',
    'MagicStudioSqlExecuteBatchRequest',
    'MagicStudioSqlExecuteResult',
    'MagicStudioSqlExecuteResultEnvelope',
    'MagicStudioSqlRow',
    'MagicStudioSqlRowListEnvelope',
    'MagicStudioToolkitCapabilityMatrix',
    'MagicStudioToolkitCapabilityMatrixEnvelope',
    'MagicStudioPolicyPathValidationRequest',
    'MagicStudioPolicyCommandValidationRequest',
    'MagicStudioPolicyValidationResult',
    'MagicStudioPolicyValidationResultEnvelope',
    'MagicStudioPolicySnapshot',
    'MagicStudioPolicySnapshotEnvelope',
    'MagicStudioMigrationStatusRequest',
    'MagicStudioMigrationApplyRequest',
    'MagicStudioAppliedMigration',
    'MagicStudioMigrationStatus',
    'MagicStudioMigrationStatusEnvelope',
    'MagicStudioMigrationApplyResult',
    'MagicStudioMigrationApplyResultEnvelope',
    'MagicStudioToolkitCommandResult',
    'MagicStudioToolkitCommandResultEnvelope',
    'MagicStudioToolkitJobSubmission',
    'MagicStudioToolkitOperationResult',
    'MagicStudioToolkitFrameworkError',
    'MagicStudioToolkitJobSnapshot',
    'MagicStudioToolkitJobSnapshotEnvelope',
    'MagicStudioToolkitJobSnapshotListEnvelope',
    'MagicStudioPluginManifest',
    'MagicStudioPluginManifestListEnvelope',
    'MagicStudioServerDeploymentRecord',
    'MagicStudioServerDeploymentRecordListEnvelope',
  ]) {
    assert.ok(
      schemas[schemaName],
      `Expected OpenAPI components.schemas to include ${schemaName}.`,
    );
  }

  assert.equal(
    schemas.MagicStudioApiRouteCatalogEntry?.properties?.id?.type,
    'string',
    'Expected MagicStudioApiRouteCatalogEntry schema to publish the stable route id field.',
  );
  assert.ok(
    schemas.MagicStudioApiRouteCatalogEntry?.required?.includes('id'),
    'Expected MagicStudioApiRouteCatalogEntry schema to require the stable route id field.',
  );

  const healthOperation = document.paths?.[MAGIC_STUDIO_SERVER_HEALTH_PATH]?.get;
  assert.equal(healthOperation?.operationId, 'coreHealthStatusRead');
  assert.equal(
    healthOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioServerHealthStatusEnvelope',
  );

  const routeCatalogOperation = document.paths?.[MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH]?.get;
  assert.equal(routeCatalogOperation?.operationId, 'coreRoutesList');
  assert.equal(
    routeCatalogOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioApiRouteCatalogEnvelope',
  );

  const runtimeOperation = document.paths?.[MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH]?.get;
  assert.equal(runtimeOperation?.operationId, 'coreRuntimeSummaryRead');
  assert.equal(
    runtimeOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioRuntimeSummaryEnvelope',
  );
  assert.equal(
    runtimeOperation?.responses?.default?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioApiProblemEnvelope',
  );

  const pluginsOperation = document.paths?.[MAGIC_STUDIO_SERVER_APP_PLUGINS_PATH]?.get;
  assert.equal(
    pluginsOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioPluginManifestListEnvelope',
  );

  const toolkitCapabilitiesOperation =
    document.paths?.[MAGIC_STUDIO_SERVER_TOOLKIT_CAPABILITIES_PATH]?.get;
  assert.equal(
    toolkitCapabilitiesOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitCapabilityMatrixEnvelope',
  );

  const mediaProbeOperation = document.paths?.[MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH]?.post;
  assert.equal(
    mediaProbeOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMediaProbeRequest',
  );
  assert.equal(
    mediaProbeOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMediaProbeResultEnvelope',
  );

  const mediaVideoConcatOperation = document.paths?.[MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH]?.post;
  assert.equal(
    mediaVideoConcatOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMediaVideoConcatRequest',
  );
  assert.equal(
    mediaVideoConcatOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitCommandResultEnvelope',
  );

  const compressionZipOperation = document.paths?.[MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH]?.post;
  assert.equal(
    compressionZipOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioCompressionZipRequest',
  );
  assert.equal(
    compressionZipOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioCompressionZipResultEnvelope',
  );

  const sqliteExecuteOperation = document.paths?.[MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH]?.post;
  assert.equal(
    sqliteExecuteOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioSqlExecuteRequest',
  );
  assert.equal(
    sqliteExecuteOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioSqlExecuteResultEnvelope',
  );

  const sqliteQueryOperation = document.paths?.[MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH]?.post;
  assert.equal(
    sqliteQueryOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioSqlExecuteRequest',
  );
  assert.equal(
    sqliteQueryOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioSqlRowListEnvelope',
  );

  const policySnapshotOperation = document.paths?.[MAGIC_STUDIO_SERVER_POLICY_SNAPSHOT_PATH]?.get;
  assert.equal(
    policySnapshotOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioPolicySnapshotEnvelope',
  );

  const validatePathOperation =
    document.paths?.[MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH]?.post;
  assert.equal(
    validatePathOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioPolicyValidationResultEnvelope',
  );
  assert.equal(
    validatePathOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioPolicyPathValidationRequest',
  );

  const validateCommandOperation =
    document.paths?.[MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH]?.post;
  assert.equal(
    validateCommandOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioPolicyValidationResultEnvelope',
  );
  assert.equal(
    validateCommandOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioPolicyCommandValidationRequest',
  );

  const migrationStatusOperation = document.paths?.[MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH]?.post;
  assert.equal(
    migrationStatusOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMigrationStatusEnvelope',
  );
  assert.equal(
    migrationStatusOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMigrationStatusRequest',
  );

  const migrationApplyOperation = document.paths?.[MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH]?.post;
  assert.equal(
    migrationApplyOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMigrationApplyResultEnvelope',
  );
  assert.equal(
    migrationApplyOperation?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioMigrationApplyRequest',
  );

  const jobsPathItem = document.paths?.[MAGIC_STUDIO_SERVER_JOBS_PATH];
  assert.ok(jobsPathItem?.post, 'Expected /api/core/v1/jobs to expose a POST operation in OpenAPI.');
  assert.ok(jobsPathItem?.get, 'Expected /api/core/v1/jobs to expose a GET operation in OpenAPI.');
  assert.equal(
    jobsPathItem?.post?.requestBody?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitJobSubmission',
  );
  assert.equal(
    jobsPathItem?.post?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitJobSnapshotEnvelope',
  );
  assert.equal(
    jobsPathItem?.get?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitJobSnapshotListEnvelope',
  );

  const toolkitOperationVariants = schemas.MagicStudioToolkitOperation?.oneOf;
  assert.ok(
    Array.isArray(toolkitOperationVariants),
    'Expected MagicStudioToolkitOperation to declare oneOf variants.',
  );
  const videoConcatVariant = toolkitOperationVariants.find(
    (candidate) => candidate?.properties?.kind?.enum?.includes('videoConcat'),
  );
  assert.deepEqual(videoConcatVariant?.required, [
    'kind',
    'inputPaths',
    'outputPath',
  ]);
  assert.equal(videoConcatVariant?.properties?.inputPaths?.type, 'array');
  assert.equal(videoConcatVariant?.properties?.inputPaths?.items?.type, 'string');
  assert.equal(videoConcatVariant?.properties?.outputPath?.type, 'string');
  assert.equal(videoConcatVariant?.properties?.overwrite?.type, 'boolean');

  const jobDetailOperation =
    document.paths?.[resolveMagicStudioServerOpenApiPath('coreJobsRead')]?.get;
  assert.equal(
    jobDetailOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitJobSnapshotEnvelope',
  );

  const cancelJobOperation =
    document.paths?.[resolveMagicStudioServerOpenApiPath('coreJobsCancel')]?.post;
  assert.equal(
    cancelJobOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioToolkitJobSnapshotEnvelope',
  );

  const deploymentsOperation = document.paths?.[MAGIC_STUDIO_SERVER_ADMIN_DEPLOYMENTS_PATH]?.get;
  assert.equal(
    deploymentsOperation?.responses?.['200']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/MagicStudioServerDeploymentRecordListEnvelope',
  );

  for (const route of MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes) {
    const operation =
      document.paths?.[resolveMagicStudioServerOpenApiPath(route.id)]?.[route.method.toLowerCase()];

    assert.equal(
      operation?.operationId,
      route.id,
      `Expected OpenAPI operationId for ${route.method} ${route.path} to equal canonical route id ${route.id}.`,
    );
  }
});
