use std::fs;
use std::path::Path;
use std::sync::Arc;

use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::policy::{NativePolicyService, PathAccessType, PolicyService};

pub trait FileSystemService: Send + Sync {
    fn ensure_dir(&self, path: String) -> FrameworkResult<()>;
    fn ensure_parent_dir(&self, path: String) -> FrameworkResult<()>;
    fn exists(&self, path: String) -> FrameworkResult<bool>;
    fn read_string(&self, path: String) -> FrameworkResult<String>;
    fn read_bytes(&self, path: String) -> FrameworkResult<Vec<u8>>;
    fn write_bytes(&self, path: String, data: Vec<u8>) -> FrameworkResult<()>;
}

pub struct LocalFileSystemService {
    policy_service: Arc<dyn PolicyService>,
}

impl LocalFileSystemService {
    pub fn new(policy_service: Arc<dyn PolicyService>) -> Self {
        Self { policy_service }
    }

    fn ensure_parent(path: &Path) -> FrameworkResult<()> {
        if let Some(parent) = path.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|error| {
                    FrameworkError::new("FS_CREATE_PARENT_DIR_FAILED", error.to_string())
                })?;
            }
        }
        Ok(())
    }

    fn ensure_path_allowed(&self, path: &str, access: PathAccessType) -> FrameworkResult<()> {
        self.policy_service
            .validate_path(path.to_string(), access)?
            .ensure_allowed()
    }
}

impl Default for LocalFileSystemService {
    fn default() -> Self {
        Self {
            policy_service: Arc::new(NativePolicyService::default()),
        }
    }
}

impl FileSystemService for LocalFileSystemService {
    fn ensure_dir(&self, path: String) -> FrameworkResult<()> {
        if path.trim().is_empty() {
            return Err(FrameworkError::new(
                "FS_ENSURE_DIR_PATH_EMPTY",
                "directory path cannot be empty",
            ));
        }
        self.ensure_path_allowed(&path, PathAccessType::EnsureDir)?;
        fs::create_dir_all(Path::new(&path))
            .map_err(|error| FrameworkError::new("FS_CREATE_DIR_FAILED", error.to_string()))
    }

    fn ensure_parent_dir(&self, path: String) -> FrameworkResult<()> {
        if path.trim().is_empty() {
            return Err(FrameworkError::new(
                "FS_ENSURE_PARENT_PATH_EMPTY",
                "file path cannot be empty",
            ));
        }
        self.ensure_path_allowed(&path, PathAccessType::Write)?;
        Self::ensure_parent(Path::new(&path))
    }

    fn exists(&self, path: String) -> FrameworkResult<bool> {
        if path.trim().is_empty() {
            return Err(FrameworkError::new(
                "FS_EXISTS_PATH_EMPTY",
                "path cannot be empty",
            ));
        }
        self.ensure_path_allowed(&path, PathAccessType::Read)?;
        Ok(Path::new(&path).exists())
    }

    fn read_string(&self, path: String) -> FrameworkResult<String> {
        if path.trim().is_empty() {
            return Err(FrameworkError::new(
                "FS_READ_STRING_PATH_EMPTY",
                "path cannot be empty",
            ));
        }
        self.ensure_path_allowed(&path, PathAccessType::Read)?;
        fs::read_to_string(Path::new(&path))
            .map_err(|error| FrameworkError::new("FS_READ_STRING_FAILED", error.to_string()))
    }

    fn read_bytes(&self, path: String) -> FrameworkResult<Vec<u8>> {
        if path.trim().is_empty() {
            return Err(FrameworkError::new(
                "FS_READ_BYTES_PATH_EMPTY",
                "path cannot be empty",
            ));
        }
        self.ensure_path_allowed(&path, PathAccessType::Read)?;
        fs::read(Path::new(&path))
            .map_err(|error| FrameworkError::new("FS_READ_BYTES_FAILED", error.to_string()))
    }

    fn write_bytes(&self, path: String, data: Vec<u8>) -> FrameworkResult<()> {
        if path.trim().is_empty() {
            return Err(FrameworkError::new(
                "FS_WRITE_BYTES_PATH_EMPTY",
                "path cannot be empty",
            ));
        }
        self.ensure_path_allowed(&path, PathAccessType::Write)?;

        let path_buf = Path::new(&path);
        Self::ensure_parent(path_buf)?;
        fs::write(path_buf, data)
            .map_err(|error| FrameworkError::new("FS_WRITE_BYTES_FAILED", error.to_string()))
    }
}
