use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::contract::embedded_server_contract;
use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::assets::{
    AssetBusinessDomain, AssetContentKey, AssetListQuery, AssetService, UnifiedDigitalAssetRecord,
};
use super::execution::{AudioExecutionService, SpeechExecutionRequest};
use super::generation::{
    GenerationArtifactRecord, GenerationProduct, GenerationTaskPage, GenerationTaskRecord,
    GenerationTaskStatus, MediaInputRefRecord,
};
use super::identity::{IdentityService, UserGenerationHistoryUpsert};

const VOICES_SCHEMA_VERSION: &str = "magic-studio.voices.v1";
const DEFAULT_PAGE_SIZE: usize = 50;
const MAX_PAGE_SIZE: usize = 200;
const SPEECH_PROVIDER_NOT_CONFIGURED_CODE: &str = "APP_VOICE_PROVIDER_NOT_CONFIGURED";
const SPEECH_PROVIDER_NOT_CONFIGURED_MESSAGE: &str =
    "Magic Studio canonical voice synthesis execution is not configured yet. The canonical voice API, speaker registry, clone tasks, and speech task lifecycle are ready, but provider execution still needs a standardized backend adapter.";
const CLONE_PROVIDER_NOT_CONFIGURED_CODE: &str = "APP_VOICE_CLONE_PROVIDER_NOT_CONFIGURED";
const CLONE_PROVIDER_NOT_CONFIGURED_MESSAGE: &str =
    "Magic Studio canonical voice clone execution is not configured yet. The canonical clone-task API and registry are ready, but provider execution still needs a standardized backend adapter.";
const MARKET_VOICE_TIMESTAMP: &str = "2026-01-01T00:00:00Z";
const APP_VOICES_READ_SPEECH_TASK_ROUTE_ID: &str = "appVoicesReadSpeechTask";

