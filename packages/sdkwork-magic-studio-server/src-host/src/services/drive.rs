use std::collections::BTreeSet;
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

const DRIVE_SCHEMA_VERSION: &str = "magic-studio.drive.v1";
const DEFAULT_DRIVE_TOTAL_BYTES: u64 = 100 * 1024 * 1024 * 1024;

static DRIVE_ITEM_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum DriveItemKind {
    Folder,
    File,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum DriveListScope {
    MyDrive,
    Starred,
    Recent,
    Trash,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum DriveItemStatus {
    Active,
    Trashed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum DriveContentEncoding {
    #[serde(rename = "utf-8")]
    Utf8,
    #[serde(rename = "base64")]
    Base64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveRootDescriptor {
    pub root_path: String,
    pub default_scope: DriveListScope,
    pub scopes: Vec<DriveListScope>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveItemRecord {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub name: String,
    pub kind: DriveItemKind,
    pub path: String,
    pub size: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extension: Option<String>,
    pub status: DriveItemStatus,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accessed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trashed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_favorite: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub has_children: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveStatsRecord {
    pub used_bytes: u64,
    pub total_bytes: u64,
    pub file_count: usize,
    pub folder_count: usize,
    pub trashed_count: usize,
    pub favorite_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveFileContentRecord {
    pub item_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    pub encoding: DriveContentEncoding,
    pub content: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DriveRegistryDocument {
    pub schema_version: String,
    pub items: Vec<DriveRegistryItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DriveRegistryItem {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub name: String,
    pub kind: DriveItemKind,
    pub size: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    pub status: DriveItemStatus,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accessed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trashed_at: Option<String>,
    #[serde(default)]
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveEntriesQuery {
    pub scope: Option<DriveListScope>,
    pub parent_id: Option<String>,
    pub parent_path: Option<String>,
    pub keyword: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveCreateFolderRequest {
    pub name: String,
    pub parent_id: Option<String>,
    pub parent_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveUploadFileRequest {
    pub name: String,
    pub content: String,
    pub encoding: Option<DriveContentEncoding>,
    pub parent_id: Option<String>,
    pub parent_path: Option<String>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveImportFileRequest {
    pub source_path: String,
    pub name: Option<String>,
    pub parent_id: Option<String>,
    pub parent_path: Option<String>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveUpdateFileContentRequest {
    pub content: String,
    pub encoding: Option<DriveContentEncoding>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveRenameRequest {
    pub item_id: String,
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveMoveRequest {
    pub item_ids: Vec<String>,
    pub target_parent_id: Option<String>,
    pub target_parent_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveDeleteRequest {
    pub item_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveRestoreRequest {
    pub item_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveFavoriteRequest {
    pub item_id: String,
    pub is_favorite: bool,
}

enum OptionalParentFilter {
    Any,
    Root,
    Item(String),
}

pub trait DriveService: Send + Sync {
    fn read_root(&self) -> ServerResult<DriveRootDescriptor>;
    fn list_entries(&self, query: DriveEntriesQuery) -> ServerResult<Vec<DriveItemRecord>>;
    fn read_stats(&self) -> ServerResult<DriveStatsRecord>;
    fn read_file_content(&self, item_key: &str) -> ServerResult<DriveFileContentRecord>;
    fn update_file_content(
        &self,
        item_key: &str,
        input: DriveUpdateFileContentRequest,
    ) -> ServerResult<DriveFileContentRecord>;
    fn create_folder(&self, input: DriveCreateFolderRequest) -> ServerResult<DriveItemRecord>;
    fn upload_file(&self, input: DriveUploadFileRequest) -> ServerResult<DriveItemRecord>;
    fn import_file(&self, input: DriveImportFileRequest) -> ServerResult<DriveItemRecord>;
    fn rename_item(&self, input: DriveRenameRequest) -> ServerResult<DriveItemRecord>;
    fn move_items(&self, input: DriveMoveRequest) -> ServerResult<()>;
    fn delete_items(&self, input: DriveDeleteRequest) -> ServerResult<()>;
    fn restore_items(&self, input: DriveRestoreRequest) -> ServerResult<()>;
    fn empty_trash(&self) -> ServerResult<()>;
    fn favorite_item(&self, input: DriveFavoriteRequest) -> ServerResult<DriveItemRecord>;
}

pub struct FileBackedDriveService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedDriveService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("APP_DRIVE_LOCK_FAILED", "drive registry lock was poisoned")
        })
    }

    fn default_document(&self) -> DriveRegistryDocument {
        DriveRegistryDocument {
            schema_version: DRIVE_SCHEMA_VERSION.to_string(),
            items: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<DriveRegistryDocument> {
        let path = self.storage_paths.drive_registry_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_DRIVE_READ_FAILED",
                    format!(
                        "failed to read drive registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<DriveRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_DRIVE_PARSE_FAILED",
                    format!("failed to parse drive registry {}: {error}", path.display()),
                )
            })?;

        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &DriveRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.drive_files_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_ROOT_CREATE_FAILED",
                format!(
                    "failed to create drive file root {}: {error}",
                    self.storage_paths.drive_files_root_dir().display()
                ),
            )
        })?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_SERIALIZE_FAILED",
                format!("failed to serialize drive registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.drive_registry_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_WRITE_FAILED",
                format!(
                    "failed to write drive registry to {}: {error}",
                    self.storage_paths.drive_registry_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut DriveRegistryDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = DRIVE_SCHEMA_VERSION.to_string();
        }

        for item in &mut document.items {
            item.name = item.name.trim().to_string();
            item.parent_id = normalize_optional_text(item.parent_id.clone());
            item.mime_type = normalize_optional_text(item.mime_type.clone());
            item.accessed_at = normalize_optional_text(item.accessed_at.clone());
            item.trashed_at = normalize_optional_text(item.trashed_at.clone());
            if item.kind == DriveItemKind::Folder {
                item.size = 0;
                item.mime_type = None;
            } else {
                if item.mime_type.is_none() {
                    item.mime_type = guess_mime_type(&item.name);
                }
                if let Ok(metadata) = fs::metadata(self.drive_file_path(&item.id)) {
                    item.size = metadata.len();
                }
            }
        }
    }

    fn drive_file_path(&self, item_id: &str) -> std::path::PathBuf {
        self.storage_paths
            .drive_files_root_dir()
            .join(sanitize_path_segment(item_id))
    }

    fn build_item_record(
        &self,
        items: &[DriveRegistryItem],
        item_id: &str,
    ) -> ServerResult<DriveItemRecord> {
        let item = self.read_item(items, item_id)?;
        let path = self.build_item_path(items, item_id)?;
        let has_children = if item.kind == DriveItemKind::Folder {
            Some(self.item_has_children_with_status(items, item_id, item.status))
        } else {
            None
        };

        Ok(DriveItemRecord {
            id: item.id.clone(),
            parent_id: item.parent_id.clone(),
            name: item.name.clone(),
            kind: item.kind,
            path,
            size: item.size,
            mime_type: item.mime_type.clone(),
            extension: extension_from_name(&item.name),
            status: item.status,
            created_at: item.created_at.clone(),
            updated_at: item.updated_at.clone(),
            accessed_at: item.accessed_at.clone(),
            trashed_at: item.trashed_at.clone(),
            is_favorite: Some(item.is_favorite),
            has_children,
        })
    }

    fn build_item_path(&self, items: &[DriveRegistryItem], item_id: &str) -> ServerResult<String> {
        self.build_item_path_inner(items, item_id, &mut BTreeSet::new())
    }

    fn build_item_path_inner(
        &self,
        items: &[DriveRegistryItem],
        item_id: &str,
        visited: &mut BTreeSet<String>,
    ) -> ServerResult<String> {
        if !visited.insert(item_id.to_string()) {
            return Err(ServerError::internal(
                "APP_DRIVE_PATH_CYCLE",
                format!("detected a drive parent cycle at item {item_id}"),
            ));
        }

        let item = self.read_item(items, item_id)?;
        let path = match item.parent_id.as_deref() {
            Some(parent_id) => {
                let parent_path = self.build_item_path_inner(items, parent_id, visited)?;
                join_virtual_path(&parent_path, &item.name)
            }
            None => join_virtual_path("/", &item.name),
        };

        visited.remove(item_id);
        Ok(path)
    }

    fn read_item<'a>(
        &self,
        items: &'a [DriveRegistryItem],
        item_key: &str,
    ) -> ServerResult<&'a DriveRegistryItem> {
        items
            .iter()
            .find(|item| item.id == item_key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_DRIVE_ITEM_NOT_FOUND",
                    format!("drive item {item_key} was not found"),
                )
            })
    }

    fn read_item_mut<'a>(
        &self,
        items: &'a mut [DriveRegistryItem],
        item_key: &str,
    ) -> ServerResult<&'a mut DriveRegistryItem> {
        items
            .iter_mut()
            .find(|item| item.id == item_key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_DRIVE_ITEM_NOT_FOUND",
                    format!("drive item {item_key} was not found"),
                )
            })
    }

    fn read_parent_folder<'a>(
        &self,
        items: &'a [DriveRegistryItem],
        parent_id: &str,
        status: DriveItemStatus,
        field_name: &str,
    ) -> ServerResult<&'a DriveRegistryItem> {
        let parent = self.read_item(items, parent_id)?;
        if parent.kind != DriveItemKind::Folder {
            return Err(ServerError::bad_request(
                "APP_DRIVE_PARENT_NOT_FOLDER",
                format!("{field_name} must reference a folder"),
            ));
        }
        if parent.status != status {
            return Err(ServerError::conflict(
                "APP_DRIVE_PARENT_STATUS_INVALID",
                format!(
                    "{field_name} must reference a {} folder",
                    status_label(status)
                ),
            ));
        }
        Ok(parent)
    }

    fn resolve_parent_from_id_and_path(
        &self,
        items: &[DriveRegistryItem],
        parent_id: Option<&str>,
        parent_path: Option<&str>,
        required_status: DriveItemStatus,
        field_name: &str,
    ) -> ServerResult<Option<String>> {
        let by_id = match parent_id {
            Some(parent_id) => Some(
                self.read_parent_folder(
                    items,
                    &require_non_empty_text(parent_id, "APP_DRIVE_PARENT_ID_EMPTY", field_name)?,
                    required_status,
                    field_name,
                )?
                .id
                .clone(),
            ),
            None => None,
        };

        let by_path = match parent_path {
            Some(parent_path) => {
                let normalized = normalize_virtual_path(
                    parent_path,
                    "APP_DRIVE_PARENT_PATH_INVALID",
                    field_name,
                )?;
                if normalized == "/" {
                    Some(None)
                } else {
                    let item_id = self
                        .find_item_id_by_path(items, &normalized, Some(required_status))?
                        .ok_or_else(|| {
                            ServerError::not_found(
                                "APP_DRIVE_PARENT_PATH_NOT_FOUND",
                                format!("{field_name} path {normalized} was not found"),
                            )
                        })?;
                    self.read_parent_folder(items, &item_id, required_status, field_name)?;
                    Some(Some(item_id))
                }
            }
            None => None,
        };

        if let (Some(by_id), Some(by_path)) = (by_id.clone(), by_path.clone()) {
            if Some(by_id.clone()) != by_path {
                return Err(ServerError::bad_request(
                    "APP_DRIVE_PARENT_REFERENCE_MISMATCH",
                    format!("{field_name} and parentPath reference different folders"),
                ));
            }
        }

        if let Some(by_id) = by_id {
            return Ok(Some(by_id));
        }
        if let Some(by_path) = by_path {
            return Ok(by_path);
        }
        Ok(None)
    }

    fn resolve_hierarchical_parent_filter(
        &self,
        items: &[DriveRegistryItem],
        parent_id: Option<&str>,
        parent_path: Option<&str>,
        required_status: DriveItemStatus,
    ) -> ServerResult<Option<String>> {
        self.resolve_parent_from_id_and_path(
            items,
            parent_id,
            parent_path,
            required_status,
            "parentId",
        )
    }

    fn resolve_optional_parent_filter(
        &self,
        items: &[DriveRegistryItem],
        parent_id: Option<&str>,
        parent_path: Option<&str>,
        required_status: DriveItemStatus,
    ) -> ServerResult<OptionalParentFilter> {
        if parent_id.is_none() && parent_path.is_none() {
            return Ok(OptionalParentFilter::Any);
        }

        match self.resolve_parent_from_id_and_path(
            items,
            parent_id,
            parent_path,
            required_status,
            "parentId",
        )? {
            Some(item_id) => Ok(OptionalParentFilter::Item(item_id)),
            None => Ok(OptionalParentFilter::Root),
        }
    }

    fn find_item_id_by_path(
        &self,
        items: &[DriveRegistryItem],
        path: &str,
        status: Option<DriveItemStatus>,
    ) -> ServerResult<Option<String>> {
        for item in items {
            if let Some(status) = status {
                if item.status != status {
                    continue;
                }
            }
            if self.build_item_path(items, &item.id)? == path {
                return Ok(Some(item.id.clone()));
            }
        }
        Ok(None)
    }

    fn item_has_children_with_status(
        &self,
        items: &[DriveRegistryItem],
        item_id: &str,
        status: DriveItemStatus,
    ) -> bool {
        items.iter().any(|candidate| {
            candidate.parent_id.as_deref() == Some(item_id) && candidate.status == status
        })
    }

    fn ensure_name_available(
        &self,
        items: &[DriveRegistryItem],
        parent_id: Option<&str>,
        name: &str,
        ignored_item_id: Option<&str>,
        status: DriveItemStatus,
    ) -> ServerResult<()> {
        for candidate in items {
            if candidate.status != status {
                continue;
            }
            if ignored_item_id == Some(candidate.id.as_str()) {
                continue;
            }
            if candidate.parent_id.as_deref() != parent_id {
                continue;
            }
            if candidate.name.eq_ignore_ascii_case(name) {
                return Err(ServerError::conflict(
                    "APP_DRIVE_NAME_CONFLICT",
                    format!("an item named {name} already exists in the target folder"),
                ));
            }
        }
        Ok(())
    }

    fn decode_request_content(
        &self,
        content: &str,
        encoding: Option<DriveContentEncoding>,
        field_name: &str,
    ) -> ServerResult<Vec<u8>> {
        match encoding.unwrap_or(DriveContentEncoding::Utf8) {
            DriveContentEncoding::Utf8 => Ok(content.as_bytes().to_vec()),
            DriveContentEncoding::Base64 => BASE64_STANDARD.decode(content).map_err(|error| {
                ServerError::bad_request(
                    "APP_DRIVE_CONTENT_BASE64_INVALID",
                    format!("{field_name} must be valid base64: {error}"),
                )
            }),
        }
    }

    fn encode_content_response(
        &self,
        bytes: &[u8],
        preferred_encoding: Option<DriveContentEncoding>,
    ) -> (DriveContentEncoding, String) {
        match preferred_encoding {
            Some(DriveContentEncoding::Base64) => {
                (DriveContentEncoding::Base64, BASE64_STANDARD.encode(bytes))
            }
            Some(DriveContentEncoding::Utf8) => (
                DriveContentEncoding::Utf8,
                String::from_utf8_lossy(bytes).to_string(),
            ),
            None => match std::str::from_utf8(bytes) {
                Ok(text) => (DriveContentEncoding::Utf8, text.to_string()),
                Err(_) => (DriveContentEncoding::Base64, BASE64_STANDARD.encode(bytes)),
            },
        }
    }

    fn read_file_bytes(&self, item_id: &str) -> ServerResult<Vec<u8>> {
        fs::read(self.drive_file_path(item_id)).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_FILE_READ_FAILED",
                format!("failed to read drive file bytes for {item_id}: {error}"),
            )
        })
    }

    fn write_file_bytes(&self, item_id: &str, bytes: &[u8]) -> ServerResult<()> {
        fs::create_dir_all(self.storage_paths.drive_files_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_ROOT_CREATE_FAILED",
                format!(
                    "failed to create drive file root {}: {error}",
                    self.storage_paths.drive_files_root_dir().display()
                ),
            )
        })?;

        fs::write(self.drive_file_path(item_id), bytes).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_FILE_WRITE_FAILED",
                format!("failed to write drive file bytes for {item_id}: {error}"),
            )
        })
    }

    fn remove_file_if_exists(&self, item_id: &str) {
        match fs::remove_file(self.drive_file_path(item_id)) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(_) => {}
        }
    }

    fn normalize_item_selection(
        &self,
        items: &[DriveRegistryItem],
        item_ids: &[String],
    ) -> ServerResult<Vec<String>> {
        if item_ids.is_empty() {
            return Err(ServerError::bad_request(
                "APP_DRIVE_ITEM_IDS_EMPTY",
                "itemIds must not be empty",
            ));
        }

        let mut unique = BTreeSet::new();
        let mut selection = Vec::new();
        for item_id in item_ids {
            let item_id = require_non_empty_text(item_id, "APP_DRIVE_ITEM_ID_EMPTY", "itemIds[]")?;
            self.read_item(items, &item_id)?;
            if unique.insert(item_id.clone()) {
                selection.push(item_id);
            }
        }

        Ok(selection)
    }

    fn root_selection(
        &self,
        items: &[DriveRegistryItem],
        item_ids: &[String],
    ) -> ServerResult<Vec<String>> {
        let selection = self.normalize_item_selection(items, item_ids)?;
        let selected = selection.iter().cloned().collect::<BTreeSet<_>>();

        Ok(selection
            .into_iter()
            .filter(|item_id| !self.has_selected_ancestor(items, item_id, &selected))
            .collect())
    }

    fn has_selected_ancestor(
        &self,
        items: &[DriveRegistryItem],
        item_id: &str,
        selected: &BTreeSet<String>,
    ) -> bool {
        let mut current_parent = self
            .read_item(items, item_id)
            .ok()
            .and_then(|item| item.parent_id.clone());

        while let Some(parent_id) = current_parent {
            if selected.contains(&parent_id) {
                return true;
            }
            current_parent = self
                .read_item(items, &parent_id)
                .ok()
                .and_then(|item| item.parent_id.clone());
        }

        false
    }

    fn descendant_ids(
        &self,
        items: &[DriveRegistryItem],
        root_ids: &[String],
    ) -> ServerResult<Vec<String>> {
        let mut descendants = Vec::new();
        for item in items {
            if root_ids.iter().any(|root_id| {
                item.id == *root_id
                    || self
                        .is_descendant_of(items, &item.id, root_id)
                        .unwrap_or(false)
            }) {
                descendants.push(item.id.clone());
            }
        }
        Ok(descendants)
    }

    fn is_descendant_of(
        &self,
        items: &[DriveRegistryItem],
        item_id: &str,
        ancestor_id: &str,
    ) -> ServerResult<bool> {
        let mut current_parent = self.read_item(items, item_id)?.parent_id.clone();
        while let Some(parent_id) = current_parent {
            if parent_id == ancestor_id {
                return Ok(true);
            }
            current_parent = self.read_item(items, &parent_id)?.parent_id.clone();
        }
        Ok(false)
    }

    fn is_trash_root_visible(&self, items: &[DriveRegistryItem], item: &DriveRegistryItem) -> bool {
        if item.status != DriveItemStatus::Trashed {
            return false;
        }

        match item.parent_id.as_deref() {
            None => true,
            Some(parent_id) => self
                .read_item(items, parent_id)
                .map(|parent| parent.status != DriveItemStatus::Trashed)
                .unwrap_or(true),
        }
    }
}

