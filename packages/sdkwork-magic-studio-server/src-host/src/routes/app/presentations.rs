use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::presentations::{
    PresentationCreateRequest, PresentationListQuery, PresentationSlideCreateRequest,
    PresentationSlideUpdateRequest, PresentationUpdateRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationIdPath {
    pub presentation_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlidePath {
    pub presentation_id: String,
    pub slide_id: String,
}

pub async fn list_presentations(
    State(state): State<AppState>,
    Query(query): Query<PresentationListQuery>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::presentations::PresentationRecord>>,
> {
    let page = state.presentation_service.list_presentations(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn create_presentation(
    State(state): State<AppState>,
    Json(payload): Json<PresentationCreateRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::presentations::PresentationRecord>>,
> {
    Ok(success(
        state.presentation_service.create_presentation(payload)?,
    ))
}

pub async fn read_presentation(
    State(state): State<AppState>,
    Path(path): Path<PresentationIdPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::presentations::PresentationRecord>>,
> {
    Ok(success(
        state
            .presentation_service
            .read_presentation(&path.presentation_id)?,
    ))
}

pub async fn update_presentation(
    State(state): State<AppState>,
    Path(path): Path<PresentationIdPath>,
    Json(payload): Json<PresentationUpdateRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::presentations::PresentationRecord>>,
> {
    Ok(success(
        state
            .presentation_service
            .update_presentation(&path.presentation_id, payload)?,
    ))
}

pub async fn delete_presentation(
    State(state): State<AppState>,
    Path(path): Path<PresentationIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state
        .presentation_service
        .delete_presentation(&path.presentation_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn create_slide(
    State(state): State<AppState>,
    Path(path): Path<PresentationIdPath>,
    Json(payload): Json<PresentationSlideCreateRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::presentations::PresentationRecord>>,
> {
    Ok(success(
        state
            .presentation_service
            .create_slide(&path.presentation_id, payload)?,
    ))
}

pub async fn update_slide(
    State(state): State<AppState>,
    Path(path): Path<PresentationSlidePath>,
    Json(payload): Json<PresentationSlideUpdateRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::presentations::PresentationRecord>>,
> {
    Ok(success(state.presentation_service.update_slide(
        &path.presentation_id,
        &path.slide_id,
        payload,
    )?))
}
