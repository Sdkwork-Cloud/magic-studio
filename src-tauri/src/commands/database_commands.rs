use serde_json::Value;
use tauri::{command, State};

use crate::framework::services::DbExecuteResult;
use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn db_execute(
    context: State<'_, AppContext>,
    db_path: String,
    sql: String,
    params: Option<Vec<Value>>,
) -> Result<DbExecuteResult, String> {
    let database_service = context.database();
    run_blocking("db_execute", move || {
        database_service.execute(db_path, sql, params)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn db_query(
    context: State<'_, AppContext>,
    db_path: String,
    sql: String,
    params: Option<Vec<Value>>,
) -> Result<Vec<Value>, String> {
    let database_service = context.database();
    run_blocking("db_query", move || {
        database_service.query(db_path, sql, params)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn db_execute_batch(
    context: State<'_, AppContext>,
    db_path: String,
    sql_batch: String,
) -> Result<(), String> {
    let database_service = context.database();
    run_blocking("db_execute_batch", move || {
        database_service.execute_batch(db_path, sql_batch)
    })
    .await
    .map_err(|error| error.to_string())
}
