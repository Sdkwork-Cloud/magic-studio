pub(crate) mod commands;
mod pty;
mod session;

pub(crate) use pty::PtyState;

#[allow(dead_code)]
pub const SHELL_COMMAND_MODULES: &[&str] = &["commands::pty", "commands::system"];

#[allow(dead_code)]
pub const SHELL_COMMAND_NAMES: &[&str] = &[
    "create_pty",
    "start_pty",
    "write_pty",
    "resize_pty",
    "kill_pty",
    "sync_pty_sessions",
    "system_command_exists",
];

#[allow(dead_code)]
pub const PTY_OUTPUT_EVENT_PREFIX: &str = "pty-output:";

#[allow(dead_code)]
pub const SHELL_EVENT_PREFIXES: &[&str] = &[PTY_OUTPUT_EVENT_PREFIX];

pub fn pty_output_event(id: &str) -> String {
    format!("{PTY_OUTPUT_EVENT_PREFIX}{id}")
}

macro_rules! invoke_handler {
    () => {
        tauri::generate_handler![
            crate::shell::commands::pty::create_pty,
            crate::shell::commands::pty::start_pty,
            crate::shell::commands::pty::write_pty,
            crate::shell::commands::pty::resize_pty,
            crate::shell::commands::pty::kill_pty,
            crate::shell::commands::pty::sync_pty_sessions,
            crate::shell::commands::system::system_command_exists
        ]
    };
}

pub(crate) use invoke_handler;
