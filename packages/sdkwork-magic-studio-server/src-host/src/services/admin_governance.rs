use std::collections::HashSet;
use std::fs;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration as StdDuration;

use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::{Duration as TimeDuration, OffsetDateTime};
use tokio::time::sleep;

use crate::config::ServerConfig;
use crate::contract::{ServerContract, MAGIC_STUDIO_OPENAPI_VERSION};
use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::capabilities::{AppCapabilitySummaryRecord, AppExecutionCapabilityRecord};
use super::jobs::{JobSnapshot, JobStatus};
use super::policy::PolicySnapshot;
use super::workspaces::{
    ProjectRecord, ProjectReleaseRetentionPolicyApplyInput,
    ProjectReleaseRetentionPolicyApplyResultRecord, ProjectReleaseRetentionPolicyInput,
    ProjectReleaseRetentionPolicyRecord, ProjectReleaseStatsRecord, WorkspaceRecord,
    WorkspaceService,
};

const EXECUTION_STATUS_READY: &str = "ready";
const EXECUTION_STATUS_MIXED: &str = "mixed";
const EXECUTION_STATUS_LIFECYCLE_ONLY: &str = "lifecycle-only";
const EXECUTION_STATUS_PLANNED: &str = "planned";
const EXECUTION_STATUS_NOT_APPLICABLE: &str = "not-applicable";
const ADAPTER_STATUS_NOT_CONFIGURED: &str = "not-configured";
const ADAPTER_STATUS_PLANNED: &str = "planned";
const ADMIN_EXECUTION_PROVIDER_HEALTH_HEALTHY: &str = "healthy";
const ADMIN_EXECUTION_PROVIDER_HEALTH_DEGRADED: &str = "degraded";
const ADMIN_EXECUTION_PROVIDER_HEALTH_BLOCKED: &str = "blocked";
const ADMIN_EXECUTION_FAILURE_SEVERITY_WARNING: &str = "warning";
const ADMIN_EXECUTION_FAILURE_SEVERITY_CRITICAL: &str = "critical";
const ADMIN_EXECUTION_RETRY_OUTCOME_RESOLVED: &str = "resolved";
const ADMIN_EXECUTION_RETRY_OUTCOME_STILL_BLOCKED: &str = "still-blocked";
const ADMIN_EXECUTION_GOVERNANCE_SCHEMA_VERSION: &str =
    "magic-studio.admin.execution-governance.v1";
const ADMIN_EXECUTION_DEFAULT_ACTOR: &str = "system";
const ADMIN_GOVERNANCE_DEFAULT_ACTOR: &str = "system";
const ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_SCHEMA_VERSION: &str =
    "magic-studio.admin.workspace-release-retention-runs.v1";
const ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_SCHEMA_VERSION: &str =
    "magic-studio.admin.workspace-release-retention-schedules.v1";
const ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_SCHEMA_VERSION: &str =
    "magic-studio.admin.workspace-release-retention-exceptions.v1";
const ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_SCHEMA_VERSION: &str =
    "magic-studio.admin.workspace-release-retention-policy-rollouts.v1";
const ADMIN_GOVERNANCE_SCHEDULER_POLL_SECONDS: u64 = 30;
const ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_MIN_INTERVAL_MINUTES: u64 = 5;

static ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_COUNTER: AtomicU64 = AtomicU64::new(1);
static ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_COUNTER: AtomicU64 = AtomicU64::new(1);
static ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_COUNTER: AtomicU64 = AtomicU64::new(1);
static ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeploymentRecord {
    pub family: &'static str,
    pub platform: &'static str,
    pub arch: &'static str,
    pub channel: &'static str,
    pub status: &'static str,
    pub open_api_version: &'static str,
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminRuntimeRouteCountsRecord {
    pub core: usize,
    pub app: usize,
    pub admin: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminRuntimeDomainCountsRecord {
    pub canonical: usize,
    pub planned: usize,
    pub package_local: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminRuntimeExecutionCountsRecord {
    pub ready: usize,
    pub mixed: usize,
    pub lifecycle_only: usize,
    pub planned: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminRuntimeAuditRecord {
    pub deployment_family: String,
    pub runtime_mode: String,
    pub host: String,
    pub port: u16,
    pub api_base_url: String,
    pub api_version: String,
    pub open_api_version: String,
    pub runtime_os: String,
    pub runtime_arch: String,
    pub docs_path: String,
    pub open_api_path: String,
    pub data_root: String,
    pub route_counts: AdminRuntimeRouteCountsRecord,
    pub domain_counts: AdminRuntimeDomainCountsRecord,
    pub execution_counts: AdminRuntimeExecutionCountsRecord,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminJobMetricsRecord {
    pub total: usize,
    pub pending: usize,
    pub running: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub cancelled: usize,
    pub toolkit_jobs: usize,
    pub latest_created_at_ms: Option<u64>,
    pub latest_updated_at_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPolicyAuditRecord {
    pub risk_level: String,
    pub allow_dangerous_commands: bool,
    pub allow_system_paths: bool,
    pub blocked_command_count: usize,
    pub blocked_path_prefix_count: usize,
    pub preferred_work_root_count: usize,
    pub blocked_commands: Vec<String>,
    pub blocked_path_prefixes: Vec<String>,
    pub preferred_work_roots: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminStorageProviderRecord {
    pub key: String,
    pub name: String,
    pub kind: String,
    pub scope: String,
    pub path: String,
    pub exists: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionProviderRecord {
    pub key: String,
    pub name: String,
    pub domain: String,
    pub path_prefix: String,
    pub route_ids: Vec<String>,
    pub operations: Vec<String>,
    pub route_count: u64,
    pub operation_count: u64,
    pub ready_operation_count: u64,
    pub blocked_operation_count: u64,
    pub execution_status: String,
    pub adapter_status: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionProviderHealthRecord {
    pub key: String,
    pub name: String,
    pub domain: String,
    pub status: String,
    pub execution_status: String,
    pub adapter_status: String,
    pub operation_count: u64,
    pub ready_operation_count: u64,
    pub blocked_operation_count: u64,
    pub blocked_operations: Vec<String>,
    pub last_evaluated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionFailureRecord {
    pub id: String,
    pub provider_key: String,
    pub provider_name: String,
    pub domain: String,
    pub operation_key: String,
    pub execution_status: String,
    pub adapter_status: String,
    pub severity: String,
    pub message: String,
    pub acknowledged: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub acknowledgement: Option<AdminExecutionFailureAcknowledgementRecord>,
    pub retry_count: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_retry: Option<AdminExecutionFailureRetryRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionFailureAcknowledgementRecord {
    pub actor: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub acknowledged_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionFailureRetryRecord {
    pub actor: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub requested_at: String,
    pub outcome: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionProviderReconciliationRecord {
    pub actor: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub reconciled_at: String,
    pub health_status: String,
    pub active_failure_count: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionProviderDetailRecord {
    pub provider: AdminExecutionProviderRecord,
    pub health: AdminExecutionProviderHealthRecord,
    pub failures: Vec<AdminExecutionFailureRecord>,
    pub active_failure_count: u64,
    pub acknowledged_failure_count: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_reconciliation: Option<AdminExecutionProviderReconciliationRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionProviderReconcileInput {
    pub actor: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionFailureAcknowledgeInput {
    pub actor: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionFailureRetryInput {
    pub actor: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminExecutionFailureRetryResultRecord {
    pub failure_id: String,
    pub provider_key: String,
    pub outcome: String,
    pub retry: AdminExecutionFailureRetryRecord,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<AdminExecutionFailureRecord>,
    pub provider_health: AdminExecutionProviderHealthRecord,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AdminWorkspaceReleaseRetentionRunStatus {
    Succeeded,
    Partial,
    Failed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AdminWorkspaceReleaseRetentionProjectRunStatus {
    Applied,
    Skipped,
    Failed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum AdminWorkspaceReleaseRetentionExceptionMode {
    SkipEnforcement,
    DryRunOnly,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum AdminWorkspaceReleaseRetentionPolicyRolloutMode {
    DryRun,
    Apply,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionRunScopeRecord {
    pub workspace_ids: Vec<String>,
    pub project_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionProjectRunRecord {
    pub workspace_id: String,
    pub workspace_name: String,
    pub project_id: String,
    pub project_name: String,
    pub status: AdminWorkspaceReleaseRetentionProjectRunStatus,
    #[serde(default)]
    pub requested_dry_run: bool,
    #[serde(default)]
    pub effective_dry_run: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub policy: Option<ProjectReleaseRetentionPolicyRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stats_before: Option<ProjectReleaseStatsRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stats_after: Option<ProjectReleaseStatsRecord>,
    #[serde(default)]
    pub active_exception_ids: Vec<String>,
    #[serde(default)]
    pub deleted_release_ids: Vec<String>,
    #[serde(default)]
    pub pruned_release_ids: Vec<String>,
    pub deleted_count: u64,
    pub pruned_count: u64,
    pub reclaimed_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionRunRecord {
    pub id: String,
    pub status: AdminWorkspaceReleaseRetentionRunStatus,
    pub dry_run: bool,
    pub scope: AdminWorkspaceReleaseRetentionRunScopeRecord,
    pub workspace_count: u64,
    pub project_count: u64,
    pub applied_project_count: u64,
    pub skipped_project_count: u64,
    pub failed_project_count: u64,
    pub deleted_count: u64,
    pub pruned_count: u64,
    pub reclaimed_bytes: u64,
    pub started_at: String,
    pub finished_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionRunDetailRecord {
    #[serde(flatten)]
    pub run: AdminWorkspaceReleaseRetentionRunRecord,
    pub results: Vec<AdminWorkspaceReleaseRetentionProjectRunRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionRunInput {
    pub dry_run: Option<bool>,
    pub workspace_ids: Option<Vec<String>>,
    pub project_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionScheduleRecord {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub dry_run: bool,
    pub interval_minutes: u64,
    pub scope: AdminWorkspaceReleaseRetentionRunScopeRecord,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_run_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_run_status: Option<AdminWorkspaceReleaseRetentionRunStatus>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_started_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_finished_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_run_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionScheduleCreateInput {
    pub name: String,
    pub enabled: Option<bool>,
    pub dry_run: Option<bool>,
    pub interval_minutes: Option<u64>,
    pub workspace_ids: Option<Vec<String>>,
    pub project_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionScheduleUpdateInput {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub dry_run: Option<bool>,
    pub interval_minutes: Option<u64>,
    pub workspace_ids: Option<Vec<String>>,
    pub project_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionScheduleTriggerInput {
    pub dry_run: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionScheduleTriggerResultRecord {
    pub schedule: AdminWorkspaceReleaseRetentionScheduleRecord,
    pub run: AdminWorkspaceReleaseRetentionRunDetailRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionExceptionRecord {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub reason: String,
    pub mode: AdminWorkspaceReleaseRetentionExceptionMode,
    pub scope: AdminWorkspaceReleaseRetentionRunScopeRecord,
    pub starts_at: String,
    pub ends_at: String,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub updated_by: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionExceptionCreateInput {
    pub name: String,
    pub enabled: Option<bool>,
    pub reason: String,
    pub mode: AdminWorkspaceReleaseRetentionExceptionMode,
    pub workspace_ids: Option<Vec<String>>,
    pub project_ids: Option<Vec<String>>,
    pub starts_at: String,
    pub ends_at: String,
    pub actor: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionExceptionUpdateInput {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub reason: Option<String>,
    pub mode: Option<AdminWorkspaceReleaseRetentionExceptionMode>,
    pub workspace_ids: Option<Vec<String>>,
    pub project_ids: Option<Vec<String>>,
    pub starts_at: Option<String>,
    pub ends_at: Option<String>,
    pub actor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionPolicyRolloutRecord {
    pub id: String,
    pub name: String,
    pub reason: String,
    pub mode: AdminWorkspaceReleaseRetentionPolicyRolloutMode,
    pub scope: AdminWorkspaceReleaseRetentionRunScopeRecord,
    pub target_policy: ProjectReleaseRetentionPolicyInput,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stage_size: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stage_interval_minutes: Option<u64>,
    pub workspace_count: u64,
    pub project_count: u64,
    pub stage_count: u64,
    pub created_at: String,
    pub created_by: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminWorkspaceReleaseRetentionPolicyRolloutCreateInput {
    pub name: String,
    pub reason: String,
    pub mode: AdminWorkspaceReleaseRetentionPolicyRolloutMode,
    pub workspace_ids: Option<Vec<String>>,
    pub project_ids: Option<Vec<String>>,
    pub target_policy: ProjectReleaseRetentionPolicyInput,
    pub stage_size: Option<u64>,
    pub stage_interval_minutes: Option<u64>,
    pub actor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminWorkspaceReleaseRetentionRunRegistryDocument {
    pub schema_version: String,
    pub items: Vec<AdminWorkspaceReleaseRetentionRunDetailRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminWorkspaceReleaseRetentionScheduleRegistryDocument {
    pub schema_version: String,
    pub items: Vec<AdminWorkspaceReleaseRetentionScheduleRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminWorkspaceReleaseRetentionExceptionRegistryDocument {
    pub schema_version: String,
    pub items: Vec<AdminWorkspaceReleaseRetentionExceptionRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminWorkspaceReleaseRetentionPolicyRolloutRegistryDocument {
    pub schema_version: String,
    pub items: Vec<AdminWorkspaceReleaseRetentionPolicyRolloutRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredAdminExecutionFailureAcknowledgementRecord {
    pub failure_id: String,
    pub provider_key: String,
    pub actor: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub acknowledged_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredAdminExecutionFailureRetryRecord {
    pub failure_id: String,
    pub provider_key: String,
    pub actor: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub requested_at: String,
    pub outcome: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredAdminExecutionProviderReconciliationRecord {
    pub provider_key: String,
    pub actor: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub reconciled_at: String,
    pub health_status: String,
    pub active_failure_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminExecutionGovernanceRegistryDocument {
    pub schema_version: String,
    pub failure_acknowledgements: Vec<StoredAdminExecutionFailureAcknowledgementRecord>,
    pub failure_retries: Vec<StoredAdminExecutionFailureRetryRecord>,
    pub provider_reconciliations: Vec<StoredAdminExecutionProviderReconciliationRecord>,
}

#[derive(Debug, Clone)]
struct WorkspaceReleaseRetentionExecutionDirective {
    requested_dry_run: bool,
    effective_dry_run: bool,
    message: Option<String>,
    active_exception_ids: Vec<String>,
}

pub trait AdminGovernanceService: Send + Sync {
    fn list_deployments(&self, config: &ServerConfig) -> ServerResult<Vec<DeploymentRecord>>;
    fn read_runtime_audit(
        &self,
        config: &ServerConfig,
        contract: &ServerContract,
        capability_summary: &AppCapabilitySummaryRecord,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<AdminRuntimeAuditRecord>;
    fn read_job_metrics(&self, jobs: &[JobSnapshot]) -> ServerResult<AdminJobMetricsRecord>;
    fn read_policy_audit(&self, snapshot: &PolicySnapshot) -> ServerResult<AdminPolicyAuditRecord>;
    fn list_storage_providers(&self) -> ServerResult<Vec<AdminStorageProviderRecord>>;
    fn list_execution_providers(
        &self,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<Vec<AdminExecutionProviderRecord>>;
    fn list_execution_provider_health(
        &self,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<Vec<AdminExecutionProviderHealthRecord>>;
    fn read_execution_provider(
        &self,
        provider_key: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<AdminExecutionProviderDetailRecord>;
    fn reconcile_execution_provider(
        &self,
        provider_key: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionProviderReconcileInput,
    ) -> ServerResult<AdminExecutionProviderDetailRecord>;
    fn list_execution_failures(
        &self,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<Vec<AdminExecutionFailureRecord>>;
    fn acknowledge_execution_failure(
        &self,
        failure_id: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionFailureAcknowledgeInput,
    ) -> ServerResult<AdminExecutionFailureRecord>;
    fn retry_execution_failure(
        &self,
        failure_id: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionFailureRetryInput,
    ) -> ServerResult<AdminExecutionFailureRetryResultRecord>;
    fn list_workspace_release_retention_runs(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionRunRecord>>;
    fn create_workspace_release_retention_run(
        &self,
        input: AdminWorkspaceReleaseRetentionRunInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunDetailRecord>;
    fn read_workspace_release_retention_run(
        &self,
        run_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunDetailRecord>;
    fn list_workspace_release_retention_schedules(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionScheduleRecord>>;
    fn create_workspace_release_retention_schedule(
        &self,
        input: AdminWorkspaceReleaseRetentionScheduleCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord>;
    fn read_workspace_release_retention_schedule(
        &self,
        schedule_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord>;
    fn update_workspace_release_retention_schedule(
        &self,
        schedule_id: &str,
        input: AdminWorkspaceReleaseRetentionScheduleUpdateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord>;
    fn trigger_workspace_release_retention_schedule(
        &self,
        schedule_id: &str,
        input: AdminWorkspaceReleaseRetentionScheduleTriggerInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleTriggerResultRecord>;
    fn list_workspace_release_retention_exceptions(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionExceptionRecord>>;
    fn create_workspace_release_retention_exception(
        &self,
        input: AdminWorkspaceReleaseRetentionExceptionCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord>;
    fn update_workspace_release_retention_exception(
        &self,
        exception_id: &str,
        input: AdminWorkspaceReleaseRetentionExceptionUpdateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord>;
    fn delete_workspace_release_retention_exception(
        &self,
        exception_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord>;
    fn list_workspace_release_retention_policy_rollouts(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionPolicyRolloutRecord>>;
    fn create_workspace_release_retention_policy_rollout(
        &self,
        input: AdminWorkspaceReleaseRetentionPolicyRolloutCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionPolicyRolloutRecord>;
    fn start_background_workers(&self) -> ServerResult<()> {
        Ok(())
    }
}

#[derive(Clone)]
pub struct FileBackedAdminGovernanceService {
    storage_paths: AppStoragePaths,
    workspace_service: Arc<dyn WorkspaceService>,
    lock: Arc<Mutex<()>>,
    scheduler_started: Arc<AtomicBool>,
}

impl FileBackedAdminGovernanceService {
    pub fn new(
        storage_paths: AppStoragePaths,
        workspace_service: Arc<dyn WorkspaceService>,
    ) -> Self {
        Self {
            storage_paths,
            workspace_service,
            lock: Arc::new(Mutex::new(())),
            scheduler_started: Arc::new(AtomicBool::new(false)),
        }
    }

    fn admin_governance_root_dir(&self) -> std::path::PathBuf {
        self.storage_paths
            .root_dir()
            .join("admin")
            .join("governance")
    }

    fn workspace_release_retention_runs_file(&self) -> std::path::PathBuf {
        self.admin_governance_root_dir()
            .join("workspace-release-retention-runs.json")
    }

    fn workspace_release_retention_schedules_file(&self) -> std::path::PathBuf {
        self.admin_governance_root_dir()
            .join("workspace-release-retention-schedules.json")
    }

    fn workspace_release_retention_exceptions_file(&self) -> std::path::PathBuf {
        self.admin_governance_root_dir()
            .join("workspace-release-retention-exceptions.json")
    }

    fn workspace_release_retention_policy_rollouts_file(&self) -> std::path::PathBuf {
        self.admin_governance_root_dir()
            .join("workspace-release-retention-policy-rollouts.json")
    }

    fn execution_governance_file(&self) -> std::path::PathBuf {
        self.admin_governance_root_dir()
            .join("execution-governance.json")
    }

    fn ensure_admin_governance_root_dir(&self) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.admin_governance_root_dir()).map_err(|error| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_DIRECTORY_CREATE_FAILED",
                format!(
                    "failed to create admin governance directory {}: {error}",
                    self.admin_governance_root_dir().display()
                ),
            )
        })
    }

    fn default_workspace_release_retention_run_registry(
        &self,
    ) -> AdminWorkspaceReleaseRetentionRunRegistryDocument {
        AdminWorkspaceReleaseRetentionRunRegistryDocument {
            schema_version: ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_SCHEMA_VERSION.to_string(),
            items: Vec::new(),
        }
    }

    fn default_workspace_release_retention_schedule_registry(
        &self,
    ) -> AdminWorkspaceReleaseRetentionScheduleRegistryDocument {
        AdminWorkspaceReleaseRetentionScheduleRegistryDocument {
            schema_version: ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_SCHEMA_VERSION.to_string(),
            items: Vec::new(),
        }
    }

    fn default_workspace_release_retention_exception_registry(
        &self,
    ) -> AdminWorkspaceReleaseRetentionExceptionRegistryDocument {
        AdminWorkspaceReleaseRetentionExceptionRegistryDocument {
            schema_version: ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_SCHEMA_VERSION.to_string(),
            items: Vec::new(),
        }
    }

    fn default_workspace_release_retention_policy_rollout_registry(
        &self,
    ) -> AdminWorkspaceReleaseRetentionPolicyRolloutRegistryDocument {
        AdminWorkspaceReleaseRetentionPolicyRolloutRegistryDocument {
            schema_version: ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_SCHEMA_VERSION
                .to_string(),
            items: Vec::new(),
        }
    }

    fn default_execution_governance_registry(&self) -> AdminExecutionGovernanceRegistryDocument {
        AdminExecutionGovernanceRegistryDocument {
            schema_version: ADMIN_EXECUTION_GOVERNANCE_SCHEMA_VERSION.to_string(),
            failure_acknowledgements: Vec::new(),
            failure_retries: Vec::new(),
            provider_reconciliations: Vec::new(),
        }
    }

    fn load_workspace_release_retention_run_registry(
        &self,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunRegistryDocument> {
        let path = self.workspace_release_retention_runs_file();
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_workspace_release_retention_run_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_READ_FAILED",
                    format!(
                        "failed to read workspace release retention runs {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<AdminWorkspaceReleaseRetentionRunRegistryDocument>(&contents)
                .map_err(|error| {
                    ServerError::internal(
                        "ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_PARSE_FAILED",
                        format!(
                            "failed to parse workspace release retention runs {}: {error}",
                            path.display()
                        ),
                    )
                })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version =
                ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_SCHEMA_VERSION.to_string();
        }
        sort_workspace_release_retention_runs(&mut document.items);
        Ok(document)
    }

    fn persist_workspace_release_retention_run_registry(
        &self,
        document: &AdminWorkspaceReleaseRetentionRunRegistryDocument,
    ) -> ServerResult<()> {
        self.ensure_admin_governance_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_SERIALIZE_FAILED",
                format!("failed to serialize workspace release retention runs: {error}"),
            )
        })?;

        fs::write(self.workspace_release_retention_runs_file(), contents).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_WRITE_FAILED",
                format!(
                    "failed to write workspace release retention runs to {}: {error}",
                    self.workspace_release_retention_runs_file().display()
                ),
            )
        })
    }

    fn load_workspace_release_retention_schedule_registry(
        &self,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRegistryDocument> {
        let path = self.workspace_release_retention_schedules_file();
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_workspace_release_retention_schedule_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_READ_FAILED",
                    format!(
                        "failed to read workspace release retention schedules {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<
            AdminWorkspaceReleaseRetentionScheduleRegistryDocument,
        >(&contents)
        .map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_PARSE_FAILED",
                format!(
                    "failed to parse workspace release retention schedules {}: {error}",
                    path.display()
                ),
            )
        })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version =
                ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_SCHEMA_VERSION.to_string();
        }
        sort_workspace_release_retention_schedules(&mut document.items);
        Ok(document)
    }

    fn persist_workspace_release_retention_schedule_registry(
        &self,
        document: &AdminWorkspaceReleaseRetentionScheduleRegistryDocument,
    ) -> ServerResult<()> {
        self.ensure_admin_governance_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_SERIALIZE_FAILED",
                format!("failed to serialize workspace release retention schedules: {error}"),
            )
        })?;

        fs::write(self.workspace_release_retention_schedules_file(), contents).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_WRITE_FAILED",
                format!(
                    "failed to write workspace release retention schedules to {}: {error}",
                    self.workspace_release_retention_schedules_file().display()
                ),
            )
        })
    }

    fn load_workspace_release_retention_exception_registry(
        &self,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRegistryDocument> {
        let path = self.workspace_release_retention_exceptions_file();
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_workspace_release_retention_exception_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_READ_FAILED",
                    format!(
                        "failed to read workspace release retention exceptions {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<
            AdminWorkspaceReleaseRetentionExceptionRegistryDocument,
        >(&contents)
        .map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_PARSE_FAILED",
                format!(
                    "failed to parse workspace release retention exceptions {}: {error}",
                    path.display()
                ),
            )
        })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version =
                ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_SCHEMA_VERSION.to_string();
        }
        sort_workspace_release_retention_exceptions(&mut document.items);
        Ok(document)
    }

    fn persist_workspace_release_retention_exception_registry(
        &self,
        document: &AdminWorkspaceReleaseRetentionExceptionRegistryDocument,
    ) -> ServerResult<()> {
        self.ensure_admin_governance_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_SERIALIZE_FAILED",
                format!("failed to serialize workspace release retention exceptions: {error}"),
            )
        })?;

        fs::write(self.workspace_release_retention_exceptions_file(), contents).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTIONS_WRITE_FAILED",
                format!(
                    "failed to write workspace release retention exceptions to {}: {error}",
                    self.workspace_release_retention_exceptions_file().display()
                ),
            )
        })
    }

    fn load_workspace_release_retention_policy_rollout_registry(
        &self,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionPolicyRolloutRegistryDocument> {
        let path = self.workspace_release_retention_policy_rollouts_file();
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_workspace_release_retention_policy_rollout_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_READ_FAILED",
                    format!(
                        "failed to read workspace release retention policy rollouts {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<
            AdminWorkspaceReleaseRetentionPolicyRolloutRegistryDocument,
        >(&contents)
        .map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_PARSE_FAILED",
                format!(
                    "failed to parse workspace release retention policy rollouts {}: {error}",
                    path.display()
                ),
            )
        })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version =
                ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_SCHEMA_VERSION.to_string();
        }
        sort_workspace_release_retention_policy_rollouts(&mut document.items);
        Ok(document)
    }

    fn persist_workspace_release_retention_policy_rollout_registry(
        &self,
        document: &AdminWorkspaceReleaseRetentionPolicyRolloutRegistryDocument,
    ) -> ServerResult<()> {
        self.ensure_admin_governance_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_SERIALIZE_FAILED",
                format!("failed to serialize workspace release retention policy rollouts: {error}"),
            )
        })?;

        fs::write(
            self.workspace_release_retention_policy_rollouts_file(),
            contents,
        )
        .map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUTS_WRITE_FAILED",
                format!(
                    "failed to write workspace release retention policy rollouts to {}: {error}",
                    self.workspace_release_retention_policy_rollouts_file()
                        .display()
                ),
            )
        })
    }

    fn load_execution_governance_registry(
        &self,
    ) -> ServerResult<AdminExecutionGovernanceRegistryDocument> {
        let path = self.execution_governance_file();
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_execution_governance_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "ADMIN_EXECUTION_GOVERNANCE_READ_FAILED",
                    format!(
                        "failed to read execution governance registry {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<AdminExecutionGovernanceRegistryDocument>(
            &contents,
        )
        .map_err(|error| {
            ServerError::internal(
                "ADMIN_EXECUTION_GOVERNANCE_PARSE_FAILED",
                format!(
                    "failed to parse execution governance registry {}: {error}",
                    path.display()
                ),
            )
        })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version = ADMIN_EXECUTION_GOVERNANCE_SCHEMA_VERSION.to_string();
        }

        Ok(document)
    }

    fn persist_execution_governance_registry(
        &self,
        document: &AdminExecutionGovernanceRegistryDocument,
    ) -> ServerResult<()> {
        self.ensure_admin_governance_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "ADMIN_EXECUTION_GOVERNANCE_SERIALIZE_FAILED",
                format!("failed to serialize execution governance registry: {error}"),
            )
        })?;

        fs::write(self.execution_governance_file(), contents).map_err(|error| {
            ServerError::internal(
                "ADMIN_EXECUTION_GOVERNANCE_WRITE_FAILED",
                format!(
                    "failed to write execution governance registry to {}: {error}",
                    self.execution_governance_file().display()
                ),
            )
        })
    }

    fn build_workspace_release_retention_run_summary(
        &self,
        detail: &AdminWorkspaceReleaseRetentionRunDetailRecord,
    ) -> AdminWorkspaceReleaseRetentionRunRecord {
        detail.run.clone()
    }

    fn normalize_scope_ids(
        &self,
        values: Option<Vec<String>>,
        field_name: &str,
    ) -> ServerResult<Vec<String>> {
        let Some(values) = values else {
            return Ok(Vec::new());
        };

        let mut normalized = Vec::new();
        let mut seen = HashSet::new();
        for value in values {
            let trimmed = value.trim().to_string();
            if trimmed.is_empty() {
                return Err(ServerError::bad_request(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_SCOPE_INVALID",
                    format!("{field_name} must not contain empty values"),
                ));
            }
            if seen.insert(trimmed.clone()) {
                normalized.push(trimmed);
            }
        }
        Ok(normalized)
    }

    fn normalize_schedule_name(&self, value: &str) -> ServerResult<String> {
        require_non_empty_text(
            value,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_NAME_EMPTY",
            "name",
        )
    }

    fn normalize_retention_exception_name(&self, value: &str) -> ServerResult<String> {
        require_non_empty_text(
            value,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_NAME_EMPTY",
            "name",
        )
    }

    fn normalize_retention_reason(&self, value: &str, code: &str) -> ServerResult<String> {
        require_non_empty_text(value, code, "reason")
    }

    fn normalize_retention_actor(&self, value: Option<String>) -> ServerResult<String> {
        match value {
            Some(value) => require_non_empty_text(
                &value,
                "ADMIN_WORKSPACE_RELEASE_RETENTION_ACTOR_EMPTY",
                "actor",
            ),
            None => Ok(ADMIN_GOVERNANCE_DEFAULT_ACTOR.to_string()),
        }
    }

    fn normalize_retention_timestamp(&self, value: &str, field_name: &str) -> ServerResult<String> {
        let normalized = require_non_empty_text(
            value,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_TIMESTAMP_EMPTY",
            field_name,
        )?;
        OffsetDateTime::parse(&normalized, &Rfc3339).map_err(|error| {
            ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_TIMESTAMP_INVALID",
                format!("{field_name} must be a valid RFC3339 timestamp: {error}"),
            )
        })?;
        Ok(normalized)
    }

    fn normalize_execution_actor(&self, value: Option<String>) -> ServerResult<String> {
        match value {
            Some(value) => {
                require_non_empty_text(&value, "ADMIN_EXECUTION_ACTION_ACTOR_EMPTY", "actor")
            }
            None => Ok(ADMIN_EXECUTION_DEFAULT_ACTOR.to_string()),
        }
    }

    fn normalize_execution_note(&self, value: Option<String>) -> ServerResult<Option<String>> {
        match value {
            Some(value) => {
                let trimmed = value.trim();
                if trimmed.is_empty() {
                    return Err(ServerError::bad_request(
                        "ADMIN_EXECUTION_ACTION_NOTE_EMPTY",
                        "note must not be empty when provided",
                    ));
                }
                Ok(Some(trimmed.to_string()))
            }
            None => Ok(None),
        }
    }

    fn normalize_schedule_interval_minutes(&self, value: Option<u64>) -> ServerResult<u64> {
        let interval_minutes = value.ok_or_else(|| {
            ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_INTERVAL_REQUIRED",
                "intervalMinutes is required",
            )
        })?;

        if interval_minutes < ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_MIN_INTERVAL_MINUTES {
            return Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_INTERVAL_INVALID",
                format!(
                    "intervalMinutes must be at least {ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_MIN_INTERVAL_MINUTES}"
                ),
            ));
        }

        Ok(interval_minutes)
    }

    fn normalize_rollout_stage_size(&self, value: Option<u64>) -> ServerResult<Option<u64>> {
        match value {
            Some(0) => Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_STAGE_SIZE_INVALID",
                "stageSize must be greater than 0 when provided",
            )),
            Some(value) => Ok(Some(value)),
            None => Ok(None),
        }
    }

    fn normalize_rollout_stage_interval_minutes(
        &self,
        stage_size: Option<u64>,
        value: Option<u64>,
    ) -> ServerResult<Option<u64>> {
        match value {
            Some(_) if stage_size.is_none() => Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_STAGE_INTERVAL_REQUIRES_STAGE_SIZE",
                "stageIntervalMinutes requires stageSize",
            )),
            Some(0) => Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_STAGE_INTERVAL_INVALID",
                "stageIntervalMinutes must be greater than 0 when provided",
            )),
            Some(value) => Ok(Some(value)),
            None => Ok(None),
        }
    }

    fn validate_rollout_target_policy(
        &self,
        policy: &ProjectReleaseRetentionPolicyInput,
    ) -> ServerResult<()> {
        if policy.keep_latest_count == 0 {
            return Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_KEEP_LATEST_COUNT_INVALID",
                "targetPolicy.keepLatestCount must be greater than 0",
            ));
        }

        if matches!(policy.prune_deleted_older_than_days, Some(0)) {
            return Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_PRUNE_DAYS_INVALID",
                "targetPolicy.pruneDeletedOlderThanDays must be greater than 0 when provided",
            ));
        }

        Ok(())
    }

    fn build_workspace_release_retention_schedule_record(
        &self,
        input: AdminWorkspaceReleaseRetentionScheduleCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord> {
        let created_at = current_timestamp();
        let enabled = input.enabled.unwrap_or(true);
        let interval_minutes = self.normalize_schedule_interval_minutes(input.interval_minutes)?;
        let scope = AdminWorkspaceReleaseRetentionRunScopeRecord {
            workspace_ids: self.normalize_scope_ids(input.workspace_ids, "workspaceIds")?,
            project_ids: self.normalize_scope_ids(input.project_ids, "projectIds")?,
        };

        Ok(AdminWorkspaceReleaseRetentionScheduleRecord {
            id: next_workspace_release_retention_schedule_id(),
            name: self.normalize_schedule_name(&input.name)?,
            enabled,
            dry_run: input.dry_run.unwrap_or(false),
            interval_minutes,
            scope,
            last_run_id: None,
            last_run_status: None,
            last_started_at: None,
            last_finished_at: None,
            next_run_at: if enabled {
                Some(timestamp_after_minutes(&created_at, interval_minutes)?)
            } else {
                None
            },
            created_at: created_at.clone(),
            updated_at: created_at,
        })
    }

    fn build_workspace_release_retention_exception_record(
        &self,
        input: AdminWorkspaceReleaseRetentionExceptionCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord> {
        let starts_at = self.normalize_retention_timestamp(&input.starts_at, "startsAt")?;
        let ends_at = self.normalize_retention_timestamp(&input.ends_at, "endsAt")?;
        validate_retention_window(&starts_at, &ends_at)?;
        let actor = self.normalize_retention_actor(input.actor)?;
        let created_at = current_timestamp();

        Ok(AdminWorkspaceReleaseRetentionExceptionRecord {
            id: next_workspace_release_retention_exception_id(),
            name: self.normalize_retention_exception_name(&input.name)?,
            enabled: input.enabled.unwrap_or(true),
            reason: self.normalize_retention_reason(
                &input.reason,
                "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_REASON_EMPTY",
            )?,
            mode: input.mode,
            scope: AdminWorkspaceReleaseRetentionRunScopeRecord {
                workspace_ids: self.normalize_scope_ids(input.workspace_ids, "workspaceIds")?,
                project_ids: self.normalize_scope_ids(input.project_ids, "projectIds")?,
            },
            starts_at,
            ends_at,
            created_at: created_at.clone(),
            updated_at: created_at,
            created_by: actor.clone(),
            updated_by: actor,
        })
    }

    fn update_workspace_release_retention_schedule_record(
        &self,
        record: &mut AdminWorkspaceReleaseRetentionScheduleRecord,
        input: AdminWorkspaceReleaseRetentionScheduleUpdateInput,
    ) -> ServerResult<()> {
        if let Some(name) = input.name {
            record.name = self.normalize_schedule_name(&name)?;
        }

        if let Some(dry_run) = input.dry_run {
            record.dry_run = dry_run;
        }

        if let Some(enabled) = input.enabled {
            record.enabled = enabled;
        }

        if input.interval_minutes.is_some() {
            record.interval_minutes =
                self.normalize_schedule_interval_minutes(input.interval_minutes)?;
        }

        if input.workspace_ids.is_some() {
            record.scope.workspace_ids =
                self.normalize_scope_ids(input.workspace_ids, "workspaceIds")?;
        }

        if input.project_ids.is_some() {
            record.scope.project_ids = self.normalize_scope_ids(input.project_ids, "projectIds")?;
        }

        let updated_at = current_timestamp();
        record.updated_at = updated_at.clone();
        record.next_run_at = if record.enabled {
            Some(timestamp_after_minutes(
                &updated_at,
                record.interval_minutes,
            )?)
        } else {
            None
        };

        Ok(())
    }

    fn update_workspace_release_retention_exception_record(
        &self,
        record: &mut AdminWorkspaceReleaseRetentionExceptionRecord,
        input: AdminWorkspaceReleaseRetentionExceptionUpdateInput,
    ) -> ServerResult<()> {
        let has_business_fields = input.name.is_some()
            || input.enabled.is_some()
            || input.reason.is_some()
            || input.mode.is_some()
            || input.workspace_ids.is_some()
            || input.project_ids.is_some()
            || input.starts_at.is_some()
            || input.ends_at.is_some();

        if !has_business_fields {
            return Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_UPDATE_EMPTY",
                "at least one mutable exception field must be provided",
            ));
        }

        if let Some(name) = input.name {
            record.name = self.normalize_retention_exception_name(&name)?;
        }
        if let Some(enabled) = input.enabled {
            record.enabled = enabled;
        }
        if let Some(reason) = input.reason {
            record.reason = self.normalize_retention_reason(
                &reason,
                "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_REASON_EMPTY",
            )?;
        }
        if let Some(mode) = input.mode {
            record.mode = mode;
        }
        if input.workspace_ids.is_some() {
            record.scope.workspace_ids =
                self.normalize_scope_ids(input.workspace_ids, "workspaceIds")?;
        }
        if input.project_ids.is_some() {
            record.scope.project_ids = self.normalize_scope_ids(input.project_ids, "projectIds")?;
        }
        if let Some(starts_at) = input.starts_at {
            record.starts_at = self.normalize_retention_timestamp(&starts_at, "startsAt")?;
        }
        if let Some(ends_at) = input.ends_at {
            record.ends_at = self.normalize_retention_timestamp(&ends_at, "endsAt")?;
        }
        validate_retention_window(&record.starts_at, &record.ends_at)?;
        record.updated_at = current_timestamp();
        record.updated_by = self.normalize_retention_actor(input.actor)?;
        Ok(())
    }

    fn build_workspace_release_retention_policy_rollout_record(
        &self,
        input: AdminWorkspaceReleaseRetentionPolicyRolloutCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionPolicyRolloutRecord> {
        let actor = self.normalize_retention_actor(input.actor)?;
        let name = self.normalize_retention_exception_name(&input.name)?;
        let reason = self.normalize_retention_reason(
            &input.reason,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_REASON_EMPTY",
        )?;
        let scope = AdminWorkspaceReleaseRetentionRunScopeRecord {
            workspace_ids: self.normalize_scope_ids(input.workspace_ids, "workspaceIds")?,
            project_ids: self.normalize_scope_ids(input.project_ids, "projectIds")?,
        };
        let stage_size = self.normalize_rollout_stage_size(input.stage_size)?;
        let stage_interval_minutes = self
            .normalize_rollout_stage_interval_minutes(stage_size, input.stage_interval_minutes)?;
        self.validate_rollout_target_policy(&input.target_policy)?;

        let workspaces = self.workspace_service.list_workspaces()?;
        let targets = self.resolve_workspace_release_retention_targets(
            &workspaces,
            &scope.workspace_ids,
            &scope.project_ids,
        )?;
        let workspace_count = targets
            .iter()
            .map(|(workspace, _)| workspace.id.clone())
            .collect::<HashSet<_>>()
            .len() as u64;
        let project_count = targets.len() as u64;
        let stage_count = compute_rollout_stage_count(project_count, stage_size);
        let created_at = current_timestamp();

        Ok(AdminWorkspaceReleaseRetentionPolicyRolloutRecord {
            id: next_workspace_release_retention_policy_rollout_id(),
            name,
            reason,
            mode: input.mode,
            scope,
            target_policy: input.target_policy,
            stage_size,
            stage_interval_minutes,
            workspace_count,
            project_count,
            stage_count,
            created_at,
            created_by: actor,
        })
    }

    fn execute_workspace_release_retention_run_unlocked(
        &self,
        input: AdminWorkspaceReleaseRetentionRunInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunDetailRecord> {
        let mut document = self.load_workspace_release_retention_run_registry()?;
        let detail = self.execute_workspace_release_retention_run(input)?;
        document.items.push(detail.clone());
        sort_workspace_release_retention_runs(&mut document.items);
        self.persist_workspace_release_retention_run_registry(&document)?;
        Ok(detail)
    }

    fn apply_schedule_run_outcome(
        &self,
        schedule: &mut AdminWorkspaceReleaseRetentionScheduleRecord,
        run: &AdminWorkspaceReleaseRetentionRunDetailRecord,
    ) -> ServerResult<()> {
        schedule.last_run_id = Some(run.run.id.clone());
        schedule.last_run_status = Some(run.run.status);
        schedule.last_started_at = Some(run.run.started_at.clone());
        schedule.last_finished_at = Some(run.run.finished_at.clone());
        schedule.updated_at = run.run.finished_at.clone();
        schedule.next_run_at = if schedule.enabled {
            Some(timestamp_after_minutes(
                &run.run.finished_at,
                schedule.interval_minutes,
            )?)
        } else {
            None
        };
        Ok(())
    }

    fn apply_schedule_failure(
        &self,
        schedule: &mut AdminWorkspaceReleaseRetentionScheduleRecord,
        started_at: String,
        finished_at: String,
    ) -> ServerResult<()> {
        schedule.last_run_status = Some(AdminWorkspaceReleaseRetentionRunStatus::Failed);
        schedule.last_started_at = Some(started_at);
        schedule.last_finished_at = Some(finished_at.clone());
        schedule.updated_at = finished_at.clone();
        schedule.next_run_at = if schedule.enabled {
            Some(timestamp_after_minutes(
                &finished_at,
                schedule.interval_minutes,
            )?)
        } else {
            None
        };
        Ok(())
    }

    fn find_workspace_release_retention_schedule_mut<'a>(
        &self,
        items: &'a mut [AdminWorkspaceReleaseRetentionScheduleRecord],
        schedule_id: &str,
    ) -> ServerResult<&'a mut AdminWorkspaceReleaseRetentionScheduleRecord> {
        let normalized_schedule_id = require_non_empty_text(
            schedule_id,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_ID_EMPTY",
            "scheduleId",
        )?;

        items
            .iter_mut()
            .find(|item| item.id == normalized_schedule_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_NOT_FOUND",
                    format!(
                        "workspace release retention schedule {normalized_schedule_id} was not found"
                    ),
                )
            })
    }

    fn find_workspace_release_retention_exception_mut<'a>(
        &self,
        items: &'a mut [AdminWorkspaceReleaseRetentionExceptionRecord],
        exception_id: &str,
    ) -> ServerResult<&'a mut AdminWorkspaceReleaseRetentionExceptionRecord> {
        let normalized_exception_id = require_non_empty_text(
            exception_id,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_ID_EMPTY",
            "exceptionId",
        )?;

        items
            .iter_mut()
            .find(|item| item.id == normalized_exception_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_NOT_FOUND",
                    format!(
                        "workspace release retention exception {normalized_exception_id} was not found"
                    ),
                )
            })
    }

    fn read_workspace_release_retention_schedule_unlocked(
        &self,
        schedule_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord> {
        let normalized_schedule_id = require_non_empty_text(
            schedule_id,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_ID_EMPTY",
            "scheduleId",
        )?;
        let document = self.load_workspace_release_retention_schedule_registry()?;
        document
            .items
            .into_iter()
            .find(|item| item.id == normalized_schedule_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_NOT_FOUND",
                    format!(
                        "workspace release retention schedule {normalized_schedule_id} was not found"
                    ),
                )
            })
    }

    fn trigger_workspace_release_retention_schedule_unlocked(
        &self,
        schedule_id: &str,
        input: AdminWorkspaceReleaseRetentionScheduleTriggerInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleTriggerResultRecord> {
        let mut schedule_document = self.load_workspace_release_retention_schedule_registry()?;
        let detail;
        let schedule_snapshot;
        {
            let schedule = self.find_workspace_release_retention_schedule_mut(
                &mut schedule_document.items,
                schedule_id,
            )?;
            detail = self.execute_workspace_release_retention_run_unlocked(
                AdminWorkspaceReleaseRetentionRunInput {
                    dry_run: Some(input.dry_run.unwrap_or(schedule.dry_run)),
                    workspace_ids: Some(schedule.scope.workspace_ids.clone()),
                    project_ids: Some(schedule.scope.project_ids.clone()),
                },
            )?;
            self.apply_schedule_run_outcome(schedule, &detail)?;
            schedule_snapshot = schedule.clone();
        }
        sort_workspace_release_retention_schedules(&mut schedule_document.items);
        self.persist_workspace_release_retention_schedule_registry(&schedule_document)?;
        Ok(AdminWorkspaceReleaseRetentionScheduleTriggerResultRecord {
            schedule: schedule_snapshot,
            run: detail,
        })
    }

    fn reconcile_due_workspace_release_retention_schedules(&self) -> ServerResult<()> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let now = OffsetDateTime::now_utc();
        let mut schedule_document = self.load_workspace_release_retention_schedule_registry()?;
        let mut changed = false;

        for schedule in &mut schedule_document.items {
            if !schedule.enabled || !is_schedule_due(schedule, now) {
                continue;
            }

            changed = true;
            let started_at = current_timestamp();
            let run_result = self.execute_workspace_release_retention_run_unlocked(
                AdminWorkspaceReleaseRetentionRunInput {
                    dry_run: Some(schedule.dry_run),
                    workspace_ids: Some(schedule.scope.workspace_ids.clone()),
                    project_ids: Some(schedule.scope.project_ids.clone()),
                },
            );

            match run_result {
                Ok(detail) => {
                    self.apply_schedule_run_outcome(schedule, &detail)?;
                }
                Err(error) => {
                    let finished_at = current_timestamp();
                    self.apply_schedule_failure(schedule, started_at, finished_at)?;
                    eprintln!(
                        "Magic Studio admin governance scheduler failed to execute retention schedule {}: {}",
                        schedule.id, error.message
                    );
                }
            }
        }

        if changed {
            sort_workspace_release_retention_schedules(&mut schedule_document.items);
            self.persist_workspace_release_retention_schedule_registry(&schedule_document)?;
        }

        Ok(())
    }

    async fn run_scheduler_loop(self) {
        loop {
            if let Err(error) = self.reconcile_due_workspace_release_retention_schedules() {
                eprintln!(
                    "Magic Studio admin governance scheduler reconcile failed: {}",
                    error.message
                );
            }
            sleep(StdDuration::from_secs(
                ADMIN_GOVERNANCE_SCHEDULER_POLL_SECONDS,
            ))
            .await;
        }
    }

    fn resolve_workspace_release_retention_targets(
        &self,
        workspaces: &[WorkspaceRecord],
        workspace_ids: &[String],
        project_ids: &[String],
    ) -> ServerResult<Vec<(WorkspaceRecord, ProjectRecord)>> {
        let workspace_scope = workspace_ids.iter().cloned().collect::<HashSet<_>>();
        let project_scope = project_ids.iter().cloned().collect::<HashSet<_>>();
        let mut targets = Vec::new();

        for workspace in workspaces {
            if !workspace_scope.is_empty()
                && !workspace_scope.contains(&workspace.id)
                && !workspace_scope.contains(&workspace.uuid)
            {
                continue;
            }

            for project in &workspace.projects {
                if !project_scope.is_empty()
                    && !project_scope.contains(&project.id)
                    && !project_scope.contains(&project.uuid)
                {
                    continue;
                }

                targets.push((workspace.clone(), project.clone()));
            }
        }

        if targets.is_empty() {
            return Err(ServerError::bad_request(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_SCOPE_EMPTY",
                "no workspace projects matched the requested retention run scope",
            ));
        }

        Ok(targets)
    }

    fn execute_workspace_release_retention_run(
        &self,
        input: AdminWorkspaceReleaseRetentionRunInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunDetailRecord> {
        let workspace_ids = self.normalize_scope_ids(input.workspace_ids, "workspaceIds")?;
        let project_ids = self.normalize_scope_ids(input.project_ids, "projectIds")?;
        let dry_run = input.dry_run.unwrap_or(false);
        let started_at = current_timestamp();
        let workspaces = self.workspace_service.list_workspaces()?;
        let exceptions = self
            .load_workspace_release_retention_exception_registry()?
            .items;
        let targets = self.resolve_workspace_release_retention_targets(
            &workspaces,
            &workspace_ids,
            &project_ids,
        )?;
        let mut results = Vec::new();
        let mut applied_project_count = 0_u64;
        let mut skipped_project_count = 0_u64;
        let mut failed_project_count = 0_u64;
        let mut deleted_count = 0_u64;
        let mut pruned_count = 0_u64;
        let mut reclaimed_bytes = 0_u64;
        let mut touched_workspaces = HashSet::new();
        let now = OffsetDateTime::now_utc();

        for (workspace, project) in targets {
            touched_workspaces.insert(workspace.id.clone());
            let directive = build_workspace_release_retention_execution_directive(
                &exceptions,
                &workspace,
                &project,
                dry_run,
                now,
            );
            let project_result = self.execute_workspace_release_retention_project_run(
                &workspace,
                &project,
                directive.clone(),
            );
            match &project_result {
                Ok(result) => {
                    match result.status {
                        AdminWorkspaceReleaseRetentionProjectRunStatus::Applied => {
                            applied_project_count += 1;
                            deleted_count += result.deleted_count;
                            pruned_count += result.pruned_count;
                            reclaimed_bytes += result.reclaimed_bytes;
                        }
                        AdminWorkspaceReleaseRetentionProjectRunStatus::Skipped => {
                            skipped_project_count += 1;
                        }
                        AdminWorkspaceReleaseRetentionProjectRunStatus::Failed => {
                            failed_project_count += 1;
                        }
                    }
                    results.push(result.clone());
                }
                Err(error) => {
                    failed_project_count += 1;
                    results.push(AdminWorkspaceReleaseRetentionProjectRunRecord {
                        workspace_id: workspace.uuid.clone(),
                        workspace_name: workspace.name.clone(),
                        project_id: project.uuid.clone(),
                        project_name: project.name.clone(),
                        status: AdminWorkspaceReleaseRetentionProjectRunStatus::Failed,
                        requested_dry_run: directive.requested_dry_run,
                        effective_dry_run: directive.effective_dry_run,
                        message: Some(error.message.clone()),
                        policy: None,
                        stats_before: None,
                        stats_after: None,
                        active_exception_ids: directive.active_exception_ids.clone(),
                        deleted_release_ids: Vec::new(),
                        pruned_release_ids: Vec::new(),
                        deleted_count: 0,
                        pruned_count: 0,
                        reclaimed_bytes: 0,
                    });
                }
            }
        }

        let project_count = results.len() as u64;
        let status = if failed_project_count == 0 {
            AdminWorkspaceReleaseRetentionRunStatus::Succeeded
        } else if failed_project_count == project_count {
            AdminWorkspaceReleaseRetentionRunStatus::Failed
        } else {
            AdminWorkspaceReleaseRetentionRunStatus::Partial
        };
        let finished_at = current_timestamp();
        let run_id = next_workspace_release_retention_run_id();
        Ok(AdminWorkspaceReleaseRetentionRunDetailRecord {
            run: AdminWorkspaceReleaseRetentionRunRecord {
                id: run_id,
                status,
                dry_run,
                scope: AdminWorkspaceReleaseRetentionRunScopeRecord {
                    workspace_ids,
                    project_ids,
                },
                workspace_count: touched_workspaces.len() as u64,
                project_count,
                applied_project_count,
                skipped_project_count,
                failed_project_count,
                deleted_count,
                pruned_count,
                reclaimed_bytes,
                started_at,
                finished_at,
            },
            results,
        })
    }

    fn execute_workspace_release_retention_project_run(
        &self,
        workspace: &WorkspaceRecord,
        project: &ProjectRecord,
        directive: WorkspaceReleaseRetentionExecutionDirective,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionProjectRunRecord> {
        let policy = self
            .workspace_service
            .read_project_release_retention_policy(&workspace.id, &project.id)?;
        let stats_before = self
            .workspace_service
            .read_project_release_stats(&workspace.id, &project.id)?;

        if let Some(message) = directive.message.clone() {
            return Ok(AdminWorkspaceReleaseRetentionProjectRunRecord {
                workspace_id: workspace.uuid.clone(),
                workspace_name: workspace.name.clone(),
                project_id: project.uuid.clone(),
                project_name: project.name.clone(),
                status: AdminWorkspaceReleaseRetentionProjectRunStatus::Skipped,
                requested_dry_run: directive.requested_dry_run,
                effective_dry_run: directive.effective_dry_run,
                message: Some(message),
                policy: Some(policy),
                stats_before: Some(stats_before.clone()),
                stats_after: Some(stats_before),
                active_exception_ids: directive.active_exception_ids,
                deleted_release_ids: Vec::new(),
                pruned_release_ids: Vec::new(),
                deleted_count: 0,
                pruned_count: 0,
                reclaimed_bytes: 0,
            });
        }

        if !policy.enabled {
            return Ok(AdminWorkspaceReleaseRetentionProjectRunRecord {
                workspace_id: workspace.uuid.clone(),
                workspace_name: workspace.name.clone(),
                project_id: project.uuid.clone(),
                project_name: project.name.clone(),
                status: AdminWorkspaceReleaseRetentionProjectRunStatus::Skipped,
                requested_dry_run: directive.requested_dry_run,
                effective_dry_run: directive.effective_dry_run,
                message: Some("project release retention policy is disabled".to_string()),
                policy: Some(policy),
                stats_before: Some(stats_before.clone()),
                stats_after: Some(stats_before),
                active_exception_ids: directive.active_exception_ids,
                deleted_release_ids: Vec::new(),
                pruned_release_ids: Vec::new(),
                deleted_count: 0,
                pruned_count: 0,
                reclaimed_bytes: 0,
            });
        }

        let apply_result = self
            .workspace_service
            .apply_project_release_retention_policy(
                &workspace.id,
                &project.id,
                ProjectReleaseRetentionPolicyApplyInput {
                    dry_run: Some(directive.effective_dry_run),
                },
            )?;

        Ok(build_workspace_release_retention_project_run_record(
            workspace,
            project,
            apply_result,
            directive,
        ))
    }

    fn build_execution_provider_detail_unlocked(
        &self,
        provider_key: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        registry: &AdminExecutionGovernanceRegistryDocument,
    ) -> ServerResult<AdminExecutionProviderDetailRecord> {
        let capability = find_execution_capability(execution_capabilities, provider_key)?;
        let evaluated_at = current_timestamp();
        let provider = build_admin_execution_provider_record(capability);
        let health = build_admin_execution_provider_health_record(capability, &evaluated_at);
        let failures = build_admin_execution_failure_records(capability, registry);
        let active_failure_count = failures.len() as u64;
        let acknowledged_failure_count = failures
            .iter()
            .filter(|failure| failure.acknowledged)
            .count() as u64;

        Ok(AdminExecutionProviderDetailRecord {
            provider,
            health,
            failures,
            active_failure_count,
            acknowledged_failure_count,
            last_reconciliation: latest_provider_reconciliation(registry, &capability.key),
        })
    }

    fn acknowledge_execution_failure_unlocked(
        &self,
        failure_id: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionFailureAcknowledgeInput,
    ) -> ServerResult<AdminExecutionFailureRecord> {
        let mut registry = self.load_execution_governance_registry()?;
        let (capability, operation) =
            resolve_active_execution_failure(execution_capabilities, failure_id)?;
        let actor = self.normalize_execution_actor(input.actor)?;
        let note = self.normalize_execution_note(input.note)?;
        let normalized_failure_id = compose_execution_failure_id(&capability.key, &operation.key);

        registry
            .failure_acknowledgements
            .push(StoredAdminExecutionFailureAcknowledgementRecord {
                failure_id: normalized_failure_id,
                provider_key: capability.key.clone(),
                actor,
                note,
                acknowledged_at: current_timestamp(),
            });
        self.persist_execution_governance_registry(&registry)?;

        Ok(build_admin_execution_failure_record(
            capability, operation, &registry,
        ))
    }

    fn retry_execution_failure_unlocked(
        &self,
        failure_id: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionFailureRetryInput,
    ) -> ServerResult<AdminExecutionFailureRetryResultRecord> {
        let mut registry = self.load_execution_governance_registry()?;
        let (provider_key, operation_key) = parse_execution_failure_id(failure_id)?;
        let capability = find_execution_capability(execution_capabilities, &provider_key)?;
        let operation = find_execution_operation(capability, &operation_key)?;
        let actor = self.normalize_execution_actor(input.actor)?;
        let note = self.normalize_execution_note(input.note)?;
        let requested_at = current_timestamp();
        let outcome = if is_execution_operation_blocked(operation.execution_status.as_str()) {
            ADMIN_EXECUTION_RETRY_OUTCOME_STILL_BLOCKED
        } else {
            ADMIN_EXECUTION_RETRY_OUTCOME_RESOLVED
        };

        registry
            .failure_retries
            .push(StoredAdminExecutionFailureRetryRecord {
                failure_id: compose_execution_failure_id(&provider_key, &operation_key),
                provider_key: capability.key.clone(),
                actor: actor.clone(),
                note: note.clone(),
                requested_at: requested_at.clone(),
                outcome: outcome.to_string(),
            });
        self.persist_execution_governance_registry(&registry)?;

        let retry = AdminExecutionFailureRetryRecord {
            actor,
            note,
            requested_at: requested_at.clone(),
            outcome: outcome.to_string(),
        };
        let provider_health =
            build_admin_execution_provider_health_record(capability, &requested_at);
        let failure = if is_execution_operation_blocked(operation.execution_status.as_str()) {
            Some(build_admin_execution_failure_record(
                capability, operation, &registry,
            ))
        } else {
            None
        };

        Ok(AdminExecutionFailureRetryResultRecord {
            failure_id: compose_execution_failure_id(&provider_key, &operation_key),
            provider_key,
            outcome: outcome.to_string(),
            retry,
            failure,
            provider_health,
        })
    }
}

impl AdminGovernanceService for FileBackedAdminGovernanceService {
    fn list_deployments(&self, config: &ServerConfig) -> ServerResult<Vec<DeploymentRecord>> {
        Ok(vec![DeploymentRecord {
            family: config.deployment_family(),
            platform: std::env::consts::OS,
            arch: std::env::consts::ARCH,
            channel: "local",
            status: "active",
            open_api_version: MAGIC_STUDIO_OPENAPI_VERSION,
            checksum: None,
        }])
    }

    fn read_runtime_audit(
        &self,
        config: &ServerConfig,
        contract: &ServerContract,
        capability_summary: &AppCapabilitySummaryRecord,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<AdminRuntimeAuditRecord> {
        let execution_counts = AdminRuntimeExecutionCountsRecord {
            ready: count_execution_status(execution_capabilities, EXECUTION_STATUS_READY),
            mixed: count_execution_status(execution_capabilities, EXECUTION_STATUS_MIXED),
            lifecycle_only: count_execution_status(
                execution_capabilities,
                EXECUTION_STATUS_LIFECYCLE_ONLY,
            ),
            planned: count_execution_status(execution_capabilities, EXECUTION_STATUS_PLANNED),
        };

        Ok(AdminRuntimeAuditRecord {
            deployment_family: config.deployment_family().to_string(),
            runtime_mode: config.runtime_mode().as_str().to_string(),
            host: config.host().to_string(),
            port: config.port(),
            api_base_url: config.api_base_url(),
            api_version: contract.api_version.clone(),
            open_api_version: MAGIC_STUDIO_OPENAPI_VERSION.to_string(),
            runtime_os: std::env::consts::OS.to_string(),
            runtime_arch: std::env::consts::ARCH.to_string(),
            docs_path: contract.meta.docs_path.clone(),
            open_api_path: contract.meta.live_open_api_path.clone(),
            data_root: self.storage_paths.root_dir().display().to_string(),
            route_counts: AdminRuntimeRouteCountsRecord {
                core: capability_summary.route_counts.core,
                app: capability_summary.route_counts.app,
                admin: capability_summary.route_counts.admin,
                total: capability_summary.route_counts.total,
            },
            domain_counts: AdminRuntimeDomainCountsRecord {
                canonical: capability_summary.extracted_domain_count,
                planned: capability_summary.planned_domain_count,
                package_local: capability_summary.package_local_domain_count,
            },
            execution_counts,
        })
    }

    fn read_job_metrics(&self, jobs: &[JobSnapshot]) -> ServerResult<AdminJobMetricsRecord> {
        let latest_created_at_ms = jobs.iter().map(|job| job.created_at_ms).max();
        let latest_updated_at_ms = jobs.iter().map(|job| job.updated_at_ms).max();

        Ok(AdminJobMetricsRecord {
            total: jobs.len(),
            pending: count_jobs_with_status(jobs, JobStatus::Pending),
            running: count_jobs_with_status(jobs, JobStatus::Running),
            succeeded: count_jobs_with_status(jobs, JobStatus::Succeeded),
            failed: count_jobs_with_status(jobs, JobStatus::Failed),
            cancelled: count_jobs_with_status(jobs, JobStatus::Cancelled),
            toolkit_jobs: jobs.len(),
            latest_created_at_ms,
            latest_updated_at_ms,
        })
    }

    fn read_policy_audit(&self, snapshot: &PolicySnapshot) -> ServerResult<AdminPolicyAuditRecord> {
        Ok(AdminPolicyAuditRecord {
            risk_level: if snapshot.allow_dangerous_commands || snapshot.allow_system_paths {
                "elevated".to_string()
            } else if snapshot.blocked_commands.is_empty()
                && snapshot.blocked_path_prefixes.is_empty()
            {
                "low".to_string()
            } else {
                "guarded".to_string()
            },
            allow_dangerous_commands: snapshot.allow_dangerous_commands,
            allow_system_paths: snapshot.allow_system_paths,
            blocked_command_count: snapshot.blocked_commands.len(),
            blocked_path_prefix_count: snapshot.blocked_path_prefixes.len(),
            preferred_work_root_count: snapshot.preferred_work_roots.len(),
            blocked_commands: snapshot.blocked_commands.clone(),
            blocked_path_prefixes: snapshot.blocked_path_prefixes.clone(),
            preferred_work_roots: snapshot.preferred_work_roots.clone(),
        })
    }

    fn list_storage_providers(&self) -> ServerResult<Vec<AdminStorageProviderRecord>> {
        Ok(vec![
            storage_provider(
                "root",
                "Application Storage Root",
                "directory",
                "runtime",
                self.storage_paths.root_dir(),
            ),
            storage_provider(
                "settings",
                "Application Settings",
                "file",
                "settings",
                self.storage_paths.settings_file(),
            ),
            storage_provider(
                "notifications",
                "Notifications Registry",
                "file",
                "notifications",
                self.storage_paths.notifications_file(),
            ),
            storage_provider(
                "plugins",
                "Plugin Registry",
                "file",
                "plugins",
                self.storage_paths.plugins_registry_file(),
            ),
            storage_provider(
                "identity",
                "Identity Registry",
                "file",
                "identity",
                self.storage_paths.identity_registry_file(),
            ),
            storage_provider(
                "generation",
                "Generation Registry",
                "file",
                "generation",
                self.storage_paths.generation_registry_file(),
            ),
            storage_provider(
                "voices",
                "Voices Registry",
                "file",
                "voices",
                self.storage_paths.voices_registry_file(),
            ),
            storage_provider(
                "workspaces",
                "Workspace Catalog",
                "file",
                "workspace",
                self.storage_paths.workspaces_file(),
            ),
            storage_provider(
                "workspaces-root",
                "Workspace Root",
                "directory",
                "workspace",
                self.storage_paths.workspaces_root_dir(),
            ),
            storage_provider(
                "admin-workspace-release-retention-runs",
                "Workspace Release Retention Run Ledger",
                "file",
                "admin-governance",
                &self.workspace_release_retention_runs_file(),
            ),
            storage_provider(
                "admin-workspace-release-retention-schedules",
                "Workspace Release Retention Schedule Ledger",
                "file",
                "admin-governance",
                &self.workspace_release_retention_schedules_file(),
            ),
            storage_provider(
                "admin-workspace-release-retention-exceptions",
                "Workspace Release Retention Exception Ledger",
                "file",
                "admin-governance",
                &self.workspace_release_retention_exceptions_file(),
            ),
            storage_provider(
                "admin-workspace-release-retention-policy-rollouts",
                "Workspace Release Retention Policy Rollout Ledger",
                "file",
                "admin-governance",
                &self.workspace_release_retention_policy_rollouts_file(),
            ),
            storage_provider(
                "assets-catalog",
                "Assets Catalog",
                "file",
                "assets",
                self.storage_paths.assets_catalog_file(),
            ),
            storage_provider(
                "managed-assets",
                "Managed Assets Root",
                "directory",
                "assets",
                self.storage_paths.managed_assets_root_dir(),
            ),
            storage_provider(
                "generated-outputs",
                "Generated Outputs Root",
                "directory",
                "generation",
                self.storage_paths.generated_outputs_root_dir(),
            ),
            storage_provider(
                "notes",
                "Notes Registry",
                "file",
                "notes",
                self.storage_paths.notes_registry_file(),
            ),
            storage_provider(
                "drive",
                "Drive Registry",
                "file",
                "drive",
                self.storage_paths.drive_registry_file(),
            ),
            storage_provider(
                "drive-files",
                "Drive Files Root",
                "directory",
                "drive",
                self.storage_paths.drive_files_root_dir(),
            ),
        ])
    }

    fn list_execution_providers(
        &self,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<Vec<AdminExecutionProviderRecord>> {
        let mut records = execution_capabilities
            .iter()
            .map(build_admin_execution_provider_record)
            .collect::<Vec<_>>();
        sort_admin_execution_providers(&mut records);
        Ok(records)
    }

    fn list_execution_provider_health(
        &self,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<Vec<AdminExecutionProviderHealthRecord>> {
        let evaluated_at = current_timestamp();
        let mut records = execution_capabilities
            .iter()
            .map(|capability| {
                build_admin_execution_provider_health_record(capability, &evaluated_at)
            })
            .collect::<Vec<_>>();
        sort_admin_execution_provider_health(&mut records);
        Ok(records)
    }

    fn read_execution_provider(
        &self,
        provider_key: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<AdminExecutionProviderDetailRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let registry = self.load_execution_governance_registry()?;
        self.build_execution_provider_detail_unlocked(
            provider_key,
            execution_capabilities,
            &registry,
        )
    }

    fn reconcile_execution_provider(
        &self,
        provider_key: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionProviderReconcileInput,
    ) -> ServerResult<AdminExecutionProviderDetailRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let mut registry = self.load_execution_governance_registry()?;
        let detail = self.build_execution_provider_detail_unlocked(
            provider_key,
            execution_capabilities,
            &registry,
        )?;
        let actor = self.normalize_execution_actor(input.actor)?;
        let note = self.normalize_execution_note(input.note)?;

        registry
            .provider_reconciliations
            .push(StoredAdminExecutionProviderReconciliationRecord {
                provider_key: detail.provider.key.clone(),
                actor,
                note,
                reconciled_at: detail.health.last_evaluated_at.clone(),
                health_status: detail.health.status.clone(),
                active_failure_count: detail.active_failure_count,
            });
        self.persist_execution_governance_registry(&registry)?;

        self.build_execution_provider_detail_unlocked(
            provider_key,
            execution_capabilities,
            &registry,
        )
    }

    fn list_execution_failures(
        &self,
        execution_capabilities: &[AppExecutionCapabilityRecord],
    ) -> ServerResult<Vec<AdminExecutionFailureRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let registry = self.load_execution_governance_registry()?;
        let mut records = execution_capabilities
            .iter()
            .flat_map(|capability| build_admin_execution_failure_records(capability, &registry))
            .collect::<Vec<_>>();
        sort_admin_execution_failures(&mut records);
        Ok(records)
    }

    fn acknowledge_execution_failure(
        &self,
        failure_id: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionFailureAcknowledgeInput,
    ) -> ServerResult<AdminExecutionFailureRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        self.acknowledge_execution_failure_unlocked(failure_id, execution_capabilities, input)
    }

    fn retry_execution_failure(
        &self,
        failure_id: &str,
        execution_capabilities: &[AppExecutionCapabilityRecord],
        input: AdminExecutionFailureRetryInput,
    ) -> ServerResult<AdminExecutionFailureRetryResultRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        self.retry_execution_failure_unlocked(failure_id, execution_capabilities, input)
    }

    fn list_workspace_release_retention_runs(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionRunRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let document = self.load_workspace_release_retention_run_registry()?;
        Ok(document
            .items
            .iter()
            .map(|detail| self.build_workspace_release_retention_run_summary(detail))
            .collect())
    }

    fn create_workspace_release_retention_run(
        &self,
        input: AdminWorkspaceReleaseRetentionRunInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunDetailRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        self.execute_workspace_release_retention_run_unlocked(input)
    }

    fn read_workspace_release_retention_run(
        &self,
        run_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionRunDetailRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let normalized_run_id = require_non_empty_text(
            run_id,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_ID_EMPTY",
            "runId",
        )?;
        let document = self.load_workspace_release_retention_run_registry()?;
        document
            .items
            .into_iter()
            .find(|detail| detail.run.id == normalized_run_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_NOT_FOUND",
                    format!("workspace release retention run {normalized_run_id} was not found"),
                )
            })
    }

    fn list_workspace_release_retention_schedules(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionScheduleRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        Ok(self
            .load_workspace_release_retention_schedule_registry()?
            .items)
    }

    fn create_workspace_release_retention_schedule(
        &self,
        input: AdminWorkspaceReleaseRetentionScheduleCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let mut document = self.load_workspace_release_retention_schedule_registry()?;
        let schedule = self.build_workspace_release_retention_schedule_record(input)?;
        document.items.push(schedule.clone());
        sort_workspace_release_retention_schedules(&mut document.items);
        self.persist_workspace_release_retention_schedule_registry(&document)?;
        Ok(schedule)
    }

    fn read_workspace_release_retention_schedule(
        &self,
        schedule_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        self.read_workspace_release_retention_schedule_unlocked(schedule_id)
    }

    fn update_workspace_release_retention_schedule(
        &self,
        schedule_id: &str,
        input: AdminWorkspaceReleaseRetentionScheduleUpdateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let mut document = self.load_workspace_release_retention_schedule_registry()?;
        let updated_schedule = {
            let schedule = self
                .find_workspace_release_retention_schedule_mut(&mut document.items, schedule_id)?;
            self.update_workspace_release_retention_schedule_record(schedule, input)?;
            schedule.clone()
        };
        sort_workspace_release_retention_schedules(&mut document.items);
        self.persist_workspace_release_retention_schedule_registry(&document)?;
        Ok(updated_schedule)
    }

    fn trigger_workspace_release_retention_schedule(
        &self,
        schedule_id: &str,
        input: AdminWorkspaceReleaseRetentionScheduleTriggerInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionScheduleTriggerResultRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        self.trigger_workspace_release_retention_schedule_unlocked(schedule_id, input)
    }

    fn list_workspace_release_retention_exceptions(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionExceptionRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        Ok(self
            .load_workspace_release_retention_exception_registry()?
            .items)
    }

    fn create_workspace_release_retention_exception(
        &self,
        input: AdminWorkspaceReleaseRetentionExceptionCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let mut document = self.load_workspace_release_retention_exception_registry()?;
        let exception = self.build_workspace_release_retention_exception_record(input)?;
        document.items.push(exception.clone());
        sort_workspace_release_retention_exceptions(&mut document.items);
        self.persist_workspace_release_retention_exception_registry(&document)?;
        Ok(exception)
    }

    fn update_workspace_release_retention_exception(
        &self,
        exception_id: &str,
        input: AdminWorkspaceReleaseRetentionExceptionUpdateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let mut document = self.load_workspace_release_retention_exception_registry()?;
        let updated_exception = {
            let exception = self.find_workspace_release_retention_exception_mut(
                &mut document.items,
                exception_id,
            )?;
            self.update_workspace_release_retention_exception_record(exception, input)?;
            exception.clone()
        };
        sort_workspace_release_retention_exceptions(&mut document.items);
        self.persist_workspace_release_retention_exception_registry(&document)?;
        Ok(updated_exception)
    }

    fn delete_workspace_release_retention_exception(
        &self,
        exception_id: &str,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionExceptionRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let normalized_exception_id = require_non_empty_text(
            exception_id,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_ID_EMPTY",
            "exceptionId",
        )?;
        let mut document = self.load_workspace_release_retention_exception_registry()?;
        let position = document
            .items
            .iter()
            .position(|item| item.id == normalized_exception_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_NOT_FOUND",
                    format!(
                        "workspace release retention exception {normalized_exception_id} was not found"
                    ),
                )
            })?;
        let deleted_exception = document.items.remove(position);
        self.persist_workspace_release_retention_exception_registry(&document)?;
        Ok(deleted_exception)
    }

    fn list_workspace_release_retention_policy_rollouts(
        &self,
    ) -> ServerResult<Vec<AdminWorkspaceReleaseRetentionPolicyRolloutRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        Ok(self
            .load_workspace_release_retention_policy_rollout_registry()?
            .items)
    }

    fn create_workspace_release_retention_policy_rollout(
        &self,
        input: AdminWorkspaceReleaseRetentionPolicyRolloutCreateInput,
    ) -> ServerResult<AdminWorkspaceReleaseRetentionPolicyRolloutRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "ADMIN_GOVERNANCE_LOCK_FAILED",
                "failed to acquire admin governance lock",
            )
        })?;
        let mut document = self.load_workspace_release_retention_policy_rollout_registry()?;
        let rollout = self.build_workspace_release_retention_policy_rollout_record(input)?;
        document.items.push(rollout.clone());
        sort_workspace_release_retention_policy_rollouts(&mut document.items);
        self.persist_workspace_release_retention_policy_rollout_registry(&document)?;
        Ok(rollout)
    }

    fn start_background_workers(&self) -> ServerResult<()> {
        if self.scheduler_started.swap(true, Ordering::SeqCst) {
            return Ok(());
        }

        let scheduler = self.clone();
        tokio::spawn(async move {
            scheduler.run_scheduler_loop().await;
        });

        Ok(())
    }
}

