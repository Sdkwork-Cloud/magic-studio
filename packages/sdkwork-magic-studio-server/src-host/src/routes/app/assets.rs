use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list, list_with_meta, success, ServerResult};
use crate::services::assets::{
    AssetImportFileRequest, AssetImportUrlRequest, AssetListQuery, AssetStatsQuery,
    AssetUpdateRequest, AssetUpsertRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetIdPath {
    pub asset_id: String,
}

pub async fn list_assets(
    State(state): State<AppState>,
    Query(query): Query<AssetListQuery>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    let page = state.asset_service.list_assets(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn read_stats(
    State(state): State<AppState>,
    Query(query): Query<AssetStatsQuery>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::assets::AssetCenterStatsRecord>>>
{
    Ok(success(state.asset_service.read_stats(query)?))
}

pub async fn list_categories(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::assets::AssetCategoryRecord>>,
> {
    Ok(list(state.asset_service.list_categories()?))
}

pub async fn import_file(
    State(state): State<AppState>,
    Json(payload): Json<AssetImportFileRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(state.asset_service.import_file(payload)?))
}

pub async fn import_url(
    State(state): State<AppState>,
    Json(payload): Json<AssetImportUrlRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(state.asset_service.import_url(payload)?))
}

pub async fn read_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(state.asset_service.read_asset(&path.asset_id)?))
}

pub async fn upsert_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
    Json(payload): Json<AssetUpsertRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(
        state.asset_service.upsert_asset(&path.asset_id, payload)?,
    ))
}

pub async fn update_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
    Json(payload): Json<AssetUpdateRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(
        state.asset_service.update_asset(&path.asset_id, payload)?,
    ))
}

pub async fn delete_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.asset_service.delete_asset(&path.asset_id)?;
    Ok(success(json!({ "ok": true })))
}
