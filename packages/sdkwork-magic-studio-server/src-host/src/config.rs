use std::env;
use std::path::{Path, PathBuf};

const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_PORT: u16 = 4318;
const DEFAULT_USER_CENTER_PROVIDER_KEY: &str = "magic-studio-local";
const DEFAULT_USER_CENTER_APP_ID: &str = "magic-studio-v2";
const DEFAULT_USER_CENTER_LOCAL_API_BASE_PATH: &str = "/api/app/v1/user-center";
const DEFAULT_USER_CENTER_DATA_ROOT: &str = "/var/lib/magic-studio";
const DEFAULT_USER_CENTER_SQLITE_FILE_NAME: &str = "user-center.db";
const DEFAULT_USER_CENTER_TABLE_PREFIX: &str = "ms_uc_";
const DEFAULT_AUTHORIZATION_HEADER_NAME: &str = "Authorization";
const DEFAULT_ACCESS_TOKEN_HEADER_NAME: &str = "Access-Token";
const DEFAULT_REFRESH_TOKEN_HEADER_NAME: &str = "Refresh-Token";
const DEFAULT_SESSION_HEADER_NAME: &str = "x-sdkwork-user-center-session-id";
const DEFAULT_AUTHORIZATION_SCHEME: &str = "Bearer";
const DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS: u64 = 30_000;
const HOST_ENV: &str = "MAGIC_STUDIO_SERVER_HOST";
const PORT_ENV: &str = "MAGIC_STUDIO_SERVER_PORT";
const RUNTIME_MODE_ENV: &str = "MAGIC_STUDIO_SERVER_RUNTIME_MODE";
const DATA_ROOT_ENV: &str = "MAGIC_STUDIO_SERVER_DATA_ROOT";
const USER_CENTER_MODE_ENV: &str = "MAGIC_STUDIO_USER_CENTER_MODE";
const USER_CENTER_PROVIDER_KEY_ENV: &str = "MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY";
const USER_CENTER_APP_ID_ENV: &str = "MAGIC_STUDIO_USER_CENTER_APP_ID";
const USER_CENTER_LOCAL_API_BASE_PATH_ENV: &str = "MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH";
const USER_CENTER_SQLITE_PATH_ENV: &str = "MAGIC_STUDIO_USER_CENTER_SQLITE_PATH";
const USER_CENTER_DATABASE_URL_ENV: &str = "MAGIC_STUDIO_USER_CENTER_DATABASE_URL";
const USER_CENTER_SCHEMA_NAME_ENV: &str = "MAGIC_STUDIO_USER_CENTER_SCHEMA_NAME";
const USER_CENTER_TABLE_PREFIX_ENV: &str = "MAGIC_STUDIO_USER_CENTER_TABLE_PREFIX";
const USER_CENTER_APP_API_BASE_URL_ENV: &str = "MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL";
const USER_CENTER_EXTERNAL_BASE_URL_ENV: &str = "MAGIC_STUDIO_USER_CENTER_EXTERNAL_BASE_URL";
const USER_CENTER_SECRET_ID_ENV: &str = "MAGIC_STUDIO_USER_CENTER_SECRET_ID";
const USER_CENTER_SHARED_SECRET_ENV: &str = "MAGIC_STUDIO_USER_CENTER_SHARED_SECRET";
const USER_CENTER_AUTHORIZATION_HEADER_NAME_ENV: &str =
    "MAGIC_STUDIO_USER_CENTER_AUTHORIZATION_HEADER_NAME";
const USER_CENTER_ACCESS_TOKEN_HEADER_NAME_ENV: &str =
    "MAGIC_STUDIO_USER_CENTER_ACCESS_TOKEN_HEADER_NAME";
const USER_CENTER_REFRESH_TOKEN_HEADER_NAME_ENV: &str =
    "MAGIC_STUDIO_USER_CENTER_REFRESH_TOKEN_HEADER_NAME";
const USER_CENTER_SESSION_HEADER_NAME_ENV: &str = "MAGIC_STUDIO_USER_CENTER_SESSION_HEADER_NAME";
const USER_CENTER_AUTHORIZATION_SCHEME_ENV: &str = "MAGIC_STUDIO_USER_CENTER_AUTHORIZATION_SCHEME";
const USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN_ENV: &str =
    "MAGIC_STUDIO_USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN";
const USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS_ENV: &str =
    "MAGIC_STUDIO_USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS";
