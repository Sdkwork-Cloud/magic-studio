use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::de::Deserializer;
use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

const CHAT_SCHEMA_VERSION: &str = "magic-studio.chat.v1";
const DEFAULT_CHAT_PAGE_SIZE: usize = 50;
const MAX_CHAT_PAGE_SIZE: usize = 200;
const DEFAULT_CHAT_TITLE: &str = "New Chat";
const DEFAULT_CHAT_MODEL_ID: &str = "gpt-4o";

static CHAT_SESSION_COUNTER: AtomicU64 = AtomicU64::new(1);
static CHAT_MESSAGE_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ChatRoleRecord {
    User,
    Ai,
    System,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ChatMessageStatusRecord {
    Sending,
    Streaming,
    Completed,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ChatTimestampRecord {
    IsoString(String),
    Integer(i64),
    Float(f64),
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageMetadataRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tokens: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub latency: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub plugin_used: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub uuid: String,
    pub role: ChatRoleRecord,
    pub content: String,
    pub timestamp: ChatTimestampRecord,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<ChatMessageStatusRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ChatMessageMetadataRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatSessionRecord {
    pub id: String,
    pub uuid: String,
    pub title: String,
    pub model_id: String,
    pub is_archived: bool,
    pub pinned: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    pub message_count: usize,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatTranscriptRecord {
    pub id: String,
    pub uuid: String,
    pub session_id: String,
    pub messages: Vec<ChatMessageRecord>,
}

#[derive(Debug, Clone)]
pub struct ChatSessionListResult {
    pub items: Vec<ChatSessionRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChatSessionListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub keyword: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChatSessionCreateRequest {
    pub title: Option<String>,
    pub model_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChatSessionUpdateRequest {
    pub title: Option<String>,
    pub model_id: Option<String>,
    pub is_archived: Option<bool>,
    pub pinned: Option<bool>,
    #[serde(default, deserialize_with = "deserialize_chat_optional_text_update")]
    pub summary: ChatOptionalTextUpdate,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatTranscriptUpdateRequest {
    pub messages: Vec<ChatMessageRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatRegistryDocument {
    pub schema_version: String,
    pub sessions: Vec<ChatSessionRecord>,
}

#[derive(Debug, Clone, Default)]
pub enum ChatOptionalTextUpdate {
    #[default]
    Missing,
    Clear,
    Set(String),
}

pub trait ChatService: Send + Sync {
    fn list_sessions(&self, query: ChatSessionListQuery) -> ServerResult<ChatSessionListResult>;
    fn create_session(&self, input: ChatSessionCreateRequest) -> ServerResult<ChatSessionRecord>;
    fn read_session(&self, session_key: &str) -> ServerResult<ChatSessionRecord>;
    fn update_session(
        &self,
        session_key: &str,
        input: ChatSessionUpdateRequest,
    ) -> ServerResult<ChatSessionRecord>;
    fn delete_session(&self, session_key: &str) -> ServerResult<()>;
    fn read_transcript(&self, session_key: &str) -> ServerResult<ChatTranscriptRecord>;
    fn update_transcript(
        &self,
        session_key: &str,
        input: ChatTranscriptUpdateRequest,
    ) -> ServerResult<ChatTranscriptRecord>;
}

pub struct FileBackedChatService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedChatService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("APP_CHAT_LOCK_FAILED", "chat registry lock was poisoned")
        })
    }

    fn ensure_chat_dirs(&self) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.chat_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_CHAT_ROOT_CREATE_FAILED",
                format!(
                    "failed to create chat storage root {}: {error}",
                    self.storage_paths.chat_root_dir().display()
                ),
            )
        })?;
        fs::create_dir_all(self.storage_paths.chat_transcripts_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_CHAT_TRANSCRIPTS_DIR_CREATE_FAILED",
                format!(
                    "failed to create chat transcript storage root {}: {error}",
                    self.storage_paths.chat_transcripts_root_dir().display()
                ),
            )
        })
    }

    fn default_document(&self) -> ChatRegistryDocument {
        ChatRegistryDocument {
            schema_version: CHAT_SCHEMA_VERSION.to_string(),
            sessions: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<ChatRegistryDocument> {
        let path = self.storage_paths.chat_sessions_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_CHAT_SESSIONS_READ_FAILED",
                    format!(
                        "failed to read chat session registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<ChatRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_CHAT_SESSIONS_PARSE_FAILED",
                    format!(
                        "failed to parse chat session registry {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &ChatRegistryDocument) -> ServerResult<()> {
        self.ensure_chat_dirs()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_CHAT_SESSIONS_SERIALIZE_FAILED",
                format!("failed to serialize chat session registry: {error}"),
            )
        })?;
        fs::write(self.storage_paths.chat_sessions_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_CHAT_SESSIONS_WRITE_FAILED",
                format!(
                    "failed to write chat session registry to {}: {error}",
                    self.storage_paths.chat_sessions_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut ChatRegistryDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = CHAT_SCHEMA_VERSION.to_string();
        }

        for session in &mut document.sessions {
            session.uuid = normalize_optional_text(Some(session.uuid.clone()))
                .unwrap_or_else(|| to_client_entity_uuid(&session.id));
            session.title = normalize_optional_text(Some(session.title.clone()))
                .unwrap_or_else(|| DEFAULT_CHAT_TITLE.to_string());
            session.model_id = normalize_optional_text(Some(session.model_id.clone()))
                .unwrap_or_else(|| DEFAULT_CHAT_MODEL_ID.to_string());
            session.summary = normalize_optional_text(session.summary.clone());
            session.deleted_at = normalize_optional_text(session.deleted_at.clone());
        }

        sort_sessions(&mut document.sessions);
    }

    fn find_session_mut<'a>(
        &self,
        document: &'a mut ChatRegistryDocument,
        session_key: &str,
    ) -> ServerResult<&'a mut ChatSessionRecord> {
        let normalized =
            require_non_empty_text(session_key, "APP_CHAT_SESSION_ID_EMPTY", "sessionId")?;

        document
            .sessions
            .iter_mut()
            .find(|session| session.id == normalized || session.uuid == normalized)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_CHAT_SESSION_NOT_FOUND",
                    format!("chat session {normalized} was not found"),
                )
            })
    }

    fn find_session<'a>(
        &self,
        document: &'a ChatRegistryDocument,
        session_key: &str,
    ) -> ServerResult<&'a ChatSessionRecord> {
        let normalized =
            require_non_empty_text(session_key, "APP_CHAT_SESSION_ID_EMPTY", "sessionId")?;

        document
            .sessions
            .iter()
            .find(|session| session.id == normalized || session.uuid == normalized)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_CHAT_SESSION_NOT_FOUND",
                    format!("chat session {normalized} was not found"),
                )
            })
    }

    fn transcript_identity(&self, session_id: &str) -> (String, String) {
        let transcript_id = format!("chat-transcript-{session_id}");
        let transcript_uuid = to_client_entity_uuid(&transcript_id);
        (transcript_id, transcript_uuid)
    }

    fn transcript_path(&self, session_id: &str) -> std::path::PathBuf {
        self.storage_paths
            .chat_transcripts_root_dir()
            .join(format!("{session_id}.json"))
    }

    fn default_transcript(&self, session: &ChatSessionRecord) -> ChatTranscriptRecord {
        let (transcript_id, transcript_uuid) = self.transcript_identity(&session.id);
        ChatTranscriptRecord {
            id: transcript_id,
            uuid: transcript_uuid,
            session_id: session.id.clone(),
            messages: Vec::new(),
        }
    }

    fn read_transcript_from_disk(
        &self,
        session: &ChatSessionRecord,
    ) -> ServerResult<ChatTranscriptRecord> {
        let path = self.transcript_path(&session.id);
        let contents = match fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_transcript(session))
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_CHAT_TRANSCRIPT_READ_FAILED",
                    format!(
                        "failed to read chat transcript from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut transcript =
            serde_json::from_str::<ChatTranscriptRecord>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_CHAT_TRANSCRIPT_PARSE_FAILED",
                    format!(
                        "failed to parse chat transcript {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_transcript(session, &mut transcript);
        Ok(transcript)
    }

    fn persist_transcript_to_disk(&self, transcript: &ChatTranscriptRecord) -> ServerResult<()> {
        self.ensure_chat_dirs()?;
        let contents = serde_json::to_vec_pretty(transcript).map_err(|error| {
            ServerError::internal(
                "APP_CHAT_TRANSCRIPT_SERIALIZE_FAILED",
                format!("failed to serialize chat transcript: {error}"),
            )
        })?;
        let path = self.transcript_path(&transcript.session_id);
        fs::write(&path, contents).map_err(|error| {
            ServerError::internal(
                "APP_CHAT_TRANSCRIPT_WRITE_FAILED",
                format!(
                    "failed to write chat transcript to {}: {error}",
                    path.display()
                ),
            )
        })
    }

    fn normalize_transcript(
        &self,
        session: &ChatSessionRecord,
        transcript: &mut ChatTranscriptRecord,
    ) {
        let (transcript_id, transcript_uuid) = self.transcript_identity(&session.id);
        transcript.id =
            normalize_optional_text(Some(transcript.id.clone())).unwrap_or(transcript_id);
        transcript.uuid =
            normalize_optional_text(Some(transcript.uuid.clone())).unwrap_or(transcript_uuid);
        transcript.session_id = session.id.clone();
        transcript.messages = transcript
            .messages
            .clone()
            .into_iter()
            .map(normalize_message)
            .collect();
    }
}

