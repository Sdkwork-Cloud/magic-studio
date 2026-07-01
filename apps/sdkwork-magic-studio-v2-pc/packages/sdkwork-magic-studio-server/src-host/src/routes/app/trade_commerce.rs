use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list_with_pagination, accepted, success, ServerResult};
use crate::services::trade_commerce::{
    TradeOrderCancelRequest, TradeOrderCreateRequest, TradeOrderListQuery, TradeOrderRecord,
    TradeOrderStatisticsRecord, TradeOrderStatusUpdateRequest, TradePaymentActionResult,
    TradePaymentCreateRequest, TradePaymentListQuery, TradePaymentRechargeRequest,
    TradePaymentRecord, TradePaymentRefundRequest, TradeTransactionListQuery,
    TradeTransactionRecord, TradeWalletRecord,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderIdPath {
    pub order_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentIdPath {
    pub payment_id: String,
}

pub async fn list_orders(
    State(state): State<AppState>,
    Query(query): Query<TradeOrderListQuery>,
) -> ServerResult<Json<crate::response::ApiList<TradeOrderRecord>>> {
    let page = state.trade_commerce_service.list_orders(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_order(
    State(state): State<AppState>,
    Path(path): Path<OrderIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradeOrderRecord>>> {
    Ok(success(
        state.trade_commerce_service.read_order(&path.order_id)?,
    ))
}

pub async fn create_order(
    State(state): State<AppState>,
    Json(payload): Json<TradeOrderCreateRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradeOrderRecord>>> {
    Ok(success(state.trade_commerce_service.create_order(payload)?))
}

pub async fn update_order_status(
    State(state): State<AppState>,
    Path(path): Path<OrderIdPath>,
    Json(payload): Json<TradeOrderStatusUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradeOrderRecord>>> {
    Ok(success(
        state
            .trade_commerce_service
            .update_order_status(&path.order_id, payload)?,
    ))
}

pub async fn cancel_order(
    State(state): State<AppState>,
    Path(path): Path<OrderIdPath>,
    Json(payload): Json<TradeOrderCancelRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradeOrderRecord>>> {
    Ok(success(
        state
            .trade_commerce_service
            .cancel_order(&path.order_id, payload)?,
    ))
}

pub async fn delete_order(
    State(state): State<AppState>,
    Path(path): Path<OrderIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.trade_commerce_service.delete_order(&path.order_id)?;
    Ok(accepted())
}

pub async fn read_order_statistics(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradeOrderStatisticsRecord>>> {
    Ok(success(
        state.trade_commerce_service.read_order_statistics()?,
    ))
}

pub async fn list_payments(
    State(state): State<AppState>,
    Query(query): Query<TradePaymentListQuery>,
) -> ServerResult<Json<crate::response::ApiList<TradePaymentRecord>>> {
    let page = state.trade_commerce_service.list_payments(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_payment(
    State(state): State<AppState>,
    Path(path): Path<PaymentIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradePaymentRecord>>> {
    Ok(success(
        state
            .trade_commerce_service
            .read_payment(&path.payment_id)?,
    ))
}

pub async fn create_payment(
    State(state): State<AppState>,
    Json(payload): Json<TradePaymentCreateRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradePaymentActionResult>>> {
    Ok(success(
        state.trade_commerce_service.create_payment(payload)?,
    ))
}

pub async fn refund_payment(
    State(state): State<AppState>,
    Path(path): Path<PaymentIdPath>,
    Json(payload): Json<TradePaymentRefundRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradePaymentRecord>>> {
    Ok(success(
        state
            .trade_commerce_service
            .refund_payment(&path.payment_id, payload)?,
    ))
}

pub async fn recharge(
    State(state): State<AppState>,
    Json(payload): Json<TradePaymentRechargeRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradePaymentActionResult>>> {
    Ok(success(state.trade_commerce_service.recharge(payload)?))
}

pub async fn read_wallet(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiSuccess<TradeWalletRecord>>> {
    Ok(success(state.trade_commerce_service.read_wallet()?))
}

pub async fn list_transactions(
    State(state): State<AppState>,
    Query(query): Query<TradeTransactionListQuery>,
) -> ServerResult<Json<crate::response::ApiList<TradeTransactionRecord>>> {
    let page = state.trade_commerce_service.list_transactions(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}