static VOICE_SPEAKER_COUNTER: AtomicU64 = AtomicU64::new(1);
static VOICE_CLONE_TASK_COUNTER: AtomicU64 = AtomicU64::new(1);
static VOICE_SPEECH_TASK_COUNTER: AtomicU64 = AtomicU64::new(1);
static VOICE_ARTIFACT_COUNTER: AtomicU64 = AtomicU64::new(1);
static VOICE_INPUT_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VoiceSpeakerSource {
    Market,
    Workspace,
    Custom,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VoiceSpeakerConfigRecord {
    pub speed: Option<f64>,
    pub pitch: Option<f64>,
    pub stability: Option<f64>,
    pub similarity_boost: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceSpeakerRecord {
    pub id: String,
    pub uuid: String,
    pub source: VoiceSpeakerSource,
    pub name: String,
    pub gender: String,
    pub style: String,
    pub language: String,
    pub provider: String,
    pub provider_voice_id: Option<String>,
    pub preview_url: Option<String>,
    pub preview_text: Option<String>,
    pub avatar_url: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub reference_audio: Option<MediaInputRefRecord>,
    pub config: Option<VoiceSpeakerConfigRecord>,
    pub is_favorite: Option<bool>,
    pub metadata: Option<Map<String, Value>>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCloneTaskRecord {
    pub id: String,
    pub uuid: String,
    pub task_id: String,
    pub speaker_id: String,
    pub speaker_name: Option<String>,
    pub status: GenerationTaskStatus,
    pub language: String,
    pub model: Option<String>,
    pub provider: String,
    pub remote_job_id: Option<String>,
    pub progress: Option<f64>,
    pub idempotency_key: Option<String>,
    pub sample_audio: Option<MediaInputRefRecord>,
    pub sample_audio_url: Option<String>,
    pub preview_text: Option<String>,
    pub preview_audio_url: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub provider_payload: Option<Map<String, Value>>,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub cancelled_at: Option<String>,
}

#[derive(Debug, Clone)]
pub struct VoiceSpeakerPage {
    pub items: Vec<VoiceSpeakerRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone)]
pub struct VoiceCloneTaskPage {
    pub items: Vec<VoiceCloneTaskRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct VoiceListQuery {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub keyword: Option<String>,
    pub source: Option<String>,
    pub language: Option<String>,
    pub gender: Option<String>,
    pub style: Option<String>,
    pub provider: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomVoiceCreateRequest {
    pub name: String,
    pub gender: String,
    pub style: String,
    pub language: String,
    pub provider: Option<String>,
    pub provider_voice_id: Option<String>,
    pub preview_url: Option<String>,
    pub preview_text: Option<String>,
    pub avatar_url: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub reference_audio: Option<MediaInputRefRecord>,
    pub config: Option<VoiceSpeakerConfigRecord>,
    pub is_favorite: Option<bool>,
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CustomVoiceUpdateRequest {
    pub name: Option<String>,
    pub gender: Option<String>,
    pub style: Option<String>,
    pub language: Option<String>,
    pub provider: Option<String>,
    pub provider_voice_id: Option<String>,
    pub preview_url: Option<String>,
    pub preview_text: Option<String>,
    pub avatar_url: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub reference_audio: Option<MediaInputRefRecord>,
    pub config: Option<VoiceSpeakerConfigRecord>,
    pub is_favorite: Option<bool>,
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCloneTaskCreateRequest {
    pub speaker_id: String,
    pub sample_audio: Option<MediaInputRefRecord>,
    pub sample_audio_url: Option<String>,
    pub language: String,
    pub model: Option<String>,
    pub idempotency_key: Option<String>,
    pub preview_text: Option<String>,
    pub auto_update_preview: Option<bool>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VoiceCloneTaskListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub status: Option<String>,
    pub speaker_id: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VoicePreviewUpdateRequest {
    pub preview_text: Option<String>,
    pub preview_audio_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceSpeechTaskCreateRequest {
    pub speaker_id: String,
    pub text: String,
    pub model: Option<String>,
    pub speed: Option<f64>,
    pub pitch: Option<f64>,
    pub stability: Option<f64>,
    pub similarity_boost: Option<f64>,
    pub format: Option<String>,
    pub language: Option<String>,
    pub voice_id: Option<String>,
    pub avatar_url: Option<String>,
    pub description: Option<String>,
    pub mode: Option<String>,
    pub input_method: Option<String>,
    pub reference_audio: Option<MediaInputRefRecord>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VoiceSpeechTaskListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub status: Option<String>,
    pub speaker_id: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct VoiceSpeechTaskUpdateRequest {
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceSpeechTaskUpsertRequest {
    pub id: Option<String>,
    pub uuid: Option<String>,
    pub text: String,
    pub speaker_id: String,
    pub speaker_name: Option<String>,
    pub status: Option<String>,
    pub provider: Option<String>,
    pub provider_model: Option<String>,
    pub remote_job_id: Option<String>,
    pub progress: Option<f64>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub language: Option<String>,
    pub format: Option<String>,
    pub voice_id: Option<String>,
    pub avatar_url: Option<String>,
    pub description: Option<String>,
    pub mode: Option<String>,
    pub input_method: Option<String>,
    pub speed: Option<f64>,
    pub pitch: Option<f64>,
    pub stability: Option<f64>,
    pub similarity_boost: Option<f64>,
    pub is_favorite: Option<bool>,
    pub reference_audio: Option<MediaInputRefRecord>,
    pub artifacts: Option<Vec<GenerationArtifactRecord>>,
    pub primary_artifact: Option<GenerationArtifactRecord>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub completed_at: Option<String>,
    pub cancelled_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VoiceRegistryDocument {
    pub schema_version: String,
    pub custom_voices: Vec<VoiceSpeakerRecord>,
    pub clone_tasks: Vec<VoiceCloneTaskRecord>,
    pub speech_tasks: Vec<GenerationTaskRecord>,
}

pub trait VoiceService: Send + Sync {
    fn list_market_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage>;
    fn list_workspace_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage>;
    fn list_custom_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage>;
    fn read_voice_speaker(&self, speaker_id: &str) -> ServerResult<VoiceSpeakerRecord>;
    fn create_custom_voice(
        &self,
        input: CustomVoiceCreateRequest,
    ) -> ServerResult<VoiceSpeakerRecord>;
    fn update_custom_voice(
        &self,
        speaker_id: &str,
        input: CustomVoiceUpdateRequest,
    ) -> ServerResult<VoiceSpeakerRecord>;
    fn delete_custom_voice(&self, speaker_id: &str) -> ServerResult<bool>;
    fn create_clone_task(
        &self,
        input: VoiceCloneTaskCreateRequest,
    ) -> ServerResult<VoiceCloneTaskRecord>;
    fn list_clone_tasks(&self, query: VoiceCloneTaskListQuery) -> ServerResult<VoiceCloneTaskPage>;
    fn read_clone_task(&self, task_id: &str) -> ServerResult<VoiceCloneTaskRecord>;
    fn delete_clone_task(&self, task_id: &str) -> ServerResult<bool>;
    fn cancel_clone_task(&self, task_id: &str) -> ServerResult<VoiceCloneTaskRecord>;
    fn update_voice_preview(
        &self,
        speaker_id: &str,
        input: VoicePreviewUpdateRequest,
    ) -> ServerResult<VoiceSpeakerRecord>;
    fn list_speech_tasks(
        &self,
        query: VoiceSpeechTaskListQuery,
    ) -> ServerResult<GenerationTaskPage>;
    fn list_history_speech_tasks(
        &self,
        status: Option<String>,
    ) -> ServerResult<Vec<GenerationTaskRecord>>;
    fn create_speech_task(
        &self,
        input: VoiceSpeechTaskCreateRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn read_speech_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn update_speech_task(
        &self,
        task_id: &str,
        input: VoiceSpeechTaskUpdateRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn upsert_speech_task(
        &self,
        task_id: &str,
        input: VoiceSpeechTaskUpsertRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn delete_speech_task(&self, task_id: &str) -> ServerResult<bool>;
    fn cancel_speech_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
}

pub struct FileBackedVoiceService {
    storage_paths: AppStoragePaths,
    asset_service: Arc<dyn AssetService>,
    identity_service: Arc<dyn IdentityService>,
    audio_execution_service: Arc<dyn AudioExecutionService>,
    lock: Mutex<()>,
}

impl FileBackedVoiceService {
    pub fn new(
        storage_paths: AppStoragePaths,
        asset_service: Arc<dyn AssetService>,
        identity_service: Arc<dyn IdentityService>,
        audio_execution_service: Arc<dyn AudioExecutionService>,
    ) -> Self {
        Self {
            storage_paths,
            asset_service,
            identity_service,
            audio_execution_service,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_VOICES_LOCK_POISONED",
                "voice registry lock was poisoned",
            )
        })
    }

    fn default_document(&self) -> VoiceRegistryDocument {
        VoiceRegistryDocument {
            schema_version: VOICES_SCHEMA_VERSION.to_string(),
            custom_voices: Vec::new(),
            clone_tasks: Vec::new(),
            speech_tasks: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<VoiceRegistryDocument> {
        self.storage_paths.ensure_root_dir()?;
        let registry_file = self.storage_paths.voices_registry_file();
        if !registry_file.exists() {
            return Ok(self.default_document());
        }

        let contents = fs::read_to_string(registry_file).map_err(|error| {
            ServerError::internal(
                "APP_VOICES_READ_FAILED",
                format!(
                    "failed to read voice registry {}: {error}",
                    registry_file.display()
                ),
            )
        })?;

        let mut document =
            serde_json::from_str::<VoiceRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_VOICES_PARSE_FAILED",
                    format!(
                        "failed to parse voice registry {}: {error}",
                        registry_file.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &VoiceRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let registry_file = self.storage_paths.voices_registry_file();
        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_VOICES_SERIALIZE_FAILED",
                format!("failed to serialize voice registry: {error}"),
            )
        })?;
        fs::write(registry_file, contents).map_err(|error| {
            ServerError::internal(
                "APP_VOICES_WRITE_FAILED",
                format!(
                    "failed to write voice registry {}: {error}",
                    registry_file.display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut VoiceRegistryDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = VOICES_SCHEMA_VERSION.to_string();
        }

        for voice in &mut document.custom_voices {
            normalize_voice_record(voice, VoiceSpeakerSource::Custom);
        }

        for task in &mut document.clone_tasks {
            normalize_clone_task_record(task);
        }

        sort_voices(&mut document.custom_voices);
        sort_clone_tasks(&mut document.clone_tasks);
        sort_speech_tasks(&mut document.speech_tasks);
    }

    fn resolve_market_voices(&self) -> Vec<VoiceSpeakerRecord> {
        vec![
            market_voice("Puck", "Puck", "male", "neutral", "en-US", "Google Gemini"),
            market_voice("Charon", "Charon", "male", "news", "en-US", "Google Gemini"),
            market_voice(
                "Kore",
                "Kore",
                "female",
                "expressive",
                "en-US",
                "Google Gemini",
            ),
            market_voice(
                "Fenrir",
                "Fenrir",
                "male",
                "story",
                "en-US",
                "Google Gemini",
            ),
            market_voice(
                "Aoede",
                "Aoede",
                "female",
                "neutral",
                "en-US",
                "Google Gemini",
            ),
            market_voice(
                "Zephyr",
                "Zephyr",
                "female",
                "whisper",
                "en-US",
                "Google Gemini",
            ),
        ]
    }

    fn resolve_workspace_voices(&self) -> ServerResult<Vec<VoiceSpeakerRecord>> {
        let assets = self.asset_service.list_assets(AssetListQuery {
            page: Some(0),
            size: Some(500),
            keyword: None,
            sort: None,
            workspace_id: None,
            project_id: None,
            collection_id: None,
            domain: Some(AssetBusinessDomain::VoiceSpeaker),
            types: Some(vec![AssetContentKey::Voice, AssetContentKey::Audio]),
            origins: None,
            tags: None,
            status: None,
            include_deleted: None,
            is_favorite: None,
            reference_entity_type: None,
            reference_entity_id: None,
            reference_relation: None,
        })?;

        Ok(assets
            .items
            .into_iter()
            .map(map_workspace_voice_from_asset)
            .collect())
    }

    fn read_custom_voice_from_document<'a>(
        &self,
        document: &'a VoiceRegistryDocument,
        speaker_id: &str,
    ) -> Option<&'a VoiceSpeakerRecord> {
        document
            .custom_voices
            .iter()
            .find(|voice| matches_speaker_key(voice, speaker_id))
    }

    fn read_custom_voice_mut_from_document<'a>(
        &self,
        document: &'a mut VoiceRegistryDocument,
        speaker_id: &str,
    ) -> Option<&'a mut VoiceSpeakerRecord> {
        document
            .custom_voices
            .iter_mut()
            .find(|voice| matches_speaker_key(voice, speaker_id))
    }

    fn read_clone_task_from_document<'a>(
        &self,
        document: &'a VoiceRegistryDocument,
        task_id: &str,
    ) -> Option<&'a VoiceCloneTaskRecord> {
        document
            .clone_tasks
            .iter()
            .find(|task| matches_clone_task_key(task, task_id))
    }

    fn read_clone_task_mut_from_document<'a>(
        &self,
        document: &'a mut VoiceRegistryDocument,
        task_id: &str,
    ) -> Option<&'a mut VoiceCloneTaskRecord> {
        document
            .clone_tasks
            .iter_mut()
            .find(|task| matches_clone_task_key(task, task_id))
    }

    fn read_speech_task_from_document<'a>(
        &self,
        document: &'a VoiceRegistryDocument,
        task_id: &str,
    ) -> Option<&'a GenerationTaskRecord> {
        document
            .speech_tasks
            .iter()
            .find(|task| matches_generation_task_key(task, task_id))
    }

    fn read_speech_task_mut_from_document<'a>(
        &self,
        document: &'a mut VoiceRegistryDocument,
        task_id: &str,
    ) -> Option<&'a mut GenerationTaskRecord> {
        document
            .speech_tasks
            .iter_mut()
            .find(|task| matches_generation_task_key(task, task_id))
    }

    fn paginate_voices(
        &self,
        voices: Vec<VoiceSpeakerRecord>,
        page: usize,
        page_size: usize,
    ) -> VoiceSpeakerPage {
        let total = voices.len();
        let start = (page - 1).saturating_mul(page_size);
        let items = voices.into_iter().skip(start).take(page_size).collect();

        VoiceSpeakerPage {
            items,
            page,
            page_size,
            total,
        }
    }

    fn filtered_voice_page(
        &self,
        voices: Vec<VoiceSpeakerRecord>,
        query: VoiceListQuery,
    ) -> VoiceSpeakerPage {
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.size);
        let filtered = voices
            .into_iter()
            .filter(|voice| matches_voice_query(voice, &query))
            .collect();

        self.paginate_voices(filtered, page, page_size)
    }

    fn create_speech_task_record(
        &self,
        speaker: &VoiceSpeakerRecord,
        input: VoiceSpeechTaskCreateRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let task_id = next_entity_id("voice-speech-task", &VOICE_SPEECH_TASK_COUNTER);
        let prompt = require_non_empty_text(&input.text, "APP_VOICE_SPEECH_TEXT_EMPTY", "text")?;
        let now = current_timestamp();
        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("canonical-host-foundation".to_string()),
        );
        provider_payload.insert(
            "failureReason".to_string(),
            Value::String("provider_not_configured".to_string()),
        );
        provider_payload.insert(
            "speakerSource".to_string(),
            Value::String(speaker_source_label(speaker.source).to_string()),
        );

        let input_refs = input
            .reference_audio
            .into_iter()
            .map(|reference| {
                let mut normalized = self.normalize_input_ref(reference);
                normalized.role = "reference".to_string();
                if normalized.r#type == "file" {
                    normalized.r#type = "audio".to_string();
                }
                normalized
            })
            .collect::<Vec<_>>();

        let parameters = json_map(vec![
            Some(("speakerId".to_string(), Value::String(speaker.id.clone()))),
            Some((
                "speakerName".to_string(),
                Value::String(speaker.name.clone()),
            )),
            optional_json_string(
                "voiceId",
                input.voice_id.or_else(|| Some(speaker.id.clone())),
            ),
            optional_json_string(
                "avatarUrl",
                input.avatar_url.or_else(|| speaker.avatar_url.clone()),
            ),
            optional_json_string("description", input.description),
            optional_json_string("mode", input.mode),
            optional_json_string("inputMethod", input.input_method),
            optional_json_string(
                "language",
                input.language.or_else(|| Some(speaker.language.clone())),
            ),
            optional_json_string("format", input.format),
            optional_json_number("speed", input.speed),
            optional_json_number("pitch", input.pitch),
            optional_json_number("stability", input.stability),
            optional_json_number("similarityBoost", input.similarity_boost),
            optional_json_bool("isFavorite", Some(false)),
        ]);

        Ok(GenerationTaskRecord {
            id: task_id.clone(),
            uuid: to_client_entity_uuid(&task_id),
            task_id,
            product: GenerationProduct::Speech,
            mode: "text-to-speech".to_string(),
            status: GenerationTaskStatus::Failed,
            prompt: Some(prompt),
            negative_prompt: None,
            provider: "magic-studio-server".to_string(),
            provider_model: input
                .model
                .and_then(normalize_optional_text)
                .unwrap_or_else(|| "unconfigured".to_string()),
            remote_job_id: None,
            progress: Some(0.0),
            error_code: Some(SPEECH_PROVIDER_NOT_CONFIGURED_CODE.to_string()),
            error_message: Some(SPEECH_PROVIDER_NOT_CONFIGURED_MESSAGE.to_string()),
            input_refs,
            artifacts: Vec::new(),
            primary_artifact: None,
            parameters,
            provider_payload: Some(provider_payload),
            created_at: now.clone(),
            updated_at: now.clone(),
            completed_at: Some(now),
            cancelled_at: None,
        })
    }

    fn create_clone_task_record(
        &self,
        speaker: &VoiceSpeakerRecord,
        input: VoiceCloneTaskCreateRequest,
    ) -> ServerResult<VoiceCloneTaskRecord> {
        let task_id = next_entity_id("voice-clone-task", &VOICE_CLONE_TASK_COUNTER);
        let language =
            require_non_empty_text(&input.language, "APP_VOICE_LANGUAGE_EMPTY", "language")?;
        let now = current_timestamp();
        let sample_audio = input
            .sample_audio
            .map(|audio| self.normalize_input_ref(audio));
        let sample_audio_url = input
            .sample_audio_url
            .and_then(normalize_optional_text)
            .or_else(|| sample_audio.as_ref().and_then(|audio| audio.url.clone()));
        let preview_text = input.preview_text.and_then(normalize_optional_text);
        let auto_update_preview_requested = input.auto_update_preview.unwrap_or(true);

        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("canonical-host-foundation".to_string()),
        );
        provider_payload.insert(
            "failureReason".to_string(),
            Value::String("provider_not_configured".to_string()),
        );
        provider_payload.insert(
            "speakerSource".to_string(),
            Value::String(speaker_source_label(speaker.source).to_string()),
        );
        provider_payload.insert(
            "autoUpdatePreviewRequested".to_string(),
            Value::Bool(auto_update_preview_requested),
        );
        if let Some(sample_audio_url) = sample_audio_url.clone() {
            provider_payload.insert(
                "sampleAudioUrl".to_string(),
                Value::String(sample_audio_url),
            );
        }
        if let Some(preview_text) = preview_text.clone() {
            provider_payload.insert("previewText".to_string(), Value::String(preview_text));
        }

        Ok(VoiceCloneTaskRecord {
            id: task_id.clone(),
            uuid: to_client_entity_uuid(&task_id),
            task_id,
            speaker_id: speaker.id.clone(),
            speaker_name: Some(speaker.name.clone()),
            status: GenerationTaskStatus::Failed,
            language,
            model: input.model.and_then(normalize_optional_text),
            provider: "magic-studio-server".to_string(),
            remote_job_id: None,
            progress: Some(0.0),
            idempotency_key: input.idempotency_key.and_then(normalize_optional_text),
            sample_audio,
            sample_audio_url,
            preview_text,
            preview_audio_url: None,
            error_code: Some(CLONE_PROVIDER_NOT_CONFIGURED_CODE.to_string()),
            error_message: Some(CLONE_PROVIDER_NOT_CONFIGURED_MESSAGE.to_string()),
            provider_payload: Some(provider_payload),
            created_at: now.clone(),
            updated_at: now.clone(),
            completed_at: Some(now),
            cancelled_at: None,
        })
    }

    fn record_speech_history(&self, task: &GenerationTaskRecord) {
        let input = UserGenerationHistoryUpsert {
            task_id: task.task_id.clone(),
            category: "voice".to_string(),
            status: task_status_label(task.status).to_string(),
            prompt: task.prompt.clone(),
            cover_asset_id: task
                .primary_artifact
                .as_ref()
                .and_then(|artifact| artifact.asset_id.clone()),
            cover_url: task
                .primary_artifact
                .as_ref()
                .map(|artifact| artifact.url.clone()),
            result_count: Some(task.artifacts.len() as u32),
            completed_at: task.completed_at.clone(),
        };

        if let Err(error) = self.identity_service.record_user_generation_history(input) {
            if error.code != "APP_AUTH_SESSION_REQUIRED" {
                eprintln!(
                    "[magic-studio-server] failed to record voice history {}: {}",
                    task.task_id, error.message
                );
            }
        }
    }

    fn normalize_input_ref(&self, input: MediaInputRefRecord) -> MediaInputRefRecord {
        normalize_media_input_ref(input)
    }
}

