use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, HeaderValue};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list, success, ServerResult};
use crate::services::workspaces::{
    ProjectCreateInput, ProjectGitSyncInput, ProjectGitSyncRetryInput, ProjectReleaseCreateInput,
    ProjectReleasePruneInput, ProjectReleaseRetentionPolicyApplyInput,
    ProjectReleaseRetentionPolicyInput, ProjectSessionUpsertInput, ProjectUpdateInput,
    WorkspaceCreateInput, WorkspaceUpdateInput,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceIdPath {
    pub workspace_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceProjectIdPath {
    pub workspace_id: String,
    pub project_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceProjectGitSyncIdPath {
    pub workspace_id: String,
    pub project_id: String,
    pub sync_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceProjectReleaseIdPath {
    pub workspace_id: String,
    pub project_id: String,
    pub release_id: String,
}

pub async fn list_workspaces(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::workspaces::WorkspaceRecord>>,
> {
    Ok(list(state.workspace_service.list_workspaces()?))
}

pub async fn create_workspace(
    State(state): State<AppState>,
    Json(payload): Json<WorkspaceCreateInput>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::WorkspaceRecord>>>
{
    Ok(success(state.workspace_service.create_workspace(payload)?))
}

pub async fn read_workspace(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::WorkspaceRecord>>>
{
    Ok(success(
        state.workspace_service.read_workspace(&path.workspace_id)?,
    ))
}

pub async fn update_workspace(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceIdPath>,
    Json(payload): Json<WorkspaceUpdateInput>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::WorkspaceRecord>>>
{
    Ok(success(
        state
            .workspace_service
            .update_workspace(&path.workspace_id, payload)?,
    ))
}

pub async fn delete_workspace(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state
        .workspace_service
        .delete_workspace(&path.workspace_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn list_projects(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceIdPath>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::workspaces::ProjectRecord>>>
{
    Ok(list(
        state.workspace_service.list_projects(&path.workspace_id)?,
    ))
}

pub async fn list_recent_projects(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::workspaces::ProjectRecord>>>
{
    Ok(list(state.workspace_service.list_recent_projects()?))
}

pub async fn create_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceIdPath>,
    Json(payload): Json<ProjectCreateInput>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(
        state
            .workspace_service
            .create_project(&path.workspace_id, payload)?,
    ))
}

pub async fn read_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(
        state
            .workspace_service
            .read_project(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn read_project_session(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectSessionSnapshotRecord>>,
> {
    Ok(success(state.workspace_service.read_project_session(
        &path.workspace_id,
        &path.project_id,
    )?))
}

pub async fn update_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectUpdateInput>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(state.workspace_service.update_project(
        &path.workspace_id,
        &path.project_id,
        payload,
    )?))
}

pub async fn upsert_project_session(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectSessionUpsertInput>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectSessionRecord>>,
> {
    Ok(success(state.workspace_service.upsert_project_session(
        &path.workspace_id,
        &path.project_id,
        payload,
    )?))
}

pub async fn open_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(
        state
            .workspace_service
            .open_project(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn duplicate_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(
        state
            .workspace_service
            .duplicate_project(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn archive_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(
        state
            .workspace_service
            .archive_project(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn restore_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectRecord>>> {
    Ok(success(
        state
            .workspace_service
            .restore_project(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn delete_project(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state
        .workspace_service
        .delete_project(&path.workspace_id, &path.project_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn delete_project_session(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state
        .workspace_service
        .delete_project_session(&path.workspace_id, &path.project_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn sync_project_to_git(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectGitSyncInput>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectGitSyncRecord>>,
> {
    Ok(success(state.workspace_service.sync_project_to_git(
        &path.workspace_id,
        &path.project_id,
        payload,
    )?))
}

pub async fn list_project_git_syncs(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::workspaces::ProjectGitSyncRecord>>,
> {
    Ok(list(state.workspace_service.list_project_git_syncs(
        &path.workspace_id,
        &path.project_id,
    )?))
}

pub async fn read_latest_project_git_sync(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectGitSyncRecord>>,
> {
    Ok(success(
        state
            .workspace_service
            .read_latest_project_git_sync(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn read_project_git_sync(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectGitSyncIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectGitSyncRecord>>,
> {
    Ok(success(state.workspace_service.read_project_git_sync(
        &path.workspace_id,
        &path.project_id,
        &path.sync_id,
    )?))
}

pub async fn retry_project_git_sync(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectGitSyncIdPath>,
    Json(payload): Json<ProjectGitSyncRetryInput>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectGitSyncRecord>>,
> {
    Ok(success(state.workspace_service.retry_project_git_sync(
        &path.workspace_id,
        &path.project_id,
        &path.sync_id,
        payload,
    )?))
}

pub async fn list_project_releases(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(list(state.workspace_service.list_project_releases(
        &path.workspace_id,
        &path.project_id,
    )?))
}

pub async fn read_project_release_stats(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseStatsRecord>>,
> {
    Ok(success(
        state
            .workspace_service
            .read_project_release_stats(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn create_project_release(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectReleaseCreateInput>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(success(state.workspace_service.create_project_release(
        &path.workspace_id,
        &path.project_id,
        payload,
    )?))
}

pub async fn prune_project_releases(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectReleasePruneInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleasePruneResultRecord>,
    >,
> {
    Ok(success(state.workspace_service.prune_project_releases(
        &path.workspace_id,
        &path.project_id,
        payload,
    )?))
}

pub async fn read_project_release_retention_policy(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::workspaces::ProjectReleaseRetentionPolicyRecord,
        >,
    >,
> {
    Ok(success(
        state
            .workspace_service
            .read_project_release_retention_policy(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn update_project_release_retention_policy(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectReleaseRetentionPolicyInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::workspaces::ProjectReleaseRetentionPolicyRecord,
        >,
    >,
> {
    Ok(success(
        state
            .workspace_service
            .update_project_release_retention_policy(
                &path.workspace_id,
                &path.project_id,
                payload,
            )?,
    ))
}

pub async fn apply_project_release_retention_policy(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
    Json(payload): Json<ProjectReleaseRetentionPolicyApplyInput>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::workspaces::ProjectReleaseRetentionPolicyApplyResultRecord,
        >,
    >,
> {
    Ok(success(
        state
            .workspace_service
            .apply_project_release_retention_policy(
                &path.workspace_id,
                &path.project_id,
                payload,
            )?,
    ))
}

pub async fn read_latest_project_release(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(success(
        state
            .workspace_service
            .read_latest_project_release(&path.workspace_id, &path.project_id)?,
    ))
}

pub async fn read_project_release(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectReleaseIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(success(state.workspace_service.read_project_release(
        &path.workspace_id,
        &path.project_id,
        &path.release_id,
    )?))
}

pub async fn delete_project_release(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectReleaseIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(success(state.workspace_service.delete_project_release(
        &path.workspace_id,
        &path.project_id,
        &path.release_id,
    )?))
}

pub async fn restore_project_release(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectReleaseIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(success(state.workspace_service.restore_project_release(
        &path.workspace_id,
        &path.project_id,
        &path.release_id,
    )?))
}

pub async fn read_project_release_manifest(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectReleaseIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseManifestRecord>>,
> {
    Ok(success(
        state.workspace_service.read_project_release_manifest(
            &path.workspace_id,
            &path.project_id,
            &path.release_id,
        )?,
    ))
}

pub async fn read_project_release_artifact(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectReleaseIdPath>,
) -> ServerResult<Response> {
    let artifact = state.workspace_service.read_project_release_artifact(
        &path.workspace_id,
        &path.project_id,
        &path.release_id,
    )?;
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(&artifact.mime_type).map_err(|error| {
            crate::response::ServerError::internal(
                "PROJECT_RELEASE_ARTIFACT_HEADER_INVALID",
                format!("failed to build content-type header: {error}"),
            )
        })?,
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!("attachment; filename=\"{}\"", artifact.file_name))
            .map_err(|error| {
                crate::response::ServerError::internal(
                    "PROJECT_RELEASE_ARTIFACT_HEADER_INVALID",
                    format!("failed to build content-disposition header: {error}"),
                )
            })?,
    );
    headers.insert(
        header::CONTENT_LENGTH,
        HeaderValue::from_str(&artifact.bytes.len().to_string()).map_err(|error| {
            crate::response::ServerError::internal(
                "PROJECT_RELEASE_ARTIFACT_HEADER_INVALID",
                format!("failed to build content-length header: {error}"),
            )
        })?,
    );

    Ok((headers, artifact.bytes).into_response())
}

pub async fn rebuild_project_release(
    State(state): State<AppState>,
    Path(path): Path<WorkspaceProjectReleaseIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::workspaces::ProjectReleaseRecord>>,
> {
    Ok(success(state.workspace_service.rebuild_project_release(
        &path.workspace_id,
        &path.project_id,
        &path.release_id,
    )?))
}
