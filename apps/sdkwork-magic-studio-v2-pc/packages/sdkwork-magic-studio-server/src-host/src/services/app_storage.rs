use std::fs;
use std::path::{Path, PathBuf};

use crate::config::ServerConfig;
use crate::response::{ServerError, ServerResult};

const STORAGE_VENDOR_DIR: &str = "sdkwork";
const STORAGE_PRODUCT_DIR: &str = "magic-studio-v2";
const STORAGE_SERVER_DIR: &str = "server";

#[derive(Debug, Clone)]
pub struct AppStoragePaths {
    root_dir: PathBuf,
    settings_file: PathBuf,
    notifications_file: PathBuf,
    plugins_registry_file: PathBuf,
    identity_registry_file: PathBuf,
    generation_registry_file: PathBuf,
    voices_registry_file: PathBuf,
    workspaces_file: PathBuf,
    workspaces_root_dir: PathBuf,
    assets_catalog_file: PathBuf,
    managed_assets_root_dir: PathBuf,
    generated_outputs_root_dir: PathBuf,
    creation_presets_file: PathBuf,
    creation_templates_file: PathBuf,
    creation_batches_file: PathBuf,
    creation_sessions_file: PathBuf,
    creation_history_file: PathBuf,
    chat_root_dir: PathBuf,
    chat_sessions_file: PathBuf,
    chat_transcripts_root_dir: PathBuf,
    notes_registry_file: PathBuf,
    presentations_registry_file: PathBuf,
    drive_registry_file: PathBuf,
    drive_files_root_dir: PathBuf,
    trade_root_dir: PathBuf,
    trade_marketplace_file: PathBuf,
    trade_commerce_file: PathBuf,
    vip_root_dir: PathBuf,
    vip_registry_file: PathBuf,
    portal_root_dir: PathBuf,
    portal_registry_file: PathBuf,
    film_root_dir: PathBuf,
    film_projects_dir: PathBuf,
    film_presets_dir: PathBuf,
    film_templates_dir: PathBuf,
    generated_film_exports_dir: PathBuf,
    generated_film_publishes_dir: PathBuf,
    magiccut_root_dir: PathBuf,
    magiccut_projects_dir: PathBuf,
    magiccut_templates_dir: PathBuf,
    magiccut_renders_dir: PathBuf,
    generated_magiccut_renders_dir: PathBuf,
}

impl AppStoragePaths {
    pub fn from_config(config: &ServerConfig) -> Self {
        let root_dir = config
            .data_root()
            .map(PathBuf::from)
            .unwrap_or_else(resolve_default_root_dir);

        Self {
            settings_file: root_dir.join("app-settings.json"),
            notifications_file: root_dir.join("notifications.json"),
            plugins_registry_file: root_dir.join("plugins-registry.json"),
            identity_registry_file: root_dir.join("identity-registry.json"),
            generation_registry_file: root_dir.join("generation-registry.json"),
            voices_registry_file: root_dir.join("voices-registry.json"),
            workspaces_file: root_dir.join("workspaces.json"),
            workspaces_root_dir: root_dir.join("workspaces"),
            assets_catalog_file: root_dir.join("assets-catalog.json"),
            managed_assets_root_dir: root_dir.join("managed-assets"),
            generated_outputs_root_dir: root_dir.join("generated-outputs"),
            creation_presets_file: root_dir.join("creation-presets.json"),
            creation_templates_file: root_dir.join("creation-templates.json"),
            creation_batches_file: root_dir.join("creation-batches.json"),
            creation_sessions_file: root_dir.join("creation-sessions.json"),
            creation_history_file: root_dir.join("creation-history.json"),
            chat_root_dir: root_dir.join("chat"),
            chat_sessions_file: root_dir.join("chat").join("sessions.json"),
            chat_transcripts_root_dir: root_dir.join("chat").join("transcripts"),
            notes_registry_file: root_dir.join("notes-registry.json"),
            presentations_registry_file: root_dir.join("presentations-registry.json"),
            drive_registry_file: root_dir.join("drive-registry.json"),
            drive_files_root_dir: root_dir.join("drive-files"),
            trade_root_dir: root_dir.join("trade"),
            trade_marketplace_file: root_dir.join("trade").join("marketplace.json"),
            trade_commerce_file: root_dir.join("trade").join("commerce.json"),
            vip_root_dir: root_dir.join("vip"),
            vip_registry_file: root_dir.join("vip").join("registry.json"),
            portal_root_dir: root_dir.join("portal"),
            portal_registry_file: root_dir.join("portal").join("registry.json"),
            film_root_dir: root_dir.join("film"),
            film_projects_dir: root_dir.join("film").join("projects"),
            film_presets_dir: root_dir.join("film").join("presets"),
            film_templates_dir: root_dir.join("film").join("templates"),
            generated_film_exports_dir: root_dir
                .join("generated-outputs")
                .join("film")
                .join("exports"),
            generated_film_publishes_dir: root_dir
                .join("generated-outputs")
                .join("film")
                .join("publishes"),
            magiccut_root_dir: root_dir.join("magiccut"),
            magiccut_projects_dir: root_dir.join("magiccut").join("projects"),
            magiccut_templates_dir: root_dir.join("magiccut").join("templates"),
            magiccut_renders_dir: root_dir.join("magiccut").join("renders"),
            generated_magiccut_renders_dir: root_dir
                .join("generated-outputs")
                .join("magiccut")
                .join("renders"),
            root_dir,
        }
    }

