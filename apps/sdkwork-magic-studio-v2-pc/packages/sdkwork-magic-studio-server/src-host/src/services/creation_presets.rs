use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};

use serde::de::Deserializer;
use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::creation::CreationSessionAttachmentRecord;
use super::creation_support::{
    current_time_millis, normalize_creation_session_attachments, normalize_creation_target,
    normalize_optional_text, require_non_empty_text, to_client_entity_uuid,
};

const CREATION_PRESETS_SCHEMA_VERSION: &str = "magic-studio.creation-presets.v1";
const DEFAULT_CREATION_PRESET_PAGE_SIZE: usize = 50;
const MAX_CREATION_PRESET_PAGE_SIZE: usize = 200;

static CREATION_PRESET_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationPresetRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub target: String,
    pub workspace_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gen_mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    #[serde(default)]
    pub attachments: Vec<CreationSessionAttachmentRecord>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub is_favorite: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone)]
pub struct CreationPresetListResult {
    pub items: Vec<CreationPresetRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreationPresetListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub keyword: Option<String>,
    pub target: Option<String>,
    pub workspace_id: Option<String>,
    pub project_id: Option<String>,
    pub favorite_only: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreationPresetRequest {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub target: String,
    pub workspace_id: String,
    #[serde(default)]
    pub project_id: Option<String>,
    #[serde(default)]
    pub prompt: Option<String>,
    #[serde(default)]
    pub gen_mode: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub style_id: Option<String>,
    #[serde(default)]
    pub aspect_ratio: Option<String>,
    #[serde(default)]
    pub resolution: Option<String>,
    #[serde(default)]
    pub duration: Option<String>,
    #[serde(default)]
    pub attachments: Option<Vec<CreationSessionAttachmentRecord>>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCreationPresetRequest {
    pub name: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub description: CreationPresetOptionalTextUpdate,
    pub target: Option<String>,
    pub workspace_id: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub project_id: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub prompt: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub gen_mode: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub model: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub style_id: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub aspect_ratio: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub resolution: CreationPresetOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_preset_optional_text_update"
    )]
    pub duration: CreationPresetOptionalTextUpdate,
    pub attachments: Option<Vec<CreationSessionAttachmentRecord>>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreationPresetDocument {
    schema_version: String,
    #[serde(default)]
    presets: Vec<CreationPresetRecord>,
}

#[derive(Debug, Clone, Default)]
pub enum CreationPresetOptionalTextUpdate {
    #[default]
    Missing,
    Clear,
    Set(String),
}

pub trait CreationPresetService: Send + Sync {
    fn list_presets(
        &self,
        query: CreationPresetListQuery,
    ) -> ServerResult<CreationPresetListResult>;
    fn create_preset(
        &self,
        input: CreateCreationPresetRequest,
    ) -> ServerResult<CreationPresetRecord>;
    fn read_preset(&self, preset_key: &str) -> ServerResult<CreationPresetRecord>;
    fn update_preset(
        &self,
        preset_key: &str,
        input: UpdateCreationPresetRequest,
    ) -> ServerResult<CreationPresetRecord>;
    fn delete_preset(&self, preset_key: &str) -> ServerResult<()>;
}

pub struct FileBackedCreationPresetService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedCreationPresetService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })
    }

    fn default_document(&self) -> CreationPresetDocument {
        CreationPresetDocument {
            schema_version: CREATION_PRESETS_SCHEMA_VERSION.to_string(),
            presets: Vec::new(),
        }
    }

    fn load_document(&self) -> ServerResult<CreationPresetDocument> {
        let path = self.storage_paths.creation_presets_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(format!(
                        "failed to read creation presets from {}: {error}",
                        path.display()
                    ),
                ))
            }
        };

        let mut document =
            serde_json::from_str::<CreationPresetDocument>(&contents).map_err(|error| {
                ServerError::internal(format!(
                        "failed to parse creation presets document {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_document(&self, document: &CreationPresetDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(format!("failed to serialize creation presets: {error}"),
            )
        })?;

        fs::write(self.storage_paths.creation_presets_file(), contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write creation presets to {}: {error}",
                    self.storage_paths.creation_presets_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut CreationPresetDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = CREATION_PRESETS_SCHEMA_VERSION.to_string();
        }

        for preset in &mut document.presets {
            preset.uuid = normalize_optional_text(Some(preset.uuid.clone()))
                .unwrap_or_else(|| to_client_entity_uuid(&preset.id));
            preset.name = normalize_optional_text(Some(preset.name.clone()))
                .unwrap_or_else(|| "Untitled Preset".to_string());
            preset.description = normalize_optional_text(preset.description.clone());
            preset.target = normalize_creation_target(
                Some(preset.target.clone()),
                "CREATION_PRESET_TARGET_INVALID",
            )
            .unwrap_or_else(|_| "image".to_string());
            preset.workspace_id = normalize_optional_text(Some(preset.workspace_id.clone()))
                .unwrap_or_else(|| "default".to_string());
            preset.project_id = normalize_optional_text(preset.project_id.clone());
            preset.prompt = normalize_optional_text(preset.prompt.clone());
            preset.gen_mode = normalize_optional_text(preset.gen_mode.clone());
            preset.model = normalize_optional_text(preset.model.clone());
            preset.style_id = normalize_optional_text(preset.style_id.clone());
            preset.aspect_ratio = normalize_optional_text(preset.aspect_ratio.clone());
            preset.resolution = normalize_optional_text(preset.resolution.clone());
            preset.duration = normalize_optional_text(preset.duration.clone());
            preset.attachments = normalize_creation_session_attachments(preset.attachments.clone());
            preset.tags = normalize_creation_preset_tags(preset.tags.clone());
        }

        sort_creation_presets(&mut document.presets);
    }

    fn find_preset<'a>(
        &self,
        document: &'a CreationPresetDocument,
        preset_key: &str,
    ) -> ServerResult<&'a CreationPresetRecord> {
        let normalized = require_non_empty_text(
            preset_key.to_string(),
            "CREATION_PRESET_ID_EMPTY",
            "presetId",
        )?;

        document
            .presets
            .iter()
            .find(|preset| preset.id == normalized || preset.uuid == normalized)
            .ok_or_else(|| {
                ServerError::not_found(format!("creation preset {normalized} was not found"),
                )
            })
    }

    fn find_preset_mut<'a>(
        &self,
        document: &'a mut CreationPresetDocument,
        preset_key: &str,
    ) -> ServerResult<&'a mut CreationPresetRecord> {
        let normalized = require_non_empty_text(
            preset_key.to_string(),
            "CREATION_PRESET_ID_EMPTY",
            "presetId",
        )?;

        document
            .presets
            .iter_mut()
            .find(|preset| preset.id == normalized || preset.uuid == normalized)
            .ok_or_else(|| {
                ServerError::not_found(format!("creation preset {normalized} was not found"),
                )
            })
    }
}

