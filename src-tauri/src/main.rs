// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod embedded_server;
mod framework;
mod shell;

use embedded_server::start_embedded_magic_studio_server;
use framework::AppContext;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

fn init_optional_log_plugin(app: &tauri::AppHandle) {
    let plugin = tauri_plugin_log::Builder::default()
        .clear_targets()
        .target(Target::new(TargetKind::Stdout))
        .build();

    if let Err(error) = app.plugin(plugin) {
        eprintln!("Optional startup step `log` unavailable: {error}");
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            init_optional_log_plugin(app.handle());
            start_embedded_magic_studio_server()?;
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
        .invoke_handler(shell::invoke_handler!())
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
