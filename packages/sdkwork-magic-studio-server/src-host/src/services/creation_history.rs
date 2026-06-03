use std::collections::BTreeSet;
use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::generation::{
    GenerationProduct, GenerationService, GenerationTaskRecord, GenerationTaskStatus,
};

const CREATION_HISTORY_SCHEMA_VERSION: &str = "magic-studio.creation-history.v1";
static CREATION_HISTORY_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationHistoryConfigRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_multi_model: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationHistoryResultResourceRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primary_resource_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primary_resource_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_view_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_view_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationHistoryResultRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primary_resource_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primary_resource_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_view_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_view_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artifact_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub poster_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource: Option<CreationHistoryResultResourceRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cover_resource: Option<CreationHistoryResultResourceRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationHistoryEntryRecord {
    pub id: String,
    pub uuid: String,
    pub product: String,
    pub source: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub is_favorite: bool,
    pub config: CreationHistoryConfigRecord,
    #[serde(default)]
    pub results: Vec<CreationHistoryResultRecord>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CreationHistoryListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub product: Option<String>,
    pub source: Option<String>,
    pub status: Option<String>,
    pub favorite_only: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationHistoryPageRecord {
    pub items: Vec<CreationHistoryEntryRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertCreationHistoryEntryRequest {
    pub id: Option<String>,
    pub uuid: Option<String>,
    pub product: String,
    pub source: Option<String>,
    pub status: String,
    pub error: Option<String>,
    pub is_favorite: Option<bool>,
    pub config: CreationHistoryConfigRecord,
    pub results: Option<Vec<CreationHistoryResultRecord>>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationHistoryFavoriteRequest {
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreationHistoryDocument {
    schema_version: String,
    #[serde(default)]
    imported_entries: Vec<CreationHistoryEntryRecord>,
    #[serde(default)]
    favorite_entry_ids: Vec<String>,
}

pub trait CreationHistoryService: Send + Sync {
    fn read_history_entry(&self, entry_id: &str) -> ServerResult<CreationHistoryEntryRecord>;
    fn list_history(
        &self,
        query: CreationHistoryListQuery,
    ) -> ServerResult<CreationHistoryPageRecord>;
    fn upsert_history_entry(
        &self,
        input: UpsertCreationHistoryEntryRequest,
    ) -> ServerResult<CreationHistoryEntryRecord>;
    fn set_history_entry_favorite(
        &self,
        entry_id: &str,
        input: CreationHistoryFavoriteRequest,
    ) -> ServerResult<CreationHistoryEntryRecord>;
    fn delete_history_entry(&self, entry_id: &str) -> ServerResult<CreationHistoryEntryRecord>;
    fn clear_history(&self, query: CreationHistoryListQuery) -> ServerResult<()>;
}

pub struct FileBackedCreationHistoryService {
    storage_paths: AppStoragePaths,
    generation_service: Arc<dyn GenerationService>,
    lock: Mutex<()>,
}

impl FileBackedCreationHistoryService {
    pub fn new(
        storage_paths: AppStoragePaths,
        generation_service: Arc<dyn GenerationService>,
    ) -> Self {
        Self {
            storage_paths,
            generation_service,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_HISTORY_LOCK_FAILED",
                "failed to acquire creation history lock",
            )
        })
    }

    fn load_document(&self) -> ServerResult<CreationHistoryDocument> {
        self.storage_paths.ensure_root_dir()?;
        let path = self.storage_paths.creation_history_file();
        if !path.exists() {
            return Ok(CreationHistoryDocument {
                schema_version: CREATION_HISTORY_SCHEMA_VERSION.to_string(),
                imported_entries: Vec::new(),
                favorite_entry_ids: Vec::new(),
            });
        }

        let contents = fs::read_to_string(path).map_err(|error| {
            ServerError::internal(
                "CREATION_HISTORY_READ_FAILED",
                format!(
                    "failed to read creation history document {}: {error}",
                    path.display()
                ),
            )
        })?;

        let mut document =
            serde_json::from_str::<CreationHistoryDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "CREATION_HISTORY_PARSE_FAILED",
                    format!(
                        "failed to parse creation history document {}: {error}",
                        path.display()
                    ),
                )
            })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version = CREATION_HISTORY_SCHEMA_VERSION.to_string();
        }

        Ok(document)
    }

    fn persist_document(&self, document: &CreationHistoryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(
                "CREATION_HISTORY_SERIALIZE_FAILED",
                format!("failed to serialize creation history document: {error}"),
            )
        })?;
        fs::write(self.storage_paths.creation_history_file(), contents).map_err(|error| {
            ServerError::internal(
                "CREATION_HISTORY_WRITE_FAILED",
                format!(
                    "failed to write creation history document {}: {error}",
                    self.storage_paths.creation_history_file().display()
                ),
            )
        })
    }
}