const SUPPORTED_SERVER_RUNTIME_MODES: &str = "server, desktop";
const SUPPORTED_SERVER_USER_CENTER_MODES: &str =
    "builtin-local, sdkwork-cloud-app-api, external-user-center";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ServerRuntimeMode {
    Server,
    Desktop,
}

impl ServerRuntimeMode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Server => "server",
            Self::Desktop => "desktop",
        }
    }

    pub fn deployment_family(self) -> &'static str {
        match self {
            Self::Server => "server",
            Self::Desktop => "desktop",
        }
    }

    fn from_env_value(value: &str) -> Option<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "server" => Some(Self::Server),
            "desktop" => Some(Self::Desktop),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ServerUserCenterMode {
    BuiltinLocal,
    SdkworkCloudAppApi,
    ExternalUserCenter,
}

impl ServerUserCenterMode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::BuiltinLocal => "builtin-local",
            Self::SdkworkCloudAppApi => "sdkwork-cloud-app-api",
            Self::ExternalUserCenter => "external-user-center",
        }
    }

    fn from_env_value(value: &str) -> Option<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "builtin-local" => Some(Self::BuiltinLocal),
            "sdkwork-cloud-app-api" => Some(Self::SdkworkCloudAppApi),
            "external-user-center" => Some(Self::ExternalUserCenter),
            _ => None,
        }
    }
}

fn resolve_server_runtime_mode(value: Option<&str>) -> Result<ServerRuntimeMode, String> {
    if let Some(value) = value {
        return ServerRuntimeMode::from_env_value(value).ok_or_else(|| {
            format!("{RUNTIME_MODE_ENV} must be one of: {SUPPORTED_SERVER_RUNTIME_MODES}")
        });
    }

    Ok(ServerRuntimeMode::Server)
}

