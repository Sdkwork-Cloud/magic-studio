use crate::response::{ServerError, ServerResult};

use super::creation::CreationSessionAttachmentRecord;

// Re-export shared utilities so existing `creation_support` consumers are unaffected.
pub(crate) use super::service_utils::{
    current_time_millis, normalize_optional_text, require_non_empty_text, to_client_entity_uuid,
};

pub(crate) fn normalize_creation_target(
    value: Option<String>,
    error_code: &str,
) -> ServerResult<String> {
    let normalized = normalize_optional_text(value)
        .map(|value| value.to_ascii_lowercase().replace('-', "_"))
        .unwrap_or_default();

    if matches!(
        normalized.as_str(),
        "short_drama" | "video" | "image" | "one_click" | "human" | "music" | "speech" | "sfx"
    ) {
        return Ok(normalized);
    }

    Err(ServerError::bad_request("request validation failed").with_tag(error_code))
}

pub(crate) fn normalize_creation_session_attachments(
    attachments: Vec<CreationSessionAttachmentRecord>,
) -> Vec<CreationSessionAttachmentRecord> {
    let mut unique = std::collections::BTreeSet::new();
    let mut normalized = Vec::new();

    for attachment in attachments {
        let uuid = attachment.uuid.trim().to_string();
        if uuid.is_empty() {
            continue;
        }

        let attachment_type = attachment.r#type.trim().to_ascii_lowercase();
        if !matches!(
            attachment_type.as_str(),
            "image" | "video" | "audio" | "script" | "file"
        ) {
            continue;
        }

        let name = attachment.name.trim().to_string();
        let normalized_name = if name.is_empty() { uuid.clone() } else { name };
        let id = normalize_optional_text(attachment.id);
        let asset_id = normalize_optional_text(attachment.asset_id);
        let asset_uuid = normalize_optional_text(attachment.asset_uuid);
        let locator = normalize_optional_text(attachment.locator);
        let content = if attachment_type == "script" {
            normalize_optional_text(attachment.content)
        } else {
            None
        };

        let dedupe_key = format!(
            "{}|{}|{}|{}|{}|{}",
            id.clone().unwrap_or_default(),
            uuid,
            asset_id.clone().unwrap_or_default(),
            attachment_type,
            locator.clone().unwrap_or_default(),
            content.clone().unwrap_or_default(),
        );
        if !unique.insert(dedupe_key) {
            continue;
        }

        normalized.push(CreationSessionAttachmentRecord {
            id,
            uuid,
            name: normalized_name,
            r#type: attachment_type,
            asset_id,
            asset_uuid,
            locator,
            content,
        });
    }

    normalized
}

pub(crate) fn merge_creation_session_attachments(
    base: Vec<CreationSessionAttachmentRecord>,
    overlay: Vec<CreationSessionAttachmentRecord>,
) -> Vec<CreationSessionAttachmentRecord> {
    let mut merged = base;
    merged.extend(overlay);
    normalize_creation_session_attachments(merged)
}

pub(crate) fn normalize_creation_template_step_id(value: &str) -> String {
    let sanitized = value
        .trim()
        .to_ascii_lowercase()
        .replace('_', "-")
        .replace(' ', "-");
    let sanitized = sanitized
        .chars()
        .filter(|character| character.is_ascii_alphanumeric() || *character == '-')
        .collect::<String>();

    if sanitized.is_empty() {
        "creation-template-step".to_string()
    } else if sanitized.starts_with("creation-template-step-") {
        sanitized
    } else {
        format!("creation-template-step-{sanitized}")
    }
}
