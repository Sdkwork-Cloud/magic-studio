use std::collections::BTreeSet;
use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};



use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

use super::service_utils::{normalize_optional_text, current_timestamp, to_client_entity_uuid, require_non_empty_text};
const NOTES_SCHEMA_VERSION: &str = "magic-studio.notes.v1";
const DEFAULT_NOTES_PAGE_SIZE: usize = 50;
const MAX_NOTES_PAGE_SIZE: usize = 200;

static NOTE_COUNTER: AtomicU64 = AtomicU64::new(1);
static NOTE_FOLDER_COUNTER: AtomicU64 = AtomicU64::new(1);
static NOTE_PUBLISH_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NoteType {
    Doc,
    Article,
    Novel,
    Log,
    News,
    Code,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PublishStatus {
    Draft,
    Publishing,
    Published,
    Failed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NoteMetadataRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub word_count: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reading_time: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cover_image: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub custom_width: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteSummaryRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub uuid: String,
    pub title: String,
    #[serde(rename = "type")]
    pub note_type: NoteType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub tags: Vec<String>,
    pub is_favorite: bool,
    pub snippet: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub publish_status: Option<PublishStatus>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<NoteMetadataRecord>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRecord {
    #[serde(flatten)]
    pub summary: NoteSummaryRecord,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteFolderRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub uuid: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteWorkspaceSnapshotRecord {
    pub notes: Vec<NoteSummaryRecord>,
    pub trashed_notes: Vec<NoteSummaryRecord>,
    pub folders: Vec<NoteFolderRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishResultRecord {
    pub success: bool,
    pub platform_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub post_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NoteListResult {
    pub items: Vec<NoteSummaryRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NoteListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub folder_id: Option<String>,
    pub keyword: Option<String>,
    #[serde(rename = "type")]
    pub note_type: Option<NoteType>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteCreateRequest {
    pub title: String,
    #[serde(rename = "type")]
    pub note_type: NoteType,
    pub parent_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub content: Option<String>,
    pub metadata: Option<NoteMetadataRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteUpdateRequest {
    pub title: Option<String>,
    #[serde(rename = "type")]
    pub note_type: Option<NoteType>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub content: Option<String>,
    pub metadata: Option<NoteMetadataRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteFolderCreateRequest {
    pub name: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteFolderRenameRequest {
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteMoveRequest {
    pub target_folder_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteFolderMoveRequest {
    pub target_folder_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotePublishRequest {
    pub platform: String,
    pub target_name: Option<String>,
    pub original_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NoteRegistryDocument {
    pub schema_version: String,
    pub notes: Vec<StoredNoteRecord>,
    pub folders: Vec<StoredNoteFolderRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredNoteRecord {
    pub id: String,
    pub uuid: String,
    pub title: String,
    #[serde(rename = "type")]
    pub note_type: NoteType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub tags: Vec<String>,
    pub is_favorite: bool,
    pub content: String,
    pub publish_status: PublishStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<NoteMetadataRecord>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredNoteFolderRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub trait NoteService: Send + Sync {
    fn read_workspace_snapshot(&self) -> ServerResult<NoteWorkspaceSnapshotRecord>;
    fn list_notes(
        &self,
        query: NoteListQuery,
        include_trashed: bool,
    ) -> ServerResult<NoteListResult>;
    fn create_note(&self, input: NoteCreateRequest) -> ServerResult<NoteRecord>;
    fn read_note(&self, note_key: &str) -> ServerResult<NoteRecord>;
    fn update_note(&self, note_key: &str, input: NoteUpdateRequest) -> ServerResult<NoteRecord>;
    fn create_folder(&self, input: NoteFolderCreateRequest) -> ServerResult<NoteFolderRecord>;
    fn rename_folder(
        &self,
        folder_key: &str,
        input: NoteFolderRenameRequest,
    ) -> ServerResult<NoteFolderRecord>;
    fn delete_folder(&self, folder_key: &str) -> ServerResult<()>;
    fn trash_note(&self, note_key: &str) -> ServerResult<NoteRecord>;
    fn restore_note(&self, note_key: &str) -> ServerResult<NoteRecord>;
    fn delete_note(&self, note_key: &str) -> ServerResult<()>;
    fn clear_trash(&self) -> ServerResult<usize>;
    fn move_folder(&self, folder_key: &str, input: NoteFolderMoveRequest) -> ServerResult<()>;
    fn move_note(&self, note_key: &str, input: NoteMoveRequest) -> ServerResult<()>;
    fn publish_note(
        &self,
        note_key: &str,
        input: NotePublishRequest,
    ) -> ServerResult<PublishResultRecord>;
}

pub struct FileBackedNoteService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedNoteService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("notes registry lock was poisoned")
        })
    }

    fn default_document(&self) -> NoteRegistryDocument {
        NoteRegistryDocument {
            schema_version: NOTES_SCHEMA_VERSION.to_string(),
            notes: Vec::new(),
            folders: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<NoteRegistryDocument> {
        let path = self.storage_paths.notes_registry_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(format!(
                        "failed to read notes registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<NoteRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(format!("failed to parse notes registry {}: {error}", path.display()),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &NoteRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(format!("failed to serialize notes registry: {error}"),
            )
        })?;
        fs::write(self.storage_paths.notes_registry_file(), contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write notes registry to {}: {error}",
                    self.storage_paths.notes_registry_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut NoteRegistryDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = NOTES_SCHEMA_VERSION.to_string();
        }

        for note in &mut document.notes {
            note.uuid = normalize_optional_text(Some(note.uuid.clone()))
                .unwrap_or_else(|| to_client_entity_uuid(&note.id));
            note.title = note.title.trim().to_string();
            note.parent_id = normalize_optional_text(note.parent_id.clone());
            note.tags = normalize_tags(Some(note.tags.clone()));
            note.content = note.content.trim().to_string();
            note.metadata = normalize_metadata(note.metadata.clone());
            note.deleted_at = normalize_optional_text(note.deleted_at.clone());
        }

        for folder in &mut document.folders {
            folder.uuid = normalize_optional_text(Some(folder.uuid.clone()))
                .unwrap_or_else(|| to_client_entity_uuid(&folder.id));
            folder.name = folder.name.trim().to_string();
            folder.parent_id = normalize_optional_text(folder.parent_id.clone());
        }

        sort_notes(&mut document.notes);
        sort_folders(&mut document.folders);
    }

    fn read_folder<'a>(
        &self,
        folders: &'a [StoredNoteFolderRecord],
        folder_key: &str,
    ) -> ServerResult<&'a StoredNoteFolderRecord> {
        folders
            .iter()
            .find(|folder| folder.id == folder_key || folder.uuid == folder_key)
            .ok_or_else(|| {
                ServerError::not_found(format!("note folder {folder_key} was not found"),
                )
            })
    }

    fn read_folder_mut<'a>(
        &self,
        folders: &'a mut [StoredNoteFolderRecord],
        folder_key: &str,
    ) -> ServerResult<&'a mut StoredNoteFolderRecord> {
        folders
            .iter_mut()
            .find(|folder| folder.id == folder_key || folder.uuid == folder_key)
            .ok_or_else(|| {
                ServerError::not_found(format!("note folder {folder_key} was not found"),
                )
            })
    }

    fn read_note_record<'a>(
        &self,
        notes: &'a [StoredNoteRecord],
        note_key: &str,
    ) -> ServerResult<&'a StoredNoteRecord> {
        notes
            .iter()
            .find(|note| note.id == note_key || note.uuid == note_key)
            .ok_or_else(|| {
                ServerError::not_found(format!("note {note_key} was not found"),
                )
            })
    }

    fn read_note_record_mut<'a>(
        &self,
        notes: &'a mut [StoredNoteRecord],
        note_key: &str,
    ) -> ServerResult<&'a mut StoredNoteRecord> {
        notes
            .iter_mut()
            .find(|note| note.id == note_key || note.uuid == note_key)
            .ok_or_else(|| {
                ServerError::not_found(format!("note {note_key} was not found"),
                )
            })
    }

    fn resolve_folder_storage_id(
        &self,
        folders: &[StoredNoteFolderRecord],
        folder_key: Option<String>,
        _field_name: &str,
    ) -> ServerResult<Option<String>> {
        match normalize_optional_text(folder_key) {
            Some(folder_key) => Ok(Some(self.read_folder(folders, &folder_key)?.id.clone())),
            None => Ok(None),
        }
    }

    fn ensure_folder_name_available(
        &self,
        folders: &[StoredNoteFolderRecord],
        parent_id: Option<&str>,
        name: &str,
        ignore_folder_id: Option<&str>,
    ) -> ServerResult<()> {
        for folder in folders {
            if folder.parent_id.as_deref() != parent_id {
                continue;
            }
            if ignore_folder_id == Some(folder.id.as_str()) {
                continue;
            }
            if folder.name.eq_ignore_ascii_case(name) {
                return Err(ServerError::conflict(format!("a note folder named {name} already exists in the target location"),
                ));
            }
        }
        Ok(())
    }

    fn ensure_folder_empty(
        &self,
        document: &NoteRegistryDocument,
        folder_id: &str,
    ) -> ServerResult<()> {
        if document
            .folders
            .iter()
            .any(|folder| folder.parent_id.as_deref() == Some(folder_id))
        {
            return Err(ServerError::conflict("a conflict occurred"));
        }

        if document
            .notes
            .iter()
            .any(|note| note.parent_id.as_deref() == Some(folder_id))
        {
            return Err(ServerError::conflict("a conflict occurred"));
        }

        Ok(())
    }

    fn is_descendant_folder(
        &self,
        folders: &[StoredNoteFolderRecord],
        folder_id: &str,
        ancestor_id: &str,
    ) -> ServerResult<bool> {
        let mut current_parent = self.read_folder(folders, folder_id)?.parent_id.clone();
        while let Some(parent_id) = current_parent {
            if parent_id == ancestor_id {
                return Ok(true);
            }
            current_parent = self.read_folder(folders, &parent_id)?.parent_id.clone();
        }
        Ok(false)
    }

    fn map_summary(&self, note: &StoredNoteRecord) -> NoteSummaryRecord {
        NoteSummaryRecord {
            id: Some(note.id.clone()),
            uuid: note.uuid.clone(),
            title: note.title.clone(),
            note_type: note.note_type,
            parent_id: note.parent_id.clone(),
            tags: note.tags.clone(),
            is_favorite: note.is_favorite,
            snippet: create_snippet(&note.content),
            publish_status: Some(note.publish_status),
            metadata: note.metadata.clone(),
            created_at: note.created_at.clone(),
            updated_at: note.updated_at.clone(),
            deleted_at: note.deleted_at.clone(),
        }
    }

    fn map_note(&self, note: &StoredNoteRecord) -> NoteRecord {
        NoteRecord {
            summary: self.map_summary(note),
            content: note.content.clone(),
        }
    }

    fn map_folder(&self, folder: &StoredNoteFolderRecord) -> NoteFolderRecord {
        NoteFolderRecord {
            id: Some(folder.id.clone()),
            uuid: folder.uuid.clone(),
            name: folder.name.clone(),
            parent_id: folder.parent_id.clone(),
            created_at: folder.created_at.clone(),
            updated_at: folder.updated_at.clone(),
            deleted_at: None,
        }
    }
}

impl NoteService for FileBackedNoteService {
    fn read_workspace_snapshot(&self) -> ServerResult<NoteWorkspaceSnapshotRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;

        let mut notes = document
            .notes
            .iter()
            .filter(|note| note.deleted_at.is_none())
            .map(|note| self.map_summary(note))
            .collect::<Vec<_>>();
        let mut trashed_notes = document
            .notes
            .iter()
            .filter(|note| note.deleted_at.is_some())
            .map(|note| self.map_summary(note))
            .collect::<Vec<_>>();
        let mut folders = document
            .folders
            .iter()
            .map(|folder| self.map_folder(folder))
            .collect::<Vec<_>>();

        sort_note_summaries(&mut notes);
        sort_note_summaries(&mut trashed_notes);
        sort_note_folder_records(&mut folders);

        Ok(NoteWorkspaceSnapshotRecord {
            notes,
            trashed_notes,
            folders,
        })
    }

    fn list_notes(
        &self,
        query: NoteListQuery,
        include_trashed: bool,
    ) -> ServerResult<NoteListResult> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let page_size = query
            .page_size
            .unwrap_or(DEFAULT_NOTES_PAGE_SIZE)
            .clamp(1, MAX_NOTES_PAGE_SIZE);
        let page = query.page.unwrap_or(1).max(1);
        let folder_id =
            self.resolve_folder_storage_id(&document.folders, query.folder_id, "folderId")?;
        let keyword = normalize_optional_text(query.keyword).map(|value| value.to_lowercase());

        let mut notes = document
            .notes
            .iter()
            .filter(|note| note.deleted_at.is_some() == include_trashed)
            .filter(|note| match folder_id.as_deref() {
                Some(folder_id) => note.parent_id.as_deref() == Some(folder_id),
                None => true,
            })
            .filter(|note| match query.note_type {
                Some(note_type) => note.note_type == note_type,
                None => true,
            })
            .filter(|note| match query.is_favorite {
                Some(is_favorite) => note.is_favorite == is_favorite,
                None => true,
            })
            .filter(|note| {
                if let Some(keyword) = keyword.as_deref() {
                    let title = note.title.to_lowercase();
                    let snippet = create_snippet(&note.content).to_lowercase();
                    title.contains(keyword) || snippet.contains(keyword)
                } else {
                    true
                }
            })
            .map(|note| self.map_summary(note))
            .collect::<Vec<_>>();

        sort_note_summaries(&mut notes);

        let total = notes.len();
        let start = (page - 1) * page_size;
        let items = if start >= total {
            Vec::new()
        } else {
            notes
                .into_iter()
                .skip(start)
                .take(page_size)
                .collect::<Vec<_>>()
        };

        Ok(NoteListResult {
            items,
            page,
            page_size,
            total,
        })
    }

    fn create_note(&self, input: NoteCreateRequest) -> ServerResult<NoteRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let title = require_note_title(&input.title, "title")?;
        let parent_id =
            self.resolve_folder_storage_id(&document.folders, input.parent_id, "parentId")?;
        let now = current_timestamp();
        let id = next_entity_id("note", &NOTE_COUNTER);

        let note = StoredNoteRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            title,
            note_type: input.note_type,
            parent_id,
            tags: normalize_tags(input.tags),
            is_favorite: input.is_favorite.unwrap_or(false),
            content: normalize_note_content(input.content),
            publish_status: PublishStatus::Draft,
            metadata: normalize_metadata(input.metadata),
            created_at: now.clone(),
            updated_at: now,
            deleted_at: None,
        };

        document.notes.push(note);
        sort_notes(&mut document.notes);
        self.persist_to_disk(&document)?;
        Ok(self.map_note(self.read_note_record(&document.notes, &id)?))
    }

    fn read_note(&self, note_key: &str) -> ServerResult<NoteRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.map_note(self.read_note_record(&document.notes, note_key)?))
    }

    fn update_note(&self, note_key: &str, input: NoteUpdateRequest) -> ServerResult<NoteRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        {
            let note = self.read_note_record_mut(&mut document.notes, note_key)?;
            if note.deleted_at.is_some() {
                return Err(ServerError::conflict("a conflict occurred"));
            }

            if let Some(title) = input.title {
                note.title = require_note_title(&title, "title")?;
            }
            if let Some(note_type) = input.note_type {
                note.note_type = note_type;
            }
            if let Some(tags) = input.tags {
                note.tags = normalize_tags(Some(tags));
            }
            if let Some(is_favorite) = input.is_favorite {
                note.is_favorite = is_favorite;
            }
            if let Some(content) = input.content {
                note.content = normalize_note_content(Some(content));
            }
            if let Some(metadata) = input.metadata {
                note.metadata = normalize_metadata(Some(metadata));
            }
            note.updated_at = now;
        }

        sort_notes(&mut document.notes);
        self.persist_to_disk(&document)?;
        Ok(self.map_note(self.read_note_record(&document.notes, note_key)?))
    }

    fn create_folder(&self, input: NoteFolderCreateRequest) -> ServerResult<NoteFolderRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let name = require_note_folder_name(&input.name, "name")?;
        let parent_id =
            self.resolve_folder_storage_id(&document.folders, input.parent_id, "parentId")?;
        self.ensure_folder_name_available(&document.folders, parent_id.as_deref(), &name, None)?;

        let now = current_timestamp();
        let id = next_entity_id("note-folder", &NOTE_FOLDER_COUNTER);
        document.folders.push(StoredNoteFolderRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            name,
            parent_id,
            created_at: now.clone(),
            updated_at: now,
        });

        sort_folders(&mut document.folders);
        self.persist_to_disk(&document)?;
        Ok(self.map_folder(self.read_folder(&document.folders, &id)?))
    }

    fn rename_folder(
        &self,
        folder_key: &str,
        input: NoteFolderRenameRequest,
    ) -> ServerResult<NoteFolderRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let name = require_note_folder_name(&input.name, "name")?;
        let now = current_timestamp();
        let (folder_id, parent_id) = {
            let folder = self.read_folder(&document.folders, folder_key)?;
            (folder.id.clone(), folder.parent_id.clone())
        };
        self.ensure_folder_name_available(
            &document.folders,
            parent_id.as_deref(),
            &name,
            Some(folder_id.as_str()),
        )?;

        {
            let folder = self.read_folder_mut(&mut document.folders, &folder_id)?;
            folder.name = name;
            folder.updated_at = now;
        }

        sort_folders(&mut document.folders);
        self.persist_to_disk(&document)?;
        Ok(self.map_folder(self.read_folder(&document.folders, &folder_id)?))
    }

    fn delete_folder(&self, folder_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let folder_id = self.read_folder(&document.folders, folder_key)?.id.clone();
        self.ensure_folder_empty(&document, &folder_id)?;
        document.folders.retain(|folder| folder.id != folder_id);
        self.persist_to_disk(&document)
    }

    fn trash_note(&self, note_key: &str) -> ServerResult<NoteRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        {
            let note = self.read_note_record_mut(&mut document.notes, note_key)?;
            note.deleted_at = Some(now.clone());
            note.updated_at = now;
        }

        sort_notes(&mut document.notes);
        self.persist_to_disk(&document)?;
        Ok(self.map_note(self.read_note_record(&document.notes, note_key)?))
    }

    fn restore_note(&self, note_key: &str) -> ServerResult<NoteRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        {
            let note = self.read_note_record_mut(&mut document.notes, note_key)?;
            note.deleted_at = None;
            note.updated_at = now;
        }

        sort_notes(&mut document.notes);
        self.persist_to_disk(&document)?;
        Ok(self.map_note(self.read_note_record(&document.notes, note_key)?))
    }

    fn delete_note(&self, note_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let note_id = self.read_note_record(&document.notes, note_key)?.id.clone();
        document.notes.retain(|note| note.id != note_id);
        self.persist_to_disk(&document)
    }

    fn clear_trash(&self) -> ServerResult<usize> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let removed = document
            .notes
            .iter()
            .filter(|note| note.deleted_at.is_some())
            .count();
        document.notes.retain(|note| note.deleted_at.is_none());
        self.persist_to_disk(&document)?;
        Ok(removed)
    }

    fn move_folder(&self, folder_key: &str, input: NoteFolderMoveRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let folder_id = self.read_folder(&document.folders, folder_key)?.id.clone();
        let target_parent_id = self.resolve_folder_storage_id(
            &document.folders,
            input.target_folder_id,
            "targetFolderId",
        )?;

        if target_parent_id.as_deref() == Some(folder_id.as_str()) {
            return Err(ServerError::conflict("a conflict occurred"));
        }

        if let Some(target_parent_id) = target_parent_id.as_deref() {
            if self.is_descendant_folder(&document.folders, target_parent_id, &folder_id)? {
                return Err(ServerError::conflict("a conflict occurred"));
            }
        }

        let name = self
            .read_folder(&document.folders, &folder_id)?
            .name
            .clone();
        self.ensure_folder_name_available(
            &document.folders,
            target_parent_id.as_deref(),
            &name,
            Some(folder_id.as_str()),
        )?;

        let folder = self.read_folder_mut(&mut document.folders, &folder_id)?;
        folder.parent_id = target_parent_id;
        folder.updated_at = current_timestamp();
        sort_folders(&mut document.folders);
        self.persist_to_disk(&document)
    }

    fn move_note(&self, note_key: &str, input: NoteMoveRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let target_folder_id = self.resolve_folder_storage_id(
            &document.folders,
            input.target_folder_id,
            "targetFolderId",
        )?;
        let note = self.read_note_record_mut(&mut document.notes, note_key)?;
        note.parent_id = target_folder_id;
        note.updated_at = current_timestamp();
        sort_notes(&mut document.notes);
        self.persist_to_disk(&document)
    }

    fn publish_note(
        &self,
        note_key: &str,
        input: NotePublishRequest,
    ) -> ServerResult<PublishResultRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let platform = require_non_empty_text(
            &input.platform,
            "APP_NOTE_PUBLISH_PLATFORM_EMPTY",
            "platform",
        )?;
        let post_id = next_entity_id("note-publish", &NOTE_PUBLISH_COUNTER);
        let now = current_timestamp();
        let title;

        {
            let note = self.read_note_record_mut(&mut document.notes, note_key)?;
            if note.deleted_at.is_some() {
                return Err(ServerError::conflict("a conflict occurred"));
            }
            note.publish_status = PublishStatus::Published;
            note.updated_at = now;
            title = note.title.clone();
        }

        self.persist_to_disk(&document)?;

        Ok(PublishResultRecord {
            success: true,
            platform_id: platform.clone(),
            message: Some(match normalize_optional_text(input.target_name) {
                Some(target_name) => format!("Published {title} to {target_name}"),
                None => format!("Published {title} to {platform}"),
            }),
            url: Some(match normalize_optional_text(input.original_url) {
                Some(original_url) => original_url,
                None => format!("published://{platform}/{post_id}"),
            }),
            post_id: Some(post_id),
        })
    }
}


