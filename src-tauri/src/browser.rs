// Browser module for handling new tab requests
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, Runtime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTabRequest {
    pub url: String,
    pub source_label: String,
}

/// Initialize browser handlers for a webview
pub fn init_browser_handlers<R: Runtime>(
    _app: &AppHandle<R>,
    webview_label: &str,
) {
    println!("[Browser] Initializing handlers for webview: {}", webview_label);
}

/// Command to handle new tab request from frontend
#[tauri::command]
pub async fn browser_new_tab_request<R: Runtime>(
    app: AppHandle<R>,
    url: String,
    source_label: String,
) -> Result<(), String> {
    println!("[Browser] New tab request received: {} from {}", url, source_label);
    
    // Emit event to frontend to create new tab
    app.emit("browser:new-tab-requested", NewTabRequest {
        url,
        source_label,
    }).map_err(|e: tauri::Error| e.to_string())?;
    
    Ok(())
}

/// Command to check if browser is supported
#[tauri::command]
pub fn browser_is_supported() -> bool {
    true
}

/// Helper to extract domain from URL
fn extract_domain(url: &str) -> Option<String> {
    url.parse::<url::Url>()
        .ok()
        .and_then(|u| u.host_str().map(|h| h.to_lowercase()))
}
