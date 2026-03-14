// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod events;
mod framework;
mod pty;
mod session;

use commands::browser_commands::{browser_is_supported, browser_new_tab_request};
use commands::compression_commands::{native_unzip, native_zip_bytes};
use commands::database_commands::{db_execute, db_execute_batch, db_query};
use commands::filesystem_commands::{
    fs_ensure_dir, fs_exists, fs_read_bytes, fs_read_string, fs_write_bytes,
};
use commands::job_commands::{job_cancel, job_get, job_list, job_submit_toolkit};
use commands::media_commands::{media_ffmpeg_available, media_ffmpeg_exec, media_ffprobe_json};
use commands::migration_commands::{migration_apply, migration_status};
use commands::policy_commands::{policy_snapshot, policy_validate_command, policy_validate_path};
use commands::pty_commands::{
    check_executable, create_pty, kill_pty, resize_pty, start_pty, sync_pty_sessions, write_pty,
};
use commands::system_commands::{system_command_exists, system_runtime_info};
use commands::toolkit_commands::{toolkit_capabilities, toolkit_execute};
use framework::AppContext;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            app.manage(AppContext::default());

            // Add default menu for macOS/Windows standard shortcuts (Copy, Paste, Quit, etc.)
            #[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
            {
                use tauri::menu::Menu;
                let menu = Menu::default(app.handle())?;
                app.set_menu(menu)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_pty,
            start_pty,
            write_pty,
            resize_pty,
            kill_pty,
            sync_pty_sessions,
            check_executable,
            native_unzip,
            native_zip_bytes,
            media_ffmpeg_available,
            media_ffmpeg_exec,
            media_ffprobe_json,
            db_execute,
            db_query,
            db_execute_batch,
            fs_ensure_dir,
            fs_exists,
            fs_read_string,
            fs_read_bytes,
            fs_write_bytes,
            browser_new_tab_request,
            browser_is_supported,
            system_runtime_info,
            system_command_exists,
            toolkit_capabilities,
            toolkit_execute,
            job_submit_toolkit,
            job_get,
            job_list,
            job_cancel,
            migration_status,
            migration_apply,
            policy_validate_path,
            policy_validate_command,
            policy_snapshot
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } => {
                let context = app_handle.state::<AppContext>();
                let _ = context.pty().kill_all();
            }
            _ => {}
        });
}
