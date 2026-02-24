
// This module provides a place for custom file system logic not covered by plugins.
// Strictly adhering to directory structure requirements.

use std::fs;
use std::path::Path;

pub fn ensure_dir(path: &str) -> std::io::Result<()> {
    if !Path::new(path).exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}
