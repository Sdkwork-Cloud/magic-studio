use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use serde::de::Deserializer;
use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::creation::{
    CreateCreationSessionRequest, CreationService, CreationSessionAttachmentRecord,
    CreationSessionRecord,
};
use super::creation_presets::{CreationPresetRecord, CreationPresetService};
use super::creation_support::{
    current_time_millis, merge_creation_session_attachments,
    normalize_creation_session_attachments, normalize_creation_target,
    normalize_creation_template_step_id, normalize_optional_text, require_non_empty_text,
    to_client_entity_uuid,
};
use super::creation_templates::{
    CreationTemplateRecord, CreationTemplateService, CreationTemplateStepRecord,
};
use super::generation::{
    GenerationProduct, GenerationService, GenerationTaskRecord, GenerationTaskStatus,
};
use super::voices::VoiceService;

const CREATION_BATCHES_SCHEMA_VERSION: &str = "magic-studio.creation-batches.v1";
const DEFAULT_CREATION_BATCH_PAGE_SIZE: usize = 50;
const MAX_CREATION_BATCH_PAGE_SIZE: usize = 200;

const CREATION_BATCH_SOURCE_MANUAL: &str = "manual";
const CREATION_BATCH_SOURCE_TEMPLATE: &str = "template";

const CREATION_BATCH_STATUS_DRAFT: &str = "draft";
const CREATION_BATCH_STATUS_READY: &str = "ready";
const CREATION_BATCH_STATUS_RUNNING: &str = "running";
const CREATION_BATCH_STATUS_COMPLETED: &str = "completed";
const CREATION_BATCH_STATUS_CANCELLED: &str = "cancelled";

const CREATION_BATCH_ITEM_STATUS_PENDING: &str = "pending";
const CREATION_BATCH_ITEM_STATUS_MATERIALIZED: &str = "materialized";
const CREATION_BATCH_ITEM_STATUS_QUEUED: &str = "queued";
const CREATION_BATCH_ITEM_STATUS_PROCESSING: &str = "processing";
const CREATION_BATCH_ITEM_STATUS_COMPLETED: &str = "completed";
const CREATION_BATCH_ITEM_STATUS_FAILED: &str = "failed";
const CREATION_BATCH_ITEM_STATUS_CANCELLED: &str = "cancelled";
const CREATION_BATCH_ITEM_STATUS_SKIPPED: &str = "skipped";

const CREATION_BATCH_EXECUTION_MODE_SERIAL: &str = "serial";
const CREATION_BATCH_EXECUTION_FAMILY_GENERATION: &str = "generation";
const CREATION_BATCH_EXECUTION_FAMILY_VOICE_SPEECH: &str = "voice_speech";
const CREATION_BATCH_SESSION_SOURCE: &str = "creation-batch";

