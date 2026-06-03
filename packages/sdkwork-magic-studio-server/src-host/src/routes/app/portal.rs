use axum::extract::{Path, Query, State};
use axum::Json;
use serde_json::json;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::portal::{
    PortalDiscoverFeedQuery, PortalFeaturedFeedQuery, PortalFeedCreateRequest, PortalFeedRecord,
};
use crate::state::AppState;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedIdPath {
    pub feed_id: String,
}

pub async fn create_feed(
    State(state): State<AppState>,
    Json(payload): Json<PortalFeedCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.create_feed(payload)?))
}

pub async fn list_featured_feeds(
    State(state): State<AppState>,
    Query(query): Query<PortalFeaturedFeedQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<PortalFeedRecord>>> {
    let page = state.portal_service.list_featured_feeds(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn list_discover_feeds(
    State(state): State<AppState>,
    Query(query): Query<PortalDiscoverFeedQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<PortalFeedRecord>>> {
    let page = state.portal_service.list_discover_feeds(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn read_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.read_feed(&path.feed_id)?))
}

pub async fn like_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.like_feed(&path.feed_id)?))
}

pub async fn unlike_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.unlike_feed(&path.feed_id)?))
}

pub async fn collect_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.collect_feed(&path.feed_id)?))
}

pub async fn uncollect_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.uncollect_feed(&path.feed_id)?))
}

pub async fn share_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<PortalFeedRecord>>> {
    Ok(success(state.portal_service.share_feed(&path.feed_id)?))
}

pub async fn delete_feed(
    State(state): State<AppState>,
    Path(path): Path<FeedIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.portal_service.delete_feed(&path.feed_id)?;
    Ok(success(json!({ "ok": true })))
}