fn normalize_tags(value: Option<Vec<String>>) -> Vec<String> {
    let mut seen = BTreeSet::new();
    let mut tags = Vec::new();
    for tag in value.unwrap_or_default() {
        let trimmed = tag.trim();
        if trimmed.is_empty() {
            continue;
        }
        if seen.insert(trimmed.to_string()) {
            tags.push(trimmed.to_string());
        }
    }
    tags
}

fn normalize_metadata(value: Option<NoteMetadataRecord>) -> Option<NoteMetadataRecord> {
    value.and_then(|metadata| {
        let normalized = NoteMetadataRecord {
            word_count: metadata.word_count,
            reading_time: metadata.reading_time,
            cover_image: normalize_optional_text(metadata.cover_image),
            icon: normalize_optional_text(metadata.icon),
            author: normalize_optional_text(metadata.author),
            tags: {
                let tags = normalize_tags(metadata.tags);
                if tags.is_empty() {
                    None
                } else {
                    Some(tags)
                }
            },
            custom_width: normalize_optional_text(metadata.custom_width),
        };

        if normalized.word_count.is_none()
            && normalized.reading_time.is_none()
            && normalized.cover_image.is_none()
            && normalized.icon.is_none()
            && normalized.author.is_none()
            && normalized.tags.is_none()
            && normalized.custom_width.is_none()
        {
            None
        } else {
            Some(normalized)
        }
    })
}

