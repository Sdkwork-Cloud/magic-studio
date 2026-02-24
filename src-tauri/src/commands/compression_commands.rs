
use std::fs::{self, File};
use std::io::{self, Read, Write, Cursor};
use std::path::Path;
use walkdir::WalkDir;
use zip::write::FileOptions;
use tauri::command;

#[command]
pub async fn native_unzip(zip_path: String, target_dir: String) -> Result<(), String> {
    // Perform blocking IO on a blocking thread to avoid freezing the main UI thread
    tauri::async_runtime::spawn_blocking(move || {
        let file = File::open(&zip_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            
            // Security: Zip Slip protection (prevents extracting to ../../../)
            let outpath = match file.enclosed_name() {
                Some(path) => Path::new(&target_dir).join(path),
                None => continue,
            };
            
            // Filter junk files (macOS metadata, etc.)
            if let Some(name) = outpath.file_name() {
                let name_str = name.to_string_lossy();
                if name_str == ".DS_Store" || name_str == "__MACOSX" || name_str.starts_with("._") {
                    continue;
                }
            }
            if outpath.components().any(|c| c.as_os_str() == "__MACOSX") {
                continue;
            }

            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p).map_err(|e| e.to_string())?;
                    }
                }
                let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
                io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

#[command]
pub async fn native_zip_bytes(source_paths: Vec<String>) -> Result<Vec<u8>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut buffer = Vec::new();
        {
            let cursor = Cursor::new(&mut buffer);
            let mut zip = zip::ZipWriter::new(cursor);
            let options = FileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated)
                .unix_permissions(0o755);
        
            for source_path in source_paths {
                let root_path = Path::new(&source_path);
                let parent_dir = root_path.parent().unwrap_or(Path::new(""));
                
                if root_path.is_file() {
                    let name = root_path.file_name().unwrap().to_string_lossy();
                    if name == ".DS_Store" { continue; }

                    zip.start_file(name, options).map_err(|e| e.to_string())?;
                    let mut f = File::open(root_path).map_err(|e| e.to_string())?;
                    let mut f_buf = Vec::new();
                    f.read_to_end(&mut f_buf).map_err(|e| e.to_string())?;
                    zip.write_all(&f_buf).map_err(|e| e.to_string())?;
                    continue;
                }
        
                let walk_dir = WalkDir::new(root_path);
                for entry in walk_dir.into_iter().filter_map(|e| e.ok()) {
                     let path = entry.path();
                     
                     // Smart Filtering: Skip node_modules and .git folders recursively
                     if path.components().any(|c| c.as_os_str() == ".git" || c.as_os_str() == "node_modules") {
                        continue;
                     }
                     if let Some(name) = path.file_name() {
                        let name_str = name.to_string_lossy();
                        if name_str == ".DS_Store" || name_str == "__MACOSX" { continue; }
                     }

                     let name = path.strip_prefix(parent_dir).map_err(|e| e.to_string())?;
                     let name_str = name.to_string_lossy().replace("\\", "/");
                     
                     if name_str.is_empty() { continue; }

                     if path.is_file() {
                         zip.start_file(name_str.clone(), options).map_err(|e| e.to_string())?;
                         let mut f = File::open(path).map_err(|e| e.to_string())?;
                         let mut f_buf = Vec::new();
                         f.read_to_end(&mut f_buf).map_err(|e| e.to_string())?;
                         zip.write_all(&f_buf).map_err(|e| e.to_string())?;
                     } else if !name.as_os_str().is_empty() {
                         zip.add_directory(name_str, options).map_err(|e| e.to_string())?;
                     }
                }
            }
            zip.finish().map_err(|e| e.to_string())?;
        }
        Ok(buffer)
    }).await.map_err(|e| e.to_string())?
}