fn build_workspace_release_retention_project_run_record(
    workspace: &WorkspaceRecord,
    project: &ProjectRecord,
    apply_result: ProjectReleaseRetentionPolicyApplyResultRecord,
    directive: WorkspaceReleaseRetentionExecutionDirective,
) -> AdminWorkspaceReleaseRetentionProjectRunRecord {
    AdminWorkspaceReleaseRetentionProjectRunRecord {
        workspace_id: workspace.uuid.clone(),
        workspace_name: workspace.name.clone(),
        project_id: project.uuid.clone(),
        project_name: project.name.clone(),
        status: AdminWorkspaceReleaseRetentionProjectRunStatus::Applied,
        requested_dry_run: directive.requested_dry_run,
        effective_dry_run: apply_result.dry_run,
        message: None,
        policy: Some(apply_result.policy),
        stats_before: Some(apply_result.stats_before),
        stats_after: Some(apply_result.stats_after),
        active_exception_ids: directive.active_exception_ids,
        deleted_release_ids: apply_result.deleted_release_ids,
        pruned_release_ids: apply_result.pruned_release_ids,
        deleted_count: apply_result.deleted_count,
        pruned_count: apply_result.pruned_count,
        reclaimed_bytes: apply_result.reclaimed_bytes,
    }
}