fn resolve_server_user_center_mode(
    value: Option<&str>,
    app_api_base_url: Option<&str>,
    external_base_url: Option<&str>,
) -> Result<ServerUserCenterMode, String> {
    if let Some(value) = value {
        return ServerUserCenterMode::from_env_value(value).ok_or_else(|| {
            format!("{USER_CENTER_MODE_ENV} must be one of: {SUPPORTED_SERVER_USER_CENTER_MODES}")
        });
    }

    match (
        app_api_base_url
            .map(str::trim)
            .filter(|value| !value.is_empty()),
        external_base_url
            .map(str::trim)
            .filter(|value| !value.is_empty()),
    ) {
        (Some(_), None) => Ok(ServerUserCenterMode::SdkworkCloudAppApi),
        (None, Some(_)) => Ok(ServerUserCenterMode::ExternalUserCenter),
        _ => Ok(ServerUserCenterMode::BuiltinLocal),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServerUserCenterConfig {
    mode: ServerUserCenterMode,
    provider_key: String,
    app_id: String,
    local_api_base_path: String,
    sqlite_path: PathBuf,
    sqlite_path_explicit: bool,
    database_url: Option<String>,
    schema_name: Option<String>,
    table_prefix: String,
    app_api_base_url: Option<String>,
    external_base_url: Option<String>,
    secret_id: Option<String>,
    shared_secret: Option<String>,
    authorization_header_name: String,
    access_token_header_name: String,
    refresh_token_header_name: String,
    session_header_name: String,
    authorization_scheme: String,
    allow_authorization_fallback_to_access_token: bool,
    handshake_freshness_window_ms: u64,
}

impl ServerUserCenterConfig {
    pub fn builtin_local_defaults() -> Self {
        Self {
            mode: ServerUserCenterMode::BuiltinLocal,
            provider_key: DEFAULT_USER_CENTER_PROVIDER_KEY.to_string(),
            app_id: DEFAULT_USER_CENTER_APP_ID.to_string(),
            local_api_base_path: DEFAULT_USER_CENTER_LOCAL_API_BASE_PATH.to_string(),
            sqlite_path: default_user_center_sqlite_path(None),
            sqlite_path_explicit: false,
            database_url: None,
            schema_name: None,
            table_prefix: DEFAULT_USER_CENTER_TABLE_PREFIX.to_string(),
            app_api_base_url: None,
            external_base_url: None,
            secret_id: None,
            shared_secret: None,
            authorization_header_name: DEFAULT_AUTHORIZATION_HEADER_NAME.to_string(),
            access_token_header_name: DEFAULT_ACCESS_TOKEN_HEADER_NAME.to_string(),
            refresh_token_header_name: DEFAULT_REFRESH_TOKEN_HEADER_NAME.to_string(),
            session_header_name: DEFAULT_SESSION_HEADER_NAME.to_string(),
            authorization_scheme: DEFAULT_AUTHORIZATION_SCHEME.to_string(),
            allow_authorization_fallback_to_access_token: true,
            handshake_freshness_window_ms: DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS,
        }
    }

    fn try_from_env_lookup<F>(lookup: &F, data_root: Option<&Path>) -> Result<Self, String>
    where
        F: Fn(&str) -> Option<String>,
    {
        let mut config = Self::builtin_local_defaults();
        config.app_api_base_url = read_trimmed_env(lookup, USER_CENTER_APP_API_BASE_URL_ENV)
            .as_deref()
            .and_then(normalize_url);
        config.external_base_url = read_trimmed_env(lookup, USER_CENTER_EXTERNAL_BASE_URL_ENV)
            .as_deref()
            .and_then(normalize_url);
        config.mode = resolve_server_user_center_mode(
            read_trimmed_env(lookup, USER_CENTER_MODE_ENV).as_deref(),
            config.app_api_base_url.as_deref(),
            config.external_base_url.as_deref(),
        )?;
        config.provider_key = read_trimmed_env(lookup, USER_CENTER_PROVIDER_KEY_ENV)
            .map(|value| normalize_provider_key(&value))
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| DEFAULT_USER_CENTER_PROVIDER_KEY.to_string());
        config.app_id = read_trimmed_env(lookup, USER_CENTER_APP_ID_ENV)
            .unwrap_or_else(|| DEFAULT_USER_CENTER_APP_ID.to_string());
        config.local_api_base_path = read_trimmed_env(lookup, USER_CENTER_LOCAL_API_BASE_PATH_ENV)
            .map(|value| normalize_base_path(&value))
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| DEFAULT_USER_CENTER_LOCAL_API_BASE_PATH.to_string());
        config.sqlite_path = read_trimmed_env(lookup, USER_CENTER_SQLITE_PATH_ENV)
            .map(PathBuf::from)
            .filter(|path| !path.as_os_str().is_empty())
            .unwrap_or_else(|| default_user_center_sqlite_path(data_root));
        config.sqlite_path_explicit =
            read_trimmed_env(lookup, USER_CENTER_SQLITE_PATH_ENV).is_some();
        config.database_url = read_trimmed_env(lookup, USER_CENTER_DATABASE_URL_ENV);
        config.schema_name = read_trimmed_env(lookup, USER_CENTER_SCHEMA_NAME_ENV);
        config.table_prefix = read_trimmed_env(lookup, USER_CENTER_TABLE_PREFIX_ENV)
            .unwrap_or_else(|| DEFAULT_USER_CENTER_TABLE_PREFIX.to_string());
        config.secret_id = read_trimmed_env(lookup, USER_CENTER_SECRET_ID_ENV);
        config.shared_secret = read_trimmed_env(lookup, USER_CENTER_SHARED_SECRET_ENV);
        config.authorization_header_name =
            read_trimmed_env(lookup, USER_CENTER_AUTHORIZATION_HEADER_NAME_ENV)
                .unwrap_or_else(|| DEFAULT_AUTHORIZATION_HEADER_NAME.to_string());
        config.access_token_header_name =
            read_trimmed_env(lookup, USER_CENTER_ACCESS_TOKEN_HEADER_NAME_ENV)
                .unwrap_or_else(|| DEFAULT_ACCESS_TOKEN_HEADER_NAME.to_string());
        config.refresh_token_header_name =
            read_trimmed_env(lookup, USER_CENTER_REFRESH_TOKEN_HEADER_NAME_ENV)
                .unwrap_or_else(|| DEFAULT_REFRESH_TOKEN_HEADER_NAME.to_string());
        config.session_header_name = read_trimmed_env(lookup, USER_CENTER_SESSION_HEADER_NAME_ENV)
            .unwrap_or_else(|| DEFAULT_SESSION_HEADER_NAME.to_string());
        config.authorization_scheme =
            read_trimmed_env(lookup, USER_CENTER_AUTHORIZATION_SCHEME_ENV)
                .unwrap_or_else(|| DEFAULT_AUTHORIZATION_SCHEME.to_string());
        config.allow_authorization_fallback_to_access_token = read_bool_env(
            lookup,
            USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN_ENV,
        )?
        .unwrap_or(true);
        config.handshake_freshness_window_ms =
            read_u64_env(lookup, USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS_ENV)?
                .unwrap_or(DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS);
        Ok(config)
    }

    fn refresh_default_sqlite_path(&mut self, data_root: &Path) {
        if !self.sqlite_path_explicit {
            self.sqlite_path = default_user_center_sqlite_path(Some(data_root));
        }
    }

    pub fn mode(&self) -> ServerUserCenterMode {
        self.mode
    }

    pub fn provider_key(&self) -> &str {
        &self.provider_key
    }

    pub fn app_id(&self) -> &str {
        &self.app_id
    }

    pub fn local_api_base_path(&self) -> &str {
        &self.local_api_base_path
    }

    pub fn sqlite_path(&self) -> &Path {
        &self.sqlite_path
    }

    pub fn database_url(&self) -> Option<&str> {
        self.database_url.as_deref()
    }

    pub fn schema_name(&self) -> Option<&str> {
        self.schema_name.as_deref()
    }

    pub fn table_prefix(&self) -> &str {
        &self.table_prefix
    }

    pub fn app_api_base_url(&self) -> Option<&str> {
        self.app_api_base_url.as_deref()
    }

    pub fn external_base_url(&self) -> Option<&str> {
        self.external_base_url.as_deref()
    }

    pub fn authority_base_url(&self) -> Option<&str> {
        match self.mode {
            ServerUserCenterMode::BuiltinLocal => None,
            ServerUserCenterMode::SdkworkCloudAppApi => self.app_api_base_url(),
            ServerUserCenterMode::ExternalUserCenter => self.external_base_url(),
        }
    }

    pub fn secret_id(&self) -> Option<&str> {
        self.secret_id.as_deref()
    }

    pub fn shared_secret(&self) -> Option<&str> {
        self.shared_secret.as_deref()
    }

    pub fn authorization_header_name(&self) -> &str {
        &self.authorization_header_name
    }

    pub fn access_token_header_name(&self) -> &str {
        &self.access_token_header_name
    }

    pub fn refresh_token_header_name(&self) -> &str {
        &self.refresh_token_header_name
    }

    pub fn session_header_name(&self) -> &str {
        &self.session_header_name
    }

    pub fn authorization_scheme(&self) -> &str {
        &self.authorization_scheme
    }

    pub fn allow_authorization_fallback_to_access_token(&self) -> bool {
        self.allow_authorization_fallback_to_access_token
    }

    pub fn handshake_freshness_window_ms(&self) -> u64 {
        self.handshake_freshness_window_ms
    }
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    host: String,
    port: u16,
    runtime_mode: ServerRuntimeMode,
    data_root: Option<PathBuf>,
    user_center: ServerUserCenterConfig,
}

