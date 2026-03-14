use tauri::{command, State};

use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn fs_ensure_dir(context: State<'_, AppContext>, path: String) -> Result<(), String> {
    let file_system_service = context.file_system();
    run_blocking("fs_ensure_dir", move || {
        file_system_service.ensure_dir(path)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn fs_exists(context: State<'_, AppContext>, path: String) -> Result<bool, String> {
    let file_system_service = context.file_system();
    run_blocking("fs_exists", move || file_system_service.exists(path))
        .await
        .map_err(|error| error.to_string())
}

#[command]
pub async fn fs_read_string(
    context: State<'_, AppContext>,
    path: String,
) -> Result<String, String> {
    let file_system_service = context.file_system();
    run_blocking("fs_read_string", move || {
        file_system_service.read_string(path)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn fs_read_bytes(
    context: State<'_, AppContext>,
    path: String,
) -> Result<Vec<u8>, String> {
    let file_system_service = context.file_system();
    run_blocking("fs_read_bytes", move || {
        file_system_service.read_bytes(path)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn fs_write_bytes(
    context: State<'_, AppContext>,
    path: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let file_system_service = context.file_system();
    run_blocking("fs_write_bytes", move || {
        file_system_service.write_bytes(path, data)
    })
    .await
    .map_err(|error| error.to_string())
}
