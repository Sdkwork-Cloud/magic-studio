use std::collections::BTreeMap;
use std::fs;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};



use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

use super::service_utils::{current_timestamp, require_non_empty_text};
const PLUGIN_REGISTRY_SCHEMA_VERSION: &str = "magic-studio.plugins-registry.v1";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginPermissionsRecord {
    pub paths: Vec<String>,
    pub commands: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginManifestRecord {
    pub id: String,
    pub name: String,
    pub version: String,
    pub kind: String,
    pub route_prefix: String,
    pub capability_set: Vec<String>,
    pub permissions: PluginPermissionsRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPluginRecord {
    pub id: String,
    pub name: String,
    pub version: String,
    pub kind: String,
    pub enabled: bool,
    pub route_prefix: String,
    pub capability_set: Vec<String>,
    pub permissions: PluginPermissionsRecord,
    pub updated_at: String,
}

pub trait PluginService: Send + Sync {
    fn list_enabled_plugins(&self, app_base_path: &str) -> ServerResult<Vec<PluginManifestRecord>>;
    fn list_admin_plugins(&self, app_base_path: &str) -> ServerResult<Vec<AdminPluginRecord>>;
    fn set_plugin_enabled(
        &self,
        plugin_id: &str,
        enabled: bool,
        app_base_path: &str,
    ) -> ServerResult<AdminPluginRecord>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PluginRegistryDocument {
    schema_version: String,
    plugins: Vec<PluginRegistryEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PluginRegistryEntry {
    id: String,
    enabled: bool,
    updated_at: String,
}

#[derive(Debug, Clone)]
struct PluginCatalogEntry {
    id: &'static str,
    name: &'static str,
    version: &'static str,
    kind: &'static str,
    route_suffix: &'static str,
    capability_set: &'static [&'static str],
    permission_paths: &'static [&'static str],
    commands: &'static str,
    default_enabled: bool,
}

pub struct FileBackedPluginService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedPluginService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn load_registry(&self) -> ServerResult<Option<PluginRegistryDocument>> {
        let path = self.storage_paths.plugins_registry_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(error) => {
                return Err(ServerError::internal(format!(
                        "failed to read plugin registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        serde_json::from_str::<PluginRegistryDocument>(&contents)
            .map(Some)
            .map_err(|error| {
                ServerError::internal(format!(
                        "failed to parse plugin registry {}: {error}",
                        path.display()
                    ),
                )
            })
    }

    fn default_registry(&self) -> PluginRegistryDocument {
        PluginRegistryDocument {
            schema_version: PLUGIN_REGISTRY_SCHEMA_VERSION.to_string(),
            plugins: plugin_catalog()
                .iter()
                .map(|plugin| PluginRegistryEntry {
                    id: plugin.id.to_string(),
                    enabled: plugin.default_enabled,
                    updated_at: current_timestamp(),
                })
                .collect(),
        }
    }

    fn read_registry(&self) -> ServerResult<PluginRegistryDocument> {
        Ok(self
            .load_registry()?
            .unwrap_or_else(|| self.default_registry()))
    }

    fn persist_registry(&self, document: &PluginRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(format!("failed to serialize plugin registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.plugins_registry_file(), contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write plugin registry to {}: {error}",
                    self.storage_paths.plugins_registry_file().display()
                ),
            )
        })
    }

    fn registry_by_id(document: &PluginRegistryDocument) -> BTreeMap<String, PluginRegistryEntry> {
        document
            .plugins
            .iter()
            .cloned()
            .map(|entry| (entry.id.clone(), entry))
            .collect()
    }

    fn manifest_from_catalog(
        &self,
        plugin: &PluginCatalogEntry,
        app_base_path: &str,
    ) -> PluginManifestRecord {
        PluginManifestRecord {
            id: plugin.id.to_string(),
            name: plugin.name.to_string(),
            version: plugin.version.to_string(),
            kind: plugin.kind.to_string(),
            route_prefix: format!("{app_base_path}/{}", plugin.route_suffix),
            capability_set: plugin
                .capability_set
                .iter()
                .map(|entry| (*entry).to_string())
                .collect(),
            permissions: PluginPermissionsRecord {
                paths: plugin
                    .permission_paths
                    .iter()
                    .map(|entry| (*entry).to_string())
                    .collect(),
                commands: plugin.commands.to_string(),
            },
        }
    }

    fn admin_record_from_catalog(
        &self,
        plugin: &PluginCatalogEntry,
        registry_entry: &PluginRegistryEntry,
        app_base_path: &str,
    ) -> AdminPluginRecord {
        let manifest = self.manifest_from_catalog(plugin, app_base_path);
        AdminPluginRecord {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            kind: manifest.kind,
            enabled: registry_entry.enabled,
            route_prefix: manifest.route_prefix,
            capability_set: manifest.capability_set,
            permissions: manifest.permissions,
            updated_at: registry_entry.updated_at.clone(),
        }
    }
}

impl PluginService for FileBackedPluginService {
    fn list_enabled_plugins(&self, app_base_path: &str) -> ServerResult<Vec<PluginManifestRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;
        let registry = self.read_registry()?;
        let registry_by_id = Self::registry_by_id(&registry);

        Ok(plugin_catalog()
            .iter()
            .filter(|plugin| {
                registry_by_id
                    .get(plugin.id)
                    .map(|entry| entry.enabled)
                    .unwrap_or(plugin.default_enabled)
            })
            .map(|plugin| self.manifest_from_catalog(plugin, app_base_path))
            .collect())
    }

    fn list_admin_plugins(&self, app_base_path: &str) -> ServerResult<Vec<AdminPluginRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;
        let registry = self.read_registry()?;
        let registry_by_id = Self::registry_by_id(&registry);

        Ok(plugin_catalog()
            .iter()
            .map(|plugin| {
                let registry_entry =
                    registry_by_id
                        .get(plugin.id)
                        .cloned()
                        .unwrap_or(PluginRegistryEntry {
                            id: plugin.id.to_string(),
                            enabled: plugin.default_enabled,
                            updated_at: current_timestamp(),
                        });
                self.admin_record_from_catalog(plugin, &registry_entry, app_base_path)
            })
            .collect())
    }

    fn set_plugin_enabled(
        &self,
        plugin_id: &str,
        enabled: bool,
        app_base_path: &str,
    ) -> ServerResult<AdminPluginRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;

        let plugin_id = require_non_empty_text(plugin_id, "PLUGIN_ID_EMPTY", "pluginId")?;
        let plugin = plugin_catalog()
            .iter()
            .find(|candidate| candidate.id == plugin_id)
            .ok_or_else(|| {
                ServerError::not_found(format!("plugin {plugin_id} was not found"),
                )
            })?;

        let mut registry = self.read_registry()?;
        let timestamp = current_timestamp();
        if let Some(entry) = registry
            .plugins
            .iter_mut()
            .find(|entry| entry.id == plugin_id)
        {
            entry.enabled = enabled;
            entry.updated_at = timestamp.clone();
        } else {
            registry.plugins.push(PluginRegistryEntry {
                id: plugin_id.clone(),
                enabled,
                updated_at: timestamp.clone(),
            });
        }
        registry
            .plugins
            .sort_by(|left, right| left.id.cmp(&right.id));
        self.persist_registry(&registry)?;

        let registry_entry = registry
            .plugins
            .iter()
            .find(|entry| entry.id == plugin_id)
            .cloned()
            .unwrap_or(PluginRegistryEntry {
                id: plugin_id,
                enabled,
                updated_at: timestamp,
            });

        Ok(self.admin_record_from_catalog(plugin, &registry_entry, app_base_path))
    }
}

fn plugin_catalog() -> &'static [PluginCatalogEntry] {
    const PLUGINS: &[PluginCatalogEntry] = &[PluginCatalogEntry {
        id: "core.runtime",
        name: "Core Runtime",
        version: "1.0.0",
        kind: "builtin",
        route_suffix: "plugins/core.runtime",
        capability_set: &[
            "policy.read",
            "plugin.catalog.read",
            "app.settings.read",
            "app.notifications.write",
        ],
        permission_paths: &["workspace", "cache", "logs"],
        commands: "governed",
        default_enabled: true,
    }];
    PLUGINS
}