impl DriveService for FileBackedDriveService {
    fn read_root(&self) -> ServerResult<DriveRootDescriptor> {
        Ok(DriveRootDescriptor {
            root_path: "/".to_string(),
            default_scope: DriveListScope::MyDrive,
            scopes: vec![
                DriveListScope::MyDrive,
                DriveListScope::Starred,
                DriveListScope::Recent,
                DriveListScope::Trash,
            ],
        })
    }

    fn list_entries(&self, query: DriveEntriesQuery) -> ServerResult<Vec<DriveItemRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let scope = query.scope.unwrap_or(DriveListScope::MyDrive);
        let keyword = normalize_optional_text(query.keyword);

        let mut records = match scope {
            DriveListScope::MyDrive => {
                let parent_id = self.resolve_hierarchical_parent_filter(
                    &document.items,
                    query.parent_id.as_deref(),
                    query.parent_path.as_deref(),
                    DriveItemStatus::Active,
                )?;

                document
                    .items
                    .iter()
                    .filter(|item| item.status == DriveItemStatus::Active)
                    .filter(|item| item.parent_id == parent_id)
                    .map(|item| self.build_item_record(&document.items, &item.id))
                    .collect::<ServerResult<Vec<_>>>()?
            }
            DriveListScope::Trash => {
                let parent_id = self.resolve_hierarchical_parent_filter(
                    &document.items,
                    query.parent_id.as_deref(),
                    query.parent_path.as_deref(),
                    DriveItemStatus::Trashed,
                )?;

                document
                    .items
                    .iter()
                    .filter(|item| item.status == DriveItemStatus::Trashed)
                    .filter(|item| match parent_id.as_deref() {
                        Some(parent_id) => item.parent_id.as_deref() == Some(parent_id),
                        None => self.is_trash_root_visible(&document.items, item),
                    })
                    .map(|item| self.build_item_record(&document.items, &item.id))
                    .collect::<ServerResult<Vec<_>>>()?
            }
            DriveListScope::Starred => {
                let parent_filter = self.resolve_optional_parent_filter(
                    &document.items,
                    query.parent_id.as_deref(),
                    query.parent_path.as_deref(),
                    DriveItemStatus::Active,
                )?;

                document
                    .items
                    .iter()
                    .filter(|item| item.status == DriveItemStatus::Active && item.is_favorite)
                    .filter(|item| match &parent_filter {
                        OptionalParentFilter::Any => true,
                        OptionalParentFilter::Root => item.parent_id.is_none(),
                        OptionalParentFilter::Item(parent_id) => {
                            item.parent_id.as_deref() == Some(parent_id.as_str())
                        }
                    })
                    .map(|item| self.build_item_record(&document.items, &item.id))
                    .collect::<ServerResult<Vec<_>>>()?
            }
            DriveListScope::Recent => {
                let parent_filter = self.resolve_optional_parent_filter(
                    &document.items,
                    query.parent_id.as_deref(),
                    query.parent_path.as_deref(),
                    DriveItemStatus::Active,
                )?;

                document
                    .items
                    .iter()
                    .filter(|item| item.status == DriveItemStatus::Active)
                    .filter(|item| match &parent_filter {
                        OptionalParentFilter::Any => true,
                        OptionalParentFilter::Root => item.parent_id.is_none(),
                        OptionalParentFilter::Item(parent_id) => {
                            item.parent_id.as_deref() == Some(parent_id.as_str())
                        }
                    })
                    .map(|item| self.build_item_record(&document.items, &item.id))
                    .collect::<ServerResult<Vec<_>>>()?
            }
        };

