use std::env;
use std::process::Command;

use crate::framework::error::{FrameworkError, FrameworkResult};

pub trait SystemService: Send + Sync {
    fn default_shell(&self) -> FrameworkResult<String>;
    fn command_exists(&self, name: String) -> FrameworkResult<bool>;
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
}

impl SystemService for NativeSystemService {
    fn default_shell(&self) -> FrameworkResult<String> {
        Ok(Self::resolve_default_shell())
    }

    fn command_exists(&self, name: String) -> FrameworkResult<bool> {
        if name.trim().is_empty() {
            return Err(FrameworkError::new(
                "SYSTEM_COMMAND_NAME_EMPTY",
                "command name cannot be empty",
            ));
        }

        let exists = if cfg!(target_os = "windows") {
            // Try exact binary name first.
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
}
