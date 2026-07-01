//! Shared utility functions used across all service modules.
//!
//! Eliminates code duplication of text normalization, validation,
//! timestamp generation, and entity identity helpers.

use std::time::{SystemTime, UNIX_EPOCH};

use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

/// Trims an optional string and returns `None` if the result is empty.
///
/// Trims whitespace; empty results become `None`.
pub fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

/// Trims a string and returns `None` if the result is empty.
///
/// Convenience wrapper for use with `Option::and_then`.
pub fn normalize_text(value: String) -> Option<String> {
    normalize_optional_text(Some(value))
}

/// Requires a non-empty trimmed string, returning a validation error otherwise.
///
/// Accepts both `&str` and `String` via `AsRef<str>`.
pub fn require_non_empty_text(
    value: impl AsRef<str>,
    code: &str,
    field_name: &str,
) -> ServerResult<String> {
    let trimmed = value.as_ref().trim();
    if trimmed.is_empty() {
        return Err(
            ServerError::bad_request(format!("{field_name} must not be empty")).with_tag(code),
        );
    }
    Ok(trimmed.to_string())
}

/// Returns the current time in milliseconds since the Unix epoch.
pub fn current_time_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}

/// Returns the current UTC timestamp as an RFC 3339 string.
pub fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

/// Wraps an entity id with the `client-entity:` prefix used for client-side identity.
pub fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}
