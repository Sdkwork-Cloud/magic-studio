use std::collections::BTreeMap;
use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use data_encoding::BASE32_NOPAD;
use hmac::{Hmac, Mac};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha1::Sha1;
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

type HmacSha1 = Hmac<Sha1>;

const IDENTITY_SCHEMA_VERSION: &str = "magic-studio.identity.v2";
const DEFAULT_VERIFY_CODE: &str = "246810";
const DEFAULT_QR_TTL_SECONDS: i64 = 300;
const DEFAULT_CLIENT_KIND: &str = "server";
const DEFAULT_DEVICE_NAME: &str = "magic-studio-local";
const DEFAULT_DEVICE_ID: &str = "magic-studio-local-device";
const DEFAULT_DEVICE_IP_ADDRESS: &str = "127.0.0.1";
const DEFAULT_TOTP_ISSUER: &str = "Magic Studio";
const DEFAULT_TOTP_DIGITS: usize = 6;
const DEFAULT_TOTP_STEP_SECONDS: i64 = 30;
const DEFAULT_TOTP_ALLOWED_SKEW_STEPS: i64 = 1;
const DEFAULT_TOTP_SECRET_BYTES: usize = 20;
const DEFAULT_TWO_FACTOR_RECOVERY_CODE_COUNT: usize = 8;
const DEFAULT_TWO_FACTOR_RECOVERY_CODE_BYTES: usize = 5;