impl CreationHistoryService for FileBackedCreationHistoryService {
    fn read_history_entry(&self, entry_id: &str) -> ServerResult<CreationHistoryEntryRecord> {
        let _guard = self.acquire_lock()?;
        let normalized_entry_id = require_non_empty_text(
            entry_id.to_string(),
            "CREATION_HISTORY_ENTRY_ID_EMPTY",
            "entryId",
        )?;
        let document = self.load_document()?;
        let favorite_ids = favorite_id_set(&document.favorite_entry_ids);

        if let Some(entry) = document
            .imported_entries
            .into_iter()
            .find(|candidate| matches_history_entry_key(candidate, &normalized_entry_id))
        {
            return Ok(apply_favorite(entry, &favorite_ids));
        }

        let task = self
            .generation_service
            .read_history_task(&normalized_entry_id)?;
        let is_favorite = generation_task_is_favorite(&task, &favorite_ids);
        Ok(map_generation_task_to_history_entry(task, is_favorite))
    }

    fn list_history(
        &self,
        query: CreationHistoryListQuery,
    ) -> ServerResult<CreationHistoryPageRecord> {
        let _guard = self.acquire_lock()?;
        let normalized_query = normalize_history_query(query)?;
        let document = self.load_document()?;
        let favorite_ids = favorite_id_set(&document.favorite_entry_ids);

        let generated_entries = if normalized_query.source.as_deref() == Some("imported") {
            Vec::new()
        } else {
            self.generation_service
                .list_history_tasks(
                    normalized_query
                        .product
                        .as_deref()
                        .map(parse_generation_product)
                        .transpose()?,
                    normalized_query.status.clone(),
                )?
                .into_iter()
                .map(|task| {
                    let is_favorite = generation_task_is_favorite(&task, &favorite_ids);
                    map_generation_task_to_history_entry(task, is_favorite)
                })
                .collect::<Vec<_>>()
        };

        let imported_entries = if normalized_query.source.as_deref() == Some("generation") {
            Vec::new()
        } else {
            document
                .imported_entries
                .into_iter()
                .map(|entry| apply_favorite(entry, &favorite_ids))
                .collect::<Vec<_>>()
        };

        let mut entries = generated_entries
            .into_iter()
            .chain(imported_entries)
            .filter(|entry| entry_matches_query(entry, &normalized_query))
            .collect::<Vec<_>>();

        entries.sort_by(|left, right| {
            right
                .updated_at
                .cmp(&left.updated_at)
                .then_with(|| right.created_at.cmp(&left.created_at))
                .then_with(|| right.id.cmp(&left.id))
        });

        let total = entries.len();
        let start = (normalized_query.page - 1).saturating_mul(normalized_query.page_size);
        let items = entries
            .into_iter()
            .skip(start)
            .take(normalized_query.page_size)
            .collect();

        Ok(CreationHistoryPageRecord {
            items,
            page: normalized_query.page,
            page_size: normalized_query.page_size,
            total,
        })
    }

    fn upsert_history_entry(
        &self,
        input: UpsertCreationHistoryEntryRequest,
    ) -> ServerResult<CreationHistoryEntryRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let mut favorite_ids = favorite_id_set(&document.favorite_entry_ids);
        let entry = normalize_imported_entry(input)?;
        let entry_id = entry.id.clone();
        let entry_uuid = entry.uuid.clone();

        discard_favorite_aliases(&mut favorite_ids, &[entry_id.as_str(), entry_uuid.as_str()]);
        if entry.is_favorite {
            favorite_ids.insert(entry_id);
        }

