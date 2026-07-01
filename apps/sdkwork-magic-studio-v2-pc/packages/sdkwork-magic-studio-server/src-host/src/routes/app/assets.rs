use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list, list_with_pagination, accepted, success, ServerResult};
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
    Json<crate::response::ApiList<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    let page = state.asset_service.list_assets(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_stats(
    State(state): State<AppState>,
    Query(query): Query<AssetStatsQuery>,
) -> ServerResult<Json<crate::response::ApiSuccess<crate::services::assets::AssetCenterStatsRecord>>>
{
    Ok(success(state.asset_service.read_stats(query)?))
}

pub async fn list_categories(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiList<crate::services::assets::AssetCategoryRecord>>,
> {
    Ok(list(state.asset_service.list_categories()?))
}

pub async fn import_file(
    State(state): State<AppState>,
    Json(payload): Json<AssetImportFileRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(state.asset_service.import_file(payload)?))
}

pub async fn import_url(
    State(state): State<AppState>,
    Json(payload): Json<AssetImportUrlRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(state.asset_service.import_url(payload)?))
}

pub async fn read_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(state.asset_service.read_asset(&path.asset_id)?))
}

pub async fn upsert_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
    Json(payload): Json<AssetUpsertRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::assets::UnifiedDigitalAssetRecord>>,
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
    Json<crate::response::ApiSuccess<crate::services::assets::UnifiedDigitalAssetRecord>>,
> {
    Ok(success(
        state.asset_service.update_asset(&path.asset_id, payload)?,
    ))
}

pub async fn delete_asset(
    State(state): State<AppState>,
    Path(path): Path<AssetIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.asset_service.delete_asset(&path.asset_id)?;
    Ok(accepted())
}