impl CreationPresetService for FileBackedCreationPresetService {
    fn list_presets(
        &self,
        query: CreationPresetListQuery,
    ) -> ServerResult<CreationPresetListResult> {
        let _guard = self.acquire_lock()?;
        let document = self.load_document()?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query
            .page_size
            .unwrap_or(DEFAULT_CREATION_PRESET_PAGE_SIZE)
            .clamp(1, MAX_CREATION_PRESET_PAGE_SIZE);
        let keyword =
            normalize_optional_text(query.keyword).map(|value| value.to_ascii_lowercase());
        let target = match query.target {
            Some(value) => Some(normalize_creation_target(
                Some(value),
                "CREATION_PRESET_TARGET_INVALID",
            )?),
            None => None,
        };
        let workspace_id = normalize_optional_text(query.workspace_id);
        let project_id = normalize_optional_text(query.project_id);
        let favorite_only = query.favorite_only.unwrap_or(false);

        let filtered = document
            .presets
            .into_iter()
            .filter(|preset| {
                target
                    .as_ref()
                    .map(|target| preset.target == *target)
                    .unwrap_or(true)
            })
            .filter(|preset| {
                workspace_id
                    .as_ref()
                    .map(|workspace_id| preset.workspace_id == *workspace_id)
                    .unwrap_or(true)
            })
            .filter(|preset| {
                project_id
                    .as_ref()
                    .map(|project_id| preset.project_id.as_deref() == Some(project_id.as_str()))
                    .unwrap_or(true)
            })
            .filter(|preset| !favorite_only || preset.is_favorite)
            .filter(|preset| {
                keyword
                    .as_ref()
                    .map(|keyword| creation_preset_matches_keyword(preset, keyword))
                    .unwrap_or(true)
            })
            .collect::<Vec<_>>();

        let total = filtered.len();
        let start = (page - 1).saturating_mul(page_size);
        let items = filtered
            .into_iter()
            .skip(start)
            .take(page_size)
            .collect::<Vec<_>>();

        Ok(CreationPresetListResult {
            items,
            page,
            page_size,
            total,
        })
    }

