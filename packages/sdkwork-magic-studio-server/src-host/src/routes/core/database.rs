use axum::extract::State;
use axum::Json;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::response::{list, success, ServerResult};
use crate::services::database::DbExecuteResult;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlExecuteRequest {
    pub db_path: String,
    pub sql: String,
    #[serde(default)]
    pub params: Vec<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlExecuteBatchRequest {
    pub db_path: String,
    pub sql_batch: String,
}

pub async fn sqlite_execute(
    State(state): State<AppState>,
    Json(payload): Json<SqlExecuteRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<DbExecuteResult>>> {
    Ok(success(state.database_service.execute(
        payload.db_path,
        payload.sql,
        Some(payload.params),
    )?))
}

pub async fn sqlite_query(
    State(state): State<AppState>,
    Json(payload): Json<SqlExecuteRequest>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<Value>>> {
    Ok(list(state.database_service.query(
        payload.db_path,
        payload.sql,
        Some(payload.params),
    )?))
}

pub async fn sqlite_execute_batch(
    State(state): State<AppState>,
    Json(payload): Json<SqlExecuteBatchRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<Value>>> {
    state
        .database_service
        .execute_batch(payload.db_path, payload.sql_batch)?;
    Ok(success(json!({ "ok": true })))
}
