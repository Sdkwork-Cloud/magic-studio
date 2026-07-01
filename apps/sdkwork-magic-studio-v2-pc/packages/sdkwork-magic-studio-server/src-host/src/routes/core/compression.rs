use axum::extract::State;
use axum::Json;
use serde::Deserialize;
use serde::Serialize;

use crate::response::{accepted, success, ServerResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressionZipRequest {
    pub source_paths: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressionUnzipRequest {
    pub zip_path: String,
    pub target_dir: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressionZipResult {
    pub bytes: usize,
}

pub async fn compression_zip(
    State(state): State<AppState>,
    Json(payload): Json<CompressionZipRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<CompressionZipResult>>> {
    let bytes = state.compression_service.zip_bytes(payload.source_paths)?;
    Ok(success(CompressionZipResult { bytes: bytes.len() }))
}

pub async fn compression_unzip(
    State(state): State<AppState>,
    Json(payload): Json<CompressionUnzipRequest>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state
        .compression_service
        .unzip(payload.zip_path, payload.target_dir)?;
    Ok(accepted())
}
