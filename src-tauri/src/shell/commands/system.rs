use tauri::{command, State};

use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn system_command_exists(
    context: State<'_, AppContext>,
    name: String,
) -> Result<bool, String> {
    let system_service = context.system();
    run_blocking("system_command_exists", move || {
        system_service.command_exists(name)
    })
    .await
    .map_err(|error| error.to_string())
}
