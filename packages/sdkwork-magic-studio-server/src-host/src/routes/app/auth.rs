use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{success, ServerResult};
use crate::services::identity::{
    AuthCheckVerifyCodeRequest, AuthLoginRequest, AuthPasswordResetConfirmRequest,
    AuthPasswordResetRequest, AuthPhoneLoginRequest, AuthRefreshTokenRequest, AuthRegisterRequest,
    AuthSendVerifyCodeRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthQrKeyPath {
    pub qr_key: String,
}

pub async fn read_session(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::AuthSessionStateRecord>>,
> {
    Ok(success(state.identity_service.read_session_state()?))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<AuthLoginRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::AuthSessionRecord>>>
{
    Ok(success(state.identity_service.login(payload)?))
}

pub async fn login_with_phone(
    State(state): State<AppState>,
    Json(payload): Json<AuthPhoneLoginRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::AuthSessionRecord>>>
{
    Ok(success(state.identity_service.login_with_phone(payload)?))
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<AuthRegisterRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::AuthSessionRecord>>>
{
    Ok(success(state.identity_service.register(payload)?))
}

pub async fn logout(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.logout()?;
    Ok(success(json!({ "ok": true })))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(payload): Json<AuthRefreshTokenRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::AuthSessionRecord>>>
{
    Ok(success(state.identity_service.refresh_token(payload)?))
}

pub async fn send_verify_code(
    State(state): State<AppState>,
    Json(payload): Json<AuthSendVerifyCodeRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.send_verify_code(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn check_verify_code(
    State(state): State<AppState>,
    Json(payload): Json<AuthCheckVerifyCodeRequest>,
) -> ServerResult<
    Json<
        crate::response::ApiEnvelope<
            crate::services::identity::AuthVerificationCodeCheckResultRecord,
        >,
    >,
> {
    Ok(success(state.identity_service.check_verify_code(payload)?))
}

pub async fn request_password_reset(
    State(state): State<AppState>,
    Json(payload): Json<AuthPasswordResetRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.request_password_reset(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<AuthPasswordResetConfirmRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.reset_password(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn create_qr_code(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::AuthQrCodePayloadRecord>>,
> {
    Ok(success(state.identity_service.create_qr_code()?))
}

pub async fn read_qr_code_status(
    State(state): State<AppState>,
    Path(path): Path<AuthQrKeyPath>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::AuthQrCodeStatusResultRecord>>,
> {
    Ok(success(
        state.identity_service.read_qr_code_status(&path.qr_key)?,
    ))
}