impl ServerConfig {
    pub fn new(host: impl Into<String>, port: u16) -> Self {
        Self::with_runtime_mode(host, port, ServerRuntimeMode::Server)
    }

    pub fn with_runtime_mode(
        host: impl Into<String>,
        port: u16,
        runtime_mode: ServerRuntimeMode,
    ) -> Self {
        Self {
            host: host.into(),
            port,
            runtime_mode,
            data_root: None,
            user_center: ServerUserCenterConfig::builtin_local_defaults(),
        }
    }

    pub fn desktop_local() -> Self {
        Self::with_runtime_mode(DEFAULT_HOST, DEFAULT_PORT, ServerRuntimeMode::Desktop)
    }

    pub fn host(&self) -> &str {
        &self.host
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub fn runtime_mode(&self) -> ServerRuntimeMode {
        self.runtime_mode
    }

    pub fn with_data_root(mut self, data_root: impl Into<PathBuf>) -> Self {
        let data_root = data_root.into();
        self.user_center.refresh_default_sqlite_path(&data_root);
        self.data_root = Some(data_root);
        self
    }

    pub fn data_root(&self) -> Option<&Path> {
        self.data_root.as_deref()
    }

    pub fn deployment_family(&self) -> &'static str {
        self.runtime_mode.deployment_family()
    }

