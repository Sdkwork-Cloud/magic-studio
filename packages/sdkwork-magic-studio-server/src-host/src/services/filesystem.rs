use std::fs;
use std::io;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};
use crate::services::policy::{PathAccessType, PolicyService};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileSystemNodeKind {
    File,
    Directory,
    Symlink,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemStat {
    pub kind: FileSystemNodeKind,
    pub size: u64,
    pub last_modified: Option<u64>,
    pub created_at: Option<u64>,
    pub readonly: bool,
}

#[allow(dead_code)]
pub trait FileSystemService: Send + Sync {
    fn ensure_dir(&self, path: String) -> ServerResult<()>;
    fn ensure_parent_dir(&self, path: String) -> ServerResult<()>;
    fn exists(&self, path: String) -> ServerResult<bool>;
    fn read_dir(&self, path: String) -> ServerResult<Vec<FileSystemEntry>>;
    fn read_string(&self, path: String) -> ServerResult<String>;
    fn read_bytes(&self, path: String) -> ServerResult<Vec<u8>>;
    fn write_string(&self, path: String, text: String) -> ServerResult<()>;
    fn write_bytes(&self, path: String, data: Vec<u8>) -> ServerResult<()>;
    fn remove(&self, path: String) -> ServerResult<()>;
    fn rename(&self, old_path: String, new_path: String) -> ServerResult<()>;
    fn copy_file(&self, source_path: String, destination_path: String) -> ServerResult<()>;
    fn stat(&self, path: String) -> ServerResult<FileSystemStat>;
}

pub struct LocalFileSystemService {
    policy_service: PolicyService,
}

impl LocalFileSystemService {
    pub fn new(policy_service: PolicyService) -> Self {
        Self { policy_service }
    }

    fn ensure_parent(path: &Path) -> ServerResult<()> {
        if let Some(parent) = path.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|error| {
                    ServerError::internal("FS_CREATE_PARENT_DIR_FAILED", error.to_string())
                })?;
            }
        }
        Ok(())
    }

    fn ensure_path_allowed(&self, path: &str, access: PathAccessType) -> ServerResult<()> {
        self.policy_service
            .validate_path(path.to_string(), access)?
            .ensure_allowed()
    }

    fn ensure_non_empty_path(path: &str, code: &'static str) -> ServerResult<()> {
        if path.trim().is_empty() {
            return Err(ServerError::bad_request(code, "path cannot be empty"));
        }

        Ok(())
    }

    fn map_io_error(error: io::Error, code: &'static str, path: &str) -> ServerError {
        if error.kind() == io::ErrorKind::NotFound {
            return ServerError::not_found(code, format!("path not found: {path}"));
        }

        ServerError::internal(code, error.to_string())
    }

    fn metadata_to_stat(metadata: fs::Metadata) -> FileSystemStat {
        let file_type = metadata.file_type();
        let kind = if file_type.is_dir() {
            FileSystemNodeKind::Directory
        } else if file_type.is_file() {
            FileSystemNodeKind::File
        } else if file_type.is_symlink() {
            FileSystemNodeKind::Symlink
        } else {
            FileSystemNodeKind::Unknown
        };

        FileSystemStat {
            kind,
            size: metadata.len(),
            last_modified: system_time_to_unix_millis(metadata.modified()),
            created_at: system_time_to_unix_millis(metadata.created()),
            readonly: metadata.permissions().readonly(),
        }
    }
}

impl Default for LocalFileSystemService {
    fn default() -> Self {
        Self {
            policy_service: PolicyService::default(),
        }
    }
}

