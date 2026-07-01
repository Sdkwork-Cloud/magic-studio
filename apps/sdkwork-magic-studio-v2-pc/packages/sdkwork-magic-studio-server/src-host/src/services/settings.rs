use std::fs;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};



use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

use super::service_utils::{current_timestamp};
const SETTINGS_SCOPE: &str = "user";
const SETTINGS_SCHEMA_VERSION: &str = "magic-studio.app-settings.v1";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsDocument {
    pub scope: String,
    pub schema_version: String,
    pub settings: Map<String, Value>,
    pub updated_at: String,
}

pub trait AppSettingsService: Send + Sync {
    fn read_settings(&self) -> ServerResult<AppSettingsDocument>;
    fn update_settings(&self, settings: Map<String, Value>) -> ServerResult<AppSettingsDocument>;
}

pub struct FileBackedAppSettingsService {
    storage_paths: AppStoragePaths,
    default_shell: String,
    lock: Mutex<()>,
}

impl FileBackedAppSettingsService {
    pub fn new(storage_paths: AppStoragePaths, default_shell: String) -> Self {
        Self {
            storage_paths,
            default_shell,
            lock: Mutex::new(()),
        }
    }

    fn default_settings(&self) -> Map<String, Value> {
        json!({
            "general": {
                "appMode": "creator",
                "language": "system",
                "checkUpdates": true,
                "telemetry": false,
                "developerMode": false
            },
            "appearance": {
                "theme": "system",
                "sidebarPosition": "left"
            },
            "terminal": {
                "defaultShell": self.default_shell
            },
            "browser": {
                "autoImportToAssets": true
            },
            "storage": {},
            "materialStorage": {
                "mode": "local-first-sync"
            }
        })
        .as_object()
        .cloned()
        .unwrap_or_default()
    }

    fn default_document(&self) -> AppSettingsDocument {
        AppSettingsDocument {
            scope: SETTINGS_SCOPE.to_string(),
            schema_version: SETTINGS_SCHEMA_VERSION.to_string(),
            settings: self.default_settings(),
            updated_at: current_timestamp(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<Option<AppSettingsDocument>> {
        let path = self.storage_paths.settings_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(error) => {
                return Err(ServerError::internal(format!(
                        "failed to read settings document from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        serde_json::from_str::<AppSettingsDocument>(&contents)
            .map(Some)
            .map_err(|error| {
                ServerError::internal(format!(
                        "failed to parse settings document {}: {error}",
                        path.display()
                    ),
                )
            })
    }

    fn persist_to_disk(&self, document: &AppSettingsDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(format!("failed to serialize settings document: {error}"),
            )
        })?;

        fs::write(self.storage_paths.settings_file(), contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write settings document to {}: {error}",
                    self.storage_paths.settings_file().display()
                ),
            )
        })
    }
}

impl AppSettingsService for FileBackedAppSettingsService {
    fn read_settings(&self) -> ServerResult<AppSettingsDocument> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;

        Ok(self
            .load_from_disk()?
            .unwrap_or_else(|| self.default_document()))
    }

    fn update_settings(&self, settings: Map<String, Value>) -> ServerResult<AppSettingsDocument> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;

        let document = AppSettingsDocument {
            scope: SETTINGS_SCOPE.to_string(),
            schema_version: SETTINGS_SCHEMA_VERSION.to_string(),
            settings,
            updated_at: current_timestamp(),
        };

        self.persist_to_disk(&document)?;
        Ok(document)
    }
}

