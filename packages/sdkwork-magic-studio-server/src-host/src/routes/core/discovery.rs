use std::env;
use std::path::PathBuf;

use axum::extract::State;
use axum::Json;
use serde::Serialize;
use serde_json::Value;

use crate::response::{list, success, ServerResult};
use crate::services::toolkit::ToolkitCapabilityMatrix;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HealthStatusResponse {
    service: String,
    status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeSystemPathsResponse {
    home: String,
    app_data: String,
    desktop: String,
    documents: String,
    downloads: String,
    temp: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeSummaryResponse {
    mode: String,
    host: String,
    port: u16,
    api_base_url: String,
    api_version: String,
    runtime_os: String,
    runtime_arch: String,
    docs_path: String,
    open_api_path: String,
    route_catalog_path: String,
    system_paths: RuntimeSystemPathsResponse,
}

pub async fn healthz() -> Json<crate::response::ApiEnvelope<HealthStatusResponse>> {
    success(HealthStatusResponse {
        service: "magic-studio-server".to_string(),
        status: "ok".to_string(),
    })
}

pub async fn openapi_json(State(state): State<AppState>) -> Json<Value> {
    Json(
        state
            .contract
            .openapi_document(&state.config.api_base_url()),
    )
}

pub async fn route_catalog(
    State(state): State<AppState>,
) -> Json<crate::response::ApiListEnvelope<crate::contract::ServerRouteCatalogEntry>> {
    list(state.contract.route_catalog())
}

fn fallback_home_dir() -> PathBuf {
    dirs::home_dir()
        .or_else(|| env::current_dir().ok())
        .unwrap_or_else(|| PathBuf::from("."))
}

fn to_display_path(path: PathBuf) -> String {
    path.to_string_lossy().to_string()
}

fn runtime_system_paths() -> RuntimeSystemPathsResponse {
    let home_dir = fallback_home_dir();

    RuntimeSystemPathsResponse {
        home: to_display_path(home_dir.clone()),
        app_data: to_display_path(
            dirs::data_local_dir()
                .or_else(dirs::config_dir)
                .unwrap_or_else(|| home_dir.join(".config")),
        ),
        desktop: to_display_path(dirs::desktop_dir().unwrap_or_else(|| home_dir.join("Desktop"))),
        documents: to_display_path(
            dirs::document_dir().unwrap_or_else(|| home_dir.join("Documents")),
        ),
        downloads: to_display_path(
            dirs::download_dir().unwrap_or_else(|| home_dir.join("Downloads")),
        ),
        temp: to_display_path(env::temp_dir()),
    }
}

pub async fn runtime_summary(
    State(state): State<AppState>,
) -> Json<crate::response::ApiEnvelope<RuntimeSummaryResponse>> {
    success(RuntimeSummaryResponse {
        mode: state.config.runtime_mode().as_str().to_string(),
        host: state.config.host().to_string(),
        port: state.config.port(),
        api_base_url: state.config.api_base_url(),
        api_version: state.contract.api_version.clone(),
        runtime_os: env::consts::OS.to_string(),
        runtime_arch: env::consts::ARCH.to_string(),
        docs_path: state.contract.meta.docs_path.clone(),
        open_api_path: state.contract.meta.live_open_api_path.clone(),
        route_catalog_path: state.contract.route_catalog_path(),
        system_paths: runtime_system_paths(),
    })
}

pub async fn toolkit_capabilities(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<ToolkitCapabilityMatrix>>> {
    Ok(success(state.toolkit_service.capabilities()?))
}