        if let Some(keyword) = keyword {
            let lowered = keyword.to_lowercase();
            records.retain(|item| {
                item.name.to_lowercase().contains(&lowered)
                    || item.path.to_lowercase().contains(&lowered)
            });
        }

        match scope {
            DriveListScope::Recent => records.sort_by(|left, right| {
                let right_touch = right
                    .accessed_at
                    .clone()
                    .unwrap_or_else(|| right.updated_at.clone());
                let left_touch = left
                    .accessed_at
                    .clone()
                    .unwrap_or_else(|| left.updated_at.clone());
                right_touch
                    .cmp(&left_touch)
                    .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
            }),
            _ => records.sort_by(|left, right| {
                rank_drive_kind(left.kind)
                    .cmp(&rank_drive_kind(right.kind))
                    .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
                    .then_with(|| left.id.cmp(&right.id))
            }),
        }

        Ok(records)
    }

    fn read_stats(&self) -> ServerResult<DriveStatsRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;

        let used_bytes = document
            .items
            .iter()
            .filter(|item| {
                item.kind == DriveItemKind::File && item.status == DriveItemStatus::Active
            })
            .map(|item| item.size)
            .sum::<u64>();

        Ok(DriveStatsRecord {
            used_bytes,
            total_bytes: DEFAULT_DRIVE_TOTAL_BYTES.max(used_bytes),
            file_count: document
                .items
                .iter()
                .filter(|item| {
                    item.kind == DriveItemKind::File && item.status == DriveItemStatus::Active
                })
                .count(),
            folder_count: document
                .items
                .iter()
                .filter(|item| {
                    item.kind == DriveItemKind::Folder && item.status == DriveItemStatus::Active
                })
                .count(),
            trashed_count: document
                .items
                .iter()
                .filter(|item| item.status == DriveItemStatus::Trashed)
                .count(),
            favorite_count: document
                .items
                .iter()
                .filter(|item| item.status == DriveItemStatus::Active && item.is_favorite)
                .count(),
        })
    }

    fn read_file_content(&self, item_key: &str) -> ServerResult<DriveFileContentRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();
        let item_id;
        let mime_type;
        let updated_at;

        {
            let item = self.read_item_mut(&mut document.items, item_key)?;
            if item.kind != DriveItemKind::File {
                return Err(ServerError::bad_request(
                    "APP_DRIVE_ITEM_NOT_FILE",
                    "itemId must reference a file",
                ));
            }
            if item.status != DriveItemStatus::Active {
                return Err(ServerError::conflict(
                    "APP_DRIVE_FILE_NOT_ACTIVE",
                    "drive file content can only be read from active files",
                ));
            }

            item.accessed_at = Some(now.clone());
            item_id = item.id.clone();
            mime_type = item.mime_type.clone();
            updated_at = item.updated_at.clone();
        }

        self.persist_to_disk(&document)?;
        let bytes = self.read_file_bytes(&item_id)?;
        let (encoding, content) = self.encode_content_response(&bytes, None);

        Ok(DriveFileContentRecord {
            item_id,
            mime_type,
            encoding,
            content,
            updated_at,
        })
    }

    fn update_file_content(
        &self,
        item_key: &str,
        input: DriveUpdateFileContentRequest,
    ) -> ServerResult<DriveFileContentRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let bytes = self.decode_request_content(&input.content, input.encoding, "content")?;
        let now = current_timestamp();
        let item_id;
        let mime_type;

        {
            let item = self.read_item_mut(&mut document.items, item_key)?;
            if item.kind != DriveItemKind::File {
                return Err(ServerError::bad_request(
                    "APP_DRIVE_ITEM_NOT_FILE",
                    "itemId must reference a file",
                ));
            }
            if item.status != DriveItemStatus::Active {
                return Err(ServerError::conflict(
                    "APP_DRIVE_FILE_NOT_ACTIVE",
                    "drive file content can only be updated for active files",
                ));
            }

            item.size = bytes.len() as u64;
            item.updated_at = now.clone();
            item.accessed_at = Some(now.clone());
            item_id = item.id.clone();
            mime_type = item.mime_type.clone();
        }

        self.write_file_bytes(&item_id, &bytes)?;
        self.persist_to_disk(&document)?;
        let (encoding, content) = self.encode_content_response(&bytes, input.encoding);

        Ok(DriveFileContentRecord {
            item_id,
            mime_type,
            encoding,
            content,
            updated_at: now,
        })
    }

    fn create_folder(&self, input: DriveCreateFolderRequest) -> ServerResult<DriveItemRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let name = require_drive_name(&input.name, "name")?;
        let parent_id = self.resolve_parent_from_id_and_path(
            &document.items,
            input.parent_id.as_deref(),
            input.parent_path.as_deref(),
            DriveItemStatus::Active,
            "parentId",
        )?;

        self.ensure_name_available(
            &document.items,
            parent_id.as_deref(),
            &name,
            None,
            DriveItemStatus::Active,
        )?;

        let now = current_timestamp();
        let item_id = next_entity_id("drive-folder");
        document.items.push(DriveRegistryItem {
            id: item_id.clone(),
            parent_id,
            name,
            kind: DriveItemKind::Folder,
            size: 0,
            mime_type: None,
            status: DriveItemStatus::Active,
            created_at: now.clone(),
            updated_at: now,
            accessed_at: None,
            trashed_at: None,
            is_favorite: false,
        });

        self.persist_to_disk(&document)?;
        self.build_item_record(&document.items, &item_id)
    }

    fn upload_file(&self, input: DriveUploadFileRequest) -> ServerResult<DriveItemRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let name = require_drive_name(&input.name, "name")?;
        let parent_id = self.resolve_parent_from_id_and_path(
            &document.items,
            input.parent_id.as_deref(),
            input.parent_path.as_deref(),
            DriveItemStatus::Active,
            "parentId",
        )?;
        self.ensure_name_available(
            &document.items,
            parent_id.as_deref(),
            &name,
            None,
            DriveItemStatus::Active,
        )?;

        let bytes = self.decode_request_content(&input.content, input.encoding, "content")?;
        let now = current_timestamp();
        let item_id = next_entity_id("drive-file");
        let mime_type = normalize_optional_text(input.mime_type).or_else(|| guess_mime_type(&name));

        self.write_file_bytes(&item_id, &bytes)?;
        document.items.push(DriveRegistryItem {
            id: item_id.clone(),
            parent_id,
            name,
            kind: DriveItemKind::File,
            size: bytes.len() as u64,
            mime_type,
            status: DriveItemStatus::Active,
            created_at: now.clone(),
            updated_at: now.clone(),
            accessed_at: Some(now),
            trashed_at: None,
            is_favorite: false,
        });

        self.persist_to_disk(&document)?;
        self.build_item_record(&document.items, &item_id)
    }

    fn import_file(&self, input: DriveImportFileRequest) -> ServerResult<DriveItemRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let source_path = require_non_empty_text(
            &input.source_path,
            "APP_DRIVE_SOURCE_PATH_EMPTY",
            "sourcePath",
        )?;
        let source_path_ref = Path::new(&source_path);
        let metadata = fs::metadata(source_path_ref).map_err(|error| {
            ServerError::bad_request(
                "APP_DRIVE_SOURCE_PATH_INVALID",
                format!("sourcePath {source_path} could not be read: {error}"),
            )
        })?;

        if !metadata.is_file() {
            return Err(ServerError::bad_request(
                "APP_DRIVE_SOURCE_PATH_NOT_FILE",
                "sourcePath must reference a file",
            ));
        }

        let source_name = source_path_ref
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("imported-file");
        let name = match input.name {
            Some(name) => require_drive_name(&name, "name")?,
            None => require_drive_name(source_name, "sourcePath")?,
        };
        let parent_id = self.resolve_parent_from_id_and_path(
            &document.items,
            input.parent_id.as_deref(),
            input.parent_path.as_deref(),
            DriveItemStatus::Active,
            "parentId",
        )?;
        self.ensure_name_available(
            &document.items,
            parent_id.as_deref(),
            &name,
            None,
            DriveItemStatus::Active,
        )?;

        let now = current_timestamp();
        let item_id = next_entity_id("drive-file");
        fs::create_dir_all(self.storage_paths.drive_files_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_ROOT_CREATE_FAILED",
                format!(
                    "failed to create drive file root {}: {error}",
                    self.storage_paths.drive_files_root_dir().display()
                ),
            )
        })?;
        fs::copy(source_path_ref, self.drive_file_path(&item_id)).map_err(|error| {
            ServerError::internal(
                "APP_DRIVE_IMPORT_COPY_FAILED",
                format!("failed to import drive file from {source_path}: {error}"),
            )
        })?;

        document.items.push(DriveRegistryItem {
            id: item_id.clone(),
            parent_id,
            name: name.clone(),
            kind: DriveItemKind::File,
            size: metadata.len(),
            mime_type: normalize_optional_text(input.mime_type).or_else(|| guess_mime_type(&name)),
            status: DriveItemStatus::Active,
            created_at: now.clone(),
            updated_at: now.clone(),
            accessed_at: Some(now),
            trashed_at: None,
            is_favorite: false,
        });

        self.persist_to_disk(&document)?;
        self.build_item_record(&document.items, &item_id)
    }

    fn rename_item(&self, input: DriveRenameRequest) -> ServerResult<DriveItemRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let item_key = require_non_empty_text(&input.item_id, "APP_DRIVE_ITEM_ID_EMPTY", "itemId")?;
        let name = require_drive_name(&input.name, "name")?;
        let now = current_timestamp();
        let parent_id;

        {
            let item = self.read_item_mut(&mut document.items, &item_key)?;
            if item.status != DriveItemStatus::Active {
                return Err(ServerError::conflict(
                    "APP_DRIVE_ITEM_NOT_ACTIVE",
                    "only active drive items can be renamed",
                ));
            }
            parent_id = item.parent_id.clone();
        }

        self.ensure_name_available(
            &document.items,
            parent_id.as_deref(),
            &name,
            Some(&item_key),
            DriveItemStatus::Active,
        )?;

        {
            let item = self.read_item_mut(&mut document.items, &item_key)?;
            item.name = name;
            item.updated_at = now;
        }

        self.persist_to_disk(&document)?;
        self.build_item_record(&document.items, &item_key)
    }

    fn move_items(&self, input: DriveMoveRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let root_ids = self.root_selection(&document.items, &input.item_ids)?;
        let target_parent_id = self.resolve_parent_from_id_and_path(
            &document.items,
            input.target_parent_id.as_deref(),
            input.target_parent_path.as_deref(),
            DriveItemStatus::Active,
            "targetParentId",
        )?;
        let now = current_timestamp();
        let mut planned_names = BTreeSet::new();

        for item_id in &root_ids {
            let item = self.read_item(&document.items, item_id)?;
            if item.status != DriveItemStatus::Active {
                return Err(ServerError::conflict(
                    "APP_DRIVE_MOVE_ITEM_NOT_ACTIVE",
                    "only active drive items can be moved",
                ));
            }

            if target_parent_id.as_deref() == Some(item.id.as_str())
                || target_parent_id
                    .as_deref()
                    .map(|target_parent_id| {
                        self.is_descendant_of(&document.items, target_parent_id, &item.id)
                            .unwrap_or(false)
                    })
                    .unwrap_or(false)
            {
                return Err(ServerError::conflict(
                    "APP_DRIVE_MOVE_CYCLE",
                    "drive items cannot be moved into themselves or their descendants",
                ));
            }

            let normalized_name = item.name.to_lowercase();
            if !planned_names.insert(normalized_name.clone()) {
                return Err(ServerError::conflict(
                    "APP_DRIVE_MOVE_DUPLICATE_NAME",
                    "the move request contains duplicate item names for the target folder",
                ));
            }

            self.ensure_name_available(
                &document.items,
                target_parent_id.as_deref(),
                &item.name,
                Some(&item.id),
                DriveItemStatus::Active,
            )?;
        }

        for item_id in root_ids {
            let item = self.read_item_mut(&mut document.items, &item_id)?;
            item.parent_id = target_parent_id.clone();
            item.updated_at = now.clone();
        }

        self.persist_to_disk(&document)
    }

    fn delete_items(&self, input: DriveDeleteRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let root_ids = self.root_selection(&document.items, &input.item_ids)?;
        let affected_ids = self.descendant_ids(&document.items, &root_ids)?;
        let now = current_timestamp();

        for item_id in affected_ids {
            let item = self.read_item_mut(&mut document.items, &item_id)?;
            item.status = DriveItemStatus::Trashed;
            item.trashed_at = Some(now.clone());
            item.updated_at = now.clone();
        }

        self.persist_to_disk(&document)
    }

    fn restore_items(&self, input: DriveRestoreRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let root_ids = self.root_selection(&document.items, &input.item_ids)?;
        let now = current_timestamp();

        for item_id in &root_ids {
            let item = self.read_item(&document.items, item_id)?;
            if item.status != DriveItemStatus::Trashed {
                continue;
            }

            if let Some(parent_id) = item.parent_id.as_deref() {
                let parent = self.read_item(&document.items, parent_id)?;
                if parent.status == DriveItemStatus::Trashed {
                    return Err(ServerError::conflict(
                        "APP_DRIVE_RESTORE_PARENT_TRASHED",
                        "a trashed child item cannot be restored while its parent folder remains in trash",
                    ));
                }
            }

            self.ensure_name_available(
                &document.items,
                item.parent_id.as_deref(),
                &item.name,
                Some(&item.id),
                DriveItemStatus::Active,
            )?;
        }

        let affected_ids = self.descendant_ids(&document.items, &root_ids)?;
        for item_id in affected_ids {
            let item = self.read_item_mut(&mut document.items, &item_id)?;
            item.status = DriveItemStatus::Active;
            item.trashed_at = None;
            item.updated_at = now.clone();
        }

        self.persist_to_disk(&document)
    }

    fn empty_trash(&self) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let trashed_file_ids = document
            .items
            .iter()
            .filter(|item| {
                item.status == DriveItemStatus::Trashed && item.kind == DriveItemKind::File
            })
            .map(|item| item.id.clone())
            .collect::<Vec<_>>();

        document
            .items
            .retain(|item| item.status != DriveItemStatus::Trashed);

        for item_id in trashed_file_ids {
            self.remove_file_if_exists(&item_id);
        }

        self.persist_to_disk(&document)
    }

    fn favorite_item(&self, input: DriveFavoriteRequest) -> ServerResult<DriveItemRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let item_key = require_non_empty_text(&input.item_id, "APP_DRIVE_ITEM_ID_EMPTY", "itemId")?;
        let now = current_timestamp();

        {
            let item = self.read_item_mut(&mut document.items, &item_key)?;
            if item.status != DriveItemStatus::Active {
                return Err(ServerError::conflict(
                    "APP_DRIVE_ITEM_NOT_ACTIVE",
                    "only active drive items can be favorited",
                ));
            }
            item.is_favorite = input.is_favorite;
            item.updated_at = now;
        }

        self.persist_to_disk(&document)?;
        self.build_item_record(&document.items, &item_key)
    }
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn require_non_empty_text(value: &str, code: &str, field_name: &str) -> ServerResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }
    Ok(trimmed.to_string())
}

