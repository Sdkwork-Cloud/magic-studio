use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;

use crate::response::{list, success, ServerResult};
use crate::services::jobs::{JobKind, JobSnapshot};
use crate::services::toolkit::ToolkitOperation;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitJobRequest {
    pub kind: JobKind,
    pub operation: ToolkitOperation,
}

pub async fn submit_job(
    State(state): State<AppState>,
    Json(payload): Json<SubmitJobRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<JobSnapshot>>> {
    match payload.kind {
        JobKind::Toolkit => Ok(success(
            state.job_service.submit_toolkit_job(payload.operation)?,
        )),
    }
}

pub async fn list_jobs(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiList<JobSnapshot>>> {
    Ok(list(state.job_service.list_jobs()?))
}

pub async fn read_job(
    State(state): State<AppState>,
    Path(job_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiSuccess<JobSnapshot>>> {
    Ok(success(state.job_service.get_job(job_id)?))
}

pub async fn cancel_job(
    State(state): State<AppState>,
    Path(job_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiSuccess<JobSnapshot>>> {
    Ok(success(state.job_service.cancel_job(job_id)?))
}