static CREATION_BATCH_COUNTER: AtomicU64 = AtomicU64::new(1);
static CREATION_BATCH_ITEM_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationBatchItemExecutionLinkRecord {
    pub family: String,
    pub task_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history_entry_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product: Option<String>,
    pub linked_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationBatchItemRecord {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_step_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preset_id: Option<String>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_materialized_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution: Option<CreationBatchItemExecutionLinkRecord>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreationBatchProgressRecord {
    pub total: usize,
    pub pending: usize,
    pub materialized: usize,
    pub queued: usize,
    pub processing: usize,
    pub completed: usize,
    pub failed: usize,
    pub cancelled: usize,
    pub skipped: usize,
    pub terminal: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationBatchRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub target: String,
    pub source_kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,
    pub workspace_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    pub status: String,
    pub execution_mode: String,
    #[serde(default)]
    pub items: Vec<CreationBatchItemRecord>,
    #[serde(default)]
    pub progress: CreationBatchProgressRecord,
    #[serde(default)]
    pub tags: Vec<String>,
    pub is_favorite: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_materialized_item_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone)]
pub struct CreationBatchListResult {
    pub items: Vec<CreationBatchRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreationBatchListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub keyword: Option<String>,
    pub target: Option<String>,
    pub workspace_id: Option<String>,
    pub project_id: Option<String>,
    pub status: Option<String>,
    pub favorite_only: Option<bool>,
    pub source_kind: Option<String>,
    pub template_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreationBatchItemRequest {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub template_step_id: Option<String>,
    #[serde(default)]
    pub preset_id: Option<String>,
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
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreationBatchRequest {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub target: String,
    #[serde(default)]
    pub template_id: Option<String>,
    pub workspace_id: String,
    #[serde(default)]
    pub project_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub items: Option<Vec<CreateCreationBatchItemRequest>>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCreationBatchRequest {
    pub name: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub description: CreationBatchOptionalTextUpdate,
    pub target: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub template_id: CreationBatchOptionalTextUpdate,
    pub workspace_id: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub project_id: CreationBatchOptionalTextUpdate,
    pub status: Option<String>,
    pub items: Option<Vec<CreateCreationBatchItemRequest>>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MaterializeCreationBatchRequest {
    #[serde(default)]
    pub item_id: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub project_id: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub prompt: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub gen_mode: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub model: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub style_id: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub aspect_ratio: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub resolution: CreationBatchOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub duration: CreationBatchOptionalTextUpdate,
    pub attachments: Option<Vec<CreationSessionAttachmentRecord>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCreationBatchItemStatusRequest {
    pub status: String,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_batch_optional_text_update"
    )]
    pub error: CreationBatchOptionalTextUpdate,
    #[serde(default)]
    pub task_family: Option<String>,
    #[serde(default)]
    pub task_id: Option<String>,
    #[serde(default)]
    pub history_entry_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationBatchMaterializationRecord {
    pub batch: CreationBatchRecord,
    pub item: CreationBatchItemRecord,
    pub session: CreationSessionRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreationBatchDocument {
    schema_version: String,
    #[serde(default)]
    batches: Vec<CreationBatchRecord>,
}

#[derive(Debug, Clone, Default)]
pub enum CreationBatchOptionalTextUpdate {
    #[default]
    Missing,
    Clear,
    Set(String),
}

pub trait CreationBatchService: Send + Sync {
    fn list_batches(&self, query: CreationBatchListQuery) -> ServerResult<CreationBatchListResult>;
    fn create_batch(&self, input: CreateCreationBatchRequest) -> ServerResult<CreationBatchRecord>;
    fn read_batch(&self, batch_key: &str) -> ServerResult<CreationBatchRecord>;
    fn update_batch(
        &self,
        batch_key: &str,
        input: UpdateCreationBatchRequest,
    ) -> ServerResult<CreationBatchRecord>;
    fn delete_batch(&self, batch_key: &str) -> ServerResult<()>;
    fn materialize_batch(
        &self,
        batch_key: &str,
        input: MaterializeCreationBatchRequest,
    ) -> ServerResult<CreationBatchMaterializationRecord>;
    fn update_batch_item_status(
        &self,
        batch_key: &str,
        item_key: &str,
        input: UpdateCreationBatchItemStatusRequest,
    ) -> ServerResult<CreationBatchRecord>;
}

pub struct FileBackedCreationBatchService {
    storage_paths: AppStoragePaths,
    creation_service: Arc<dyn CreationService>,
    creation_preset_service: Arc<dyn CreationPresetService>,
    creation_template_service: Arc<dyn CreationTemplateService>,
    generation_service: Arc<dyn GenerationService>,
    voice_service: Arc<dyn VoiceService>,
    lock: Mutex<()>,
}

impl FileBackedCreationBatchService {
    pub fn new(
        storage_paths: AppStoragePaths,
        creation_service: Arc<dyn CreationService>,
        creation_preset_service: Arc<dyn CreationPresetService>,
        creation_template_service: Arc<dyn CreationTemplateService>,
        generation_service: Arc<dyn GenerationService>,
        voice_service: Arc<dyn VoiceService>,
    ) -> Self {
        Self {
            storage_paths,
            creation_service,
            creation_preset_service,
            creation_template_service,
            generation_service,
            voice_service,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_BATCHES_LOCK_FAILED",
                "failed to acquire creation batches lock",
            )
        })
    }

    fn default_document(&self) -> CreationBatchDocument {
        CreationBatchDocument {
            schema_version: CREATION_BATCHES_SCHEMA_VERSION.to_string(),
            batches: Vec::new(),
        }
    }

    fn load_document(&self) -> ServerResult<CreationBatchDocument> {
        let path = self.storage_paths.creation_batches_file();
        if !path.exists() {
            return Ok(self.default_document());
        }

        let contents = fs::read_to_string(path).map_err(|error| {
            ServerError::internal(
                "CREATION_BATCHES_READ_FAILED",
                format!(
                    "failed to read creation batches from {}: {error}",
                    path.display()
                ),
            )
        })?;

        if contents.trim().is_empty() {
            return Ok(self.default_document());
        }

        let mut document =
            serde_json::from_str::<CreationBatchDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "CREATION_BATCHES_PARSE_FAILED",
                    format!(
                        "failed to parse creation batches document {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_document(&self, document: &CreationBatchDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(
                "CREATION_BATCHES_SERIALIZE_FAILED",
                format!("failed to serialize creation batches: {error}"),
            )
        })?;

        fs::write(self.storage_paths.creation_batches_file(), contents).map_err(|error| {
            ServerError::internal(
                "CREATION_BATCHES_WRITE_FAILED",
                format!(
                    "failed to write creation batches to {}: {error}",
                    self.storage_paths.creation_batches_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut CreationBatchDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = CREATION_BATCHES_SCHEMA_VERSION.to_string();
        }

        for batch in &mut document.batches {
            batch.uuid = normalize_optional_text(Some(batch.uuid.clone()))
                .unwrap_or_else(|| to_client_entity_uuid(&batch.id));
            batch.name = normalize_optional_text(Some(batch.name.clone()))
                .unwrap_or_else(|| "Untitled Batch".to_string());
            batch.description = normalize_optional_text(batch.description.clone());
            batch.target = normalize_creation_target(
                Some(batch.target.clone()),
                "CREATION_BATCH_TARGET_INVALID",
            )
            .unwrap_or_else(|_| "image".to_string());
            batch.template_id = normalize_optional_text(batch.template_id.clone());
            batch.source_kind = normalize_creation_batch_source_kind(batch.template_id.as_deref());
            batch.workspace_id = normalize_optional_text(Some(batch.workspace_id.clone()))
                .unwrap_or_else(|| "default".to_string());
            batch.project_id = normalize_optional_text(batch.project_id.clone());
            batch.execution_mode = CREATION_BATCH_EXECUTION_MODE_SERIAL.to_string();
            batch.tags = normalize_creation_batch_tags(batch.tags.clone());
            batch.last_materialized_item_id =
                normalize_optional_text(batch.last_materialized_item_id.clone());

            let mut normalized_items = Vec::new();
            for item in batch.items.clone() {
                normalized_items.push(normalize_loaded_batch_item(item));
            }
            batch.items = normalized_items;
            reconcile_batch_record(batch);
        }

        sort_creation_batches(&mut document.batches);
    }

    fn find_batch_index(
        &self,
        document: &CreationBatchDocument,
        batch_key: &str,
    ) -> ServerResult<usize> {
        let key =
            require_non_empty_text(batch_key.to_string(), "CREATION_BATCH_ID_EMPTY", "batchId")?;
        document
            .batches
            .iter()
            .position(|batch| batch.id == key || batch.uuid == key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "CREATION_BATCH_NOT_FOUND",
                    format!("creation batch {batch_key} was not found"),
                )
            })
    }

    fn resolve_template(
        &self,
        template_id: Option<&str>,
        target: &str,
        workspace_id: &str,
    ) -> ServerResult<Option<CreationTemplateRecord>> {
        let Some(template_id) = template_id else {
            return Ok(None);
        };

        let template = self.creation_template_service.read_template(template_id)?;
        if template.workspace_id != workspace_id {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_TEMPLATE_WORKSPACE_MISMATCH",
                format!(
                    "creation batch workspace {workspace_id} does not match template workspace {}",
                    template.workspace_id
                ),
            ));
        }
        if template.primary_target != target {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_TEMPLATE_TARGET_MISMATCH",
                format!(
                    "creation batch target {target} does not match template primary target {}",
                    template.primary_target
                ),
            ));
        }

        Ok(Some(template))
    }

    fn validate_preset_for_batch_scope(
        &self,
        preset_key: &str,
        target: &str,
        workspace_id: &str,
    ) -> ServerResult<CreationPresetRecord> {
        let preset = self.creation_preset_service.read_preset(preset_key)?;
        if preset.target != target {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_PRESET_TARGET_MISMATCH",
                format!(
                    "creation batch target {target} does not match preset target {}",
                    preset.target
                ),
            ));
        }
        if preset.workspace_id != workspace_id {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_PRESET_WORKSPACE_MISMATCH",
                format!(
                    "creation batch workspace {workspace_id} does not match preset workspace {}",
                    preset.workspace_id
                ),
            ));
        }
        Ok(preset)
    }

    fn normalize_batch_items_from_input(
        &self,
        items: Vec<CreateCreationBatchItemRequest>,
        target: &str,
        workspace_id: &str,
        template: Option<&CreationTemplateRecord>,
        now_ms: i64,
    ) -> ServerResult<Vec<CreationBatchItemRecord>> {
        let mut seen = std::collections::BTreeSet::new();
        let mut normalized = Vec::new();

        for item in items {
            let item_id = normalize_optional_text(item.id)
                .map(|value| normalize_creation_batch_item_id(&value))
                .unwrap_or_else(|| next_creation_batch_item_id(now_ms));

            if !seen.insert(item_id.clone()) {
                return Err(ServerError::bad_request(
                    "CREATION_BATCH_ITEM_ID_DUPLICATE",
                    format!("duplicate creation batch item id {item_id}"),
                ));
            }

            let template_step_id = normalize_optional_text(item.template_step_id)
                .map(|value| normalize_creation_template_step_id(&value));
            let preset_id = normalize_optional_text(item.preset_id);
            let attachments =
                normalize_creation_session_attachments(item.attachments.unwrap_or_default());

            if let Some(template) = template {
                if preset_id.is_some() {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_TEMPLATE_ITEM_PRESET_UNSUPPORTED",
                        "template-backed creation batch items must not set presetId because preset authority belongs to the referenced template step",
                    ));
                }
                let step =
                    resolve_creation_batch_template_step(template, template_step_id.as_deref())?;
                if step.target != target {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_TEMPLATE_STEP_TARGET_MISMATCH",
                        format!(
                            "creation batch target {target} does not match template step target {}",
                            step.target
                        ),
                    ));
                }
            } else {
                if template_step_id.is_some() {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_MANUAL_ITEM_TEMPLATE_STEP_UNSUPPORTED",
                        "manual creation batch items must not set templateStepId",
                    ));
                }
                if let Some(preset_key) = preset_id.as_deref() {
                    self.validate_preset_for_batch_scope(preset_key, target, workspace_id)?;
                }
            }

            normalized.push(CreationBatchItemRecord {
                id: item_id,
                name: require_non_empty_text(
                    item.name,
                    "CREATION_BATCH_ITEM_NAME_EMPTY",
                    "item.name",
                )?,
                description: normalize_optional_text(item.description),
                status: CREATION_BATCH_ITEM_STATUS_PENDING.to_string(),
                template_step_id,
                preset_id,
                prompt: normalize_optional_text(item.prompt),
                gen_mode: normalize_optional_text(item.gen_mode),
                model: normalize_optional_text(item.model),
                style_id: normalize_optional_text(item.style_id),
                aspect_ratio: normalize_optional_text(item.aspect_ratio),
                resolution: normalize_optional_text(item.resolution),
                duration: normalize_optional_text(item.duration),
                attachments,
                session_id: None,
                last_materialized_at: None,
                started_at: None,
                completed_at: None,
                error: None,
                execution: None,
                created_at: now_ms,
                updated_at: now_ms,
            });
        }

        Ok(normalized)
    }

    fn validate_existing_batch_items(
        &self,
        items: &[CreationBatchItemRecord],
        target: &str,
        workspace_id: &str,
        template: Option<&CreationTemplateRecord>,
    ) -> ServerResult<()> {
        for item in items {
            if let Some(template) = template {
                if item.preset_id.is_some() {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_TEMPLATE_ITEM_PRESET_UNSUPPORTED",
                        "template-backed creation batch items must not set presetId",
                    ));
                }
                let step = resolve_creation_batch_template_step(
                    template,
                    item.template_step_id.as_deref(),
                )?;
                if step.target != target {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_TEMPLATE_STEP_TARGET_MISMATCH",
                        format!(
                            "creation batch target {target} does not match template step target {}",
                            step.target
                        ),
                    ));
                }
            } else {
                if item.template_step_id.is_some() {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_MANUAL_ITEM_TEMPLATE_STEP_UNSUPPORTED",
                        "manual creation batch items must not keep templateStepId after template authority is removed",
                    ));
                }
                if let Some(preset_key) = item.preset_id.as_deref() {
                    self.validate_preset_for_batch_scope(preset_key, target, workspace_id)?;
                }
            }
        }

        Ok(())
    }

    fn build_materialized_session_request(
        &self,
        batch: &CreationBatchRecord,
        item: &CreationBatchItemRecord,
        input: &MaterializeCreationBatchRequest,
    ) -> ServerResult<CreateCreationSessionRequest> {
        let template = self.resolve_template(
            batch.template_id.as_deref(),
            &batch.target,
            &batch.workspace_id,
        )?;

        if let Some(template) = template.as_ref() {
            let step =
                resolve_creation_batch_template_step(template, item.template_step_id.as_deref())?;
            let preset = step
                .preset_id
                .as_deref()
                .map(|preset_key| {
                    self.validate_preset_for_batch_scope(
                        preset_key,
                        &batch.target,
                        &batch.workspace_id,
                    )
                })
                .transpose()?;

            let prompt = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset.as_ref().and_then(|record| record.prompt.clone()),
                        step.prompt.clone(),
                    ),
                    item.prompt.clone(),
                ),
                None,
                input.prompt.clone(),
            );
            let gen_mode = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset.as_ref().and_then(|record| record.gen_mode.clone()),
                        step.gen_mode.clone(),
                    ),
                    item.gen_mode.clone(),
                ),
                None,
                input.gen_mode.clone(),
            );
            let model = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset.as_ref().and_then(|record| record.model.clone()),
                        step.model.clone(),
                    ),
                    item.model.clone(),
                ),
                None,
                input.model.clone(),
            );
            let style_id = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset.as_ref().and_then(|record| record.style_id.clone()),
                        step.style_id.clone(),
                    ),
                    item.style_id.clone(),
                ),
                None,
                input.style_id.clone(),
            );
            let aspect_ratio = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset
                            .as_ref()
                            .and_then(|record| record.aspect_ratio.clone()),
                        step.aspect_ratio.clone(),
                    ),
                    item.aspect_ratio.clone(),
                ),
                None,
                input.aspect_ratio.clone(),
            );
            let resolution = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset.as_ref().and_then(|record| record.resolution.clone()),
                        step.resolution.clone(),
                    ),
                    item.resolution.clone(),
                ),
                None,
                input.resolution.clone(),
            );
            let duration = apply_optional_text_override(
                merge_optional_text(
                    merge_optional_text(
                        preset.as_ref().and_then(|record| record.duration.clone()),
                        step.duration.clone(),
                    ),
                    item.duration.clone(),
                ),
                None,
                input.duration.clone(),
            );
            let scoped_project_id = merge_optional_text(
                merge_optional_text(
                    preset.as_ref().and_then(|record| record.project_id.clone()),
                    template.project_id.clone(),
                ),
                batch.project_id.clone(),
            );
            let project_id =
                apply_optional_text_override(scoped_project_id, None, input.project_id.clone());

            let base_attachments = merge_creation_session_attachments(
                merge_creation_session_attachments(
                    preset
                        .as_ref()
                        .map(|record| record.attachments.clone())
                        .unwrap_or_default(),
                    step.attachments.clone(),
                ),
                item.attachments.clone(),
            );
            let attachments = input
                .attachments
                .clone()
                .map(normalize_creation_session_attachments)
                .unwrap_or(base_attachments);

            return Ok(CreateCreationSessionRequest {
                target: batch.target.clone(),
                prompt,
                gen_mode,
                model,
                style_id,
                aspect_ratio,
                resolution,
                duration,
                attachments: Some(attachments),
                workspace_id: batch.workspace_id.clone(),
                project_id,
            });
        }

        let preset = item
            .preset_id
            .as_deref()
            .map(|preset_key| {
                self.validate_preset_for_batch_scope(preset_key, &batch.target, &batch.workspace_id)
            })
            .transpose()?;
        let prompt = apply_optional_text_override(
            merge_optional_text(
                preset.as_ref().and_then(|record| record.prompt.clone()),
                item.prompt.clone(),
            ),
            None,
            input.prompt.clone(),
        );
        let gen_mode = apply_optional_text_override(
            merge_optional_text(
                preset.as_ref().and_then(|record| record.gen_mode.clone()),
                item.gen_mode.clone(),
            ),
            None,
            input.gen_mode.clone(),
        );
        let model = apply_optional_text_override(
            merge_optional_text(
                preset.as_ref().and_then(|record| record.model.clone()),
                item.model.clone(),
            ),
            None,
            input.model.clone(),
        );
        let style_id = apply_optional_text_override(
            merge_optional_text(
                preset.as_ref().and_then(|record| record.style_id.clone()),
                item.style_id.clone(),
            ),
            None,
            input.style_id.clone(),
        );
        let aspect_ratio = apply_optional_text_override(
            merge_optional_text(
                preset
                    .as_ref()
                    .and_then(|record| record.aspect_ratio.clone()),
                item.aspect_ratio.clone(),
            ),
            None,
            input.aspect_ratio.clone(),
        );
        let resolution = apply_optional_text_override(
            merge_optional_text(
                preset.as_ref().and_then(|record| record.resolution.clone()),
                item.resolution.clone(),
            ),
            None,
            input.resolution.clone(),
        );
        let duration = apply_optional_text_override(
            merge_optional_text(
                preset.as_ref().and_then(|record| record.duration.clone()),
                item.duration.clone(),
            ),
            None,
            input.duration.clone(),
        );
        let scoped_project_id = merge_optional_text(
            preset.as_ref().and_then(|record| record.project_id.clone()),
            batch.project_id.clone(),
        );
        let project_id =
            apply_optional_text_override(scoped_project_id, None, input.project_id.clone());
        let base_attachments = merge_creation_session_attachments(
            preset
                .as_ref()
                .map(|record| record.attachments.clone())
                .unwrap_or_default(),
            item.attachments.clone(),
        );
        let attachments = input
            .attachments
            .clone()
            .map(normalize_creation_session_attachments)
            .unwrap_or(base_attachments);

        Ok(CreateCreationSessionRequest {
            target: batch.target.clone(),
            prompt,
            gen_mode,
            model,
            style_id,
            aspect_ratio,
            resolution,
            duration,
            attachments: Some(attachments),
            workspace_id: batch.workspace_id.clone(),
            project_id,
        })
    }

    fn read_linked_task(
        &self,
        task_family: &str,
        task_id: &str,
    ) -> ServerResult<(GenerationTaskRecord, String)> {
        match task_family {
            CREATION_BATCH_EXECUTION_FAMILY_GENERATION => Ok((
                self.generation_service.read_history_task(task_id)?,
                CREATION_BATCH_EXECUTION_FAMILY_GENERATION.to_string(),
            )),
            CREATION_BATCH_EXECUTION_FAMILY_VOICE_SPEECH => Ok((
                self.voice_service.read_speech_task(task_id)?,
                CREATION_BATCH_EXECUTION_FAMILY_VOICE_SPEECH.to_string(),
            )),
            _ => Err(ServerError::bad_request(
                "CREATION_BATCH_TASK_FAMILY_INVALID",
                "taskFamily must be generation or voice_speech",
            )),
        }
    }
}

