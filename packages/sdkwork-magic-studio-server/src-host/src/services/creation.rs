use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

const CREATION_SESSION_SCHEMA_VERSION: &str = "magic-studio.creation-sessions.v1";
const CREATION_SESSION_SOURCE_PORTAL: &str = "portal-video";
const CREATION_SESSION_SOURCE_TEMPLATE: &str = "creation-template";
const CREATION_SESSION_SOURCE_BATCH: &str = "creation-batch";
const CREATION_SESSION_DEFAULT_TTL_MS: i64 = 30 * 60 * 1000;

static CREATION_SESSION_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CreationCapabilitiesQuery {
    pub target: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationOptionRecord {
    pub value: String,
    pub label: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreationModelCapabilitiesRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supports_reasoning: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supports_multimodal: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supports_function_call: Option<bool>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub aspect_ratio_options: Vec<CreationOptionRecord>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub resolution_options: Vec<CreationOptionRecord>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub duration_options: Vec<CreationOptionRecord>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub style_options: Vec<CreationOptionRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationModelRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_key: Option<String>,
    pub model: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channel: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<CreationModelCapabilitiesRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationChannelRecord {
    pub channel: String,
    pub name: String,
    pub models: Vec<CreationModelRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationStyleAssetRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreationStyleAssetGroupRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scene: Option<CreationStyleAssetRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub portrait: Option<CreationStyleAssetRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sheet: Option<CreationStyleAssetRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video: Option<CreationStyleAssetRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationStyleOptionRecord {
    pub id: String,
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub usage: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_zh: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assets: Option<CreationStyleAssetGroupRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationCapabilitiesRecord {
    pub target: String,
    pub channels: Vec<CreationChannelRecord>,
    pub style_options: Vec<CreationStyleOptionRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationSessionAttachmentRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub uuid: String,
    pub name: String,
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_uuid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locator: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationSessionRecord {
    pub session_id: String,
    pub source: String,
    pub target: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gen_mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    #[serde(default)]
    pub attachments: Vec<CreationSessionAttachmentRecord>,
    pub workspace_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationSessionSnapshotRecord {
    pub session: Option<CreationSessionRecord>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CreationSessionQuery {
    pub target: Option<String>,
    pub workspace_id: Option<String>,
    pub project_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreationSessionRequest {
    pub target: String,
    #[serde(default)]
    pub prompt: Option<String>,
    #[serde(default)]
    pub gen_mode: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub style_id: Option<String>,
    #[serde(default)]
    pub aspect_ratio: Option<String>,
    #[serde(default)]
    pub resolution: Option<String>,
    #[serde(default)]
    pub duration: Option<String>,
    #[serde(default)]
    pub attachments: Option<Vec<CreationSessionAttachmentRecord>>,
    pub workspace_id: String,
    #[serde(default)]
    pub project_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreationSessionDocument {
    schema_version: String,
    #[serde(default)]
    sessions: Vec<CreationSessionRecord>,
}

pub trait CreationService: Send + Sync {
    fn read_capabilities(
        &self,
        query: CreationCapabilitiesQuery,
    ) -> ServerResult<CreationCapabilitiesRecord>;
    fn create_session(
        &self,
        input: CreateCreationSessionRequest,
    ) -> ServerResult<CreationSessionRecord>;
    fn create_session_with_source(
        &self,
        input: CreateCreationSessionRequest,
        source: &str,
    ) -> ServerResult<CreationSessionRecord>;
    fn read_current_session(
        &self,
        query: CreationSessionQuery,
    ) -> ServerResult<CreationSessionSnapshotRecord>;
    fn consume_current_session(
        &self,
        query: CreationSessionQuery,
    ) -> ServerResult<CreationSessionSnapshotRecord>;
    fn clear_current_session(&self, query: CreationSessionQuery) -> ServerResult<()>;
}

pub struct FileBackedCreationService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedCreationService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn load_session_document(&self) -> ServerResult<CreationSessionDocument> {
        let path = self.storage_paths.creation_sessions_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(CreationSessionDocument {
                    schema_version: CREATION_SESSION_SCHEMA_VERSION.to_string(),
                    sessions: Vec::new(),
                })
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "CREATION_SESSIONS_READ_FAILED",
                    format!(
                        "failed to read creation sessions from {}: {error}",
                        path.display()
                    ),
                ))
            }
        };

        serde_json::from_str::<CreationSessionDocument>(&contents).map_err(|error| {
            ServerError::internal(
                "CREATION_SESSIONS_PARSE_FAILED",
                format!(
                    "failed to parse creation sessions document {}: {error}",
                    path.display()
                ),
            )
        })
    }

    fn persist_session_document(&self, document: &CreationSessionDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "CREATION_SESSIONS_SERIALIZE_FAILED",
                format!("failed to serialize creation sessions: {error}"),
            )
        })?;

        fs::write(self.storage_paths.creation_sessions_file(), contents).map_err(|error| {
            ServerError::internal(
                "CREATION_SESSIONS_WRITE_FAILED",
                format!(
                    "failed to write creation sessions to {}: {error}",
                    self.storage_paths.creation_sessions_file().display()
                ),
            )
        })
    }
}

impl CreationService for FileBackedCreationService {
    fn read_capabilities(
        &self,
        query: CreationCapabilitiesQuery,
    ) -> ServerResult<CreationCapabilitiesRecord> {
        let requested_target = query
            .target
            .as_deref()
            .map(normalize_target)
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "video".to_string());
        let canonical_target = alias_target(&requested_target);

        Ok(match canonical_target {
            "short_drama" => short_drama_catalog(&requested_target),
            "video" => video_catalog(&requested_target),
            "image" => image_catalog(&requested_target),
            "music" => music_catalog(&requested_target),
            "speech" => speech_catalog(&requested_target),
            "sfx" => sfx_catalog(&requested_target),
            "human" => human_catalog(&requested_target),
            _ => empty_catalog(&requested_target),
        })
    }

    fn create_session(
        &self,
        input: CreateCreationSessionRequest,
    ) -> ServerResult<CreationSessionRecord> {
        self.create_session_with_source(input, CREATION_SESSION_SOURCE_PORTAL)
    }

    fn create_session_with_source(
        &self,
        input: CreateCreationSessionRequest,
        source: &str,
    ) -> ServerResult<CreationSessionRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_SESSIONS_LOCK_FAILED",
                "failed to acquire creation sessions lock",
            )
        })?;

        let workspace_id = require_non_empty_text(
            input.workspace_id,
            "CREATION_SESSION_WORKSPACE_ID_EMPTY",
            "workspaceId",
        )?;
        let project_id = normalize_optional_text(input.project_id);
        let target = require_creation_session_target(Some(input.target))?;
        let prompt = normalize_optional_text(input.prompt).unwrap_or_default();
        let gen_mode = normalize_optional_text(input.gen_mode);
        let model = normalize_optional_text(input.model);
        let style_id = normalize_optional_text(input.style_id);
        let aspect_ratio = normalize_optional_text(input.aspect_ratio);
        let resolution = normalize_optional_text(input.resolution);
        let duration = normalize_optional_text(input.duration);
        let attachments =
            normalize_creation_session_attachments(input.attachments.unwrap_or_default());
        let mut document = self.load_session_document()?;
        let now_ms = current_time_millis();

        purge_expired_sessions(&mut document.sessions, now_ms);
        document.sessions.retain(|session| {
            !same_session_slot(session, &target, &workspace_id, project_id.as_deref())
        });

        let session = CreationSessionRecord {
            session_id: next_creation_session_id(now_ms),
            source: normalize_creation_session_source(source),
            target,
            prompt,
            gen_mode,
            model,
            style_id,
            aspect_ratio,
            resolution,
            duration,
            attachments,
            workspace_id,
            project_id,
            created_at: now_ms,
            expires_at: now_ms + CREATION_SESSION_DEFAULT_TTL_MS,
        };

        document.sessions.insert(0, session.clone());
        self.persist_session_document(&document)?;
        Ok(session)
    }

    fn read_current_session(
        &self,
        query: CreationSessionQuery,
    ) -> ServerResult<CreationSessionSnapshotRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_SESSIONS_LOCK_FAILED",
                "failed to acquire creation sessions lock",
            )
        })?;

        let mut document = self.load_session_document()?;
        let now_ms = current_time_millis();
        let changed = purge_expired_sessions(&mut document.sessions, now_ms);
        let normalized_query = normalize_creation_session_query(query)?;
        let session = find_current_session(&document.sessions, &normalized_query).cloned();

        if changed {
            self.persist_session_document(&document)?;
        }

        Ok(CreationSessionSnapshotRecord { session })
    }

    fn consume_current_session(
        &self,
        query: CreationSessionQuery,
    ) -> ServerResult<CreationSessionSnapshotRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_SESSIONS_LOCK_FAILED",
                "failed to acquire creation sessions lock",
            )
        })?;

        let mut document = self.load_session_document()?;
        let now_ms = current_time_millis();
        purge_expired_sessions(&mut document.sessions, now_ms);
        let normalized_query = normalize_creation_session_query(query)?;
        let index = document
            .sessions
            .iter()
            .position(|session| session_matches_query(session, &normalized_query));
        let session = index.map(|position| document.sessions.remove(position));
        self.persist_session_document(&document)?;
        Ok(CreationSessionSnapshotRecord { session })
    }

    fn clear_current_session(&self, query: CreationSessionQuery) -> ServerResult<()> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_SESSIONS_LOCK_FAILED",
                "failed to acquire creation sessions lock",
            )
        })?;

        let mut document = self.load_session_document()?;
        let now_ms = current_time_millis();
        purge_expired_sessions(&mut document.sessions, now_ms);
        let normalized_query = normalize_creation_session_query(query)?;
        document
            .sessions
            .retain(|session| !session_matches_query(session, &normalized_query));
        self.persist_session_document(&document)?;
        Ok(())
    }
}

