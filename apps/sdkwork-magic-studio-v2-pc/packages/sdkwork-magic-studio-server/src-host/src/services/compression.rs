use std::fs::File;
use std::io::{self, Cursor, Read, Write};
use std::path::Path;
use std::sync::Arc;

use walkdir::WalkDir;
use zip::write::SimpleFileOptions;

use crate::response::{ServerError, ServerResult};

use super::filesystem::{FileSystemService, LocalFileSystemService};

#[allow(dead_code)]
pub trait CompressionService: Send + Sync {
    fn unzip(&self, zip_path: String, target_dir: String) -> ServerResult<()>;
    fn zip_bytes(&self, source_paths: Vec<String>) -> ServerResult<Vec<u8>>;
}

#[allow(dead_code)]
pub struct NativeCompressionService {
    file_system_service: Arc<dyn FileSystemService>,
}

impl NativeCompressionService {
    pub fn new(file_system_service: Arc<dyn FileSystemService>) -> Self {
        Self {
            file_system_service,
        }
    }
}

impl Default for NativeCompressionService {
    fn default() -> Self {
        Self {
            file_system_service: Arc::new(LocalFileSystemService::default()),
        }
    }
}

impl CompressionService for NativeCompressionService {
    fn unzip(&self, zip_path: String, target_dir: String) -> ServerResult<()> {
        let file = File::open(&zip_path).map_err(|error| {
            ServerError::internal(error.to_string())
        })?;
        let mut archive = zip::ZipArchive::new(file).map_err(|error| {
            ServerError::internal(error.to_string())
        })?;

        for index in 0..archive.len() {
            let mut file = archive.by_index(index).map_err(|error| {
                ServerError::internal(error.to_string())
            })?;

            let outpath = match file.enclosed_name() {
                Some(path) => Path::new(&target_dir).join(path),
                None => continue,
            };

            if let Some(name) = outpath.file_name() {
                let name_str = name.to_string_lossy();
                if name_str == ".DS_Store" || name_str == "__MACOSX" || name_str.starts_with("._") {
                    continue;
                }
            }
            if outpath
                .components()
                .any(|component| component.as_os_str() == "__MACOSX")
            {
                continue;
            }

            if file.name().ends_with('/') {
                self.file_system_service
                    .ensure_dir(outpath.to_string_lossy().to_string())?;
            } else {
                if let Some(parent) = outpath.parent() {
                    self.file_system_service
                        .ensure_dir(parent.to_string_lossy().to_string())?;
                }
                let mut outfile = File::create(&outpath).map_err(|error| {
                    ServerError::internal(error.to_string())
                })?;
                io::copy(&mut file, &mut outfile).map_err(|error| {
                    ServerError::internal(error.to_string())
                })?;
            }
        }

        Ok(())
    }

    fn zip_bytes(&self, source_paths: Vec<String>) -> ServerResult<Vec<u8>> {
        if source_paths.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let mut buffer = Vec::new();
        {
            let cursor = Cursor::new(&mut buffer);
            let mut zip = zip::ZipWriter::new(cursor);
            let options = SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated)
                .unix_permissions(0o755);

            for source_path in source_paths {
                if source_path.trim().is_empty() {
                    return Err(ServerError::bad_request("request validation failed"));
                }
                if !self.file_system_service.exists(source_path.clone())? {
                    return Err(ServerError::bad_request(format!("source path does not exist: {source_path}"),
                    ));
                }

                let root_path = Path::new(&source_path);
                let parent_dir = root_path.parent().unwrap_or(Path::new(""));

                if root_path.is_file() {
                    let name = root_path
                        .file_name()
                        .ok_or_else(|| {
                            ServerError::bad_request(format!("unable to resolve file name: {}", root_path.display()),
                            )
                        })?
                        .to_string_lossy();
                    if name == ".DS_Store" {
                        continue;
                    }

                    zip.start_file(name, options).map_err(|error| {
                        ServerError::internal(error.to_string(),
                        )
                    })?;
                    let mut file = File::open(root_path).map_err(|error| {
                        ServerError::internal(error.to_string(),
                        )
                    })?;
                    let mut file_buf = Vec::new();
                    file.read_to_end(&mut file_buf).map_err(|error| {
                        ServerError::internal(error.to_string(),
                        )
                    })?;
                    zip.write_all(&file_buf).map_err(|error| {
                        ServerError::internal(error.to_string(),
                        )
                    })?;
                    continue;
                }

                let walk_dir = WalkDir::new(root_path);
                for entry in walk_dir.into_iter().filter_map(|entry| entry.ok()) {
                    let path = entry.path();

                    if path.components().any(|component| {
                        component.as_os_str() == ".git" || component.as_os_str() == "node_modules"
                    }) {
                        continue;
                    }
                    if let Some(name) = path.file_name() {
                        let name_str = name.to_string_lossy();
                        if name_str == ".DS_Store" || name_str == "__MACOSX" {
                            continue;
                        }
                    }

                    let name = path.strip_prefix(parent_dir).map_err(|error| {
                        ServerError::internal(error.to_string())
                    })?;
                    let name_str = name.to_string_lossy().replace('\\', "/");

                    if name_str.is_empty() {
                        continue;
                    }

                    if path.is_file() {
                        zip.start_file(name_str.clone(), options).map_err(|error| {
                            ServerError::internal(error.to_string(),
                            )
                        })?;
                        let mut file = File::open(path).map_err(|error| {
                            ServerError::internal(error.to_string(),
                            )
                        })?;
                        let mut file_buf = Vec::new();
                        file.read_to_end(&mut file_buf).map_err(|error| {
                            ServerError::internal(error.to_string(),
                            )
                        })?;
                        zip.write_all(&file_buf).map_err(|error| {
                            ServerError::internal(error.to_string(),
                            )
                        })?;
                    } else if !name.as_os_str().is_empty() {
                        zip.add_directory(name_str, options).map_err(|error| {
                            ServerError::internal(error.to_string(),
                            )
                        })?;
                    }
                }
            }

            zip.finish().map_err(|error| {
                ServerError::internal(error.to_string())
            })?;
        }

        Ok(buffer)
    }
}