impl CreationBatchService for FileBackedCreationBatchService {
    fn list_batches(&self, query: CreationBatchListQuery) -> ServerResult<CreationBatchListResult> {
        let _guard = self.acquire_lock()?;
        let document = self.load_document()?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query
            .page_size
            .unwrap_or(DEFAULT_CREATION_BATCH_PAGE_SIZE)
            .clamp(1, MAX_CREATION_BATCH_PAGE_SIZE);
        let keyword =
            normalize_optional_text(query.keyword).map(|value| value.to_ascii_lowercase());
        let target = match query.target {
            Some(value) => Some(normalize_creation_target(
                Some(value),
                "CREATION_BATCH_TARGET_INVALID",
            )?),
            None => None,
        };
        let workspace_id = normalize_optional_text(query.workspace_id);
        let project_id = normalize_optional_text(query.project_id);
        let status = query
            .status
            .map(normalize_creation_batch_status)
            .transpose()?;
        let favorite_only = query.favorite_only.unwrap_or(false);
        let source_kind = query
            .source_kind
            .map(normalize_creation_batch_source_kind_value)
            .transpose()?;
        let template_id = normalize_optional_text(query.template_id);

        let filtered = document
            .batches
            .into_iter()
            .filter(|batch| {
                target
                    .as_ref()
                    .map(|target| batch.target == *target)
                    .unwrap_or(true)
            })
            .filter(|batch| {
                workspace_id
                    .as_ref()
                    .map(|workspace_id| batch.workspace_id == *workspace_id)
                    .unwrap_or(true)
            })
            .filter(|batch| {
                project_id
                    .as_ref()
                    .map(|project_id| batch.project_id.as_deref() == Some(project_id.as_str()))
                    .unwrap_or(true)
            })
            .filter(|batch| {
                status
                    .as_ref()
                    .map(|status| batch.status == *status)
                    .unwrap_or(true)
            })
            .filter(|batch| !favorite_only || batch.is_favorite)
            .filter(|batch| {
                source_kind
                    .as_ref()
                    .map(|source_kind| batch.source_kind == *source_kind)
                    .unwrap_or(true)
            })
            .filter(|batch| {
                template_id
                    .as_ref()
                    .map(|template_id| batch.template_id.as_deref() == Some(template_id.as_str()))
                    .unwrap_or(true)
            })
            .filter(|batch| {
                keyword
                    .as_ref()
                    .map(|keyword| creation_batch_matches_keyword(batch, keyword))
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

        Ok(CreationBatchListResult {
            items,
            page,
            page_size,
            total,
        })
    }

    fn create_batch(&self, input: CreateCreationBatchRequest) -> ServerResult<CreationBatchRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let now_ms = current_time_millis();
        let target =
            normalize_creation_target(Some(input.target), "CREATION_BATCH_TARGET_INVALID")?;
        let workspace_id = require_non_empty_text(
            input.workspace_id,
            "CREATION_BATCH_WORKSPACE_ID_EMPTY",
            "workspaceId",
        )?;
        let template_id = normalize_optional_text(input.template_id);
        let template = self.resolve_template(template_id.as_deref(), &target, &workspace_id)?;
        let status = normalize_creation_batch_create_status(input.status)?;
        let batch_id = next_creation_batch_id(now_ms);
        let items = self.normalize_batch_items_from_input(
            input.items.unwrap_or_default(),
            &target,
            &workspace_id,
            template.as_ref(),
            now_ms,
        )?;

        let mut batch = CreationBatchRecord {
            id: batch_id.clone(),
            uuid: to_client_entity_uuid(&batch_id),
            name: require_non_empty_text(input.name, "CREATION_BATCH_NAME_EMPTY", "name")?,
            description: normalize_optional_text(input.description),
            target,
            source_kind: normalize_creation_batch_source_kind(template_id.as_deref()),
            template_id,
            workspace_id,
            project_id: normalize_optional_text(input.project_id),
            status,
            execution_mode: CREATION_BATCH_EXECUTION_MODE_SERIAL.to_string(),
            items,
            progress: CreationBatchProgressRecord::default(),
            tags: normalize_creation_batch_tags(input.tags.unwrap_or_default()),
            is_favorite: input.is_favorite.unwrap_or(false),
            last_materialized_item_id: None,
            started_at: None,
            completed_at: None,
            cancelled_at: None,
            created_at: now_ms,
            updated_at: now_ms,
        };
        reconcile_batch_record(&mut batch);

        document.batches.push(batch.clone());
        sort_creation_batches(&mut document.batches);
        self.persist_document(&document)?;
        Ok(batch)
    }

    fn read_batch(&self, batch_key: &str) -> ServerResult<CreationBatchRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_document()?;
        let batch_index = self.find_batch_index(&document, batch_key)?;
        Ok(document.batches[batch_index].clone())
    }