fn normalize_target(value: &str) -> String {
    value.trim().to_ascii_lowercase().replace('-', "_")
}

fn alias_target(value: &str) -> &str {
    match value {
        "one_click" => "short_drama",
        "voice" | "audio" => "speech",
        "character" => "human",
        _ => value,
    }
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let normalized = item.trim().to_string();
        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    })
}

fn require_non_empty_text(value: String, code: &str, field_name: &str) -> ServerResult<String> {
    let normalized = value.trim().to_string();
    if normalized.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }
    Ok(normalized)
}

fn current_time_millis() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}

fn next_creation_session_id(now_ms: i64) -> String {
    let counter = CREATION_SESSION_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("portal-{now_ms}-{counter}")
}

fn valid_creation_session_target(value: &str) -> bool {
    matches!(
        value,
        "short_drama" | "video" | "image" | "one_click" | "human" | "music" | "speech" | "sfx"
    )
}

fn require_creation_session_target(value: Option<String>) -> ServerResult<String> {
    let normalized = normalize_optional_text(value)
        .map(|item| item.to_ascii_lowercase().replace('-', "_"))
        .unwrap_or_default();
    if valid_creation_session_target(&normalized) {
        return Ok(normalized);
    }

    Err(ServerError::bad_request(
        "CREATION_SESSION_TARGET_INVALID",
        "target must be one of short_drama, video, image, one_click, human, music, speech, or sfx",
    ))
}