impl VoiceService for FileBackedVoiceService {
    fn list_market_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage> {
        Ok(self.filtered_voice_page(self.resolve_market_voices(), query))
    }

    fn list_workspace_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage> {
        Ok(self.filtered_voice_page(self.resolve_workspace_voices()?, query))
    }

    fn list_custom_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.filtered_voice_page(document.custom_voices, query))
    }

    fn read_voice_speaker(&self, speaker_id: &str) -> ServerResult<VoiceSpeakerRecord> {
        let normalized_speaker_id =
            require_non_empty_text(speaker_id, "APP_VOICE_SPEAKER_ID_EMPTY", "speakerId")?;

        {
            let _guard = self.acquire_lock()?;
            let document = self.load_from_disk()?;
            if let Some(voice) =
                self.read_custom_voice_from_document(&document, &normalized_speaker_id)
            {
                return Ok(voice.clone());
            }
        }

        if let Some(voice) = self
            .resolve_workspace_voices()?
            .into_iter()
            .find(|voice| matches_speaker_key(voice, &normalized_speaker_id))
        {
            return Ok(voice);
        }

        self.resolve_market_voices()
            .into_iter()
            .find(|voice| matches_speaker_key(voice, &normalized_speaker_id))
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEAKER_NOT_FOUND",
                    format!("voice speaker {normalized_speaker_id} was not found"),
                )
            })
    }

    fn create_custom_voice(
        &self,
        input: CustomVoiceCreateRequest,
    ) -> ServerResult<VoiceSpeakerRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();
        let id = next_entity_id("voice-speaker", &VOICE_SPEAKER_COUNTER);
        let mut voice = VoiceSpeakerRecord {
            id: id.clone(),
            uuid: to_client_entity_uuid(&id),
            source: VoiceSpeakerSource::Custom,
            name: require_non_empty_text(&input.name, "APP_VOICE_NAME_EMPTY", "name")?,
            gender: require_non_empty_text(&input.gender, "APP_VOICE_GENDER_EMPTY", "gender")?,
            style: require_non_empty_text(&input.style, "APP_VOICE_STYLE_EMPTY", "style")?,
            language: require_non_empty_text(
                &input.language,
                "APP_VOICE_LANGUAGE_EMPTY",
                "language",
            )?,
            provider: input
                .provider
                .and_then(normalize_optional_text)
                .unwrap_or_else(|| "magic-studio-voice-lab".to_string()),
            provider_voice_id: input.provider_voice_id.and_then(normalize_optional_text),
            preview_url: input.preview_url.and_then(normalize_optional_text),
            preview_text: input.preview_text.and_then(normalize_optional_text),
            avatar_url: input.avatar_url.and_then(normalize_optional_text),
            description: input.description.and_then(normalize_optional_text),
            tags: normalize_string_list(input.tags).unwrap_or_default(),
            reference_audio: input
                .reference_audio
                .map(|audio| self.normalize_input_ref(audio)),
            config: input.config,
            is_favorite: input.is_favorite,
            metadata: normalize_json_map(input.metadata),
            created_at: now.clone(),
            updated_at: now,
        };
        normalize_voice_record(&mut voice, VoiceSpeakerSource::Custom);
        document.custom_voices.insert(0, voice.clone());
        sort_voices(&mut document.custom_voices);
        self.persist_to_disk(&document)?;
        Ok(voice)
    }

    fn update_custom_voice(
        &self,
        speaker_id: &str,
        input: CustomVoiceUpdateRequest,
    ) -> ServerResult<VoiceSpeakerRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_speaker_id =
            require_non_empty_text(speaker_id, "APP_VOICE_SPEAKER_ID_EMPTY", "speakerId")?;
        let now = current_timestamp();

        let voice = self
            .read_custom_voice_mut_from_document(&mut document, &normalized_speaker_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEAKER_NOT_FOUND",
                    format!("custom voice speaker {normalized_speaker_id} was not found"),
                )
            })?;

        if let Some(name) = input.name {
            voice.name = require_non_empty_text(&name, "APP_VOICE_NAME_EMPTY", "name")?;
        }
        if let Some(gender) = input.gender {
            voice.gender = require_non_empty_text(&gender, "APP_VOICE_GENDER_EMPTY", "gender")?;
        }
        if let Some(style) = input.style {
            voice.style = require_non_empty_text(&style, "APP_VOICE_STYLE_EMPTY", "style")?;
        }
        if let Some(language) = input.language {
            voice.language =
                require_non_empty_text(&language, "APP_VOICE_LANGUAGE_EMPTY", "language")?;
        }
        if let Some(provider) = input.provider {
            voice.provider =
                require_non_empty_text(&provider, "APP_VOICE_PROVIDER_EMPTY", "provider")?;
        }
        if let Some(provider_voice_id) = input.provider_voice_id {
            voice.provider_voice_id = normalize_optional_text(Some(provider_voice_id));
        }
        if let Some(preview_url) = input.preview_url {
            voice.preview_url = normalize_optional_text(Some(preview_url));
        }
        if let Some(preview_text) = input.preview_text {
            voice.preview_text = normalize_optional_text(Some(preview_text));
        }
        if let Some(avatar_url) = input.avatar_url {
            voice.avatar_url = normalize_optional_text(Some(avatar_url));
        }
        if let Some(description) = input.description {
            voice.description = normalize_optional_text(Some(description));
        }
        if let Some(tags) = input.tags {
            voice.tags = normalize_string_list(Some(tags)).unwrap_or_default();
        }
        if let Some(reference_audio) = input.reference_audio {
            voice.reference_audio = Some(self.normalize_input_ref(reference_audio));
        }
        if let Some(config) = input.config {
            voice.config = Some(config);
        }
        if let Some(is_favorite) = input.is_favorite {
            voice.is_favorite = Some(is_favorite);
        }
        if let Some(metadata) = input.metadata {
            voice.metadata = normalize_json_map(Some(metadata));
        }
        voice.updated_at = now;
        normalize_voice_record(voice, VoiceSpeakerSource::Custom);
        let record = voice.clone();
        sort_voices(&mut document.custom_voices);
        self.persist_to_disk(&document)?;
        Ok(record)
    }

    fn delete_custom_voice(&self, speaker_id: &str) -> ServerResult<bool> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_speaker_id =
            require_non_empty_text(speaker_id, "APP_VOICE_SPEAKER_ID_EMPTY", "speakerId")?;
        let index = document
            .custom_voices
            .iter()
            .position(|voice| matches_speaker_key(voice, &normalized_speaker_id))
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEAKER_NOT_FOUND",
                    format!("custom voice speaker {normalized_speaker_id} was not found"),
                )
            })?;

        document.custom_voices.remove(index);
        self.persist_to_disk(&document)?;
        Ok(true)
    }

    fn create_clone_task(
        &self,
        input: VoiceCloneTaskCreateRequest,
    ) -> ServerResult<VoiceCloneTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_speaker_id =
            require_non_empty_text(&input.speaker_id, "APP_VOICE_SPEAKER_ID_EMPTY", "speakerId")?;
        let voice = document
            .custom_voices
            .iter()
            .find(|voice| matches_speaker_key(voice, &normalized_speaker_id))
            .cloned()
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEAKER_NOT_FOUND",
                    format!("custom voice speaker {normalized_speaker_id} was not found"),
                )
            })?;
        let task = self.create_clone_task_record(&voice, input)?;

        document.clone_tasks.insert(0, task.clone());
        sort_clone_tasks(&mut document.clone_tasks);
        self.persist_to_disk(&document)?;
        Ok(task)
    }

    fn read_clone_task(&self, task_id: &str) -> ServerResult<VoiceCloneTaskRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_CLONE_TASK_ID_EMPTY", "taskId")?;

        self.read_clone_task_from_document(&document, &normalized_task_id)
            .cloned()
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_CLONE_TASK_NOT_FOUND",
                    format!("voice clone task {normalized_task_id} was not found"),
                )
            })
    }

    fn list_clone_tasks(&self, query: VoiceCloneTaskListQuery) -> ServerResult<VoiceCloneTaskPage> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);
        let status_filter = normalize_voice_clone_task_status(query.status)?;
        let speaker_id_filter = query.speaker_id.and_then(normalize_optional_text);

        let filtered = document
            .clone_tasks
            .into_iter()
            .filter(|task| {
                status_filter
                    .map(|status| task.status == status)
                    .unwrap_or(true)
            })
            .filter(|task| {
                speaker_id_filter
                    .as_ref()
                    .map(|speaker_id| task.speaker_id == *speaker_id)
                    .unwrap_or(true)
            })
            .collect::<Vec<_>>();
        let total = filtered.len();
        let start = (page - 1).saturating_mul(page_size);
        let items = filtered.into_iter().skip(start).take(page_size).collect();

        Ok(VoiceCloneTaskPage {
            items,
            page,
            page_size,
            total,
        })
    }

    fn delete_clone_task(&self, task_id: &str) -> ServerResult<bool> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_CLONE_TASK_ID_EMPTY", "taskId")?;
        let index = document
            .clone_tasks
            .iter()
            .position(|task| matches_clone_task_key(task, &normalized_task_id))
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_CLONE_TASK_NOT_FOUND",
                    format!("voice clone task {normalized_task_id} was not found"),
                )
            })?;

        document.clone_tasks.remove(index);
        self.persist_to_disk(&document)?;
        Ok(true)
    }

    fn cancel_clone_task(&self, task_id: &str) -> ServerResult<VoiceCloneTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_CLONE_TASK_ID_EMPTY", "taskId")?;
        let now = current_timestamp();

        let task = self
            .read_clone_task_mut_from_document(&mut document, &normalized_task_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_CLONE_TASK_NOT_FOUND",
                    format!("voice clone task {normalized_task_id} was not found"),
                )
            })?;

        if matches!(
            task.status,
            GenerationTaskStatus::Queued | GenerationTaskStatus::Processing
        ) {
            task.status = GenerationTaskStatus::Cancelled;
            task.updated_at = now.clone();
            task.cancelled_at = Some(now.clone());
            task.completed_at = Some(now);
            task.error_code = Some("APP_VOICE_CLONE_TASK_CANCELLED".to_string());
            task.error_message = Some("voice clone task was cancelled".to_string());
        }

        let record = task.clone();
        sort_clone_tasks(&mut document.clone_tasks);
        self.persist_to_disk(&document)?;
        Ok(record)
    }

    fn update_voice_preview(
        &self,
        speaker_id: &str,
        input: VoicePreviewUpdateRequest,
    ) -> ServerResult<VoiceSpeakerRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_speaker_id =
            require_non_empty_text(speaker_id, "APP_VOICE_SPEAKER_ID_EMPTY", "speakerId")?;
        let now = current_timestamp();

        let voice = self
            .read_custom_voice_mut_from_document(&mut document, &normalized_speaker_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEAKER_NOT_FOUND",
                    format!("custom voice speaker {normalized_speaker_id} was not found"),
                )
            })?;

        if let Some(preview_text) = input.preview_text {
            voice.preview_text = normalize_optional_text(Some(preview_text));
        }
        if let Some(preview_audio_url) = input.preview_audio_url {
            voice.preview_url = normalize_optional_text(Some(preview_audio_url));
        }
        voice.updated_at = now;
        normalize_voice_record(voice, VoiceSpeakerSource::Custom);
        let record = voice.clone();
        self.persist_to_disk(&document)?;
        Ok(record)
    }

    fn list_speech_tasks(
        &self,
        query: VoiceSpeechTaskListQuery,
    ) -> ServerResult<GenerationTaskPage> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);
        let status_filter = normalize_voice_speech_task_status(query.status)?;
        let speaker_id_filter = query.speaker_id.and_then(normalize_optional_text);

        let filtered: Vec<GenerationTaskRecord> = document
            .speech_tasks
            .into_iter()
            .filter(|task| task.product == GenerationProduct::Speech)
            .filter(|task| {
                status_filter
                    .map(|status| task.status == status)
                    .unwrap_or(true)
            })
            .filter(|task| {
                speaker_id_filter
                    .as_ref()
                    .map(|speaker_id| {
                        task_parameter_string(task, "speakerId")
                            .as_deref()
                            .map(|value| value == speaker_id)
                            .unwrap_or(false)
                    })
                    .unwrap_or(true)
            })
            .collect();
        let total = filtered.len();
        let start = (page - 1).saturating_mul(page_size);
        let items = filtered.into_iter().skip(start).take(page_size).collect();

        Ok(GenerationTaskPage {
            items,
            page,
            page_size,
            total,
        })
    }

    fn list_history_speech_tasks(
        &self,
        status: Option<String>,
    ) -> ServerResult<Vec<GenerationTaskRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let status_filter = normalize_voice_speech_task_status(status)?;

        Ok(document
            .speech_tasks
            .into_iter()
            .filter(|task| task.product == GenerationProduct::Speech)
            .filter(|task| {
                status_filter
                    .map(|status| task.status == status)
                    .unwrap_or(true)
            })
            .collect())
    }

    fn create_speech_task(
        &self,
        input: VoiceSpeechTaskCreateRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let speaker = self.read_voice_speaker(&input.speaker_id)?;
        let mut task = self.create_speech_task_record(&speaker, input.clone())?;

        if self.audio_execution_service.is_configured() {
            let execution = self
                .audio_execution_service
                .synthesize(SpeechExecutionRequest {
                    task_id: task.task_id.clone(),
                    output_namespace: "voice-speech".to_string(),
                    output_name_prefix: speaker.name.clone(),
                    text: input.text,
                    model: input.model,
                    voice: input
                        .voice_id
                        .or_else(|| speaker.provider_voice_id.clone())
                        .or_else(|| Some(speaker.id.clone())),
                    format: input.format,
                    language: input.language.or_else(|| Some(speaker.language.clone())),
                    speed: input
                        .speed
                        .or_else(|| speaker.config.as_ref().and_then(|config| config.speed)),
                    extra: task.parameters.clone(),
                });

            match execution {
                Ok(result) => {
                    let now = current_timestamp();
                    task.status = GenerationTaskStatus::Succeeded;
                    task.provider = result.provider;
                    task.provider_model = result.provider_model;
                    task.remote_job_id = None;
                    task.progress = Some(100.0);
                    task.error_code = None;
                    task.error_message = None;
                    task.artifacts = vec![result.artifact.clone()];
                    task.primary_artifact = Some(result.artifact);
                    task.provider_payload = Some(result.provider_payload);
                    task.updated_at = now.clone();
                    task.completed_at = Some(now);
                }
                Err(error) => {
                    let now = current_timestamp();
                    let detail = error.detail.clone();
                    task.status = GenerationTaskStatus::Failed;
                    task.progress = Some(0.0);
                    task.error_code = Some(error.code);
                    task.error_message = Some(error.message);
                    task.updated_at = now.clone();
                    task.completed_at = Some(now);

                    let mut provider_payload = task.provider_payload.take().unwrap_or_default();
                    provider_payload.insert(
                        "failureReason".to_string(),
                        Value::String("provider_request_failed".to_string()),
                    );
                    provider_payload.insert(
                        "adapterStatus".to_string(),
                        Value::String(self.audio_execution_service.adapter_status().to_string()),
                    );
                    if let Some(detail) = detail {
                        provider_payload.insert("failureDetail".to_string(), Value::String(detail));
                    }
                    task.provider_payload = Some(provider_payload);
                }
            }
        }

        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        document.speech_tasks.insert(0, task.clone());
        sort_speech_tasks(&mut document.speech_tasks);
        self.persist_to_disk(&document)?;
        self.record_speech_history(&task);
        Ok(task)
    }

    fn read_speech_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_SPEECH_TASK_ID_EMPTY", "taskId")?;

        self.read_speech_task_from_document(&document, &normalized_task_id)
            .cloned()
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEECH_TASK_NOT_FOUND",
                    format!("voice speech task {normalized_task_id} was not found"),
                )
            })
    }

    fn update_speech_task(
        &self,
        task_id: &str,
        input: VoiceSpeechTaskUpdateRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_SPEECH_TASK_ID_EMPTY", "taskId")?;
        let now = current_timestamp();

        let task = self
            .read_speech_task_mut_from_document(&mut document, &normalized_task_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEECH_TASK_NOT_FOUND",
                    format!("voice speech task {normalized_task_id} was not found"),
                )
            })?;

        if let Some(is_favorite) = input.is_favorite {
            let mut parameters = task.parameters.clone().unwrap_or_default();
            parameters.insert("isFavorite".to_string(), Value::Bool(is_favorite));
            task.parameters = Some(parameters);
        }
        task.updated_at = now;

        let record = task.clone();
        sort_speech_tasks(&mut document.speech_tasks);
        self.persist_to_disk(&document)?;
        Ok(record)
    }

    fn upsert_speech_task(
        &self,
        task_id: &str,
        input: VoiceSpeechTaskUpsertRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let normalized_route_task_id =
            require_non_empty_text(task_id, "APP_VOICE_SPEECH_TASK_ID_EMPTY", "taskId")?;
        let normalized_speaker_id = require_non_empty_text(
            &input.speaker_id,
            "APP_VOICE_SPEECH_SPEAKER_ID_EMPTY",
            "speakerId",
        )?;
        let speaker = self.read_voice_speaker(&normalized_speaker_id).ok();
        let now = current_timestamp();

        let VoiceSpeechTaskUpsertRequest {
            id: _,
            uuid,
            text,
            speaker_id: _,
            speaker_name,
            status,
            provider,
            provider_model,
            remote_job_id,
            progress,
            error_code,
            error_message,
            language,
            format,
            voice_id,
            avatar_url,
            description,
            mode,
            input_method,
            speed,
            pitch,
            stability,
            similarity_boost,
            is_favorite,
            reference_audio,
            artifacts,
            primary_artifact,
            created_at,
            updated_at,
            completed_at,
            cancelled_at,
        } = input;

        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let existing_index = document
            .speech_tasks
            .iter()
            .position(|task| matches_generation_task_key(task, &normalized_route_task_id));
        let existing = existing_index.and_then(|index| document.speech_tasks.get(index).cloned());

        let canonical_task_id = existing
            .as_ref()
            .map(|task| task.task_id.clone())
            .unwrap_or_else(|| normalized_route_task_id.clone());
        let canonical_id = existing
            .as_ref()
            .map(|task| task.id.clone())
            .unwrap_or_else(|| normalized_route_task_id.clone());
        let canonical_uuid = uuid
            .and_then(normalize_optional_text)
            .or_else(|| existing.as_ref().map(|task| task.uuid.clone()))
            .unwrap_or_else(|| to_client_entity_uuid(&canonical_id));
        let prompt = require_non_empty_text(&text, "APP_VOICE_SPEECH_TEXT_EMPTY", "text")?;

        let reference_audio = reference_audio
            .map(|reference| {
                let mut normalized = self.normalize_input_ref(reference);
                normalized.role = "reference".to_string();
                if normalized.r#type == "file" {
                    normalized.r#type = "audio".to_string();
                }
                normalized
            })
            .or_else(|| {
                existing
                    .as_ref()
                    .and_then(|task| task.input_refs.first().cloned())
            })
            .or_else(|| {
                speaker
                    .as_ref()
                    .and_then(|voice| voice.reference_audio.clone())
                    .map(normalize_media_input_ref)
            });
        let input_refs = reference_audio.into_iter().collect::<Vec<_>>();

        let mut normalized_artifacts = match artifacts {
            Some(records) => normalize_voice_generation_artifacts(records, &canonical_task_id)?,
            None => existing
                .as_ref()
                .map(|task| task.artifacts.clone())
                .unwrap_or_default(),
        };
        let mut normalized_primary_artifact = match primary_artifact {
            Some(record) => Some(normalize_voice_generation_artifact(
                record,
                &canonical_task_id,
                0,
                "primary",
            )?),
            None => existing
                .as_ref()
                .and_then(|task| task.primary_artifact.clone())
                .or_else(|| normalized_artifacts.first().cloned()),
        };

        if let Some(primary) = normalized_primary_artifact.clone() {
            if !normalized_artifacts
                .iter()
                .any(|artifact| matches_generation_artifact_key(artifact, &primary))
            {
                normalized_artifacts.insert(0, primary.clone());
            }
            normalized_primary_artifact = Some(mark_generation_artifact_primary(primary));
        }
        if let Some(primary) = normalized_primary_artifact.clone() {
            if let Some(index) = normalized_artifacts
                .iter()
                .position(|artifact| matches_generation_artifact_key(artifact, &primary))
            {
                normalized_artifacts[index] = primary.clone();
            }
        }

        let status = normalize_voice_speech_task_status(status)?.unwrap_or_else(|| {
            infer_voice_speech_task_status(
                existing.as_ref().map(|task| task.status),
                progress,
                error_code.as_ref(),
                error_message.as_ref(),
                completed_at.as_ref(),
                cancelled_at.as_ref(),
                &normalized_artifacts,
                normalized_primary_artifact.as_ref(),
            )
        });

        let provider = provider
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing.as_ref().and_then(|task| {
                    normalize_optional_text(Some(task.provider.clone()))
                        .filter(|value| value != "magic-studio-server")
                })
            })
            .or_else(|| {
                speaker
                    .as_ref()
                    .and_then(|voice| normalize_optional_text(Some(voice.provider.clone())))
            })
            .unwrap_or_else(|| "magic-studio-voice-import".to_string());
        let provider_model = provider_model
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing.as_ref().and_then(|task| {
                    normalize_optional_text(Some(task.provider_model.clone()))
                        .filter(|value| value != "unconfigured")
                })
            })
            .unwrap_or_else(|| "imported".to_string());
        let remote_job_id = remote_job_id.and_then(normalize_optional_text).or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task.remote_job_id.clone())
        });
        let progress = normalize_voice_task_progress(
            status,
            progress.or_else(|| existing.as_ref().and_then(|task| task.progress)),
        );

        let speaker_name = speaker_name
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing
                    .as_ref()
                    .and_then(|task| task_parameter_string(task, "speakerName"))
            })
            .or_else(|| {
                speaker
                    .as_ref()
                    .map(|voice| normalize_non_empty_with_fallback(voice.name.clone(), "Voice"))
            });
        let language = language
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing
                    .as_ref()
                    .and_then(|task| task_parameter_string(task, "language"))
            })
            .or_else(|| {
                speaker
                    .as_ref()
                    .map(|voice| normalize_non_empty_with_fallback(voice.language.clone(), "en-US"))
            });
        let format = format
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing
                    .as_ref()
                    .and_then(|task| task_parameter_string(task, "format"))
            })
            .unwrap_or_else(|| "wav".to_string());
        let voice_id = voice_id
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing
                    .as_ref()
                    .and_then(|task| task_parameter_string(task, "voiceId"))
            })
            .or_else(|| {
                speaker
                    .as_ref()
                    .and_then(|voice| voice.provider_voice_id.clone())
                    .and_then(normalize_optional_text)
            })
            .or_else(|| Some(normalized_speaker_id.clone()));
        let avatar_url = avatar_url
            .and_then(normalize_optional_text)
            .or_else(|| {
                existing
                    .as_ref()
                    .and_then(|task| task_parameter_string(task, "avatarUrl"))
            })
            .or_else(|| {
                speaker
                    .as_ref()
                    .and_then(|voice| voice.avatar_url.clone())
                    .and_then(normalize_optional_text)
            });
        let description = description.and_then(normalize_optional_text).or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_string(task, "description"))
        });
        let voice_mode = mode.and_then(normalize_optional_text).or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_string(task, "mode"))
        });
        let input_method = input_method.and_then(normalize_optional_text).or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_string(task, "inputMethod"))
        });
        let speed = speed.or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_number(task, "speed"))
        });
        let pitch = pitch.or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_number(task, "pitch"))
        });
        let stability = stability.or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_number(task, "stability"))
        });
        let similarity_boost = similarity_boost.or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_number(task, "similarityBoost"))
        });
        let is_favorite = is_favorite.or_else(|| {
            existing
                .as_ref()
                .and_then(|task| task_parameter_bool(task, "isFavorite"))
        });

        let created_at = created_at
            .and_then(normalize_optional_text)
            .or_else(|| existing.as_ref().map(|task| task.created_at.clone()))
            .unwrap_or_else(|| now.clone());
        let updated_at = updated_at
            .and_then(normalize_optional_text)
            .or_else(|| completed_at.clone().and_then(normalize_optional_text))
            .or_else(|| cancelled_at.clone().and_then(normalize_optional_text))
            .or_else(|| existing.as_ref().map(|task| task.updated_at.clone()))
            .unwrap_or_else(|| now.clone());
        let completed_at = normalize_voice_task_completed_at(
            status,
            completed_at,
            existing.as_ref().and_then(|task| task.completed_at.clone()),
            &updated_at,
        );
        let cancelled_at = normalize_voice_task_cancelled_at(
            status,
            cancelled_at,
            existing.as_ref().and_then(|task| task.cancelled_at.clone()),
            completed_at.as_deref(),
            &updated_at,
        );
        let error_code = normalize_voice_task_error_code(
            status,
            error_code,
            existing.as_ref().and_then(|task| task.error_code.clone()),
        );
        let error_message = normalize_voice_task_error_message(
            status,
            error_message,
            existing
                .as_ref()
                .and_then(|task| task.error_message.clone()),
        );

        let parameters = json_map(vec![
            Some((
                "speakerId".to_string(),
                Value::String(normalized_speaker_id.clone()),
            )),
            optional_json_string("speakerName", speaker_name.clone()),
            optional_json_string("text", Some(prompt.clone())),
            optional_json_string("model", Some(provider_model.clone())),
            optional_json_string("voiceId", voice_id.clone()),
            optional_json_string("avatarUrl", avatar_url.clone()),
            optional_json_string("description", description.clone()),
            optional_json_string("mode", voice_mode.clone()),
            optional_json_string("inputMethod", input_method.clone()),
            optional_json_string("language", language.clone()),
            optional_json_string("format", Some(format.clone())),
            optional_json_number("speed", speed),
            optional_json_number("pitch", pitch),
            optional_json_number("stability", stability),
            optional_json_number("similarityBoost", similarity_boost),
            optional_json_bool("isFavorite", is_favorite),
        ]);

        let mut provider_payload = existing
            .as_ref()
            .and_then(|task| task.provider_payload.clone())
            .unwrap_or_default();
        provider_payload.insert(
            "persistenceMode".to_string(),
            Value::String("canonical-import-upsert".to_string()),
        );
        provider_payload.insert(
            "taskSource".to_string(),
            Value::String("imported".to_string()),
        );
        provider_payload.insert(
            "taskRoute".to_string(),
            Value::String(build_voice_speech_task_route_template()),
        );
        if let Some(speaker_source) = speaker
            .as_ref()
            .map(|voice| speaker_source_label(voice.source).to_string())
        {
            provider_payload.insert("speakerSource".to_string(), Value::String(speaker_source));
        }
        if let Some(speaker_name) = speaker_name.clone() {
            provider_payload.insert("speakerName".to_string(), Value::String(speaker_name));
        }
        if let Some(language) = language.clone() {
            provider_payload.insert("language".to_string(), Value::String(language));
        }
        if let Some(remote_job_id) = remote_job_id.clone() {
            provider_payload.insert("remoteJobId".to_string(), Value::String(remote_job_id));
        }
        if !matches!(status, GenerationTaskStatus::Failed) {
            provider_payload.remove("failureReason");
            provider_payload.remove("failureDetail");
        }
        let provider_payload = normalize_json_map(Some(provider_payload));

        let record = GenerationTaskRecord {
            id: canonical_id,
            uuid: canonical_uuid,
            task_id: canonical_task_id,
            product: GenerationProduct::Speech,
            mode: "text-to-speech".to_string(),
            status,
            prompt: Some(prompt),
            negative_prompt: None,
            provider,
            provider_model,
            remote_job_id,
            progress,
            error_code,
            error_message,
            input_refs,
            artifacts: normalized_artifacts,
            primary_artifact: normalized_primary_artifact,
            parameters,
            provider_payload,
            created_at,
            updated_at,
            completed_at,
            cancelled_at,
        };

        if let Some(index) = existing_index {
            document.speech_tasks[index] = record.clone();
        } else {
            document.speech_tasks.push(record.clone());
        }

        sort_speech_tasks(&mut document.speech_tasks);
        self.persist_to_disk(&document)?;
        self.record_speech_history(&record);
        Ok(record)
    }

    fn delete_speech_task(&self, task_id: &str) -> ServerResult<bool> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_SPEECH_TASK_ID_EMPTY", "taskId")?;
        let index = document
            .speech_tasks
            .iter()
            .position(|task| matches_generation_task_key(task, &normalized_task_id))
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEECH_TASK_NOT_FOUND",
                    format!("voice speech task {normalized_task_id} was not found"),
                )
            })?;

        document.speech_tasks.remove(index);
        self.persist_to_disk(&document)?;
        Ok(true)
    }

    fn cancel_speech_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_VOICE_SPEECH_TASK_ID_EMPTY", "taskId")?;
        let now = current_timestamp();

        let task = self
            .read_speech_task_mut_from_document(&mut document, &normalized_task_id)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VOICE_SPEECH_TASK_NOT_FOUND",
                    format!("voice speech task {normalized_task_id} was not found"),
                )
            })?;

        if matches!(
            task.status,
            GenerationTaskStatus::Queued | GenerationTaskStatus::Processing
        ) {
            task.status = GenerationTaskStatus::Cancelled;
            task.updated_at = now.clone();
            task.cancelled_at = Some(now.clone());
            task.completed_at = Some(now);
            task.error_code = Some("APP_VOICE_SPEECH_TASK_CANCELLED".to_string());
            task.error_message = Some("voice speech task was cancelled".to_string());
        }

        let record = task.clone();
        sort_speech_tasks(&mut document.speech_tasks);
        self.persist_to_disk(&document)?;
        self.record_speech_history(&record);
        Ok(record)
    }
}

