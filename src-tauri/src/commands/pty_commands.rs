use std::collections::HashMap;
use tauri::{State, Window};

use crate::framework::{run_blocking, AppContext};

#[tauri::command]
pub async fn create_pty(
    context: State<'_, AppContext>,
    window: Window,
    shell: String,
    cols: u16,
    rows: u16,
    env: Option<HashMap<String, String>>,
    initial_command: Option<String>,
) -> Result<String, String> {
    let pty_service = context.pty();
    pty_service
        .create(window, shell, cols, rows, env, initial_command)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn start_pty(
    context: State<'_, AppContext>,
    window: Window,
    pid: String,
) -> Result<(), String> {
    let pty_service = context.pty();
    pty_service
        .start(pid, window)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn write_pty(
    context: State<'_, AppContext>,
    pid: String,
    data: String,
) -> Result<(), String> {
    let pty_service = context.pty();
    pty_service
        .write(pid, data)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn resize_pty(
    context: State<'_, AppContext>,
    pid: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let pty_service = context.pty();
    pty_service
        .resize(pid, cols, rows)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn kill_pty(context: State<'_, AppContext>, pid: String) -> Result<(), String> {
    let pty_service = context.pty();
    pty_service.kill(pid).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn sync_pty_sessions(
    context: State<'_, AppContext>,
    window: Window,
    active_ids: Vec<String>,
) -> Result<(), String> {
    let pty_service = context.pty();
    pty_service
        .sync(window.label().to_string(), active_ids)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn check_executable(
    context: State<'_, AppContext>,
    name: String,
) -> Result<bool, String> {
    let pty_service = context.pty();
    run_blocking("check_executable", move || {
        pty_service.check_executable(name)
    })
    .await
    .map_err(|error| error.to_string())
}
