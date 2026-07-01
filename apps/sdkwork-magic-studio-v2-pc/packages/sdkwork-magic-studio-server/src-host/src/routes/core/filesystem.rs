use axum::extract::State;
use axum::Json;
use sdkwork_utils_rust::encoding;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::response::{list, accepted, success, ServerError, ServerResult};
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
    Json<crate::response::ApiList<crate::services::filesystem::FileSystemEntry>>,
> {
    Ok(list(state.file_system_service.read_dir(payload.path)?))
}

pub async fn filesystem_read_text(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<FileSystemTextPayload>>> {
    Ok(success(FileSystemTextPayload {
        text: state.file_system_service.read_string(payload.path)?,
    }))
}

pub async fn filesystem_read_bytes(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<FileSystemBytesPayload>>> {
    let bytes = state.file_system_service.read_bytes(payload.path)?;
    Ok(success(FileSystemBytesPayload {
        bytes_base64: encoding::base64_encode(&bytes),
    }))
}

pub async fn filesystem_write_text(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemWriteTextRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state
        .file_system_service
        .write_string(payload.path, payload.text)?;
    Ok(accepted())
}

pub async fn filesystem_write_bytes(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemWriteBytesRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    let bytes = encoding::base64_decode(&payload.bytes_base64).ok_or_else(|| {
        ServerError::bad_request("bytesBase64 is not valid base64".to_string())
    })?;
    state.file_system_service.write_bytes(payload.path, bytes)?;
    Ok(accepted())
}

pub async fn filesystem_stat(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<crate::services::filesystem::FileSystemStat>>> {
    Ok(success(state.file_system_service.stat(payload.path)?))
}

pub async fn filesystem_exists(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<FileSystemExistsResult>>> {
    Ok(success(FileSystemExistsResult {
        exists: state.file_system_service.exists(payload.path)?,
    }))
}

pub async fn filesystem_ensure_dir(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.file_system_service.ensure_dir(payload.path)?;
    Ok(accepted())
}

pub async fn filesystem_remove(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemPathRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.file_system_service.remove(payload.path)?;
    Ok(accepted())
}

pub async fn filesystem_rename(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemRenameRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state
        .file_system_service
        .rename(payload.old_path, payload.new_path)?;
    Ok(accepted())
}

pub async fn filesystem_copy_file(
    State(state): State<AppState>,
    Json(payload): Json<FileSystemCopyFileRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state
        .file_system_service
        .copy_file(payload.source_path, payload.destination_path)?;
    Ok(accepted())
}
