mod config;
mod contract;
mod response;
mod routes;
mod services;
mod state;

use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

pub use config::{ServerConfig, ServerRuntimeMode};
use contract::load_embedded_server_contract;
use state::AppState;

pub fn create_app_state(config: ServerConfig) -> AppState {
    let contract = load_embedded_server_contract();
    AppState::new(config, contract)
}

pub fn create_default_app_state() -> AppState {
    create_app_state(ServerConfig::default())
}

pub fn create_desktop_app_state() -> AppState {
    create_app_state(ServerConfig::desktop_local())
}

pub fn build_app() -> Router {
    build_app_with_state(create_default_app_state())
}

pub fn build_app_with_state(state: AppState) -> Router {
    routes::build_router(&state)
        .with_state(state)
        .layer(CorsLayer::permissive())
}

pub fn print_magic_studio_server_startup_summary(state: &AppState) {
    let api_base_url = state.config.api_base_url();
    let user_center = state.config.user_center();
    println!(
        "Magic Studio {} runtime listening at {api_base_url}",
        state.config.runtime_mode().as_str()
    );
    println!("Docs: {}{}", api_base_url, state.contract.meta.docs_path);
    println!(
        "OpenAPI: {}{}",
        api_base_url, state.contract.meta.live_open_api_path
    );
    println!(
        "Routes: {}{}",
        api_base_url,
        state.contract.route_catalog_path()
    );
    println!(
        "User center: {} ({})",
        user_center.mode().as_str(),
        user_center.provider_key()
    );
    println!(
        "User center local API: {}",
        user_center.local_api_base_path()
    );
    if let Some(authority_base_url) = user_center.authority_base_url() {
        println!("User center authority: {authority_base_url}");
    }
    println!(
        "User center token transport: auth={}, access={}, refresh={}, session={}",
        user_center.authorization_header_name(),
        user_center.access_token_header_name(),
        user_center.refresh_token_header_name(),
        user_center.session_header_name()
    );
}

pub async fn serve_app(listener: TcpListener, state: AppState) -> std::io::Result<()> {
    state
        .admin_governance_service
        .start_background_workers()
        .map_err(|error| std::io::Error::other(error.detail.clone()))?;
    axum::serve(listener, build_app_with_state(state)).await
}

#[cfg(test)]
mod tests;