    fn update_batch(
        &self,
        batch_key: &str,
        input: UpdateCreationBatchRequest,
    ) -> ServerResult<CreationBatchRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let batch_index = self.find_batch_index(&document, batch_key)?;
        let current = document.batches[batch_index].clone();
        let mut updated = current.clone();
        let now_ms = current_time_millis();

        if let Some(name) = input.name {
            updated.name = require_non_empty_text(name, "CREATION_BATCH_NAME_EMPTY", "name")?;
        }
        apply_optional_text_update(&mut updated.description, input.description);

        if let Some(target) = input.target {
            let normalized =
                normalize_creation_target(Some(target), "CREATION_BATCH_TARGET_INVALID")?;
            if normalized != current.target && batch_has_started(&current) {
                return Err(ServerError::bad_request(
                    "CREATION_BATCH_TARGET_LOCKED",
                    "target cannot change after creation batch orchestration has started",
                ));
            }
            updated.target = normalized;
        }

        if let Some(workspace_id) = input.workspace_id {
            let normalized = require_non_empty_text(
                workspace_id,
                "CREATION_BATCH_WORKSPACE_ID_EMPTY",
                "workspaceId",
            )?;
            if normalized != current.workspace_id && batch_has_started(&current) {
                return Err(ServerError::bad_request(
                    "CREATION_BATCH_WORKSPACE_LOCKED",
                    "workspaceId cannot change after creation batch orchestration has started",
                ));
            }
            updated.workspace_id = normalized;
        }