fn market_voice(
    id: &str,
    name: &str,
    gender: &str,
    style: &str,
    language: &str,
    provider: &str,
) -> VoiceSpeakerRecord {
    VoiceSpeakerRecord {
        id: id.to_string(),
        uuid: format!("voice-profile-{}", id.to_lowercase()),
        source: VoiceSpeakerSource::Market,
        name: name.to_string(),
        gender: gender.to_string(),
        style: style.to_string(),
        language: language.to_string(),
        provider: provider.to_string(),
        provider_voice_id: Some(id.to_string()),
        preview_url: None,
        preview_text: None,
        avatar_url: None,
        description: Some(format!("{name} market voice preset")),
        tags: vec!["market".to_string(), style.to_string()],
        reference_audio: None,
        config: None,
        is_favorite: Some(false),
        metadata: None,
        created_at: MARKET_VOICE_TIMESTAMP.to_string(),
        updated_at: MARKET_VOICE_TIMESTAMP.to_string(),
    }
}

fn map_workspace_voice_from_asset(asset: UnifiedDigitalAssetRecord) -> VoiceSpeakerRecord {
    let metadata = asset.metadata.clone().unwrap_or_default();
    let preview_url = asset_metadata_string(&metadata, "deliveryUrl")
        .or_else(|| asset_metadata_string(&metadata, "previewUrl"))
        .or_else(|| asset_metadata_string(&metadata, "previewAudioUrl"))
        .or_else(|| asset.storage.primary.url.clone())
        .or_else(|| asset.storage.primary.path.clone())
        .or_else(|| Some(asset.storage.primary.uri.clone()));
    let tags = asset
        .tags
        .clone()
        .unwrap_or_else(|| vec!["workspace".to_string()]);

    VoiceSpeakerRecord {
        id: asset.id.clone(),
        uuid: asset.uuid.clone(),
        source: VoiceSpeakerSource::Workspace,
        name: if asset.title.trim().is_empty() {
            asset.id.clone()
        } else {
            asset.title.clone()
        },
        gender: asset_metadata_string(&metadata, "gender")
            .or_else(|| asset_metadata_string(&metadata, "voiceGender"))
            .or_else(|| asset_metadata_string(&metadata, "speakerGender"))
            .unwrap_or_else(|| "neutral".to_string()),
        style: asset_metadata_string(&metadata, "style")
            .or_else(|| asset_metadata_string(&metadata, "voiceStyle"))
            .unwrap_or_else(|| "neutral".to_string()),
        language: asset_metadata_string(&metadata, "language")
            .or_else(|| asset_metadata_string(&metadata, "locale"))
            .or_else(|| asset_metadata_string(&metadata, "voiceLocale"))
            .unwrap_or_else(|| "en-US".to_string()),
        provider: asset_metadata_string(&metadata, "provider")
            .or_else(|| asset_metadata_string(&metadata, "source"))
            .unwrap_or_else(|| "Workspace Voice".to_string()),
        provider_voice_id: Some(asset.id.clone()),
        preview_url,
        preview_text: asset_metadata_string(&metadata, "previewText")
            .or_else(|| asset_metadata_string(&metadata, "previewScript"))
            .or_else(|| asset_metadata_string(&metadata, "script")),
        avatar_url: asset_metadata_string(&metadata, "avatarUrl"),
        description: asset.description.clone(),
        tags,
        reference_audio: Some(asset_to_media_input_ref(&asset)),
        config: Some(VoiceSpeakerConfigRecord {
            speed: asset_metadata_number(&metadata, "speed"),
            pitch: asset_metadata_number(&metadata, "pitch"),
            stability: asset_metadata_number(&metadata, "stability"),
            similarity_boost: asset_metadata_number(&metadata, "similarityBoost"),
        }),
        is_favorite: asset.is_favorite,
        metadata: Some(metadata),
        created_at: asset.created_at.clone(),
        updated_at: asset.updated_at.clone(),
    }
}