fn valid_creation_session_attachment_type(value: &str) -> bool {
    matches!(value, "image" | "video" | "audio" | "script" | "file")
}

fn normalize_creation_session_attachments(
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
        if !valid_creation_session_attachment_type(&attachment_type) {
            continue;
        }
        let name = attachment
            .name
            .trim()
            .to_string()
            .chars()
            .collect::<String>();
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
            content.clone().unwrap_or_default()
        );
        if unique.contains(&dedupe_key) {
            continue;
        }
        unique.insert(dedupe_key);
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

fn purge_expired_sessions(sessions: &mut Vec<CreationSessionRecord>, now_ms: i64) -> bool {
    let initial_len = sessions.len();
    sessions.retain(|session| session.expires_at > now_ms);
    sessions.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    sessions.len() != initial_len
}

#[derive(Debug, Clone)]
struct NormalizedCreationSessionQuery {
    target: Option<String>,
    workspace_id: Option<String>,
    project_id: Option<String>,
}

fn normalize_creation_session_query(
    query: CreationSessionQuery,
) -> ServerResult<NormalizedCreationSessionQuery> {
    Ok(NormalizedCreationSessionQuery {
        target: query
            .target
            .map(|value| require_creation_session_target(Some(value)))
            .transpose()?,
        workspace_id: normalize_optional_text(query.workspace_id),
        project_id: normalize_optional_text(query.project_id),
    })
}

fn session_matches_query(
    session: &CreationSessionRecord,
    query: &NormalizedCreationSessionQuery,
) -> bool {
    if let Some(target) = &query.target {
        if &session.target != target {
            return false;
        }
    }
    if let Some(workspace_id) = &query.workspace_id {
        if &session.workspace_id != workspace_id {
            return false;
        }
    }
    if let Some(project_id) = &query.project_id {
        if session.project_id.as_deref() != Some(project_id.as_str()) {
            return false;
        }
    }
    true
}

fn find_current_session<'a>(
    sessions: &'a [CreationSessionRecord],
    query: &NormalizedCreationSessionQuery,
) -> Option<&'a CreationSessionRecord> {
    sessions
        .iter()
        .find(|session| session_matches_query(session, query))
}

fn same_session_slot(
    session: &CreationSessionRecord,
    target: &str,
    workspace_id: &str,
    project_id: Option<&str>,
) -> bool {
    session.target == target
        && session.workspace_id == workspace_id
        && session.project_id.as_deref() == project_id
}

fn normalize_creation_session_source(source: &str) -> String {
    let normalized = source.trim().to_ascii_lowercase();
    match normalized.as_str() {
        CREATION_SESSION_SOURCE_PORTAL => CREATION_SESSION_SOURCE_PORTAL.to_string(),
        CREATION_SESSION_SOURCE_TEMPLATE => CREATION_SESSION_SOURCE_TEMPLATE.to_string(),
        CREATION_SESSION_SOURCE_BATCH => CREATION_SESSION_SOURCE_BATCH.to_string(),
        _ => CREATION_SESSION_SOURCE_PORTAL.to_string(),
    }
}