fn storage_provider(
    key: &str,
    name: &str,
    kind: &str,
    scope: &str,
    path: &std::path::Path,
) -> AdminStorageProviderRecord {
    AdminStorageProviderRecord {
        key: key.to_string(),
        name: name.to_string(),
        kind: kind.to_string(),
        scope: scope.to_string(),
        path: path.display().to_string(),
        exists: path.exists(),
    }
}

fn build_workspace_release_retention_execution_directive(
    exceptions: &[AdminWorkspaceReleaseRetentionExceptionRecord],
    workspace: &WorkspaceRecord,
    project: &ProjectRecord,
    requested_dry_run: bool,
    now: OffsetDateTime,
) -> WorkspaceReleaseRetentionExecutionDirective {
    let mut effective_dry_run = requested_dry_run;
    let mut skip_enforcement = false;
    let mut active_exception_ids = Vec::new();

    for exception in exceptions {
        if !is_workspace_release_retention_exception_active(exception, workspace, project, now) {
            continue;
        }

        active_exception_ids.push(exception.id.clone());
        match exception.mode {
            AdminWorkspaceReleaseRetentionExceptionMode::SkipEnforcement => {
                skip_enforcement = true;
            }
            AdminWorkspaceReleaseRetentionExceptionMode::DryRunOnly => {
                effective_dry_run = true;
            }
        }
    }

    WorkspaceReleaseRetentionExecutionDirective {
        requested_dry_run,
        effective_dry_run,
        message: if skip_enforcement {
            Some(
                "workspace release retention enforcement skipped by an active exception"
                    .to_string(),
            )
        } else {
            None
        },
        active_exception_ids,
    }
}