fn asset_to_media_input_ref(asset: &UnifiedDigitalAssetRecord) -> MediaInputRefRecord {
    let metadata = asset.metadata.clone().unwrap_or_default();
    MediaInputRefRecord {
        id: Some(asset.id.clone()),
        uuid: asset.uuid.clone(),
        asset_id: Some(asset.id.clone()),
        asset_uuid: Some(asset.uuid.clone()),
        primary_resource_id: asset_metadata_string(&metadata, "primaryResourceId"),
        primary_resource_uuid: asset_metadata_string(&metadata, "primaryResourceUuid"),
        resource_view_id: asset_metadata_string(&metadata, "resourceViewId"),
        resource_view_uuid: asset_metadata_string(&metadata, "resourceViewUuid"),
        path: asset.storage.primary.path.clone(),
        url: asset
            .storage
            .primary
            .url
            .clone()
            .or_else(|| Some(asset.storage.primary.uri.clone())),
        name: Some(asset.title.clone()),
        mime_type: asset_metadata_string(&metadata, "mimeType"),
        r#type: match asset.primary_type {
            AssetContentKey::Voice => "voice".to_string(),
            _ => "audio".to_string(),
        },
        role: "reference".to_string(),
        resource: None,
        metadata: Some(metadata),
        created_at: Some(asset.created_at.clone()),
        updated_at: Some(asset.updated_at.clone()),
        deleted_at: asset.deleted_at.clone(),
    }
}