fn empty_catalog(target: &str) -> CreationCapabilitiesRecord {
    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: Vec::new(),
        style_options: Vec::new(),
    }
}

fn option(value: &str, label: &str) -> CreationOptionRecord {
    CreationOptionRecord {
        value: value.to_string(),
        label: label.to_string(),
        description: None,
    }
}

fn ratios(values: &[&str]) -> Vec<CreationOptionRecord> {
    values.iter().map(|value| option(value, value)).collect()
}

fn durations(values: &[&str]) -> Vec<CreationOptionRecord> {
    values.iter().map(|value| option(value, value)).collect()
}

fn resolutions(values: &[(&str, &str)]) -> Vec<CreationOptionRecord> {
    values
        .iter()
        .map(|(value, label)| option(value, label))
        .collect()
}

fn style_values(values: &[(&str, &str)]) -> Vec<CreationOptionRecord> {
    values
        .iter()
        .map(|(value, label)| option(value, label))
        .collect()
}

fn visual_capabilities(
    duration_values: &[&str],
    resolution_values: &[(&str, &str)],
    ratio_values: &[&str],
) -> CreationModelCapabilitiesRecord {
    CreationModelCapabilitiesRecord {
        supports_multimodal: Some(true),
        duration_options: durations(duration_values),
        resolution_options: resolutions(resolution_values),
        aspect_ratio_options: ratios(ratio_values),
        ..CreationModelCapabilitiesRecord::default()
    }
}

fn audio_capabilities(duration_values: &[&str]) -> CreationModelCapabilitiesRecord {
    CreationModelCapabilitiesRecord {
        supports_multimodal: Some(false),
        duration_options: durations(duration_values),
        ..CreationModelCapabilitiesRecord::default()
    }
}

fn model(
    channel: &str,
    model: &str,
    name: &str,
    description: &str,
    model_type: &str,
    capabilities: CreationModelCapabilitiesRecord,
) -> CreationModelRecord {
    CreationModelRecord {
        model_id: None,
        model_key: None,
        model: model.to_string(),
        name: name.to_string(),
        description: Some(description.to_string()),
        channel: Some(channel.to_string()),
        model_type: Some(model_type.to_string()),
        capabilities: Some(capabilities),
    }
}

fn channel(channel: &str, name: &str, models: Vec<CreationModelRecord>) -> CreationChannelRecord {
    CreationChannelRecord {
        channel: channel.to_string(),
        name: name.to_string(),
        models,
    }
}

fn style(
    id: &str,
    label: &str,
    description: &str,
    usage: &[&str],
    prompt: &str,
    preview_color: &str,
) -> CreationStyleOptionRecord {
    CreationStyleOptionRecord {
        id: id.to_string(),
        label: label.to_string(),
        description: Some(description.to_string()),
        usage: usage.iter().map(|item| (*item).to_string()).collect(),
        prompt: Some(prompt.to_string()),
        prompt_zh: None,
        custom: Some(false),
        preview_color: Some(preview_color.to_string()),
        assets: None,
    }
}

fn custom_style(
    id: &str,
    label: &str,
    description: &str,
    preview_color: &str,
) -> CreationStyleOptionRecord {
    CreationStyleOptionRecord {
        id: id.to_string(),
        label: label.to_string(),
        description: Some(description.to_string()),
        usage: Vec::new(),
        prompt: Some(String::new()),
        prompt_zh: None,
        custom: Some(true),
        preview_color: Some(preview_color.to_string()),
        assets: None,
    }
}

fn short_drama_styles() -> Vec<CreationStyleOptionRecord> {
    vec![
        style(
            "cinematic",
            "Cinematic",
            "Movie-grade lighting, contrast, and dramatic staging.",
            &["drama", "commercial", "episodic"],
            "cinematic lighting, dramatic contrast, character-driven framing, premium storyboarding",
            "#d97706",
        ),
        style(
            "realistic",
            "Realistic",
            "Grounded scenes with believable detail and natural light.",
            &["slice-of-life", "urban", "documentary"],
            "realistic scene, natural lighting, lifelike texture, grounded composition",
            "#2563eb",
        ),
        style(
            "anime",
            "Anime",
            "Stylized animation language with crisp silhouettes and strong color design.",
            &["animation", "fantasy", "youth"],
            "anime style, expressive color palette, crisp linework, dynamic framing",
            "#db2777",
        ),
        style(
            "documentary",
            "Documentary",
            "Observed realism with restrained grading and authentic atmosphere.",
            &["social", "biography", "reportage"],
            "documentary realism, observational camera, authentic atmosphere, restrained color grading",
            "#059669",
        ),
        custom_style(
            "custom",
            "Custom",
            "Skip presets and rely entirely on the authored prompt.",
            "#6b7280",
        ),
    ]
}