fn require_drive_name(value: &str, field_name: &str) -> ServerResult<String> {
    let name = require_non_empty_text(value, "APP_DRIVE_NAME_EMPTY", field_name)?;
    if name == "." || name == ".." {
        return Err(ServerError::bad_request(
            "APP_DRIVE_NAME_INVALID",
            format!("{field_name} contains an invalid drive segment"),
        ));
    }
    if name.chars().any(is_invalid_drive_name_char) {
        return Err(ServerError::bad_request(
            "APP_DRIVE_NAME_INVALID",
            format!("{field_name} contains characters not allowed in drive names"),
        ));
    }
    Ok(name)
}

fn is_invalid_drive_name_char(value: char) -> bool {
    value.is_control() || matches!(value, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*')
}

fn normalize_virtual_path(value: &str, code: &str, field_name: &str) -> ServerResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }

    let normalized = trimmed.replace('\\', "/");
    let segments = normalized
        .split('/')
        .filter(|segment| !segment.is_empty())
        .map(|segment| require_drive_name(segment, field_name))
        .collect::<ServerResult<Vec<_>>>()?;

    if segments.is_empty() {
        return Ok("/".to_string());
    }

    Ok(format!("/{}", segments.join("/")))
}

fn join_virtual_path(base: &str, segment: &str) -> String {
    if base == "/" {
        format!("/{segment}")
    } else {
        format!("{}/{}", base.trim_end_matches('/'), segment)
    }
}