fn normalize_voice_record(voice: &mut VoiceSpeakerRecord, source: VoiceSpeakerSource) {
    voice.source = source;
    voice.name = voice.name.trim().to_string();
    if voice.name.is_empty() {
        voice.name = "Unnamed Voice".to_string();
    }
    voice.gender = normalize_non_empty_with_fallback(voice.gender.clone(), "neutral");
    voice.style = normalize_non_empty_with_fallback(voice.style.clone(), "neutral");
    voice.language = normalize_non_empty_with_fallback(voice.language.clone(), "en-US");
    voice.provider = normalize_non_empty_with_fallback(voice.provider.clone(), "Voice");
    voice.provider_voice_id = voice
        .provider_voice_id
        .clone()
        .and_then(normalize_optional_text);
    voice.preview_url = voice.preview_url.clone().and_then(normalize_optional_text);
    voice.preview_text = voice.preview_text.clone().and_then(normalize_optional_text);
    voice.avatar_url = voice.avatar_url.clone().and_then(normalize_optional_text);
    voice.description = voice.description.clone().and_then(normalize_optional_text);
    voice.tags = normalize_string_list(Some(voice.tags.clone())).unwrap_or_default();
    voice.metadata = normalize_json_map(voice.metadata.clone());
    if let Some(reference_audio) = voice.reference_audio.clone() {
        voice.reference_audio = Some(normalize_media_input_ref(reference_audio));
    }
}