fn image_styles() -> Vec<CreationStyleOptionRecord> {
    vec![
        style(
            "photoreal",
            "Photoreal",
            "Balanced realism for product, portrait, and scene imagery.",
            &["photo", "portrait", "marketing"],
            "photorealistic lighting, high detail, realistic texture, natural camera balance",
            "#2563eb",
        ),
        style(
            "illustration",
            "Illustration",
            "Clean shapes, deliberate color blocking, and editorial polish.",
            &["editorial", "concept", "poster"],
            "editorial illustration, clean shape language, deliberate color palette, polished composition",
            "#7c3aed",
        ),
        style(
            "product",
            "Product Shot",
            "Commercial presentation with controlled reflections and hero composition.",
            &["commerce", "brand", "catalog"],
            "commercial product photography, premium lighting, clean backdrop, hero angle",
            "#f97316",
        ),
        custom_style(
            "custom",
            "Custom",
            "Skip presets and rely entirely on the authored prompt.",
            "#6b7280",
        ),
    ]
}

fn music_styles() -> Vec<CreationStyleOptionRecord> {
    vec![
        style(
            "pop",
            "Pop",
            "Hook-first structure with modern commercial polish.",
            &["vocal", "commercial", "short-form"],
            "modern pop arrangement, catchy hook, polished mix, bright energy",
            "#ec4899",
        ),
        style(
            "cinematic",
            "Cinematic Score",
            "Hybrid orchestral tension designed for trailers and story sequences.",
            &["trailer", "film", "background"],
            "cinematic score, hybrid orchestral pulse, emotional build, trailer-friendly dynamics",
            "#f59e0b",
        ),
        style(
            "electronic",
            "Electronic",
            "Synth-driven grooves with contemporary texture.",
            &["club", "stream", "tech"],
            "electronic production, synth groove, modern texture, polished rhythm section",
            "#06b6d4",
        ),
        custom_style(
            "custom",
            "Custom",
            "Skip presets and rely entirely on the authored prompt.",
            "#6b7280",
        ),
    ]
}

fn human_styles() -> Vec<CreationStyleOptionRecord> {
    vec![
        style(
            "hero",
            "Hero",
            "Confident protagonist framing with readable costume language.",
            &["protagonist", "poster", "avatar"],
            "heroic stance, confident expression, readable silhouette, premium character design",
            "#16a34a",
        ),
        style(
            "anime",
            "Anime Character",
            "Expressive anime styling with clean line language.",
            &["animation", "avatar", "concept"],
            "anime character design, expressive eyes, vibrant palette, clean cel shading",
            "#db2777",
        ),
        style(
            "fantasy",
            "Fantasy",
            "Stylized worldbuilding for armor, prop, and faction identity.",
            &["rpg", "game", "worldbuilding"],
            "fantasy warrior design, layered costume detail, magical worldbuilding, premium concept art",
            "#7c3aed",
        ),
        custom_style(
            "custom",
            "Custom",
            "Skip presets and rely entirely on the authored prompt.",
            "#6b7280",
        ),
    ]
}

fn short_drama_catalog(target: &str) -> CreationCapabilitiesRecord {
    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![
            channel(
                "VOLCENGINE",
                "Volcengine",
                vec![
                    model(
                        "VOLCENGINE",
                        "film-master",
                        "Film Master",
                        "Narrative short-drama generation tuned for coherent episodic shots.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s", "15s", "60s"],
                            &[("2k", "2K"), ("4k", "4K")],
                            &["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
                        ),
                    ),
                    model(
                        "VOLCENGINE",
                        "story-director",
                        "Story Director",
                        "Story-first short-drama model optimized for scene continuity and pacing.",
                        "video",
                        CreationModelCapabilitiesRecord {
                            supports_reasoning: Some(true),
                            ..visual_capabilities(
                                &["10s", "15s", "30s", "60s"],
                                &[("1080p", "1080p"), ("2k", "2K")],
                                &["16:9", "9:16", "1:1"],
                            )
                        },
                    ),
                ],
            ),
            channel(
                "KLING",
                "Kling AI",
                vec![model(
                    "KLING",
                    "kling-v2.1-master",
                    "Kling v2.1 Master",
                    "Multi-shot dramatic generation with strong visual continuity controls.",
                    "video",
                    visual_capabilities(
                        &["5s", "10s"],
                        &[("720p", "720p"), ("1080p", "1080p")],
                        &["16:9", "9:16", "1:1"],
                    ),
                )],
            ),
        ],
        style_options: short_drama_styles(),
    }
}

