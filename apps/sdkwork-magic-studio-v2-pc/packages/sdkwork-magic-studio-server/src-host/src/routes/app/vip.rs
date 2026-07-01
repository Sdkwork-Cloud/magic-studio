use axum::extract::{Path, Query, State};
use axum::Json;

use crate::response::{list_with_pagination, success, ServerResult};
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
) -> ServerResult<Json<crate::response::ApiList<VipPlanRecord>>> {
    let items = state.vip_service.list_plans()?;
    Ok(list_with_pagination(
        items.clone(),
        1,
        items.len().max(1) as i32,
        items.len() as i32,
        None,
    ))
}

pub async fn read_status(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiSuccess<VipStatusRecord>>> {
    Ok(success(state.vip_service.read_status()?))
}

pub async fn purchase(
    State(state): State<AppState>,
    Json(payload): Json<VipPurchaseRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<VipPurchaseResult>>> {
    Ok(success(state.vip_service.purchase(payload)?))
}

pub async fn list_subscriptions(
    State(state): State<AppState>,
    Query(query): Query<VipSubscriptionListQuery>,
) -> ServerResult<Json<crate::response::ApiList<VipSubscriptionRecord>>> {
    let page = state.vip_service.list_subscriptions(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn cancel_subscription(
    State(state): State<AppState>,
    Path(path): Path<SubscriptionIdPath>,
    Json(payload): Json<VipSubscriptionCancelRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<VipSubscriptionRecord>>> {
    Ok(success(
        state
            .vip_service
            .cancel_subscription(&path.subscription_id, payload)?,
    ))
}