        let stored_entry = apply_favorite(entry.clone(), &favorite_ids);
        document
            .imported_entries
            .retain(|candidate| !is_same_history_entry(candidate, &stored_entry));
        document.imported_entries.insert(0, stored_entry.clone());

        document.favorite_entry_ids = favorite_ids.iter().cloned().collect();
        self.persist_document(&document)?;
        Ok(stored_entry)
    }

    fn set_history_entry_favorite(
        &self,
        entry_id: &str,
        input: CreationHistoryFavoriteRequest,
    ) -> ServerResult<CreationHistoryEntryRecord> {
        let _guard = self.acquire_lock()?;
        let normalized_entry_id = require_non_empty_text(
            entry_id.to_string(),
            "CREATION_HISTORY_ENTRY_ID_EMPTY",
            "entryId",
        )?;
        let mut document = self.load_document()?;
        let mut favorite_ids = favorite_id_set(&document.favorite_entry_ids);

        let imported_entry = document
            .imported_entries
            .iter()
            .find(|candidate| matches_history_entry_key(candidate, &normalized_entry_id))
            .cloned();
        let generation_task = if imported_entry.is_none() {
            Some(
                self.generation_service
                    .read_history_task(&normalized_entry_id)?,
            )
        } else {
            None
        };

        let canonical_entry_id = imported_entry
            .as_ref()
            .map(|entry| entry.id.clone())
            .or_else(|| generation_task.as_ref().map(|task| task.task_id.clone()))
            .ok_or_else(|| {
                ServerError::not_found(
                    "CREATION_HISTORY_ENTRY_NOT_FOUND",
                    format!("creation history entry {normalized_entry_id} was not found"),
                )
            })?;

        let canonical_entry_uuid = imported_entry
            .as_ref()
            .map(|entry| entry.uuid.clone())
            .or_else(|| generation_task.as_ref().map(|task| task.uuid.clone()));
        let generation_record_id = generation_task.as_ref().map(|task| task.id.clone());

        let mut aliases = vec![normalized_entry_id.as_str(), canonical_entry_id.as_str()];
        if let Some(entry_uuid) = canonical_entry_uuid.as_deref() {
            aliases.push(entry_uuid);
        }
        if let Some(record_id) = generation_record_id.as_deref() {
            aliases.push(record_id);
        }
        discard_favorite_aliases(&mut favorite_ids, &aliases);

        if input.is_favorite {
            favorite_ids.insert(canonical_entry_id.clone());
        }

        for entry in &mut document.imported_entries {
            if matches_history_entry_key(entry, &canonical_entry_id) {
                entry.is_favorite = favorite_ids.contains(canonical_entry_id.as_str());
            }
        }

        document.favorite_entry_ids = favorite_ids.iter().cloned().collect();
        self.persist_document(&document)?;

        if let Some(entry) = imported_entry {
            return Ok(apply_favorite(entry, &favorite_ids));
        }

        let task =
            generation_task.expect("generation task should exist when imported entry is absent");
        Ok(map_generation_task_to_history_entry(
            task,
            favorite_ids.contains(canonical_entry_id.as_str()),
        ))
    }

    fn delete_history_entry(&self, entry_id: &str) -> ServerResult<CreationHistoryEntryRecord> {
        let _guard = self.acquire_lock()?;
        let normalized_entry_id = require_non_empty_text(
            entry_id.to_string(),
            "CREATION_HISTORY_ENTRY_ID_EMPTY",
            "entryId",
        )?;
        let mut document = self.load_document()?;
        let mut favorite_ids = favorite_id_set(&document.favorite_entry_ids);

        if let Some(position) = document
            .imported_entries
            .iter()
            .position(|candidate| matches_history_entry_key(candidate, &normalized_entry_id))
        {
            let mut entry = document.imported_entries.remove(position);
            discard_favorite_aliases(
                &mut favorite_ids,
                &[
                    normalized_entry_id.as_str(),
                    entry.id.as_str(),
                    entry.uuid.as_str(),
                ],
            );
            document.favorite_entry_ids = favorite_ids.iter().cloned().collect();
            self.persist_document(&document)?;
            entry.is_favorite = false;
            return Ok(entry);
        }

        let task = self
            .generation_service
            .delete_history_task(&normalized_entry_id)?;
        discard_favorite_aliases(
            &mut favorite_ids,
            &[
                normalized_entry_id.as_str(),
                task.task_id.as_str(),
                task.id.as_str(),
                task.uuid.as_str(),
            ],
        );
        document.favorite_entry_ids = favorite_ids.iter().cloned().collect();
        self.persist_document(&document)?;
        Ok(map_generation_task_to_history_entry(task, false))
    }

    fn clear_history(&self, query: CreationHistoryListQuery) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let normalized_query = normalize_history_query(query)?;
        let mut document = self.load_document()?;
        let favorite_ids = favorite_id_set(&document.favorite_entry_ids);
        let mut removed_ids = BTreeSet::new();

        if normalized_query.source.as_deref() != Some("generation") {
            let mut retained = Vec::new();
            for entry in document.imported_entries.drain(..) {
                let applied = apply_favorite(entry, &favorite_ids);
                if entry_matches_query(&applied, &normalized_query) {
                    add_history_entry_aliases(&mut removed_ids, &applied);
                } else {
                    retained.push(applied);
                }
            }
            document.imported_entries = retained;
        }

        if normalized_query.source.as_deref() != Some("imported") {
            let generated = self.generation_service.list_history_tasks(
                normalized_query
                    .product
                    .as_deref()
                    .map(parse_generation_product)
                    .transpose()?,
                normalized_query.status.clone(),
            )?;

            for task in generated {
                let task_record_id = task.id.clone();
                let is_favorite = generation_task_is_favorite(&task, &favorite_ids);
                let entry = map_generation_task_to_history_entry(task, is_favorite);
                if entry_matches_query(&entry, &normalized_query) {
                    self.generation_service.delete_history_task(&entry.id)?;
                    removed_ids.insert(task_record_id);
                    add_history_entry_aliases(&mut removed_ids, &entry);
                }
            }
        }

        if !removed_ids.is_empty() {
            document
                .favorite_entry_ids
                .retain(|candidate| !removed_ids.contains(candidate));
        }

        self.persist_document(&document)
    }
}