fn video_catalog(target: &str) -> CreationCapabilitiesRecord {
    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![
            channel(
                "ALIYUN",
                "Alibaba Cloud",
                vec![
                    model(
                        "ALIYUN",
                        "wan2.2-t2v-plus",
                        "Wan 2.2 T2V Plus",
                        "Official text-to-video model for premium narrative motion.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s"],
                            &[("720p", "720p"), ("1080p", "1080p")],
                            &["21:9", "16:9", "4:3", "1:1", "9:16"],
                        ),
                    ),
                    model(
                        "ALIYUN",
                        "wan2.2-i2v-plus",
                        "Wan 2.2 I2V Plus",
                        "Image-to-video generation with reference-aware motion control.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s"],
                            &[("720p", "720p"), ("1080p", "1080p")],
                            &["21:9", "16:9", "4:3", "1:1", "9:16"],
                        ),
                    ),
                ],
            ),
            channel(
                "VOLCENGINE",
                "Volcengine",
                vec![
                    model(
                        "VOLCENGINE",
                        "seedance-1-0-pro-250528",
                        "Seedance 1.0 Pro",
                        "Unified high-quality video generation for text and image driven flows.",
                        "video",
                        visual_capabilities(
                            &["4s", "6s", "8s", "10s", "12s"],
                            &[("720p", "720p"), ("1080p", "1080p")],
                            &["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
                        ),
                    ),
                    model(
                        "VOLCENGINE",
                        "seedance-1-0-lite-t2v-250428",
                        "Seedance 1.0 Lite",
                        "Fast turnaround video generation for iteration-heavy workflows.",
                        "video",
                        visual_capabilities(
                            &["4s", "6s", "8s", "10s"],
                            &[("720p", "720p")],
                            &["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
                        ),
                    ),
                ],
            ),
            channel(
                "KLING",
                "Kling AI",
                vec![
                    model(
                        "KLING",
                        "kling-v2.1-master",
                        "Kling v2.1 Master",
                        "Feature-rich generation with extend, lip-sync, and reference workflows.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s"],
                            &[("720p", "720p"), ("1080p", "1080p")],
                            &["16:9", "9:16", "1:1"],
                        ),
                    ),
                    model(
                        "KLING",
                        "kling-v1.6-standard",
                        "Kling v1.6 Standard",
                        "Lower-cost baseline model for straightforward clip generation.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s"],
                            &[("720p", "720p")],
                            &["16:9", "9:16", "1:1"],
                        ),
                    ),
                ],
            ),
            channel(
                "GOOGLE",
                "Google",
                vec![
                    model(
                        "GOOGLE",
                        "veo-2.0-generate-001",
                        "Veo 2",
                        "High-fidelity cinematic video generation.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s", "15s", "30s", "60s"],
                            &[("720p", "720p"), ("1080p", "1080p")],
                            &["16:9", "9:16", "1:1"],
                        ),
                    ),
                    model(
                        "GOOGLE",
                        "veo-3.0-generate-001",
                        "Veo 3",
                        "Latest premium model with broader duration and quality coverage.",
                        "video",
                        visual_capabilities(
                            &["5s", "10s", "15s", "30s", "60s"],
                            &[("720p", "720p"), ("1080p", "1080p"), ("4k", "4K")],
                            &["16:9", "9:16", "1:1"],
                        ),
                    ),
                ],
            ),
        ],
        style_options: Vec::new(),
    }
}

