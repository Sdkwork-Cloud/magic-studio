use tauri::{command, State};

use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn native_unzip(
    context: State<'_, AppContext>,
    zip_path: String,
    target_dir: String,
) -> Result<(), String> {
    let compression_service = context.compression();
    run_blocking("native_unzip", move || {
        compression_service.unzip(zip_path, target_dir)
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn native_zip_bytes(
    context: State<'_, AppContext>,
    source_paths: Vec<String>,
) -> Result<Vec<u8>, String> {
    let compression_service = context.compression();
    run_blocking("native_zip_bytes", move || {
        compression_service.zip_bytes(source_paths)
    })
    .await
    .map_err(|error| error.to_string())
}
