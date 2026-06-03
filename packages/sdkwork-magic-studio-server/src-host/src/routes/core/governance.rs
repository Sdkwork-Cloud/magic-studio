use axum::extract::State;
use axum::Json;
use serde::Deserialize;

use crate::response::{success, ServerResult};
use crate::services::migration::MigrationPlan;
use crate::services::policy::PathAccessType;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidatePathRequest {
    pub path: String,
    pub access: PathAccessType,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateCommandRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationStatusRequest {
    pub db_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationApplyRequest {
    pub db_path: String,
    pub plan: MigrationPlan,
}

pub async fn policy_snapshot(
    State(state): State<AppState>,
) -> Json<crate::response::ApiEnvelope<crate::services::policy::PolicySnapshot>> {
    success(state.policy_service.snapshot())
}

pub async fn validate_policy_path(
    State(state): State<AppState>,
    Json(payload): Json<ValidatePathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::policy::PolicyValidationResult>>>
{
    Ok(success(
        state
            .policy_service
            .validate_path(payload.path, payload.access)?,
    ))
}

pub async fn validate_policy_command(
    State(state): State<AppState>,
    Json(payload): Json<ValidateCommandRequest>,
) -> Json<crate::response::ApiEnvelope<crate::services::policy::PolicyValidationResult>> {
    success(state.policy_service.validate_command(payload.name))
}

pub async fn migration_status(
    State(state): State<AppState>,
    Json(payload): Json<MigrationStatusRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::migration::MigrationStatus>>> {
    Ok(success(state.migration_service.status(payload.db_path)?))
}

pub async fn migration_apply(
    State(state): State<AppState>,
    Json(payload): Json<MigrationApplyRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::migration::MigrationApplyResult>>,
> {
    Ok(success(
        state
            .migration_service
            .apply(payload.db_path, payload.plan)?,
    ))
}
