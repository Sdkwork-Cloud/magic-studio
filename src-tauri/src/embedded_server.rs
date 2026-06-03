use std::net::TcpListener as StdTcpListener;

use anyhow::Context;
use sdkwork_magic_studio_server::{
    create_desktop_app_state, print_magic_studio_server_startup_summary, serve_app,
};
use tokio::net::TcpListener;

pub fn start_embedded_magic_studio_server() -> anyhow::Result<()> {
    let state = create_desktop_app_state();
    let bind_address = state.config.bind_address();
    let listener = StdTcpListener::bind(&bind_address)
        .with_context(|| format!("bind embedded Magic Studio server at {bind_address}"))?;

    listener.set_nonblocking(true).with_context(|| {
        format!("set embedded Magic Studio server listener non-blocking at {bind_address}")
    })?;

    tauri::async_runtime::spawn(async move {
        let listener = match TcpListener::from_std(listener).with_context(|| {
            format!("register embedded Magic Studio server listener with tokio at {bind_address}")
        }) {
            Ok(listener) => listener,
            Err(error) => {
                eprintln!("Embedded Magic Studio server failed to start: {error:#}");
                return;
            }
        };

        print_magic_studio_server_startup_summary(&state);

        if let Err(error) = serve_app(listener, state).await {
            eprintln!("Embedded Magic Studio server stopped: {error}");
        }
    });

    Ok(())
}
