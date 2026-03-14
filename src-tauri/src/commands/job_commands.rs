use tauri::{command, AppHandle, State};

use crate::framework::services::{JobSnapshot, ToolkitOperation};
use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn job_submit_toolkit(
    context: State<'_, AppContext>,
    app_handle: AppHandle,
    operation: ToolkitOperation,
) -> Result<JobSnapshot, String> {
    let job_service = context.jobs();
    run_blocking("job_submit_toolkit", move || {
        job_service.submit_toolkit_job(app_handle, operation)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn job_get(
    context: State<'_, AppContext>,
    job_id: String,
) -> Result<JobSnapshot, String> {
    let job_service = context.jobs();
    run_blocking("job_get", move || job_service.get_job(job_id))
        .await
        .map_err(|error| error.to_string())
}

#[command]
pub async fn job_list(context: State<'_, AppContext>) -> Result<Vec<JobSnapshot>, String> {
    let job_service = context.jobs();
    run_blocking("job_list", move || job_service.list_jobs())
        .await
        .map_err(|error| error.to_string())
}

#[command]
pub async fn job_cancel(
    context: State<'_, AppContext>,
    app_handle: AppHandle,
    job_id: String,
) -> Result<JobSnapshot, String> {
    let job_service = context.jobs();
    run_blocking("job_cancel", move || {
        job_service.cancel_job(app_handle, job_id)
    })
    .await
    .map_err(|error| error.to_string())
}
