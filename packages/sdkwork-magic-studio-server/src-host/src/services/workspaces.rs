use std::collections::HashSet;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use walkdir::WalkDir;
use zip::{write::SimpleFileOptions, ZipArchive};

use crate::contract::embedded_server_contract;
use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

const WORKSPACE_SCHEMA_VERSION: &str = "magic-studio.workspaces.v1";
const PROJECT_GIT_SYNCS_SCHEMA_VERSION: &str = "magic-studio.project-git-syncs.v1";
const PROJECT_RELEASES_SCHEMA_VERSION: &str = "magic-studio.project-releases.v1";
const PROJECT_RELEASE_RETENTION_POLICY_SCHEMA_VERSION: &str =
    "magic-studio.project-release-retention-policy.v1";
const PROJECT_METADATA_DIR_NAME: &str = ".magic-studio";
const DEFAULT_PROJECT_RELEASE_RETENTION_KEEP_LATEST_COUNT: u64 = 5;
const APP_WORKSPACE_PROJECTS_READ_RELEASE_ARTIFACT_ROUTE_ID: &str =
    "appWorkspaceProjectsReadReleaseArtifact";

static WORKSPACE_COUNTER: AtomicU64 = AtomicU64::new(1);
static PROJECT_COUNTER: AtomicU64 = AtomicU64::new(1);
static PROJECT_GIT_SYNC_COUNTER: AtomicU64 = AtomicU64::new(1);
static PROJECT_RELEASE_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectType {
    App,
    Video,
    Audio,
    Film,
    Canvas,
    Notes,
    Cut,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    #[serde(rename = "type")]
    pub project_type: ProjectType,
    pub description: String,
    pub workspace_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session: Option<ProjectSessionRecord>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub archived_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_opened_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSessionOpenFileRecord {
    pub path: String,
    #[serde(default)]
    pub is_preview: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSessionRecord {
    pub id: String,
    pub uuid: String,
    pub workspace_id: String,
    pub project_id: String,
    pub open_files: Vec<ProjectSessionOpenFileRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_file_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selected_path: Option<String>,
    #[serde(default)]
    pub expanded_paths: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSessionSnapshotRecord {
    pub session: Option<ProjectSessionRecord>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectGitSyncStatus {
    Succeeded,
    NoChanges,
    Failed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectReleaseStatus {
    Ready,
    Failed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectReleaseTarget {
    WebStatic,
    Vercel,
    Netlify,
    CloudflarePages,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectGitSyncRecord {
    pub id: String,
    pub uuid: String,
    pub workspace_id: String,
    pub project_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retry_of_sync_id: Option<String>,
    pub repository: String,
    pub branch: String,
    pub status: ProjectGitSyncStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub commit_hash: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub synced_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseRecord {
    pub id: String,
    pub uuid: String,
    pub workspace_id: String,
    pub project_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rebuild_of_release_id: Option<String>,
    pub app_name: String,
    pub version: String,
    pub target: ProjectReleaseTarget,
    pub status: ProjectReleaseStatus,
    pub artifact_file_name: String,
    pub artifact_path: String,
    pub checksum_sha1: String,
    pub size_bytes: u64,
    pub included_file_count: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectGitSyncRegistryDocument {
    pub schema_version: String,
    pub items: Vec<ProjectGitSyncRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectReleaseRegistryDocument {
    pub schema_version: String,
    pub items: Vec<ProjectReleaseRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectReleaseRetentionPolicyDocument {
    pub schema_version: String,
    pub policy: ProjectReleaseRetentionPolicyRecord,
}

#[derive(Debug, Clone)]
pub struct ProjectReleaseArtifactContent {
    pub bytes: Vec<u8>,
    pub file_name: String,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseManifestEntry {
    pub path: String,
    pub size_bytes: u64,
    pub checksum_sha1: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseManifestRecord {
    pub release: ProjectReleaseRecord,
    pub entries: Vec<ProjectReleaseManifestEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseStatsRecord {
    pub workspace_id: String,
    pub project_id: String,
    pub total_count: u64,
    pub active_count: u64,
    pub deleted_count: u64,
    pub total_size_bytes: u64,
    pub active_size_bytes: u64,
    pub deleted_size_bytes: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_release_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_active_release_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latest_deleted_release_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleasePruneResultRecord {
    pub workspace_id: String,
    pub project_id: String,
    pub dry_run: bool,
    pub pruned_release_ids: Vec<String>,
    pub pruned_count: u64,
    pub reclaimed_bytes: u64,
    pub remaining_stats: ProjectReleaseStatsRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseRetentionPolicyRecord {
    pub workspace_id: String,
    pub project_id: String,
    pub enabled: bool,
    pub keep_latest_count: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_deleted_count: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prune_deleted_older_than_days: Option<u64>,
    pub auto_apply_on_create: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_applied_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseRetentionPolicyApplyResultRecord {
    pub workspace_id: String,
    pub project_id: String,
    pub dry_run: bool,
    pub policy: ProjectReleaseRetentionPolicyRecord,
    pub deleted_release_ids: Vec<String>,
    pub pruned_release_ids: Vec<String>,
    pub deleted_count: u64,
    pub pruned_count: u64,
    pub reclaimed_bytes: u64,
    pub stats_before: ProjectReleaseStatsRecord,
    pub stats_after: ProjectReleaseStatsRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    pub description: String,
    pub projects: Vec<ProjectRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceRegistryDocument {
    pub schema_version: String,
    pub workspaces: Vec<WorkspaceRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceCreateInput {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceUpdateInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectCreateInput {
    pub name: String,
    #[serde(rename = "type")]
    pub project_type: ProjectType,
    pub description: Option<String>,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectUpdateInput {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub project_type: Option<ProjectType>,
    pub description: Option<String>,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSessionOpenFileInput {
    pub path: String,
    pub is_preview: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSessionUpsertInput {
    pub open_files: Vec<ProjectSessionOpenFileInput>,
    pub active_file_path: Option<String>,
    pub selected_path: Option<String>,
    pub expanded_paths: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectGitSyncInput {
    pub repository: String,
    pub branch: String,
    pub token: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectGitSyncRetryInput {
    pub token: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseCreateInput {
    pub app_name: String,
    pub version: String,
    pub target: ProjectReleaseTarget,
    pub auto_deploy: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleasePruneInput {
    pub dry_run: Option<bool>,
    pub release_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseRetentionPolicyInput {
    pub enabled: bool,
    pub keep_latest_count: u64,
    pub max_deleted_count: Option<u64>,
    pub prune_deleted_older_than_days: Option<u64>,
    pub auto_apply_on_create: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectReleaseRetentionPolicyApplyInput {
    pub dry_run: Option<bool>,
}

pub trait WorkspaceService: Send + Sync {
    fn list_workspaces(&self) -> ServerResult<Vec<WorkspaceRecord>>;
    fn create_workspace(&self, input: WorkspaceCreateInput) -> ServerResult<WorkspaceRecord>;
    fn read_workspace(&self, workspace_key: &str) -> ServerResult<WorkspaceRecord>;
    fn update_workspace(
        &self,
        workspace_key: &str,
        input: WorkspaceUpdateInput,
    ) -> ServerResult<WorkspaceRecord>;
    fn delete_workspace(&self, workspace_key: &str) -> ServerResult<bool>;
    fn list_projects(&self, workspace_key: &str) -> ServerResult<Vec<ProjectRecord>>;
    fn list_recent_projects(&self) -> ServerResult<Vec<ProjectRecord>>;
    fn create_project(
        &self,
        workspace_key: &str,
        input: ProjectCreateInput,
    ) -> ServerResult<ProjectRecord>;
    fn read_project(&self, workspace_key: &str, project_key: &str) -> ServerResult<ProjectRecord>;
    fn read_project_session(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectSessionSnapshotRecord>;
    fn update_project(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectUpdateInput,
    ) -> ServerResult<ProjectRecord>;
    fn upsert_project_session(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectSessionUpsertInput,
    ) -> ServerResult<ProjectSessionRecord>;
    fn delete_project_session(&self, workspace_key: &str, project_key: &str) -> ServerResult<bool>;
    fn sync_project_to_git(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectGitSyncInput,
    ) -> ServerResult<ProjectGitSyncRecord>;
    fn list_project_git_syncs(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<Vec<ProjectGitSyncRecord>>;
    fn read_latest_project_git_sync(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectGitSyncRecord>;
    fn read_project_git_sync(
        &self,
        workspace_key: &str,
        project_key: &str,
        sync_key: &str,
    ) -> ServerResult<ProjectGitSyncRecord>;
    fn retry_project_git_sync(
        &self,
        workspace_key: &str,
        project_key: &str,
        sync_key: &str,
        input: ProjectGitSyncRetryInput,
    ) -> ServerResult<ProjectGitSyncRecord>;
    fn list_project_releases(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<Vec<ProjectReleaseRecord>>;
    fn create_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleaseCreateInput,
    ) -> ServerResult<ProjectReleaseRecord>;
    fn read_latest_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectReleaseRecord>;
    fn read_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord>;
    fn delete_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord>;
    fn restore_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord>;
    fn read_project_release_stats(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectReleaseStatsRecord>;
    fn prune_project_releases(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleasePruneInput,
    ) -> ServerResult<ProjectReleasePruneResultRecord>;
    fn read_project_release_retention_policy(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectReleaseRetentionPolicyRecord>;
    fn update_project_release_retention_policy(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleaseRetentionPolicyInput,
    ) -> ServerResult<ProjectReleaseRetentionPolicyRecord>;
    fn apply_project_release_retention_policy(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleaseRetentionPolicyApplyInput,
    ) -> ServerResult<ProjectReleaseRetentionPolicyApplyResultRecord>;
    fn read_project_release_manifest(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseManifestRecord>;
    fn read_project_release_artifact(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseArtifactContent>;
    fn rebuild_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord>;
    fn open_project(&self, workspace_key: &str, project_key: &str) -> ServerResult<ProjectRecord>;
    fn duplicate_project(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectRecord>;
    fn archive_project(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectRecord>;
    fn restore_project(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectRecord>;
    fn delete_project(&self, workspace_key: &str, project_key: &str) -> ServerResult<bool>;
}

pub struct FileBackedWorkspaceService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedWorkspaceService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn default_document(&self) -> WorkspaceRegistryDocument {
        WorkspaceRegistryDocument {
            schema_version: WORKSPACE_SCHEMA_VERSION.to_string(),
            workspaces: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<WorkspaceRegistryDocument> {
        let path = self.storage_paths.workspaces_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_WORKSPACES_READ_FAILED",
                    format!(
                        "failed to read workspace registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<WorkspaceRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_WORKSPACES_PARSE_FAILED",
                    format!(
                        "failed to parse workspace registry {}: {error}",
                        path.display()
                    ),
                )
            })?;

        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &WorkspaceRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.workspaces_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_WORKSPACES_ROOT_CREATE_FAILED",
                format!(
                    "failed to create workspace root {}: {error}",
                    self.storage_paths.workspaces_root_dir().display()
                ),
            )
        })?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_WORKSPACES_SERIALIZE_FAILED",
                format!("failed to serialize workspace registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.workspaces_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_WORKSPACES_WRITE_FAILED",
                format!(
                    "failed to write workspace registry to {}: {error}",
                    self.storage_paths.workspaces_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut WorkspaceRegistryDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = WORKSPACE_SCHEMA_VERSION.to_string();
        }

        for workspace in &mut document.workspaces {
            self.normalize_workspace(workspace);
        }

        sort_workspaces(&mut document.workspaces);
    }

    fn normalize_workspace(&self, workspace: &mut WorkspaceRecord) {
        workspace.uuid = to_client_entity_uuid(&workspace.id);
        workspace.path = Some(path_to_string(&self.workspace_dir(&workspace.id)));
        workspace.icon = normalize_optional_text(workspace.icon.clone());

        for project in &mut workspace.projects {
            self.normalize_project(&workspace.id, project);
        }

        sort_projects(&mut workspace.projects);
    }

    fn normalize_project(&self, workspace_id: &str, project: &mut ProjectRecord) {
        project.uuid = to_client_entity_uuid(&project.id);
        project.workspace_id = to_client_entity_uuid(workspace_id);
        project.path = Some(path_to_string(&self.project_dir(workspace_id, &project.id)));
        project.thumbnail_url = normalize_optional_text(project.thumbnail_url.clone());
        if let Some(session) = &mut project.session {
            self.normalize_project_session(workspace_id, &project.id, session);
        }
        project.archived_at = normalize_optional_text(project.archived_at.clone());
        project.last_opened_at = normalize_optional_text(project.last_opened_at.clone());
    }

    fn normalize_project_session(
        &self,
        workspace_id: &str,
        project_id: &str,
        session: &mut ProjectSessionRecord,
    ) {
        session.id = project_session_id(project_id);
        session.uuid = to_client_entity_uuid(&session.id);
        session.workspace_id = to_client_entity_uuid(workspace_id);
        session.project_id = to_client_entity_uuid(project_id);
        session.open_files = normalize_session_open_files(session.open_files.clone());
        session.active_file_path =
            normalize_optional_session_relative_path(session.active_file_path.clone());
        session.selected_path =
            normalize_optional_session_relative_path(session.selected_path.clone());
        session.expanded_paths =
            normalize_session_relative_path_list(session.expanded_paths.clone());
    }

    fn workspaces_root_dir(&self) -> PathBuf {
        self.storage_paths.workspaces_root_dir().to_path_buf()
    }

    fn workspace_dir(&self, workspace_id: &str) -> PathBuf {
        self.workspaces_root_dir().join(workspace_id)
    }

    fn workspace_projects_dir(&self, workspace_id: &str) -> PathBuf {
        self.workspace_dir(workspace_id).join("projects")
    }

    fn project_dir(&self, workspace_id: &str, project_id: &str) -> PathBuf {
        self.workspace_projects_dir(workspace_id).join(project_id)
    }

    fn workspace_metadata_dir(&self, workspace_id: &str) -> PathBuf {
        self.workspace_dir(workspace_id)
            .join(PROJECT_METADATA_DIR_NAME)
    }

    fn workspace_project_metadata_root_dir(&self, workspace_id: &str) -> PathBuf {
        self.workspace_metadata_dir(workspace_id).join("projects")
    }

    fn create_workspace_directories(&self, workspace_id: &str) -> ServerResult<()> {
        fs::create_dir_all(self.workspace_projects_dir(workspace_id)).map_err(|error| {
            ServerError::internal(
                "WORKSPACE_DIRECTORY_CREATE_FAILED",
                format!(
                    "failed to create workspace directory {}: {error}",
                    self.workspace_dir(workspace_id).display()
                ),
            )
        })
    }

    fn create_project_directory(&self, workspace_id: &str, project_id: &str) -> ServerResult<()> {
        fs::create_dir_all(self.project_dir(workspace_id, project_id)).map_err(|error| {
            ServerError::internal(
                "PROJECT_DIRECTORY_CREATE_FAILED",
                format!(
                    "failed to create project directory {}: {error}",
                    self.project_dir(workspace_id, project_id).display()
                ),
            )
        })
    }

    fn project_metadata_dir(&self, workspace_id: &str, project_id: &str) -> PathBuf {
        self.workspace_project_metadata_root_dir(workspace_id)
            .join(project_id)
    }

    fn project_git_syncs_file(&self, workspace_id: &str, project_id: &str) -> PathBuf {
        self.project_metadata_dir(workspace_id, project_id)
            .join("git-syncs.json")
    }

    fn project_releases_file(&self, workspace_id: &str, project_id: &str) -> PathBuf {
        self.project_metadata_dir(workspace_id, project_id)
            .join("releases.json")
    }

    fn project_release_retention_policy_file(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> PathBuf {
        self.project_metadata_dir(workspace_id, project_id)
            .join("release-retention-policy.json")
    }

    fn project_release_output_root_dir(&self, workspace_id: &str, project_id: &str) -> PathBuf {
        self.storage_paths
            .generated_outputs_root_dir()
            .join("workspaces")
            .join("releases")
            .join(workspace_id)
            .join(project_id)
    }

    fn project_release_output_dir(
        &self,
        workspace_id: &str,
        project_id: &str,
        release_id: &str,
    ) -> PathBuf {
        self.project_release_output_root_dir(workspace_id, project_id)
            .join(release_id)
    }

    fn project_release_artifact_file_path(
        &self,
        workspace_id: &str,
        project_id: &str,
        release_id: &str,
        artifact_file_name: &str,
    ) -> PathBuf {
        self.project_release_output_dir(workspace_id, project_id, release_id)
            .join(artifact_file_name)
    }

    fn ensure_project_metadata_dir(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ServerResult<()> {
        fs::create_dir_all(self.project_metadata_dir(workspace_id, project_id)).map_err(|error| {
            ServerError::internal(
                "PROJECT_METADATA_DIRECTORY_CREATE_FAILED",
                format!(
                    "failed to create project metadata directory {}: {error}",
                    self.project_metadata_dir(workspace_id, project_id)
                        .display()
                ),
            )
        })
    }

    fn default_project_git_sync_registry(&self) -> ProjectGitSyncRegistryDocument {
        ProjectGitSyncRegistryDocument {
            schema_version: PROJECT_GIT_SYNCS_SCHEMA_VERSION.to_string(),
            items: Vec::new(),
        }
    }

    fn default_project_release_registry(&self) -> ProjectReleaseRegistryDocument {
        ProjectReleaseRegistryDocument {
            schema_version: PROJECT_RELEASES_SCHEMA_VERSION.to_string(),
            items: Vec::new(),
        }
    }

    fn default_project_release_retention_policy(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ProjectReleaseRetentionPolicyRecord {
        ProjectReleaseRetentionPolicyRecord {
            workspace_id: workspace_id.to_string(),
            project_id: project_id.to_string(),
            enabled: false,
            keep_latest_count: DEFAULT_PROJECT_RELEASE_RETENTION_KEEP_LATEST_COUNT,
            max_deleted_count: None,
            prune_deleted_older_than_days: None,
            auto_apply_on_create: false,
            created_at: None,
            updated_at: None,
            last_applied_at: None,
        }
    }

    fn normalize_project_git_sync_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        record: &mut ProjectGitSyncRecord,
    ) {
        record.uuid = to_client_entity_uuid(&record.id);
        record.workspace_id = to_client_entity_uuid(workspace_id);
        record.project_id = to_client_entity_uuid(project_id);
        record.retry_of_sync_id = normalize_optional_text(record.retry_of_sync_id.clone());
        record.repository = record.repository.trim().to_string();
        record.branch = record.branch.trim().to_string();
        record.commit_hash = normalize_optional_text(record.commit_hash.clone());
        record.message = normalize_optional_text(record.message.clone());
        record.synced_at = normalize_optional_text(record.synced_at.clone());
        record.error_message = normalize_optional_text(record.error_message.clone());
        record.deleted_at = normalize_optional_text(record.deleted_at.clone());
    }

    fn normalize_project_release_retention_policy_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        record: &mut ProjectReleaseRetentionPolicyRecord,
    ) {
        record.workspace_id = workspace_id.to_string();
        record.project_id = project_id.to_string();
        if record.keep_latest_count == 0 {
            record.keep_latest_count = DEFAULT_PROJECT_RELEASE_RETENTION_KEEP_LATEST_COUNT;
        }
        record.prune_deleted_older_than_days = record
            .prune_deleted_older_than_days
            .and_then(|days| if days == 0 { None } else { Some(days) });
        record.created_at = normalize_optional_text(record.created_at.clone());
        record.updated_at = normalize_optional_text(record.updated_at.clone());
        record.last_applied_at = normalize_optional_text(record.last_applied_at.clone());
    }

    fn normalize_project_release_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        record: &mut ProjectReleaseRecord,
    ) {
        record.uuid = to_client_entity_uuid(&record.id);
        record.workspace_id = to_client_entity_uuid(workspace_id);
        record.project_id = to_client_entity_uuid(project_id);
        record.rebuild_of_release_id =
            normalize_optional_text(record.rebuild_of_release_id.clone());
        record.app_name = record.app_name.trim().to_string();
        record.version = record.version.trim().to_string();
        record.artifact_file_name = record.artifact_file_name.trim().to_string();
        record.artifact_path =
            build_project_release_artifact_api_path(workspace_id, project_id, &record.id);
        record.checksum_sha1 = record.checksum_sha1.trim().to_ascii_lowercase();
        record.error_message = normalize_optional_text(record.error_message.clone());
        record.deleted_at = normalize_optional_text(record.deleted_at.clone());
    }

    fn load_project_git_sync_registry(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ServerResult<ProjectGitSyncRegistryDocument> {
        let path = self.project_git_syncs_file(workspace_id, project_id);
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_project_git_sync_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "PROJECT_GIT_SYNCS_READ_FAILED",
                    format!(
                        "failed to read project git sync registry {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<ProjectGitSyncRegistryDocument>(&contents)
            .map_err(|error| {
                ServerError::internal(
                    "PROJECT_GIT_SYNCS_PARSE_FAILED",
                    format!(
                        "failed to parse project git sync registry {}: {error}",
                        path.display()
                    ),
                )
            })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version = PROJECT_GIT_SYNCS_SCHEMA_VERSION.to_string();
        }
        for item in &mut document.items {
            self.normalize_project_git_sync_record(workspace_id, project_id, item);
        }
        sort_project_git_syncs(&mut document.items);
        Ok(document)
    }

    fn persist_project_git_sync_registry(
        &self,
        workspace_id: &str,
        project_id: &str,
        document: &ProjectGitSyncRegistryDocument,
    ) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        self.ensure_project_metadata_dir(workspace_id, project_id)?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "PROJECT_GIT_SYNCS_SERIALIZE_FAILED",
                format!("failed to serialize project git sync registry: {error}"),
            )
        })?;

        fs::write(
            self.project_git_syncs_file(workspace_id, project_id),
            contents,
        )
        .map_err(|error| {
            ServerError::internal(
                "PROJECT_GIT_SYNCS_WRITE_FAILED",
                format!(
                    "failed to write project git sync registry to {}: {error}",
                    self.project_git_syncs_file(workspace_id, project_id)
                        .display()
                ),
            )
        })
    }

    fn load_project_release_registry(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ServerResult<ProjectReleaseRegistryDocument> {
        let path = self.project_releases_file(workspace_id, project_id);
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_project_release_registry())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "PROJECT_RELEASES_READ_FAILED",
                    format!(
                        "failed to read project release registry {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<ProjectReleaseRegistryDocument>(&contents)
            .map_err(|error| {
                ServerError::internal(
                    "PROJECT_RELEASES_PARSE_FAILED",
                    format!(
                        "failed to parse project release registry {}: {error}",
                        path.display()
                    ),
                )
            })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version = PROJECT_RELEASES_SCHEMA_VERSION.to_string();
        }
        for item in &mut document.items {
            self.normalize_project_release_record(workspace_id, project_id, item);
        }
        sort_project_releases(&mut document.items);
        Ok(document)
    }

    fn persist_project_release_registry(
        &self,
        workspace_id: &str,
        project_id: &str,
        document: &ProjectReleaseRegistryDocument,
    ) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        self.ensure_project_metadata_dir(workspace_id, project_id)?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASES_SERIALIZE_FAILED",
                format!("failed to serialize project release registry: {error}"),
            )
        })?;

        fs::write(
            self.project_releases_file(workspace_id, project_id),
            contents,
        )
        .map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASES_WRITE_FAILED",
                format!(
                    "failed to write project release registry to {}: {error}",
                    self.project_releases_file(workspace_id, project_id)
                        .display()
                ),
            )
        })
    }

    fn load_project_release_retention_policy(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ServerResult<(ProjectReleaseRetentionPolicyRecord, bool)> {
        let path = self.project_release_retention_policy_file(workspace_id, project_id);
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok((
                    self.default_project_release_retention_policy(workspace_id, project_id),
                    false,
                ));
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "PROJECT_RELEASE_RETENTION_POLICY_READ_FAILED",
                    format!(
                        "failed to read project release retention policy {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<ProjectReleaseRetentionPolicyDocument>(&contents)
            .map_err(|error| {
                ServerError::internal(
                    "PROJECT_RELEASE_RETENTION_POLICY_PARSE_FAILED",
                    format!(
                        "failed to parse project release retention policy {}: {error}",
                        path.display()
                    ),
                )
            })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version = PROJECT_RELEASE_RETENTION_POLICY_SCHEMA_VERSION.to_string();
        }
        self.normalize_project_release_retention_policy_record(
            workspace_id,
            project_id,
            &mut document.policy,
        );
        Ok((document.policy, true))
    }

    fn persist_project_release_retention_policy(
        &self,
        workspace_id: &str,
        project_id: &str,
        record: &ProjectReleaseRetentionPolicyRecord,
    ) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        self.ensure_project_metadata_dir(workspace_id, project_id)?;

        let document = ProjectReleaseRetentionPolicyDocument {
            schema_version: PROJECT_RELEASE_RETENTION_POLICY_SCHEMA_VERSION.to_string(),
            policy: record.clone(),
        };
        let contents = serde_json::to_vec_pretty(&document).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_RETENTION_POLICY_SERIALIZE_FAILED",
                format!("failed to serialize project release retention policy: {error}"),
            )
        })?;

        fs::write(
            self.project_release_retention_policy_file(workspace_id, project_id),
            contents,
        )
        .map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_RETENTION_POLICY_WRITE_FAILED",
                format!(
                    "failed to write project release retention policy to {}: {error}",
                    self.project_release_retention_policy_file(workspace_id, project_id)
                        .display()
                ),
            )
        })
    }

    fn find_project_git_sync_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        sync_key: &str,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let normalized_sync_key =
            require_non_empty_text(sync_key, "PROJECT_GIT_SYNC_ID_EMPTY", "syncId")?;
        let registry = self.load_project_git_sync_registry(workspace_id, project_id)?;
        registry
            .items
            .into_iter()
            .find(|sync| sync.id == normalized_sync_key || sync.uuid == normalized_sync_key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "PROJECT_GIT_SYNC_NOT_FOUND",
                    format!("project git sync {normalized_sync_key} was not found"),
                )
            })
    }

    fn latest_project_git_sync_record(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let registry = self.load_project_git_sync_registry(workspace_id, project_id)?;
        registry.items.into_iter().next().ok_or_else(|| {
            ServerError::not_found(
                "PROJECT_GIT_SYNC_NOT_FOUND",
                format!(
                    "no project git sync records were found for workspace {} project {}",
                    workspace_id, project_id
                ),
            )
        })
    }

    fn find_project_release_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let normalized_release_key =
            require_non_empty_text(release_key, "PROJECT_RELEASE_ID_EMPTY", "releaseId")?;
        let registry = self.load_project_release_registry(workspace_id, project_id)?;
        registry
            .items
            .into_iter()
            .find(|release| {
                release.id == normalized_release_key || release.uuid == normalized_release_key
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "PROJECT_RELEASE_NOT_FOUND",
                    format!("project release {normalized_release_key} was not found"),
                )
            })
    }

    fn latest_active_project_release_record(
        &self,
        workspace_id: &str,
        project_id: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let registry = self.load_project_release_registry(workspace_id, project_id)?;
        registry
            .items
            .into_iter()
            .find(|release| release.deleted_at.is_none())
            .ok_or_else(|| {
                ServerError::not_found(
                    "PROJECT_RELEASE_NOT_FOUND",
                    format!(
                        "no active project releases were found for workspace {} project {}",
                        workspace_id, project_id
                    ),
                )
            })
    }

    fn build_project_release_stats_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        records: &[ProjectReleaseRecord],
    ) -> ProjectReleaseStatsRecord {
        let mut total_size_bytes = 0_u64;
        let mut active_size_bytes = 0_u64;
        let mut deleted_size_bytes = 0_u64;
        let mut active_count = 0_u64;
        let mut deleted_count = 0_u64;

        for record in records {
            total_size_bytes += record.size_bytes;
            if record.deleted_at.is_some() {
                deleted_count += 1;
                deleted_size_bytes += record.size_bytes;
            } else {
                active_count += 1;
                active_size_bytes += record.size_bytes;
            }
        }

        ProjectReleaseStatsRecord {
            workspace_id: to_client_entity_uuid(workspace_id),
            project_id: to_client_entity_uuid(project_id),
            total_count: records.len() as u64,
            active_count,
            deleted_count,
            total_size_bytes,
            active_size_bytes,
            deleted_size_bytes,
            latest_release_id: records.first().map(|record| record.id.clone()),
            latest_active_release_id: records
                .iter()
                .find(|record| record.deleted_at.is_none())
                .map(|record| record.id.clone()),
            latest_deleted_release_id: records
                .iter()
                .find(|record| record.deleted_at.is_some())
                .map(|record| record.id.clone()),
        }
    }

    fn resolve_project_release_prune_candidates(
        &self,
        records: &[ProjectReleaseRecord],
        release_ids: Option<Vec<String>>,
    ) -> ServerResult<Vec<ProjectReleaseRecord>> {
        let Some(release_ids) = release_ids else {
            return Ok(records
                .iter()
                .filter(|record| record.deleted_at.is_some())
                .cloned()
                .collect());
        };

        if release_ids.is_empty() {
            return Err(ServerError::bad_request(
                "PROJECT_RELEASE_PRUNE_IDS_EMPTY",
                "releaseIds must contain at least one release id when provided",
            ));
        }

        let mut candidates = Vec::new();
        for release_key in release_ids {
            let normalized_release_key =
                require_non_empty_text(&release_key, "PROJECT_RELEASE_ID_EMPTY", "releaseIds")?;
            let Some(record) = records.iter().find(|record| {
                record.id == normalized_release_key || record.uuid == normalized_release_key
            }) else {
                return Err(ServerError::not_found(
                    "PROJECT_RELEASE_NOT_FOUND",
                    format!("project release {normalized_release_key} was not found"),
                ));
            };

            if record.deleted_at.is_none() {
                return Err(ServerError::bad_request(
                    "PROJECT_RELEASE_PRUNE_REQUIRES_DELETED_RELEASE",
                    format!(
                        "project release {} must be soft-deleted before prune",
                        record.id
                    ),
                ));
            }

            if candidates
                .iter()
                .any(|candidate: &ProjectReleaseRecord| candidate.id == record.id)
            {
                continue;
            }

            candidates.push(record.clone());
        }

        Ok(candidates)
    }

    fn build_project_release_retention_policy_response(
        &self,
        workspace_id: &str,
        project_id: &str,
        record: &ProjectReleaseRetentionPolicyRecord,
    ) -> ProjectReleaseRetentionPolicyRecord {
        let mut response = record.clone();
        self.normalize_project_release_retention_policy_record(
            workspace_id,
            project_id,
            &mut response,
        );
        response.workspace_id = to_client_entity_uuid(workspace_id);
        response.project_id = to_client_entity_uuid(project_id);
        response
    }

    fn build_project_release_retention_policy_record(
        &self,
        workspace_id: &str,
        project_id: &str,
        input: ProjectReleaseRetentionPolicyInput,
        existing: Option<ProjectReleaseRetentionPolicyRecord>,
    ) -> ServerResult<ProjectReleaseRetentionPolicyRecord> {
        if input.keep_latest_count == 0 {
            return Err(ServerError::bad_request(
                "PROJECT_RELEASE_RETENTION_KEEP_LATEST_COUNT_INVALID",
                "keepLatestCount must be greater than 0",
            ));
        }

        if matches!(input.prune_deleted_older_than_days, Some(0)) {
            return Err(ServerError::bad_request(
                "PROJECT_RELEASE_RETENTION_PRUNE_DAYS_INVALID",
                "pruneDeletedOlderThanDays must be greater than 0 when provided",
            ));
        }

        let timestamp = current_timestamp();
        let mut record = existing.unwrap_or_else(|| {
            self.default_project_release_retention_policy(workspace_id, project_id)
        });
        record.workspace_id = workspace_id.to_string();
        record.project_id = project_id.to_string();
        record.enabled = input.enabled;
        record.keep_latest_count = input.keep_latest_count;
        record.max_deleted_count = input.max_deleted_count;
        record.prune_deleted_older_than_days = input.prune_deleted_older_than_days;
        record.auto_apply_on_create = input.auto_apply_on_create;
        record.created_at = record.created_at.or_else(|| Some(timestamp.clone()));
        record.updated_at = Some(timestamp);
        Ok(record)
    }

    fn resolve_project_release_retention_prune_candidates(
        &self,
        policy: &ProjectReleaseRetentionPolicyRecord,
        originally_deleted_records: &[ProjectReleaseRecord],
        newly_deleted_count: usize,
        applied_at: &OffsetDateTime,
    ) -> ServerResult<Vec<ProjectReleaseRecord>> {
        let mut candidates = Vec::new();
        let mut candidate_ids = HashSet::new();

        if let Some(days) = policy.prune_deleted_older_than_days {
            let cutoff = *applied_at - Duration::days(days as i64);
            for record in originally_deleted_records {
                let Some(deleted_at) = record.deleted_at.as_deref() else {
                    continue;
                };
                let deleted_at = OffsetDateTime::parse(deleted_at, &Rfc3339).map_err(|error| {
                    ServerError::internal(
                        "PROJECT_RELEASE_RETENTION_POLICY_TIMESTAMP_INVALID",
                        format!(
                            "failed to parse deletedAt for project release {}: {error}",
                            record.id
                        ),
                    )
                })?;

                if deleted_at <= cutoff && candidate_ids.insert(record.id.clone()) {
                    candidates.push(record.clone());
                }
            }
        }

        if let Some(max_deleted_count) = policy.max_deleted_count {
            let total_deleted_after_soft_delete = originally_deleted_records
                .len()
                .saturating_add(newly_deleted_count);
            let overflow =
                total_deleted_after_soft_delete.saturating_sub(max_deleted_count as usize);
            if overflow > 0 {
                let mut deleted_records = originally_deleted_records.to_vec();
                deleted_records.sort_by(|left, right| {
                    left.deleted_at
                        .as_deref()
                        .unwrap_or("")
                        .cmp(right.deleted_at.as_deref().unwrap_or(""))
                        .then_with(|| left.updated_at.cmp(&right.updated_at))
                        .then_with(|| left.id.cmp(&right.id))
                });
                for record in deleted_records.into_iter().take(overflow) {
                    if candidate_ids.insert(record.id.clone()) {
                        candidates.push(record);
                    }
                }
            }
        }

        Ok(candidates)
    }

    fn apply_project_release_retention_policy_internal(
        &self,
        workspace_id: &str,
        project_id: &str,
        dry_run: bool,
    ) -> ServerResult<ProjectReleaseRetentionPolicyApplyResultRecord> {
        let (mut policy, policy_exists) =
            self.load_project_release_retention_policy(workspace_id, project_id)?;
        let mut registry = self.load_project_release_registry(workspace_id, project_id)?;
        let stats_before =
            self.build_project_release_stats_record(workspace_id, project_id, &registry.items);
        let mut deleted_release_ids = Vec::new();
        let mut pruned_release_ids = Vec::new();
        let mut reclaimed_bytes = 0_u64;

        if policy.enabled {
            let originally_deleted_records = registry
                .items
                .iter()
                .filter(|record| record.deleted_at.is_some())
                .cloned()
                .collect::<Vec<_>>();
            let applied_at_text = current_timestamp();
            let applied_at =
                OffsetDateTime::parse(&applied_at_text, &Rfc3339).map_err(|error| {
                    ServerError::internal(
                        "PROJECT_RELEASE_RETENTION_POLICY_TIMESTAMP_INVALID",
                        format!("failed to parse retention apply timestamp: {error}"),
                    )
                })?;

            deleted_release_ids = registry
                .items
                .iter()
                .filter(|record| record.deleted_at.is_none())
                .skip(policy.keep_latest_count as usize)
                .map(|record| record.id.clone())
                .collect::<Vec<_>>();

            if !deleted_release_ids.is_empty() {
                let deleted_id_set = deleted_release_ids
                    .iter()
                    .cloned()
                    .collect::<HashSet<String>>();
                for record in &mut registry.items {
                    if deleted_id_set.contains(&record.id) {
                        record.deleted_at = Some(applied_at_text.clone());
                        record.updated_at = applied_at_text.clone();
                    }
                }
            }

            let prune_candidates = self.resolve_project_release_retention_prune_candidates(
                &policy,
                &originally_deleted_records,
                deleted_release_ids.len(),
                &applied_at,
            )?;
            pruned_release_ids = prune_candidates
                .iter()
                .map(|record| record.id.clone())
                .collect::<Vec<_>>();
            reclaimed_bytes = prune_candidates
                .iter()
                .map(|record| record.size_bytes)
                .sum::<u64>();

            let pruned_id_set = pruned_release_ids
                .iter()
                .cloned()
                .collect::<HashSet<String>>();
            registry.items = registry
                .items
                .into_iter()
                .filter(|record| !pruned_id_set.contains(&record.id))
                .collect::<Vec<_>>();
            sort_project_releases(&mut registry.items);

            if !dry_run {
                self.persist_project_release_registry(workspace_id, project_id, &registry)?;
                self.cleanup_orphaned_project_release_output_dirs(
                    workspace_id,
                    project_id,
                    &registry
                        .items
                        .iter()
                        .map(|record| record.id.clone())
                        .collect::<Vec<_>>(),
                );

                if policy_exists {
                    policy.last_applied_at = Some(applied_at_text);
                    self.persist_project_release_retention_policy(
                        workspace_id,
                        project_id,
                        &policy,
                    )?;
                }
            }
        }

        let stats_after =
            self.build_project_release_stats_record(workspace_id, project_id, &registry.items);
        let policy =
            self.build_project_release_retention_policy_response(workspace_id, project_id, &policy);

        Ok(ProjectReleaseRetentionPolicyApplyResultRecord {
            workspace_id: to_client_entity_uuid(workspace_id),
            project_id: to_client_entity_uuid(project_id),
            dry_run,
            policy,
            deleted_release_ids: deleted_release_ids.clone(),
            pruned_release_ids: pruned_release_ids.clone(),
            deleted_count: deleted_release_ids.len() as u64,
            pruned_count: pruned_release_ids.len() as u64,
            reclaimed_bytes,
            stats_before,
            stats_after,
        })
    }

    fn execute_project_git_sync_and_persist(
        &self,
        workspace: &WorkspaceRecord,
        project: &ProjectRecord,
        repository: String,
        branch: String,
        token: Option<String>,
        message: Option<String>,
        retry_of_sync_id: Option<String>,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let repository = require_non_empty_text(
            &repository,
            "PROJECT_GIT_SYNC_REPOSITORY_EMPTY",
            "repository",
        )?;
        let branch = require_non_empty_text(&branch, "PROJECT_GIT_SYNC_BRANCH_EMPTY", "branch")?;
        let token = normalize_optional_text(token);
        let message = normalize_optional_text(message)
            .unwrap_or_else(|| "chore: sync project from Magic Studio".to_string());
        let retry_of_sync_id = normalize_optional_text(retry_of_sync_id);
        let remote_target = resolve_git_remote_target(&repository, token.as_deref())?;
        let sync_id = next_entity_id("project-git-sync", &PROJECT_GIT_SYNC_COUNTER);
        let timestamp = current_timestamp();
        let project_dir = self.project_dir(&workspace.id, &project.id);
        let sync_result =
            execute_project_git_sync(&project_dir, &remote_target.push_url, &branch, &message);

        let mut record = ProjectGitSyncRecord {
            id: sync_id.clone(),
            uuid: to_client_entity_uuid(&sync_id),
            workspace_id: workspace.id.clone(),
            project_id: project.id.clone(),
            retry_of_sync_id,
            repository: remote_target.public_url,
            branch,
            status: ProjectGitSyncStatus::Failed,
            commit_hash: None,
            message: Some(message),
            synced_at: None,
            error_message: None,
            created_at: timestamp.clone(),
            updated_at: timestamp.clone(),
            deleted_at: None,
        };

        let mut registry = self.load_project_git_sync_registry(&workspace.id, &project.id)?;
        match sync_result {
            Ok(outcome) => {
                record.status = outcome.status;
                record.commit_hash = Some(outcome.commit_hash);
                record.synced_at = Some(timestamp);
            }
            Err(error) => {
                record.error_message = Some(build_project_git_sync_error_message(&error));
                self.normalize_project_git_sync_record(&workspace.id, &project.id, &mut record);
                registry.items.push(record);
                sort_project_git_syncs(&mut registry.items);
                self.persist_project_git_sync_registry(&workspace.id, &project.id, &registry)?;
                return Err(error);
            }
        }

        self.normalize_project_git_sync_record(&workspace.id, &project.id, &mut record);
        registry.items.push(record.clone());
        sort_project_git_syncs(&mut registry.items);
        self.persist_project_git_sync_registry(&workspace.id, &project.id, &registry)?;
        Ok(record)
    }

    fn package_project_release(
        &self,
        workspace: &WorkspaceRecord,
        project: &ProjectRecord,
        input: ProjectReleaseCreateInput,
        rebuild_of_release_id: Option<String>,
    ) -> ServerResult<ProjectReleaseRecord> {
        let app_name =
            require_non_empty_text(&input.app_name, "PROJECT_RELEASE_APP_NAME_EMPTY", "appName")?;
        let version =
            require_non_empty_text(&input.version, "PROJECT_RELEASE_VERSION_EMPTY", "version")?;
        let release_id = next_entity_id("project-release", &PROJECT_RELEASE_COUNTER);
        let artifact_file_name = build_project_release_artifact_file_name(&app_name, &version);
        let artifact_path = self.project_release_artifact_file_path(
            &workspace.id,
            &project.id,
            &release_id,
            &artifact_file_name,
        );
        let release_output_dir =
            self.project_release_output_dir(&workspace.id, &project.id, &release_id);
        fs::create_dir_all(&release_output_dir).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_DIRECTORY_CREATE_FAILED",
                format!(
                    "failed to create project release directory {}: {error}",
                    release_output_dir.display()
                ),
            )
        })?;

        let included_file_count = match create_project_release_archive(
            &self.project_dir(&workspace.id, &project.id),
            &artifact_path,
        ) {
            Ok(count) => count,
            Err(error) => {
                remove_dir_if_exists(&release_output_dir);
                return Err(error);
            }
        };

        let artifact_bytes = match fs::read(&artifact_path) {
            Ok(bytes) => bytes,
            Err(error) => {
                remove_dir_if_exists(&release_output_dir);
                return Err(ServerError::internal(
                    "PROJECT_RELEASE_ARTIFACT_READ_FAILED",
                    format!(
                        "failed to read project release artifact {}: {error}",
                        artifact_path.display()
                    ),
                ));
            }
        };

        let checksum_sha1 = format!("{:x}", Sha1::digest(&artifact_bytes));
        let timestamp = current_timestamp();
        let _auto_deploy_requested = input.auto_deploy.unwrap_or(false);
        let mut record = ProjectReleaseRecord {
            id: release_id.clone(),
            uuid: to_client_entity_uuid(&release_id),
            workspace_id: workspace.id.clone(),
            project_id: project.id.clone(),
            rebuild_of_release_id,
            app_name,
            version,
            target: input.target,
            status: ProjectReleaseStatus::Ready,
            artifact_file_name,
            artifact_path: build_project_release_artifact_api_path(
                &workspace.id,
                &project.id,
                &release_id,
            ),
            checksum_sha1,
            size_bytes: artifact_bytes.len() as u64,
            included_file_count: included_file_count as u64,
            error_message: None,
            created_at: timestamp.clone(),
            updated_at: timestamp,
            deleted_at: None,
        };
        self.normalize_project_release_record(&workspace.id, &project.id, &mut record);

        let mut registry = self.load_project_release_registry(&workspace.id, &project.id)?;
        registry.items.push(record.clone());
        sort_project_releases(&mut registry.items);
        if let Err(error) =
            self.persist_project_release_registry(&workspace.id, &project.id, &registry)
        {
            remove_dir_if_exists(&release_output_dir);
            return Err(error);
        }

        let (policy, _) = self.load_project_release_retention_policy(&workspace.id, &project.id)?;
        if policy.enabled && policy.auto_apply_on_create {
            // Release creation remains authoritative even if follow-up retention cleanup fails.
            let _ = self.apply_project_release_retention_policy_internal(
                &workspace.id,
                &project.id,
                false,
            );
        }

        Ok(record)
    }

    fn set_project_release_deleted_state(
        &self,
        workspace_id: &str,
        project_id: &str,
        release_key: &str,
        deleted: bool,
    ) -> ServerResult<ProjectReleaseRecord> {
        let normalized_release_key =
            require_non_empty_text(release_key, "PROJECT_RELEASE_ID_EMPTY", "releaseId")?;
        let mut registry = self.load_project_release_registry(workspace_id, project_id)?;
        let Some(release_index) = registry.items.iter().position(|release| {
            release.id == normalized_release_key || release.uuid == normalized_release_key
        }) else {
            return Err(ServerError::not_found(
                "PROJECT_RELEASE_NOT_FOUND",
                format!("project release {normalized_release_key} was not found"),
            ));
        };

        let record = &mut registry.items[release_index];
        if deleted == record.deleted_at.is_some() {
            self.normalize_project_release_record(workspace_id, project_id, record);
            return Ok(record.clone());
        }

        let timestamp = current_timestamp();
        record.deleted_at = if deleted {
            Some(timestamp.clone())
        } else {
            None
        };
        record.updated_at = timestamp;
        self.normalize_project_release_record(workspace_id, project_id, record);
        let response = record.clone();
        sort_project_releases(&mut registry.items);
        self.persist_project_release_registry(workspace_id, project_id, &registry)?;
        Ok(response)
    }

    fn cleanup_orphaned_project_release_output_dirs(
        &self,
        workspace_id: &str,
        project_id: &str,
        retained_release_ids: &[String],
    ) {
        let output_root = self.project_release_output_root_dir(workspace_id, project_id);
        let Ok(entries) = fs::read_dir(&output_root) else {
            return;
        };

        for entry in entries.flatten() {
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            if !file_type.is_dir() {
                continue;
            }

            let release_id = entry.file_name().to_string_lossy().to_string();
            if retained_release_ids
                .iter()
                .any(|retained_release_id| retained_release_id == &release_id)
            {
                continue;
            }

            remove_dir_if_exists(&entry.path());
        }
    }

    fn read_workspace_record<'a>(
        &self,
        workspaces: &'a [WorkspaceRecord],
        workspace_key: &str,
    ) -> ServerResult<&'a WorkspaceRecord> {
        let normalized_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;

        workspaces
            .iter()
            .find(|workspace| matches_workspace_key(workspace, &normalized_key))
            .ok_or_else(|| {
                ServerError::not_found(
                    "WORKSPACE_NOT_FOUND",
                    format!("workspace {normalized_key} was not found"),
                )
            })
    }

    fn read_workspace_record_mut<'a>(
        &self,
        workspaces: &'a mut [WorkspaceRecord],
        workspace_key: &str,
    ) -> ServerResult<&'a mut WorkspaceRecord> {
        let normalized_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;

        workspaces
            .iter_mut()
            .find(|workspace| matches_workspace_key(workspace, &normalized_key))
            .ok_or_else(|| {
                ServerError::not_found(
                    "WORKSPACE_NOT_FOUND",
                    format!("workspace {normalized_key} was not found"),
                )
            })
    }

    fn read_project_record<'a>(
        &self,
        workspace: &'a WorkspaceRecord,
        project_key: &str,
    ) -> ServerResult<&'a ProjectRecord> {
        let normalized_key = require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;

        workspace
            .projects
            .iter()
            .find(|project| matches_project_key(project, &normalized_key))
            .ok_or_else(|| {
                ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_key} was not found"),
                )
            })
    }

    fn read_project_snapshot(
        &self,
        document: &WorkspaceRegistryDocument,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<(WorkspaceRecord, ProjectRecord)> {
        let workspace = self
            .read_workspace_record(&document.workspaces, workspace_key)?
            .clone();
        let project = self.read_project_record(&workspace, project_key)?.clone();
        Ok((workspace, project))
    }
}

impl WorkspaceService for FileBackedWorkspaceService {
    fn list_workspaces(&self) -> ServerResult<Vec<WorkspaceRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        Ok(self.load_from_disk()?.workspaces)
    }

    fn create_workspace(&self, input: WorkspaceCreateInput) -> ServerResult<WorkspaceRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let name = require_non_empty_text(&input.name, "WORKSPACE_NAME_EMPTY", "name")?;
        let description = normalize_text(input.description);
        let icon = normalize_optional_text(input.icon);
        let mut document = self.load_from_disk()?;
        let timestamp = current_timestamp();
        let id = next_entity_id("workspace", &WORKSPACE_COUNTER);
        let workspace_dir = self.workspace_dir(&id);

        self.create_workspace_directories(&id)?;

        let workspace = WorkspaceRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            name,
            description,
            projects: Vec::new(),
            path: Some(path_to_string(&workspace_dir)),
            icon,
            created_at: timestamp.clone(),
            updated_at: timestamp,
            deleted_at: None,
        };

        document.workspaces.push(workspace.clone());
        sort_workspaces(&mut document.workspaces);

        if let Err(error) = self.persist_to_disk(&document) {
            remove_dir_if_exists(&workspace_dir);
            return Err(error);
        }

        Ok(workspace)
    }

    fn read_workspace(&self, workspace_key: &str) -> ServerResult<WorkspaceRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        Ok(self
            .read_workspace_record(&document.workspaces, workspace_key)?
            .clone())
    }

    fn update_workspace(
        &self,
        workspace_key: &str,
        input: WorkspaceUpdateInput,
    ) -> ServerResult<WorkspaceRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        if input.name.is_none() && input.description.is_none() && input.icon.is_none() {
            return Err(ServerError::bad_request(
                "WORKSPACE_UPDATE_EMPTY",
                "workspace update must include at least one field",
            ));
        }

        let mut document = self.load_from_disk()?;
        let workspace = self.read_workspace_record_mut(&mut document.workspaces, workspace_key)?;

        if let Some(name) = input.name {
            workspace.name = require_non_empty_text(&name, "WORKSPACE_NAME_EMPTY", "name")?;
        }

        if let Some(description) = input.description {
            workspace.description = description.trim().to_string();
        }

        if let Some(icon) = input.icon {
            workspace.icon = normalize_optional_text(Some(icon));
        }

        workspace.updated_at = current_timestamp();
        let response = workspace.clone();
        sort_projects(&mut workspace.projects);
        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn delete_workspace(&self, workspace_key: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let normalized_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let mut document = self.load_from_disk()?;
        let Some(index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_key} was not found"),
            ));
        };

        let workspace = document.workspaces.remove(index);
        self.persist_to_disk(&document)?;
        remove_dir_if_exists(&self.workspace_dir(&workspace.id));
        Ok(true)
    }

    fn list_projects(&self, workspace_key: &str) -> ServerResult<Vec<ProjectRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        Ok(self
            .read_workspace_record(&document.workspaces, workspace_key)?
            .projects
            .clone())
    }

    fn list_recent_projects(&self) -> ServerResult<Vec<ProjectRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let mut projects = document
            .workspaces
            .iter()
            .flat_map(|workspace| workspace.projects.iter())
            .filter(|project| project.archived_at.is_none() && project.last_opened_at.is_some())
            .cloned()
            .collect::<Vec<_>>();
        sort_recent_projects(&mut projects);
        Ok(projects)
    }

    fn create_project(
        &self,
        workspace_key: &str,
        input: ProjectCreateInput,
    ) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let name = require_non_empty_text(&input.name, "PROJECT_NAME_EMPTY", "name")?;
        let description = normalize_text(input.description);
        let thumbnail_url = normalize_optional_text(input.thumbnail_url);
        let mut document = self.load_from_disk()?;
        let workspace = self.read_workspace_record_mut(&mut document.workspaces, workspace_key)?;
        let timestamp = current_timestamp();
        let id = next_entity_id("project", &PROJECT_COUNTER);
        let project_dir = self.project_dir(&workspace.id, &id);

        self.create_project_directory(&workspace.id, &id)?;

        let project = ProjectRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            name,
            project_type: input.project_type,
            description,
            workspace_id: workspace.uuid.clone(),
            path: Some(path_to_string(&project_dir)),
            thumbnail_url,
            session: None,
            created_at: timestamp.clone(),
            updated_at: timestamp.clone(),
            archived_at: None,
            last_opened_at: None,
            deleted_at: None,
        };

        workspace.updated_at = timestamp;
        workspace.projects.push(project.clone());
        sort_projects(&mut workspace.projects);
        sort_workspaces(&mut document.workspaces);

        if let Err(error) = self.persist_to_disk(&document) {
            remove_dir_if_exists(&project_dir);
            return Err(error);
        }

        Ok(project)
    }

    fn read_project(&self, workspace_key: &str, project_key: &str) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let workspace = self.read_workspace_record(&document.workspaces, workspace_key)?;
        Ok(self.read_project_record(workspace, project_key)?.clone())
    }

    fn read_project_session(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectSessionSnapshotRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let workspace = self.read_workspace_record(&document.workspaces, workspace_key)?;
        let project = self.read_project_record(workspace, project_key)?;
        Ok(ProjectSessionSnapshotRecord {
            session: project.session.clone(),
        })
    }

    fn update_project(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectUpdateInput,
    ) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        if input.name.is_none()
            && input.project_type.is_none()
            && input.description.is_none()
            && input.thumbnail_url.is_none()
        {
            return Err(ServerError::bad_request(
                "PROJECT_UPDATE_EMPTY",
                "project update must include at least one field",
            ));
        }

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let response = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            let project = &mut workspace.projects[project_index];

            if let Some(name) = input.name {
                project.name = require_non_empty_text(&name, "PROJECT_NAME_EMPTY", "name")?;
            }

            if let Some(project_type) = input.project_type {
                project.project_type = project_type;
            }

            if let Some(description) = input.description {
                project.description = description.trim().to_string();
            }

            if let Some(thumbnail_url) = input.thumbnail_url {
                project.thumbnail_url = normalize_optional_text(Some(thumbnail_url));
            }

            let timestamp = current_timestamp();
            project.updated_at = timestamp.clone();
            workspace.updated_at = timestamp;
            let response = project.clone();
            sort_projects(&mut workspace.projects);
            response
        };

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn upsert_project_session(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectSessionUpsertInput,
    ) -> ServerResult<ProjectSessionRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let response = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            let existing_created_at = workspace.projects[project_index]
                .session
                .as_ref()
                .map(|session| session.created_at.clone());
            let workspace_id = workspace.id.clone();
            let project_id = workspace.projects[project_index].id.clone();
            let timestamp = current_timestamp();
            let mut session = ProjectSessionRecord {
                id: project_session_id(&project_id),
                uuid: String::new(),
                workspace_id: workspace_id.clone(),
                project_id: project_id.clone(),
                open_files: normalize_session_open_files_input(input.open_files)?,
                active_file_path: require_optional_session_relative_path(
                    input.active_file_path,
                    "activeFilePath",
                )?,
                selected_path: require_optional_session_relative_path(
                    input.selected_path,
                    "selectedPath",
                )?,
                expanded_paths: require_session_relative_path_list(
                    input.expanded_paths.unwrap_or_default(),
                    "expandedPaths",
                )?,
                created_at: existing_created_at.unwrap_or_else(|| timestamp.clone()),
                updated_at: timestamp.clone(),
                deleted_at: None,
            };
            self.normalize_project_session(&workspace_id, &project_id, &mut session);

            workspace.projects[project_index].session = Some(session.clone());
            workspace.projects[project_index].updated_at = timestamp.clone();
            workspace.updated_at = timestamp;
            let response = workspace.projects[project_index]
                .session
                .clone()
                .expect("project session must exist after upsert");
            sort_projects(&mut workspace.projects);
            response
        };

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn delete_project_session(&self, workspace_key: &str, project_key: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            workspace.projects[project_index].session = None;
            let timestamp = current_timestamp();
            workspace.projects[project_index].updated_at = timestamp.clone();
            workspace.updated_at = timestamp;
            sort_projects(&mut workspace.projects);
        }

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(true)
    }

    fn sync_project_to_git(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectGitSyncInput,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;

        if project.archived_at.is_some() {
            return Err(ServerError::bad_request(
                "PROJECT_ARCHIVED",
                "archived projects must be restored before git sync",
            ));
        }

        self.execute_project_git_sync_and_persist(
            &workspace,
            &project,
            input.repository,
            input.branch,
            input.token,
            input.message,
            None,
        )
    }

    fn list_project_git_syncs(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<Vec<ProjectGitSyncRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        Ok(self
            .load_project_git_sync_registry(&workspace.id, &project.id)?
            .items)
    }

    fn read_latest_project_git_sync(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.latest_project_git_sync_record(&workspace.id, &project.id)
    }

    fn read_project_git_sync(
        &self,
        workspace_key: &str,
        project_key: &str,
        sync_key: &str,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.find_project_git_sync_record(&workspace.id, &project.id, sync_key)
    }

    fn retry_project_git_sync(
        &self,
        workspace_key: &str,
        project_key: &str,
        sync_key: &str,
        input: ProjectGitSyncRetryInput,
    ) -> ServerResult<ProjectGitSyncRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;

        if project.archived_at.is_some() {
            return Err(ServerError::bad_request(
                "PROJECT_ARCHIVED",
                "archived projects must be restored before git sync retry",
            ));
        }

        let existing_record =
            self.find_project_git_sync_record(&workspace.id, &project.id, sync_key)?;
        let ProjectGitSyncRetryInput { token, message } = input;
        self.execute_project_git_sync_and_persist(
            &workspace,
            &project,
            existing_record.repository.clone(),
            existing_record.branch.clone(),
            token,
            message.or(existing_record.message.clone()),
            Some(existing_record.id),
        )
    }

    fn list_project_releases(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<Vec<ProjectReleaseRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        Ok(self
            .load_project_release_registry(&workspace.id, &project.id)?
            .items)
    }

    fn create_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleaseCreateInput,
    ) -> ServerResult<ProjectReleaseRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;

        if project.archived_at.is_some() {
            return Err(ServerError::bad_request(
                "PROJECT_ARCHIVED",
                "archived projects must be restored before release creation",
            ));
        }
        self.package_project_release(&workspace, &project, input, None)
    }

    fn read_latest_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.latest_active_project_release_record(&workspace.id, &project.id)
    }

    fn read_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.find_project_release_record(&workspace.id, &project.id, release_key)
    }

    fn delete_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.set_project_release_deleted_state(&workspace.id, &project.id, release_key, true)
    }

    fn restore_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.set_project_release_deleted_state(&workspace.id, &project.id, release_key, false)
    }

    fn read_project_release_stats(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectReleaseStatsRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        let registry = self.load_project_release_registry(&workspace.id, &project.id)?;
        Ok(self.build_project_release_stats_record(&workspace.id, &project.id, &registry.items))
    }

    fn prune_project_releases(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleasePruneInput,
    ) -> ServerResult<ProjectReleasePruneResultRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        let mut registry = self.load_project_release_registry(&workspace.id, &project.id)?;
        let dry_run = input.dry_run.unwrap_or(false);
        let candidates =
            self.resolve_project_release_prune_candidates(&registry.items, input.release_ids)?;
        let pruned_release_ids = candidates
            .iter()
            .map(|record| record.id.clone())
            .collect::<Vec<_>>();
        let reclaimed_bytes = candidates
            .iter()
            .map(|record| record.size_bytes)
            .sum::<u64>();

        let remaining_items = registry
            .items
            .iter()
            .filter(|record| {
                !pruned_release_ids
                    .iter()
                    .any(|pruned_release_id| pruned_release_id == &record.id)
            })
            .cloned()
            .collect::<Vec<_>>();
        let remaining_stats =
            self.build_project_release_stats_record(&workspace.id, &project.id, &remaining_items);

        if !dry_run {
            registry.items = remaining_items.clone();
            sort_project_releases(&mut registry.items);
            self.persist_project_release_registry(&workspace.id, &project.id, &registry)?;
            self.cleanup_orphaned_project_release_output_dirs(
                &workspace.id,
                &project.id,
                &registry
                    .items
                    .iter()
                    .map(|record| record.id.clone())
                    .collect::<Vec<_>>(),
            );
        }

        Ok(ProjectReleasePruneResultRecord {
            workspace_id: to_client_entity_uuid(&workspace.id),
            project_id: to_client_entity_uuid(&project.id),
            dry_run,
            pruned_release_ids: pruned_release_ids.clone(),
            pruned_count: pruned_release_ids.len() as u64,
            reclaimed_bytes,
            remaining_stats,
        })
    }

    fn read_project_release_retention_policy(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectReleaseRetentionPolicyRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        let (policy, _) = self.load_project_release_retention_policy(&workspace.id, &project.id)?;
        Ok(self.build_project_release_retention_policy_response(
            &workspace.id,
            &project.id,
            &policy,
        ))
    }

    fn update_project_release_retention_policy(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleaseRetentionPolicyInput,
    ) -> ServerResult<ProjectReleaseRetentionPolicyRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        let (existing_policy, policy_exists) =
            self.load_project_release_retention_policy(&workspace.id, &project.id)?;
        let policy = self.build_project_release_retention_policy_record(
            &workspace.id,
            &project.id,
            input,
            if policy_exists {
                Some(existing_policy)
            } else {
                None
            },
        )?;
        self.persist_project_release_retention_policy(&workspace.id, &project.id, &policy)?;
        Ok(self.build_project_release_retention_policy_response(
            &workspace.id,
            &project.id,
            &policy,
        ))
    }

    fn apply_project_release_retention_policy(
        &self,
        workspace_key: &str,
        project_key: &str,
        input: ProjectReleaseRetentionPolicyApplyInput,
    ) -> ServerResult<ProjectReleaseRetentionPolicyApplyResultRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        self.apply_project_release_retention_policy_internal(
            &workspace.id,
            &project.id,
            input.dry_run.unwrap_or(false),
        )
    }

    fn read_project_release_manifest(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseManifestRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        let release = self.find_project_release_record(&workspace.id, &project.id, release_key)?;
        let artifact_path = self.project_release_artifact_file_path(
            &workspace.id,
            &project.id,
            &release.id,
            &release.artifact_file_name,
        );
        Ok(ProjectReleaseManifestRecord {
            release,
            entries: read_project_release_manifest_entries_from_archive(&artifact_path)?,
        })
    }

    fn read_project_release_artifact(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseArtifactContent> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;
        let release = self.find_project_release_record(&workspace.id, &project.id, release_key)?;
        let artifact_path = self.project_release_artifact_file_path(
            &workspace.id,
            &project.id,
            &release.id,
            &release.artifact_file_name,
        );
        let bytes = fs::read(&artifact_path).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_ARTIFACT_READ_FAILED",
                format!(
                    "failed to read project release artifact {}: {error}",
                    artifact_path.display()
                ),
            )
        })?;

        Ok(ProjectReleaseArtifactContent {
            bytes,
            file_name: release.artifact_file_name,
            mime_type: "application/zip".to_string(),
        })
    }

    fn rebuild_project_release(
        &self,
        workspace_key: &str,
        project_key: &str,
        release_key: &str,
    ) -> ServerResult<ProjectReleaseRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let document = self.load_from_disk()?;
        let (workspace, project) =
            self.read_project_snapshot(&document, workspace_key, project_key)?;

        if project.archived_at.is_some() {
            return Err(ServerError::bad_request(
                "PROJECT_ARCHIVED",
                "archived projects must be restored before release rebuild",
            ));
        }

        let existing_release =
            self.find_project_release_record(&workspace.id, &project.id, release_key)?;
        if existing_release.deleted_at.is_some() {
            return Err(ServerError::bad_request(
                "PROJECT_RELEASE_DELETED",
                "deleted project releases must be restored before rebuild",
            ));
        }
        self.package_project_release(
            &workspace,
            &project,
            ProjectReleaseCreateInput {
                app_name: existing_release.app_name,
                version: existing_release.version,
                target: existing_release.target,
                auto_deploy: Some(false),
            },
            Some(existing_release.id),
        )
    }

    fn open_project(&self, workspace_key: &str, project_key: &str) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let response = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            if workspace.projects[project_index].archived_at.is_some() {
                return Err(ServerError::bad_request(
                    "PROJECT_ARCHIVED",
                    "archived projects must be restored before opening",
                ));
            }

            let timestamp = current_timestamp();
            workspace.projects[project_index].last_opened_at = Some(timestamp.clone());
            workspace.projects[project_index].updated_at = timestamp.clone();
            workspace.updated_at = timestamp;
            let response = workspace.projects[project_index].clone();
            sort_projects(&mut workspace.projects);
            response
        };

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn duplicate_project(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let (source_project_dir, duplicated_project_dir, response) = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            let source_project = workspace.projects[project_index].clone();
            let duplicated_project_id = next_entity_id("project", &PROJECT_COUNTER);
            let duplicated_project_dir = self.project_dir(&workspace.id, &duplicated_project_id);
            let source_project_dir = self.project_dir(&workspace.id, &source_project.id);
            let timestamp = current_timestamp();
            let duplicated_project = ProjectRecord {
                id: duplicated_project_id.clone(),
                uuid: to_client_entity_uuid(&duplicated_project_id),
                name: next_duplicated_project_name(&workspace.projects, &source_project.name),
                project_type: source_project.project_type,
                description: source_project.description.clone(),
                workspace_id: workspace.uuid.clone(),
                path: Some(path_to_string(&duplicated_project_dir)),
                thumbnail_url: source_project.thumbnail_url.clone(),
                session: None,
                created_at: timestamp.clone(),
                updated_at: timestamp.clone(),
                archived_at: None,
                last_opened_at: None,
                deleted_at: None,
            };

            workspace.updated_at = timestamp;
            workspace.projects.push(duplicated_project.clone());
            sort_projects(&mut workspace.projects);

            (
                source_project_dir,
                duplicated_project_dir,
                duplicated_project,
            )
        };

        if let Err(error) = copy_dir_recursive(&source_project_dir, &duplicated_project_dir) {
            remove_dir_if_exists(&duplicated_project_dir);
            return Err(error);
        }

        sort_workspaces(&mut document.workspaces);
        if let Err(error) = self.persist_to_disk(&document) {
            remove_dir_if_exists(&duplicated_project_dir);
            return Err(error);
        }

        Ok(response)
    }

    fn archive_project(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let response = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            if workspace.projects[project_index].archived_at.is_none() {
                let timestamp = current_timestamp();
                workspace.projects[project_index].archived_at = Some(timestamp.clone());
                workspace.projects[project_index].updated_at = timestamp.clone();
                workspace.updated_at = timestamp;
                sort_projects(&mut workspace.projects);
            }

            workspace
                .projects
                .iter()
                .find(|project| matches_project_key(project, &normalized_project_key))
                .cloned()
                .expect("archived project must exist")
        };

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn restore_project(
        &self,
        workspace_key: &str,
        project_key: &str,
    ) -> ServerResult<ProjectRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let response = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            if workspace.projects[project_index].archived_at.is_some() {
                let timestamp = current_timestamp();
                workspace.projects[project_index].archived_at = None;
                workspace.projects[project_index].updated_at = timestamp.clone();
                workspace.updated_at = timestamp;
                sort_projects(&mut workspace.projects);
            }

            workspace
                .projects
                .iter()
                .find(|project| matches_project_key(project, &normalized_project_key))
                .cloned()
                .expect("restored project must exist")
        };

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn delete_project(&self, workspace_key: &str, project_key: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_WORKSPACES_LOCK_FAILED",
                "failed to acquire workspace lock",
            )
        })?;

        let normalized_project_key =
            require_non_empty_text(project_key, "PROJECT_ID_EMPTY", "projectId")?;
        let mut document = self.load_from_disk()?;
        let normalized_workspace_key =
            require_non_empty_text(workspace_key, "WORKSPACE_ID_EMPTY", "workspaceId")?;
        let Some(workspace_index) = document
            .workspaces
            .iter()
            .position(|workspace| matches_workspace_key(workspace, &normalized_workspace_key))
        else {
            return Err(ServerError::not_found(
                "WORKSPACE_NOT_FOUND",
                format!("workspace {normalized_workspace_key} was not found"),
            ));
        };

        let (workspace_id, project_id) = {
            let workspace = &mut document.workspaces[workspace_index];
            let Some(project_index) = workspace
                .projects
                .iter()
                .position(|project| matches_project_key(project, &normalized_project_key))
            else {
                return Err(ServerError::not_found(
                    "PROJECT_NOT_FOUND",
                    format!("project {normalized_project_key} was not found"),
                ));
            };

            let project = workspace.projects.remove(project_index);
            workspace.updated_at = current_timestamp();
            sort_projects(&mut workspace.projects);
            (workspace.id.clone(), project.id)
        };

        sort_workspaces(&mut document.workspaces);
        self.persist_to_disk(&document)?;
        remove_dir_if_exists(&self.project_dir(&workspace_id, &project_id));
        remove_dir_if_exists(&self.project_metadata_dir(&workspace_id, &project_id));
        remove_dir_if_exists(&self.project_release_output_root_dir(&workspace_id, &project_id));
        Ok(true)
    }
}

