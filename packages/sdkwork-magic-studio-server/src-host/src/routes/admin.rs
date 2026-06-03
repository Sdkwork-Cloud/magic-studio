use axum::extract::{Path, State};
use axum::Json;
use axum::{
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};

use crate::response::{list, success, ServerResult};
use crate::services::admin_governance::DeploymentRecord;
use crate::state::AppState;

pub fn mount_routes(router: Router<AppState>, state: &AppState) -> Router<AppState> {
    let paths = AdminRoutePaths::from_state(state);
    router
        .route(&paths.deployments, get(deployments))
        .route(&paths.runtime_audits, get(read_runtime_audit))
        .route(&paths.jobs_metrics, get(read_jobs_metrics))
        .route(&paths.policy_audits, get(read_policy_audit))
        .route(&paths.storage_providers, get(list_storage_providers))
        .route(&paths.execution_providers, get(list_execution_providers))
        .route(
            &paths.execution_provider_detail,
            get(read_execution_provider),
        )
        .route(
            &paths.execution_provider_reconcile,
            post(reconcile_execution_provider),
        )
        .route(
            &paths.execution_provider_health,
            get(list_execution_provider_health),
        )
        .route(&paths.execution_failures, get(list_execution_failures))
        .route(
            &paths.execution_failure_acknowledge,
            post(acknowledge_execution_failure),
        )
        .route(
            &paths.execution_failure_retry,
            post(retry_execution_failure),
        )
        .route(
            &paths.workspace_release_retention_runs,
            get(list_workspace_release_retention_runs).post(create_workspace_release_retention_run),
        )
        .route(
            &paths.workspace_release_retention_run_detail,
            get(read_workspace_release_retention_run),
        )
        .route(
            &paths.workspace_release_retention_schedules,
            get(list_workspace_release_retention_schedules)
                .post(create_workspace_release_retention_schedule),
        )
        .route(
            &paths.workspace_release_retention_schedule_detail,
            get(read_workspace_release_retention_schedule)
                .patch(update_workspace_release_retention_schedule),
        )
        .route(
            &paths.workspace_release_retention_schedule_trigger,
            post(trigger_workspace_release_retention_schedule),
        )
        .route(&paths.plugins, get(list_plugins))
        .route(&paths.plugin_enable, post(enable_plugin))
        .route(&paths.plugin_disable, post(disable_plugin))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginIdPath {
    plugin_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceReleaseRetentionRunIdPath {
    run_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceReleaseRetentionScheduleIdPath {
    schedule_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionProviderKeyPath {
    provider_key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionFailureIdPath {
    failure_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DeploymentRecordResponse {
    family: String,
    platform: String,
    arch: String,
    channel: String,
    status: String,
    open_api_version: String,
    checksum: Option<String>,
}

impl From<DeploymentRecord> for DeploymentRecordResponse {
    fn from(record: DeploymentRecord) -> Self {
        Self {
            family: record.family.to_string(),
            platform: record.platform.to_string(),
            arch: record.arch.to_string(),
            channel: record.channel.to_string(),
            status: record.status.to_string(),
            open_api_version: record.open_api_version.to_string(),
            checksum: record.checksum,
        }
    }
}

pub async fn deployments(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<DeploymentRecordResponse>>> {
    Ok(list(
        state
            .admin_governance_service
            .list_deployments(&state.config)?
            .into_iter()
            .map(DeploymentRecordResponse::from)
            .collect(),
    ))
}

pub async fn read_runtime_audit(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::admin_governance::AdminRuntimeAuditRecord>>,
> {
    let capability_summary = state.capability_service.read_summary()?;
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(success(state.admin_governance_service.read_runtime_audit(
        &state.config,
        &state.contract,
        &capability_summary,
        &execution_capabilities,
    )?))
}

pub async fn read_jobs_metrics(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::admin_governance::AdminJobMetricsRecord>>,
> {
    let jobs = state.job_service.list_jobs()?;
    Ok(success(
        state.admin_governance_service.read_job_metrics(&jobs)?,
    ))
}

pub async fn read_policy_audit(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::admin_governance::AdminPolicyAuditRecord>>,
> {
    Ok(success(
        state
            .admin_governance_service
            .read_policy_audit(&state.policy_service.snapshot())?,
    ))
}

pub async fn list_storage_providers(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiListEnvelope<
            crate::services::admin_governance::AdminStorageProviderRecord,
        >,
    >,
> {
    Ok(list(
        state.admin_governance_service.list_storage_providers()?,
    ))
}

pub async fn list_execution_providers(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiListEnvelope<
            crate::services::admin_governance::AdminExecutionProviderRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(list(
        state
            .admin_governance_service
            .list_execution_providers(&execution_capabilities)?,
    ))
}

pub async fn list_execution_provider_health(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiListEnvelope<
            crate::services::admin_governance::AdminExecutionProviderHealthRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(list(
        state
            .admin_governance_service
            .list_execution_provider_health(&execution_capabilities)?,
    ))
}

pub async fn read_execution_provider(
    State(state): State<AppState>,
    Path(path): Path<ExecutionProviderKeyPath>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminExecutionProviderDetailRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(success(
        state
            .admin_governance_service
            .read_execution_provider(&path.provider_key, &execution_capabilities)?,
    ))
}

pub async fn reconcile_execution_provider(
    State(state): State<AppState>,
    Path(path): Path<ExecutionProviderKeyPath>,
    Json(input): Json<crate::services::admin_governance::AdminExecutionProviderReconcileInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminExecutionProviderDetailRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(success(
        state
            .admin_governance_service
            .reconcile_execution_provider(&path.provider_key, &execution_capabilities, input)?,
    ))
}

pub async fn list_execution_failures(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiListEnvelope<
            crate::services::admin_governance::AdminExecutionFailureRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(list(
        state
            .admin_governance_service
            .list_execution_failures(&execution_capabilities)?,
    ))
}

pub async fn acknowledge_execution_failure(
    State(state): State<AppState>,
    Path(path): Path<ExecutionFailureIdPath>,
    Json(input): Json<crate::services::admin_governance::AdminExecutionFailureAcknowledgeInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminExecutionFailureRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(success(
        state
            .admin_governance_service
            .acknowledge_execution_failure(&path.failure_id, &execution_capabilities, input)?,
    ))
}

pub async fn retry_execution_failure(
    State(state): State<AppState>,
    Path(path): Path<ExecutionFailureIdPath>,
    Json(input): Json<crate::services::admin_governance::AdminExecutionFailureRetryInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminExecutionFailureRetryResultRecord,
        >,
    >,
> {
    let execution_capabilities = state.capability_service.list_execution_capabilities()?;
    Ok(success(
        state.admin_governance_service.retry_execution_failure(
            &path.failure_id,
            &execution_capabilities,
            input,
        )?,
    ))
}

pub async fn list_workspace_release_retention_runs(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiListEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionRunRecord,
        >,
    >,
> {
    Ok(list(
        state
            .admin_governance_service
            .list_workspace_release_retention_runs()?,
    ))
}

pub async fn create_workspace_release_retention_run(
    State(state): State<AppState>,
    Json(input): Json<crate::services::admin_governance::AdminWorkspaceReleaseRetentionRunInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionRunDetailRecord,
        >,
    >,
> {
    Ok(success(
        state
            .admin_governance_service
            .create_workspace_release_retention_run(input)?,
    ))
}

pub async fn read_workspace_release_retention_run(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceReleaseRetentionRunIdPath>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionRunDetailRecord,
        >,
    >,
> {
    Ok(success(
        state
            .admin_governance_service
            .read_workspace_release_retention_run(&path.run_id)?,
    ))
}

pub async fn list_workspace_release_retention_schedules(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiListEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleRecord,
        >,
    >,
> {
    Ok(list(
        state
            .admin_governance_service
            .list_workspace_release_retention_schedules()?,
    ))
}

pub async fn create_workspace_release_retention_schedule(
    State(state): State<AppState>,
    Json(input): Json<
        crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleCreateInput,
    >,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleRecord,
        >,
    >,
> {
    Ok(success(
        state
            .admin_governance_service
            .create_workspace_release_retention_schedule(input)?,
    ))
}

pub async fn read_workspace_release_retention_schedule(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceReleaseRetentionScheduleIdPath>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleRecord,
        >,
    >,
> {
    Ok(success(
        state
            .admin_governance_service
            .read_workspace_release_retention_schedule(&path.schedule_id)?,
    ))
}

pub async fn update_workspace_release_retention_schedule(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceReleaseRetentionScheduleIdPath>,
    Json(input): Json<
        crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleUpdateInput,
    >,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleRecord,
        >,
    >,
> {
    Ok(success(
        state
            .admin_governance_service
            .update_workspace_release_retention_schedule(&path.schedule_id, input)?,
    ))
}

pub async fn trigger_workspace_release_retention_schedule(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceReleaseRetentionScheduleIdPath>,
    Json(input): Json<
        crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleTriggerInput,
    >,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::admin_governance::AdminWorkspaceReleaseRetentionScheduleTriggerResultRecord,
        >,
    >,
>{
    Ok(success(
        state
            .admin_governance_service
            .trigger_workspace_release_retention_schedule(&path.schedule_id, input)?,
    ))
}

pub async fn list_plugins(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::plugins::AdminPluginRecord>>>
{
    let app_base_path = state.contract.require_surface_base_path("app");
    Ok(list(
        state.plugin_service.list_admin_plugins(&app_base_path)?,
    ))
}

pub async fn enable_plugin(
    State(state): State<AppState>,
    Path(path): Path<PluginIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::plugins::AdminPluginRecord>>> {
    let app_base_path = state.contract.require_surface_base_path("app");
    Ok(success(state.plugin_service.set_plugin_enabled(
        &path.plugin_id,
        true,
        &app_base_path,
    )?))
}

pub async fn disable_plugin(
    State(state): State<AppState>,
    Path(path): Path<PluginIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::plugins::AdminPluginRecord>>> {
    let app_base_path = state.contract.require_surface_base_path("app");
    Ok(success(state.plugin_service.set_plugin_enabled(
        &path.plugin_id,
        false,
        &app_base_path,
    )?))
}

struct AdminRoutePaths {
    deployments: String,
    runtime_audits: String,
    jobs_metrics: String,
    policy_audits: String,
    storage_providers: String,
    execution_providers: String,
    execution_provider_detail: String,
    execution_provider_reconcile: String,
    execution_provider_health: String,
    execution_failures: String,
    execution_failure_acknowledge: String,
    execution_failure_retry: String,
    workspace_release_retention_runs: String,
    workspace_release_retention_run_detail: String,
    workspace_release_retention_schedules: String,
    workspace_release_retention_schedule_detail: String,
    workspace_release_retention_schedule_trigger: String,
    plugins: String,
    plugin_enable: String,
    plugin_disable: String,
}

impl AdminRoutePaths {
    fn from_state(state: &AppState) -> Self {
        Self {
            deployments: state
                .contract
                .require_route_path_by_id("adminDeploymentsList"),
            runtime_audits: state
                .contract
                .require_route_path_by_id("adminRuntimeAuditsRead"),
            jobs_metrics: state
                .contract
                .require_route_path_by_id("adminJobsMetricsRead"),
            policy_audits: state
                .contract
                .require_route_path_by_id("adminPolicyAuditsRead"),
            storage_providers: state
                .contract
                .require_route_path_by_id("adminStorageProvidersList"),
            execution_providers: state
                .contract
                .require_route_path_by_id("adminExecutionProvidersList"),
            execution_provider_detail: state
                .contract
                .axum_path_for_route_id("adminExecutionProvidersRead"),
            execution_provider_reconcile: state
                .contract
                .axum_path_for_route_id("adminExecutionProvidersReconcile"),
            execution_provider_health: state
                .contract
                .require_route_path_by_id("adminExecutionProvidersReadHealth"),
            execution_failures: state
                .contract
                .require_route_path_by_id("adminExecutionFailuresList"),
            execution_failure_acknowledge: state
                .contract
                .axum_path_for_route_id("adminExecutionFailuresAcknowledge"),
            execution_failure_retry: state
                .contract
                .axum_path_for_route_id("adminExecutionFailuresRetry"),
            workspace_release_retention_runs: state
                .contract
                .require_route_path_by_id("adminWorkspaceReleaseRetentionRunsList"),
            workspace_release_retention_run_detail: state
                .contract
                .axum_path_for_route_id("adminWorkspaceReleaseRetentionRunsRead"),
            workspace_release_retention_schedules: state
                .contract
                .require_route_path_by_id("adminWorkspaceReleaseRetentionSchedulesList"),
            workspace_release_retention_schedule_detail: state
                .contract
                .axum_path_for_route_id("adminWorkspaceReleaseRetentionSchedulesRead"),
            workspace_release_retention_schedule_trigger: state
                .contract
                .axum_path_for_route_id("adminWorkspaceReleaseRetentionSchedulesTrigger"),
            plugins: state.contract.require_route_path_by_id("adminPluginsList"),
            plugin_enable: state.contract.axum_path_for_route_id("adminPluginsEnable"),
            plugin_disable: state.contract.axum_path_for_route_id("adminPluginsDisable"),
        }
    }
}