        let previous_template_id = current.template_id.clone();
        apply_optional_text_update(&mut updated.template_id, input.template_id);
        if updated.template_id != previous_template_id && batch_has_started(&current) {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_TEMPLATE_LOCKED",
                "templateId cannot change after creation batch orchestration has started",
            ));
        }

        let previous_project_id = current.project_id.clone();
        apply_optional_text_update(&mut updated.project_id, input.project_id);
        if updated.project_id != previous_project_id && batch_has_started(&current) {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_PROJECT_LOCKED",
                "projectId cannot change after creation batch orchestration has started",
            ));
        }

        let template = self.resolve_template(
            updated.template_id.as_deref(),
            &updated.target,
            &updated.workspace_id,
        )?;

        if let Some(items) = input.items {
            if batch_has_started(&current) {
                return Err(ServerError::bad_request(
                    "CREATION_BATCH_ITEMS_LOCKED",
                    "items cannot be replaced after creation batch orchestration has started",
                ));
            }
            updated.items = self.normalize_batch_items_from_input(
                items,
                &updated.target,
                &updated.workspace_id,
                template.as_ref(),
                now_ms,
            )?;
        } else if updated.target != current.target
            || updated.workspace_id != current.workspace_id
            || updated.template_id != current.template_id
        {
            self.validate_existing_batch_items(
                &updated.items,
                &updated.target,
                &updated.workspace_id,
                template.as_ref(),
            )?;
        }

        if let Some(tags) = input.tags {
            updated.tags = normalize_creation_batch_tags(tags);
        }

        if let Some(is_favorite) = input.is_favorite {
            updated.is_favorite = is_favorite;
        }

        if let Some(status) = input.status {
            let normalized_status = normalize_creation_batch_status(status)?;
            match normalized_status.as_str() {
                CREATION_BATCH_STATUS_DRAFT | CREATION_BATCH_STATUS_READY => {
                    if batch_has_started(&current) {
                        return Err(ServerError::bad_request(
                            "CREATION_BATCH_STATUS_LOCKED",
                            "draft or ready state cannot be restored after creation batch orchestration has started",
                        ));
                    }
                    updated.status = normalized_status;
                    updated.cancelled_at = None;
                    updated.completed_at = None;
                }
                CREATION_BATCH_STATUS_CANCELLED => {
                    if current.status == CREATION_BATCH_STATUS_COMPLETED {
                        return Err(ServerError::bad_request(
                            "CREATION_BATCH_STATUS_COMPLETED",
                            "completed creation batches cannot be cancelled",
                        ));
                    }
                    cancel_open_batch_items(&mut updated.items, now_ms);
                    updated.status = CREATION_BATCH_STATUS_CANCELLED.to_string();
                    updated.cancelled_at = Some(now_ms);
                }
                _ => {
                    return Err(ServerError::bad_request(
                        "CREATION_BATCH_STATUS_UPDATE_UNSUPPORTED",
                        "status updates only support draft, ready, or cancelled",
                    ))
                }
            }
        }

        updated.source_kind = normalize_creation_batch_source_kind(updated.template_id.as_deref());
        updated.execution_mode = CREATION_BATCH_EXECUTION_MODE_SERIAL.to_string();
        updated.updated_at = now_ms;
        reconcile_batch_record(&mut updated);

        document.batches[batch_index] = updated.clone();
        sort_creation_batches(&mut document.batches);
        self.persist_document(&document)?;
        Ok(updated)
    }

    fn delete_batch(&self, batch_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let batch_id = document.batches[self.find_batch_index(&document, batch_key)?]
            .id
            .clone();
        let before_len = document.batches.len();
        document.batches.retain(|batch| batch.id != batch_id);

        if document.batches.len() == before_len {
            return Err(ServerError::not_found(
                "CREATION_BATCH_NOT_FOUND",
                format!("creation batch {batch_key} was not found"),
            ));
        }

        self.persist_document(&document)?;
        Ok(())
    }

    fn materialize_batch(
        &self,
        batch_key: &str,
        input: MaterializeCreationBatchRequest,
    ) -> ServerResult<CreationBatchMaterializationRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let batch_index = self.find_batch_index(&document, batch_key)?;
        let batch_snapshot = document.batches[batch_index].clone();

        if matches!(
            batch_snapshot.status.as_str(),
            CREATION_BATCH_STATUS_COMPLETED | CREATION_BATCH_STATUS_CANCELLED
        ) {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_MATERIALIZE_CLOSED",
                "completed or cancelled creation batches cannot materialize new sessions",
            ));
        }

        let item_index =
            resolve_materialization_item_index(&batch_snapshot, input.item_id.as_deref())?;
        let item_snapshot = batch_snapshot.items[item_index].clone();
        if matches!(
            item_snapshot.status.as_str(),
            CREATION_BATCH_ITEM_STATUS_QUEUED
                | CREATION_BATCH_ITEM_STATUS_PROCESSING
                | CREATION_BATCH_ITEM_STATUS_COMPLETED
                | CREATION_BATCH_ITEM_STATUS_CANCELLED
                | CREATION_BATCH_ITEM_STATUS_SKIPPED
        ) {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_ITEM_MATERIALIZE_STATUS_INVALID",
                format!(
                    "creation batch item {} with status {} cannot be materialized",
                    item_snapshot.id, item_snapshot.status
                ),
            ));
        }

        let session_request =
            self.build_materialized_session_request(&batch_snapshot, &item_snapshot, &input)?;
        let session = self
            .creation_service
            .create_session_with_source(session_request, CREATION_BATCH_SESSION_SOURCE)?;

        let now_ms = current_time_millis();
        let (item_result, batch_result) = {
            let batch = document
                .batches
                .get_mut(batch_index)
                .expect("batch index should stay valid");
            {
                let item = batch
                    .items
                    .get_mut(item_index)
                    .expect("batch item index should stay valid");

                item.status = CREATION_BATCH_ITEM_STATUS_MATERIALIZED.to_string();
                item.session_id = Some(session.session_id.clone());
                item.last_materialized_at = Some(now_ms);
                item.started_at.get_or_insert(now_ms);
                item.completed_at = None;
                item.error = None;
                item.execution = None;
                item.updated_at = now_ms;
            }

            let item_result = batch.items[item_index].clone();
            batch.last_materialized_item_id = Some(item_result.id.clone());
            batch.started_at.get_or_insert(now_ms);
            batch.updated_at = now_ms;
            reconcile_batch_record(batch);

            (item_result, batch.clone())
        };

        sort_creation_batches(&mut document.batches);
        self.persist_document(&document)?;

        Ok(CreationBatchMaterializationRecord {
            batch: batch_result,
            item: item_result,
            session,
        })
    }

    fn update_batch_item_status(
        &self,
        batch_key: &str,
        item_key: &str,
        input: UpdateCreationBatchItemStatusRequest,
    ) -> ServerResult<CreationBatchRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let batch_index = self.find_batch_index(&document, batch_key)?;
        let batch = document
            .batches
            .get_mut(batch_index)
            .expect("batch index should stay valid");

        if batch.status == CREATION_BATCH_STATUS_CANCELLED {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_ITEM_STATUS_BATCH_CANCELLED",
                "cancelled creation batches do not allow further item status mutation",
            ));
        }
        if batch.status == CREATION_BATCH_STATUS_COMPLETED {
            return Err(ServerError::bad_request(
                "CREATION_BATCH_ITEM_STATUS_BATCH_COMPLETED",
                "completed creation batches do not allow further item status mutation",
            ));
        }

        let item_index = find_batch_item_index(batch, item_key)?;
        let now_ms = current_time_millis();
        let requested_status = normalize_creation_batch_item_status(input.status)?;

        let linked_task =
            match (input.task_family.as_deref(), input.task_id.as_deref()) {
                (None, None) => None,
                (Some(_), None) | (None, Some(_)) => return Err(ServerError::bad_request(
                    "CREATION_BATCH_TASK_LINK_INCOMPLETE",
                    "taskFamily and taskId must be provided together when linking a canonical task",
                )),
                (Some(task_family), Some(task_id)) => {
                    let normalized_family = normalize_creation_batch_execution_family(task_family)?;
                    let task_id = require_non_empty_text(
                        task_id.to_string(),
                        "CREATION_BATCH_TASK_ID_EMPTY",
                        "taskId",
                    )?;
                    Some(self.read_linked_task(&normalized_family, &task_id)?)
                }
            };

        let linked_task_error = linked_task
            .as_ref()
            .and_then(|(task, _)| normalize_optional_text(task.error_message.clone()));
        if let Some((task, _)) = linked_task.as_ref() {
            let canonical_status = map_generation_task_status_to_batch_item_status(task.status);
            if requested_status != canonical_status {
                return Err(ServerError::bad_request(
                    "CREATION_BATCH_TASK_STATUS_MISMATCH",
                    format!(
                        "requested batch item status {requested_status} does not match canonical task status {canonical_status}",
                    ),
                ));
            }
        }

        let item = batch
            .items
            .get_mut(item_index)
            .expect("item index should stay valid");

        item.status = requested_status.clone();
        item.updated_at = now_ms;

        match requested_status.as_str() {
            CREATION_BATCH_ITEM_STATUS_PENDING => {
                item.session_id = None;
                item.last_materialized_at = None;
                item.started_at = None;
                item.completed_at = None;
                item.execution = None;
            }
            CREATION_BATCH_ITEM_STATUS_MATERIALIZED
            | CREATION_BATCH_ITEM_STATUS_QUEUED
            | CREATION_BATCH_ITEM_STATUS_PROCESSING => {
                item.started_at.get_or_insert(now_ms);
                item.completed_at = None;
            }
            CREATION_BATCH_ITEM_STATUS_COMPLETED
            | CREATION_BATCH_ITEM_STATUS_FAILED
            | CREATION_BATCH_ITEM_STATUS_CANCELLED
            | CREATION_BATCH_ITEM_STATUS_SKIPPED => {
                item.started_at.get_or_insert(now_ms);
                item.completed_at = Some(now_ms);
            }
            _ => {}
        }

        item.error = match input.error {
            CreationBatchOptionalTextUpdate::Missing => {
                if let Some(error) = linked_task_error {
                    Some(error)
                } else if matches!(
                    requested_status.as_str(),
                    CREATION_BATCH_ITEM_STATUS_FAILED | CREATION_BATCH_ITEM_STATUS_CANCELLED
                ) {
                    item.error.clone()
                } else {
                    None
                }
            }
            CreationBatchOptionalTextUpdate::Clear => None,
            CreationBatchOptionalTextUpdate::Set(value) => normalize_optional_text(Some(value)),
        };

        if let Some((task, family)) = linked_task {
            item.execution = Some(CreationBatchItemExecutionLinkRecord {
                family,
                task_id: task.task_id.clone(),
                task_uuid: Some(task.uuid.clone()),
                history_entry_id: normalize_optional_text(input.history_entry_id)
                    .or_else(|| Some(task.task_id.clone())),
                product: Some(generation_product_label(task.product).to_string()),
                linked_at: now_ms,
            });
        } else if requested_status == CREATION_BATCH_ITEM_STATUS_PENDING {
            item.execution = None;
        }

        batch.started_at =
            if batch.started_at.is_none() && item_is_started(requested_status.as_str()) {
                Some(now_ms)
            } else {
                batch.started_at
            };
        batch.updated_at = now_ms;
        reconcile_batch_record(batch);
        let result = batch.clone();

        sort_creation_batches(&mut document.batches);
        self.persist_document(&document)?;
        Ok(result)
    }
}

