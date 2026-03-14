use std::collections::HashMap;

use tauri::Window;

use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::{NativeSystemService, SystemService};
use crate::pty::PtyState;

pub trait PtyService: Send + Sync {
    fn create(
        &self,
        window: Window,
        shell: String,
        cols: u16,
        rows: u16,
        env: Option<HashMap<String, String>>,
        initial_command: Option<String>,
    ) -> FrameworkResult<String>;
    fn start(&self, pid: String, window: Window) -> FrameworkResult<()>;
    fn write(&self, pid: String, data: String) -> FrameworkResult<()>;
    fn resize(&self, pid: String, cols: u16, rows: u16) -> FrameworkResult<()>;
    fn kill(&self, pid: String) -> FrameworkResult<()>;
    fn sync(&self, window_label: String, active_ids: Vec<String>) -> FrameworkResult<()>;
    fn kill_all(&self) -> FrameworkResult<()>;
    fn check_executable(&self, name: String) -> FrameworkResult<bool>;
}

impl PtyService for PtyState {
    fn create(
        &self,
        window: Window,
        shell: String,
        cols: u16,
        rows: u16,
        env: Option<HashMap<String, String>>,
        initial_command: Option<String>,
    ) -> FrameworkResult<String> {
        let shell = if shell.trim().is_empty() {
            NativeSystemService::default()
                .default_shell()
                .map_err(|error| {
                    FrameworkError::new("PTY_DEFAULT_SHELL_FAILED", error.to_string())
                })?
        } else {
            shell
        };
        self.create(window, shell, cols, rows, env, initial_command)
            .map_err(|error| FrameworkError::new("PTY_CREATE_FAILED", error))
    }

    fn start(&self, pid: String, window: Window) -> FrameworkResult<()> {
        self.start(&pid, window)
            .map_err(|error| FrameworkError::new("PTY_START_FAILED", error))
    }

    fn write(&self, pid: String, data: String) -> FrameworkResult<()> {
        self.write(&pid, &data)
            .map_err(|error| FrameworkError::new("PTY_WRITE_FAILED", error))
    }

    fn resize(&self, pid: String, cols: u16, rows: u16) -> FrameworkResult<()> {
        self.resize(&pid, cols, rows)
            .map_err(|error| FrameworkError::new("PTY_RESIZE_FAILED", error))
    }

    fn kill(&self, pid: String) -> FrameworkResult<()> {
        self.kill(&pid)
            .map_err(|error| FrameworkError::new("PTY_KILL_FAILED", error))
    }

    fn sync(&self, window_label: String, active_ids: Vec<String>) -> FrameworkResult<()> {
        self.sync(&window_label, active_ids)
            .map_err(|error| FrameworkError::new("PTY_SYNC_FAILED", error))
    }

    fn kill_all(&self) -> FrameworkResult<()> {
        self.kill_all()
            .map_err(|error| FrameworkError::new("PTY_KILL_ALL_FAILED", error))
    }

    fn check_executable(&self, name: String) -> FrameworkResult<bool> {
        NativeSystemService::default().command_exists(name)
    }
}