fn normalize_clone_task_record(task: &mut VoiceCloneTaskRecord) {
    task.speaker_name = task.speaker_name.clone().and_then(normalize_optional_text);
    task.language = normalize_non_empty_with_fallback(task.language.clone(), "en-US");
    task.model = task.model.clone().and_then(normalize_optional_text);
    task.provider = normalize_non_empty_with_fallback(task.provider.clone(), "magic-studio-server");
    task.remote_job_id = task.remote_job_id.clone().and_then(normalize_optional_text);
    task.progress = normalize_voice_task_progress(task.status, task.progress);
    task.idempotency_key = task
        .idempotency_key
        .clone()
        .and_then(normalize_optional_text);
    task.sample_audio = task.sample_audio.clone().map(normalize_media_input_ref);
    task.sample_audio_url = task
        .sample_audio_url
        .clone()
        .and_then(normalize_optional_text);
    task.preview_text = task.preview_text.clone().and_then(normalize_optional_text);
    task.preview_audio_url = task
        .preview_audio_url
        .clone()
        .and_then(normalize_optional_text);
    task.error_code = task.error_code.clone().and_then(normalize_optional_text);
    task.error_message = task.error_message.clone().and_then(normalize_optional_text);
    task.provider_payload = normalize_json_map(task.provider_payload.clone());
    task.completed_at = task.completed_at.clone().and_then(normalize_optional_text);
    task.cancelled_at = task.cancelled_at.clone().and_then(normalize_optional_text);
}

fn normalize_voice_generation_artifacts(
    artifacts: Vec<GenerationArtifactRecord>,
    task_id: &str,
) -> ServerResult<Vec<GenerationArtifactRecord>> {
    artifacts
        .into_iter()
        .enumerate()
        .map(|(index, artifact)| {
            normalize_voice_generation_artifact(
                artifact,
                task_id,
                index,
                if index == 0 { "primary" } else { "preview" },
            )
        })
        .collect()
}

fn normalize_voice_generation_artifact(
    artifact: GenerationArtifactRecord,
    task_id: &str,
    index: usize,
    default_role: &str,
) -> ServerResult<GenerationArtifactRecord> {
    let fallback_id = if task_id.trim().is_empty() {
        next_entity_id("voice-artifact", &VOICE_ARTIFACT_COUNTER)
    } else {
        format!("{task_id}-artifact-{}", index + 1)
    };
    let artifact_id = normalize_optional_text(Some(artifact.id)).unwrap_or(fallback_id);
    let url = require_non_empty_text(
        &artifact.url,
        "APP_VOICE_SPEECH_ARTIFACT_URL_EMPTY",
        "artifact.url",
    )?;

    Ok(GenerationArtifactRecord {
        id: artifact_id.clone(),
        uuid: normalize_optional_text(Some(artifact.uuid))
            .unwrap_or_else(|| to_client_entity_uuid(&artifact_id)),
        r#type: normalize_non_empty_with_fallback(artifact.r#type, "voice"),
        role: normalize_non_empty_with_fallback(artifact.role, default_role),
        asset_id: artifact.asset_id.and_then(normalize_optional_text),
        asset_uuid: artifact.asset_uuid.and_then(normalize_optional_text),
        primary_resource_id: artifact
            .primary_resource_id
            .and_then(normalize_optional_text),
        primary_resource_uuid: artifact
            .primary_resource_uuid
            .and_then(normalize_optional_text),
        resource_view_id: artifact.resource_view_id.and_then(normalize_optional_text),
        resource_view_uuid: artifact
            .resource_view_uuid
            .and_then(normalize_optional_text),
        url,
        poster_url: artifact.poster_url.and_then(normalize_optional_text),
        mime_type: artifact.mime_type.and_then(normalize_optional_text),
        name: normalize_optional_text(Some(artifact.name))
            .unwrap_or_else(|| format!("voice-output-{}.wav", index + 1)),
        width: artifact.width.filter(|value| *value > 0),
        height: artifact.height.filter(|value| *value > 0),
        duration: artifact
            .duration
            .filter(|value| value.is_finite() && *value >= 0.0),
        metadata: normalize_json_map(artifact.metadata),
    })
}

fn normalize_media_input_ref(input: MediaInputRefRecord) -> MediaInputRefRecord {
    let fallback_id = input
        .id
        .clone()
        .and_then(normalize_optional_text)
        .unwrap_or_else(|| next_entity_id("voice-input", &VOICE_INPUT_COUNTER));

    MediaInputRefRecord {
        id: Some(fallback_id.clone()),
        uuid: if input.uuid.trim().is_empty() {
            to_client_entity_uuid(&fallback_id)
        } else {
            input.uuid
        },
        asset_id: input.asset_id.and_then(normalize_optional_text),
        asset_uuid: input.asset_uuid.and_then(normalize_optional_text),
        primary_resource_id: input.primary_resource_id.and_then(normalize_optional_text),
        primary_resource_uuid: input
            .primary_resource_uuid
            .and_then(normalize_optional_text),
        resource_view_id: input.resource_view_id.and_then(normalize_optional_text),
        resource_view_uuid: input.resource_view_uuid.and_then(normalize_optional_text),
        path: input.path.and_then(normalize_optional_text),
        url: input.url.and_then(normalize_optional_text),
        name: input.name.and_then(normalize_optional_text),
        mime_type: input.mime_type.and_then(normalize_optional_text),
        r#type: normalize_non_empty_with_fallback(input.r#type, "audio"),
        role: normalize_non_empty_with_fallback(input.role, "reference"),
        resource: input.resource,
        metadata: normalize_json_map(input.metadata),
        created_at: input.created_at.and_then(normalize_optional_text),
        updated_at: input.updated_at.and_then(normalize_optional_text),
        deleted_at: input.deleted_at.and_then(normalize_optional_text),
    }
}

fn matches_voice_query(voice: &VoiceSpeakerRecord, query: &VoiceListQuery) -> bool {
    if let Some(keyword) = query
        .keyword
        .as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
    {
        let keyword = keyword.to_lowercase();
        let description = voice
            .description
            .as_deref()
            .unwrap_or_default()
            .to_lowercase();
        let tags = voice.tags.join(" ").to_lowercase();
        if !voice.name.to_lowercase().contains(&keyword)
            && !voice.provider.to_lowercase().contains(&keyword)
            && !voice.style.to_lowercase().contains(&keyword)
            && !voice.language.to_lowercase().contains(&keyword)
            && !description.contains(&keyword)
            && !tags.contains(&keyword)
        {
            return false;
        }
    }

    if let Some(source) = query
        .source
        .as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
    {
        if speaker_source_label(voice.source) != source {
            return false;
        }
    }

    if let Some(language) = query
        .language
        .as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
    {
        if !voice
            .language
            .to_lowercase()
            .starts_with(&language.to_lowercase())
        {
            return false;
        }
    }

    if let Some(gender) = query
        .gender
        .as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
    {
        if voice.gender.to_lowercase() != gender.to_lowercase() {
            return false;
        }
    }

    if let Some(style) = query
        .style
        .as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
    {
        if voice.style.to_lowercase() != style.to_lowercase() {
            return false;
        }
    }

    if let Some(provider) = query
        .provider
        .as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
    {
        if voice.provider.to_lowercase() != provider.to_lowercase() {
            return false;
        }
    }

    true
}

fn speaker_source_label(source: VoiceSpeakerSource) -> &'static str {
    match source {
        VoiceSpeakerSource::Market => "market",
        VoiceSpeakerSource::Workspace => "workspace",
        VoiceSpeakerSource::Custom => "custom",
    }
}

fn task_status_label(status: GenerationTaskStatus) -> &'static str {
    match status {
        GenerationTaskStatus::Draft => "draft",
        GenerationTaskStatus::Queued => "queued",
        GenerationTaskStatus::Processing => "processing",
        GenerationTaskStatus::Succeeded => "succeeded",
        GenerationTaskStatus::Failed => "failed",
        GenerationTaskStatus::Cancelled => "cancelled",
    }
}

fn task_parameter_string(task: &GenerationTaskRecord, key: &str) -> Option<String> {
    task.parameters
        .as_ref()
        .and_then(|parameters| parameters.get(key))
        .and_then(Value::as_str)
        .and_then(|value| normalize_optional_text(Some(value.to_string())))
}

fn task_parameter_number(task: &GenerationTaskRecord, key: &str) -> Option<f64> {
    task.parameters
        .as_ref()
        .and_then(|parameters| parameters.get(key))
        .and_then(Value::as_f64)
        .filter(|value| value.is_finite())
}

fn task_parameter_bool(task: &GenerationTaskRecord, key: &str) -> Option<bool> {
    task.parameters
        .as_ref()
        .and_then(|parameters| parameters.get(key))
        .and_then(Value::as_bool)
}

fn normalize_voice_speech_task_status(
    value: Option<String>,
) -> ServerResult<Option<GenerationTaskStatus>> {
    let Some(normalized) = normalize_optional_text(value).map(|value| value.to_ascii_lowercase())
    else {
        return Ok(None);
    };

    match normalized.as_str() {
        "draft" => Ok(Some(GenerationTaskStatus::Draft)),
        "queued" | "pending" => Ok(Some(GenerationTaskStatus::Queued)),
        "processing" | "running" | "in_progress" | "in-progress" => {
            Ok(Some(GenerationTaskStatus::Processing))
        }
        "succeeded" | "success" | "completed" | "done" => {
            Ok(Some(GenerationTaskStatus::Succeeded))
        }
        "failed" | "error" => Ok(Some(GenerationTaskStatus::Failed)),
        "cancelled" | "canceled" => Ok(Some(GenerationTaskStatus::Cancelled)),
        _ => Err(ServerError::bad_request(
            "APP_VOICE_SPEECH_TASK_STATUS_INVALID",
            format!(
                "voice speech status {normalized} is invalid; expected draft, queued, processing, succeeded, failed, or cancelled"
            ),
        )),
    }
}

