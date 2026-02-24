
use tauri::{State, Window};
use crate::pty::PtyState;
use std::collections::HashMap;
use std::process::Command;

#[tauri::command]
pub async fn create_pty(
    state: State<'_, PtyState>,
    window: Window,
    shell: String,
    cols: u16,
    rows: u16,
    env: Option<HashMap<String, String>>,
    initial_command: Option<String>,
) -> Result<String, String> {
    state.create(window, shell, cols, rows, env, initial_command)
}

#[tauri::command]
pub async fn start_pty(
    state: State<'_, PtyState>,
    window: Window,
    pid: String
) -> Result<(), String> {
    state.start(&pid, window)
}

#[tauri::command]
pub async fn write_pty(
    state: State<'_, PtyState>,
    pid: String,
    data: String
) -> Result<(), String> {
    state.write(&pid, &data)
}

#[tauri::command]
pub async fn resize_pty(
    state: State<'_, PtyState>,
    pid: String,
    cols: u16,
    rows: u16
) -> Result<(), String> {
    state.resize(&pid, cols, rows)
}

#[tauri::command]
pub async fn kill_pty(
    state: State<'_, PtyState>,
    pid: String
) -> Result<(), String> {
    state.kill(&pid)
}

#[tauri::command]
pub async fn sync_pty_sessions(
    state: State<'_, PtyState>,
    window: Window,
    active_ids: Vec<String>
) -> Result<(), String> {
    state.sync(window.label(), active_ids)
}

#[tauri::command]
pub async fn check_executable(name: String) -> bool {
    tauri::async_runtime::spawn_blocking(move || {
        if cfg!(target_os = "windows") {
            // Try exact match first
            let output = Command::new("where").arg(&name).output();
            if let Ok(o) = output {
                if o.status.success() { return true; }
            }
    
            // Try common extensions if not present
            if !name.ends_with(".exe") && !name.ends_with(".cmd") && !name.ends_with(".bat") && !name.ends_with(".ps1") {
                let extensions = [".exe", ".cmd", ".bat", ".ps1"];
                for ext in extensions {
                    let with_ext = format!("{}{}", name, ext);
                    let output = Command::new("where").arg(&with_ext).output();
                    if let Ok(o) = output {
                        if o.status.success() { return true; }
                    }
                }
            }
            false
        } else {
            // Use a login shell to ensure PATH is loaded correctly (e.g. nvm, homebrew, cargo)
            // 'command -v' is more portable than 'which'
            let output = Command::new("sh")
                .args(["-l", "-c", &format!("command -v '{}'", name)])
                .output();
    
            match output {
                Ok(o) => o.status.success(),
                Err(_) => false,
            }
        }
    }).await.unwrap_or(false)
}
