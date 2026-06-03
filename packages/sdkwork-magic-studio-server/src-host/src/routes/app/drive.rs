use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list, success, ServerResult};
use crate::services::drive::{
    DriveCreateFolderRequest, DriveDeleteRequest, DriveEntriesQuery, DriveFavoriteRequest,
    DriveImportFileRequest, DriveMoveRequest, DriveRenameRequest, DriveRestoreRequest,
    DriveUpdateFileContentRequest, DriveUploadFileRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveItemIdPath {
    pub item_id: String,
}

pub async fn read_root(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveRootDescriptor>>> {
    Ok(success(state.drive_service.read_root()?))
}

pub async fn list_entries(
    State(state): State<AppState>,
    Query(query): Query<DriveEntriesQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::drive::DriveItemRecord>>> {
    Ok(list(state.drive_service.list_entries(query)?))
}

pub async fn read_stats(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveStatsRecord>>> {
    Ok(success(state.drive_service.read_stats()?))
}

pub async fn read_file_content(
    State(state): State<AppState>,
    Path(path): Path<DriveItemIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveFileContentRecord>>>
{
    Ok(success(
        state.drive_service.read_file_content(&path.item_id)?,
    ))
}

pub async fn update_file_content(
    State(state): State<AppState>,
    Path(path): Path<DriveItemIdPath>,
    Json(payload): Json<DriveUpdateFileContentRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveFileContentRecord>>>
{
    Ok(success(
        state
            .drive_service
            .update_file_content(&path.item_id, payload)?,
    ))
}

pub async fn create_folder(
    State(state): State<AppState>,
    Json(payload): Json<DriveCreateFolderRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveItemRecord>>> {
    Ok(success(state.drive_service.create_folder(payload)?))
}

pub async fn upload_file(
    State(state): State<AppState>,
    Json(payload): Json<DriveUploadFileRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveItemRecord>>> {
    Ok(success(state.drive_service.upload_file(payload)?))
}

pub async fn import_file(
    State(state): State<AppState>,
    Json(payload): Json<DriveImportFileRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveItemRecord>>> {
    Ok(success(state.drive_service.import_file(payload)?))
}

pub async fn rename_item(
    State(state): State<AppState>,
    Json(payload): Json<DriveRenameRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveItemRecord>>> {
    Ok(success(state.drive_service.rename_item(payload)?))
}

pub async fn move_items(
    State(state): State<AppState>,
    Json(payload): Json<DriveMoveRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.drive_service.move_items(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn delete_items(
    State(state): State<AppState>,
    Json(payload): Json<DriveDeleteRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.drive_service.delete_items(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn restore_items(
    State(state): State<AppState>,
    Json(payload): Json<DriveRestoreRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.drive_service.restore_items(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn empty_trash(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.drive_service.empty_trash()?;
    Ok(success(json!({ "ok": true })))
}

pub async fn favorite_item(
    State(state): State<AppState>,
    Json(payload): Json<DriveFavoriteRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::drive::DriveItemRecord>>> {
    Ok(success(state.drive_service.favorite_item(payload)?))
}