fn normalize_voice_clone_task_status(
    value: Option<String>,
) -> ServerResult<Option<GenerationTaskStatus>> {
    let Some(normalized) = normalize_optional_text(value).map(|value| value.to_ascii_lowercase())
    else {
        return Ok(None);
    };

    match normalized.as_str() {
        "draft" => Ok(Some(GenerationTaskStatus::Draft)),
        "queued" | "pending" => Ok(Some(GenerationTaskStatus::Queued)),
        "processing" | "running" | "in_progress" | "in-progress" => {
            Ok(Some(GenerationTaskStatus::Processing))
        }
        "succeeded" | "success" | "completed" | "done" => {
            Ok(Some(GenerationTaskStatus::Succeeded))
        }
        "failed" | "error" => Ok(Some(GenerationTaskStatus::Failed)),
        "cancelled" | "canceled" => Ok(Some(GenerationTaskStatus::Cancelled)),
        _ => Err(ServerError::bad_request(
            "APP_VOICE_CLONE_TASK_STATUS_INVALID",
            format!(
                "voice clone status {normalized} is invalid; expected draft, queued, processing, succeeded, failed, or cancelled"
            ),
        )),
    }
}

fn infer_voice_speech_task_status(
    existing_status: Option<GenerationTaskStatus>,
    progress: Option<f64>,
    error_code: Option<&String>,
    error_message: Option<&String>,
    completed_at: Option<&String>,
    cancelled_at: Option<&String>,
    artifacts: &[GenerationArtifactRecord],
    primary_artifact: Option<&GenerationArtifactRecord>,
) -> GenerationTaskStatus {
    if cancelled_at
        .and_then(|value| normalize_optional_text(Some(value.clone())))
        .is_some()
    {
        return GenerationTaskStatus::Cancelled;
    }
    if error_code
        .and_then(|value| normalize_optional_text(Some(value.clone())))
        .is_some()
        || error_message
            .and_then(|value| normalize_optional_text(Some(value.clone())))
            .is_some()
    {
        return GenerationTaskStatus::Failed;
    }
    if completed_at
        .and_then(|value| normalize_optional_text(Some(value.clone())))
        .is_some()
        || primary_artifact.is_some()
        || !artifacts.is_empty()
    {
        return GenerationTaskStatus::Succeeded;
    }
    if progress
        .filter(|value| value.is_finite() && *value > 0.0)
        .is_some()
    {
        return GenerationTaskStatus::Processing;
    }
    existing_status.unwrap_or(GenerationTaskStatus::Queued)
}

fn normalize_voice_task_progress(status: GenerationTaskStatus, value: Option<f64>) -> Option<f64> {
    let normalized = value
        .filter(|value| value.is_finite())
        .map(|value| value.clamp(0.0, 100.0));
    match status {
        GenerationTaskStatus::Draft | GenerationTaskStatus::Queued => {
            Some(normalized.unwrap_or(0.0))
        }
        GenerationTaskStatus::Processing => normalized.or(Some(50.0)),
        GenerationTaskStatus::Succeeded => Some(normalized.unwrap_or(100.0)),
        GenerationTaskStatus::Failed | GenerationTaskStatus::Cancelled => {
            Some(normalized.unwrap_or(0.0))
        }
    }
}

fn normalize_voice_task_completed_at(
    status: GenerationTaskStatus,
    input: Option<String>,
    existing: Option<String>,
    updated_at: &str,
) -> Option<String> {
    match status {
        GenerationTaskStatus::Succeeded
        | GenerationTaskStatus::Failed
        | GenerationTaskStatus::Cancelled => input
            .and_then(normalize_optional_text)
            .or_else(|| existing.and_then(normalize_optional_text))
            .or_else(|| Some(updated_at.to_string())),
        GenerationTaskStatus::Draft
        | GenerationTaskStatus::Queued
        | GenerationTaskStatus::Processing => None,
    }
}

fn normalize_voice_task_cancelled_at(
    status: GenerationTaskStatus,
    input: Option<String>,
    existing: Option<String>,
    completed_at: Option<&str>,
    updated_at: &str,
) -> Option<String> {
    match status {
        GenerationTaskStatus::Cancelled => input
            .and_then(normalize_optional_text)
            .or_else(|| existing.and_then(normalize_optional_text))
            .or_else(|| completed_at.map(|value| value.to_string()))
            .or_else(|| Some(updated_at.to_string())),
        _ => None,
    }
}

fn normalize_voice_task_error_code(
    status: GenerationTaskStatus,
    input: Option<String>,
    existing: Option<String>,
) -> Option<String> {
    match status {
        GenerationTaskStatus::Failed => input
            .and_then(normalize_optional_text)
            .or_else(|| existing.and_then(normalize_optional_text))
            .or_else(|| Some("APP_VOICE_SPEECH_TASK_FAILED".to_string())),
        GenerationTaskStatus::Cancelled => input
            .and_then(normalize_optional_text)
            .or_else(|| Some("APP_VOICE_SPEECH_TASK_CANCELLED".to_string())),
        _ => None,
    }
}

fn normalize_voice_task_error_message(
    status: GenerationTaskStatus,
    input: Option<String>,
    existing: Option<String>,
) -> Option<String> {
    match status {
        GenerationTaskStatus::Failed => input
            .and_then(normalize_optional_text)
            .or_else(|| existing.and_then(normalize_optional_text))
            .or_else(|| Some("voice speech task failed".to_string())),
        GenerationTaskStatus::Cancelled => input
            .and_then(normalize_optional_text)
            .or_else(|| Some("voice speech task was cancelled".to_string())),
        _ => None,
    }
}

fn matches_generation_artifact_key(
    left: &GenerationArtifactRecord,
    right: &GenerationArtifactRecord,
) -> bool {
    left.id == right.id || left.uuid == right.uuid || left.url == right.url
}

fn mark_generation_artifact_primary(
    mut artifact: GenerationArtifactRecord,
) -> GenerationArtifactRecord {
    artifact.role = "primary".to_string();
    artifact
}

fn matches_speaker_key(voice: &VoiceSpeakerRecord, speaker_id: &str) -> bool {
    voice.id == speaker_id || voice.uuid == speaker_id
}

fn matches_clone_task_key(task: &VoiceCloneTaskRecord, task_id: &str) -> bool {
    task.id == task_id || task.uuid == task_id || task.task_id == task_id
}

fn matches_generation_task_key(task: &GenerationTaskRecord, task_id: &str) -> bool {
    task.id == task_id || task.uuid == task_id || task.task_id == task_id
}

fn sort_voices(voices: &mut [VoiceSpeakerRecord]) {
    voices.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn sort_clone_tasks(tasks: &mut [VoiceCloneTaskRecord]) {
    tasks.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn sort_speech_tasks(tasks: &mut [GenerationTaskRecord]) {
    tasks.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

fn build_voice_speech_task_route_template() -> String {
    embedded_server_contract().require_route_path_by_id(APP_VOICES_READ_SPEECH_TASK_ROUTE_ID)
}

fn normalize_page(value: Option<usize>) -> usize {
    value.unwrap_or(1).max(1)
}

fn normalize_page_size(value: Option<usize>) -> usize {
    match value.unwrap_or(DEFAULT_PAGE_SIZE) {
        0 => DEFAULT_PAGE_SIZE,
        provided => provided.min(MAX_PAGE_SIZE),
    }
}

fn normalize_string_list(value: Option<Vec<String>>) -> Option<Vec<String>> {
    value.and_then(|items| {
        let normalized = items
            .into_iter()
            .map(|item| item.trim().to_string())
            .filter(|item| !item.is_empty())
            .fold(Vec::<String>::new(), |mut acc, item| {
                if !acc.contains(&item) {
                    acc.push(item);
                }
                acc
            });

        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    })
}

fn normalize_json_map(value: Option<Map<String, Value>>) -> Option<Map<String, Value>> {
    value.and_then(|entries| {
        if entries.is_empty() {
            None
        } else {
            Some(entries)
        }
    })
}

fn optional_json_string(key: &str, value: Option<String>) -> Option<(String, Value)> {
    value
        .and_then(normalize_optional_text)
        .map(|value| (key.to_string(), Value::String(value)))
}

fn optional_json_number(key: &str, value: Option<f64>) -> Option<(String, Value)> {
    value.and_then(|value| {
        serde_json::Number::from_f64(value).map(|number| (key.to_string(), Value::Number(number)))
    })
}

fn optional_json_bool(key: &str, value: Option<bool>) -> Option<(String, Value)> {
    value.map(|value| (key.to_string(), Value::Bool(value)))
}

fn json_map(entries: Vec<Option<(String, Value)>>) -> Option<Map<String, Value>> {
    let mut map = Map::new();
    for entry in entries.into_iter().flatten() {
        map.insert(entry.0, entry.1);
    }
    if map.is_empty() {
        None
    } else {
        Some(map)
    }
}

fn asset_metadata_string(metadata: &Map<String, Value>, key: &str) -> Option<String> {
    metadata
        .get(key)
        .and_then(Value::as_str)
        .and_then(|value| normalize_optional_text(Some(value.to_string())))
}

fn asset_metadata_number(metadata: &Map<String, Value>, key: &str) -> Option<f64> {
    metadata.get(key).and_then(Value::as_f64)
}

fn normalize_optional_text<T>(value: T) -> Option<String>
where
    T: Into<Option<String>>,
{
    value.into().and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn normalize_non_empty_with_fallback(value: String, fallback: &str) -> String {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        fallback.to_string()
    } else {
        trimmed.to_string()
    }
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

fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}