#[derive(Debug, Clone)]
struct GitRemoteTarget {
    public_url: String,
    push_url: String,
}

#[derive(Debug, Clone)]
struct ProjectGitSyncExecutionResult {
    status: ProjectGitSyncStatus,
    commit_hash: String,
}

fn sort_workspaces(workspaces: &mut [WorkspaceRecord]) {
    workspaces.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn sort_projects(projects: &mut [ProjectRecord]) {
    projects.sort_by(|left, right| {
        left.archived_at
            .is_some()
            .cmp(&right.archived_at.is_some())
            .then_with(|| right.updated_at.cmp(&left.updated_at))
            .then_with(|| left.name.cmp(&right.name))
    });
}

fn sort_recent_projects(projects: &mut [ProjectRecord]) {
    projects.sort_by(|left, right| {
        right
            .last_opened_at
            .as_deref()
            .unwrap_or("")
            .cmp(left.last_opened_at.as_deref().unwrap_or(""))
            .then_with(|| right.updated_at.cmp(&left.updated_at))
            .then_with(|| left.name.cmp(&right.name))
    });
}

fn sort_project_git_syncs(records: &mut [ProjectGitSyncRecord]) {
    records.sort_by(|left, right| {
        right
            .updated_at
            .cmp(&left.updated_at)
            .then_with(|| right.created_at.cmp(&left.created_at))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn sort_project_releases(records: &mut [ProjectReleaseRecord]) {
    records.sort_by(|left, right| {
        right
            .updated_at
            .cmp(&left.updated_at)
            .then_with(|| right.created_at.cmp(&left.created_at))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn build_project_release_artifact_api_path(
    workspace_id: &str,
    project_id: &str,
    release_id: &str,
) -> String {
    embedded_server_contract().materialize_route_path(
        APP_WORKSPACE_PROJECTS_READ_RELEASE_ARTIFACT_ROUTE_ID,
        &[
            ("workspaceId", workspace_id),
            ("projectId", project_id),
            ("releaseId", release_id),
        ],
    )
}

fn matches_workspace_key(workspace: &WorkspaceRecord, key: &str) -> bool {
    workspace.id == key || workspace.uuid == key
}

fn matches_project_key(project: &ProjectRecord, key: &str) -> bool {
    project.id == key || project.uuid == key
}

fn normalize_text(value: Option<String>) -> String {
    value.unwrap_or_default().trim().to_string()
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|entry| {
        let trimmed = entry.trim().to_string();
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

fn project_session_id(project_id: &str) -> String {
    format!("project-session-{project_id}")
}

fn normalize_session_open_files(
    open_files: Vec<ProjectSessionOpenFileRecord>,
) -> Vec<ProjectSessionOpenFileRecord> {
    open_files
        .into_iter()
        .filter_map(|entry| {
            let path = normalize_session_relative_path(&entry.path)?;
            Some(ProjectSessionOpenFileRecord {
                path,
                is_preview: entry.is_preview,
            })
        })
        .collect()
}

fn normalize_session_open_files_input(
    open_files: Vec<ProjectSessionOpenFileInput>,
) -> ServerResult<Vec<ProjectSessionOpenFileRecord>> {
    open_files
        .into_iter()
        .map(|entry| {
            Ok(ProjectSessionOpenFileRecord {
                path: require_session_relative_path(&entry.path, "openFiles[].path")?,
                is_preview: entry.is_preview.unwrap_or(false),
            })
        })
        .collect()
}

fn normalize_optional_session_relative_path(value: Option<String>) -> Option<String> {
    value.and_then(|entry| normalize_session_relative_path(&entry))
}

fn normalize_session_relative_path_list(values: Vec<String>) -> Vec<String> {
    values
        .into_iter()
        .filter_map(|entry| normalize_session_relative_path(&entry))
        .collect()
}

fn require_optional_session_relative_path(
    value: Option<String>,
    field_name: &str,
) -> ServerResult<Option<String>> {
    match value {
        Some(entry) => Ok(Some(require_session_relative_path(&entry, field_name)?)),
        None => Ok(None),
    }
}

fn require_session_relative_path_list(
    values: Vec<String>,
    field_name: &str,
) -> ServerResult<Vec<String>> {
    values
        .into_iter()
        .map(|entry| require_session_relative_path(&entry, field_name))
        .collect()
}

fn require_session_relative_path(value: &str, field_name: &str) -> ServerResult<String> {
    normalize_session_relative_path(value).ok_or_else(|| {
        ServerError::bad_request(
            "PROJECT_SESSION_PATH_INVALID",
            format!(
                "{field_name} must be a normalized project-relative path without absolute prefixes or traversal segments"
            ),
        )
    })
}

fn normalize_session_relative_path(value: &str) -> Option<String> {
    let normalized = value.trim().replace('\\', "/");
    if normalized.is_empty()
        || normalized.starts_with('/')
        || normalized.starts_with("//")
        || normalized.starts_with("./")
        || normalized.starts_with("../")
        || normalized.contains("/./")
        || normalized.contains("/../")
        || normalized.ends_with("/.")
        || normalized.ends_with("/..")
        || normalized.contains(':')
    {
        return None;
    }

    let mut segments = Vec::new();
    for segment in normalized.split('/') {
        let trimmed = segment.trim();
        if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
            return None;
        }
        segments.push(trimmed);
    }

    if segments.is_empty() {
        return None;
    }

    Some(segments.join("/"))
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

fn build_project_git_sync_error_message(error: &ServerError) -> String {
    error
        .detail
        .clone()
        .unwrap_or_else(|| error.message.clone())
}

fn build_project_release_artifact_file_name(app_name: &str, version: &str) -> String {
    let normalized_name = slugify_release_segment(app_name);
    let normalized_version = slugify_release_segment(version);
    format!("{normalized_name}-{normalized_version}.zip")
}

fn slugify_release_segment(value: &str) -> String {
    let mut slug = String::new();
    let mut last_was_dash = false;

    for ch in value.trim().chars() {
        let normalized = ch.to_ascii_lowercase();
        if normalized.is_ascii_alphanumeric() {
            slug.push(normalized);
            last_was_dash = false;
            continue;
        }

        if !last_was_dash {
            slug.push('-');
            last_was_dash = true;
        }
    }

    let trimmed = slug.trim_matches('-').to_string();
    if trimmed.is_empty() {
        "release".to_string()
    } else {
        trimmed
    }
}

fn looks_like_local_git_remote(repository: &str) -> bool {
    let path = Path::new(repository);
    path.is_absolute()
        || path.exists()
        || repository.contains('\\')
        || repository.starts_with("./")
        || repository.starts_with(".\\")
        || repository.starts_with("../")
        || repository.starts_with("..\\")
}

fn looks_like_http_repository(repository: &str) -> bool {
    repository.starts_with("https://") || repository.starts_with("http://")
}

fn looks_like_github_slug(repository: &str) -> bool {
    !repository.contains("://")
        && !repository.contains('\\')
        && !repository.starts_with("git@")
        && repository
            .split('/')
            .filter(|segment| !segment.trim().is_empty())
            .count()
            == 2
}

fn normalize_http_repository_url(repository: &str) -> String {
    let trimmed = repository.trim().trim_end_matches('/').to_string();
    if trimmed.ends_with(".git") {
        trimmed
    } else {
        format!("{trimmed}.git")
    }
}

fn build_tokenized_http_repository_url(repository: &str, token: &str) -> ServerResult<String> {
    let normalized_token = require_non_empty_text(token, "PROJECT_GIT_SYNC_TOKEN_EMPTY", "token")?;
    let normalized_repository = normalize_http_repository_url(repository);

    if let Some(without_scheme) = normalized_repository.strip_prefix("https://") {
        let host = without_scheme.split('/').next().unwrap_or_default();
        let credential_prefix = if host.eq_ignore_ascii_case("github.com") {
            "x-access-token"
        } else {
            "oauth2"
        };
        return Ok(format!(
            "https://{credential_prefix}:{normalized_token}@{without_scheme}"
        ));
    }

    if let Some(without_scheme) = normalized_repository.strip_prefix("http://") {
        return Ok(format!("http://oauth2:{normalized_token}@{without_scheme}"));
    }

    Err(ServerError::bad_request(
        "PROJECT_GIT_SYNC_TOKEN_REMOTE_UNSUPPORTED",
        "token-based git sync only supports http or https remotes",
    ))
}

fn resolve_git_remote_target(
    repository: &str,
    token: Option<&str>,
) -> ServerResult<GitRemoteTarget> {
    let normalized_repository = require_non_empty_text(
        repository,
        "PROJECT_GIT_SYNC_REPOSITORY_EMPTY",
        "repository",
    )?;
    let normalized_token = token.and_then(|value| normalize_optional_text(Some(value.to_string())));

    if looks_like_local_git_remote(&normalized_repository) {
        return Ok(GitRemoteTarget {
            public_url: normalized_repository.clone(),
            push_url: normalized_repository,
        });
    }

    if normalized_repository.starts_with("git@") {
        if normalized_token.is_some() {
            return Err(ServerError::bad_request(
                "PROJECT_GIT_SYNC_TOKEN_REMOTE_UNSUPPORTED",
                "token-based git sync does not support ssh remotes",
            ));
        }
        return Ok(GitRemoteTarget {
            public_url: normalized_repository.clone(),
            push_url: normalized_repository,
        });
    }

    if looks_like_http_repository(&normalized_repository) {
        let public_url = normalize_http_repository_url(&normalized_repository);
        let push_url = match normalized_token.as_deref() {
            Some(token) => build_tokenized_http_repository_url(&public_url, token)?,
            None => public_url.clone(),
        };
        return Ok(GitRemoteTarget {
            public_url,
            push_url,
        });
    }

    if looks_like_github_slug(&normalized_repository) {
        let slug = normalized_repository
            .trim()
            .trim_matches('/')
            .trim_end_matches(".git")
            .to_string();
        let public_url = format!("https://github.com/{slug}.git");
        let push_url = match normalized_token.as_deref() {
            Some(token) => format!("https://x-access-token:{token}@github.com/{slug}.git"),
            None => public_url.clone(),
        };
        return Ok(GitRemoteTarget {
            public_url,
            push_url,
        });
    }

    Err(ServerError::bad_request(
        "PROJECT_GIT_SYNC_REPOSITORY_INVALID",
        "repository must be a local git remote path, an ssh/http url, or a GitHub owner/repo slug",
    ))
}

fn command_output_text(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).trim().to_string()
}

fn describe_git_args(args: &[String]) -> String {
    args.join(" ")
}

fn run_git_command_allow_failure(
    project_dir: &Path,
    args: &[String],
) -> ServerResult<std::process::Output> {
    Command::new("git")
        .current_dir(project_dir)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GCM_INTERACTIVE", "Never")
        .args(args)
        .output()
        .map_err(|error| {
            ServerError::internal(
                "PROJECT_GIT_COMMAND_FAILED",
                format!(
                    "failed to execute git {} in {}: {error}",
                    describe_git_args(args),
                    project_dir.display()
                ),
            )
        })
}

fn run_git_command(project_dir: &Path, args: &[String]) -> ServerResult<String> {
    let output = run_git_command_allow_failure(project_dir, args)?;
    if output.status.success() {
        let stdout = command_output_text(&output.stdout);
        let stderr = command_output_text(&output.stderr);
        if stdout.is_empty() {
            Ok(stderr)
        } else {
            Ok(stdout)
        }
    } else {
        let stderr = command_output_text(&output.stderr);
        let stdout = command_output_text(&output.stdout);
        Err(ServerError::internal(
            "PROJECT_GIT_COMMAND_FAILED",
            format!(
                "git {} failed in {}: {}",
                describe_git_args(args),
                project_dir.display(),
                if stderr.is_empty() { stdout } else { stderr }
            ),
        ))
    }
}

fn is_bare_git_repository_path(path: &Path) -> bool {
    path.is_dir()
        && path.join("HEAD").is_file()
        && path.join("objects").is_dir()
        && path.join("refs").is_dir()
}

fn resolve_local_bare_git_remote_path(project_dir: &Path, remote_url: &str) -> Option<PathBuf> {
    if remote_url.starts_with("git@") || remote_url.contains("://") {
        return None;
    }

    if !looks_like_local_git_remote(remote_url) {
        return None;
    }

    let remote_path = Path::new(remote_url);
    let candidate = if remote_path.is_absolute() {
        remote_path.to_path_buf()
    } else {
        project_dir.join(remote_path)
    };

    if is_bare_git_repository_path(&candidate) {
        Some(candidate)
    } else {
        None
    }
}

fn git_branch_ref(branch: &str) -> String {
    let normalized = branch.trim();
    if normalized.starts_with("refs/") {
        normalized.to_string()
    } else {
        format!("refs/heads/{normalized}")
    }
}

fn build_git_sync_bundle_path() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    std::env::temp_dir().join(format!(
        "magic-studio-git-sync-{}-{nonce}.bundle",
        std::process::id()
    ))
}

fn sync_project_to_local_bare_remote(
    project_dir: &Path,
    remote_path: &Path,
    branch: &str,
) -> ServerResult<()> {
    let bundle_path = build_git_sync_bundle_path();
    let bundle_path_text = path_to_string(&bundle_path);

    let bundle_result = run_git_command(
        project_dir,
        &[
            "bundle".to_string(),
            "create".to_string(),
            bundle_path_text.clone(),
            "HEAD".to_string(),
        ],
    );
    if let Err(error) = bundle_result {
        let _ = fs::remove_file(&bundle_path);
        return Err(error);
    }

    let fetch_result = run_git_command(
        project_dir,
        &[
            "--git-dir".to_string(),
            path_to_string(remote_path),
            "fetch".to_string(),
            bundle_path_text,
            format!("HEAD:{}", git_branch_ref(branch)),
        ],
    );
    let _ = fs::remove_file(&bundle_path);
    fetch_result.map(|_| ())
}

fn ensure_git_repository_initialized(project_dir: &Path) -> ServerResult<()> {
    if project_dir.join(".git").exists() {
        return Ok(());
    }

    run_git_command(project_dir, &["init".to_string()]).map(|_| ())
}

fn ensure_git_identity(project_dir: &Path) -> ServerResult<()> {
    let user_name_output = run_git_command_allow_failure(
        project_dir,
        &["config".to_string(), "user.name".to_string()],
    )?;
    if !user_name_output.status.success()
        || command_output_text(&user_name_output.stdout).is_empty()
    {
        run_git_command(
            project_dir,
            &[
                "config".to_string(),
                "user.name".to_string(),
                "Magic Studio".to_string(),
            ],
        )?;
    }

    let user_email_output = run_git_command_allow_failure(
        project_dir,
        &["config".to_string(), "user.email".to_string()],
    )?;
    if !user_email_output.status.success()
        || command_output_text(&user_email_output.stdout).is_empty()
    {
        run_git_command(
            project_dir,
            &[
                "config".to_string(),
                "user.email".to_string(),
                "magic-studio@localhost".to_string(),
            ],
        )?;
    }

    Ok(())
}

fn git_staging_has_changes(project_dir: &Path) -> ServerResult<bool> {
    let output = run_git_command_allow_failure(
        project_dir,
        &[
            "diff".to_string(),
            "--cached".to_string(),
            "--quiet".to_string(),
        ],
    )?;

    match output.status.code() {
        Some(0) => Ok(false),
        Some(1) => Ok(true),
        _ => Err(ServerError::internal(
            "PROJECT_GIT_DIFF_FAILED",
            format!(
                "failed to inspect staged git changes in {}: {}",
                project_dir.display(),
                command_output_text(&output.stderr)
            ),
        )),
    }
}

fn read_git_head_commit_hash(project_dir: &Path) -> ServerResult<String> {
    let output =
        run_git_command_allow_failure(project_dir, &["rev-parse".to_string(), "HEAD".to_string()])?;

    if output.status.success() {
        let hash = command_output_text(&output.stdout);
        if hash.is_empty() {
            return Err(ServerError::internal(
                "PROJECT_GIT_HEAD_EMPTY",
                format!(
                    "git rev-parse HEAD returned an empty commit hash in {}",
                    project_dir.display()
                ),
            ));
        }
        return Ok(hash);
    }

    Err(ServerError::bad_request(
        "PROJECT_GIT_HEAD_NOT_FOUND",
        "project has no commit to synchronize; create at least one tracked file before git sync",
    ))
}

fn execute_project_git_sync(
    project_dir: &Path,
    remote_url: &str,
    branch: &str,
    message: &str,
) -> ServerResult<ProjectGitSyncExecutionResult> {
    if !project_dir.exists() {
        return Err(ServerError::not_found(
            "PROJECT_DIRECTORY_NOT_FOUND",
            format!("project directory {} was not found", project_dir.display()),
        ));
    }

    ensure_git_repository_initialized(project_dir)?;
    ensure_git_identity(project_dir)?;
    run_git_command(project_dir, &["add".to_string(), "--all".to_string()])?;

    let has_staged_changes = git_staging_has_changes(project_dir)?;
    if has_staged_changes {
        run_git_command(
            project_dir,
            &["commit".to_string(), "-m".to_string(), message.to_string()],
        )?;
    }

    let commit_hash = read_git_head_commit_hash(project_dir)?;
    if let Some(remote_path) = resolve_local_bare_git_remote_path(project_dir, remote_url) {
        sync_project_to_local_bare_remote(project_dir, &remote_path, branch)?;
    } else {
        run_git_command(
            project_dir,
            &[
                "push".to_string(),
                "--set-upstream".to_string(),
                remote_url.to_string(),
                format!("HEAD:{branch}"),
            ],
        )?;
    }

    Ok(ProjectGitSyncExecutionResult {
        status: if has_staged_changes {
            ProjectGitSyncStatus::Succeeded
        } else {
            ProjectGitSyncStatus::NoChanges
        },
        commit_hash,
    })
}

fn should_skip_project_release_entry(source_root: &Path, path: &Path) -> bool {
    if path == source_root {
        return false;
    }

    if let Some(name) = path.file_name() {
        let name_str = name.to_string_lossy();
        if name_str == ".DS_Store" || name_str == "__MACOSX" || name_str.starts_with("._") {
            return true;
        }
    }

    path.strip_prefix(source_root)
        .ok()
        .map(|relative| {
            relative.components().any(|component| {
                matches!(
                    component.as_os_str().to_string_lossy().as_ref(),
                    ".git" | "node_modules" | "__MACOSX" | PROJECT_METADATA_DIR_NAME
                )
            })
        })
        .unwrap_or(false)
}

fn create_project_release_archive(source_root: &Path, artifact_path: &Path) -> ServerResult<usize> {
    let file = fs::File::create(artifact_path).map_err(|error| {
        ServerError::internal(
            "PROJECT_RELEASE_ARTIFACT_CREATE_FAILED",
            format!(
                "failed to create project release artifact {}: {error}",
                artifact_path.display()
            ),
        )
    })?;
    let mut archive = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);
    let mut file_count = 0_usize;
    let mut file_entries = Vec::new();

    for entry in WalkDir::new(source_root)
        .into_iter()
        .filter_entry(|entry| !should_skip_project_release_entry(source_root, entry.path()))
    {
        let entry = entry.map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_WALK_FAILED",
                format!(
                    "failed to walk project release source {}: {error}",
                    source_root.display()
                ),
            )
        })?;
        let path = entry.path();
        if !entry.file_type().is_file() {
            continue;
        }

        let relative = path.strip_prefix(source_root).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_STRIP_PREFIX_FAILED",
                format!(
                    "failed to compute project release archive path for {}: {error}",
                    path.display()
                ),
            )
        })?;
        let name = relative.to_string_lossy().replace('\\', "/");
        if name.trim().is_empty() {
            continue;
        }

        file_entries.push((name, path.to_path_buf()));
    }

    file_entries.sort_by(|left, right| left.0.cmp(&right.0));

    for (name, path) in file_entries {
        archive.start_file(&name, options).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_ARCHIVE_ENTRY_CREATE_FAILED",
                format!("failed to create archive entry {name}: {error}"),
            )
        })?;

        let mut source_file = fs::File::open(&path).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_SOURCE_FILE_READ_FAILED",
                format!(
                    "failed to open project release source file {}: {error}",
                    path.display()
                ),
            )
        })?;
        let mut buffer = Vec::new();
        source_file.read_to_end(&mut buffer).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_SOURCE_FILE_BYTES_FAILED",
                format!(
                    "failed to read project release source file {}: {error}",
                    path.display()
                ),
            )
        })?;
        archive.write_all(&buffer).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_ARCHIVE_WRITE_FAILED",
                format!("failed to write project release archive entry {name}: {error}"),
            )
        })?;
        file_count += 1;
    }

    if file_count == 0 {
        return Err(ServerError::bad_request(
            "PROJECT_RELEASE_EMPTY",
            "project does not contain releasable files",
        ));
    }

    archive.finish().map_err(|error| {
        ServerError::internal(
            "PROJECT_RELEASE_ARCHIVE_FINISH_FAILED",
            format!(
                "failed to finalize project release artifact {}: {error}",
                artifact_path.display()
            ),
        )
    })?;

    Ok(file_count)
}

