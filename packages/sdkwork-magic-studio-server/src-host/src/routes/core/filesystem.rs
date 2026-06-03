use axum::extract::State;
use axum::Json;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::response::{list, success, ServerError, ServerResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemPathRequest {
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemWriteTextRequest {
    pub path: String,
    pub text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemTextPayload {
    pub text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemWriteBytesRequest {
    pub path: String,
    pub bytes_base64: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemBytesPayload {
    pub bytes_base64: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemExistsResult {
    pub exists: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemRenameRequest {
    pub old_path: String,
    pub new_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemCopyFileRequest {
    pub source_path: String,
    pub destination_path: String,
}

pub async fn filesystem_read_dir(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::filesystem::FileSystemEntry>>,
> {
    Ok(list(state.file_system_service.read_dir(payload.path)?))
}

pub async fn filesystem_read_text(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<FileSystemTextPayload>>> {
    Ok(success(FileSystemTextPayload {
        text: state.file_system_service.read_string(payload.path)?,
    }))
}

pub async fn filesystem_read_bytes(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<FileSystemBytesPayload>>> {
    let bytes = state.file_system_service.read_bytes(payload.path)?;
    Ok(success(FileSystemBytesPayload {
        bytes_base64: BASE64_STANDARD.encode(bytes),
    }))
}

pub async fn filesystem_write_text(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemWriteTextRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .file_system_service
        .write_string(payload.path, payload.text)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn filesystem_write_bytes(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemWriteBytesRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    let bytes = BASE64_STANDARD
        .decode(payload.bytes_base64)
        .map_err(|error| {
            ServerError::bad_request("FS_WRITE_BYTES_INVALID_BASE64", error.to_string())
        })?;
    state.file_system_service.write_bytes(payload.path, bytes)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn filesystem_stat(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::filesystem::FileSystemStat>>> {
    Ok(success(state.file_system_service.stat(payload.path)?))
}

pub async fn filesystem_exists(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<FileSystemExistsResult>>> {
    Ok(success(FileSystemExistsResult {
        exists: state.file_system_service.exists(payload.path)?,
    }))
}

pub async fn filesystem_ensure_dir(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state.file_system_service.ensure_dir(payload.path)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn filesystem_remove(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state.file_system_service.remove(payload.path)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn filesystem_rename(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemRenameRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .file_system_service
        .rename(payload.old_path, payload.new_path)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn filesystem_copy_file(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemCopyFileRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .file_system_service
        .copy_file(payload.source_path, payload.destination_path)?;
    Ok(success(json!({ "ok": true })))
}
