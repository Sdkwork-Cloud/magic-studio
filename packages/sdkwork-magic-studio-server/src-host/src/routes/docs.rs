use axum::extract::State;
use axum::response::Html;
use axum::{routing::get, Router};

use crate::state::AppState;

pub fn mount_routes(router: Router<AppState>, state: &AppState) -> Router<AppState> {
    router.route(&state.contract.meta.docs_path, get(docs))
}

pub async fn docs(State(state): State<AppState>) -> Html<String> {
    let api_base_url = state.config.api_base_url();
    let openapi_url = format!("{}{}", api_base_url, state.contract.meta.live_open_api_path);
    let routes_url = format!("{}{}", api_base_url, state.contract.route_catalog_path());

    Html(format!(
        r#"<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Magic Studio Server Docs</title>
    <style>
      body {{
        font-family: "Segoe UI", sans-serif;
        margin: 40px;
        color: #132238;
        background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
      }}
      main {{
        max-width: 820px;
        padding: 32px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 24px 80px rgba(19, 34, 56, 0.12);
      }}
      a {{
        color: #005cc8;
      }}
      code {{
        font-family: "Cascadia Code", monospace;
      }}
    </style>
  </head>
  <body>
    <main>
      <h1>Magic Studio Server</h1>
      <p>Rust server-first runtime is active.</p>
      <ul>
        <li><a href="{openapi_url}">OpenAPI JSON</a></li>
        <li><a href="{routes_url}">Route Catalog</a></li>
      </ul>
      <p><code>{api_base_url}</code></p>
    </main>
  </body>
</html>"#
    ))
}
