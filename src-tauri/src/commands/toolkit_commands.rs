use tauri::{command, State};

use crate::framework::services::{
    ToolkitCapabilityMatrix, ToolkitOperation, ToolkitOperationResult,
};
use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn toolkit_capabilities(
    context: State<'_, AppContext>,
) -> Result<ToolkitCapabilityMatrix, String> {
    let toolkit_service = context.toolkit();
    run_blocking("toolkit_capabilities", move || {
        toolkit_service.capabilities()
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn toolkit_execute(
    context: State<'_, AppContext>,
    operation: ToolkitOperation,
) -> Result<ToolkitOperationResult, String> {
    let toolkit_service = context.toolkit();
    run_blocking("toolkit_execute", move || {
        toolkit_service.execute(operation)
    })
    .await
    .map_err(|error| error.to_string())
}