fn normalize_loaded_batch_item(mut item: CreationBatchItemRecord) -> CreationBatchItemRecord {
    let fallback_now = item.created_at.max(item.updated_at).max(1);
    item.id = normalize_optional_text(Some(item.id.clone()))
        .map(|value| normalize_creation_batch_item_id(&value))
        .unwrap_or_else(|| next_creation_batch_item_id(fallback_now));
    item.name = normalize_optional_text(Some(item.name.clone()))
        .unwrap_or_else(|| "Untitled Item".to_string());
    item.description = normalize_optional_text(item.description);
    item.status = normalize_creation_batch_item_status(item.status)
        .unwrap_or_else(|_| CREATION_BATCH_ITEM_STATUS_PENDING.to_string());
    item.template_step_id = item
        .template_step_id
        .and_then(|value| normalize_optional_text(Some(value)))
        .map(|value| normalize_creation_template_step_id(&value));
    item.preset_id = normalize_optional_text(item.preset_id);
    item.prompt = normalize_optional_text(item.prompt);
    item.gen_mode = normalize_optional_text(item.gen_mode);
    item.model = normalize_optional_text(item.model);
    item.style_id = normalize_optional_text(item.style_id);
    item.aspect_ratio = normalize_optional_text(item.aspect_ratio);
    item.resolution = normalize_optional_text(item.resolution);
    item.duration = normalize_optional_text(item.duration);
    item.attachments = normalize_creation_session_attachments(item.attachments);
    item.session_id = normalize_optional_text(item.session_id);
    item.error = normalize_optional_text(item.error);
    item.execution = item.execution.and_then(normalize_batch_execution_link);
    item
}

fn normalize_batch_execution_link(
    mut execution: CreationBatchItemExecutionLinkRecord,
) -> Option<CreationBatchItemExecutionLinkRecord> {
    execution.family = normalize_creation_batch_execution_family(&execution.family).ok()?;
    execution.task_id = normalize_optional_text(Some(execution.task_id))?;
    execution.task_uuid = normalize_optional_text(execution.task_uuid);
    execution.history_entry_id = normalize_optional_text(execution.history_entry_id);
    execution.product = execution
        .product
        .and_then(|value| normalize_optional_text(Some(value)));
    Some(execution)
}

fn creation_batch_matches_keyword(batch: &CreationBatchRecord, keyword: &str) -> bool {
    batch.name.to_ascii_lowercase().contains(keyword)
        || batch
            .description
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || batch
            .tags
            .iter()
            .any(|tag| tag.to_ascii_lowercase().contains(keyword))
        || batch
            .template_id
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || batch.items.iter().any(|item| {
            item.name.to_ascii_lowercase().contains(keyword)
                || item
                    .description
                    .as_deref()
                    .map(|value| value.to_ascii_lowercase().contains(keyword))
                    .unwrap_or(false)
                || item
                    .prompt
                    .as_deref()
                    .map(|value| value.to_ascii_lowercase().contains(keyword))
                    .unwrap_or(false)
        })
}