fn image_catalog(target: &str) -> CreationCapabilitiesRecord {
    let style_options = style_values(&[
        ("photoreal", "Photoreal"),
        ("illustration", "Illustration"),
        ("product", "Product Shot"),
        ("custom", "Custom"),
    ]);

    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![
            channel(
                "GOOGLE",
                "Google",
                vec![
                    model(
                        "GOOGLE",
                        "gemini-3-pro-image-preview",
                        "Gemini 3 Pro",
                        "Complex prompt following with rich visual reasoning.",
                        "image",
                        CreationModelCapabilitiesRecord {
                            supports_reasoning: Some(true),
                            supports_multimodal: Some(true),
                            aspect_ratio_options: ratios(&[
                                "21:9", "16:9", "4:3", "1:1", "3:4", "9:16",
                            ]),
                            resolution_options: resolutions(&[
                                ("1024", "1024"),
                                ("2048", "2048"),
                                ("4096", "4096"),
                            ]),
                            style_options: style_options.clone(),
                            ..CreationModelCapabilitiesRecord::default()
                        },
                    ),
                    model(
                        "GOOGLE",
                        "gemini-2.5-flash-image",
                        "Gemini Flash",
                        "Fast iteration model for concepting and prompt refinement.",
                        "image",
                        CreationModelCapabilitiesRecord {
                            supports_reasoning: Some(false),
                            supports_multimodal: Some(true),
                            aspect_ratio_options: ratios(&["16:9", "1:1", "9:16"]),
                            resolution_options: resolutions(&[("1024", "1024"), ("2048", "2048")]),
                            style_options: style_options.clone(),
                            ..CreationModelCapabilitiesRecord::default()
                        },
                    ),
                ],
            ),
            channel(
                "REPLICATE",
                "Replicate",
                vec![
                    model(
                        "REPLICATE",
                        "black-forest-labs/flux-kontext-pro",
                        "Flux Kontext Pro",
                        "Context-aware high-quality image generation.",
                        "image",
                        CreationModelCapabilitiesRecord {
                            supports_multimodal: Some(true),
                            aspect_ratio_options: ratios(&["16:9", "4:3", "1:1", "3:4", "9:16"]),
                            resolution_options: resolutions(&[("1024", "1024"), ("2048", "2048")]),
                            style_options: style_options.clone(),
                            ..CreationModelCapabilitiesRecord::default()
                        },
                    ),
                    model(
                        "REPLICATE",
                        "black-forest-labs/flux-fill-pro",
                        "Flux Fill Pro",
                        "Edit-oriented image model for inpainting and outpainting.",
                        "image",
                        CreationModelCapabilitiesRecord {
                            supports_multimodal: Some(true),
                            aspect_ratio_options: ratios(&["16:9", "4:3", "1:1", "3:4", "9:16"]),
                            resolution_options: resolutions(&[("1024", "1024"), ("2048", "2048")]),
                            style_options: style_options.clone(),
                            ..CreationModelCapabilitiesRecord::default()
                        },
                    ),
                ],
            ),
            channel(
                "VOLCENGINE",
                "Volcengine",
                vec![model(
                    "VOLCENGINE",
                    "doubao-seedream-3-0-t2i-250415",
                    "Seedream 3.0",
                    "High-detail image generation with strong scene composition.",
                    "image",
                    CreationModelCapabilitiesRecord {
                        supports_multimodal: Some(true),
                        aspect_ratio_options: ratios(&["16:9", "4:3", "1:1", "3:4", "9:16"]),
                        resolution_options: resolutions(&[
                            ("1024", "1024"),
                            ("2048", "2048"),
                            ("4096", "4096"),
                        ]),
                        style_options: style_options.clone(),
                        ..CreationModelCapabilitiesRecord::default()
                    },
                )],
            ),
        ],
        style_options: image_styles(),
    }
}

fn music_catalog(target: &str) -> CreationCapabilitiesRecord {
    let style_options = style_values(&[
        ("pop", "Pop"),
        ("cinematic", "Cinematic Score"),
        ("electronic", "Electronic"),
        ("custom", "Custom"),
    ]);

    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![
            channel(
                "SUNO",
                "Suno",
                vec![
                    model(
                        "SUNO",
                        "suno-v3",
                        "Suno V3",
                        "Default general-purpose music generation.",
                        "music",
                        CreationModelCapabilitiesRecord {
                            duration_options: durations(&["30s", "60s", "120s"]),
                            style_options: style_options.clone(),
                            ..CreationModelCapabilitiesRecord::default()
                        },
                    ),
                    model(
                        "SUNO",
                        "suno-v3.5",
                        "Suno V3.5",
                        "Higher-fidelity commercial music generation.",
                        "music",
                        CreationModelCapabilitiesRecord {
                            duration_options: durations(&["30s", "60s", "120s"]),
                            style_options: style_options.clone(),
                            ..CreationModelCapabilitiesRecord::default()
                        },
                    ),
                ],
            ),
            channel(
                "UDIO",
                "Udio",
                vec![model(
                    "UDIO",
                    "udio-v1",
                    "Udio V1",
                    "Professional music AI for polished vocal and instrumental tracks.",
                    "music",
                    CreationModelCapabilitiesRecord {
                        duration_options: durations(&["30s", "60s", "120s"]),
                        style_options: style_options.clone(),
                        ..CreationModelCapabilitiesRecord::default()
                    },
                )],
            ),
            channel(
                "OPENSOURCE",
                "Open Source",
                vec![model(
                    "OPENSOURCE",
                    "musicgen-large",
                    "MusicGen Large",
                    "Open source baseline for on-prem or experimental workflows.",
                    "music",
                    CreationModelCapabilitiesRecord {
                        duration_options: durations(&["15s", "30s", "60s"]),
                        style_options: style_options.clone(),
                        ..CreationModelCapabilitiesRecord::default()
                    },
                )],
            ),
        ],
        style_options: music_styles(),
    }
}