fn is_workspace_release_retention_exception_active(
    exception: &AdminWorkspaceReleaseRetentionExceptionRecord,
    workspace: &WorkspaceRecord,
    project: &ProjectRecord,
    now: OffsetDateTime,
) -> bool {
    exception.enabled
        && workspace_release_retention_scope_matches(&exception.scope, workspace, project)
        && retention_window_contains(&exception.starts_at, &exception.ends_at, now)
}

fn workspace_release_retention_scope_matches(
    scope: &AdminWorkspaceReleaseRetentionRunScopeRecord,
    workspace: &WorkspaceRecord,
    project: &ProjectRecord,
) -> bool {
    let workspace_matches = scope.workspace_ids.is_empty()
        || scope
            .workspace_ids
            .iter()
            .any(|value| value == &workspace.id || value == &workspace.uuid);
    let project_matches = scope.project_ids.is_empty()
        || scope
            .project_ids
            .iter()
            .any(|value| value == &project.id || value == &project.uuid);

    workspace_matches && project_matches
}

fn retention_window_contains(starts_at: &str, ends_at: &str, now: OffsetDateTime) -> bool {
    let Ok(starts_at) = OffsetDateTime::parse(starts_at, &Rfc3339) else {
        return false;
    };
    let Ok(ends_at) = OffsetDateTime::parse(ends_at, &Rfc3339) else {
        return false;
    };

    starts_at <= now && now <= ends_at
}

