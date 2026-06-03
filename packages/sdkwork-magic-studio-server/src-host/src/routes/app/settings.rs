use axum::extract::State;
use axum::Json;
use serde::Deserialize;
use serde_json::{Map, Value};

use crate::response::{success, ServerResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsUpdateRequest {
    pub settings: Map<String, Value>,
}

pub async fn read_settings(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::settings::AppSettingsDocument>>>
{
    Ok(success(state.app_settings_service.read_settings()?))
}

pub async fn update_settings(
    State(state): State<AppState>,
    Json(payload): Json<AppSettingsUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::settings::AppSettingsDocument>>>
{
    Ok(success(
        state
            .app_settings_service
            .update_settings(payload.settings)?,
    ))
}