#[derive(Debug, Clone)]
struct NormalizedCreationHistoryQuery {
    page: usize,
    page_size: usize,
    product: Option<String>,
    source: Option<String>,
    status: Option<String>,
    favorite_only: bool,
}

fn normalize_history_query(
    query: CreationHistoryListQuery,
) -> ServerResult<NormalizedCreationHistoryQuery> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(50).clamp(1, 200);
    let product = match query.product {
        Some(value) => Some(normalize_history_product(Some(value))?),
        None => None,
    };
    let source = match query.source {
        Some(value) => Some(normalize_history_source(Some(value))?),
        None => None,
    };
    let status = match query.status {
        Some(value) => Some(normalize_history_status(Some(value))?),
        None => None,
    };

    Ok(NormalizedCreationHistoryQuery {
        page,
        page_size,
        product,
        source,
        status,
        favorite_only: query.favorite_only.unwrap_or(false),
    })
}

fn normalize_imported_entry(
    input: UpsertCreationHistoryEntryRequest,
) -> ServerResult<CreationHistoryEntryRecord> {
    let product = normalize_history_product(Some(input.product))?;
    let source = normalize_imported_source(input.source)?;
    let status = normalize_history_status(Some(input.status))?;
    let id = input
        .id
        .and_then(normalize_text)
        .unwrap_or_else(next_creation_history_id);
    let uuid = input
        .uuid
        .and_then(normalize_text)
        .unwrap_or_else(|| format!("client-entity:{id}"));
    let now = current_timestamp();
    let created_at = input
        .created_at
        .and_then(normalize_text)
        .unwrap_or_else(|| now.clone());
    let updated_at = input
        .updated_at
        .and_then(normalize_text)
        .unwrap_or_else(|| now.clone());

    Ok(CreationHistoryEntryRecord {
        id,
        uuid,
        product: product.clone(),
        source,
        status,
        error: input.error.and_then(normalize_text),
        is_favorite: input.is_favorite.unwrap_or(false),
        config: normalize_history_config(input.config, &product),
        results: normalize_history_results(input.results.unwrap_or_default()),
        created_at,
        updated_at,
        completed_at: input.completed_at.and_then(normalize_text),
    })
}

