use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::trade::{
    TradeMarketplaceTaskListQuery, TradeMarketplaceTaskRecord, TradeTaskAcceptRequest,
    TradeTaskApproveRequest, TradeTaskSubmitRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskIdPath {
    pub task_id: String,
}

pub async fn list_available_tasks(
    State(state): State<AppState>,
    Query(query): Query<TradeMarketplaceTaskListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<TradeMarketplaceTaskRecord>>> {
    let page = state.trade_service.list_available_tasks(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn list_published_tasks(
    State(state): State<AppState>,
    Query(query): Query<TradeMarketplaceTaskListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<TradeMarketplaceTaskRecord>>> {
    let page = state.trade_service.list_published_tasks(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn list_accepted_tasks(
    State(state): State<AppState>,
    Query(query): Query<TradeMarketplaceTaskListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<TradeMarketplaceTaskRecord>>> {
    let page = state.trade_service.list_accepted_tasks(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn read_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<TradeMarketplaceTaskRecord>>> {
    Ok(success(state.trade_service.read_task(&path.task_id)?))
}

pub async fn accept_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
    Json(payload): Json<TradeTaskAcceptRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<TradeMarketplaceTaskRecord>>> {
    Ok(success(
        state.trade_service.accept_task(&path.task_id, payload)?,
    ))
}

pub async fn submit_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
    Json(payload): Json<TradeTaskSubmitRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<TradeMarketplaceTaskRecord>>> {
    Ok(success(
        state.trade_service.submit_task(&path.task_id, payload)?,
    ))
}

pub async fn approve_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
    Json(payload): Json<TradeTaskApproveRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<TradeMarketplaceTaskRecord>>> {
    Ok(success(
        state.trade_service.approve_task(&path.task_id, payload)?,
    ))
}

pub async fn cancel_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<TradeMarketplaceTaskRecord>>> {
    Ok(success(state.trade_service.cancel_task(&path.task_id)?))
}
