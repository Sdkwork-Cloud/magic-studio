use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::notes::{
    NoteCreateRequest, NoteFolderCreateRequest, NoteFolderMoveRequest, NoteFolderRenameRequest,
    NoteListQuery, NoteMoveRequest, NotePublishRequest, NoteUpdateRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteIdPath {
    pub note_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteFolderIdPath {
    pub folder_id: String,
}

pub async fn read_workspace_snapshot(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::notes::NoteWorkspaceSnapshotRecord>>,
> {
    Ok(success(state.note_service.read_workspace_snapshot()?))
}

pub async fn list_notes(
    State(state): State<AppState>,
    Query(query): Query<NoteListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::notes::NoteSummaryRecord>>>
{
    let page = state.note_service.list_notes(query, false)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn create_note(
    State(state): State<AppState>,
    Json(payload): Json<NoteCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteRecord>>> {
    Ok(success(state.note_service.create_note(payload)?))
}

pub async fn list_trashed_notes(
    State(state): State<AppState>,
    Query(query): Query<NoteListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::notes::NoteSummaryRecord>>>
{
    let page = state.note_service.list_notes(query, true)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn read_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteRecord>>> {
    Ok(success(state.note_service.read_note(&path.note_id)?))
}

pub async fn update_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
    Json(payload): Json<NoteUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteRecord>>> {
    Ok(success(
        state.note_service.update_note(&path.note_id, payload)?,
    ))
}

pub async fn create_note_folder(
    State(state): State<AppState>,
    Json(payload): Json<NoteFolderCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteFolderRecord>>> {
    Ok(success(state.note_service.create_folder(payload)?))
}

pub async fn rename_note_folder(
    State(state): State<AppState>,
    Path(path): Path<NoteFolderIdPath>,
    Json(payload): Json<NoteFolderRenameRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteFolderRecord>>> {
    Ok(success(
        state.note_service.rename_folder(&path.folder_id, payload)?,
    ))
}

pub async fn delete_note_folder(
    State(state): State<AppState>,
    Path(path): Path<NoteFolderIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.note_service.delete_folder(&path.folder_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn trash_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteRecord>>> {
    Ok(success(state.note_service.trash_note(&path.note_id)?))
}

pub async fn restore_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::NoteRecord>>> {
    Ok(success(state.note_service.restore_note(&path.note_id)?))
}

pub async fn delete_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.note_service.delete_note(&path.note_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn clear_trash(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.note_service.clear_trash()?;
    Ok(success(json!({ "ok": true })))
}

pub async fn move_note_folder(
    State(state): State<AppState>,
    Path(path): Path<NoteFolderIdPath>,
    Json(payload): Json<NoteFolderMoveRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.note_service.move_folder(&path.folder_id, payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn move_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
    Json(payload): Json<NoteMoveRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.note_service.move_note(&path.note_id, payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn publish_note(
    State(state): State<AppState>,
    Path(path): Path<NoteIdPath>,
    Json(payload): Json<NotePublishRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::notes::PublishResultRecord>>> {
    Ok(success(
        state.note_service.publish_note(&path.note_id, payload)?,
    ))
}
