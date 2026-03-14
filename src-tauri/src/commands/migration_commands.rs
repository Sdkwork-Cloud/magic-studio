use tauri::{command, State};

use crate::framework::services::{MigrationApplyResult, MigrationPlan, MigrationStatus};
use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn migration_status(
    context: State<'_, AppContext>,
    db_path: String,
) -> Result<MigrationStatus, String> {
    let migration_service = context.migration();
    run_blocking("migration_status", move || {
        migration_service.status(db_path)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn migration_apply(
    context: State<'_, AppContext>,
    db_path: String,
    plan: MigrationPlan,
) -> Result<MigrationApplyResult, String> {
    let migration_service = context.migration();
    run_blocking("migration_apply", move || {
        migration_service.apply(db_path, plan)
    })
    .await
    .map_err(|error| error.to_string())
}
