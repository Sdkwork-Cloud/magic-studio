use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::response::{list, success, ServerResult};
use crate::services::notifications::NotificationCreateInput;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationIdPath {
    pub notification_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationBatchDeleteRequest {
    pub notification_ids: Vec<String>,
}

pub async fn list_notifications(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::notifications::NotificationRecord>>,
> {
    Ok(list(state.notification_service.list_notifications()?))
}

pub async fn create_notification(
    State(state): State<AppState>,
    Json(payload): Json<NotificationCreateInput>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::notifications::NotificationRecord>>,
> {
    Ok(success(
        state.notification_service.create_notification(payload)?,
    ))
}

pub async fn mark_notification_as_read(
    State(state): State<AppState>,
    Path(path): Path<NotificationIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .notification_service
        .mark_notification_as_read(&path.notification_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn mark_all_notifications_as_read(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .notification_service
        .mark_all_notifications_as_read()?;
    Ok(success(json!({ "ok": true })))
}

pub async fn read_unread_count(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::notifications::NotificationUnreadCount>>,
> {
    Ok(success(state.notification_service.unread_count()?))
}

pub async fn delete_notifications(
    State(state): State<AppState>,
    Json(payload): Json<NotificationBatchDeleteRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .notification_service
        .delete_notifications(&payload.notification_ids)?;
    Ok(success(json!({ "ok": true })))
}
