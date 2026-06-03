use std::collections::HashMap;
use std::path::Path;

use crate::config::{ServerConfig, ServerUserCenterMode};

#[test]
fn server_config_uses_canonical_user_center_defaults_for_private_deployments() {
    let config = ServerConfig::from_env_lookup(|_| None);

    assert_eq!(
        config.user_center().mode(),
        ServerUserCenterMode::BuiltinLocal
    );
    assert_eq!(config.user_center().provider_key(), "magic-studio-local");
    assert_eq!(config.user_center().app_id(), "magic-studio-v2");
    assert_eq!(
        config.user_center().local_api_base_path(),
        "/api/app/v1/user-center"
    );
    assert_eq!(
        config.user_center().sqlite_path(),
        Path::new("/var/lib/magic-studio/user-center.db")
    );
    assert_eq!(config.user_center().table_prefix(), "ms_uc_");
    assert_eq!(
        config.user_center().authorization_header_name(),
        "Authorization"
    );
    assert_eq!(
        config.user_center().access_token_header_name(),
        "Access-Token"
    );
    assert_eq!(
        config.user_center().refresh_token_header_name(),
        "Refresh-Token"
    );
    assert_eq!(
        config.user_center().session_header_name(),
        "x-sdkwork-user-center-session-id"
    );
    assert_eq!(config.user_center().authorization_scheme(), "Bearer");
    assert!(config
        .user_center()
        .allow_authorization_fallback_to_access_token());
    assert_eq!(config.user_center().handshake_freshness_window_ms(), 30_000);
}

#[test]
fn server_config_parses_sdkwork_cloud_app_api_user_center_settings_from_env_lookup() {
    let env = HashMap::from([
        (
            "MAGIC_STUDIO_SERVER_DATA_ROOT",
            "/srv/magic-studio".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_MODE",
            " sdkwork-cloud-app-api ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY",
            " Magic Studio App API ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_APP_ID",
            " magic-studio-v2 ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_LOCAL_API_BASE_PATH",
            " /gateway/user-center/ ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL",
            " https://app-api.sdkwork.local/magic/ ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_SECRET_ID",
            " magic-studio-secret ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_SHARED_SECRET",
            " shared-secret-value ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_AUTHORIZATION_HEADER_NAME",
            " Auth-Token ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_ACCESS_TOKEN_HEADER_NAME",
            " X-Access-Token ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_REFRESH_TOKEN_HEADER_NAME",
            " X-Refresh-Token ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_SESSION_HEADER_NAME",
            " X-Session-Id ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_AUTHORIZATION_SCHEME",
            " Token ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN",
            " false ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS",
            " 45000 ".to_string(),
        ),
    ]);

    let config = ServerConfig::from_env_lookup(|name| env.get(name).cloned());

    assert_eq!(
        config.user_center().mode(),
        ServerUserCenterMode::SdkworkCloudAppApi
    );
    assert_eq!(config.user_center().provider_key(), "magic-studio-app-api");
    assert_eq!(config.user_center().app_id(), "magic-studio-v2");
    assert_eq!(
        config.user_center().local_api_base_path(),
        "/gateway/user-center"
    );
    assert_eq!(
        config.user_center().sqlite_path(),
        Path::new("/srv/magic-studio/user-center.db")
    );
    assert_eq!(
        config.user_center().app_api_base_url(),
        Some("https://app-api.sdkwork.local/magic")
    );
    assert_eq!(
        config.user_center().authority_base_url(),
        Some("https://app-api.sdkwork.local/magic")
    );
    assert_eq!(
        config.user_center().secret_id(),
        Some("magic-studio-secret")
    );
    assert_eq!(
        config.user_center().shared_secret(),
        Some("shared-secret-value")
    );
    assert_eq!(
        config.user_center().authorization_header_name(),
        "Auth-Token"
    );
    assert_eq!(
        config.user_center().access_token_header_name(),
        "X-Access-Token"
    );
    assert_eq!(
        config.user_center().refresh_token_header_name(),
        "X-Refresh-Token"
    );
    assert_eq!(config.user_center().session_header_name(), "X-Session-Id");
    assert_eq!(config.user_center().authorization_scheme(), "Token");
    assert!(!config
        .user_center()
        .allow_authorization_fallback_to_access_token());
    assert_eq!(config.user_center().handshake_freshness_window_ms(), 45_000);
}