impl ChatService for FileBackedChatService {
    fn list_sessions(&self, query: ChatSessionListQuery) -> ServerResult<ChatSessionListResult> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query
            .page_size
            .unwrap_or(DEFAULT_CHAT_PAGE_SIZE)
            .clamp(1, MAX_CHAT_PAGE_SIZE);
        let keyword = normalize_optional_text(query.keyword).map(|value| value.to_lowercase());

        let filtered = document
            .sessions
            .into_iter()
            .filter(|session| session.deleted_at.is_none())
            .filter(|session| {
                keyword
                    .as_ref()
                    .map(|keyword| {
                        session.title.to_lowercase().contains(keyword)
                            || session
                                .summary
                                .as_deref()
                                .map(|summary| summary.to_lowercase().contains(keyword))
                                .unwrap_or(false)
                    })
                    .unwrap_or(true)
            })
            .collect::<Vec<_>>();

        let total = filtered.len();
        let start = (page - 1) * page_size;
        let items = filtered
            .into_iter()
            .skip(start)
            .take(page_size)
            .collect::<Vec<_>>();

        Ok(ChatSessionListResult {
            items,
            page,
            page_size,
            total,
        })
    }

    fn create_session(&self, input: ChatSessionCreateRequest) -> ServerResult<ChatSessionRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();
        let session_id = next_entity_id("chat-session", &CHAT_SESSION_COUNTER);
        let session = ChatSessionRecord {
            id: session_id.clone(),
            uuid: to_client_entity_uuid(&session_id),
            title: normalize_optional_text(input.title)
                .unwrap_or_else(|| DEFAULT_CHAT_TITLE.to_string()),
            model_id: normalize_optional_text(input.model_id)
                .unwrap_or_else(|| DEFAULT_CHAT_MODEL_ID.to_string()),
            is_archived: false,
            pinned: false,
            summary: None,
            message_count: 0,
            created_at: now.clone(),
            updated_at: now,
            deleted_at: None,
        };

        document.sessions.push(session.clone());
        sort_sessions(&mut document.sessions);
        self.persist_to_disk(&document)?;
        let transcript = self.default_transcript(&session);
        self.persist_transcript_to_disk(&transcript)?;
        Ok(session)
    }

    fn read_session(&self, session_key: &str) -> ServerResult<ChatSessionRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.find_session(&document, session_key)?.clone())
    }

    fn update_session(
        &self,
        session_key: &str,
        input: ChatSessionUpdateRequest,
    ) -> ServerResult<ChatSessionRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let session = self.find_session_mut(&mut document, session_key)?;

        if let Some(title) = input.title {
            session.title = normalize_optional_text(Some(title))
                .unwrap_or_else(|| DEFAULT_CHAT_TITLE.to_string());
        }

        if let Some(model_id) = input.model_id {
            session.model_id = normalize_optional_text(Some(model_id))
                .unwrap_or_else(|| DEFAULT_CHAT_MODEL_ID.to_string());
        }

        if let Some(is_archived) = input.is_archived {
            session.is_archived = is_archived;
        }

        if let Some(pinned) = input.pinned {
            session.pinned = pinned;
        }

        match input.summary {
            ChatOptionalTextUpdate::Missing => {}
            ChatOptionalTextUpdate::Clear => {
                session.summary = None;
            }
            ChatOptionalTextUpdate::Set(summary) => {
                session.summary = normalize_optional_text(Some(summary));
            }
        }

        session.updated_at = current_timestamp();
        let updated = session.clone();
        sort_sessions(&mut document.sessions);
        self.persist_to_disk(&document)?;
        Ok(updated)
    }

    fn delete_session(&self, session_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let session_id = self.find_session(&document, session_key)?.id.clone();
        let before_len = document.sessions.len();
        document.sessions.retain(|session| session.id != session_id);

        if document.sessions.len() == before_len {
            return Err(ServerError::not_found(
                "APP_CHAT_SESSION_NOT_FOUND",
                format!("chat session {session_key} was not found"),
            ));
        }

        self.persist_to_disk(&document)?;
        let transcript_path = self.transcript_path(&session_id);
        match fs::remove_file(&transcript_path) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_CHAT_TRANSCRIPT_DELETE_FAILED",
                    format!(
                        "failed to delete chat transcript {}: {error}",
                        transcript_path.display()
                    ),
                ));
            }
        }

        Ok(())
    }

    fn read_transcript(&self, session_key: &str) -> ServerResult<ChatTranscriptRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let session = self.find_session(&document, session_key)?;
        self.read_transcript_from_disk(session)
    }

    fn update_transcript(
        &self,
        session_key: &str,
        input: ChatTranscriptUpdateRequest,
    ) -> ServerResult<ChatTranscriptRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let session = self.find_session_mut(&mut document, session_key)?;
        let messages = input
            .messages
            .into_iter()
            .map(normalize_message)
            .collect::<Vec<_>>();
        let transcript = ChatTranscriptRecord {
            id: self.transcript_identity(&session.id).0,
            uuid: self.transcript_identity(&session.id).1,
            session_id: session.id.clone(),
            messages,
        };

        session.message_count = transcript.messages.len();
        session.updated_at = current_timestamp();
        let updated_transcript = transcript.clone();
        sort_sessions(&mut document.sessions);
        self.persist_to_disk(&document)?;
        self.persist_transcript_to_disk(&updated_transcript)?;
        Ok(updated_transcript)
    }
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