    fn create_preset(
        &self,
        input: CreateCreationPresetRequest,
    ) -> ServerResult<CreationPresetRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let now_ms = current_time_millis();
        let preset_id = next_creation_preset_id(now_ms);
        let preset = CreationPresetRecord {
            id: preset_id.clone(),
            uuid: to_client_entity_uuid(&preset_id),
            name: require_non_empty_text(input.name, "CREATION_PRESET_NAME_EMPTY", "name")?,
            description: normalize_optional_text(input.description),
            target: normalize_creation_target(
                Some(input.target),
                "CREATION_PRESET_TARGET_INVALID",
            )?,
            workspace_id: require_non_empty_text(
                input.workspace_id,
                "CREATION_PRESET_WORKSPACE_ID_EMPTY",
                "workspaceId",
            )?,
            project_id: normalize_optional_text(input.project_id),
            prompt: normalize_optional_text(input.prompt),
            gen_mode: normalize_optional_text(input.gen_mode),
            model: normalize_optional_text(input.model),
            style_id: normalize_optional_text(input.style_id),
            aspect_ratio: normalize_optional_text(input.aspect_ratio),
            resolution: normalize_optional_text(input.resolution),
            duration: normalize_optional_text(input.duration),
            attachments: normalize_creation_session_attachments(
                input.attachments.unwrap_or_default(),
            ),
            tags: normalize_creation_preset_tags(input.tags.unwrap_or_default()),
            is_favorite: input.is_favorite.unwrap_or(false),
            created_at: now_ms,
            updated_at: now_ms,
        };

