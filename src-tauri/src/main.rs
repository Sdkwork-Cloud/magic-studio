
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod pty;
mod session;
mod events;
mod platform;
mod fs;
mod browser;

use tauri::Manager;
use commands::pty_commands::{create_pty, start_pty, write_pty, resize_pty, kill_pty, sync_pty_sessions, check_executable};
use commands::compression_commands::{native_unzip, native_zip_bytes};
use browser::{browser_new_tab_request, browser_is_supported};
use pty::PtyState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app.get_webview_window("main").expect("no main window").set_focus();
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
            app.manage(PtyState::default());
            
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
            browser_new_tab_request,
            browser_is_supported
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
             match event {
                 tauri::RunEvent::ExitRequested { .. } => {
                     let state = app_handle.state::<PtyState>();
                     let _ = state.kill_all();
                 }
                 _ => {}
             }
        });
}
