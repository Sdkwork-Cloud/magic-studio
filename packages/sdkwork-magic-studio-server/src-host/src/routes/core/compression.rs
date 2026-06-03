use axum::extract::State;
use axum::Json;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::response::{success, ServerResult};
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

pub async fn compression_zip(
    State(state): State<AppState>,
    Json(payload): Json<CompressionZipRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    let bytes = state.compression_service.zip_bytes(payload.source_paths)?;
    Ok(success(json!({ "bytes": bytes })))
}

pub async fn compression_unzip(
    State(state): State<AppState>,
    Json(payload): Json<CompressionUnzipRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .compression_service
        .unzip(payload.zip_path, payload.target_dir)?;
    Ok(success(json!({ "ok": true })))
}