fn favorite_id_set(values: &[String]) -> BTreeSet<String> {
    values
        .iter()
        .filter_map(|value| normalize_optional_text(Some(value.clone())))
        .collect()
}

fn generation_task_is_favorite(
    task: &GenerationTaskRecord,
    favorite_ids: &BTreeSet<String>,
) -> bool {
    favorite_ids.contains(task.task_id.as_str())
        || favorite_ids.contains(task.id.as_str())
        || favorite_ids.contains(task.uuid.as_str())
}

fn add_history_entry_aliases(values: &mut BTreeSet<String>, entry: &CreationHistoryEntryRecord) {
    values.insert(entry.id.clone());
    values.insert(entry.uuid.clone());
}

fn discard_favorite_aliases(favorite_ids: &mut BTreeSet<String>, aliases: &[&str]) {
    for alias in aliases {
        favorite_ids.remove(*alias);
    }
}

fn entry_matches_query(
    entry: &CreationHistoryEntryRecord,
    query: &NormalizedCreationHistoryQuery,
) -> bool {
    if query
        .product
        .as_ref()
        .map(|product| entry.product != *product)
        .unwrap_or(false)
    {
        return false;
    }

    if query
        .source
        .as_ref()
        .map(|source| entry.source != *source)
        .unwrap_or(false)
    {
        return false;
    }

    if query
        .status
        .as_ref()
        .map(|status| entry.status != *status)
        .unwrap_or(false)
    {
        return false;
    }

    if query.favorite_only && !entry.is_favorite {
        return false;
    }

    true
}

fn apply_favorite(
    mut entry: CreationHistoryEntryRecord,
    favorite_ids: &BTreeSet<String>,
) -> CreationHistoryEntryRecord {
    entry.is_favorite =
        favorite_ids.contains(entry.id.as_str()) || favorite_ids.contains(entry.uuid.as_str());
    entry
}

fn matches_history_entry_key(entry: &CreationHistoryEntryRecord, key: &str) -> bool {
    entry.id == key || entry.uuid == key
}

fn is_same_history_entry(
    candidate: &CreationHistoryEntryRecord,
    entry: &CreationHistoryEntryRecord,
) -> bool {
    candidate.id == entry.id || candidate.uuid == entry.uuid
}

fn map_generation_task_to_history_entry(
    task: GenerationTaskRecord,
    is_favorite: bool,
) -> CreationHistoryEntryRecord {
    let product = generation_product_label(task.product).to_string();
    let config = map_generation_task_config(&task);
    let results = task
        .artifacts
        .iter()
        .map(|artifact| map_generation_artifact_to_history_result(artifact, &task))
        .collect();

    CreationHistoryEntryRecord {
        id: task.task_id.clone(),
        uuid: task.uuid,
        product: product.clone(),
        source: "generation".to_string(),
        status: map_generation_status(task.status).to_string(),
        error: task.error_message,
        is_favorite,
        config,
        results,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
    }
}

fn map_generation_task_config(task: &GenerationTaskRecord) -> CreationHistoryConfigRecord {
    let media_type = read_string_field(task.parameters.as_ref(), "mediaType")
        .or_else(|| Some(default_media_type_for_generation_task(task).to_string()));
    let model = read_string_field(task.parameters.as_ref(), "model").or_else(|| {
        normalize_optional_text(Some(task.provider_model.clone()))
            .filter(|value| value != "unconfigured")
    });
    let prompt = task
        .prompt
        .clone()
        .and_then(|value| normalize_optional_text(Some(value)))
        .or_else(|| read_string_field(task.parameters.as_ref(), "prompt"));

    CreationHistoryConfigRecord {
        prompt,
        text: read_string_field(task.parameters.as_ref(), "text")
            .or_else(|| read_string_field(task.parameters.as_ref(), "lyrics"))
            .or_else(|| read_string_field(task.parameters.as_ref(), "title")),
        preview_text: read_string_field(task.parameters.as_ref(), "previewText")
            .or_else(|| read_string_field(task.parameters.as_ref(), "description"))
            .or_else(|| read_string_field(task.parameters.as_ref(), "title")),
        media_type,
        aspect_ratio: read_string_field(task.parameters.as_ref(), "aspectRatio"),
        model,
        use_multi_model: read_bool_field(task.parameters.as_ref(), "useMultiModel"),
        metadata: normalize_metadata_map(task.parameters.clone()),
    }
}

