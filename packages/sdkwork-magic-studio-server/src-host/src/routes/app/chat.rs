use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::chat::{
    ChatSessionCreateRequest, ChatSessionListQuery, ChatSessionUpdateRequest,
    ChatTranscriptUpdateRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatSessionIdPath {
    pub session_id: String,
}

pub async fn list_sessions(
    State(state): State<AppState>,
    Query(query): Query<ChatSessionListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<crate::services::chat::ChatSessionRecord>>>
{
    let page = state.chat_service.list_sessions(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn create_session(
    State(state): State<AppState>,
    Json(payload): Json<ChatSessionCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::chat::ChatSessionRecord>>> {
    Ok(success(state.chat_service.create_session(payload)?))
}

pub async fn read_session(
    State(state): State<AppState>,
    Path(path): Path<ChatSessionIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::chat::ChatSessionRecord>>> {
    Ok(success(state.chat_service.read_session(&path.session_id)?))
}

pub async fn update_session(
    State(state): State<AppState>,
    Path(path): Path<ChatSessionIdPath>,
    Json(payload): Json<ChatSessionUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::chat::ChatSessionRecord>>> {
    Ok(success(
        state
            .chat_service
            .update_session(&path.session_id, payload)?,
    ))
}

pub async fn delete_session(
    State(state): State<AppState>,
    Path(path): Path<ChatSessionIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.chat_service.delete_session(&path.session_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn read_transcript(
    State(state): State<AppState>,
    Path(path): Path<ChatSessionIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::chat::ChatTranscriptRecord>>> {
    Ok(success(
        state.chat_service.read_transcript(&path.session_id)?,
    ))
}

pub async fn update_transcript(
    State(state): State<AppState>,
    Path(path): Path<ChatSessionIdPath>,
    Json(payload): Json<ChatTranscriptUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::chat::ChatTranscriptRecord>>> {
    Ok(success(
        state
            .chat_service
            .update_transcript(&path.session_id, payload)?,
    ))
}
