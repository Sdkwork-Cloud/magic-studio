use axum::extract::{Path, Query, State};
use axum::Json;
use serde_json::json;

use crate::response::{list, list_with_meta, success, ServerResult};
use crate::services::identity::{
    PaginatedItems, UserAddressCreateRequest, UserAddressUpdateRequest, UserAvatarUploadRequest,
    UserBindEmailRequest, UserBindPhoneRequest, UserHistoryQuery, UserPasswordChangeRequest,
    UserProfileUpdateRequest, UserSettingsUpdateRequest, UserThirdPartyBindRequest,
    UserTwoFactorSetupRequest, UserTwoFactorVerifyRequest,
};
use crate::state::AppState;

pub async fn read_profile(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(state.identity_service.read_user_profile()?))
}

pub async fn update_profile(
    State(state): State<AppState>,
    Json(payload): Json<UserProfileUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(
        state.identity_service.update_user_profile(payload)?,
    ))
}

pub async fn upload_avatar(
    State(state): State<AppState>,
    Json(payload): Json<UserAvatarUploadRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(state.identity_service.upload_user_avatar(payload)?))
}

pub async fn read_settings(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserSettingsRecord>>>
{
    Ok(success(state.identity_service.read_user_settings()?))
}

pub async fn update_settings(
    State(state): State<AppState>,
    Json(payload): Json<UserSettingsUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserSettingsRecord>>>
{
    Ok(success(
        state.identity_service.update_user_settings(payload)?,
    ))
}

pub async fn change_password(
    State(state): State<AppState>,
    Json(payload): Json<UserPasswordChangeRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.change_user_password(payload)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn list_addresses(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::identity::UserAddressRecord>>,
> {
    Ok(list(state.identity_service.list_user_addresses()?))
}

pub async fn read_default_address(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<Option<crate::services::identity::UserAddressRecord>>>,
> {
    Ok(success(state.identity_service.read_default_user_address()?))
}

pub async fn create_address(
    State(state): State<AppState>,
    Json(payload): Json<UserAddressCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserAddressRecord>>>
{
    Ok(success(
        state.identity_service.create_user_address(payload)?,
    ))
}

pub async fn update_address(
    State(state): State<AppState>,
    Path(address_id): Path<String>,
    Json(payload): Json<UserAddressUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserAddressRecord>>>
{
    Ok(success(
        state
            .identity_service
            .update_user_address(&address_id, payload)?,
    ))
}

pub async fn delete_address(
    State(state): State<AppState>,
    Path(address_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.delete_user_address(&address_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn set_default_address(
    State(state): State<AppState>,
    Path(address_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserAddressRecord>>>
{
    Ok(success(
        state
            .identity_service
            .set_default_user_address(&address_id)?,
    ))
}

pub async fn read_login_history(
    State(state): State<AppState>,
    Query(query): Query<UserHistoryQuery>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::identity::UserLoginHistoryRecord>>,
> {
    let PaginatedItems {
        items,
        page,
        page_size,
        total,
    } = state.identity_service.read_user_login_history(query)?;
    Ok(list_with_meta(items, page, page_size, total))
}

pub async fn read_generation_history(
    State(state): State<AppState>,
    Query(query): Query<UserHistoryQuery>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::identity::UserGenerationHistoryRecord>>,
> {
    let PaginatedItems {
        items,
        page,
        page_size,
        total,
    } = state.identity_service.read_user_generation_history(query)?;
    Ok(list_with_meta(items, page, page_size, total))
}

pub async fn list_bindings(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::identity::UserBindingRecord>>,
> {
    Ok(list(state.identity_service.list_user_bindings()?))
}

pub async fn bind_email(
    State(state): State<AppState>,
    Json(payload): Json<UserBindEmailRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(state.identity_service.bind_user_email(payload)?))
}

pub async fn unbind_email(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(state.identity_service.unbind_user_email()?))
}

pub async fn bind_phone(
    State(state): State<AppState>,
    Json(payload): Json<UserBindPhoneRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(state.identity_service.bind_user_phone(payload)?))
}

pub async fn unbind_phone(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserProfileRecord>>>
{
    Ok(success(state.identity_service.unbind_user_phone()?))
}

pub async fn bind_platform(
    State(state): State<AppState>,
    Path(platform): Path<String>,
    Json(payload): Json<UserThirdPartyBindRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<crate::services::identity::UserBindingRecord>>>
{
    Ok(success(
        state
            .identity_service
            .bind_user_platform(&platform, payload)?,
    ))
}

pub async fn unbind_platform(
    State(state): State<AppState>,
    Path(platform): Path<String>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.unbind_user_platform(&platform)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn list_sessions(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::identity::UserSecuritySessionRecord>>,
> {
    Ok(list(state.identity_service.list_user_sessions()?))
}

pub async fn revoke_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.revoke_user_session(&session_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn list_devices(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiListEnvelope<crate::services::identity::UserTrustedDeviceRecord>>,
> {
    Ok(list(state.identity_service.list_user_devices()?))
}

pub async fn revoke_device(
    State(state): State<AppState>,
    Path(device_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.identity_service.revoke_user_device(&device_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn read_two_factor_status(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::UserTwoFactorStatusRecord>>,
> {
    Ok(success(
        state.identity_service.read_user_two_factor_status()?,
    ))
}

pub async fn setup_two_factor(
    State(state): State<AppState>,
    Json(payload): Json<UserTwoFactorSetupRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::UserTwoFactorSetupRecord>>,
> {
    Ok(success(
        state.identity_service.setup_user_two_factor(payload)?,
    ))
}

pub async fn verify_two_factor(
    State(state): State<AppState>,
    Json(payload): Json<UserTwoFactorVerifyRequest>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::UserTwoFactorStatusRecord>>,
> {
    Ok(success(
        state.identity_service.verify_user_two_factor(payload)?,
    ))
}

pub async fn disable_two_factor(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiEnvelope<crate::services::identity::UserTwoFactorStatusRecord>>,
> {
    Ok(success(state.identity_service.disable_user_two_factor()?))
}