fn map_generation_artifact_to_history_result(
    artifact: &super::generation::GenerationArtifactRecord,
    task: &GenerationTaskRecord,
) -> CreationHistoryResultRecord {
    let resource_type =
        map_artifact_type_to_resource_type(artifact.r#type.as_str(), artifact.mime_type.as_deref());

    CreationHistoryResultRecord {
        id: Some(artifact.id.clone()),
        uuid: Some(artifact.uuid.clone()),
        asset_id: artifact.asset_id.clone(),
        asset_uuid: artifact.asset_uuid.clone(),
        primary_resource_id: artifact.primary_resource_id.clone(),
        primary_resource_uuid: artifact.primary_resource_uuid.clone(),
        resource_view_id: artifact.resource_view_id.clone(),
        resource_view_uuid: artifact.resource_view_uuid.clone(),
        artifact_uuid: Some(artifact.uuid.clone()),
        execution_id: Some(task.id.clone()),
        path: None,
        url: Some(artifact.url.clone()),
        mime_type: artifact.mime_type.clone(),
        poster_url: artifact.poster_url.clone(),
        resource: Some(CreationHistoryResultResourceRecord {
            id: artifact.primary_resource_id.clone(),
            uuid: artifact.primary_resource_uuid.clone(),
            asset_id: artifact.asset_id.clone(),
            asset_uuid: artifact.asset_uuid.clone(),
            primary_resource_id: artifact.primary_resource_id.clone(),
            primary_resource_uuid: artifact.primary_resource_uuid.clone(),
            resource_view_id: artifact.resource_view_id.clone(),
            resource_view_uuid: artifact.resource_view_uuid.clone(),
            r#type: Some(resource_type.to_string()),
            path: None,
            url: Some(artifact.url.clone()),
            mime_type: artifact.mime_type.clone(),
            name: Some(artifact.name.clone()),
            text: None,
            language: None,
            metadata: artifact.metadata.clone(),
        }),
        cover_resource: artifact.poster_url.as_ref().map(|poster_url| {
            CreationHistoryResultResourceRecord {
                id: None,
                uuid: None,
                asset_id: artifact.asset_id.clone(),
                asset_uuid: artifact.asset_uuid.clone(),
                primary_resource_id: None,
                primary_resource_uuid: None,
                resource_view_id: None,
                resource_view_uuid: None,
                r#type: Some("IMAGE".to_string()),
                path: None,
                url: Some(poster_url.clone()),
                mime_type: Some("image/png".to_string()),
                name: Some(format!("{}-poster", artifact.name)),
                text: None,
                language: None,
                metadata: None,
            }
        }),
        model_id: normalize_optional_text(Some(task.provider_model.clone())),
        duration: artifact.duration,
    }
}

fn normalize_history_config(
    config: CreationHistoryConfigRecord,
    product: &str,
) -> CreationHistoryConfigRecord {
    CreationHistoryConfigRecord {
        prompt: normalize_optional_text(config.prompt),
        text: normalize_optional_text(config.text),
        preview_text: normalize_optional_text(config.preview_text),
        media_type: normalize_optional_text(config.media_type)
            .or_else(|| Some(default_media_type_for_product(product).to_string())),
        aspect_ratio: normalize_optional_text(config.aspect_ratio),
        model: normalize_optional_text(config.model),
        use_multi_model: config.use_multi_model,
        metadata: normalize_metadata_map(config.metadata),
    }
}

fn normalize_history_results(
    results: Vec<CreationHistoryResultRecord>,
) -> Vec<CreationHistoryResultRecord> {
    results
        .into_iter()
        .map(|result| CreationHistoryResultRecord {
            id: normalize_optional_text(result.id),
            uuid: normalize_optional_text(result.uuid),
            asset_id: normalize_optional_text(result.asset_id),
            asset_uuid: normalize_optional_text(result.asset_uuid),
            primary_resource_id: normalize_optional_text(result.primary_resource_id),
            primary_resource_uuid: normalize_optional_text(result.primary_resource_uuid),
            resource_view_id: normalize_optional_text(result.resource_view_id),
            resource_view_uuid: normalize_optional_text(result.resource_view_uuid),
            artifact_uuid: normalize_optional_text(result.artifact_uuid),
            execution_id: normalize_optional_text(result.execution_id),
            path: normalize_optional_text(result.path),
            url: normalize_optional_text(result.url),
            mime_type: normalize_optional_text(result.mime_type),
            poster_url: normalize_optional_text(result.poster_url),
            resource: result.resource.map(normalize_history_result_resource),
            cover_resource: result.cover_resource.map(normalize_history_result_resource),
            model_id: normalize_optional_text(result.model_id),
            duration: result.duration,
        })
        .collect()
}

fn normalize_history_result_resource(
    resource: CreationHistoryResultResourceRecord,
) -> CreationHistoryResultResourceRecord {
    CreationHistoryResultResourceRecord {
        id: normalize_optional_text(resource.id),
        uuid: normalize_optional_text(resource.uuid),
        asset_id: normalize_optional_text(resource.asset_id),
        asset_uuid: normalize_optional_text(resource.asset_uuid),
        primary_resource_id: normalize_optional_text(resource.primary_resource_id),
        primary_resource_uuid: normalize_optional_text(resource.primary_resource_uuid),
        resource_view_id: normalize_optional_text(resource.resource_view_id),
        resource_view_uuid: normalize_optional_text(resource.resource_view_uuid),
        r#type: normalize_optional_text(resource.r#type),
        path: normalize_optional_text(resource.path),
        url: normalize_optional_text(resource.url),
        mime_type: normalize_optional_text(resource.mime_type),
        name: normalize_optional_text(resource.name),
        text: normalize_optional_text(resource.text),
        language: normalize_optional_text(resource.language),
        metadata: normalize_metadata_map(resource.metadata),
    }
}

fn normalize_metadata_map(value: Option<Map<String, Value>>) -> Option<Map<String, Value>> {
    value.and_then(|mut metadata| {
        metadata.retain(|_, value| !value.is_null());
        if metadata.is_empty() {
            None
        } else {
            Some(metadata)
        }
    })
}

fn normalize_history_product(value: Option<String>) -> ServerResult<String> {
    let normalized = normalize_optional_text(value)
        .map(|value| value.to_ascii_lowercase().replace('-', "_"))
        .unwrap_or_default();

    if matches!(
        normalized.as_str(),
        "image" | "video" | "audio" | "music" | "character" | "sfx"
    ) {
        return Ok(normalized);
    }

    Err(ServerError::bad_request(
        "CREATION_HISTORY_PRODUCT_INVALID",
        "product must be one of image, video, audio, music, character, or sfx",
    ))
}

fn normalize_history_source(value: Option<String>) -> ServerResult<String> {
    let normalized = normalize_optional_text(value)
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_default();
    if matches!(normalized.as_str(), "generation" | "imported") {
        return Ok(normalized);
    }

    Err(ServerError::bad_request(
        "CREATION_HISTORY_SOURCE_INVALID",
        "source must be generation or imported",
    ))
}

fn normalize_imported_source(value: Option<String>) -> ServerResult<String> {
    match value {
        Some(source) => {
            let normalized = normalize_history_source(Some(source))?;
            if normalized != "imported" {
                return Err(ServerError::bad_request(
                    "CREATION_HISTORY_IMPORT_SOURCE_INVALID",
                    "imported history entries must use source imported",
                ));
            }
            Ok(normalized)
        }
        None => Ok("imported".to_string()),
    }
}

fn normalize_history_status(value: Option<String>) -> ServerResult<String> {
    let normalized = normalize_optional_text(value)
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_default();
    if matches!(
        normalized.as_str(),
        "draft" | "pending" | "processing" | "completed" | "failed" | "cancelled"
    ) {
        return Ok(normalized);
    }

    Err(ServerError::bad_request(
        "CREATION_HISTORY_STATUS_INVALID",
        "status must be one of draft, pending, processing, completed, failed, or cancelled",
    ))
}

fn parse_generation_product(value: &str) -> ServerResult<GenerationProduct> {
    match value {
        "image" => Ok(GenerationProduct::Image),
        "video" => Ok(GenerationProduct::Video),
        "audio" => Ok(GenerationProduct::Audio),
        "music" => Ok(GenerationProduct::Music),
        "character" => Ok(GenerationProduct::Character),
        "sfx" => Ok(GenerationProduct::Sfx),
        _ => Err(ServerError::bad_request(
            "CREATION_HISTORY_PRODUCT_INVALID",
            format!("unsupported creation history product {value}"),
        )),
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
        GenerationProduct::Speech => "audio",
    }
}

fn map_generation_status(status: GenerationTaskStatus) -> &'static str {
    match status {
        GenerationTaskStatus::Draft => "draft",
        GenerationTaskStatus::Queued => "pending",
        GenerationTaskStatus::Processing => "processing",
        GenerationTaskStatus::Succeeded => "completed",
        GenerationTaskStatus::Failed => "failed",
        GenerationTaskStatus::Cancelled => "cancelled",
    }
}