#[test]
fn server_config_infers_canonical_remote_modes_from_single_authority_base_url() {
    let cloud_env = HashMap::from([
        (
            "MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL",
            " https://app-api.sdkwork.local/magic/ ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY",
            " Magic Studio App API ".to_string(),
        ),
    ]);
    let cloud_config = ServerConfig::from_env_lookup(|name| cloud_env.get(name).cloned());

    assert_eq!(
        cloud_config.user_center().mode(),
        ServerUserCenterMode::SdkworkCloudAppApi
    );
    assert_eq!(
        cloud_config.user_center().authority_base_url(),
        Some("https://app-api.sdkwork.local/magic")
    );

    let external_env = HashMap::from([
        (
            "MAGIC_STUDIO_USER_CENTER_EXTERNAL_BASE_URL",
            " https://identity.vendor.local/magic/ ".to_string(),
        ),
        (
            "MAGIC_STUDIO_USER_CENTER_PROVIDER_KEY",
            " Magic Studio SSO ".to_string(),
        ),
    ]);
    let external_config = ServerConfig::from_env_lookup(|name| external_env.get(name).cloned());

    assert_eq!(
        external_config.user_center().mode(),
        ServerUserCenterMode::ExternalUserCenter
    );
    assert_eq!(
        external_config.user_center().authority_base_url(),
        Some("https://identity.vendor.local/magic")
    );
}

#[test]
fn server_config_rejects_non_canonical_public_user_center_mode_aliases() {
    let env = HashMap::from([
        ("MAGIC_STUDIO_USER_CENTER_MODE", " app-api-hub ".to_string()),
        (
            "MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL",
            " https://app-api.sdkwork.local/magic/ ".to_string(),
        ),
    ]);

    let error = ServerConfig::try_from_env_lookup(|name| env.get(name).cloned())
        .expect_err("non-canonical public user-center mode aliases must fail closed");

    assert!(error.contains("MAGIC_STUDIO_USER_CENTER_MODE"));
    assert!(error.contains("builtin-local"));
    assert!(error.contains("sdkwork-cloud-app-api"));
    assert!(error.contains("external-user-center"));
}

#[test]
fn server_config_rejects_invalid_runtime_mode_env_values() {
    let env = HashMap::from([("MAGIC_STUDIO_SERVER_RUNTIME_MODE", " tablet ".to_string())]);

    let error = ServerConfig::try_from_env_lookup(|name| env.get(name).cloned())
        .expect_err("invalid runtime mode values must fail closed");

    assert!(error.contains("MAGIC_STUDIO_SERVER_RUNTIME_MODE"));
    assert!(error.contains("server"));
    assert!(error.contains("desktop"));
}

#[test]
fn server_config_rejects_invalid_port_env_values() {
    let env = HashMap::from([("MAGIC_STUDIO_SERVER_PORT", " zero ".to_string())]);

    let error = ServerConfig::try_from_env_lookup(|name| env.get(name).cloned())
        .expect_err("invalid port values must fail closed");

    assert!(error.contains("MAGIC_STUDIO_SERVER_PORT"));
    assert!(error.contains("positive integer"));
}

#[test]
fn server_config_rejects_invalid_authorization_fallback_env_values() {
    let env = HashMap::from([(
        "MAGIC_STUDIO_USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN",
        " maybe ".to_string(),
    )]);

    let error = ServerConfig::try_from_env_lookup(|name| env.get(name).cloned())
        .expect_err("invalid boolean values must fail closed");

    assert!(error.contains("MAGIC_STUDIO_USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN"));
    assert!(error.contains("boolean"));
}

#[test]
fn server_config_rejects_invalid_handshake_freshness_window_env_values() {
    let env = HashMap::from([(
        "MAGIC_STUDIO_USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS",
        " NaN ".to_string(),
    )]);

    let error = ServerConfig::try_from_env_lookup(|name| env.get(name).cloned())
        .expect_err("invalid handshake window values must fail closed");

    assert!(error.contains("MAGIC_STUDIO_USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS"));
    assert!(error.contains("unsigned integer"));
}
