use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::workspaces::WorkspaceService;

const ASSET_CATALOG_SCHEMA_VERSION: &str = "magic-studio.assets.v1";
const DEFAULT_ASSET_PAGE_SIZE: usize = 50;
const MAX_ASSET_PAGE_SIZE: usize = 200;

static ASSET_COUNTER: AtomicU64 = AtomicU64::new(1);
static ASSET_RESOURCE_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "kebab-case")]
pub enum AssetBusinessDomain {
    AssetCenter,
    Notes,
    Canvas,
    ImageStudio,
    VideoStudio,
    AudioStudio,
    Music,
    VoiceSpeaker,
    Magiccut,
    Film,
    PortalVideo,
    Character,
    Sfx,
}

impl AssetBusinessDomain {
    fn as_str(&self) -> &'static str {
        match self {
            Self::AssetCenter => "asset-center",
            Self::Notes => "notes",
            Self::Canvas => "canvas",
            Self::ImageStudio => "image-studio",
            Self::VideoStudio => "video-studio",
            Self::AudioStudio => "audio-studio",
            Self::Music => "music",
            Self::VoiceSpeaker => "voice-speaker",
            Self::Magiccut => "magiccut",
            Self::Film => "film",
            Self::PortalVideo => "portal-video",
            Self::Character => "character",
            Self::Sfx => "sfx",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum AssetLifecycleStatus {
    Draft,
    Imported,
    Generated,
    Processing,
    Ready,
    Archived,
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum AssetContentKey {
    Video,
    Image,
    Audio,
    Music,
    Voice,
    Text,
    Character,
    Model3d,
    Lottie,
    File,
    Effect,
    Transition,
    Subtitle,
    Sfx,
}

impl AssetContentKey {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Video => "video",
            Self::Image => "image",
            Self::Audio => "audio",
            Self::Music => "music",
            Self::Voice => "voice",
            Self::Text => "text",
            Self::Character => "character",
            Self::Model3d => "model3d",
            Self::Lottie => "lottie",
            Self::File => "file",
            Self::Effect => "effect",
            Self::Transition => "transition",
            Self::Subtitle => "subtitle",
            Self::Sfx => "sfx",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetScope {
    pub workspace_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub collection_id: Option<String>,
    pub domain: AssetBusinessDomain,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AssetStorageMode {
    BrowserVfs,
    DesktopFs,
    RemoteUrl,
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetLocatorProtocol {
    Assets,
    File,
    Http,
    Https,
    Desktop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetLocator {
    pub protocol: AssetLocatorProtocol,
    pub uri: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetStorageDescriptor {
    pub mode: AssetStorageMode,
    pub primary: AssetLocator,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub replicas: Option<Vec<AssetLocator>>,
    pub cacheable: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub encrypted: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetVersionInfo {
    pub version: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_asset_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub derived_from_resource_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetDomainReferenceRecord {
    pub domain: AssetBusinessDomain,
    pub entity_type: String,
    pub entity_id: String,
    pub relation: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slot: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub order: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedDigitalAssetRecord {
    pub id: String,
    pub uuid: String,
    pub asset_id: String,
    pub key: String,
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub primary_type: AssetContentKey,
    pub payload: Value,
    pub scope: AssetScope,
    pub storage: AssetStorageDescriptor,
    pub status: AssetLifecycleStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub labels: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_favorite: Option<bool>,
    pub version_info: AssetVersionInfo,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub references: Option<Vec<AssetDomainReferenceRecord>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Map<String, Value>>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AssetCatalogDocument {
    pub schema_version: String,
    pub assets: Vec<UnifiedDigitalAssetRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetCategoryRecord {
    pub id: String,
    pub label: String,
    pub accepts: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetCenterStatsRecord {
    pub total_assets: usize,
    pub total_ready: usize,
    pub total_processing: usize,
    pub total_archived: usize,
    pub total_deleted: usize,
    pub total_favorites: usize,
    pub by_type: BTreeMap<String, usize>,
    pub by_domain: BTreeMap<String, usize>,
}

#[derive(Debug, Clone)]
pub struct AssetListResult {
    pub items: Vec<UnifiedDigitalAssetRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AssetListQuery {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub keyword: Option<String>,
    #[serde(default)]
    pub sort: Option<Vec<String>>,
    pub workspace_id: Option<String>,
    pub project_id: Option<String>,
    pub collection_id: Option<String>,
    pub domain: Option<AssetBusinessDomain>,
    #[serde(default)]
    pub types: Option<Vec<AssetContentKey>>,
    #[serde(default)]
    pub origins: Option<Vec<String>>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub status: Option<Vec<AssetLifecycleStatus>>,
    pub include_deleted: Option<bool>,
    pub is_favorite: Option<bool>,
    pub reference_entity_type: Option<String>,
    pub reference_entity_id: Option<String>,
    pub reference_relation: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AssetStatsQuery {
    pub workspace_id: Option<String>,
    pub project_id: Option<String>,
    pub collection_id: Option<String>,
    pub domain: Option<AssetBusinessDomain>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetImportFileRequest {
    pub scope: AssetScope,
    #[serde(rename = "type")]
    pub asset_type: AssetContentKey,
    pub source_path: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub labels: Option<Vec<String>>,
    #[serde(default)]
    pub status: Option<AssetLifecycleStatus>,
    #[serde(default)]
    pub references: Option<Vec<AssetDomainReferenceRecord>>,
    #[serde(default)]
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetImportUrlRequest {
    pub scope: AssetScope,
    #[serde(rename = "type")]
    pub asset_type: AssetContentKey,
    pub url: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub labels: Option<Vec<String>>,
    #[serde(default)]
    pub status: Option<AssetLifecycleStatus>,
    #[serde(default)]
    pub references: Option<Vec<AssetDomainReferenceRecord>>,
    #[serde(default)]
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetUpdateRequest {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub labels: Option<Vec<String>>,
    #[serde(default)]
    pub status: Option<AssetLifecycleStatus>,
    #[serde(default)]
    pub is_favorite: Option<bool>,
    #[serde(default)]
    pub references: Option<Vec<AssetDomainReferenceRecord>>,
    #[serde(default)]
    pub metadata: Option<Map<String, Value>>,
}

pub type AssetUpsertRequest = UnifiedDigitalAssetRecord;

pub trait AssetService: Send + Sync {
    fn list_assets(&self, query: AssetListQuery) -> ServerResult<AssetListResult>;
    fn read_stats(&self, query: AssetStatsQuery) -> ServerResult<AssetCenterStatsRecord>;
    fn list_categories(&self) -> ServerResult<Vec<AssetCategoryRecord>>;
    fn import_file(&self, input: AssetImportFileRequest)
        -> ServerResult<UnifiedDigitalAssetRecord>;
    fn import_url(&self, input: AssetImportUrlRequest) -> ServerResult<UnifiedDigitalAssetRecord>;
    fn read_asset(&self, asset_key: &str) -> ServerResult<UnifiedDigitalAssetRecord>;
    fn upsert_asset(
        &self,
        asset_key: &str,
        input: AssetUpsertRequest,
    ) -> ServerResult<UnifiedDigitalAssetRecord>;
    fn update_asset(
        &self,
        asset_key: &str,
        input: AssetUpdateRequest,
    ) -> ServerResult<UnifiedDigitalAssetRecord>;
    fn delete_asset(&self, asset_key: &str) -> ServerResult<bool>;
}

pub struct FileBackedAssetService {
    storage_paths: AppStoragePaths,
    workspace_service: Arc<dyn WorkspaceService>,
    lock: Mutex<()>,
}

#[derive(Debug, Clone)]
struct NormalizedAssetScope {
    scope: AssetScope,
    workspace_storage_id: String,
    project_storage_id: Option<String>,
}

#[derive(Debug, Clone)]
struct ScopeFilters {
    workspace_uuid: Option<String>,
    project_uuid: Option<String>,
    collection_id: Option<String>,
    domain: Option<AssetBusinessDomain>,
}

impl FileBackedAssetService {
    pub fn new(
        storage_paths: AppStoragePaths,
        workspace_service: Arc<dyn WorkspaceService>,
    ) -> Self {
        Self {
            storage_paths,
            workspace_service,
            lock: Mutex::new(()),
        }
    }

    fn default_document(&self) -> AssetCatalogDocument {
        AssetCatalogDocument {
            schema_version: ASSET_CATALOG_SCHEMA_VERSION.to_string(),
            assets: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<AssetCatalogDocument> {
        let path = self.storage_paths.assets_catalog_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_ASSETS_READ_FAILED",
                    format!(
                        "failed to read asset catalog from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<AssetCatalogDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_ASSETS_PARSE_FAILED",
                    format!("failed to parse asset catalog {}: {error}", path.display()),
                )
            })?;

        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &AssetCatalogDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.managed_assets_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_ASSETS_ROOT_CREATE_FAILED",
                format!(
                    "failed to create managed assets root {}: {error}",
                    self.storage_paths.managed_assets_root_dir().display()
                ),
            )
        })?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_ASSETS_SERIALIZE_FAILED",
                format!("failed to serialize asset catalog: {error}"),
            )
        })?;

        fs::write(self.storage_paths.assets_catalog_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_ASSETS_WRITE_FAILED",
                format!(
                    "failed to write asset catalog to {}: {error}",
                    self.storage_paths.assets_catalog_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut AssetCatalogDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = ASSET_CATALOG_SCHEMA_VERSION.to_string();
        }

        for asset in &mut document.assets {
            asset.id = asset.asset_id.clone();
            asset.uuid = to_client_entity_uuid(&asset.asset_id);
            asset.key = build_asset_key(&asset.scope, &asset.asset_id);
            asset.title = asset.title.trim().to_string();
            asset.description = normalize_optional_text(asset.description.clone());
            asset.tags = normalize_string_list(asset.tags.clone());
            asset.labels = normalize_string_list(asset.labels.clone());
            asset.references = normalize_references(asset.references.clone());
            asset.metadata = normalize_metadata(asset.metadata.clone());
            asset.scope.collection_id = normalize_optional_text(asset.scope.collection_id.clone());
        }

        sort_assets(&mut document.assets);
    }

    fn normalize_scope(&self, scope: AssetScope) -> ServerResult<NormalizedAssetScope> {
        let workspace_key = require_non_empty_text(
            &scope.workspace_id,
            "ASSET_SCOPE_WORKSPACE_ID_EMPTY",
            "scope.workspaceId",
        )?;
        let workspace = self.workspace_service.read_workspace(&workspace_key)?;

        let (project_storage_id, project_uuid) = match scope.project_id.as_deref() {
            Some(project_key) => {
                let project_key = require_non_empty_text(
                    project_key,
                    "ASSET_SCOPE_PROJECT_ID_EMPTY",
                    "scope.projectId",
                )?;
                let project = self
                    .workspace_service
                    .read_project(&workspace.id, &project_key)?;
                (Some(project.id), Some(project.uuid))
            }
            None => (None, None),
        };

        Ok(NormalizedAssetScope {
            scope: AssetScope {
                workspace_id: workspace.uuid,
                project_id: project_uuid,
                collection_id: normalize_optional_text(scope.collection_id),
                domain: scope.domain,
            },
            workspace_storage_id: workspace.id,
            project_storage_id,
        })
    }

    fn normalize_scope_filters(
        &self,
        workspace_id: Option<String>,
        project_id: Option<String>,
        collection_id: Option<String>,
        domain: Option<AssetBusinessDomain>,
    ) -> ServerResult<ScopeFilters> {
        let workspace_key = workspace_id.as_deref();
        let workspace_uuid = match workspace_key {
            Some(workspace_key) => Some(self.workspace_service.read_workspace(workspace_key)?.uuid),
            None => None,
        };

        let project_uuid = match (workspace_key, project_id) {
            (Some(workspace_key), Some(project_key)) => {
                let project = self
                    .workspace_service
                    .read_project(workspace_key, &project_key)?;
                Some(project.uuid)
            }
            (None, Some(_)) => {
                return Err(ServerError::bad_request(
                    "ASSET_SCOPE_PROJECT_REQUIRES_WORKSPACE",
                    "projectId requires workspaceId",
                ));
            }
            (_, None) => None,
        };

        Ok(ScopeFilters {
            workspace_uuid,
            project_uuid,
            collection_id: normalize_optional_text(collection_id),
            domain,
        })
    }

    fn list_categories_internal(&self) -> Vec<AssetCategoryRecord> {
        vec![
            category(
                "image",
                "Images",
                &[
                    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".tiff",
                ],
            ),
            category(
                "video",
                "Videos",
                &[".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"],
            ),
            category(
                "audio",
                "Audio",
                &[".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a"],
            ),
            category("music", "Music", &[".mp3", ".wav", ".ogg", ".flac"]),
            category("voice", "Voices", &[".json", ".voice", ".wav", ".mp3"]),
            category("text", "Texts", &[".txt", ".md"]),
            category(
                "character",
                "Characters",
                &[".json", ".char", ".dh", ".png", ".glb", ".gltf", ".fbx"],
            ),
            category("sfx", "Sound Effects", &[".wav", ".mp3", ".ogg", ".aac"]),
            category("effect", "Effects", &[".effect", ".cube", ".lut", ".fx"]),
            category("transition", "Transitions", &[".transition", ".trans"]),
            category("subtitle", "Subtitles", &[".srt", ".ass", ".vtt"]),
            category("model3d", "3D Models", &[".glb", ".gltf", ".obj", ".fbx"]),
            category("lottie", "Animations", &[".json", ".lottie"]),
            category("file", "Files", &[]),
        ]
    }

    fn asset_scope_root(&self, scope: &NormalizedAssetScope) -> PathBuf {
        let mut directory = self
            .storage_paths
            .managed_assets_root_dir()
            .join("workspaces")
            .join(sanitize_path_segment(&scope.workspace_storage_id));

        if let Some(project_storage_id) = scope.project_storage_id.as_deref() {
            directory = directory
                .join("projects")
                .join(sanitize_path_segment(project_storage_id));
        }

        directory = directory.join("domains").join(scope.scope.domain.as_str());

        if let Some(collection_id) = scope.scope.collection_id.as_deref() {
            directory = directory
                .join("collections")
                .join(sanitize_path_segment(collection_id));
        }

        directory
    }

    fn managed_asset_dir(&self, scope: &NormalizedAssetScope, asset_id: &str) -> PathBuf {
        self.asset_scope_root(scope).join(asset_id)
    }

    fn read_asset_record<'a>(
        &self,
        assets: &'a [UnifiedDigitalAssetRecord],
        asset_key: &str,
    ) -> ServerResult<&'a UnifiedDigitalAssetRecord> {
        let normalized_key = require_non_empty_text(asset_key, "ASSET_ID_EMPTY", "assetId")?;
        assets
            .iter()
            .find(|asset| matches_asset_key(asset, &normalized_key))
            .ok_or_else(|| {
                ServerError::not_found(
                    "ASSET_NOT_FOUND",
                    format!("asset {normalized_key} was not found"),
                )
            })
    }

    fn read_asset_record_mut<'a>(
        &self,
        assets: &'a mut [UnifiedDigitalAssetRecord],
        asset_key: &str,
    ) -> ServerResult<&'a mut UnifiedDigitalAssetRecord> {
        let normalized_key = require_non_empty_text(asset_key, "ASSET_ID_EMPTY", "assetId")?;
        assets
            .iter_mut()
            .find(|asset| matches_asset_key(asset, &normalized_key))
            .ok_or_else(|| {
                ServerError::not_found(
                    "ASSET_NOT_FOUND",
                    format!("asset {normalized_key} was not found"),
                )
            })
    }
}

impl AssetService for FileBackedAssetService {
    fn list_assets(&self, query: AssetListQuery) -> ServerResult<AssetListResult> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let filters = self.normalize_scope_filters(
            query.workspace_id.clone(),
            query.project_id.clone(),
            query.collection_id.clone(),
            query.domain.clone(),
        )?;
        let keyword = normalize_optional_text(query.keyword);
        let keyword_lower = keyword.as_ref().map(|entry| entry.to_lowercase());
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.size);
        let type_filters = normalize_vec_filter(query.types);
        let origin_filters = normalize_string_filter(query.origins);
        let tag_filters = normalize_string_filter(query.tags);
        let status_filters = normalize_vec_filter(query.status);
        let include_deleted = query.include_deleted.unwrap_or(false)
            || status_filters
                .as_ref()
                .is_some_and(|statuses| statuses.contains(&AssetLifecycleStatus::Deleted));
        let reference_filter = normalize_reference_filter(
            query.reference_entity_type,
            query.reference_entity_id,
            query.reference_relation,
        );

        let document = self.load_from_disk()?;
        let mut filtered = document
            .assets
            .into_iter()
            .filter(|asset| include_deleted || asset.status != AssetLifecycleStatus::Deleted)
            .filter(|asset| matches_scope_filters(asset, &filters))
            .filter(|asset| {
                type_filters
                    .as_ref()
                    .map(|types| types.contains(&asset.primary_type))
                    .unwrap_or(true)
            })
            .filter(|asset| {
                status_filters
                    .as_ref()
                    .map(|statuses| statuses.contains(&asset.status))
                    .unwrap_or(true)
            })
            .filter(|asset| {
                origin_filters
                    .as_ref()
                    .map(|origins| {
                        resolve_asset_origin(asset)
                            .as_ref()
                            .is_some_and(|origin| origins.iter().any(|entry| entry == origin))
                    })
                    .unwrap_or(true)
            })
            .filter(|asset| {
                tag_filters
                    .as_ref()
                    .map(|tags| {
                        asset
                            .tags
                            .as_ref()
                            .map(|asset_tags| tags.iter().all(|tag| asset_tags.contains(tag)))
                            .unwrap_or(false)
                    })
                    .unwrap_or(true)
            })
            .filter(|asset| {
                reference_filter
                    .as_ref()
                    .map(|filter| matches_reference_filter(asset, filter))
                    .unwrap_or(true)
            })
            .filter(|asset| {
                query
                    .is_favorite
                    .map(|expected| asset.is_favorite.unwrap_or(false) == expected)
                    .unwrap_or(true)
            })
            .filter(|asset| keyword_matches(asset, keyword_lower.as_deref()))
            .collect::<Vec<_>>();

        sort_assets_by_request(&mut filtered, query.sort.as_deref());

        let total = filtered.len();
        let start = page * page_size;
        let items = if start >= total {
            Vec::new()
        } else {
            filtered
                .into_iter()
                .skip(start)
                .take(page_size)
                .collect::<Vec<_>>()
        };

        Ok(AssetListResult {
            items,
            page,
            page_size,
            total,
        })
    }

    fn read_stats(&self, query: AssetStatsQuery) -> ServerResult<AssetCenterStatsRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let filters = self.normalize_scope_filters(
            query.workspace_id,
            query.project_id,
            query.collection_id,
            query.domain,
        )?;
        let document = self.load_from_disk()?;
        let filtered = document
            .assets
            .into_iter()
            .filter(|asset| matches_scope_filters(asset, &filters))
            .collect::<Vec<_>>();

        let mut by_type = BTreeMap::new();
        let mut by_domain = BTreeMap::new();
        let mut total_ready = 0;
        let mut total_processing = 0;
        let mut total_archived = 0;
        let mut total_deleted = 0;
        let mut total_favorites = 0;

        for asset in &filtered {
            if asset.status == AssetLifecycleStatus::Deleted {
                total_deleted += 1;
                continue;
            }

            *by_type
                .entry(asset.primary_type.as_str().to_string())
                .or_insert(0) += 1;
            *by_domain
                .entry(asset.scope.domain.as_str().to_string())
                .or_insert(0) += 1;

            if asset.status == AssetLifecycleStatus::Ready {
                total_ready += 1;
            }

            if asset.status == AssetLifecycleStatus::Processing {
                total_processing += 1;
            }

            if asset.status == AssetLifecycleStatus::Archived {
                total_archived += 1;
            }

            if asset.is_favorite.unwrap_or(false) {
                total_favorites += 1;
            }
        }

        Ok(AssetCenterStatsRecord {
            total_assets: filtered
                .iter()
                .filter(|asset| asset.status != AssetLifecycleStatus::Deleted)
                .count(),
            total_ready,
            total_processing,
            total_archived,
            total_deleted,
            total_favorites,
            by_type,
            by_domain,
        })
    }

    fn list_categories(&self) -> ServerResult<Vec<AssetCategoryRecord>> {
        Ok(self.list_categories_internal())
    }

    fn import_file(
        &self,
        input: AssetImportFileRequest,
    ) -> ServerResult<UnifiedDigitalAssetRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let scope = self.normalize_scope(input.scope)?;
        let source_path_text =
            require_non_empty_text(&input.source_path, "ASSET_SOURCE_PATH_EMPTY", "sourcePath")?;
        let source_path = PathBuf::from(&source_path_text);
        if !source_path.exists() {
            return Err(ServerError::not_found(
                "ASSET_SOURCE_PATH_NOT_FOUND",
                format!("source path {} was not found", source_path.display()),
            ));
        }

        if !source_path.is_file() {
            return Err(ServerError::bad_request(
                "ASSET_SOURCE_PATH_INVALID",
                "sourcePath must reference a file",
            ));
        }

        let asset_id = next_entity_id("asset", &ASSET_COUNTER);
        let resource_id = next_entity_id("resource", &ASSET_RESOURCE_COUNTER);
        let timestamp = current_timestamp();
        let asset_dir = self.managed_asset_dir(&scope, &asset_id);
        fs::create_dir_all(&asset_dir).map_err(|error| {
            ServerError::internal(
                "APP_ASSET_DIRECTORY_CREATE_FAILED",
                format!(
                    "failed to create managed asset directory {}: {error}",
                    asset_dir.display()
                ),
            )
        })?;

        let source_extension = source_path
            .extension()
            .and_then(|value| value.to_str())
            .map(|value| value.to_lowercase());
        let target_file_name = build_target_file_name(
            &asset_id,
            source_path.file_name().and_then(|value| value.to_str()),
            source_extension.as_deref(),
        );
        let target_path = asset_dir.join(target_file_name);

        if let Err(error) = fs::copy(&source_path, &target_path) {
            remove_dir_if_exists(&asset_dir);
            return Err(ServerError::internal(
                "APP_ASSET_IMPORT_COPY_FAILED",
                format!(
                    "failed to copy {} to {}: {error}",
                    source_path.display(),
                    target_path.display()
                ),
            ));
        }

        let file_size = fs::metadata(&target_path)
            .map(|metadata| metadata.len())
            .unwrap_or(0);
        let title = normalize_asset_title(
            input.name,
            source_path.file_name().and_then(|value| value.to_str()),
            &asset_id,
        )?;
        let description = normalize_optional_text(input.description);
        let tags = normalize_string_list(input.tags);
        let labels = normalize_string_list(input.labels);
        let references = normalize_references(input.references);
        let metadata = normalize_metadata(Some(build_imported_file_metadata(
            input.metadata,
            &source_path,
            &target_path,
            file_size,
            input.asset_type.as_str(),
        )));
        let relative_path =
            relative_asset_path(self.storage_paths.managed_assets_root_dir(), &target_path);
        let asset_uri = build_assets_uri(&scope.scope, &asset_id);
        let primary_locator = AssetLocator {
            protocol: AssetLocatorProtocol::Assets,
            uri: asset_uri.clone(),
            path: Some(relative_path.clone()),
            url: None,
            checksum: None,
        };
        let file_locator = AssetLocator {
            protocol: AssetLocatorProtocol::File,
            uri: format!("file://{}", path_to_uri_path(&target_path)),
            path: Some(path_to_string(&target_path)),
            url: None,
            checksum: None,
        };
        let payload = build_payload(
            &input.asset_type,
            build_primary_resource(
                &resource_id,
                &asset_id,
                input.asset_type.as_str(),
                &title,
                source_extension.as_deref(),
                Some(guess_mime_type(
                    &input.asset_type,
                    source_extension.as_deref(),
                )),
                Some(file_size),
                Some(&asset_uri),
                Some(&path_to_string(&target_path)),
                metadata.as_ref(),
                "upload",
            ),
        );

        let asset = UnifiedDigitalAssetRecord {
            id: asset_id.clone(),
            uuid: to_client_entity_uuid(&asset_id),
            asset_id: asset_id.clone(),
            key: build_asset_key(&scope.scope, &asset_id),
            title,
            description,
            primary_type: input.asset_type,
            payload,
            scope: scope.scope.clone(),
            storage: AssetStorageDescriptor {
                mode: AssetStorageMode::Hybrid,
                primary: primary_locator,
                replicas: Some(vec![file_locator]),
                cacheable: true,
                encrypted: None,
            },
            status: input.status.unwrap_or(AssetLifecycleStatus::Imported),
            tags,
            labels,
            is_favorite: Some(false),
            version_info: AssetVersionInfo {
                version: 1,
                parent_asset_id: None,
                derived_from_resource_id: None,
            },
            references,
            metadata,
            created_at: timestamp.clone(),
            updated_at: timestamp,
            deleted_at: None,
        };

        let mut document = self.load_from_disk()?;
        document.assets.push(asset.clone());
        sort_assets(&mut document.assets);

        if let Err(error) = self.persist_to_disk(&document) {
            remove_dir_if_exists(&asset_dir);
            return Err(error);
        }

        Ok(asset)
    }

    fn import_url(&self, input: AssetImportUrlRequest) -> ServerResult<UnifiedDigitalAssetRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let scope = self.normalize_scope(input.scope)?;
        let url = require_non_empty_text(&input.url, "ASSET_URL_EMPTY", "url")?;
        let protocol = if url.starts_with("https://") {
            AssetLocatorProtocol::Https
        } else if url.starts_with("http://") {
            AssetLocatorProtocol::Http
        } else {
            return Err(ServerError::bad_request(
                "ASSET_URL_PROTOCOL_INVALID",
                "url must use http or https",
            ));
        };

        let title = normalize_asset_title(Some(input.name), None, "asset")?;
        let description = normalize_optional_text(input.description);
        let tags = normalize_string_list(input.tags);
        let labels = normalize_string_list(input.labels);
        let references = normalize_references(input.references);
        let extension = extension_from_url(&url);
        let metadata = normalize_metadata(Some(build_remote_url_metadata(
            input.metadata,
            &url,
            extension.as_deref(),
            input.asset_type.as_str(),
        )));
        let asset_id = next_entity_id("asset", &ASSET_COUNTER);
        let resource_id = next_entity_id("resource", &ASSET_RESOURCE_COUNTER);
        let timestamp = current_timestamp();
        let payload = build_payload(
            &input.asset_type,
            build_primary_resource(
                &resource_id,
                &asset_id,
                input.asset_type.as_str(),
                &title,
                extension.as_deref(),
                Some(guess_mime_type(&input.asset_type, extension.as_deref())),
                None,
                Some(&url),
                None,
                metadata.as_ref(),
                "upload",
            ),
        );

        let asset = UnifiedDigitalAssetRecord {
            id: asset_id.clone(),
            uuid: to_client_entity_uuid(&asset_id),
            asset_id: asset_id.clone(),
            key: build_asset_key(&scope.scope, &asset_id),
            title,
            description,
            primary_type: input.asset_type,
            payload,
            scope: scope.scope,
            storage: AssetStorageDescriptor {
                mode: AssetStorageMode::RemoteUrl,
                primary: AssetLocator {
                    protocol,
                    uri: url.clone(),
                    path: None,
                    url: Some(url),
                    checksum: None,
                },
                replicas: None,
                cacheable: true,
                encrypted: None,
            },
            status: input.status.unwrap_or(AssetLifecycleStatus::Ready),
            tags,
            labels,
            is_favorite: Some(false),
            version_info: AssetVersionInfo {
                version: 1,
                parent_asset_id: None,
                derived_from_resource_id: None,
            },
            references,
            metadata,
            created_at: timestamp.clone(),
            updated_at: timestamp,
            deleted_at: None,
        };

        let mut document = self.load_from_disk()?;
        document.assets.push(asset.clone());
        sort_assets(&mut document.assets);
        self.persist_to_disk(&document)?;
        Ok(asset)
    }

    fn read_asset(&self, asset_key: &str) -> ServerResult<UnifiedDigitalAssetRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let document = self.load_from_disk()?;
        Ok(self.read_asset_record(&document.assets, asset_key)?.clone())
    }

    fn upsert_asset(
        &self,
        asset_key: &str,
        input: AssetUpsertRequest,
    ) -> ServerResult<UnifiedDigitalAssetRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let normalized_key = require_non_empty_text(asset_key, "ASSET_ID_EMPTY", "assetId")?;
        let asset = normalize_upsert_asset_record(input, &normalized_key)?;

        let mut document = self.load_from_disk()?;
        if let Some(existing) = document
            .assets
            .iter_mut()
            .find(|candidate| matches_asset_key(candidate, &normalized_key))
        {
            *existing = asset.clone();
        } else {
            document.assets.push(asset.clone());
        }

        sort_assets(&mut document.assets);
        self.persist_to_disk(&document)?;
        Ok(asset)
    }

    fn update_asset(
        &self,
        asset_key: &str,
        input: AssetUpdateRequest,
    ) -> ServerResult<UnifiedDigitalAssetRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        if input.title.is_none()
            && input.description.is_none()
            && input.tags.is_none()
            && input.labels.is_none()
            && input.status.is_none()
            && input.is_favorite.is_none()
            && input.references.is_none()
            && input.metadata.is_none()
        {
            return Err(ServerError::bad_request(
                "ASSET_UPDATE_EMPTY",
                "asset update must include at least one field",
            ));
        }

        let mut document = self.load_from_disk()?;
        let asset = self.read_asset_record_mut(&mut document.assets, asset_key)?;

        if asset.status == AssetLifecycleStatus::Deleted {
            return Err(ServerError::conflict(
                "ASSET_ALREADY_DELETED",
                "deleted assets cannot be updated",
            ));
        }

        if let Some(title) = input.title {
            asset.title = require_non_empty_text(&title, "ASSET_TITLE_EMPTY", "title")?;
        }

        if let Some(description) = input.description {
            asset.description = normalize_optional_text(Some(description));
        }

        if let Some(tags) = input.tags {
            asset.tags = normalize_string_list(Some(tags));
        }

        if let Some(labels) = input.labels {
            asset.labels = normalize_string_list(Some(labels));
        }

        if let Some(status) = input.status {
            asset.status = status;
        }

        if let Some(is_favorite) = input.is_favorite {
            asset.is_favorite = Some(is_favorite);
        }

        if let Some(references) = input.references {
            asset.references = normalize_references(Some(references));
        }

        if let Some(metadata) = input.metadata {
            asset.metadata = normalize_metadata(Some(metadata));
        }

        asset.updated_at = current_timestamp();
        let response = asset.clone();
        sort_assets(&mut document.assets);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn delete_asset(&self, asset_key: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("APP_ASSETS_LOCK_FAILED", "failed to acquire asset lock")
        })?;

        let mut document = self.load_from_disk()?;
        let asset = self.read_asset_record_mut(&mut document.assets, asset_key)?;

        if asset.status == AssetLifecycleStatus::Deleted {
            return Ok(true);
        }

        asset.status = AssetLifecycleStatus::Deleted;
        asset.deleted_at = Some(current_timestamp());
        asset.updated_at = current_timestamp();

        let removable_paths = collect_removable_asset_paths(asset);

        sort_assets(&mut document.assets);
        self.persist_to_disk(&document)?;

        for path in removable_paths {
            remove_path_if_exists(&path);
        }

        Ok(true)
    }
}

fn category(id: &str, label: &str, accepts: &[&str]) -> AssetCategoryRecord {
    AssetCategoryRecord {
        id: id.to_string(),
        label: label.to_string(),
        accepts: accepts.iter().map(|value| (*value).to_string()).collect(),
    }
}

fn matches_scope_filters(asset: &UnifiedDigitalAssetRecord, filters: &ScopeFilters) -> bool {
    if let Some(workspace_uuid) = filters.workspace_uuid.as_deref() {
        if asset.scope.workspace_id != workspace_uuid {
            return false;
        }
    }

    if let Some(project_uuid) = filters.project_uuid.as_deref() {
        if asset.scope.project_id.as_deref() != Some(project_uuid) {
            return false;
        }
    }

    if let Some(collection_id) = filters.collection_id.as_deref() {
        if asset.scope.collection_id.as_deref() != Some(collection_id) {
            return false;
        }
    }

    if let Some(domain) = filters.domain.as_ref() {
        if &asset.scope.domain != domain {
            return false;
        }
    }

    true
}

fn matches_reference_filter(asset: &UnifiedDigitalAssetRecord, filter: &ReferenceFilter) -> bool {
    asset.references.as_ref().is_some_and(|references| {
        references.iter().any(|reference| {
            filter
                .entity_type
                .as_deref()
                .map(|expected| reference.entity_type == expected)
                .unwrap_or(true)
                && filter
                    .entity_id
                    .as_deref()
                    .map(|expected| reference.entity_id == expected)
                    .unwrap_or(true)
                && filter
                    .relation
                    .as_deref()
                    .map(|expected| reference.relation == expected)
                    .unwrap_or(true)
        })
    })
}

fn keyword_matches(asset: &UnifiedDigitalAssetRecord, keyword: Option<&str>) -> bool {
    let Some(keyword) = keyword else {
        return true;
    };

    if asset.title.to_lowercase().contains(keyword) {
        return true;
    }

    if asset
        .description
        .as_deref()
        .unwrap_or_default()
        .to_lowercase()
        .contains(keyword)
    {
        return true;
    }

    if asset
        .tags
        .as_ref()
        .is_some_and(|tags| tags.iter().any(|tag| tag.to_lowercase().contains(keyword)))
    {
        return true;
    }

    if asset.labels.as_ref().is_some_and(|labels| {
        labels
            .iter()
            .any(|label| label.to_lowercase().contains(keyword))
    }) {
        return true;
    }

    asset.key.to_lowercase().contains(keyword)
}

#[derive(Debug, Clone)]
struct ReferenceFilter {
    entity_type: Option<String>,
    entity_id: Option<String>,
    relation: Option<String>,
}

#[derive(Debug, Clone)]
struct SortOrder {
    field: String,
    ascending: bool,
}

fn normalize_vec_filter<T>(value: Option<Vec<T>>) -> Option<Vec<T>> {
    value.and_then(|items| if items.is_empty() { None } else { Some(items) })
}

fn normalize_string_filter(value: Option<Vec<String>>) -> Option<Vec<String>> {
    value.and_then(|items| {
        let normalized = items
            .into_iter()
            .flat_map(|item| {
                item.split(',')
                    .map(|part| part.trim().to_string())
                    .collect::<Vec<_>>()
            })
            .filter(|item| !item.is_empty())
            .fold(Vec::<String>::new(), |mut acc, item| {
                if !acc.contains(&item) {
                    acc.push(item);
                }
                acc
            });

        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    })
}

fn normalize_reference_filter(
    entity_type: Option<String>,
    entity_id: Option<String>,
    relation: Option<String>,
) -> Option<ReferenceFilter> {
    let filter = ReferenceFilter {
        entity_type: normalize_optional_text(entity_type),
        entity_id: normalize_optional_text(entity_id),
        relation: normalize_optional_text(relation),
    };

    if filter.entity_type.is_none() && filter.entity_id.is_none() && filter.relation.is_none() {
        None
    } else {
        Some(filter)
    }
}

fn normalize_page(value: Option<usize>) -> usize {
    value.unwrap_or(0)
}

fn normalize_page_size(value: Option<usize>) -> usize {
    match value.unwrap_or(DEFAULT_ASSET_PAGE_SIZE) {
        0 => DEFAULT_ASSET_PAGE_SIZE,
        provided => provided.min(MAX_ASSET_PAGE_SIZE),
    }
}

fn normalize_string_list(value: Option<Vec<String>>) -> Option<Vec<String>> {
    value.and_then(|items| {
        let normalized = items
            .into_iter()
            .map(|item| item.trim().to_string())
            .filter(|item| !item.is_empty())
            .fold(Vec::<String>::new(), |mut acc, item| {
                if !acc.contains(&item) {
                    acc.push(item);
                }
                acc
            });

        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    })
}

fn normalize_metadata(value: Option<Map<String, Value>>) -> Option<Map<String, Value>> {
    value.and_then(|entries| {
        if entries.is_empty() {
            None
        } else {
            Some(entries)
        }
    })
}

fn normalize_references(
    value: Option<Vec<AssetDomainReferenceRecord>>,
) -> Option<Vec<AssetDomainReferenceRecord>> {
    value.and_then(|entries| {
        let normalized = entries
            .into_iter()
            .filter_map(|entry| {
                let entity_type = entry.entity_type.trim().to_string();
                let entity_id = entry.entity_id.trim().to_string();
                let relation = entry.relation.trim().to_string();

                if entity_type.is_empty() || entity_id.is_empty() || relation.is_empty() {
                    return None;
                }

                Some(AssetDomainReferenceRecord {
                    domain: entry.domain,
                    entity_type,
                    entity_id,
                    relation,
                    slot: normalize_optional_text(entry.slot),
                    order: entry.order,
                    metadata: normalize_metadata(entry.metadata),
                })
            })
            .collect::<Vec<_>>();

        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    })
}

fn normalize_upsert_asset_record(
    mut asset: UnifiedDigitalAssetRecord,
    asset_key: &str,
) -> ServerResult<UnifiedDigitalAssetRecord> {
    if asset.asset_id != asset_key {
        return Err(ServerError::bad_request(
            "ASSET_UPSERT_ID_MISMATCH",
            "assetId in path must match request body assetId",
        ));
    }
    if asset.id != asset_key {
        return Err(ServerError::bad_request(
            "ASSET_UPSERT_ID_INVALID",
            "request body id must match assetId",
        ));
    }

    asset.id = require_non_empty_text(&asset.id, "ASSET_ID_EMPTY", "id")?;
    asset.asset_id = require_non_empty_text(&asset.asset_id, "ASSET_ID_EMPTY", "assetId")?;
    asset.uuid = require_non_empty_text(&asset.uuid, "ASSET_UUID_EMPTY", "uuid")?;
    asset.title = require_non_empty_text(&asset.title, "ASSET_TITLE_EMPTY", "title")?;
    asset.key = if asset.key.trim().is_empty() {
        build_asset_key(&asset.scope, &asset.asset_id)
    } else {
        asset.key.trim().to_string()
    };
    asset.scope.workspace_id = require_non_empty_text(
        &asset.scope.workspace_id,
        "ASSET_WORKSPACE_EMPTY",
        "scope.workspaceId",
    )?;
    asset.scope.project_id = normalize_optional_text(asset.scope.project_id);
    asset.scope.collection_id = normalize_optional_text(asset.scope.collection_id);
    asset.description = normalize_optional_text(asset.description);
    asset.tags = normalize_string_list(asset.tags);
    asset.labels = normalize_string_list(asset.labels);
    asset.references = normalize_references(asset.references);
    asset.metadata = normalize_metadata(asset.metadata);
    asset.created_at =
        require_non_empty_text(&asset.created_at, "ASSET_CREATED_AT_EMPTY", "createdAt")?;
    asset.updated_at =
        require_non_empty_text(&asset.updated_at, "ASSET_UPDATED_AT_EMPTY", "updatedAt")?;
    asset.deleted_at = normalize_optional_text(asset.deleted_at);

    Ok(asset)
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let trimmed = item.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
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

fn normalize_asset_title(
    explicit_name: Option<String>,
    fallback_name: Option<&str>,
    fallback_id: &str,
) -> ServerResult<String> {
    if let Some(name) = explicit_name {
        return require_non_empty_text(&name, "ASSET_TITLE_EMPTY", "name");
    }

    if let Some(name) = fallback_name {
        let trimmed = name.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }

    Ok(fallback_id.to_string())
}

fn build_asset_key(scope: &AssetScope, asset_id: &str) -> String {
    format!(
        "{}/{}/{}",
        scope.workspace_id,
        scope.domain.as_str(),
        asset_id
    )
}

fn build_assets_uri(scope: &AssetScope, asset_id: &str) -> String {
    format!(
        "assets://{}/{}/{}",
        scope.workspace_id,
        scope.domain.as_str(),
        asset_id
    )
}

fn build_primary_resource(
    resource_id: &str,
    asset_id: &str,
    content_type: &str,
    name: &str,
    extension: Option<&str>,
    mime_type: Option<String>,
    size: Option<u64>,
    url: Option<&str>,
    path: Option<&str>,
    metadata: Option<&Map<String, Value>>,
    origin: &str,
) -> Value {
    let mut object = Map::new();
    object.insert("id".to_string(), Value::String(resource_id.to_string()));
    object.insert("assetId".to_string(), Value::String(asset_id.to_string()));
    object.insert(
        "primaryResourceId".to_string(),
        Value::String(resource_id.to_string()),
    );
    object.insert(
        "type".to_string(),
        Value::String(content_type_to_media_type(content_type).to_string()),
    );
    object.insert("name".to_string(), Value::String(name.to_string()));
    object.insert("origin".to_string(), Value::String(origin.to_string()));

    if let Some(extension) = extension {
        object.insert(
            "extension".to_string(),
            Value::String(extension.to_string()),
        );
    }

    if let Some(mime_type) = mime_type {
        object.insert("mimeType".to_string(), Value::String(mime_type));
    }

    if let Some(size) = size {
        object.insert("size".to_string(), Value::Number(size.into()));
    }

    if let Some(url) = url {
        object.insert("url".to_string(), Value::String(url.to_string()));
    }

    if let Some(path) = path {
        object.insert("path".to_string(), Value::String(path.to_string()));
    }

    if let Some(metadata) = metadata {
        object.insert("metadata".to_string(), Value::Object(metadata.clone()));
    }

    Value::Object(object)
}

fn build_payload(primary_type: &AssetContentKey, primary: Value) -> Value {
    let mut object = Map::new();
    object.insert("assets".to_string(), Value::Array(vec![primary.clone()]));
    object.insert(primary_type.as_str().to_string(), primary);
    Value::Object(object)
}

fn build_imported_file_metadata(
    metadata: Option<Map<String, Value>>,
    source_path: &Path,
    target_path: &Path,
    file_size: u64,
    asset_type: &str,
) -> Map<String, Value> {
    let mut entries = metadata.unwrap_or_default();
    entries.insert(
        "originalName".to_string(),
        Value::String(
            source_path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("asset")
                .to_string(),
        ),
    );
    if let Some(extension) = source_path.extension().and_then(|value| value.to_str()) {
        entries.insert(
            "extension".to_string(),
            Value::String(extension.to_lowercase()),
        );
    }
    entries.insert("size".to_string(), Value::Number(file_size.into()));
    entries.insert(
        "mimeType".to_string(),
        Value::String(guess_mime_type(
            &parse_asset_content_key(asset_type),
            source_path.extension().and_then(|value| value.to_str()),
        )),
    );
    entries.insert("source".to_string(), Value::String("upload".to_string()));
    entries.insert(
        "sourcePath".to_string(),
        Value::String(path_to_string(source_path)),
    );
    entries.insert(
        "managedPath".to_string(),
        Value::String(path_to_string(target_path)),
    );
    entries
}

fn build_remote_url_metadata(
    metadata: Option<Map<String, Value>>,
    url: &str,
    extension: Option<&str>,
    asset_type: &str,
) -> Map<String, Value> {
    let mut entries = metadata.unwrap_or_default();
    entries.insert(
        "source".to_string(),
        Value::String("remote-url".to_string()),
    );
    entries.insert("sourceUrl".to_string(), Value::String(url.to_string()));
    if let Some(extension) = extension {
        entries.insert(
            "extension".to_string(),
            Value::String(extension.to_string()),
        );
    }
    entries.insert(
        "mimeType".to_string(),
        Value::String(guess_mime_type(
            &parse_asset_content_key(asset_type),
            extension,
        )),
    );
    entries
}

fn parse_asset_content_key(asset_type: &str) -> AssetContentKey {
    match asset_type {
        "video" => AssetContentKey::Video,
        "image" => AssetContentKey::Image,
        "audio" => AssetContentKey::Audio,
        "music" => AssetContentKey::Music,
        "voice" => AssetContentKey::Voice,
        "text" => AssetContentKey::Text,
        "character" => AssetContentKey::Character,
        "model3d" => AssetContentKey::Model3d,
        "lottie" => AssetContentKey::Lottie,
        "effect" => AssetContentKey::Effect,
        "transition" => AssetContentKey::Transition,
        "subtitle" => AssetContentKey::Subtitle,
        "sfx" => AssetContentKey::Sfx,
        _ => AssetContentKey::File,
    }
}

fn content_type_to_media_type(content_type: &str) -> &'static str {
    match content_type {
        "image" => "IMAGE",
        "video" => "VIDEO",
        "audio" => "AUDIO",
        "music" => "MUSIC",
        "voice" => "VOICE",
        "text" => "TEXT",
        "character" => "CHARACTER",
        "model3d" => "MODEL_3D",
        "lottie" => "LOTTIE",
        "effect" => "EFFECT",
        "transition" => "TRANSITION",
        "subtitle" => "SUBTITLE",
        "sfx" => "SFX",
        _ => "FILE",
    }
}

fn guess_mime_type(asset_type: &AssetContentKey, extension: Option<&str>) -> String {
    let normalized_extension = extension
        .map(|value| value.trim_start_matches('.').to_lowercase())
        .unwrap_or_default();

    match normalized_extension.as_str() {
        "png" => "image/png".to_string(),
        "jpg" | "jpeg" => "image/jpeg".to_string(),
        "webp" => "image/webp".to_string(),
        "gif" => "image/gif".to_string(),
        "svg" => "image/svg+xml".to_string(),
        "bmp" => "image/bmp".to_string(),
        "tiff" | "tif" => "image/tiff".to_string(),
        "mp4" => "video/mp4".to_string(),
        "mov" => "video/quicktime".to_string(),
        "webm" => "video/webm".to_string(),
        "mkv" => "video/x-matroska".to_string(),
        "avi" => "video/x-msvideo".to_string(),
        "wav" => "audio/wav".to_string(),
        "mp3" => "audio/mpeg".to_string(),
        "ogg" => "audio/ogg".to_string(),
        "flac" => "audio/flac".to_string(),
        "aac" => "audio/aac".to_string(),
        "m4a" => "audio/mp4".to_string(),
        "json" if matches!(asset_type, AssetContentKey::Lottie) => "application/json".to_string(),
        "json" => "application/json".to_string(),
        "txt" => "text/plain".to_string(),
        "md" => "text/markdown".to_string(),
        "srt" => "application/x-subrip".to_string(),
        "ass" => "text/x-ssa".to_string(),
        "vtt" => "text/vtt".to_string(),
        "glb" => "model/gltf-binary".to_string(),
        "gltf" => "model/gltf+json".to_string(),
        "obj" => "model/obj".to_string(),
        "fbx" => "application/octet-stream".to_string(),
        _ => match asset_type {
            AssetContentKey::Image => "image/*".to_string(),
            AssetContentKey::Video => "video/*".to_string(),
            AssetContentKey::Audio
            | AssetContentKey::Music
            | AssetContentKey::Voice
            | AssetContentKey::Sfx => "audio/*".to_string(),
            AssetContentKey::Text | AssetContentKey::Subtitle => "text/plain".to_string(),
            AssetContentKey::Character | AssetContentKey::Model3d | AssetContentKey::Lottie => {
                "application/octet-stream".to_string()
            }
            _ => "application/octet-stream".to_string(),
        },
    }
}

fn extension_from_url(url: &str) -> Option<String> {
    let without_query = url.split('?').next().unwrap_or(url);
    Path::new(without_query)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_lowercase())
}