fn read_project_release_manifest_entries_from_archive(
    artifact_path: &Path,
) -> ServerResult<Vec<ProjectReleaseManifestEntry>> {
    let file = fs::File::open(artifact_path).map_err(|error| {
        ServerError::internal(
            "PROJECT_RELEASE_ARTIFACT_READ_FAILED",
            format!(
                "failed to open project release artifact {}: {error}",
                artifact_path.display()
            ),
        )
    })?;
    let mut archive = ZipArchive::new(file).map_err(|error| {
        ServerError::internal(
            "PROJECT_RELEASE_ARCHIVE_PARSE_FAILED",
            format!(
                "failed to parse project release artifact {}: {error}",
                artifact_path.display()
            ),
        )
    })?;

    let mut entries = Vec::new();
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_ARCHIVE_ENTRY_READ_FAILED",
                format!(
                    "failed to read project release archive entry {index} from {}: {error}",
                    artifact_path.display()
                ),
            )
        })?;
        if entry.is_dir() {
            continue;
        }

        let mut bytes = Vec::new();
        entry.read_to_end(&mut bytes).map_err(|error| {
            ServerError::internal(
                "PROJECT_RELEASE_ARCHIVE_ENTRY_BYTES_FAILED",
                format!(
                    "failed to read project release archive entry {} from {}: {error}",
                    entry.name(),
                    artifact_path.display()
                ),
            )
        })?;

        entries.push(ProjectReleaseManifestEntry {
            path: entry.name().replace('\\', "/"),
            size_bytes: bytes.len() as u64,
            checksum_sha1: format!("{:x}", Sha1::digest(&bytes)),
        });
    }

    entries.sort_by(|left, right| left.path.cmp(&right.path));
    Ok(entries)
}