fn default_media_type_for_product(product: &str) -> &'static str {
    match product {
        "image" => "image",
        "video" => "video",
        "audio" => "audio",
        "music" => "music",
        "character" => "character",
        "sfx" => "audio",
        _ => "image",
    }
}

fn default_media_type_for_generation_task(task: &GenerationTaskRecord) -> &'static str {
    match task.product {
        GenerationProduct::Image => "image",
        GenerationProduct::Video => "video",
        GenerationProduct::Audio => {
            if task.mode == "text-to-speech" {
                "speech"
            } else {
                "audio"
            }
        }
        GenerationProduct::Music => "music",
        GenerationProduct::Character => "character",
        GenerationProduct::Sfx => "audio",
        GenerationProduct::Speech => "voice",
    }
}

fn map_artifact_type_to_resource_type(
    artifact_type: &str,
    mime_type: Option<&str>,
) -> &'static str {
    match artifact_type.trim().to_ascii_lowercase().as_str() {
        "text" => "TEXT",
        "image" => "IMAGE",
        "video" => "VIDEO",
        "audio" => "AUDIO",
        "music" => "MUSIC",
        "voice" => "VOICE",
        "speech" => "SPEECH",
        "character" => "CHARACTER",
        "sfx" => "SFX",
        "file" => {
            if mime_type
                .map(|value| value.trim().to_ascii_lowercase().starts_with("text/"))
                .unwrap_or(false)
            {
                "TEXT"
            } else {
                "FILE"
            }
        }
        _ => "FILE",
    }
}