fn normalize_note_content(value: Option<String>) -> String {
    value.unwrap_or_default().trim().to_string()
}


fn require_note_title(value: &str, field_name: &str) -> ServerResult<String> {
    require_non_empty_text(value, "APP_NOTE_TITLE_EMPTY", field_name)
}

fn require_note_folder_name(value: &str, field_name: &str) -> ServerResult<String> {
    let name = require_non_empty_text(value, "APP_NOTE_FOLDER_NAME_EMPTY", field_name)?;
    if name
        .chars()
        .any(|character| character.is_control() || matches!(character, '/' | '\\'))
    {
        return Err(ServerError::bad_request(format!("{field_name} contains characters not allowed in note folder names"),
        ));
    }
    Ok(name)
}

fn sort_notes(notes: &mut [StoredNoteRecord]) {
    notes.sort_by(|left, right| {
        right
            .updated_at
            .cmp(&left.updated_at)
            .then_with(|| left.title.to_lowercase().cmp(&right.title.to_lowercase()))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn sort_note_summaries(notes: &mut [NoteSummaryRecord]) {
    notes.sort_by(|left, right| {
        right
            .updated_at
            .cmp(&left.updated_at)
            .then_with(|| left.title.to_lowercase().cmp(&right.title.to_lowercase()))
            .then_with(|| left.uuid.cmp(&right.uuid))
    });
}

fn sort_folders(folders: &mut [StoredNoteFolderRecord]) {
    folders.sort_by(|left, right| {
        left.name
            .to_lowercase()
            .cmp(&right.name.to_lowercase())
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn sort_note_folder_records(folders: &mut [NoteFolderRecord]) {
    folders.sort_by(|left, right| {
        left.name
            .to_lowercase()
            .cmp(&right.name.to_lowercase())
            .then_with(|| left.uuid.cmp(&right.uuid))
    });
}

fn create_snippet(content: &str) -> String {
    if content.trim().is_empty() {
        return String::new();
    }

    let mut plain = String::with_capacity(content.len());
    let mut inside_tag = false;
    for character in content.chars() {
        match character {
            '<' => inside_tag = true,
            '>' => {
                inside_tag = false;
                plain.push(' ');
            }
            _ if !inside_tag => plain.push(character),
            _ => {}
        }
    }

    let normalized = plain.split_whitespace().collect::<Vec<_>>().join(" ");
    if normalized.chars().count() <= 300 {
        normalized
    } else {
        normalized.chars().take(300).collect()
    }
}

fn next_entity_id(prefix: &str, counter: &AtomicU64) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = counter.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}


