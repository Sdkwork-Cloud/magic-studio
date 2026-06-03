use std::time::{SystemTime, UNIX_EPOCH};

use crate::response::{ServerError, ServerResult};

use super::creation::CreationSessionAttachmentRecord;

pub(crate) fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

pub(crate) fn require_non_empty_text(
    value: String,
    code: &str,
    field_name: &str,
) -> ServerResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }
    Ok(trimmed.to_string())
}

pub(crate) fn current_time_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}

pub(crate) fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}

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

    Err(ServerError::bad_request(
        error_code,
        "target must be one of short_drama, video, image, one_click, human, music, speech, or sfx",
    ))
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
