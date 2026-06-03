use axum::extract::{Path, Query, State};
use axum::Json;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::vip::{
    VipPlanRecord, VipPurchaseRequest, VipPurchaseResult, VipStatusRecord,
    VipSubscriptionCancelRequest, VipSubscriptionListQuery, VipSubscriptionRecord,
};
use crate::state::AppState;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscriptionIdPath {
    pub subscription_id: String,
}

pub async fn list_plans(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<VipPlanRecord>>> {
    let items = state.vip_service.list_plans()?;
    Ok(list_with_meta(
        items.clone(),
        1,
        items.len().max(1),
        items.len(),
    ))
}

pub async fn read_status(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VipStatusRecord>>> {
    Ok(success(state.vip_service.read_status()?))
}

pub async fn purchase(
    State(state): State<AppState>,
    Json(payload): Json<VipPurchaseRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VipPurchaseResult>>> {
    Ok(success(state.vip_service.purchase(payload)?))
}

pub async fn list_subscriptions(
    State(state): State<AppState>,
    Query(query): Query<VipSubscriptionListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<VipSubscriptionRecord>>> {
    let page = state.vip_service.list_subscriptions(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn cancel_subscription(
    State(state): State<AppState>,
    Path(path): Path<SubscriptionIdPath>,
    Json(payload): Json<VipSubscriptionCancelRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VipSubscriptionRecord>>> {
    Ok(success(
        state
            .vip_service
            .cancel_subscription(&path.subscription_id, payload)?,
    ))
}