fn sort_creation_batches(batches: &mut [CreationBatchRecord]) {
    batches.sort_by(|left, right| {
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

fn reconcile_batch_record(batch: &mut CreationBatchRecord) {
    batch.source_kind = normalize_creation_batch_source_kind(batch.template_id.as_deref());
    batch.execution_mode = CREATION_BATCH_EXECUTION_MODE_SERIAL.to_string();
    batch.progress = compute_batch_progress(&batch.items);

    if batch.cancelled_at.is_some() || batch.status == CREATION_BATCH_STATUS_CANCELLED {
        batch.status = CREATION_BATCH_STATUS_CANCELLED.to_string();
        batch.completed_at = None;
        return;
    }

    let has_active =
        batch.progress.materialized + batch.progress.queued + batch.progress.processing > 0;
    let has_terminal = batch.progress.terminal > 0;
    let all_terminal = batch.progress.total > 0 && batch.progress.terminal == batch.progress.total;

    if all_terminal {
        batch.status = CREATION_BATCH_STATUS_COMPLETED.to_string();
        batch.completed_at = batch.completed_at.or(Some(batch.updated_at));
        return;
    }

    batch.completed_at = None;
    if has_active || (batch.started_at.is_some() && has_terminal) {
        batch.status = CREATION_BATCH_STATUS_RUNNING.to_string();
        return;
    }

    if batch.status != CREATION_BATCH_STATUS_READY {
        batch.status = CREATION_BATCH_STATUS_DRAFT.to_string();
    }
}

fn compute_batch_progress(items: &[CreationBatchItemRecord]) -> CreationBatchProgressRecord {
    let mut progress = CreationBatchProgressRecord {
        total: items.len(),
        ..CreationBatchProgressRecord::default()
    };

    for item in items {
        match item.status.as_str() {
            CREATION_BATCH_ITEM_STATUS_PENDING => progress.pending += 1,
            CREATION_BATCH_ITEM_STATUS_MATERIALIZED => progress.materialized += 1,
            CREATION_BATCH_ITEM_STATUS_QUEUED => progress.queued += 1,
            CREATION_BATCH_ITEM_STATUS_PROCESSING => progress.processing += 1,
            CREATION_BATCH_ITEM_STATUS_COMPLETED => {
                progress.completed += 1;
                progress.terminal += 1;
            }
            CREATION_BATCH_ITEM_STATUS_FAILED => {
                progress.failed += 1;
                progress.terminal += 1;
            }
            CREATION_BATCH_ITEM_STATUS_CANCELLED => {
                progress.cancelled += 1;
                progress.terminal += 1;
            }
            CREATION_BATCH_ITEM_STATUS_SKIPPED => {
                progress.skipped += 1;
                progress.terminal += 1;
            }
            _ => progress.pending += 1,
        }
    }

    progress
}

fn cancel_open_batch_items(items: &mut [CreationBatchItemRecord], now_ms: i64) {
    for item in items {
        if !item_is_terminal(item.status.as_str()) {
            item.status = CREATION_BATCH_ITEM_STATUS_CANCELLED.to_string();
            item.completed_at = Some(now_ms);
            item.updated_at = now_ms;
            if item.error.is_none() && item.status != CREATION_BATCH_ITEM_STATUS_PENDING {
                item.error = Some("creation batch item was cancelled".to_string());
            }
        }
    }
}

fn item_is_terminal(status: &str) -> bool {
    matches!(
        status,
        CREATION_BATCH_ITEM_STATUS_COMPLETED
            | CREATION_BATCH_ITEM_STATUS_FAILED
            | CREATION_BATCH_ITEM_STATUS_CANCELLED
            | CREATION_BATCH_ITEM_STATUS_SKIPPED
    )
}

fn item_is_started(status: &str) -> bool {
    matches!(
        status,
        CREATION_BATCH_ITEM_STATUS_MATERIALIZED
            | CREATION_BATCH_ITEM_STATUS_QUEUED
            | CREATION_BATCH_ITEM_STATUS_PROCESSING
            | CREATION_BATCH_ITEM_STATUS_COMPLETED
            | CREATION_BATCH_ITEM_STATUS_FAILED
            | CREATION_BATCH_ITEM_STATUS_CANCELLED
            | CREATION_BATCH_ITEM_STATUS_SKIPPED
    )
}

fn batch_has_started(batch: &CreationBatchRecord) -> bool {
    batch.started_at.is_some()
        || batch
            .items
            .iter()
            .any(|item| item_is_started(item.status.as_str()))
}

fn resolve_materialization_item_index(
    batch: &CreationBatchRecord,
    item_key: Option<&str>,
) -> ServerResult<usize> {
    if let Some(item_key) = item_key {
        return find_batch_item_index(batch, item_key);
    }

    batch.items
        .iter()
        .position(|item| {
            matches!(
                item.status.as_str(),
                CREATION_BATCH_ITEM_STATUS_PENDING
                    | CREATION_BATCH_ITEM_STATUS_MATERIALIZED
                    | CREATION_BATCH_ITEM_STATUS_FAILED
            )
        })
        .ok_or_else(|| {
            ServerError::bad_request(
                "CREATION_BATCH_ITEM_MATERIALIZE_NONE_AVAILABLE",
                "creation batch has no pending, materialized, or failed item available for materialization",
            )
        })
}

fn find_batch_item_index(batch: &CreationBatchRecord, item_key: &str) -> ServerResult<usize> {
    let normalized = require_non_empty_text(
        item_key.to_string(),
        "CREATION_BATCH_ITEM_ID_EMPTY",
        "itemId",
    )?;
    batch
        .items
        .iter()
        .position(|item| item.id == normalized)
        .ok_or_else(|| {
            ServerError::not_found(
                "CREATION_BATCH_ITEM_NOT_FOUND",
                format!("creation batch item {item_key} was not found"),
            )
        })
}

fn resolve_creation_batch_template_step<'a>(
    template: &'a CreationTemplateRecord,
    step_id: Option<&str>,
) -> ServerResult<&'a CreationTemplateStepRecord> {
    let requested_id = step_id
        .map(normalize_creation_template_step_id)
        .unwrap_or_else(|| template.default_step_id.clone());

    template
        .steps
        .iter()
        .find(|step| step.id == requested_id)
        .ok_or_else(|| {
            ServerError::bad_request(
                "CREATION_BATCH_TEMPLATE_STEP_NOT_FOUND",
                format!(
                    "template step {} was not found in creation template {}",
                    requested_id, template.id
                ),
            )
        })
}

fn normalize_creation_batch_source_kind(template_id: Option<&str>) -> String {
    if template_id.is_some() {
        CREATION_BATCH_SOURCE_TEMPLATE.to_string()
    } else {
        CREATION_BATCH_SOURCE_MANUAL.to_string()
    }
}

fn normalize_creation_batch_source_kind_value(value: String) -> ServerResult<String> {
    let normalized = normalize_optional_text(Some(value))
        .map(|value| value.to_ascii_lowercase().replace('-', "_"))
        .unwrap_or_default();
    match normalized.as_str() {
        CREATION_BATCH_SOURCE_MANUAL => Ok(CREATION_BATCH_SOURCE_MANUAL.to_string()),
        CREATION_BATCH_SOURCE_TEMPLATE => Ok(CREATION_BATCH_SOURCE_TEMPLATE.to_string()),
        _ => Err(ServerError::bad_request(
            "CREATION_BATCH_SOURCE_KIND_INVALID",
            "sourceKind must be manual or template",
        )),
    }
}

fn normalize_creation_batch_status(value: String) -> ServerResult<String> {
    let normalized = normalize_optional_text(Some(value))
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_default();
    match normalized.as_str() {
        CREATION_BATCH_STATUS_DRAFT => Ok(CREATION_BATCH_STATUS_DRAFT.to_string()),
        CREATION_BATCH_STATUS_READY => Ok(CREATION_BATCH_STATUS_READY.to_string()),
        CREATION_BATCH_STATUS_RUNNING => Ok(CREATION_BATCH_STATUS_RUNNING.to_string()),
        CREATION_BATCH_STATUS_COMPLETED => Ok(CREATION_BATCH_STATUS_COMPLETED.to_string()),
        "canceled" | CREATION_BATCH_STATUS_CANCELLED => {
            Ok(CREATION_BATCH_STATUS_CANCELLED.to_string())
        }
        _ => Err(ServerError::bad_request(
            "CREATION_BATCH_STATUS_INVALID",
            "status must be one of draft, ready, running, completed, or cancelled",
        )),
    }
}

fn normalize_creation_batch_create_status(value: Option<String>) -> ServerResult<String> {
    let status = value
        .map(normalize_creation_batch_status)
        .transpose()?
        .unwrap_or_else(|| CREATION_BATCH_STATUS_DRAFT.to_string());
    if matches!(
        status.as_str(),
        CREATION_BATCH_STATUS_DRAFT | CREATION_BATCH_STATUS_READY
    ) {
        return Ok(status);
    }

    Err(ServerError::bad_request(
        "CREATION_BATCH_CREATE_STATUS_INVALID",
        "new creation batches may only start in draft or ready state",
    ))
}

fn normalize_creation_batch_item_status(value: String) -> ServerResult<String> {
    let normalized = normalize_optional_text(Some(value))
        .map(|value| value.to_ascii_lowercase().replace('-', "_"))
        .unwrap_or_default();
    match normalized.as_str() {
        CREATION_BATCH_ITEM_STATUS_PENDING => Ok(CREATION_BATCH_ITEM_STATUS_PENDING.to_string()),
        CREATION_BATCH_ITEM_STATUS_MATERIALIZED => {
            Ok(CREATION_BATCH_ITEM_STATUS_MATERIALIZED.to_string())
        }
        CREATION_BATCH_ITEM_STATUS_QUEUED => Ok(CREATION_BATCH_ITEM_STATUS_QUEUED.to_string()),
        CREATION_BATCH_ITEM_STATUS_PROCESSING => {
            Ok(CREATION_BATCH_ITEM_STATUS_PROCESSING.to_string())
        }
        CREATION_BATCH_ITEM_STATUS_COMPLETED => {
            Ok(CREATION_BATCH_ITEM_STATUS_COMPLETED.to_string())
        }
        CREATION_BATCH_ITEM_STATUS_FAILED => Ok(CREATION_BATCH_ITEM_STATUS_FAILED.to_string()),
        "canceled" | CREATION_BATCH_ITEM_STATUS_CANCELLED => {
            Ok(CREATION_BATCH_ITEM_STATUS_CANCELLED.to_string())
        }
        CREATION_BATCH_ITEM_STATUS_SKIPPED => Ok(CREATION_BATCH_ITEM_STATUS_SKIPPED.to_string()),
        _ => Err(ServerError::bad_request(
            "CREATION_BATCH_ITEM_STATUS_INVALID",
            "status must be one of pending, materialized, queued, processing, completed, failed, cancelled, or skipped",
        )),
    }
}

fn normalize_creation_batch_execution_family(value: &str) -> ServerResult<String> {
    let normalized = normalize_optional_text(Some(value.to_string()))
        .map(|value| value.to_ascii_lowercase().replace('-', "_"))
        .unwrap_or_default();
    match normalized.as_str() {
        CREATION_BATCH_EXECUTION_FAMILY_GENERATION => {
            Ok(CREATION_BATCH_EXECUTION_FAMILY_GENERATION.to_string())
        }
        CREATION_BATCH_EXECUTION_FAMILY_VOICE_SPEECH => {
            Ok(CREATION_BATCH_EXECUTION_FAMILY_VOICE_SPEECH.to_string())
        }
        _ => Err(ServerError::bad_request(
            "CREATION_BATCH_TASK_FAMILY_INVALID",
            "taskFamily must be generation or voice_speech",
        )),
    }
}

fn map_generation_task_status_to_batch_item_status(status: GenerationTaskStatus) -> String {
    match status {
        GenerationTaskStatus::Draft | GenerationTaskStatus::Queued => {
            CREATION_BATCH_ITEM_STATUS_QUEUED.to_string()
        }
        GenerationTaskStatus::Processing => CREATION_BATCH_ITEM_STATUS_PROCESSING.to_string(),
        GenerationTaskStatus::Succeeded => CREATION_BATCH_ITEM_STATUS_COMPLETED.to_string(),
        GenerationTaskStatus::Failed => CREATION_BATCH_ITEM_STATUS_FAILED.to_string(),
        GenerationTaskStatus::Cancelled => CREATION_BATCH_ITEM_STATUS_CANCELLED.to_string(),
    }
}

fn generation_product_label(product: GenerationProduct) -> &'static str {
    match product {
        GenerationProduct::Image => "image",
        GenerationProduct::Video => "video",
        GenerationProduct::Audio => "audio",
        GenerationProduct::Music => "music",
        GenerationProduct::Character => "character",
        GenerationProduct::Sfx => "sfx",
        GenerationProduct::Speech => "speech",
    }
}

