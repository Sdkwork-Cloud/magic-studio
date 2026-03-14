use tauri::{command, State, Window};

use crate::framework::AppContext;

#[command]
pub async fn browser_new_tab_request(
    context: State<'_, AppContext>,
    window: Window,
    url: String,
    source_label: String,
) -> Result<(), String> {
    let browser_service = context.browser();
    browser_service
        .request_new_tab(window, url, source_label)
        .map_err(|error| error.to_string())
}

#[command]
pub async fn browser_is_supported(context: State<'_, AppContext>) -> Result<bool, String> {
    let browser_service = context.browser();
    browser_service
        .is_supported()
        .map_err(|error| error.to_string())
}
