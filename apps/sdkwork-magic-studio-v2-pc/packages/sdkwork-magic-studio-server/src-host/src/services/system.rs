use std::env;
use std::path::PathBuf;
use std::process::Command;

use serde::Serialize;

use crate::response::{ServerError, ServerResult};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub os: String,
    pub arch: String,
    pub home_dir: Option<String>,
    pub default_shell: String,
}

pub trait SystemService: Send + Sync {
    fn default_shell(&self) -> ServerResult<String>;
    fn home_dir(&self) -> ServerResult<Option<String>>;
    fn command_exists(&self, name: String) -> ServerResult<bool>;
    fn runtime_info(&self) -> ServerResult<RuntimeInfo>;
}

#[derive(Default)]
pub struct NativeSystemService;

impl NativeSystemService {
    fn resolve_default_shell() -> String {
        #[cfg(target_os = "windows")]
        {
            return env::var("OPEN_STUDIO_DEFAULT_SHELL")
                .unwrap_or_else(|_| "powershell".to_string());
        }

        #[cfg(not(target_os = "windows"))]
        {
            env::var("SHELL").unwrap_or_else(|_| "bash".to_string())
        }
    }

    fn resolve_home_dir() -> Option<PathBuf> {
        dirs::home_dir()
    }
}

impl SystemService for NativeSystemService {
    fn default_shell(&self) -> ServerResult<String> {
        Ok(Self::resolve_default_shell())
    }

    fn home_dir(&self) -> ServerResult<Option<String>> {
        Ok(Self::resolve_home_dir().map(|path| path.to_string_lossy().to_string()))
    }

    fn command_exists(&self, name: String) -> ServerResult<bool> {
        if name.trim().is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let exists = if cfg!(target_os = "windows") {
            let direct = Command::new("where")
                .arg(&name)
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false);
            if direct {
                return Ok(true);
            }

            if name.ends_with(".exe")
                || name.ends_with(".cmd")
                || name.ends_with(".bat")
                || name.ends_with(".ps1")
            {
                false
            } else {
                [".exe", ".cmd", ".bat", ".ps1"].iter().any(|ext| {
                    let candidate = format!("{name}{ext}");
                    Command::new("where")
                        .arg(candidate)
                        .output()
                        .map(|output| output.status.success())
                        .unwrap_or(false)
                })
            }
        } else {
            Command::new("sh")
                .args(["-l", "-c", &format!("command -v '{name}'")])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        };

        Ok(exists)
    }

    fn runtime_info(&self) -> ServerResult<RuntimeInfo> {
        Ok(RuntimeInfo {
            os: env::consts::OS.to_string(),
            arch: env::consts::ARCH.to_string(),
            home_dir: self.home_dir()?,
            default_shell: self.default_shell()?,
        })
    }
}
