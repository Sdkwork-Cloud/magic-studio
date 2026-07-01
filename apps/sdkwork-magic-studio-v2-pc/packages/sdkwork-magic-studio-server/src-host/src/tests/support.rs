use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use axum::{body::Body, http::Request, response::Response, Router};
use http_body_util::BodyExt;
use tower::ServiceExt;

use crate::{
    build_app, build_app_with_state, contract::load_embedded_server_contract, create_app_state,
    create_desktop_app_state, ServerConfig,
};

pub(crate) fn server_app() -> Router {
    build_app()
}

pub(crate) fn desktop_app() -> Router {
    build_app_with_state(create_desktop_app_state())
}

pub(crate) fn server_app_with_data_root(data_root: impl AsRef<Path>) -> Router {
    let config = ServerConfig::default().with_data_root(data_root.as_ref().to_path_buf());
    build_app_with_state(create_app_state(config))
}

pub(crate) fn contract() -> crate::contract::ServerContract {
    load_embedded_server_contract()
}

pub(crate) fn route_path(route_id: &str) -> String {
    contract().require_route_path_by_id(route_id)
}

pub(crate) fn openapi_path(route_id: &str) -> String {
    contract().openapi_path_for_route_id(route_id)
}

pub(crate) fn route_path_with_params(route_id: &str, parameters: &[(&str, &str)]) -> String {
    contract().materialize_route_path(route_id, parameters)
}

pub(crate) fn empty_request(uri: impl Into<String>) -> Request<Body> {
    Request::builder()
        .uri(uri.into())
        .body(Body::empty())
        .expect("build request")
}

pub(crate) fn empty_request_with_method(method: &str, uri: impl Into<String>) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(uri.into())
        .body(Body::empty())
        .expect("build request")
}

pub(crate) fn json_request(
    method: &str,
    uri: impl Into<String>,
    body: impl Into<String>,
) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(uri.into())
        .header("content-type", "application/json")
        .body(Body::from(body.into()))
        .expect("build json request")
}

pub(crate) async fn call(app: Router, request: Request<Body>) -> Response {
    app.oneshot(request).await.expect("call route")
}

pub(crate) async fn response_json(response: Response) -> serde_json::Value {
    let body = response
        .into_body()
        .collect()
        .await
        .expect("collect response body")
        .to_bytes();
    serde_json::from_slice(&body).expect("parse json response")
}

pub(crate) async fn response_text(response: Response) -> String {
    let body = response
        .into_body()
        .collect()
        .await
        .expect("collect response body")
        .to_bytes();
    String::from_utf8(body.to_vec()).expect("utf8 response body")
}

pub(crate) async fn establish_authenticated_session(app: Router, username: &str) {
    let email = format!("{username}@example.test");
    let send_code_body = serde_json::json!({
        "verifyType": "EMAIL",
        "target": email,
        "scene": "REGISTER",
    })
    .to_string();
    let send_code_response = call(
        app.clone(),
        json_request("POST", route_path("appAuthSendVerifyCode"), send_code_body),
    )
    .await;
    let send_code_status = send_code_response.status().as_u16();
    let send_code_text = response_text(send_code_response).await;
    assert_eq!(
        send_code_status, 200,
        "send verify code response: {send_code_text}"
    );

    let register_body = serde_json::json!({
        "username": username,
        "password": "test-password",
        "confirmPassword": "test-password",
        "email": email,
        "verificationCode": "246810",
    })
    .to_string();
    let register_response = call(
        app,
        json_request("POST", route_path("appAuthRegister"), register_body),
    )
    .await;
    let register_status = register_response.status().as_u16();
    let register_text = response_text(register_response).await;
    assert_eq!(register_status, 200, "register response: {register_text}");
}

pub(crate) fn unique_temp_path(stem: &str) -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time after epoch")
        .as_nanos();
    std::env::temp_dir().join(format!("{stem}-{nonce}"))
}

pub(crate) fn json_string(path: &Path) -> String {
    serde_json::to_string(&path.to_string_lossy().to_string()).expect("path json")
}