impl FileSystemService for LocalFileSystemService {
    fn ensure_dir(&self, path: String) -> ServerResult<()> {
        Self::ensure_non_empty_path(&path, "FS_ENSURE_DIR_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::EnsureDir)?;
        fs::create_dir_all(Path::new(&path))
            .map_err(|error| ServerError::internal("FS_CREATE_DIR_FAILED", error.to_string()))
    }

    fn ensure_parent_dir(&self, path: String) -> ServerResult<()> {
        Self::ensure_non_empty_path(&path, "FS_ENSURE_PARENT_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Write)?;
        Self::ensure_parent(Path::new(&path))
    }

    fn exists(&self, path: String) -> ServerResult<bool> {
        Self::ensure_non_empty_path(&path, "FS_EXISTS_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Read)?;
        Ok(Path::new(&path).exists())
    }

    fn read_dir(&self, path: String) -> ServerResult<Vec<FileSystemEntry>> {
        Self::ensure_non_empty_path(&path, "FS_READ_DIR_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Read)?;

        let mut entries = fs::read_dir(Path::new(&path))
            .map_err(|error| Self::map_io_error(error, "FS_READ_DIR_FAILED", &path))?
            .map(|entry| {
                let entry = entry.map_err(|error| {
                    ServerError::internal("FS_READ_DIR_ENTRY_FAILED", error.to_string())
                })?;
                let file_type = entry.file_type().map_err(|error| {
                    ServerError::internal("FS_READ_DIR_ENTRY_TYPE_FAILED", error.to_string())
                })?;

                Ok(FileSystemEntry {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: entry.path().to_string_lossy().to_string(),
                    is_directory: file_type.is_dir(),
                })
            })
            .collect::<ServerResult<Vec<_>>>()?;

        entries.sort_by(|left, right| left.name.cmp(&right.name));
        Ok(entries)
    }

    fn read_string(&self, path: String) -> ServerResult<String> {
        Self::ensure_non_empty_path(&path, "FS_READ_STRING_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Read)?;
        fs::read_to_string(Path::new(&path))
            .map_err(|error| Self::map_io_error(error, "FS_READ_STRING_FAILED", &path))
    }

    fn read_bytes(&self, path: String) -> ServerResult<Vec<u8>> {
        Self::ensure_non_empty_path(&path, "FS_READ_BYTES_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Read)?;
        fs::read(Path::new(&path))
            .map_err(|error| Self::map_io_error(error, "FS_READ_BYTES_FAILED", &path))
    }

    fn write_string(&self, path: String, text: String) -> ServerResult<()> {
        self.write_bytes(path, text.into_bytes())
    }

    fn write_bytes(&self, path: String, data: Vec<u8>) -> ServerResult<()> {
        Self::ensure_non_empty_path(&path, "FS_WRITE_BYTES_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Write)?;

        let path_buf = Path::new(&path);
        Self::ensure_parent(path_buf)?;
        fs::write(path_buf, data)
            .map_err(|error| ServerError::internal("FS_WRITE_BYTES_FAILED", error.to_string()))
    }

    fn remove(&self, path: String) -> ServerResult<()> {
        Self::ensure_non_empty_path(&path, "FS_REMOVE_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Write)?;

        let metadata = fs::symlink_metadata(Path::new(&path))
            .map_err(|error| Self::map_io_error(error, "FS_REMOVE_METADATA_FAILED", &path))?;

        if metadata.file_type().is_dir() && !metadata.file_type().is_symlink() {
            fs::remove_dir_all(Path::new(&path))
                .map_err(|error| ServerError::internal("FS_REMOVE_DIR_FAILED", error.to_string()))
        } else {
            fs::remove_file(Path::new(&path))
                .map_err(|error| ServerError::internal("FS_REMOVE_FILE_FAILED", error.to_string()))
        }
    }

    fn rename(&self, old_path: String, new_path: String) -> ServerResult<()> {
        Self::ensure_non_empty_path(&old_path, "FS_RENAME_OLD_PATH_EMPTY")?;
        Self::ensure_non_empty_path(&new_path, "FS_RENAME_NEW_PATH_EMPTY")?;
        self.ensure_path_allowed(&old_path, PathAccessType::Write)?;
        self.ensure_path_allowed(&new_path, PathAccessType::Write)?;

        let new_path_ref = Path::new(&new_path);
        Self::ensure_parent(new_path_ref)?;

        fs::rename(Path::new(&old_path), new_path_ref)
            .map_err(|error| Self::map_io_error(error, "FS_RENAME_FAILED", &old_path))
    }

    fn copy_file(&self, source_path: String, destination_path: String) -> ServerResult<()> {
        Self::ensure_non_empty_path(&source_path, "FS_COPY_FILE_SOURCE_PATH_EMPTY")?;
        Self::ensure_non_empty_path(&destination_path, "FS_COPY_FILE_DESTINATION_PATH_EMPTY")?;
        self.ensure_path_allowed(&source_path, PathAccessType::Read)?;
        self.ensure_path_allowed(&destination_path, PathAccessType::Write)?;

        let destination_path_ref = Path::new(&destination_path);
        Self::ensure_parent(destination_path_ref)?;

        fs::copy(Path::new(&source_path), destination_path_ref)
            .map(|_| ())
            .map_err(|error| Self::map_io_error(error, "FS_COPY_FILE_FAILED", &source_path))
    }

    fn stat(&self, path: String) -> ServerResult<FileSystemStat> {
        Self::ensure_non_empty_path(&path, "FS_STAT_PATH_EMPTY")?;
        self.ensure_path_allowed(&path, PathAccessType::Read)?;

        let metadata = fs::symlink_metadata(Path::new(&path))
            .map_err(|error| Self::map_io_error(error, "FS_STAT_FAILED", &path))?;
        Ok(Self::metadata_to_stat(metadata))
    }
}

fn system_time_to_unix_millis(result: io::Result<SystemTime>) -> Option<u64> {
    result
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis().min(u64::MAX as u128) as u64)
}
