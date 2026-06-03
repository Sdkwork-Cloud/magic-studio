use axum::extract::State;
use axum::Json;
use serde::Serialize;

use crate::response::list;
use crate::services::plugins::PluginManifestRecord;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PluginManifestPermissionsResponse {
    paths: Vec<String>,
    commands: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PluginManifestResponse {
    id: String,
    name: String,
    version: String,
    kind: String,
    route_prefix: String,
    capability_set: Vec<String>,
    permissions: PluginManifestPermissionsResponse,
}

impl From<PluginManifestRecord> for PluginManifestResponse {
    fn from(record: PluginManifestRecord) -> Self {
        Self {
            id: record.id,
            name: record.name,
            version: record.version,
            kind: record.kind,
            route_prefix: record.route_prefix,
            capability_set: record.capability_set,
            permissions: PluginManifestPermissionsResponse {
                paths: record.permissions.paths,
                commands: record.permissions.commands,
            },
        }
    }
}

pub async fn plugins(
    State(state): State<AppState>,
) -> crate::response::ServerResult<Json<crate::response::ApiListEnvelope<PluginManifestResponse>>> {
    let app_base_path = state.contract.require_surface_base_path("app");
    Ok(list(
        state
            .plugin_service
            .list_enabled_plugins(&app_base_path)?
            .into_iter()
            .map(PluginManifestResponse::from)
            .collect(),
    ))
}