    pub fn ensure_root_dir(&self) -> ServerResult<()> {
        fs::create_dir_all(&self.root_dir).map_err(|error| {
            ServerError::internal(format!(
                    "failed to create application storage root {}: {error}",
                    self.root_dir.display()
                ),
            )
        })
    }
    pub fn settings_file(&self) -> &Path {
        &self.settings_file
    }

    pub fn root_dir(&self) -> &Path {
        &self.root_dir
    }

    pub fn notifications_file(&self) -> &Path {
        &self.notifications_file
    }

    pub fn plugins_registry_file(&self) -> &Path {
        &self.plugins_registry_file
    }

    pub fn identity_registry_file(&self) -> &Path {
        &self.identity_registry_file
    }

    pub fn generation_registry_file(&self) -> &Path {
        &self.generation_registry_file
    }

    pub fn voices_registry_file(&self) -> &Path {
        &self.voices_registry_file
    }

    pub fn workspaces_file(&self) -> &Path {
        &self.workspaces_file
    }

    pub fn workspaces_root_dir(&self) -> &Path {
        &self.workspaces_root_dir
    }

    pub fn assets_catalog_file(&self) -> &Path {
        &self.assets_catalog_file
    }

    pub fn managed_assets_root_dir(&self) -> &Path {
        &self.managed_assets_root_dir
    }

    pub fn generated_outputs_root_dir(&self) -> &Path {
        &self.generated_outputs_root_dir
    }

    pub fn creation_presets_file(&self) -> &Path {
        &self.creation_presets_file
    }

    pub fn creation_templates_file(&self) -> &Path {
        &self.creation_templates_file
    }

    pub fn creation_batches_file(&self) -> &Path {
        &self.creation_batches_file
    }

    pub fn creation_sessions_file(&self) -> &Path {
        &self.creation_sessions_file
    }

    pub fn creation_history_file(&self) -> &Path {
        &self.creation_history_file
    }

    pub fn chat_root_dir(&self) -> &Path {
        &self.chat_root_dir
    }

    pub fn chat_sessions_file(&self) -> &Path {
        &self.chat_sessions_file
    }

    pub fn chat_transcripts_root_dir(&self) -> &Path {
        &self.chat_transcripts_root_dir
    }

    pub fn notes_registry_file(&self) -> &Path {
        &self.notes_registry_file
    }

    pub fn presentations_registry_file(&self) -> &Path {
        &self.presentations_registry_file
    }

    pub fn drive_registry_file(&self) -> &Path {
        &self.drive_registry_file
    }

    pub fn drive_files_root_dir(&self) -> &Path {
        &self.drive_files_root_dir
    }

    pub fn trade_root_dir(&self) -> &Path {
        &self.trade_root_dir
    }

    pub fn trade_marketplace_file(&self) -> &Path {
        &self.trade_marketplace_file
    }

    pub fn trade_commerce_file(&self) -> &Path {
        &self.trade_commerce_file
    }

    pub fn vip_root_dir(&self) -> &Path {
        &self.vip_root_dir
    }

    pub fn vip_registry_file(&self) -> &Path {
        &self.vip_registry_file
    }

    pub fn portal_root_dir(&self) -> &Path {
        &self.portal_root_dir
    }

    pub fn portal_registry_file(&self) -> &Path {
        &self.portal_registry_file
    }

    pub fn film_root_dir(&self) -> &Path {
        &self.film_root_dir
    }

    pub fn film_projects_dir(&self) -> &Path {
        &self.film_projects_dir
    }

    pub fn film_presets_dir(&self) -> &Path {
        &self.film_presets_dir
    }

    pub fn film_templates_dir(&self) -> &Path {
        &self.film_templates_dir
    }

    pub fn generated_film_exports_dir(&self) -> &Path {
        &self.generated_film_exports_dir
    }

    pub fn generated_film_publishes_dir(&self) -> &Path {
        &self.generated_film_publishes_dir
    }

    pub fn magiccut_root_dir(&self) -> &Path {
        &self.magiccut_root_dir
    }

    pub fn magiccut_projects_dir(&self) -> &Path {
        &self.magiccut_projects_dir
    }

    pub fn magiccut_templates_dir(&self) -> &Path {
        &self.magiccut_templates_dir
    }

    pub fn magiccut_renders_dir(&self) -> &Path {
        &self.magiccut_renders_dir
    }

    pub fn generated_magiccut_renders_dir(&self) -> &Path {
        &self.generated_magiccut_renders_dir
    }
}

fn resolve_default_root_dir() -> PathBuf {
    let base_dir = dirs::data_local_dir()
        .or_else(dirs::config_dir)
        .unwrap_or_else(std::env::temp_dir);

    base_dir
        .join(STORAGE_VENDOR_DIR)
        .join(STORAGE_PRODUCT_DIR)
        .join(STORAGE_SERVER_DIR)
}