static IDENTITY_USER_COUNTER: AtomicU64 = AtomicU64::new(1);
static IDENTITY_TOKEN_COUNTER: AtomicU64 = AtomicU64::new(1);
static IDENTITY_QR_COUNTER: AtomicU64 = AtomicU64::new(1);
static IDENTITY_SESSION_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuthVerifyType {
    Email,
    Phone,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuthScene {
    Login,
    Register,
    ResetPassword,
    BindEmail,
    BindPhone,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuthPasswordResetChannel {
    Email,
    Sms,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AuthQrCodeStatus {
    Pending,
    Scanned,
    Confirmed,
    Expired,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSessionUserRecord {
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSessionRecord {
    pub access_token: String,
    pub auth_token: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refresh_token: Option<String>,
    pub expires_at: String,
    pub user: AuthSessionUserRecord,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSessionStateRecord {
    pub is_authenticated: bool,
    pub session: Option<AuthSessionRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthQrCodePayloadRecord {
    pub qr_key: String,
    pub qr_content: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub qr_url: Option<String>,
    pub expire_time: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthQrCodeStatusResultRecord {
    pub status: AuthQrCodeStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session: Option<AuthSessionRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthVerificationCodeCheckResultRecord {
    pub valid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsGeneralRecord {
    pub compact_model_selector: bool,
    pub launch_on_startup: bool,
    pub start_minimized: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsNotificationsRecord {
    pub new_messages: bool,
    pub security_alerts: bool,
    pub system_updates: bool,
    pub task_completions: bool,
    pub task_failures: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsPrivacyRecord {
    pub personalized_recommendations: bool,
    pub share_usage_data: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsSecurityRecord {
    pub login_alerts: bool,
    pub two_factor_auth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsRecord {
    pub theme: String,
    pub font_size: u32,
    pub font_family: String,
    pub language: String,
    pub auto_play: bool,
    pub high_quality: bool,
    pub data_saver: bool,
    pub general: UserSettingsGeneralRecord,
    pub notifications: UserSettingsNotificationsRecord,
    pub privacy: UserSettingsPrivacyRecord,
    pub security: UserSettingsSecurityRecord,
    pub notification_settings: Map<String, Value>,
    pub privacy_settings: Map<String, Value>,
    pub download_settings: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfileRecord {
    pub id: String,
    pub uuid: String,
    pub user_id: String,
    pub username: String,
    pub nickname: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub gender: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub region: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAddressRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    pub phone: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub country_code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub province_code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub city_code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub district_code: Option<String>,
    pub address_detail: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub postal_code: Option<String>,
    pub full_address: String,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBindingRecord {
    pub id: String,
    pub uuid: String,
    pub platform: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    pub bound_at: String,
    #[serde(default)]
    pub metadata: Map<String, Value>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserLoginHistoryRecord {
    pub id: String,
    pub uuid: String,
    pub auth_method: String,
    pub status: String,
    pub login_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub device_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_kind: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserGenerationHistoryRecord {
    pub id: String,
    pub uuid: String,
    pub task_id: String,
    pub category: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cover_asset_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cover_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result_count: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone)]
pub struct UserGenerationHistoryUpsert {
    pub task_id: String,
    pub category: String,
    pub status: String,
    pub prompt: Option<String>,
    pub cover_asset_id: Option<String>,
    pub cover_url: Option<String>,
    pub result_count: Option<u32>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum UserSecuritySessionStatus {
    Active,
    Expired,
    Revoked,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSecuritySessionRecord {
    pub id: String,
    pub uuid: String,
    pub user_id: String,
    pub device_id: String,
    pub auth_method: String,
    pub status: UserSecuritySessionStatus,
    pub expires_at: String,
    pub last_active_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub device_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_kind: Option<String>,
    pub current: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserTrustedDeviceRecord {
    pub id: String,
    pub uuid: String,
    pub user_id: String,
    pub name: String,
    pub client_kind: String,
    pub trusted_at: String,
    pub last_seen_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_ip_address: Option<String>,
    pub active_session_count: usize,
    pub current: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserTwoFactorStatusRecord {
    pub enabled: bool,
    pub pending_setup: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_at: Option<String>,
    pub recovery_codes_remaining: usize,
    pub method: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserTwoFactorSetupRecord {
    pub issuer: String,
    pub account_name: String,
    pub secret_base32: String,
    pub otp_auth_url: String,
    pub recovery_codes: Vec<String>,
    pub status: UserTwoFactorStatusRecord,
}

#[derive(Debug, Clone)]
pub struct PaginatedItems<T> {
    pub items: Vec<T>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthClientDeviceType {
    Desktop,
    Web,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthLoginRequest {
    pub username: String,
    pub password: String,
    pub two_factor_code: Option<String>,
    pub device_type: Option<AuthClientDeviceType>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthPhoneLoginRequest {
    pub phone: String,
    pub code: String,
    pub two_factor_code: Option<String>,
    pub device_type: Option<AuthClientDeviceType>,
}

#[derive(Debug, Clone)]
struct AuthClientContext {
    client_kind: String,
    device_id_suffix: String,
    device_name: String,
}

impl AuthClientDeviceType {
    fn client_kind(self) -> &'static str {
        match self {
            AuthClientDeviceType::Desktop => "desktop",
            AuthClientDeviceType::Web => "web",
        }
    }
}

impl AuthClientContext {
    fn server() -> Self {
        Self {
            client_kind: DEFAULT_CLIENT_KIND.to_string(),
            device_id_suffix: DEFAULT_DEVICE_ID.to_string(),
            device_name: DEFAULT_DEVICE_NAME.to_string(),
        }
    }

    fn from_device_type(device_type: Option<AuthClientDeviceType>) -> Self {
        match device_type {
            Some(device_type) => {
                let client_kind = device_type.client_kind().to_string();
                Self {
                    client_kind: client_kind.clone(),
                    device_id_suffix: format!("magic-studio-{client_kind}-device"),
                    device_name: format!("magic-studio-{client_kind}"),
                }
            }
            None => Self::server(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthRegisterRequest {
    pub username: String,
    pub password: String,
    pub confirm_password: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub verification_code: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthRefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSendVerifyCodeRequest {
    pub verify_type: AuthVerifyType,
    pub target: String,
    pub scene: AuthScene,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthCheckVerifyCodeRequest {
    pub verify_type: AuthVerifyType,
    pub target: String,
    pub scene: AuthScene,
    pub code: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthPasswordResetRequest {
    pub account: String,
    pub channel: AuthPasswordResetChannel,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthPasswordResetConfirmRequest {
    pub account: String,
    pub code: String,
    pub new_password: String,
    pub confirm_password: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfileUpdateRequest {
    pub username: Option<String>,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub gender: Option<String>,
    pub region: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAvatarUploadRequest {
    pub file: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsGeneralPatch {
    pub compact_model_selector: Option<bool>,
    pub launch_on_startup: Option<bool>,
    pub start_minimized: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsNotificationsPatch {
    pub new_messages: Option<bool>,
    pub security_alerts: Option<bool>,
    pub system_updates: Option<bool>,
    pub task_completions: Option<bool>,
    pub task_failures: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsPrivacyPatch {
    pub personalized_recommendations: Option<bool>,
    pub share_usage_data: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct UserSettingsSecurityPatch {
    pub login_alerts: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingsUpdateRequest {
    pub theme: Option<String>,
    pub font_size: Option<u32>,
    pub font_family: Option<String>,
    pub language: Option<String>,
    pub auto_play: Option<bool>,
    pub high_quality: Option<bool>,
    pub data_saver: Option<bool>,
    pub general: Option<UserSettingsGeneralPatch>,
    pub notifications: Option<UserSettingsNotificationsPatch>,
    pub privacy: Option<UserSettingsPrivacyPatch>,
    pub security: Option<UserSettingsSecurityPatch>,
    pub notification_settings: Option<Map<String, Value>>,
    pub privacy_settings: Option<Map<String, Value>>,
    pub download_settings: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPasswordChangeRequest {
    pub old_password: String,
    pub new_password: String,
    pub confirm_password: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAddressCreateRequest {
    pub name: String,
    pub phone: String,
    pub address_detail: String,
    pub country_code: Option<String>,
    pub province_code: Option<String>,
    pub city_code: Option<String>,
    pub district_code: Option<String>,
    pub postal_code: Option<String>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAddressUpdateRequest {
    pub name: Option<String>,
    pub phone: Option<String>,
    pub address_detail: Option<String>,
    pub country_code: Option<String>,
    pub province_code: Option<String>,
    pub city_code: Option<String>,
    pub district_code: Option<String>,
    pub postal_code: Option<String>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UserHistoryQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub current: Option<usize>,
    pub page_num: Option<usize>,
    pub size: Option<usize>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBindEmailRequest {
    pub email: String,
    pub verification_code: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBindPhoneRequest {
    pub phone: String,
    pub verification_code: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserThirdPartyBindRequest {
    pub code: Option<String>,
    pub state: Option<String>,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub expire_time: Option<String>,
    pub third_party_user_id: Option<String>,
    pub third_party_user_name: Option<String>,
    pub third_party_avatar: Option<String>,
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UserTwoFactorSetupRequest {
    pub issuer: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserTwoFactorVerifyRequest {
    pub code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IdentityRegistryDocument {
    pub schema_version: String,
    pub users: Vec<StoredIdentityUser>,
    #[serde(default)]
    pub sessions: Vec<StoredAuthSession>,
    #[serde(default)]
    pub current_session_id: Option<String>,
    pub verification_codes: Vec<StoredVerificationCode>,
    pub qr_codes: Vec<StoredQrCode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredIdentityUser {
    pub id: String,
    pub uuid: String,
    pub username: String,
    pub password: String,
    pub nickname: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub gender: Option<String>,
    pub region: Option<String>,
    pub settings: UserSettingsRecord,
    #[serde(default)]
    pub addresses: Vec<UserAddressRecord>,
    #[serde(default)]
    pub third_party_bindings: Vec<UserBindingRecord>,
    #[serde(default)]
    pub login_history: Vec<UserLoginHistoryRecord>,
    #[serde(default)]
    pub generation_history: Vec<UserGenerationHistoryRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub two_factor_secret: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pending_two_factor_secret: Option<String>,
    #[serde(default)]
    pub two_factor_recovery_codes: Vec<String>,
    #[serde(default)]
    pub pending_two_factor_recovery_codes: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub two_factor_verified_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredAuthSession {
    pub id: String,
    pub access_token: String,
    pub auth_token: String,
    pub refresh_token: String,
    pub expires_at: String,
    pub user_id: String,
    pub device_id: String,
    pub auth_method: String,
    pub ip_address: Option<String>,
    pub device_name: Option<String>,
    pub client_kind: Option<String>,
    pub last_active_at: String,
    pub created_at: String,
    pub updated_at: String,
    pub revoked_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredVerificationCode {
    pub id: String,
    pub target: String,
    pub verify_type: AuthVerifyType,
    pub scene: AuthScene,
    pub code: String,
    pub created_at: i64,
    pub expire_time: i64,
    pub consumed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredQrCode {
    pub qr_key: String,
    pub qr_content: String,
    pub qr_url: Option<String>,
    pub expire_time: i64,
    pub session_id: Option<String>,
}

pub trait IdentityService: Send + Sync {
    fn read_session_state(&self) -> ServerResult<AuthSessionStateRecord>;
    fn login(&self, input: AuthLoginRequest) -> ServerResult<AuthSessionRecord>;
    fn login_with_phone(&self, input: AuthPhoneLoginRequest) -> ServerResult<AuthSessionRecord>;
    fn register(&self, input: AuthRegisterRequest) -> ServerResult<AuthSessionRecord>;
    fn logout(&self) -> ServerResult<()>;
    fn refresh_token(&self, input: AuthRefreshTokenRequest) -> ServerResult<AuthSessionRecord>;
    fn send_verify_code(&self, input: AuthSendVerifyCodeRequest) -> ServerResult<()>;
    fn check_verify_code(
        &self,
        input: AuthCheckVerifyCodeRequest,
    ) -> ServerResult<AuthVerificationCodeCheckResultRecord>;
    fn request_password_reset(&self, input: AuthPasswordResetRequest) -> ServerResult<()>;
    fn reset_password(&self, input: AuthPasswordResetConfirmRequest) -> ServerResult<()>;
    fn create_qr_code(&self) -> ServerResult<AuthQrCodePayloadRecord>;
    fn read_qr_code_status(&self, qr_key: &str) -> ServerResult<AuthQrCodeStatusResultRecord>;
    fn read_user_profile(&self) -> ServerResult<UserProfileRecord>;
    fn update_user_profile(
        &self,
        input: UserProfileUpdateRequest,
    ) -> ServerResult<UserProfileRecord>;
    fn upload_user_avatar(&self, input: UserAvatarUploadRequest)
        -> ServerResult<UserProfileRecord>;
    fn read_user_settings(&self) -> ServerResult<UserSettingsRecord>;
    fn update_user_settings(
        &self,
        input: UserSettingsUpdateRequest,
    ) -> ServerResult<UserSettingsRecord>;
    fn change_user_password(&self, input: UserPasswordChangeRequest) -> ServerResult<()>;
    fn list_user_addresses(&self) -> ServerResult<Vec<UserAddressRecord>>;
    fn read_default_user_address(&self) -> ServerResult<Option<UserAddressRecord>>;
    fn create_user_address(
        &self,
        input: UserAddressCreateRequest,
    ) -> ServerResult<UserAddressRecord>;
    fn update_user_address(
        &self,
        address_id: &str,
        input: UserAddressUpdateRequest,
    ) -> ServerResult<UserAddressRecord>;
    fn delete_user_address(&self, address_id: &str) -> ServerResult<()>;
    fn set_default_user_address(&self, address_id: &str) -> ServerResult<UserAddressRecord>;
    fn read_user_login_history(
        &self,
        query: UserHistoryQuery,
    ) -> ServerResult<PaginatedItems<UserLoginHistoryRecord>>;
    fn read_user_generation_history(
        &self,
        query: UserHistoryQuery,
    ) -> ServerResult<PaginatedItems<UserGenerationHistoryRecord>>;
    fn record_user_generation_history(
        &self,
        input: UserGenerationHistoryUpsert,
    ) -> ServerResult<UserGenerationHistoryRecord>;
    fn list_user_bindings(&self) -> ServerResult<Vec<UserBindingRecord>>;
    fn bind_user_email(&self, input: UserBindEmailRequest) -> ServerResult<UserProfileRecord>;
    fn unbind_user_email(&self) -> ServerResult<UserProfileRecord>;
    fn bind_user_phone(&self, input: UserBindPhoneRequest) -> ServerResult<UserProfileRecord>;
    fn unbind_user_phone(&self) -> ServerResult<UserProfileRecord>;
    fn bind_user_platform(
        &self,
        platform: &str,
        input: UserThirdPartyBindRequest,
    ) -> ServerResult<UserBindingRecord>;
    fn unbind_user_platform(&self, platform: &str) -> ServerResult<()>;
    fn list_user_sessions(&self) -> ServerResult<Vec<UserSecuritySessionRecord>>;
    fn revoke_user_session(&self, session_id: &str) -> ServerResult<()>;
    fn list_user_devices(&self) -> ServerResult<Vec<UserTrustedDeviceRecord>>;
    fn revoke_user_device(&self, device_id: &str) -> ServerResult<()>;
    fn read_user_two_factor_status(&self) -> ServerResult<UserTwoFactorStatusRecord>;
    fn setup_user_two_factor(
        &self,
        input: UserTwoFactorSetupRequest,
    ) -> ServerResult<UserTwoFactorSetupRecord>;
    fn verify_user_two_factor(
        &self,
        input: UserTwoFactorVerifyRequest,
    ) -> ServerResult<UserTwoFactorStatusRecord>;
    fn disable_user_two_factor(&self) -> ServerResult<UserTwoFactorStatusRecord>;
}

pub struct FileBackedIdentityService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedIdentityService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_IDENTITY_LOCK_FAILED",
                "identity registry lock was poisoned",
            )
        })
    }

    fn default_document(&self) -> IdentityRegistryDocument {
        IdentityRegistryDocument {
            schema_version: IDENTITY_SCHEMA_VERSION.to_string(),
            users: Vec::new(),
            sessions: Vec::new(),
            current_session_id: None,
            verification_codes: Vec::new(),
            qr_codes: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<IdentityRegistryDocument> {
        let path = self.storage_paths.identity_registry_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_IDENTITY_READ_FAILED",
                    format!(
                        "failed to read identity registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<IdentityRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_IDENTITY_PARSE_FAILED",
                    format!(
                        "failed to parse identity registry {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &IdentityRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_IDENTITY_SERIALIZE_FAILED",
                format!("failed to serialize identity registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.identity_registry_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_IDENTITY_WRITE_FAILED",
                format!(
                    "failed to write identity registry to {}: {error}",
                    self.storage_paths.identity_registry_file().display()
                ),
            )
        })
    }

    fn require_user<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
        user_id: &str,
    ) -> ServerResult<&'a StoredIdentityUser> {
        document
            .users
            .iter()
            .find(|user| user.id == user_id || user.uuid == user_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_IDENTITY_USER_NOT_FOUND",
                    format!("identity user {user_id} was not found"),
                )
            })
    }

    fn require_user_mut<'a>(
        &self,
        document: &'a mut IdentityRegistryDocument,
        user_id: &str,
    ) -> ServerResult<&'a mut StoredIdentityUser> {
        document
            .users
            .iter_mut()
            .find(|user| user.id == user_id || user.uuid == user_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_IDENTITY_USER_NOT_FOUND",
                    format!("identity user {user_id} was not found"),
                )
            })
    }

    fn require_current_user<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
    ) -> ServerResult<&'a StoredIdentityUser> {
        let user_id = self.require_current_session(document)?.user_id.clone();
        self.require_user(document, &user_id)
    }

    fn require_current_user_mut<'a>(
        &self,
        document: &'a mut IdentityRegistryDocument,
    ) -> ServerResult<&'a mut StoredIdentityUser> {
        let user_id = self.require_current_session(document)?.user_id.clone();
        self.require_user_mut(document, &user_id)
    }

    fn normalize_document(&self, document: &mut IdentityRegistryDocument) {
        document.schema_version = IDENTITY_SCHEMA_VERSION.to_string();

        for user in &mut document.users {
            Self::sync_user_security_projection(user);
        }

        if let Some(current_session_id) = document.current_session_id.as_deref() {
            let keep_current = document.sessions.iter().any(|session| {
                session.id == current_session_id && Self::is_session_active(session)
            });
            if !keep_current {
                document.current_session_id = None;
            }
        }
    }

    fn find_current_session<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
    ) -> Option<&'a StoredAuthSession> {
        let current_session_id = document.current_session_id.as_deref()?;
        document
            .sessions
            .iter()
            .find(|session| session.id == current_session_id)
    }

    fn find_current_session_mut<'a>(
        &self,
        document: &'a mut IdentityRegistryDocument,
    ) -> Option<&'a mut StoredAuthSession> {
        let current_session_id = document.current_session_id.clone()?;
        document
            .sessions
            .iter_mut()
            .find(|session| session.id == current_session_id)
    }

    fn require_current_session<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
    ) -> ServerResult<&'a StoredAuthSession> {
        let session = self
            .find_current_session(document)
            .ok_or_else(session_required_error)?;

        if !Self::is_session_active(session) {
            return Err(session_required_error());
        }

        Ok(session)
    }

    fn map_session(
        &self,
        document: &IdentityRegistryDocument,
        session: &StoredAuthSession,
    ) -> ServerResult<AuthSessionRecord> {
        let user = self.require_user(document, &session.user_id)?;
        Ok(AuthSessionRecord {
            access_token: session.access_token.clone(),
            auth_token: session.auth_token.clone(),
            refresh_token: Some(session.refresh_token.clone()),
            expires_at: session.expires_at.clone(),
            user: AuthSessionUserRecord {
                user_id: user.id.clone(),
                username: user.username.clone(),
                display_name: user.nickname.clone(),
                email: user.email.clone(),
                phone: user.phone.clone(),
                avatar: user.avatar.clone(),
                avatar_url: user.avatar_url.clone(),
            },
        })
    }

    fn map_user_profile(&self, user: &StoredIdentityUser) -> UserProfileRecord {
        UserProfileRecord {
            id: user.id.clone(),
            uuid: user.uuid.clone(),
            user_id: user.id.clone(),
            username: user.username.clone(),
            nickname: user.nickname.clone(),
            email: user.email.clone(),
            phone: user.phone.clone(),
            avatar: user.avatar.clone(),
            avatar_url: user.avatar_url.clone(),
            bio: user.bio.clone(),
            first_name: user.first_name.clone(),
            last_name: user.last_name.clone(),
            gender: user.gender.clone(),
            region: user.region.clone(),
            created_at: user.created_at.clone(),
            updated_at: user.updated_at.clone(),
            deleted_at: None,
        }
    }

    fn map_user_settings(&self, user: &StoredIdentityUser) -> UserSettingsRecord {
        let mut settings = user.settings.clone();
        settings.security.two_factor_auth = Self::is_two_factor_enabled(user);
        settings
    }

    fn default_user_settings(&self) -> UserSettingsRecord {
        UserSettingsRecord {
            theme: "system".to_string(),
            font_size: 14,
            font_family: "system-ui".to_string(),
            language: "system".to_string(),
            auto_play: false,
            high_quality: true,
            data_saver: false,
            general: UserSettingsGeneralRecord {
                compact_model_selector: true,
                launch_on_startup: false,
                start_minimized: false,
            },
            notifications: UserSettingsNotificationsRecord {
                new_messages: true,
                security_alerts: true,
                system_updates: true,
                task_completions: true,
                task_failures: true,
            },
            privacy: UserSettingsPrivacyRecord {
                personalized_recommendations: false,
                share_usage_data: false,
            },
            security: UserSettingsSecurityRecord {
                login_alerts: true,
                two_factor_auth: false,
            },
            notification_settings: Map::new(),
            privacy_settings: Map::new(),
            download_settings: Map::new(),
        }
    }

    fn compose_full_address(
        &self,
        country_code: Option<&str>,
        province_code: Option<&str>,
        city_code: Option<&str>,
        district_code: Option<&str>,
        address_detail: &str,
    ) -> String {
        let mut segments: Vec<String> = Vec::new();

        for value in [country_code, province_code, city_code, district_code] {
            if let Some(value) = value {
                let value = value.trim();
                if !value.is_empty() {
                    segments.push(value.to_string());
                }
            }
        }

        segments.push(address_detail.trim().to_string());
        segments.join(" ")
    }

    fn map_contact_binding(
        &self,
        user: &StoredIdentityUser,
        platform: &str,
        target: &str,
    ) -> UserBindingRecord {
        UserBindingRecord {
            id: format!("{}-{platform}-binding", user.id),
            uuid: to_client_entity_uuid(&format!("{}-{platform}-binding", user.id)),
            platform: platform.to_string(),
            target: Some(target.to_string()),
            display_name: Some(user.nickname.clone()),
            avatar_url: user.avatar_url.clone(),
            bound_at: user.updated_at.clone(),
            metadata: Map::new(),
            created_at: user.created_at.clone(),
            updated_at: user.updated_at.clone(),
            deleted_at: None,
        }
    }

    fn list_bindings_for_user(&self, user: &StoredIdentityUser) -> Vec<UserBindingRecord> {
        let mut bindings = Vec::new();

        if let Some(email) = user.email.as_deref() {
            bindings.push(self.map_contact_binding(user, "email", email));
        }

        if let Some(phone) = user.phone.as_deref() {
            bindings.push(self.map_contact_binding(user, "phone", phone));
        }

        bindings.extend(user.third_party_bindings.clone());
        bindings
    }

    fn sync_user_security_projection(user: &mut StoredIdentityUser) {
        user.settings.security.two_factor_auth = Self::is_two_factor_enabled(user);
    }

    fn is_two_factor_enabled(user: &StoredIdentityUser) -> bool {
        user.two_factor_secret.is_some() && user.two_factor_verified_at.is_some()
    }

    fn map_two_factor_status(&self, user: &StoredIdentityUser) -> UserTwoFactorStatusRecord {
        UserTwoFactorStatusRecord {
            enabled: Self::is_two_factor_enabled(user),
            pending_setup: user.pending_two_factor_secret.is_some(),
            verified_at: user.two_factor_verified_at.clone(),
            recovery_codes_remaining: if Self::is_two_factor_enabled(user) {
                user.two_factor_recovery_codes.len()
            } else {
                user.pending_two_factor_recovery_codes.len()
            },
            method: "totp".to_string(),
        }
    }

    fn parse_timestamp(value: &str) -> Option<OffsetDateTime> {
        OffsetDateTime::parse(value, &Rfc3339).ok()
    }

    fn derive_session_status(session: &StoredAuthSession) -> UserSecuritySessionStatus {
        if session.revoked_at.is_some() {
            return UserSecuritySessionStatus::Revoked;
        }

        let expires_at = Self::parse_timestamp(&session.expires_at);
        if expires_at
            .map(|value| value <= OffsetDateTime::now_utc())
            .unwrap_or(false)
        {
            return UserSecuritySessionStatus::Expired;
        }

        UserSecuritySessionStatus::Active
    }

    fn is_session_active(session: &StoredAuthSession) -> bool {
        matches!(
            Self::derive_session_status(session),
            UserSecuritySessionStatus::Active
        )
    }

    fn session_matches_id(session: &StoredAuthSession, session_id: &str) -> bool {
        session.id == session_id || to_client_entity_uuid(&session.id) == session_id
    }

    fn device_matches_id(session: &StoredAuthSession, device_id: &str) -> bool {
        session.device_id == device_id || to_client_entity_uuid(&session.device_id) == device_id
    }

    fn map_user_session(
        &self,
        document: &IdentityRegistryDocument,
        session: &StoredAuthSession,
    ) -> UserSecuritySessionRecord {
        UserSecuritySessionRecord {
            id: session.id.clone(),
            uuid: to_client_entity_uuid(&session.id),
            user_id: session.user_id.clone(),
            device_id: session.device_id.clone(),
            auth_method: session.auth_method.clone(),
            status: Self::derive_session_status(session),
            expires_at: session.expires_at.clone(),
            last_active_at: session.last_active_at.clone(),
            ip_address: session.ip_address.clone(),
            device_name: session.device_name.clone(),
            client_kind: session.client_kind.clone(),
            current: document.current_session_id.as_deref() == Some(session.id.as_str()),
            created_at: session.created_at.clone(),
            updated_at: session.updated_at.clone(),
        }
    }

    fn list_devices_for_user(
        &self,
        document: &IdentityRegistryDocument,
        user_id: &str,
    ) -> Vec<UserTrustedDeviceRecord> {
        let mut devices: BTreeMap<String, UserTrustedDeviceRecord> = BTreeMap::new();

        for session in document
            .sessions
            .iter()
            .filter(|session| session.user_id == user_id)
        {
            let entry = devices.entry(session.device_id.clone()).or_insert_with(|| {
                UserTrustedDeviceRecord {
                    id: session.device_id.clone(),
                    uuid: to_client_entity_uuid(&session.device_id),
                    user_id: session.user_id.clone(),
                    name: session
                        .device_name
                        .clone()
                        .unwrap_or_else(|| DEFAULT_DEVICE_NAME.to_string()),
                    client_kind: session
                        .client_kind
                        .clone()
                        .unwrap_or_else(|| DEFAULT_CLIENT_KIND.to_string()),
                    trusted_at: session.created_at.clone(),
                    last_seen_at: session.last_active_at.clone(),
                    last_ip_address: session.ip_address.clone(),
                    active_session_count: 0,
                    current: false,
                    created_at: session.created_at.clone(),
                    updated_at: session.updated_at.clone(),
                }
            });

            if session.created_at < entry.trusted_at {
                entry.trusted_at = session.created_at.clone();
                entry.created_at = session.created_at.clone();
            }

            if session.last_active_at >= entry.last_seen_at {
                entry.last_seen_at = session.last_active_at.clone();
                entry.last_ip_address = session.ip_address.clone();
                entry.updated_at = session.updated_at.clone();
                if let Some(device_name) = session.device_name.clone() {
                    entry.name = device_name;
                }
                if let Some(client_kind) = session.client_kind.clone() {
                    entry.client_kind = client_kind;
                }
            }

            if Self::is_session_active(session) {
                entry.active_session_count += 1;
            }

            if document.current_session_id.as_deref() == Some(session.id.as_str()) {
                entry.current = true;
            }
        }

        let mut items = devices.into_values().collect::<Vec<_>>();
        items.sort_by(|left, right| right.last_seen_at.cmp(&left.last_seen_at));
        items
    }

    fn percent_encode_component(value: &str) -> String {
        let mut encoded = String::with_capacity(value.len());

        for byte in value.bytes() {
            if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.' | b'_' | b'~') {
                encoded.push(byte as char);
            } else {
                encoded.push_str(&format!("%{byte:02X}"));
            }
        }

        encoded
    }

    fn build_two_factor_account_name(user: &StoredIdentityUser) -> String {
        user.email
            .clone()
            .or_else(|| user.phone.clone())
            .unwrap_or_else(|| user.username.clone())
    }

    fn generate_totp_secret() -> String {
        let mut secret = [0_u8; DEFAULT_TOTP_SECRET_BYTES];
        OsRng.fill_bytes(&mut secret);
        BASE32_NOPAD.encode(&secret)
    }

    fn generate_recovery_codes() -> Vec<String> {
        (0..DEFAULT_TWO_FACTOR_RECOVERY_CODE_COUNT)
            .map(|_| {
                let mut bytes = [0_u8; DEFAULT_TWO_FACTOR_RECOVERY_CODE_BYTES];
                OsRng.fill_bytes(&mut bytes);
                let raw = BASE32_NOPAD.encode(&bytes);
                format!("{}-{}", &raw[0..4], &raw[4..8])
            })
            .collect()
    }

    fn decode_totp_secret(secret_base32: &str) -> ServerResult<Vec<u8>> {
        BASE32_NOPAD
            .decode(secret_base32.as_bytes())
            .map_err(|error| {
                ServerError::internal(
                    "APP_USER_TWO_FACTOR_SECRET_INVALID",
                    format!("failed to decode TOTP secret: {error}"),
                )
            })
    }

    fn normalize_two_factor_code(code: &str) -> String {
        code.chars()
            .filter(|character| character.is_ascii_alphanumeric())
            .map(|character| character.to_ascii_uppercase())
            .collect()
    }

    fn generate_totp_for_counter(secret_base32: &str, counter: u64) -> ServerResult<String> {
        let secret = Self::decode_totp_secret(secret_base32)?;
        let mut mac = HmacSha1::new_from_slice(&secret).map_err(|error| {
            ServerError::internal(
                "APP_USER_TWO_FACTOR_HMAC_INIT_FAILED",
                format!("failed to initialize TOTP HMAC: {error}"),
            )
        })?;

        mac.update(&counter.to_be_bytes());
        let digest = mac.finalize().into_bytes();
        let offset = (digest[digest.len() - 1] & 0x0f) as usize;
        let binary = ((u32::from(digest[offset]) & 0x7f) << 24)
            | (u32::from(digest[offset + 1]) << 16)
            | (u32::from(digest[offset + 2]) << 8)
            | u32::from(digest[offset + 3]);
        let otp = binary % 10_u32.pow(DEFAULT_TOTP_DIGITS as u32);

        Ok(format!("{otp:0width$}", width = DEFAULT_TOTP_DIGITS))
    }

    fn verify_totp_code(secret_base32: &str, code: &str) -> ServerResult<bool> {
        let normalized_code = Self::normalize_two_factor_code(code);
        if normalized_code.len() != DEFAULT_TOTP_DIGITS
            || !normalized_code
                .chars()
                .all(|character| character.is_ascii_digit())
        {
            return Ok(false);
        }

        let current_counter = OffsetDateTime::now_utc()
            .unix_timestamp()
            .div_euclid(DEFAULT_TOTP_STEP_SECONDS);

        for skew in -DEFAULT_TOTP_ALLOWED_SKEW_STEPS..=DEFAULT_TOTP_ALLOWED_SKEW_STEPS {
            let counter = current_counter + skew;
            if counter < 0 {
                continue;
            }

            if Self::generate_totp_for_counter(secret_base32, counter as u64)? == normalized_code {
                return Ok(true);
            }
        }

        Ok(false)
    }

    fn consume_enabled_two_factor_code(
        &self,
        user: &mut StoredIdentityUser,
        code: &str,
    ) -> ServerResult<()> {
        let normalized_code = Self::normalize_two_factor_code(code);

        if let Some(secret) = user.two_factor_secret.as_deref() {
            if Self::verify_totp_code(secret, &normalized_code)? {
                return Ok(());
            }
        }

        if let Some(index) = user
            .two_factor_recovery_codes
            .iter()
            .position(|recovery_code| {
                Self::normalize_two_factor_code(recovery_code) == normalized_code
            })
        {
            user.two_factor_recovery_codes.remove(index);
            user.updated_at = current_timestamp();
            Self::sync_user_security_projection(user);
            return Ok(());
        }

        Err(ServerError::forbidden(
            "APP_AUTH_TWO_FACTOR_CODE_INVALID",
            "twoFactorCode is invalid",
        ))
    }

    fn verify_pending_two_factor_code(
        &self,
        user: &StoredIdentityUser,
        code: &str,
    ) -> ServerResult<()> {
        let secret = user.pending_two_factor_secret.as_deref().ok_or_else(|| {
            ServerError::bad_request(
                "APP_USER_TWO_FACTOR_SETUP_NOT_FOUND",
                "two-factor setup has not been started",
            )
        })?;

        if !Self::verify_totp_code(secret, code)? {
            return Err(ServerError::forbidden(
                "APP_USER_TWO_FACTOR_CODE_INVALID",
                "two-factor verification code is invalid",
            ));
        }

        Ok(())
    }

    fn create_two_factor_setup_record(
        &self,
        user: &StoredIdentityUser,
        issuer: &str,
        secret_base32: &str,
        recovery_codes: Vec<String>,
    ) -> UserTwoFactorSetupRecord {
        let account_name = Self::build_two_factor_account_name(user);
        let encoded_issuer = Self::percent_encode_component(issuer);
        let encoded_account_name = Self::percent_encode_component(&account_name);

        UserTwoFactorSetupRecord {
            issuer: issuer.to_string(),
            account_name: account_name.clone(),
            secret_base32: secret_base32.to_string(),
            otp_auth_url: format!(
                "otpauth://totp/{}%3A{}?secret={}&issuer={}&algorithm=SHA1&digits={}&period={}",
                encoded_issuer,
                encoded_account_name,
                secret_base32,
                encoded_issuer,
                DEFAULT_TOTP_DIGITS,
                DEFAULT_TOTP_STEP_SECONDS,
            ),
            recovery_codes,
            status: self.map_two_factor_status(user),
        }
    }

    fn record_login_history(
        &self,
        user: &mut StoredIdentityUser,
        auth_method: &str,
        client_context: &AuthClientContext,
    ) {
        let now = current_timestamp();
        let id = next_entity_id("login-history", &IDENTITY_TOKEN_COUNTER);
        user.login_history.insert(
            0,
            UserLoginHistoryRecord {
                id: id.clone(),
                uuid: to_client_entity_uuid(&id),
                auth_method: auth_method.to_string(),
                status: "success".to_string(),
                login_at: now.clone(),
                ip_address: Some("127.0.0.1".to_string()),
                device_name: Some(client_context.device_name.clone()),
                client_kind: Some(client_context.client_kind.clone()),
                created_at: now.clone(),
                updated_at: now,
                deleted_at: None,
            },
        );

        if user.login_history.len() > 500 {
            user.login_history.truncate(500);
        }
    }

    fn normalize_history_page(query: &UserHistoryQuery) -> (usize, usize) {
        let page = query
            .page
            .or(query.current)
            .or(query.page_num)
            .unwrap_or(1)
            .max(1);
        let page_size = query.page_size.or(query.size).unwrap_or(20).clamp(1, 100);
        (page, page_size)
    }

    fn paginate_records<T: Clone>(
        &self,
        records: &[T],
        query: UserHistoryQuery,
    ) -> PaginatedItems<T> {
        let (page, page_size) = Self::normalize_history_page(&query);
        let total = records.len();
        let start = page.saturating_sub(1) * page_size;

        if start >= total {
            return PaginatedItems {
                items: Vec::new(),
                page,
                page_size,
                total,
            };
        }

        let end = (start + page_size).min(total);
        PaginatedItems {
            items: records[start..end].to_vec(),
            page,
            page_size,
            total,
        }
    }

    fn require_supported_platform(&self, platform: &str) -> ServerResult<String> {
        let platform =
            require_non_empty_text(platform, "APP_USER_BIND_PLATFORM_EMPTY", "platform")?;

        if platform.eq_ignore_ascii_case("email") || platform.eq_ignore_ascii_case("phone") {
            return Err(ServerError::bad_request(
                "APP_USER_BIND_PLATFORM_RESERVED",
                "platform email and phone must use dedicated bind routes",
            ));
        }

        Ok(platform.to_lowercase())
    }

    fn resolve_user_by_login<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
        login: &str,
    ) -> Option<&'a StoredIdentityUser> {
        document.users.iter().find(|user| {
            user.username.eq_ignore_ascii_case(login)
                || user
                    .email
                    .as_deref()
                    .map(|value| value.eq_ignore_ascii_case(login))
                    .unwrap_or(false)
        })
    }

    fn resolve_user_by_phone<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
        phone: &str,
    ) -> Option<&'a StoredIdentityUser> {
        document
            .users
            .iter()
            .find(|user| user.phone.as_deref() == Some(phone))
    }

    fn ensure_unique_user_fields(
        &self,
        document: &IdentityRegistryDocument,
        username: &str,
        email: Option<&str>,
        phone: Option<&str>,
        ignore_user_id: Option<&str>,
    ) -> ServerResult<()> {
        for user in &document.users {
            if ignore_user_id == Some(user.id.as_str()) {
                continue;
            }

            if user.username.eq_ignore_ascii_case(username) {
                return Err(ServerError::conflict(
                    "APP_AUTH_USERNAME_CONFLICT",
                    format!("username {username} already exists"),
                ));
            }

            if let Some(email) = email {
                if user
                    .email
                    .as_deref()
                    .map(|value| value.eq_ignore_ascii_case(email))
                    .unwrap_or(false)
                {
                    return Err(ServerError::conflict(
                        "APP_AUTH_EMAIL_CONFLICT",
                        format!("email {email} already exists"),
                    ));
                }
            }

            if let Some(phone) = phone {
                if user.phone.as_deref() == Some(phone) {
                    return Err(ServerError::conflict(
                        "APP_AUTH_PHONE_CONFLICT",
                        format!("phone {phone} already exists"),
                    ));
                }
            }
        }

        Ok(())
    }

    fn create_session_for_user(
        &self,
        document: &mut IdentityRegistryDocument,
        user_id: &str,
        auth_method: &str,
        client_context: &AuthClientContext,
    ) -> ServerResult<AuthSessionRecord> {
        let now = current_timestamp();
        let session = StoredAuthSession {
            id: next_entity_id("auth-session", &IDENTITY_SESSION_COUNTER),
            access_token: next_token("access"),
            auth_token: next_token("auth"),
            refresh_token: next_token("refresh"),
            expires_at: future_timestamp(Duration::days(30)),
            user_id: user_id.to_string(),
            device_id: format!("{user_id}-{}", client_context.device_id_suffix),
            auth_method: auth_method.to_string(),
            ip_address: Some(DEFAULT_DEVICE_IP_ADDRESS.to_string()),
            device_name: Some(client_context.device_name.clone()),
            client_kind: Some(client_context.client_kind.clone()),
            last_active_at: now.clone(),
            created_at: now.clone(),
            updated_at: now,
            revoked_at: None,
        };
        document.current_session_id = Some(session.id.clone());
        document.sessions.push(session.clone());
        self.map_session(document, &session)
    }

    fn issue_verification_code(
        &self,
        document: &mut IdentityRegistryDocument,
        target: &str,
        verify_type: AuthVerifyType,
        scene: AuthScene,
    ) {
        document.verification_codes.retain(|item| {
            !(item.target.eq_ignore_ascii_case(target)
                && item.verify_type == verify_type
                && item.scene == scene)
        });
        document.verification_codes.push(StoredVerificationCode {
            id: next_token("verify-code"),
            target: target.to_string(),
            verify_type,
            scene,
            code: DEFAULT_VERIFY_CODE.to_string(),
            created_at: current_unix_timestamp_millis(),
            expire_time: current_unix_timestamp_millis() + (DEFAULT_QR_TTL_SECONDS * 1000),
            consumed_at: None,
        });
    }

    fn verify_code_is_valid(
        &self,
        document: &IdentityRegistryDocument,
        target: &str,
        verify_type: AuthVerifyType,
        scene: AuthScene,
        code: &str,
    ) -> bool {
        let now = current_unix_timestamp_millis();
        document.verification_codes.iter().rev().any(|item| {
            item.target.eq_ignore_ascii_case(target)
                && item.verify_type == verify_type
                && item.scene == scene
                && item.code == code
                && item.consumed_at.is_none()
                && item.expire_time >= now
        })
    }

    fn consume_verification_code(
        &self,
        document: &mut IdentityRegistryDocument,
        target: &str,
        verify_type: AuthVerifyType,
        scene: AuthScene,
        code: &str,
    ) -> ServerResult<()> {
        let now = current_unix_timestamp_millis();
        let Some(item) = document.verification_codes.iter_mut().rev().find(|item| {
            item.target.eq_ignore_ascii_case(target)
                && item.verify_type == verify_type
                && item.scene == scene
                && item.code == code
                && item.consumed_at.is_none()
                && item.expire_time >= now
        }) else {
            return Err(ServerError::bad_request(
                "APP_AUTH_VERIFY_CODE_INVALID",
                "verification code is invalid or expired",
            ));
        };

        item.consumed_at = Some(now);
        Ok(())
    }

    fn resolve_reset_target<'a>(
        &self,
        document: &'a IdentityRegistryDocument,
        account: &str,
    ) -> ServerResult<(AuthVerifyType, &'a StoredIdentityUser, String)> {
        if let Some(user) = document.users.iter().find(|user| {
            user.email
                .as_deref()
                .map(|value| value.eq_ignore_ascii_case(account))
                .unwrap_or(false)
        }) {
            return Ok((AuthVerifyType::Email, user, account.to_string()));
        }

        if let Some(user) = document
            .users
            .iter()
            .find(|user| user.phone.as_deref() == Some(account))
        {
            return Ok((AuthVerifyType::Phone, user, account.to_string()));
        }

        Err(ServerError::not_found(
            "APP_AUTH_ACCOUNT_NOT_FOUND",
            format!("identity account {account} was not found"),
        ))
    }
}

impl IdentityService for FileBackedIdentityService {
    fn read_session_state(&self) -> ServerResult<AuthSessionStateRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;

        let session = self
            .find_current_session(&document)
            .filter(|session| Self::is_session_active(session))
            .map(|session| self.map_session(&document, session))
            .transpose()?;

        Ok(AuthSessionStateRecord {
            is_authenticated: session.is_some(),
            session,
        })
    }

    fn login(&self, input: AuthLoginRequest) -> ServerResult<AuthSessionRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let username =
            require_non_empty_text(&input.username, "APP_AUTH_USERNAME_EMPTY", "username")?;
        let password =
            require_non_empty_text(&input.password, "APP_AUTH_PASSWORD_EMPTY", "password")?;
        let two_factor_code = normalize_optional_text(input.two_factor_code);
        let client_context = AuthClientContext::from_device_type(input.device_type);

        let user_id = {
            let user = self
                .resolve_user_by_login(&document, &username)
                .ok_or_else(|| {
                    ServerError::not_found(
                        "APP_AUTH_ACCOUNT_NOT_FOUND",
                        format!("identity account {username} was not found"),
                    )
                })?;

            if user.password != password {
                return Err(ServerError::forbidden(
                    "APP_AUTH_PASSWORD_INVALID",
                    "username or password is incorrect",
                ));
            }

            user.id.clone()
        };

        {
            let user = self.require_user_mut(&mut document, &user_id)?;
            if Self::is_two_factor_enabled(user) {
                let code = two_factor_code.as_deref().ok_or_else(|| {
                    ServerError::bad_request(
                        "APP_AUTH_TWO_FACTOR_CODE_REQUIRED",
                        "twoFactorCode is required when two-factor authentication is enabled",
                    )
                })?;
                self.consume_enabled_two_factor_code(user, code)?;
            }
            self.record_login_history(user, "password", &client_context);
        }
        let session =
            self.create_session_for_user(&mut document, &user_id, "password", &client_context)?;
        self.persist_to_disk(&document)?;
        Ok(session)
    }

    fn login_with_phone(&self, input: AuthPhoneLoginRequest) -> ServerResult<AuthSessionRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let phone = require_non_empty_text(&input.phone, "APP_AUTH_PHONE_EMPTY", "phone")?;
        let code = require_non_empty_text(&input.code, "APP_AUTH_CODE_EMPTY", "code")?;
        let two_factor_code = normalize_optional_text(input.two_factor_code);
        let client_context = AuthClientContext::from_device_type(input.device_type);
        self.consume_verification_code(
            &mut document,
            &phone,
            AuthVerifyType::Phone,
            AuthScene::Login,
            &code,
        )?;

        let user_id = self
            .resolve_user_by_phone(&document, &phone)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_AUTH_ACCOUNT_NOT_FOUND",
                    format!("identity phone account {phone} was not found"),
                )
            })?
            .id
            .clone();

        {
            let user = self.require_user_mut(&mut document, &user_id)?;
            if Self::is_two_factor_enabled(user) {
                let code = two_factor_code.as_deref().ok_or_else(|| {
                    ServerError::bad_request(
                        "APP_AUTH_TWO_FACTOR_CODE_REQUIRED",
                        "twoFactorCode is required when two-factor authentication is enabled",
                    )
                })?;
                self.consume_enabled_two_factor_code(user, code)?;
            }
            self.record_login_history(user, "phone_code", &client_context);
        }
        let session =
            self.create_session_for_user(&mut document, &user_id, "phone_code", &client_context)?;
        self.persist_to_disk(&document)?;
        Ok(session)
    }

    fn register(&self, input: AuthRegisterRequest) -> ServerResult<AuthSessionRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let username =
            require_non_empty_text(&input.username, "APP_AUTH_USERNAME_EMPTY", "username")?;
        let password =
            require_non_empty_text(&input.password, "APP_AUTH_PASSWORD_EMPTY", "password")?;
        let confirm_password = normalize_optional_text(input.confirm_password);
        let email = normalize_optional_text(input.email);
        let phone = normalize_optional_text(input.phone);
        let verification_code = normalize_optional_text(input.verification_code);

        if email.is_some() && phone.is_some() {
            return Err(ServerError::bad_request(
                "APP_AUTH_REGISTER_CHANNEL_CONFLICT",
                "register only supports one verification channel at a time",
            ));
        }

        if let Some(confirm_password) = confirm_password {
            if confirm_password != password {
                return Err(ServerError::bad_request(
                    "APP_AUTH_PASSWORD_CONFIRM_INVALID",
                    "confirmPassword must match password",
                ));
            }
        }

        if let Some(email) = email.as_deref() {
            let code = verification_code.as_deref().ok_or_else(|| {
                ServerError::bad_request(
                    "APP_AUTH_VERIFY_CODE_REQUIRED",
                    "verificationCode is required for email registration",
                )
            })?;
            self.consume_verification_code(
                &mut document,
                email,
                AuthVerifyType::Email,
                AuthScene::Register,
                code,
            )?;
        }

        if let Some(phone) = phone.as_deref() {
            let code = verification_code.as_deref().ok_or_else(|| {
                ServerError::bad_request(
                    "APP_AUTH_VERIFY_CODE_REQUIRED",
                    "verificationCode is required for phone registration",
                )
            })?;
            self.consume_verification_code(
                &mut document,
                phone,
                AuthVerifyType::Phone,
                AuthScene::Register,
                code,
            )?;
        }

        self.ensure_unique_user_fields(
            &document,
            &username,
            email.as_deref(),
            phone.as_deref(),
            None,
        )?;

        let now = current_timestamp();
        let id = next_entity_id("identity-user", &IDENTITY_USER_COUNTER);
        document.users.push(StoredIdentityUser {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            username: username.clone(),
            password,
            nickname: username,
            email,
            phone,
            avatar: None,
            avatar_url: None,
            bio: None,
            first_name: None,
            last_name: None,
            gender: None,
            region: None,
            settings: self.default_user_settings(),
            addresses: Vec::new(),
            third_party_bindings: Vec::new(),
            login_history: Vec::new(),
            generation_history: Vec::new(),
            two_factor_secret: None,
            pending_two_factor_secret: None,
            two_factor_recovery_codes: Vec::new(),
            pending_two_factor_recovery_codes: Vec::new(),
            two_factor_verified_at: None,
            created_at: now.clone(),
            updated_at: now,
        });

        let client_context = AuthClientContext::server();
        let session =
            self.create_session_for_user(&mut document, &id, "register", &client_context)?;
        {
            let user = self.require_user_mut(&mut document, &id)?;
            self.record_login_history(user, "register", &client_context);
        }
        self.persist_to_disk(&document)?;
        Ok(session)
    }

    fn logout(&self) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let revoked_at = current_timestamp();

        {
            let session = self
                .find_current_session_mut(&mut document)
                .ok_or_else(session_required_error)?;
            session.revoked_at = Some(revoked_at.clone());
            session.last_active_at = revoked_at.clone();
            session.updated_at = revoked_at;
        }

        document.current_session_id = None;
        self.persist_to_disk(&document)
    }

    fn refresh_token(&self, input: AuthRefreshTokenRequest) -> ServerResult<AuthSessionRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let refresh_token = require_non_empty_text(
            &input.refresh_token,
            "APP_AUTH_REFRESH_TOKEN_EMPTY",
            "refreshToken",
        )?;

        {
            let session = self
                .find_current_session_mut(&mut document)
                .ok_or_else(session_required_error)?;

            if !Self::is_session_active(session) {
                return Err(session_required_error());
            }

            if session.refresh_token != refresh_token {
                return Err(ServerError::forbidden(
                    "APP_AUTH_REFRESH_TOKEN_INVALID",
                    "refreshToken is invalid",
                ));
            }

            session.auth_token = next_token("auth");
            session.refresh_token = next_token("refresh");
            session.updated_at = current_timestamp();
            session.last_active_at = session.updated_at.clone();
            session.expires_at = future_timestamp(Duration::days(30));
        }

        self.persist_to_disk(&document)?;
        let session = self.require_current_session(&document)?;
        self.map_session(&document, session)
    }

    fn send_verify_code(&self, input: AuthSendVerifyCodeRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let target = require_non_empty_text(&input.target, "APP_AUTH_TARGET_EMPTY", "target")?;
        self.issue_verification_code(&mut document, &target, input.verify_type, input.scene);
        self.persist_to_disk(&document)
    }

    fn check_verify_code(
        &self,
        input: AuthCheckVerifyCodeRequest,
    ) -> ServerResult<AuthVerificationCodeCheckResultRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let target = require_non_empty_text(&input.target, "APP_AUTH_TARGET_EMPTY", "target")?;
        let code = require_non_empty_text(&input.code, "APP_AUTH_CODE_EMPTY", "code")?;
        Ok(AuthVerificationCodeCheckResultRecord {
            valid: self.verify_code_is_valid(
                &document,
                &target,
                input.verify_type,
                input.scene,
                &code,
            ),
        })
    }

    fn request_password_reset(&self, input: AuthPasswordResetRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let account = require_non_empty_text(&input.account, "APP_AUTH_ACCOUNT_EMPTY", "account")?;

        let (verify_type, _user, target) = match input.channel {
            AuthPasswordResetChannel::Email => {
                let (verify_type, user, target) = self.resolve_reset_target(&document, &account)?;
                if verify_type != AuthVerifyType::Email || user.email.is_none() {
                    return Err(ServerError::bad_request(
                        "APP_AUTH_PASSWORD_RESET_CHANNEL_INVALID",
                        "password reset channel EMAIL requires an email account",
                    ));
                }
                (verify_type, user, target)
            }
            AuthPasswordResetChannel::Sms => {
                let (verify_type, user, target) = self.resolve_reset_target(&document, &account)?;
                if verify_type != AuthVerifyType::Phone || user.phone.is_none() {
                    return Err(ServerError::bad_request(
                        "APP_AUTH_PASSWORD_RESET_CHANNEL_INVALID",
                        "password reset channel SMS requires a phone account",
                    ));
                }
                (verify_type, user, target)
            }
        };

        self.issue_verification_code(
            &mut document,
            &target,
            verify_type,
            AuthScene::ResetPassword,
        );
        self.persist_to_disk(&document)
    }

    fn reset_password(&self, input: AuthPasswordResetConfirmRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let account = require_non_empty_text(&input.account, "APP_AUTH_ACCOUNT_EMPTY", "account")?;
        let code = require_non_empty_text(&input.code, "APP_AUTH_CODE_EMPTY", "code")?;
        let new_password = require_non_empty_text(
            &input.new_password,
            "APP_AUTH_PASSWORD_EMPTY",
            "newPassword",
        )?;

        if let Some(confirm_password) = normalize_optional_text(input.confirm_password) {
            if confirm_password != new_password {
                return Err(ServerError::bad_request(
                    "APP_AUTH_PASSWORD_CONFIRM_INVALID",
                    "confirmPassword must match newPassword",
                ));
            }
        }

        let (verify_type, user_id, target) = {
            let (verify_type, user, target) = self.resolve_reset_target(&document, &account)?;
            (verify_type, user.id.clone(), target)
        };

        self.consume_verification_code(
            &mut document,
            &target,
            verify_type,
            AuthScene::ResetPassword,
            &code,
        )?;

        {
            let user = self.require_user_mut(&mut document, &user_id)?;
            user.password = new_password;
            user.updated_at = current_timestamp();
        }

        let revoked_at = current_timestamp();
        for session in &mut document.sessions {
            if session.user_id == user_id && session.revoked_at.is_none() {
                session.revoked_at = Some(revoked_at.clone());
                session.updated_at = revoked_at.clone();
                session.last_active_at = revoked_at.clone();
            }
        }
        document.current_session_id = None;

        self.persist_to_disk(&document)
    }

    fn create_qr_code(&self) -> ServerResult<AuthQrCodePayloadRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let qr_key = next_entity_id("auth-qr", &IDENTITY_QR_COUNTER);
        let expire_time = current_unix_timestamp_millis() + (DEFAULT_QR_TTL_SECONDS * 1000);
        let qr_content = format!("magic-studio://auth/qr/{qr_key}");
        let qr_url = Some(format!("https://local.magic-studio/auth/qr/{qr_key}"));
        let session_id = document.current_session_id.clone();

        document.qr_codes.push(StoredQrCode {
            qr_key: qr_key.clone(),
            qr_content: qr_content.clone(),
            qr_url: qr_url.clone(),
            expire_time,
            session_id,
        });
        self.persist_to_disk(&document)?;

        Ok(AuthQrCodePayloadRecord {
            qr_key,
            qr_content,
            qr_url,
            expire_time,
        })
    }

    fn read_qr_code_status(&self, qr_key: &str) -> ServerResult<AuthQrCodeStatusResultRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let qr_key = require_non_empty_text(qr_key, "APP_AUTH_QR_KEY_EMPTY", "qrKey")?;
        let qr_code = document
            .qr_codes
            .iter()
            .find(|item| item.qr_key == qr_key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_AUTH_QR_CODE_NOT_FOUND",
                    format!("auth qr code {qr_key} was not found"),
                )
            })?;

        if qr_code.expire_time < current_unix_timestamp_millis() {
            return Ok(AuthQrCodeStatusResultRecord {
                status: AuthQrCodeStatus::Expired,
                session: None,
            });
        }

        if let Some(session_id) = qr_code.session_id.as_deref() {
            let session = document
                .sessions
                .iter()
                .find(|session| session.id == session_id && Self::is_session_active(session))
                .map(|session| self.map_session(&document, session))
                .transpose()?;

            if session.is_some() {
                return Ok(AuthQrCodeStatusResultRecord {
                    status: AuthQrCodeStatus::Confirmed,
                    session,
                });
            }
        }

        Ok(AuthQrCodeStatusResultRecord {
            status: AuthQrCodeStatus::Pending,
            session: None,
        })
    }

    fn read_user_profile(&self) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.map_user_profile(self.require_current_user(&document)?))
    }

    fn update_user_profile(
        &self,
        input: UserProfileUpdateRequest,
    ) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let current_user_id = self.require_current_user(&document)?.id.clone();

        let next_username = if let Some(username) = input.username.as_ref() {
            Some(require_non_empty_text(
                username,
                "APP_USER_USERNAME_EMPTY",
                "username",
            )?)
        } else {
            None
        };

        let next_email = input
            .email
            .as_ref()
            .map(|value| require_non_empty_text(value, "APP_USER_EMAIL_EMPTY", "email"))
            .transpose()?;
        let next_phone = input
            .phone
            .as_ref()
            .map(|value| require_non_empty_text(value, "APP_USER_PHONE_EMPTY", "phone"))
            .transpose()?;

        {
            let user = self.require_current_user(&document)?;
            self.ensure_unique_user_fields(
                &document,
                next_username.as_deref().unwrap_or(&user.username),
                next_email.as_deref().or(user.email.as_deref()),
                next_phone.as_deref().or(user.phone.as_deref()),
                Some(current_user_id.as_str()),
            )?;
        }

        {
            let user = self.require_current_user_mut(&mut document)?;

            if let Some(username) = next_username {
                user.username = username;
            }
            if let Some(nickname) = input.nickname {
                user.nickname =
                    require_non_empty_text(&nickname, "APP_USER_NICKNAME_EMPTY", "nickname")?;
            }
            if let Some(email) = next_email {
                user.email = Some(email);
            }
            if let Some(phone) = next_phone {
                user.phone = Some(phone);
            }
            if let Some(avatar) = input.avatar {
                user.avatar = normalize_optional_text(Some(avatar));
            }
            if let Some(avatar_url) = input.avatar_url {
                user.avatar_url = normalize_optional_text(Some(avatar_url));
            }
            if let Some(bio) = input.bio {
                user.bio = normalize_optional_text(Some(bio));
            }
            if let Some(first_name) = input.first_name {
                user.first_name = normalize_optional_text(Some(first_name));
            }
            if let Some(last_name) = input.last_name {
                user.last_name = normalize_optional_text(Some(last_name));
            }
            if let Some(gender) = input.gender {
                user.gender = normalize_optional_text(Some(gender));
            }
            if let Some(region) = input.region {
                user.region = normalize_optional_text(Some(region));
            }
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)?;
        Ok(self.map_user_profile(self.require_user(&document, &current_user_id)?))
    }

    fn upload_user_avatar(
        &self,
        input: UserAvatarUploadRequest,
    ) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let avatar_file = require_non_empty_text(&input.file, "APP_USER_AVATAR_EMPTY", "file")?;
        let current_user_id = self.require_current_user(&document)?.id.clone();

        {
            let user = self.require_current_user_mut(&mut document)?;
            user.avatar = Some(avatar_file.clone());
            user.avatar_url = Some(avatar_file);
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)?;
        Ok(self.map_user_profile(self.require_user(&document, &current_user_id)?))
    }

    fn read_user_settings(&self) -> ServerResult<UserSettingsRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.map_user_settings(self.require_current_user(&document)?))
    }

    fn update_user_settings(
        &self,
        input: UserSettingsUpdateRequest,
    ) -> ServerResult<UserSettingsRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;

        if let Some(theme) = input.theme {
            user.settings.theme = require_non_empty_text(&theme, "APP_USER_THEME_EMPTY", "theme")?;
        }
        if let Some(font_size) = input.font_size {
            user.settings.font_size = font_size;
        }
        if let Some(font_family) = input.font_family {
            user.settings.font_family =
                require_non_empty_text(&font_family, "APP_USER_FONT_FAMILY_EMPTY", "fontFamily")?;
        }
        if let Some(language) = input.language {
            user.settings.language =
                require_non_empty_text(&language, "APP_USER_LANGUAGE_EMPTY", "language")?;
        }
        if let Some(auto_play) = input.auto_play {
            user.settings.auto_play = auto_play;
        }
        if let Some(high_quality) = input.high_quality {
            user.settings.high_quality = high_quality;
        }
        if let Some(data_saver) = input.data_saver {
            user.settings.data_saver = data_saver;
        }
        if let Some(general) = input.general {
            if let Some(value) = general.compact_model_selector {
                user.settings.general.compact_model_selector = value;
            }
            if let Some(value) = general.launch_on_startup {
                user.settings.general.launch_on_startup = value;
            }
            if let Some(value) = general.start_minimized {
                user.settings.general.start_minimized = value;
            }
        }
        if let Some(notifications) = input.notifications {
            if let Some(value) = notifications.new_messages {
                user.settings.notifications.new_messages = value;
            }
            if let Some(value) = notifications.security_alerts {
                user.settings.notifications.security_alerts = value;
            }
            if let Some(value) = notifications.system_updates {
                user.settings.notifications.system_updates = value;
            }
            if let Some(value) = notifications.task_completions {
                user.settings.notifications.task_completions = value;
            }
            if let Some(value) = notifications.task_failures {
                user.settings.notifications.task_failures = value;
            }
        }
        if let Some(privacy) = input.privacy {
            if let Some(value) = privacy.personalized_recommendations {
                user.settings.privacy.personalized_recommendations = value;
            }
            if let Some(value) = privacy.share_usage_data {
                user.settings.privacy.share_usage_data = value;
            }
        }
        if let Some(security) = input.security {
            if let Some(value) = security.login_alerts {
                user.settings.security.login_alerts = value;
            }
        }
        if let Some(notification_settings) = input.notification_settings {
            user.settings.notification_settings = notification_settings;
        }
        if let Some(privacy_settings) = input.privacy_settings {
            user.settings.privacy_settings = privacy_settings;
        }
        if let Some(download_settings) = input.download_settings {
            user.settings.download_settings = download_settings;
        }

        Self::sync_user_security_projection(user);
        user.updated_at = current_timestamp();
        let settings = self.map_user_settings(user);
        self.persist_to_disk(&document)?;
        Ok(settings)
    }

    fn change_user_password(&self, input: UserPasswordChangeRequest) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let old_password = require_non_empty_text(
            &input.old_password,
            "APP_USER_OLD_PASSWORD_EMPTY",
            "oldPassword",
        )?;
        let new_password = require_non_empty_text(
            &input.new_password,
            "APP_USER_NEW_PASSWORD_EMPTY",
            "newPassword",
        )?;
        let confirm_password = require_non_empty_text(
            &input.confirm_password,
            "APP_USER_CONFIRM_PASSWORD_EMPTY",
            "confirmPassword",
        )?;

        if confirm_password != new_password {
            return Err(ServerError::bad_request(
                "APP_USER_PASSWORD_CONFIRM_INVALID",
                "confirmPassword must match newPassword",
            ));
        }

        let current_user_id = self.require_current_user(&document)?.id.clone();

        {
            let user = self.require_user_mut(&mut document, &current_user_id)?;
            if user.password != old_password {
                return Err(ServerError::forbidden(
                    "APP_USER_OLD_PASSWORD_INVALID",
                    "oldPassword is incorrect",
                ));
            }

            user.password = new_password;
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)
    }

    fn list_user_addresses(&self) -> ServerResult<Vec<UserAddressRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.require_current_user(&document)?.addresses.clone())
    }

    fn read_default_user_address(&self) -> ServerResult<Option<UserAddressRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let user = self.require_current_user(&document)?;

        Ok(user
            .addresses
            .iter()
            .find(|address| address.is_default)
            .cloned()
            .or_else(|| user.addresses.first().cloned()))
    }

    fn create_user_address(
        &self,
        input: UserAddressCreateRequest,
    ) -> ServerResult<UserAddressRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        let name = require_non_empty_text(&input.name, "APP_USER_ADDRESS_NAME_EMPTY", "name")?;
        let phone = require_non_empty_text(&input.phone, "APP_USER_ADDRESS_PHONE_EMPTY", "phone")?;
        let address_detail = require_non_empty_text(
            &input.address_detail,
            "APP_USER_ADDRESS_DETAIL_EMPTY",
            "addressDetail",
        )?;
        let country_code = normalize_optional_text(input.country_code);
        let province_code = normalize_optional_text(input.province_code);
        let city_code = normalize_optional_text(input.city_code);
        let district_code = normalize_optional_text(input.district_code);
        let postal_code = normalize_optional_text(input.postal_code);
        let now = current_timestamp();
        let make_default = input.is_default.unwrap_or(user.addresses.is_empty());

        if make_default {
            for address in &mut user.addresses {
                address.is_default = false;
                address.updated_at = now.clone();
            }
        }

        let id = next_entity_id("user-address", &IDENTITY_TOKEN_COUNTER);
        let address = UserAddressRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            name,
            phone,
            country_code: country_code.clone(),
            province_code: province_code.clone(),
            city_code: city_code.clone(),
            district_code: district_code.clone(),
            address_detail: address_detail.clone(),
            postal_code,
            full_address: self.compose_full_address(
                country_code.as_deref(),
                province_code.as_deref(),
                city_code.as_deref(),
                district_code.as_deref(),
                &address_detail,
            ),
            is_default: make_default,
            created_at: now.clone(),
            updated_at: now.clone(),
            deleted_at: None,
        };

        user.addresses.push(address.clone());
        user.updated_at = now;
        self.persist_to_disk(&document)?;
        Ok(address)
    }

    fn update_user_address(
        &self,
        address_id: &str,
        input: UserAddressUpdateRequest,
    ) -> ServerResult<UserAddressRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        let address_id =
            require_non_empty_text(address_id, "APP_USER_ADDRESS_ID_EMPTY", "addressId")?;
        let index = user
            .addresses
            .iter()
            .position(|address| address.id == address_id || address.uuid == address_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_USER_ADDRESS_NOT_FOUND",
                    format!("user address {address_id} was not found"),
                )
            })?;
        let now = current_timestamp();

        if input.is_default == Some(true) {
            for address in &mut user.addresses {
                address.is_default = false;
                address.updated_at = now.clone();
            }
        }

        {
            let address = user
                .addresses
                .get_mut(index)
                .expect("address index should be valid");

            if let Some(name) = input.name {
                address.name =
                    require_non_empty_text(&name, "APP_USER_ADDRESS_NAME_EMPTY", "name")?;
            }
            if let Some(phone) = input.phone {
                address.phone =
                    require_non_empty_text(&phone, "APP_USER_ADDRESS_PHONE_EMPTY", "phone")?;
            }
            if let Some(address_detail) = input.address_detail {
                address.address_detail = require_non_empty_text(
                    &address_detail,
                    "APP_USER_ADDRESS_DETAIL_EMPTY",
                    "addressDetail",
                )?;
            }
            if let Some(country_code) = input.country_code {
                address.country_code = normalize_optional_text(Some(country_code));
            }
            if let Some(province_code) = input.province_code {
                address.province_code = normalize_optional_text(Some(province_code));
            }
            if let Some(city_code) = input.city_code {
                address.city_code = normalize_optional_text(Some(city_code));
            }
            if let Some(district_code) = input.district_code {
                address.district_code = normalize_optional_text(Some(district_code));
            }
            if let Some(postal_code) = input.postal_code {
                address.postal_code = normalize_optional_text(Some(postal_code));
            }
            if let Some(is_default) = input.is_default {
                address.is_default = is_default;
            }

            address.full_address = self.compose_full_address(
                address.country_code.as_deref(),
                address.province_code.as_deref(),
                address.city_code.as_deref(),
                address.district_code.as_deref(),
                &address.address_detail,
            );
            address.updated_at = now.clone();
        }

        if !user.addresses.is_empty() && !user.addresses.iter().any(|address| address.is_default) {
            if let Some(address) = user.addresses.first_mut() {
                address.is_default = true;
                address.updated_at = now.clone();
            }
        }

        user.updated_at = now;
        let address = user.addresses[index].clone();
        self.persist_to_disk(&document)?;
        Ok(address)
    }

    fn delete_user_address(&self, address_id: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        let address_id =
            require_non_empty_text(address_id, "APP_USER_ADDRESS_ID_EMPTY", "addressId")?;
        let index = user
            .addresses
            .iter()
            .position(|address| address.id == address_id || address.uuid == address_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_USER_ADDRESS_NOT_FOUND",
                    format!("user address {address_id} was not found"),
                )
            })?;
        let removed = user.addresses.remove(index);
        let now = current_timestamp();

        if removed.is_default {
            if let Some(address) = user.addresses.first_mut() {
                address.is_default = true;
                address.updated_at = now.clone();
            }
        }

        user.updated_at = now;
        self.persist_to_disk(&document)
    }

    fn set_default_user_address(&self, address_id: &str) -> ServerResult<UserAddressRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        let address_id =
            require_non_empty_text(address_id, "APP_USER_ADDRESS_ID_EMPTY", "addressId")?;
        let now = current_timestamp();
        let mut found = None;

        for address in &mut user.addresses {
            let is_target = address.id == address_id || address.uuid == address_id;
            address.is_default = is_target;
            address.updated_at = now.clone();
            if is_target {
                found = Some(address.clone());
            }
        }

        let address = found.ok_or_else(|| {
            ServerError::not_found(
                "APP_USER_ADDRESS_NOT_FOUND",
                format!("user address {address_id} was not found"),
            )
        })?;
        user.updated_at = now;
        self.persist_to_disk(&document)?;
        Ok(address)
    }

    fn read_user_login_history(
        &self,
        query: UserHistoryQuery,
    ) -> ServerResult<PaginatedItems<UserLoginHistoryRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let user = self.require_current_user(&document)?;
        Ok(self.paginate_records(&user.login_history, query))
    }

    fn read_user_generation_history(
        &self,
        query: UserHistoryQuery,
    ) -> ServerResult<PaginatedItems<UserGenerationHistoryRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let user = self.require_current_user(&document)?;
        Ok(self.paginate_records(&user.generation_history, query))
    }

    fn record_user_generation_history(
        &self,
        input: UserGenerationHistoryUpsert,
    ) -> ServerResult<UserGenerationHistoryRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        let task_id = require_non_empty_text(
            &input.task_id,
            "APP_USER_GENERATION_TASK_ID_EMPTY",
            "taskId",
        )?;
        let category = require_non_empty_text(
            &input.category,
            "APP_USER_GENERATION_CATEGORY_EMPTY",
            "category",
        )?;
        let status =
            require_non_empty_text(&input.status, "APP_USER_GENERATION_STATUS_EMPTY", "status")?;
        let now = current_timestamp();

        if let Some(existing) = user
            .generation_history
            .iter_mut()
            .find(|entry| entry.task_id == task_id)
        {
            existing.category = category;
            existing.status = status;
            existing.prompt = input.prompt;
            existing.cover_asset_id = input.cover_asset_id;
            existing.cover_url = input.cover_url;
            existing.result_count = input.result_count;
            existing.completed_at = input.completed_at;
            existing.updated_at = now.clone();
            user.updated_at = now;
            let record = existing.clone();
            self.persist_to_disk(&document)?;
            return Ok(record);
        }

        let id = next_entity_id("user-generation-history", &IDENTITY_TOKEN_COUNTER);
        let record = UserGenerationHistoryRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            task_id,
            category,
            status,
            prompt: input.prompt,
            cover_asset_id: input.cover_asset_id,
            cover_url: input.cover_url,
            result_count: input.result_count,
            completed_at: input.completed_at,
            created_at: now.clone(),
            updated_at: now.clone(),
            deleted_at: None,
        };
        user.generation_history.insert(0, record.clone());
        user.updated_at = now;
        self.persist_to_disk(&document)?;
        Ok(record)
    }

    fn list_user_bindings(&self) -> ServerResult<Vec<UserBindingRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let user = self.require_current_user(&document)?;
        Ok(self.list_bindings_for_user(user))
    }

    fn bind_user_email(&self, input: UserBindEmailRequest) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let email = require_non_empty_text(&input.email, "APP_USER_EMAIL_EMPTY", "email")?;
        let verification_code = require_non_empty_text(
            &input.verification_code,
            "APP_AUTH_CODE_EMPTY",
            "verificationCode",
        )?;
        self.consume_verification_code(
            &mut document,
            &email,
            AuthVerifyType::Email,
            AuthScene::BindEmail,
            &verification_code,
        )?;

        let current_user_id = self.require_current_user(&document)?.id.clone();
        let current_username = self.require_current_user(&document)?.username.clone();
        let current_phone = self.require_current_user(&document)?.phone.clone();
        self.ensure_unique_user_fields(
            &document,
            &current_username,
            Some(&email),
            current_phone.as_deref(),
            Some(current_user_id.as_str()),
        )?;

        {
            let user = self.require_user_mut(&mut document, &current_user_id)?;
            user.email = Some(email);
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)?;
        Ok(self.map_user_profile(self.require_user(&document, &current_user_id)?))
    }

    fn unbind_user_email(&self) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let current_user_id = self.require_current_user(&document)?.id.clone();

        {
            let user = self.require_user_mut(&mut document, &current_user_id)?;
            user.email = None;
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)?;
        Ok(self.map_user_profile(self.require_user(&document, &current_user_id)?))
    }

    fn bind_user_phone(&self, input: UserBindPhoneRequest) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let phone = require_non_empty_text(&input.phone, "APP_USER_PHONE_EMPTY", "phone")?;
        let verification_code = require_non_empty_text(
            &input.verification_code,
            "APP_AUTH_CODE_EMPTY",
            "verificationCode",
        )?;
        self.consume_verification_code(
            &mut document,
            &phone,
            AuthVerifyType::Phone,
            AuthScene::BindPhone,
            &verification_code,
        )?;

        let current_user_id = self.require_current_user(&document)?.id.clone();
        let current_username = self.require_current_user(&document)?.username.clone();
        let current_email = self.require_current_user(&document)?.email.clone();
        self.ensure_unique_user_fields(
            &document,
            &current_username,
            current_email.as_deref(),
            Some(&phone),
            Some(current_user_id.as_str()),
        )?;

        {
            let user = self.require_user_mut(&mut document, &current_user_id)?;
            user.phone = Some(phone);
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)?;
        Ok(self.map_user_profile(self.require_user(&document, &current_user_id)?))
    }

    fn unbind_user_phone(&self) -> ServerResult<UserProfileRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let current_user_id = self.require_current_user(&document)?.id.clone();

        {
            let user = self.require_user_mut(&mut document, &current_user_id)?;
            user.phone = None;
            user.updated_at = current_timestamp();
        }

        self.persist_to_disk(&document)?;
        Ok(self.map_user_profile(self.require_user(&document, &current_user_id)?))
    }

    fn bind_user_platform(
        &self,
        platform: &str,
        input: UserThirdPartyBindRequest,
    ) -> ServerResult<UserBindingRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let platform = self.require_supported_platform(platform)?;
        let current_user_id = self.require_current_user(&document)?.id.clone();
        let now = current_timestamp();

        let binding = {
            let user = self.require_user_mut(&mut document, &current_user_id)?;
            let mut metadata = input.metadata.unwrap_or_default();
            if let Some(state) = normalize_optional_text(input.state) {
                metadata.insert("state".to_string(), Value::String(state));
            }
            if let Some(expire_time) = normalize_optional_text(input.expire_time) {
                metadata.insert("expireTime".to_string(), Value::String(expire_time));
            }

            if let Some(existing) = user
                .third_party_bindings
                .iter_mut()
                .find(|binding| binding.platform == platform)
            {
                existing.target = normalize_optional_text(input.third_party_user_id);
                existing.display_name = normalize_optional_text(input.third_party_user_name);
                existing.avatar_url = normalize_optional_text(input.third_party_avatar);
                existing.metadata = metadata;
                existing.bound_at = now.clone();
                existing.updated_at = now.clone();
                user.updated_at = now.clone();
                existing.clone()
            } else {
                let id = next_entity_id("user-binding", &IDENTITY_TOKEN_COUNTER);
                let binding = UserBindingRecord {
                    id: id.clone(),
                    uuid: to_client_entity_uuid(&id),
                    platform,
                    target: normalize_optional_text(input.third_party_user_id),
                    display_name: normalize_optional_text(input.third_party_user_name),
                    avatar_url: normalize_optional_text(input.third_party_avatar),
                    bound_at: now.clone(),
                    metadata,
                    created_at: now.clone(),
                    updated_at: now.clone(),
                    deleted_at: None,
                };
                user.third_party_bindings.push(binding.clone());
                user.updated_at = now.clone();
                binding
            }
        };

        self.persist_to_disk(&document)?;
        Ok(binding)
    }

    fn unbind_user_platform(&self, platform: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let platform = self.require_supported_platform(platform)?;
        let user = self.require_current_user_mut(&mut document)?;
        let index = user
            .third_party_bindings
            .iter()
            .position(|binding| binding.platform == platform)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_USER_BINDING_NOT_FOUND",
                    format!("user binding {platform} was not found"),
                )
            })?;

        user.third_party_bindings.remove(index);
        user.updated_at = current_timestamp();
        self.persist_to_disk(&document)
    }

    fn list_user_sessions(&self) -> ServerResult<Vec<UserSecuritySessionRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let user_id = self.require_current_user(&document)?.id.clone();
        let mut sessions = document
            .sessions
            .iter()
            .filter(|session| session.user_id == user_id)
            .map(|session| self.map_user_session(&document, session))
            .collect::<Vec<_>>();
        sessions.sort_by(|left, right| right.last_active_at.cmp(&left.last_active_at));
        Ok(sessions)
    }

    fn revoke_user_session(&self, session_id: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let current_user_id = self.require_current_user(&document)?.id.clone();
        let session_id =
            require_non_empty_text(session_id, "APP_USER_SESSION_ID_EMPTY", "sessionId")?;
        let revoked_at = current_timestamp();
        let current_session_id = document.current_session_id.clone();
        let mut revoked_current = false;

        let session = document
            .sessions
            .iter_mut()
            .find(|session| {
                session.user_id == current_user_id && Self::session_matches_id(session, &session_id)
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_USER_SESSION_NOT_FOUND",
                    format!("user session {session_id} was not found"),
                )
            })?;

        session.revoked_at = Some(revoked_at.clone());
        session.updated_at = revoked_at.clone();
        session.last_active_at = revoked_at;
        if current_session_id.as_deref() == Some(session.id.as_str()) {
            revoked_current = true;
        }

        if revoked_current {
            document.current_session_id = None;
        }

        self.persist_to_disk(&document)
    }

    fn list_user_devices(&self) -> ServerResult<Vec<UserTrustedDeviceRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let user_id = self.require_current_user(&document)?.id.clone();
        Ok(self.list_devices_for_user(&document, &user_id))
    }

    fn revoke_user_device(&self, device_id: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let current_user_id = self.require_current_user(&document)?.id.clone();
        let device_id = require_non_empty_text(device_id, "APP_USER_DEVICE_ID_EMPTY", "deviceId")?;
        let revoked_at = current_timestamp();
        let current_session_id = document.current_session_id.clone();
        let mut affected = false;
        let mut revoked_current = false;

        for session in &mut document.sessions {
            if session.user_id == current_user_id && Self::device_matches_id(session, &device_id) {
                session.revoked_at = Some(revoked_at.clone());
                session.updated_at = revoked_at.clone();
                session.last_active_at = revoked_at.clone();
                if current_session_id.as_deref() == Some(session.id.as_str()) {
                    revoked_current = true;
                }
                affected = true;
            }
        }

        if !affected {
            return Err(ServerError::not_found(
                "APP_USER_DEVICE_NOT_FOUND",
                format!("trusted device {device_id} was not found"),
            ));
        }

        if revoked_current {
            document.current_session_id = None;
        }

        self.persist_to_disk(&document)
    }

    fn read_user_two_factor_status(&self) -> ServerResult<UserTwoFactorStatusRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.map_two_factor_status(self.require_current_user(&document)?))
    }

    fn setup_user_two_factor(
        &self,
        input: UserTwoFactorSetupRequest,
    ) -> ServerResult<UserTwoFactorSetupRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user_id = self.require_current_user(&document)?.id.clone();
        let issuer = normalize_optional_text(input.issuer)
            .unwrap_or_else(|| DEFAULT_TOTP_ISSUER.to_string());

        let setup = {
            let user = self.require_user_mut(&mut document, &user_id)?;
            if Self::is_two_factor_enabled(user) {
                return Err(ServerError::conflict(
                    "APP_USER_TWO_FACTOR_ALREADY_ENABLED",
                    "two-factor authentication is already enabled",
                ));
            }

            let secret_base32 = Self::generate_totp_secret();
            let recovery_codes = Self::generate_recovery_codes();
            user.pending_two_factor_secret = Some(secret_base32.clone());
            user.pending_two_factor_recovery_codes = recovery_codes.clone();
            user.updated_at = current_timestamp();
            Self::sync_user_security_projection(user);

            self.create_two_factor_setup_record(user, &issuer, &secret_base32, recovery_codes)
        };

        self.persist_to_disk(&document)?;
        Ok(setup)
    }

    fn verify_user_two_factor(
        &self,
        input: UserTwoFactorVerifyRequest,
    ) -> ServerResult<UserTwoFactorStatusRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        let code = require_non_empty_text(&input.code, "APP_USER_TWO_FACTOR_CODE_EMPTY", "code")?;

        self.verify_pending_two_factor_code(user, &code)?;

        let secret = user.pending_two_factor_secret.take().ok_or_else(|| {
            ServerError::bad_request(
                "APP_USER_TWO_FACTOR_SETUP_NOT_FOUND",
                "two-factor setup has not been started",
            )
        })?;
        let recovery_codes = std::mem::take(&mut user.pending_two_factor_recovery_codes);
        let verified_at = current_timestamp();
        user.two_factor_secret = Some(secret);
        user.two_factor_recovery_codes = recovery_codes;
        user.two_factor_verified_at = Some(verified_at.clone());
        user.updated_at = verified_at;
        Self::sync_user_security_projection(user);

        let status = self.map_two_factor_status(user);
        self.persist_to_disk(&document)?;
        Ok(status)
    }

    fn disable_user_two_factor(&self) -> ServerResult<UserTwoFactorStatusRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let user = self.require_current_user_mut(&mut document)?;
        user.two_factor_secret = None;
        user.pending_two_factor_secret = None;
        user.two_factor_recovery_codes.clear();
        user.pending_two_factor_recovery_codes.clear();
        user.two_factor_verified_at = None;
        user.updated_at = current_timestamp();
        Self::sync_user_security_projection(user);

        let status = self.map_two_factor_status(user);
        self.persist_to_disk(&document)?;
        Ok(status)
    }
}

fn session_required_error() -> ServerError {
    ServerError::forbidden(
        "APP_AUTH_SESSION_REQUIRED",
        "an authenticated session is required",
    )
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn require_non_empty_text(value: &str, code: &str, field_name: &str) -> ServerResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }
    Ok(trimmed.to_string())
}

fn next_entity_id(prefix: &str, counter: &AtomicU64) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = counter.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}

fn next_token(prefix: &str) -> String {
    next_entity_id(prefix, &IDENTITY_TOKEN_COUNTER)
}

fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}

fn current_unix_timestamp_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn future_timestamp(duration: Duration) -> String {
    (OffsetDateTime::now_utc() + duration)
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}
