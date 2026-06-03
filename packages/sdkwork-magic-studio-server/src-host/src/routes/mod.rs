use axum::Router;

use crate::state::AppState;

pub mod admin;
pub mod app;
pub mod core;
pub mod docs;

pub fn build_router(state: &AppState) -> Router<AppState> {
    let router = Router::<AppState>::new();
    let router = core::mount_routes(router, state);
    let router = docs::mount_routes(router, state);
    let router = app::mount_routes(router, state);
    admin::mount_routes(router, state)
}