fn build_target_file_name(
    asset_id: &str,
    source_file_name: Option<&str>,
    extension: Option<&str>,
) -> String {
    let sanitized_source = source_file_name
        .map(sanitize_file_name)
        .filter(|value| !value.is_empty());

    if let Some(file_name) = sanitized_source {
        return file_name;
    }

    match extension {
        Some(extension) if !extension.is_empty() => format!("{asset_id}.{extension}"),
        _ => asset_id.to_string(),
    }
}

fn sanitize_path_segment(value: &str) -> String {
    let sanitized = value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.') {
                character
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim_matches('_')
        .to_string();

    if sanitized.is_empty() {
        "default".to_string()
    } else {
        sanitized
    }
}

fn sanitize_file_name(value: &str) -> String {
    sanitize_path_segment(value)
}

fn relative_asset_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map(path_to_string)
        .unwrap_or_else(|_| path_to_string(path))
}

fn collect_removable_asset_paths(asset: &UnifiedDigitalAssetRecord) -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Some(replicas) = asset.storage.replicas.as_ref() {
        for replica in replicas {
            if let Some(path) = replica.path.as_deref() {
                let file_path = PathBuf::from(path);
                paths.push(file_path.clone());
                if let Some(parent) = file_path.parent() {
                    paths.push(parent.to_path_buf());
                }
            }
        }
    }

    paths
}