fn normalize_creation_batch_tags(tags: Vec<String>) -> Vec<String> {
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

fn normalize_creation_batch_item_id(value: &str) -> String {
    let sanitized = value
        .trim()
        .to_ascii_lowercase()
        .replace('_', "-")
        .replace(' ', "-");
    let sanitized = sanitized
        .chars()
        .filter(|character| character.is_ascii_alphanumeric() || *character == '-')
        .collect::<String>();

    if sanitized.is_empty() {
        "creation-batch-item".to_string()
    } else if sanitized.starts_with("creation-batch-item-") {
        sanitized
    } else {
        format!("creation-batch-item-{sanitized}")
    }
}

fn next_creation_batch_id(now_ms: i64) -> String {
    let counter = CREATION_BATCH_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("creation-batch-{now_ms}-{counter}")
}

fn next_creation_batch_item_id(now_ms: i64) -> String {
    let counter = CREATION_BATCH_ITEM_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("creation-batch-item-{now_ms}-{counter}")
}

fn merge_optional_text(base: Option<String>, overlay: Option<String>) -> Option<String> {
    overlay.or(base)
}

fn apply_optional_text_override(
    base: Option<String>,
    overlay: Option<String>,
    update: CreationBatchOptionalTextUpdate,
) -> Option<String> {
    match update {
        CreationBatchOptionalTextUpdate::Missing => overlay.or(base),
        CreationBatchOptionalTextUpdate::Clear => None,
        CreationBatchOptionalTextUpdate::Set(value) => normalize_optional_text(Some(value)),
    }
}

fn apply_optional_text_update(slot: &mut Option<String>, update: CreationBatchOptionalTextUpdate) {
    match update {
        CreationBatchOptionalTextUpdate::Missing => {}
        CreationBatchOptionalTextUpdate::Clear => {
            *slot = None;
        }
        CreationBatchOptionalTextUpdate::Set(value) => {
            *slot = normalize_optional_text(Some(value));
        }
    }
}

fn deserialize_creation_batch_optional_text_update<'de, D>(
    deserializer: D,
) -> Result<CreationBatchOptionalTextUpdate, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<String>::deserialize(deserializer)? {
        Some(value) => Ok(CreationBatchOptionalTextUpdate::Set(value)),
        None => Ok(CreationBatchOptionalTextUpdate::Clear),
    }
}
