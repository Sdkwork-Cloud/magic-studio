use tauri::{command, State};

use crate::framework::services::{PathAccessType, PolicySnapshot, PolicyValidationResult};
use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn policy_validate_path(
    context: State<'_, AppContext>,
    path: String,
    access: PathAccessType,
) -> Result<PolicyValidationResult, String> {
    let policy_service = context.policy();
    run_blocking("policy_validate_path", move || {
        policy_service.validate_path(path, access)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn policy_validate_command(
    context: State<'_, AppContext>,
    name: String,
) -> Result<PolicyValidationResult, String> {
    let policy_service = context.policy();
    run_blocking("policy_validate_command", move || {
        policy_service.validate_command(name)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn policy_snapshot(context: State<'_, AppContext>) -> Result<PolicySnapshot, String> {
    let policy_service = context.policy();
    run_blocking("policy_snapshot", move || policy_service.snapshot())
        .await
        .map_err(|error| error.to_string())
}