fn deserialize_chat_optional_text_update<'de, D>(
    deserializer: D,
) -> Result<ChatOptionalTextUpdate, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<String>::deserialize(deserializer)? {
        Some(value) => Ok(ChatOptionalTextUpdate::Set(value)),
        None => Ok(ChatOptionalTextUpdate::Clear),
    }
}

fn normalize_message(message: ChatMessageRecord) -> ChatMessageRecord {
    let id = normalize_optional_text(message.id.clone());
    let normalized_id = id.unwrap_or_else(|| next_entity_id("chat-message", &CHAT_MESSAGE_COUNTER));
    let uuid = normalize_optional_text(Some(message.uuid))
        .unwrap_or_else(|| to_client_entity_uuid(&normalized_id));

    ChatMessageRecord {
        id: Some(normalized_id),
        uuid,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        model: normalize_optional_text(message.model),
        status: message.status,
        error: normalize_optional_text(message.error),
        metadata: normalize_message_metadata(message.metadata),
    }
}

fn normalize_message_metadata(
    metadata: Option<ChatMessageMetadataRecord>,
) -> Option<ChatMessageMetadataRecord> {
    metadata.and_then(|metadata| {
        let normalized = ChatMessageMetadataRecord {
            tokens: metadata.tokens,
            latency: metadata.latency,
            plugin_used: normalize_optional_text(metadata.plugin_used),
        };

        if normalized.tokens.is_none()
            && normalized.latency.is_none()
            && normalized.plugin_used.is_none()
        {
            None
        } else {
            Some(normalized)
        }
    })
}

fn sort_sessions(sessions: &mut [ChatSessionRecord]) {
    sessions.sort_by(|left, right| {
        right
            .pinned
            .cmp(&left.pinned)
            .then_with(|| right.updated_at.cmp(&left.updated_at))
            .then_with(|| left.title.to_lowercase().cmp(&right.title.to_lowercase()))
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn next_entity_id(prefix: &str, counter: &AtomicU64) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = counter.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}

fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}