fn rank_drive_kind(kind: DriveItemKind) -> u8 {
    match kind {
        DriveItemKind::Folder => 0,
        DriveItemKind::File => 1,
    }
}

fn extension_from_name(name: &str) -> Option<String> {
    Path::new(name)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_string())
}

fn guess_mime_type(name: &str) -> Option<String> {
    let extension = extension_from_name(name)?.to_ascii_lowercase();
    let mime_type = match extension.as_str() {
        "txt" => "text/plain",
        "md" => "text/markdown",
        "json" => "application/json",
        "js" => "text/javascript",
        "ts" => "text/typescript",
        "tsx" => "text/typescript",
        "jsx" => "text/javascript",
        "html" => "text/html",
        "css" => "text/css",
        "csv" => "text/csv",
        "xml" => "application/xml",
        "yaml" | "yml" => "text/yaml",
        "pdf" => "application/pdf",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "mp4" => "video/mp4",
        "mov" => "video/quicktime",
        "webm" => "video/webm",
        "avi" => "video/x-msvideo",
        "mkv" => "video/x-matroska",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "flac" => "audio/flac",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    };

    Some(mime_type.to_string())
}

fn sanitize_path_segment(value: &str) -> String {
    value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '_'
            }
        })
        .collect()
}

fn next_entity_id(prefix: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = DRIVE_ITEM_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn status_label(status: DriveItemStatus) -> &'static str {
    match status {
        DriveItemStatus::Active => "active",
        DriveItemStatus::Trashed => "trashed",
    }
}