    pub fn user_center(&self) -> &ServerUserCenterConfig {
        &self.user_center
    }

    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }

    pub fn api_base_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port)
    }

    pub fn from_env_lookup<F>(lookup: F) -> Self
    where
        F: Fn(&str) -> Option<String>,
    {
        Self::try_from_env_lookup(lookup).unwrap_or_else(|error| panic!("{error}"))
    }

    pub fn try_from_env_lookup<F>(lookup: F) -> Result<Self, String>
    where
        F: Fn(&str) -> Option<String>,
    {
        let host = read_trimmed_env(&lookup, HOST_ENV).unwrap_or_else(|| DEFAULT_HOST.to_string());
        let port = read_u16_env(&lookup, PORT_ENV)?.unwrap_or(DEFAULT_PORT);
        let runtime_mode =
            resolve_server_runtime_mode(read_trimmed_env(&lookup, RUNTIME_MODE_ENV).as_deref())?;
        let data_root = read_trimmed_env(&lookup, DATA_ROOT_ENV)
            .map(PathBuf::from)
            .filter(|value| !value.as_os_str().is_empty());

        let mut config = Self::with_runtime_mode(host, port, runtime_mode);
        config.data_root = data_root;
        config.user_center =
            ServerUserCenterConfig::try_from_env_lookup(&lookup, config.data_root.as_deref())?;
        Ok(config)
    }
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self::from_env_lookup(|name| env::var(name).ok())
    }
}

fn default_user_center_sqlite_path(data_root: Option<&Path>) -> PathBuf {
    data_root
        .map(|root| root.join(DEFAULT_USER_CENTER_SQLITE_FILE_NAME))
        .unwrap_or_else(|| {
            PathBuf::from(DEFAULT_USER_CENTER_DATA_ROOT).join(DEFAULT_USER_CENTER_SQLITE_FILE_NAME)
        })
}

fn read_trimmed_env<F>(lookup: &F, name: &str) -> Option<String>
where
    F: Fn(&str) -> Option<String>,
{
    lookup(name)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn read_u16_env<F>(lookup: &F, name: &str) -> Result<Option<u16>, String>
where
    F: Fn(&str) -> Option<String>,
{
    match read_trimmed_env(lookup, name) {
        Some(value) => parse_u16(&value)
            .map(Some)
            .ok_or_else(|| format!("{name} must be a positive integer")),
        None => Ok(None),
    }
}

fn read_u64_env<F>(lookup: &F, name: &str) -> Result<Option<u64>, String>
where
    F: Fn(&str) -> Option<String>,
{
    match read_trimmed_env(lookup, name) {
        Some(value) => parse_u64(&value)
            .map(Some)
            .ok_or_else(|| format!("{name} must be an unsigned integer greater than 0")),
        None => Ok(None),
    }
}

fn read_bool_env<F>(lookup: &F, name: &str) -> Result<Option<bool>, String>
where
    F: Fn(&str) -> Option<String>,
{
    match read_trimmed_env(lookup, name) {
        Some(value) => parse_bool(&value)
            .map(Some)
            .ok_or_else(|| format!("{name} must be a boolean value")),
        None => Ok(None),
    }
}

fn parse_u16(value: &str) -> Option<u16> {
    value.trim().parse::<u16>().ok().filter(|value| *value > 0)
}

fn parse_u64(value: &str) -> Option<u64> {
    value.trim().parse::<u64>().ok().filter(|value| *value > 0)
}

fn parse_bool(value: &str) -> Option<bool> {
    match value.trim().to_ascii_lowercase().as_str() {
        "1" | "true" | "yes" | "on" => Some(true),
        "0" | "false" | "no" | "off" => Some(false),
        _ => None,
    }
}

fn normalize_base_path(value: &str) -> String {
    let trimmed = value.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return DEFAULT_USER_CENTER_LOCAL_API_BASE_PATH.to_string();
    }

    if trimmed.starts_with('/') {
        trimmed.to_string()
    } else {
        format!("/{trimmed}")
    }
}

fn normalize_url(value: &str) -> Option<String> {
    let trimmed = value.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

fn normalize_provider_key(value: &str) -> String {
    let mut normalized = String::new();
    let mut previous_was_separator = false;

    for character in value.trim().chars() {
        let lowered = character.to_ascii_lowercase();
        if lowered.is_ascii_alphanumeric() {
            normalized.push(lowered);
            previous_was_separator = false;
            continue;
        }

        if !previous_was_separator {
            normalized.push('-');
            previous_was_separator = true;
        }
    }

    normalized.trim_matches('-').to_string()
}
