use sdkwork_magic_studio_server::{
    create_default_app_state, print_magic_studio_server_startup_summary, serve_app,
};

#[tokio::main]
async fn main() {
    let state = create_default_app_state();
    let listener = tokio::net::TcpListener::bind(state.config.bind_address())
        .await
        .expect("bind magic studio server");
    print_magic_studio_server_startup_summary(&state);

    serve_app(listener, state)
        .await
        .expect("serve magic studio server");
}