fn next_duplicated_project_name(projects: &[ProjectRecord], source_name: &str) -> String {
    let base_name = require_duplicate_name_seed(source_name);
    let first_candidate = format!("{base_name} Copy");
    if !projects
        .iter()
        .any(|project| project.name == first_candidate)
    {
        return first_candidate;
    }

    let mut suffix = 2_u32;
    loop {
        let candidate = format!("{base_name} Copy {suffix}");
        if !projects.iter().any(|project| project.name == candidate) {
            return candidate;
        }
        suffix += 1;
    }
}

fn require_duplicate_name_seed(source_name: &str) -> String {
    let normalized = source_name.trim();
    if normalized.is_empty() {
        "Project".to_string()
    } else {
        normalized.to_string()
    }
}

fn copy_dir_recursive(source: &Path, target: &Path) -> ServerResult<()> {
    if !source.exists() {
        return Err(ServerError::internal(
            "PROJECT_DIRECTORY_NOT_FOUND",
            format!(
                "cannot duplicate project because source directory {} does not exist",
                source.display()
            ),
        ));
    }

    fs::create_dir_all(target).map_err(|error| {
        ServerError::internal(
            "PROJECT_DUPLICATE_DIRECTORY_CREATE_FAILED",
            format!(
                "failed to create duplicated project directory {}: {error}",
                target.display()
            ),
        )
    })?;

    for entry in fs::read_dir(source).map_err(|error| {
        ServerError::internal(
            "PROJECT_DIRECTORY_READ_FAILED",
            format!(
                "failed to read project directory {}: {error}",
                source.display()
            ),
        )
    })? {
        let entry = entry.map_err(|error| {
            ServerError::internal(
                "PROJECT_DIRECTORY_ENTRY_READ_FAILED",
                format!(
                    "failed to read project directory entry in {}: {error}",
                    source.display()
                ),
            )
        })?;
        let file_type = entry.file_type().map_err(|error| {
            ServerError::internal(
                "PROJECT_DIRECTORY_ENTRY_TYPE_FAILED",
                format!(
                    "failed to resolve project directory entry type in {}: {error}",
                    source.display()
                ),
            )
        })?;
        let source_path = entry.path();
        let target_path = target.join(entry.file_name());
        let entry_name = entry.file_name().to_string_lossy().to_string();

        if matches!(
            entry_name.as_str(),
            ".git" | "node_modules" | "__MACOSX" | PROJECT_METADATA_DIR_NAME
        ) || entry_name == ".DS_Store"
            || entry_name.starts_with("._")
        {
            continue;
        }

        if file_type.is_dir() {
            copy_dir_recursive(&source_path, &target_path)?;
            continue;
        }

        if file_type.is_file() {
            fs::copy(&source_path, &target_path).map_err(|error| {
                ServerError::internal(
                    "PROJECT_FILE_COPY_FAILED",
                    format!(
                        "failed to copy project file from {} to {}: {error}",
                        source_path.display(),
                        target_path.display()
                    ),
                )
            })?;
            continue;
        }

        return Err(ServerError::internal(
            "PROJECT_DIRECTORY_ENTRY_UNSUPPORTED",
            format!(
                "unsupported project entry {} while duplicating {}",
                source_path.display(),
                source.display()
            ),
        ));
    }

    Ok(())
}

fn remove_dir_if_exists(path: &Path) {
    match fs::remove_dir_all(path) {
        Ok(()) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(_) => {}
    }
}