        document.presets.push(preset.clone());
        sort_creation_presets(&mut document.presets);
        self.persist_document(&document)?;
        Ok(preset)
    }

    fn read_preset(&self, preset_key: &str) -> ServerResult<CreationPresetRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_document()?;
        Ok(self.find_preset(&document, preset_key)?.clone())
    }

    fn update_preset(
        &self,
        preset_key: &str,
        input: UpdateCreationPresetRequest,
    ) -> ServerResult<CreationPresetRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let preset = self.find_preset_mut(&mut document, preset_key)?;

        if let Some(name) = input.name {
            preset.name = require_non_empty_text(name, "CREATION_PRESET_NAME_EMPTY", "name")?;
        }

        if let Some(target) = input.target {
            preset.target =
                normalize_creation_target(Some(target), "CREATION_PRESET_TARGET_INVALID")?;
        }

        if let Some(workspace_id) = input.workspace_id {
            preset.workspace_id = require_non_empty_text(
                workspace_id,
                "CREATION_PRESET_WORKSPACE_ID_EMPTY",
                "workspaceId",
            )?;
        }

        apply_optional_text_update(&mut preset.description, input.description);
        apply_optional_text_update(&mut preset.project_id, input.project_id);
        apply_optional_text_update(&mut preset.prompt, input.prompt);
        apply_optional_text_update(&mut preset.gen_mode, input.gen_mode);
        apply_optional_text_update(&mut preset.model, input.model);
        apply_optional_text_update(&mut preset.style_id, input.style_id);
        apply_optional_text_update(&mut preset.aspect_ratio, input.aspect_ratio);
        apply_optional_text_update(&mut preset.resolution, input.resolution);
        apply_optional_text_update(&mut preset.duration, input.duration);

        if let Some(attachments) = input.attachments {
            preset.attachments = normalize_creation_session_attachments(attachments);
        }

        if let Some(tags) = input.tags {
            preset.tags = normalize_creation_preset_tags(tags);
        }

        if let Some(is_favorite) = input.is_favorite {
            preset.is_favorite = is_favorite;
        }

        preset.updated_at = current_time_millis();
        let updated = preset.clone();
        sort_creation_presets(&mut document.presets);
        self.persist_document(&document)?;
        Ok(updated)
    }

    fn delete_preset(&self, preset_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let preset_id = self.find_preset(&document, preset_key)?.id.clone();
        let before_len = document.presets.len();
        document.presets.retain(|preset| preset.id != preset_id);

        if document.presets.len() == before_len {
            return Err(ServerError::not_found(format!("creation preset {preset_key} was not found"),
            ));
        }

        self.persist_document(&document)?;
        Ok(())
    }
}

fn creation_preset_matches_keyword(preset: &CreationPresetRecord, keyword: &str) -> bool {
    preset.name.to_ascii_lowercase().contains(keyword)
        || preset
            .description
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || preset
            .prompt
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || preset
            .model
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || preset
            .tags
            .iter()
            .any(|tag| tag.to_ascii_lowercase().contains(keyword))
}

fn sort_creation_presets(presets: &mut [CreationPresetRecord]) {
    presets.sort_by(|left, right| {
        right
            .is_favorite
            .cmp(&left.is_favorite)
            .then_with(|| right.updated_at.cmp(&left.updated_at))
            .then_with(|| {
                left.name
                    .to_ascii_lowercase()
                    .cmp(&right.name.to_ascii_lowercase())
            })
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn apply_optional_text_update(slot: &mut Option<String>, update: CreationPresetOptionalTextUpdate) {
    match update {
        CreationPresetOptionalTextUpdate::Missing => {}
        CreationPresetOptionalTextUpdate::Clear => {
            *slot = None;
        }
        CreationPresetOptionalTextUpdate::Set(value) => {
            *slot = normalize_optional_text(Some(value));
        }
    }
}

fn deserialize_creation_preset_optional_text_update<'de, D>(
    deserializer: D,
) -> Result<CreationPresetOptionalTextUpdate, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<String>::deserialize(deserializer)? {
        Some(value) => Ok(CreationPresetOptionalTextUpdate::Set(value)),
        None => Ok(CreationPresetOptionalTextUpdate::Clear),
    }
}

fn normalize_creation_preset_tags(tags: Vec<String>) -> Vec<String> {
    let mut seen = std::collections::BTreeSet::new();
    let mut normalized = Vec::new();

    for tag in tags {
        let normalized_tag = tag.trim().to_string();
        if normalized_tag.is_empty() {
            continue;
        }

        let dedupe_key = normalized_tag.to_ascii_lowercase();
        if seen.insert(dedupe_key) {
            normalized.push(normalized_tag);
        }
    }

    normalized
}

fn next_creation_preset_id(now_ms: i64) -> String {
    let counter = CREATION_PRESET_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("creation-preset-{now_ms}-{counter}")
}