fn sort_workspace_release_retention_runs(
    items: &mut [AdminWorkspaceReleaseRetentionRunDetailRecord],
) {
    items.sort_by(|left, right| {
        right
            .run
            .started_at
            .cmp(&left.run.started_at)
            .then_with(|| right.run.finished_at.cmp(&left.run.finished_at))
            .then_with(|| left.run.id.cmp(&right.run.id))
    });
}

fn sort_workspace_release_retention_schedules(
    items: &mut [AdminWorkspaceReleaseRetentionScheduleRecord],
) {
    items.sort_by(|left, right| {
        right
            .enabled
            .cmp(&left.enabled)
            .then_with(|| left.next_run_at.cmp(&right.next_run_at))
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn sort_workspace_release_retention_exceptions(
    items: &mut [AdminWorkspaceReleaseRetentionExceptionRecord],
) {
    items.sort_by(|left, right| {
        right
            .enabled
            .cmp(&left.enabled)
            .then_with(|| left.starts_at.cmp(&right.starts_at))
            .then_with(|| left.ends_at.cmp(&right.ends_at))
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn sort_workspace_release_retention_policy_rollouts(
    items: &mut [AdminWorkspaceReleaseRetentionPolicyRolloutRecord],
) {
    items.sort_by(|left, right| {
        right
            .created_at
            .cmp(&left.created_at)
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn is_schedule_due(
    schedule: &AdminWorkspaceReleaseRetentionScheduleRecord,
    now: OffsetDateTime,
) -> bool {
    let Some(next_run_at) = &schedule.next_run_at else {
        return true;
    };

    OffsetDateTime::parse(next_run_at, &Rfc3339)
        .map(|scheduled_at| scheduled_at <= now)
        .unwrap_or(true)
}

fn count_execution_status(
    execution_capabilities: &[AppExecutionCapabilityRecord],
    status: &str,
) -> usize {
    execution_capabilities
        .iter()
        .filter(|record| record.execution_status == status)
        .count()
}

fn build_admin_execution_provider_record(
    capability: &AppExecutionCapabilityRecord,
) -> AdminExecutionProviderRecord {
    let ready_operation_count = capability
        .operation_details
        .iter()
        .filter(|operation| operation.execution_status == EXECUTION_STATUS_READY)
        .count() as u64;
    let blocked_operation_count = capability
        .operation_details
        .iter()
        .filter(|operation| is_execution_operation_blocked(operation.execution_status.as_str()))
        .count() as u64;

    AdminExecutionProviderRecord {
        key: capability.key.clone(),
        name: capability.name.clone(),
        domain: capability.domain.clone(),
        path_prefix: capability.path_prefix.clone(),
        route_ids: capability.route_ids.clone(),
        operations: capability.operations.clone(),
        route_count: capability.route_ids.len() as u64,
        operation_count: capability.operation_details.len() as u64,
        ready_operation_count,
        blocked_operation_count,
        execution_status: capability.execution_status.clone(),
        adapter_status: capability.adapter_status.clone(),
        description: capability.description.clone(),
    }
}

fn build_admin_execution_provider_health_record(
    capability: &AppExecutionCapabilityRecord,
    evaluated_at: &str,
) -> AdminExecutionProviderHealthRecord {
    let ready_operation_count = capability
        .operation_details
        .iter()
        .filter(|operation| operation.execution_status == EXECUTION_STATUS_READY)
        .count() as u64;
    let blocked_operations = capability
        .operation_details
        .iter()
        .filter(|operation| is_execution_operation_blocked(operation.execution_status.as_str()))
        .map(|operation| operation.key.clone())
        .collect::<Vec<_>>();
    let blocked_operation_count = blocked_operations.len() as u64;

    AdminExecutionProviderHealthRecord {
        key: capability.key.clone(),
        name: capability.name.clone(),
        domain: capability.domain.clone(),
        status: execution_provider_health_status(
            capability.execution_status.as_str(),
            ready_operation_count,
            blocked_operation_count,
        )
        .to_string(),
        execution_status: capability.execution_status.clone(),
        adapter_status: capability.adapter_status.clone(),
        operation_count: capability.operation_details.len() as u64,
        ready_operation_count,
        blocked_operation_count,
        blocked_operations,
        last_evaluated_at: evaluated_at.to_string(),
    }
}

fn build_admin_execution_failure_records(
    capability: &AppExecutionCapabilityRecord,
    registry: &AdminExecutionGovernanceRegistryDocument,
) -> Vec<AdminExecutionFailureRecord> {
    capability
        .operation_details
        .iter()
        .filter(|operation| is_execution_operation_blocked(operation.execution_status.as_str()))
        .map(|operation| build_admin_execution_failure_record(capability, operation, registry))
        .collect()
}

fn build_admin_execution_failure_record(
    capability: &AppExecutionCapabilityRecord,
    operation: &super::capabilities::AppExecutionOperationRecord,
    registry: &AdminExecutionGovernanceRegistryDocument,
) -> AdminExecutionFailureRecord {
    let failure_id = compose_execution_failure_id(&capability.key, &operation.key);
    let acknowledgement = latest_failure_acknowledgement(registry, &failure_id);
    let last_retry = latest_failure_retry(registry, &failure_id);
    let retry_count = registry
        .failure_retries
        .iter()
        .filter(|retry| retry.failure_id == failure_id)
        .count() as u64;

    AdminExecutionFailureRecord {
        id: failure_id,
        provider_key: capability.key.clone(),
        provider_name: capability.name.clone(),
        domain: capability.domain.clone(),
        operation_key: operation.key.clone(),
        execution_status: operation.execution_status.clone(),
        adapter_status: operation.adapter_status.clone(),
        severity: execution_failure_severity(operation).to_string(),
        message: operation.description.clone(),
        acknowledged: acknowledgement.is_some(),
        acknowledgement,
        retry_count,
        last_retry,
    }
}

fn find_execution_capability<'a>(
    execution_capabilities: &'a [AppExecutionCapabilityRecord],
    provider_key: &str,
) -> ServerResult<&'a AppExecutionCapabilityRecord> {
    let normalized_provider_key = require_non_empty_text(
        provider_key,
        "ADMIN_EXECUTION_PROVIDER_KEY_EMPTY",
        "providerKey",
    )?;
    execution_capabilities
        .iter()
        .find(|capability| capability.key == normalized_provider_key)
        .ok_or_else(|| {
            ServerError::not_found(
                "ADMIN_EXECUTION_PROVIDER_NOT_FOUND",
                format!("execution provider {normalized_provider_key} was not found"),
            )
        })
}

fn find_execution_operation<'a>(
    capability: &'a AppExecutionCapabilityRecord,
    operation_key: &str,
) -> ServerResult<&'a super::capabilities::AppExecutionOperationRecord> {
    capability
        .operation_details
        .iter()
        .find(|operation| operation.key == operation_key)
        .ok_or_else(|| {
            ServerError::not_found(
                "ADMIN_EXECUTION_FAILURE_NOT_FOUND",
                format!(
                    "execution operation {} for provider {} was not found",
                    operation_key, capability.key
                ),
            )
        })
}

fn parse_execution_failure_id(failure_id: &str) -> ServerResult<(String, String)> {
    let normalized_failure_id =
        require_non_empty_text(failure_id, "ADMIN_EXECUTION_FAILURE_ID_EMPTY", "failureId")?;
    let Some((provider_key, operation_key)) = normalized_failure_id.split_once(':') else {
        return Err(ServerError::bad_request(
            "ADMIN_EXECUTION_FAILURE_ID_INVALID",
            "failureId must use providerKey:operationKey format",
        ));
    };

    let provider_key = require_non_empty_text(
        provider_key,
        "ADMIN_EXECUTION_FAILURE_ID_INVALID",
        "failureId",
    )?;
    let operation_key = require_non_empty_text(
        operation_key,
        "ADMIN_EXECUTION_FAILURE_ID_INVALID",
        "failureId",
    )?;

    Ok((provider_key, operation_key))
}

fn resolve_active_execution_failure<'a>(
    execution_capabilities: &'a [AppExecutionCapabilityRecord],
    failure_id: &str,
) -> ServerResult<(
    &'a AppExecutionCapabilityRecord,
    &'a super::capabilities::AppExecutionOperationRecord,
)> {
    let (provider_key, operation_key) = parse_execution_failure_id(failure_id)?;
    let capability = find_execution_capability(execution_capabilities, &provider_key)?;
    let operation = find_execution_operation(capability, &operation_key)?;

    if !is_execution_operation_blocked(operation.execution_status.as_str()) {
        return Err(ServerError::not_found(
            "ADMIN_EXECUTION_FAILURE_NOT_FOUND",
            format!(
                "execution failure {} is not currently blocked",
                compose_execution_failure_id(&provider_key, &operation_key)
            ),
        ));
    }

    Ok((capability, operation))
}

fn compose_execution_failure_id(provider_key: &str, operation_key: &str) -> String {
    format!("{provider_key}:{operation_key}")
}

fn latest_failure_acknowledgement(
    registry: &AdminExecutionGovernanceRegistryDocument,
    failure_id: &str,
) -> Option<AdminExecutionFailureAcknowledgementRecord> {
    registry
        .failure_acknowledgements
        .iter()
        .filter(|item| item.failure_id == failure_id)
        .max_by(|left, right| left.acknowledged_at.cmp(&right.acknowledged_at))
        .map(|item| AdminExecutionFailureAcknowledgementRecord {
            actor: item.actor.clone(),
            note: item.note.clone(),
            acknowledged_at: item.acknowledged_at.clone(),
        })
}

fn latest_failure_retry(
    registry: &AdminExecutionGovernanceRegistryDocument,
    failure_id: &str,
) -> Option<AdminExecutionFailureRetryRecord> {
    registry
        .failure_retries
        .iter()
        .filter(|item| item.failure_id == failure_id)
        .max_by(|left, right| left.requested_at.cmp(&right.requested_at))
        .map(|item| AdminExecutionFailureRetryRecord {
            actor: item.actor.clone(),
            note: item.note.clone(),
            requested_at: item.requested_at.clone(),
            outcome: item.outcome.clone(),
        })
}

fn latest_provider_reconciliation(
    registry: &AdminExecutionGovernanceRegistryDocument,
    provider_key: &str,
) -> Option<AdminExecutionProviderReconciliationRecord> {
    registry
        .provider_reconciliations
        .iter()
        .filter(|item| item.provider_key == provider_key)
        .max_by(|left, right| left.reconciled_at.cmp(&right.reconciled_at))
        .map(|item| AdminExecutionProviderReconciliationRecord {
            actor: item.actor.clone(),
            note: item.note.clone(),
            reconciled_at: item.reconciled_at.clone(),
            health_status: item.health_status.clone(),
            active_failure_count: item.active_failure_count,
        })
}

fn is_execution_operation_blocked(status: &str) -> bool {
    status != EXECUTION_STATUS_READY && status != EXECUTION_STATUS_NOT_APPLICABLE
}

fn execution_provider_health_status(
    capability_status: &str,
    ready_operation_count: u64,
    blocked_operation_count: u64,
) -> &'static str {
    if blocked_operation_count == 0 && capability_status == EXECUTION_STATUS_READY {
        return ADMIN_EXECUTION_PROVIDER_HEALTH_HEALTHY;
    }

    if ready_operation_count > 0 || capability_status == EXECUTION_STATUS_MIXED {
        return ADMIN_EXECUTION_PROVIDER_HEALTH_DEGRADED;
    }

    ADMIN_EXECUTION_PROVIDER_HEALTH_BLOCKED
}

fn execution_failure_severity(
    operation: &super::capabilities::AppExecutionOperationRecord,
) -> &'static str {
    if operation.adapter_status == ADAPTER_STATUS_NOT_CONFIGURED {
        return ADMIN_EXECUTION_FAILURE_SEVERITY_CRITICAL;
    }

    if operation.execution_status == EXECUTION_STATUS_PLANNED
        || operation.adapter_status == ADAPTER_STATUS_PLANNED
        || operation.execution_status == EXECUTION_STATUS_LIFECYCLE_ONLY
    {
        return ADMIN_EXECUTION_FAILURE_SEVERITY_WARNING;
    }

    ADMIN_EXECUTION_FAILURE_SEVERITY_CRITICAL
}

fn sort_admin_execution_providers(records: &mut [AdminExecutionProviderRecord]) {
    records.sort_by(|left, right| {
        left.domain
            .cmp(&right.domain)
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.key.cmp(&right.key))
    });
}

fn sort_admin_execution_provider_health(records: &mut [AdminExecutionProviderHealthRecord]) {
    records.sort_by(|left, right| {
        execution_provider_health_sort_index(&left.status)
            .cmp(&execution_provider_health_sort_index(&right.status))
            .then_with(|| left.domain.cmp(&right.domain))
            .then_with(|| left.name.cmp(&right.name))
            .then_with(|| left.key.cmp(&right.key))
    });
}

fn sort_admin_execution_failures(records: &mut [AdminExecutionFailureRecord]) {
    records.sort_by(|left, right| {
        execution_failure_severity_sort_index(&left.severity)
            .cmp(&execution_failure_severity_sort_index(&right.severity))
            .then_with(|| left.domain.cmp(&right.domain))
            .then_with(|| left.provider_name.cmp(&right.provider_name))
            .then_with(|| left.operation_key.cmp(&right.operation_key))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn execution_provider_health_sort_index(status: &str) -> usize {
    match status {
        ADMIN_EXECUTION_PROVIDER_HEALTH_BLOCKED => 0,
        ADMIN_EXECUTION_PROVIDER_HEALTH_DEGRADED => 1,
        ADMIN_EXECUTION_PROVIDER_HEALTH_HEALTHY => 2,
        _ => 3,
    }
}

fn execution_failure_severity_sort_index(severity: &str) -> usize {
    match severity {
        ADMIN_EXECUTION_FAILURE_SEVERITY_CRITICAL => 0,
        ADMIN_EXECUTION_FAILURE_SEVERITY_WARNING => 1,
        _ => 2,
    }
}

fn count_jobs_with_status(jobs: &[JobSnapshot], status: JobStatus) -> usize {
    jobs.iter().filter(|job| job.status == status).count()
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn validate_retention_window(starts_at: &str, ends_at: &str) -> ServerResult<()> {
    let starts_at = OffsetDateTime::parse(starts_at, &Rfc3339).map_err(|error| {
        ServerError::bad_request(
            "ADMIN_WORKSPACE_RELEASE_RETENTION_WINDOW_INVALID",
            format!("startsAt must be a valid RFC3339 timestamp: {error}"),
        )
    })?;
    let ends_at = OffsetDateTime::parse(ends_at, &Rfc3339).map_err(|error| {
        ServerError::bad_request(
            "ADMIN_WORKSPACE_RELEASE_RETENTION_WINDOW_INVALID",
            format!("endsAt must be a valid RFC3339 timestamp: {error}"),
        )
    })?;

    if starts_at >= ends_at {
        return Err(ServerError::bad_request(
            "ADMIN_WORKSPACE_RELEASE_RETENTION_WINDOW_INVALID",
            "endsAt must be later than startsAt",
        ));
    }

    Ok(())
}

fn compute_rollout_stage_count(project_count: u64, stage_size: Option<u64>) -> u64 {
    match stage_size {
        Some(stage_size) if project_count == 0 => 0,
        Some(stage_size) => ((project_count - 1) / stage_size) + 1,
        None if project_count == 0 => 0,
        None => 1,
    }
}

fn next_workspace_release_retention_run_id() -> String {
    let counter = ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_COUNTER.fetch_add(1, Ordering::SeqCst);
    let timestamp_ms = OffsetDateTime::now_utc().unix_timestamp_nanos() / 1_000_000;
    format!("workspace-release-retention-run-{timestamp_ms}-{counter}")
}

fn next_workspace_release_retention_schedule_id() -> String {
    let counter = ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_COUNTER.fetch_add(1, Ordering::SeqCst);
    let timestamp_ms = OffsetDateTime::now_utc().unix_timestamp_nanos() / 1_000_000;
    format!("workspace-release-retention-schedule-{timestamp_ms}-{counter}")
}

fn next_workspace_release_retention_exception_id() -> String {
    let counter =
        ADMIN_WORKSPACE_RELEASE_RETENTION_EXCEPTION_COUNTER.fetch_add(1, Ordering::SeqCst);
    let timestamp_ms = OffsetDateTime::now_utc().unix_timestamp_nanos() / 1_000_000;
    format!("workspace-release-retention-exception-{timestamp_ms}-{counter}")
}

fn next_workspace_release_retention_policy_rollout_id() -> String {
    let counter =
        ADMIN_WORKSPACE_RELEASE_RETENTION_POLICY_ROLLOUT_COUNTER.fetch_add(1, Ordering::SeqCst);
    let timestamp_ms = OffsetDateTime::now_utc().unix_timestamp_nanos() / 1_000_000;
    format!("workspace-release-retention-policy-rollout-{timestamp_ms}-{counter}")
}

fn timestamp_after_minutes(reference: &str, minutes: u64) -> ServerResult<String> {
    let reference_time = OffsetDateTime::parse(reference, &Rfc3339).map_err(|error| {
        ServerError::internal(
            "ADMIN_WORKSPACE_RELEASE_RETENTION_TIMESTAMP_PARSE_FAILED",
            format!("failed to parse timestamp {reference}: {error}"),
        )
    })?;
    let offset_minutes = i64::try_from(minutes).map_err(|_| {
        ServerError::bad_request(
            "ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_INTERVAL_INVALID",
            "intervalMinutes is too large",
        )
    })?;
    (reference_time + TimeDuration::minutes(offset_minutes))
        .format(&Rfc3339)
        .map_err(|error| {
            ServerError::internal(
                "ADMIN_WORKSPACE_RELEASE_RETENTION_TIMESTAMP_FORMAT_FAILED",
                format!("failed to format retention timestamp: {error}"),
            )
        })
}

fn require_non_empty_text(value: &str, code: &str, field_name: &str) -> ServerResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }

    Ok(trimmed.to_string())
}

#[cfg(test)]
mod tests {
    use super::super::workspaces::ProjectType;
    use super::*;

    fn test_workspace() -> WorkspaceRecord {
        WorkspaceRecord {
            id: "workspace-1".to_string(),
            uuid: "workspace-uuid-1".to_string(),
            name: "Workspace".to_string(),
            description: "Workspace".to_string(),
            projects: Vec::new(),
            path: None,
            icon: None,
            created_at: "2026-04-24T00:00:00Z".to_string(),
            updated_at: "2026-04-24T00:00:00Z".to_string(),
            deleted_at: None,
        }
    }

    fn test_project() -> ProjectRecord {
        ProjectRecord {
            id: "project-1".to_string(),
            uuid: "project-uuid-1".to_string(),
            name: "Project".to_string(),
            project_type: ProjectType::App,
            description: "Project".to_string(),
            workspace_id: "workspace-1".to_string(),
            path: None,
            thumbnail_url: None,
            session: None,
            created_at: "2026-04-24T00:00:00Z".to_string(),
            updated_at: "2026-04-24T00:00:00Z".to_string(),
            archived_at: None,
            last_opened_at: None,
            deleted_at: None,
        }
    }

    fn test_exception(
        id: &str,
        mode: AdminWorkspaceReleaseRetentionExceptionMode,
    ) -> AdminWorkspaceReleaseRetentionExceptionRecord {
        AdminWorkspaceReleaseRetentionExceptionRecord {
            id: id.to_string(),
            name: id.to_string(),
            enabled: true,
            reason: "test".to_string(),
            mode,
            scope: AdminWorkspaceReleaseRetentionRunScopeRecord {
                workspace_ids: Vec::new(),
                project_ids: Vec::new(),
            },
            starts_at: "2026-04-24T00:00:00Z".to_string(),
            ends_at: "2026-04-25T00:00:00Z".to_string(),
            created_at: "2026-04-24T00:00:00Z".to_string(),
            updated_at: "2026-04-24T00:00:00Z".to_string(),
            created_by: "tester".to_string(),
            updated_by: "tester".to_string(),
        }
    }

    #[test]
    fn retention_execution_directive_applies_active_exceptions() {
        let workspace = test_workspace();
        let project = test_project();
        let mut scoped_skip = test_exception(
            "exception-skip",
            AdminWorkspaceReleaseRetentionExceptionMode::SkipEnforcement,
        );
        scoped_skip.scope.workspace_ids = vec![workspace.uuid.clone()];
        scoped_skip.scope.project_ids = vec![project.id.clone()];

        let mut expired = test_exception(
            "exception-expired",
            AdminWorkspaceReleaseRetentionExceptionMode::DryRunOnly,
        );
        expired.ends_at = "2026-04-23T23:59:59Z".to_string();

        let directive = build_workspace_release_retention_execution_directive(
            &[
                test_exception(
                    "exception-dry-run",
                    AdminWorkspaceReleaseRetentionExceptionMode::DryRunOnly,
                ),
                scoped_skip,
                expired,
            ],
            &workspace,
            &project,
            false,
            OffsetDateTime::parse("2026-04-24T12:00:00Z", &Rfc3339).expect("valid timestamp"),
        );

        assert!(!directive.requested_dry_run);
        assert!(directive.effective_dry_run);
        assert_eq!(
            directive.active_exception_ids,
            vec![
                "exception-dry-run".to_string(),
                "exception-skip".to_string()
            ]
        );
        assert_eq!(
            directive.message.as_deref(),
            Some("workspace release retention enforcement skipped by an active exception")
        );
    }

    #[test]
    fn validate_retention_window_rejects_inverted_ranges() {
        let error = validate_retention_window("2026-04-25T00:00:00Z", "2026-04-24T00:00:00Z")
            .expect_err("window should be rejected");

        assert_eq!(
            error.code,
            "ADMIN_WORKSPACE_RELEASE_RETENTION_WINDOW_INVALID"
        );
    }

    #[test]
    fn compute_rollout_stage_count_supports_optional_staging() {
        assert_eq!(compute_rollout_stage_count(5, Some(2)), 3);
        assert_eq!(compute_rollout_stage_count(5, None), 1);
        assert_eq!(compute_rollout_stage_count(0, None), 0);
    }
}