fn speech_catalog(target: &str) -> CreationCapabilitiesRecord {
    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![
            channel(
                "GOOGLE",
                "Google",
                vec![model(
                    "GOOGLE",
                    "gemini-2.5-flash-tts",
                    "Gemini Flash TTS",
                    "Fast speech synthesis tuned for interactive product flows.",
                    "speech",
                    audio_capabilities(&["15s", "30s", "60s", "120s"]),
                )],
            ),
            channel(
                "OPENAI",
                "OpenAI",
                vec![model(
                    "OPENAI",
                    "openai-tts-1",
                    "OpenAI TTS HD",
                    "High-quality speech synthesis for premium narration.",
                    "speech",
                    audio_capabilities(&["15s", "30s", "60s"]),
                )],
            ),
            channel(
                "ELEVENLABS",
                "ElevenLabs",
                vec![model(
                    "ELEVENLABS",
                    "eleven-labs-v2",
                    "ElevenLabs v2",
                    "Professional voice generation and clone-adjacent speech workflows.",
                    "speech",
                    audio_capabilities(&["15s", "30s", "60s", "120s"]),
                )],
            ),
            channel(
                "AZURE",
                "Azure",
                vec![model(
                    "AZURE",
                    "azure-speech",
                    "Azure Speech",
                    "Enterprise speech synthesis for managed deployment environments.",
                    "speech",
                    audio_capabilities(&["15s", "30s", "60s", "120s"]),
                )],
            ),
        ],
        style_options: Vec::new(),
    }
}

fn sfx_catalog(target: &str) -> CreationCapabilitiesRecord {
    let duration_options = &["3s", "5s", "10s", "15s", "20s"];

    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![
            channel(
                "ELEVENLABS",
                "ElevenLabs",
                vec![model(
                    "ELEVENLABS",
                    "eleven-labs-sfx",
                    "ElevenLabs SFX",
                    "Premium sound-effect generation catalog entry for polished production-oriented design passes.",
                    "sfx",
                    audio_capabilities(duration_options),
                )],
            ),
            channel(
                "OPENSOURCE",
                "Open Source",
                vec![
                    model(
                        "OPENSOURCE",
                        "audioldm-2",
                        "AudioLDM 2",
                        "Open source sound-effect baseline for rapid ideation and controllable audio experimentation.",
                        "sfx",
                        audio_capabilities(duration_options),
                    ),
                    model(
                        "OPENSOURCE",
                        "tango",
                        "Tango",
                        "Lightweight open sound-effect model for iteration-heavy workflows and self-hosted exploration.",
                        "sfx",
                        audio_capabilities(duration_options),
                    ),
                ],
            ),
        ],
        style_options: Vec::new(),
    }
}

fn human_catalog(target: &str) -> CreationCapabilitiesRecord {
    let style_options = style_values(&[
        ("hero", "Hero"),
        ("anime", "Anime Character"),
        ("fantasy", "Fantasy"),
        ("custom", "Custom"),
    ]);

    CreationCapabilitiesRecord {
        target: target.to_string(),
        channels: vec![channel(
            "CHARACTER",
            "Character Studio",
            vec![
                model(
                    "CHARACTER",
                    "gemini-3-flash-image",
                    "Gemini Avatar",
                    "Fast concept model for character ideation and avatar iteration.",
                    "character",
                    CreationModelCapabilitiesRecord {
                        supports_multimodal: Some(true),
                        aspect_ratio_options: ratios(&["1:1", "3:4", "9:16"]),
                        resolution_options: resolutions(&[("1024", "1024"), ("2048", "2048")]),
                        style_options: style_options.clone(),
                        ..CreationModelCapabilitiesRecord::default()
                    },
                ),
                model(
                    "CHARACTER",
                    "midjourney-v6",
                    "Midjourney v6",
                    "High-fidelity character art with stylized presentation quality.",
                    "character",
                    CreationModelCapabilitiesRecord {
                        aspect_ratio_options: ratios(&["16:9", "1:1", "3:4", "9:16"]),
                        resolution_options: resolutions(&[
                            ("1024", "1024"),
                            ("2048", "2048"),
                            ("4096", "4096"),
                        ]),
                        style_options: style_options.clone(),
                        ..CreationModelCapabilitiesRecord::default()
                    },
                ),
                model(
                    "CHARACTER",
                    "stable-diffusion-xl",
                    "SDXL Character",
                    "Consistent style baseline for iterative avatar generation.",
                    "character",
                    CreationModelCapabilitiesRecord {
                        aspect_ratio_options: ratios(&["1:1", "3:4", "9:16"]),
                        resolution_options: resolutions(&[("1024", "1024"), ("2048", "2048")]),
                        style_options: style_options.clone(),
                        ..CreationModelCapabilitiesRecord::default()
                    },
                ),
            ],
        )],
        style_options: human_styles(),
    }
}
