use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, Window};
use url::Url;

use crate::framework::error::{FrameworkError, FrameworkResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTabRequest {
    pub url: String,
    pub source_label: String,
}

pub trait BrowserService: Send + Sync {
    fn request_new_tab(
        &self,
        window: Window,
        url: String,
        source_label: String,
    ) -> FrameworkResult<()>;
    fn is_supported(&self) -> FrameworkResult<bool>;
}

#[derive(Default)]
pub struct AppBrowserService;

fn validate_browser_url(url: &str) -> FrameworkResult<()> {
    let parsed = Url::parse(url).map_err(|error| {
        FrameworkError::new(
            "BROWSER_INVALID_URL",
            format!("invalid browser URL: {error}"),
        )
    })?;
    let scheme = parsed.scheme().to_ascii_lowercase();
    let allowed = ["http", "https", "file", "data", "blob", "asset", "assets"];
    if allowed.contains(&scheme.as_str()) {
        return Ok(());
    }
    Err(FrameworkError::new(
        "BROWSER_URL_SCHEME_NOT_ALLOWED",
        format!("URL scheme is not allowed: {scheme}"),
    ))
}

impl BrowserService for AppBrowserService {
    fn request_new_tab(
        &self,
        window: Window,
        url: String,
        source_label: String,
    ) -> FrameworkResult<()> {
        let normalized = url.trim().to_string();
        if normalized.is_empty() {
            return Err(FrameworkError::new(
                "BROWSER_URL_EMPTY",
                "new tab URL cannot be empty",
            ));
        }
        validate_browser_url(&normalized)?;

        window
            .app_handle()
            .emit(
                "browser:new-tab-requested",
                NewTabRequest {
                    url: normalized,
                    source_label,
                },
            )
            .map_err(|error: tauri::Error| {
                FrameworkError::new("BROWSER_EMIT_NEW_TAB_EVENT_FAILED", error.to_string())
            })
    }

    fn is_supported(&self) -> FrameworkResult<bool> {
        Ok(true)
    }
}