fn read_string_field(parameters: Option<&Map<String, Value>>, field: &str) -> Option<String> {
    parameters
        .and_then(|parameters| parameters.get(field))
        .and_then(|value| value.as_str())
        .map(|value| value.to_string())
        .and_then(|value| normalize_optional_text(Some(value)))
}

fn read_bool_field(parameters: Option<&Map<String, Value>>, field: &str) -> Option<bool> {
    parameters
        .and_then(|parameters| parameters.get(field))
        .and_then(|value| value.as_bool())
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let normalized = item.trim().to_string();
        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    })
}

fn normalize_text(value: String) -> Option<String> {
    normalize_optional_text(Some(value))
}

fn require_non_empty_text(value: String, code: &str, field_name: &str) -> ServerResult<String> {
    let normalized = value.trim().to_string();
    if normalized.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }
    Ok(normalized)
}

fn current_time_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}

fn current_timestamp() -> String {
    let millis = current_time_millis();
    time::OffsetDateTime::from_unix_timestamp_nanos((millis as i128) * 1_000_000)
        .map(|datetime| datetime.format(&time::format_description::well_known::Rfc3339))
        .ok()
        .and_then(Result::ok)
        .unwrap_or_else(|| "1970-01-01T00:00:00Z".to_string())
}

fn next_creation_history_id() -> String {
    let now = current_time_millis();
    let counter = CREATION_HISTORY_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("creation-history-{now}-{counter}")
}