fn remove_path_if_exists(path: &Path) {
    match fs::metadata(path) {
        Ok(metadata) if metadata.is_dir() => remove_dir_if_exists(path),
        Ok(_) => match fs::remove_file(path) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(_) => {}
        },
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(_) => {}
    }
}

fn remove_dir_if_exists(path: &Path) {
    match fs::remove_dir_all(path) {
        Ok(()) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(_) => {}
    }
}

fn matches_asset_key(asset: &UnifiedDigitalAssetRecord, key: &str) -> bool {
    asset.id == key || asset.uuid == key || asset.asset_id == key
}

fn sort_assets(assets: &mut [UnifiedDigitalAssetRecord]) {
    assets.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn sort_assets_by_request(assets: &mut [UnifiedDigitalAssetRecord], sort: Option<&[String]>) {
    let orders = parse_sort_orders(sort);
    if orders.is_empty() {
        sort_assets(assets);
        return;
    }

    assets.sort_by(|left, right| {
        for order in &orders {
            let comparison = compare_asset_field(left, right, &order.field);
            if comparison != std::cmp::Ordering::Equal {
                return if order.ascending {
                    comparison
                } else {
                    comparison.reverse()
                };
            }
        }

        right.updated_at.cmp(&left.updated_at)
    });
}

fn parse_sort_orders(sort: Option<&[String]>) -> Vec<SortOrder> {
    sort.unwrap_or_default()
        .iter()
        .flat_map(|entry| {
            entry
                .split(';')
                .flat_map(|part| part.split('|'))
                .map(|part| part.trim().to_string())
                .collect::<Vec<_>>()
        })
        .filter_map(|entry| {
            if entry.is_empty() {
                return None;
            }
            let mut pieces = entry.split(',').map(str::trim);
            let field = pieces.next().unwrap_or_default();
            if field.is_empty() {
                return None;
            }
            let ascending = pieces
                .next()
                .map(|direction| direction.eq_ignore_ascii_case("asc"))
                .unwrap_or(false);
            Some(SortOrder {
                field: field.to_string(),
                ascending,
            })
        })
        .collect()
}

fn compare_asset_field(
    left: &UnifiedDigitalAssetRecord,
    right: &UnifiedDigitalAssetRecord,
    field: &str,
) -> std::cmp::Ordering {
    match field {
        "title" => left.title.to_lowercase().cmp(&right.title.to_lowercase()),
        "createdAt" => left.created_at.cmp(&right.created_at),
        "primaryType" => left.primary_type.as_str().cmp(right.primary_type.as_str()),
        "status" => format!("{:?}", left.status).cmp(&format!("{:?}", right.status)),
        _ => left.updated_at.cmp(&right.updated_at),
    }
}

fn resolve_asset_origin(asset: &UnifiedDigitalAssetRecord) -> Option<String> {
    if let Some(metadata) = asset.metadata.as_ref() {
        if let Some(origin) = metadata.get("origin").and_then(|value| value.as_str()) {
            return Some(origin.to_string());
        }
    }

    if let Some(resources) = asset
        .payload
        .get("assets")
        .and_then(|value| value.as_array())
    {
        for resource in resources {
            if let Some(origin) = resource.get("origin").and_then(|value| value.as_str()) {
                return Some(origin.to_string());
            }
            if let Some(origin) = resource
                .get("metadata")
                .and_then(|value| value.get("origin"))
                .and_then(|value| value.as_str())
            {
                return Some(origin.to_string());
            }
        }
    }

    None
}

fn next_entity_id(prefix: &str, counter: &AtomicU64) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = counter.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}

fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn path_to_uri_path(path: &Path) -> String {
    path_to_string(path).replace('\\', "/")
}
