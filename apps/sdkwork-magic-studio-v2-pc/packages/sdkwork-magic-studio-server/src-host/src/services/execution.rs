use std::collections::HashMap;
use std::fs;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use sdkwork_utils_rust::encoding;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use sdkwork_ai_sdk::{
    ImageData, ImageGenerationRequest as AiImageGenerationRequest, ImageGenerationResponse,
    MusicGenerationRequest as AiMusicGenerationRequest, OpenAiVideo, SdkworkAiClient,
    SdkworkConfig, SdkworkError, SdkworkHttpClient, SpeechRequest, SunoMusic,
    TranscriptionResponse, VideoGenerationRequest as AiVideoGenerationRequest,
};
use serde_json::{Map, Number, Value};
use tokio::runtime::{Builder, Handle};
use tokio::task;
use tokio::time::sleep;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::generation::{GenerationArtifactRecord, MediaInputRefRecord};
use super::media::{ImageResizeRequest, MediaCommandResult, MediaService};

use super::service_utils::{normalize_optional_text, require_non_empty_text, normalize_text};
pub const AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK: &str = "generated-ai-sdk";
pub const GENERATION_ADAPTER_STATUS_HOST_LOCAL: &str = "host-local";

const AI_BASE_URL_ENV: &str = "MAGIC_STUDIO_AI_BASE_URL";
const AI_API_KEY_ENV: &str = "MAGIC_STUDIO_AI_API_KEY";
const AI_AUTH_TOKEN_ENV: &str = "MAGIC_STUDIO_AI_AUTH_TOKEN";
const AI_ACCESS_TOKEN_ENV: &str = "MAGIC_STUDIO_AI_ACCESS_TOKEN";
const AI_DEFAULT_SPEECH_MODEL_ENV: &str = "MAGIC_STUDIO_AI_SPEECH_MODEL";
const AI_DEFAULT_SPEECH_VOICE_ENV: &str = "MAGIC_STUDIO_AI_SPEECH_VOICE";
const AI_DEFAULT_SPEECH_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_SPEECH_FORMAT";
const AI_DEFAULT_TRANSCRIPTION_MODEL_ENV: &str = "MAGIC_STUDIO_AI_TRANSCRIPTION_MODEL";
const AI_DEFAULT_TRANSCRIPTION_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_TRANSCRIPTION_FORMAT";
const AI_DEFAULT_TRANSLATION_MODEL_ENV: &str = "MAGIC_STUDIO_AI_TRANSLATION_MODEL";
const AI_DEFAULT_TRANSLATION_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_TRANSLATION_FORMAT";
const AI_DEFAULT_IMAGE_MODEL_ENV: &str = "MAGIC_STUDIO_AI_IMAGE_MODEL";
const AI_DEFAULT_IMAGE_RESPONSE_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_IMAGE_RESPONSE_FORMAT";
const AI_DEFAULT_VIDEO_MODEL_ENV: &str = "MAGIC_STUDIO_AI_VIDEO_MODEL";
const AI_DEFAULT_VIDEO_RESPONSE_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_VIDEO_RESPONSE_FORMAT";
const AI_DEFAULT_MUSIC_MODEL_ENV: &str = "MAGIC_STUDIO_AI_MUSIC_MODEL";
const AI_DEFAULT_MUSIC_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_MUSIC_FORMAT";
const AI_DEFAULT_MUSIC_RESPONSE_FORMAT_ENV: &str = "MAGIC_STUDIO_AI_MUSIC_RESPONSE_FORMAT";
const DEFAULT_AUDIO_TEXT_MODEL: &str = "whisper-1";
const DEFAULT_AUDIO_TEXT_RESPONSE_FORMAT: &str = "json";
const DEFAULT_IMAGE_RESPONSE_FORMAT: &str = "url";
const DEFAULT_VIDEO_RESPONSE_FORMAT: &str = "url";
const DEFAULT_MUSIC_RESPONSE_FORMAT: &str = "url";
const DEFAULT_MUSIC_FORMAT: &str = "mp3";
const DEFAULT_AUDIO_DOWNLOAD_BASE_URL: &str = "http://localhost";
const DEFAULT_GENERATION_POLL_ATTEMPTS: usize = 15;
const DEFAULT_GENERATION_POLL_INTERVAL_MS: u64 = 1200;

#[derive(Debug, Clone)]
pub struct SpeechExecutionRequest {
    pub task_id: String,
    pub output_namespace: String,
    pub output_name_prefix: String,
    pub text: String,
    pub model: Option<String>,
    pub voice: Option<String>,
    pub format: Option<String>,
    pub language: Option<String>,
    pub speed: Option<f64>,
    pub extra: Option<Map<String, Value>>,
}

#[derive(Debug, Clone)]
pub struct SpeechExecutionResult {
    pub provider: String,
    pub provider_model: String,
    pub artifact: GenerationArtifactRecord,
    pub provider_payload: Map<String, Value>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AudioTextExecutionKind {
    Transcription,
    Translation,
}

#[derive(Debug, Clone)]
pub struct AudioTextExecutionRequest {
    pub task_id: String,
    pub output_name_prefix: String,
    pub source_audio: MediaInputRefRecord,
    pub prompt: Option<String>,
    pub model: Option<String>,
    pub language: Option<String>,
    pub source_language: Option<String>,
    pub target_language: Option<String>,
    pub format: Option<String>,
    pub temperature: Option<f64>,
    pub extra: Option<Map<String, Value>>,
}

#[derive(Debug, Clone)]
pub struct AudioTextExecutionResult {
    pub provider: String,
    pub provider_model: String,
    pub artifact: GenerationArtifactRecord,
    pub provider_payload: Map<String, Value>,
}

#[derive(Debug, Clone)]
pub struct ImageGenerationExecutionRequest {
    pub task_id: String,
    pub mode: String,
    pub prompt: Option<String>,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub input_refs: Vec<MediaInputRefRecord>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub scale: Option<u32>,
    pub format: Option<String>,
    pub aspect_ratio: Option<String>,
    pub steps: Option<f64>,
    pub guidance: Option<f64>,
    pub seed: Option<f64>,
    pub style: Option<String>,
    pub style_id: Option<String>,
    pub quality: Option<String>,
    pub batch_size: Option<u32>,
    pub use_multi_model: Option<bool>,
    pub models: Option<Vec<String>>,
}

#[derive(Debug, Clone)]
pub struct VideoGenerationExecutionRequest {
    pub task_id: String,
    pub mode: String,
    pub prompt: String,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub input_refs: Vec<MediaInputRefRecord>,
    pub duration: Option<String>,
    pub resolution: Option<String>,
    pub aspect_ratio: Option<String>,
    pub style_prompt: Option<String>,
    pub options: Option<Map<String, Value>>,
}

#[derive(Debug, Clone)]
pub struct MusicGenerationExecutionRequest {
    pub task_id: String,
    pub mode: String,
    pub prompt: String,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub input_refs: Vec<MediaInputRefRecord>,
    pub title: Option<String>,
    pub lyrics: Option<String>,
    pub style: Option<String>,
    pub duration: Option<f64>,
    pub instrumental: Option<bool>,
    pub custom_mode: Option<bool>,
}

#[derive(Debug, Clone)]
pub struct GenerationExecutionResult {
    pub provider: String,
    pub provider_model: String,
    pub remote_job_id: Option<String>,
    pub artifact: GenerationArtifactRecord,
    pub provider_payload: Map<String, Value>,
}

pub trait AudioExecutionService: Send + Sync {
    fn is_configured(&self) -> bool;
    fn adapter_status(&self) -> &'static str;
    fn synthesize(&self, input: SpeechExecutionRequest) -> ServerResult<SpeechExecutionResult>;
    fn transcribe(
        &self,
        input: AudioTextExecutionRequest,
    ) -> ServerResult<AudioTextExecutionResult>;
    fn translate(&self, input: AudioTextExecutionRequest)
        -> ServerResult<AudioTextExecutionResult>;
}

pub trait GenerationExecutionService: Send + Sync {
    fn is_configured(&self) -> bool;
    fn adapter_status(&self) -> &'static str;
    fn generate_image(
        &self,
        input: ImageGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult>;
    fn generate_video(
        &self,
        input: VideoGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult>;
    fn generate_music(
        &self,
        input: MusicGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult>;
}

#[derive(Debug, Clone)]
struct AiProviderConfig {
    base_url: String,
    api_key: Option<String>,
    auth_token: Option<String>,
    access_token: Option<String>,
    default_speech_model: Option<String>,
    default_speech_voice: Option<String>,
    default_speech_format: Option<String>,
    default_transcription_model: Option<String>,
    default_transcription_format: Option<String>,
    default_translation_model: Option<String>,
    default_translation_format: Option<String>,
    default_image_model: Option<String>,
    default_image_response_format: Option<String>,
    default_video_model: Option<String>,
    default_video_response_format: Option<String>,
    default_music_model: Option<String>,
    default_music_format: Option<String>,
    default_music_response_format: Option<String>,
}

impl AiProviderConfig {
    fn from_env() -> Option<Self> {
        let base_url = normalized_env(AI_BASE_URL_ENV)?;
        let api_key = normalized_env(AI_API_KEY_ENV);
        let auth_token = normalized_env(AI_AUTH_TOKEN_ENV);
        let access_token = normalized_env(AI_ACCESS_TOKEN_ENV);

        let auth_mode_valid = api_key.is_some() || (auth_token.is_some() && access_token.is_some());
        if !auth_mode_valid {
            return None;
        }

        Some(Self {
            base_url,
            api_key,
            auth_token,
            access_token,
            default_speech_model: normalized_env(AI_DEFAULT_SPEECH_MODEL_ENV),
            default_speech_voice: normalized_env(AI_DEFAULT_SPEECH_VOICE_ENV),
            default_speech_format: normalized_env(AI_DEFAULT_SPEECH_FORMAT_ENV),
            default_transcription_model: normalized_env(AI_DEFAULT_TRANSCRIPTION_MODEL_ENV),
            default_transcription_format: normalized_env(AI_DEFAULT_TRANSCRIPTION_FORMAT_ENV),
            default_translation_model: normalized_env(AI_DEFAULT_TRANSLATION_MODEL_ENV),
            default_translation_format: normalized_env(AI_DEFAULT_TRANSLATION_FORMAT_ENV),
            default_image_model: normalized_env(AI_DEFAULT_IMAGE_MODEL_ENV),
            default_image_response_format: normalized_env(AI_DEFAULT_IMAGE_RESPONSE_FORMAT_ENV),
            default_video_model: normalized_env(AI_DEFAULT_VIDEO_MODEL_ENV),
            default_video_response_format: normalized_env(AI_DEFAULT_VIDEO_RESPONSE_FORMAT_ENV),
            default_music_model: normalized_env(AI_DEFAULT_MUSIC_MODEL_ENV),
            default_music_format: normalized_env(AI_DEFAULT_MUSIC_FORMAT_ENV),
            default_music_response_format: normalized_env(AI_DEFAULT_MUSIC_RESPONSE_FORMAT_ENV),
        })
    }
}

#[derive(Debug, Clone)]
struct ResolvedBinarySource {
    bytes: Vec<u8>,
    file_name: String,
    mime_type: String,
    source_url: Option<String>,
    source_path: Option<String>,
}

pub struct CanonicalAudioExecutionService {
    storage_paths: AppStoragePaths,
    config: Option<AiProviderConfig>,
}

impl CanonicalAudioExecutionService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            config: AiProviderConfig::from_env(),
        }
    }

    fn configuration(&self) -> ServerResult<&AiProviderConfig> {
        self.config.as_ref().ok_or_else(|| {
            ServerError::internal("an internal error occurred")
        })
    }

    fn create_ai_client(&self, config: &AiProviderConfig) -> ServerResult<SdkworkAiClient> {
        let client = SdkworkAiClient::new(SdkworkConfig::new(config.base_url.clone()))
            .map_err(map_audio_sdk_error)?;

        if let Some(api_key) = config.api_key.as_ref() {
            client.set_api_key(api_key.clone());
        } else {
            if let Some(auth_token) = config.auth_token.as_ref() {
                client.set_auth_token(auth_token.clone());
            }
            if let Some(access_token) = config.access_token.as_ref() {
                client.set_access_token(access_token.clone());
            }
        }

        Ok(client)
    }

    fn execute_speech_call(
        &self,
        client: &SdkworkAiClient,
        body: &SpeechRequest,
    ) -> ServerResult<Vec<u8>> {
        run_async(async {
            client
                .audio()
                .create_speech(body)
                .await
                .map_err(map_speech_sdk_error)
        })
    }

    fn execute_audio_text_call(
        &self,
        config: &AiProviderConfig,
        kind: AudioTextExecutionKind,
        input: &AudioTextExecutionRequest,
        source: &ResolvedBinarySource,
    ) -> ServerResult<TranscriptionResponse> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|error| {
                ServerError::internal(format!("failed to create AI audio http client: {error}"),
                )
            })?;

        let operation_label = kind.operation_label();
        let request_path = kind.request_path();
        let request_url = resolve_ai_request_url(&config.base_url, request_path);
        let query = self.build_audio_text_query(kind, config, input);
        let mime_type = normalize_optional_text(Some(source.mime_type.clone()))
            .unwrap_or_else(|| "application/octet-stream".to_string());
        let file_part = Part::bytes(source.bytes.clone())
            .file_name(source.file_name.clone())
            .mime_str(&mime_type)
            .map_err(|error| {
                ServerError::bad_request(format!("audio source mime type {mime_type} is invalid: {error}"),
                )
            })?;
        let form = Form::new().part("file", file_part);

        run_async(async move {
            let mut request = client.post(request_url).query(&query).multipart(form);
            if let Some(api_key) = config.api_key.as_ref() {
                request = request.bearer_auth(api_key);
            } else {
                if let Some(auth_token) = config.auth_token.as_ref() {
                    request = request.bearer_auth(auth_token);
                }
                if let Some(access_token) = config.access_token.as_ref() {
                    request = request.header("Access-Token", access_token);
                }
            }

            let response = request.send().await.map_err(|error| {
                ServerError::internal(format!("AI {operation_label} request failed: {error}"),
                )
            })?;
            let status = response.status();
            let body = response.bytes().await.map_err(|error| {
                ServerError::internal(format!("failed to read AI {operation_label} response: {error}"),
                )
            })?;

            if !status.is_success() {
                return Err(ServerError::internal(format!(
                        "AI {operation_label} upstream returned status {}",
                        status.as_u16()
                    ),
                )
                .with_detail(String::from_utf8_lossy(&body).to_string()));
            }

            serde_json::from_slice::<TranscriptionResponse>(&body).map_err(|error| {
                ServerError::internal(format!("failed to parse AI {operation_label} response: {error}"),
                )
            })
        })
    }

    fn resolve_audio_text_response_format(
        &self,
        kind: AudioTextExecutionKind,
        config: &AiProviderConfig,
        input: &AudioTextExecutionRequest,
    ) -> String {
        input
            .format
            .clone()
            .and_then(normalize_text)
            .or_else(|| match kind {
                AudioTextExecutionKind::Transcription => {
                    config.default_transcription_format.clone()
                }
                AudioTextExecutionKind::Translation => config.default_translation_format.clone(),
            })
            .unwrap_or_else(|| DEFAULT_AUDIO_TEXT_RESPONSE_FORMAT.to_string())
    }

    fn resolve_audio_text_model(
        &self,
        kind: AudioTextExecutionKind,
        config: &AiProviderConfig,
        input: &AudioTextExecutionRequest,
    ) -> String {
        input
            .model
            .clone()
            .and_then(normalize_text)
            .or_else(|| match kind {
                AudioTextExecutionKind::Transcription => config.default_transcription_model.clone(),
                AudioTextExecutionKind::Translation => config.default_translation_model.clone(),
            })
            .or_else(|| config.default_speech_model.clone())
            .unwrap_or_else(|| DEFAULT_AUDIO_TEXT_MODEL.to_string())
    }

    fn build_audio_text_query(
        &self,
        kind: AudioTextExecutionKind,
        config: &AiProviderConfig,
        input: &AudioTextExecutionRequest,
    ) -> Vec<(String, String)> {
        let resolved_model = self.resolve_audio_text_model(kind, config, input);
        let resolved_format = self.resolve_audio_text_response_format(kind, config, input);
        let mut query = vec![
            ("model".to_string(), resolved_model),
            ("responseFormat".to_string(), resolved_format.clone()),
            ("response_format".to_string(), resolved_format.clone()),
        ];

        if let Some(prompt) = input.prompt.clone().and_then(normalize_text) {
            query.push(("prompt".to_string(), prompt));
        }

        if let Some(temperature) = input.temperature.filter(|value| value.is_finite()) {
            query.push(("temperature".to_string(), temperature.to_string()));
        }

        if let Some(language) = input
            .language
            .clone()
            .and_then(normalize_text)
            .or_else(|| {
                input
                    .source_language
                    .clone()
                    .and_then(normalize_text)
            })
        {
            query.push(("language".to_string(), language.clone()));
            query.push(("sourceLanguage".to_string(), language));
        }

        if kind == AudioTextExecutionKind::Translation {
            if let Some(target_language) = input
                .target_language
                .clone()
                .and_then(normalize_text)
            {
                query.push(("targetLanguage".to_string(), target_language.clone()));
                query.push(("target_language".to_string(), target_language));
            }
        } else if resolved_format.eq_ignore_ascii_case("verbose_json") {
            query.push(("timestampGranularities".to_string(), "segment".to_string()));
            query.push(("timestampGranularities".to_string(), "word".to_string()));
            query.push(("timestamp_granularities".to_string(), "segment".to_string()));
            query.push(("timestamp_granularities".to_string(), "word".to_string()));
        }

        query
    }

    fn persist_speech_output(
        &self,
        namespace: &str,
        task_id: &str,
        format: &str,
        bytes: &[u8],
    ) -> ServerResult<PathBuf> {
        self.storage_paths.ensure_root_dir()?;
        let namespace_dir = self
            .storage_paths
            .generated_outputs_root_dir()
            .join(sanitize_path_segment(namespace));
        fs::create_dir_all(&namespace_dir).map_err(|error| {
            ServerError::internal(format!(
                    "failed to create speech output directory {}: {error}",
                    namespace_dir.display()
                ),
            )
        })?;

        let extension = file_extension_for_format(format);
        let output_path = namespace_dir.join(format!("{task_id}.{extension}"));
        fs::write(&output_path, bytes).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write speech output {}: {error}",
                    output_path.display()
                ),
            )
        })?;
        Ok(output_path)
    }

    fn build_speech_artifact(
        &self,
        input: &SpeechExecutionRequest,
        provider_model: &str,
        format: &str,
        bytes: &[u8],
        output_path: &Path,
    ) -> GenerationArtifactRecord {
        let artifact_id = format!("{}-artifact", input.task_id);
        let mime_type = mime_type_for_format(format).to_string();
        let file_name = format!(
            "{}-{}.{}",
            sanitize_path_segment(&input.output_name_prefix),
            input.task_id,
            file_extension_for_format(format)
        );
        let file_uri = file_uri(output_path);

        let mut metadata = Map::new();
        metadata.insert(
            "localPath".to_string(),
            Value::String(output_path.display().to_string()),
        );
        metadata.insert("fileUri".to_string(), Value::String(file_uri.clone()));
        metadata.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        metadata.insert("format".to_string(), Value::String(format.to_string()));
        metadata.insert(
            "providerModel".to_string(),
            Value::String(provider_model.to_string()),
        );
        if let Some(size_bytes) = u64_to_json_number(bytes.len() as u64) {
            metadata.insert("sizeBytes".to_string(), Value::Number(size_bytes));
        }
        if let Some(language) = input.language.clone().and_then(normalize_text) {
            metadata.insert("language".to_string(), Value::String(language));
        }
        if let Some(voice) = input.voice.clone().and_then(normalize_text) {
            metadata.insert("voice".to_string(), Value::String(voice));
        }

        GenerationArtifactRecord {
            id: artifact_id.clone(),
            uuid: format!("client-entity:{artifact_id}"),
            r#type: "audio".to_string(),
            role: "primary".to_string(),
            asset_id: None,
            asset_uuid: None,
            primary_resource_id: None,
            primary_resource_uuid: None,
            resource_view_id: None,
            resource_view_uuid: None,
            url: file_uri,
            poster_url: None,
            mime_type: Some(mime_type),
            name: file_name,
            width: None,
            height: None,
            duration: None,
            metadata: Some(metadata),
        }
    }

    fn build_audio_text_artifact(
        &self,
        kind: AudioTextExecutionKind,
        input: &AudioTextExecutionRequest,
        provider_model: &str,
        response_format: &str,
        source: &ResolvedBinarySource,
        response: &TranscriptionResponse,
    ) -> ServerResult<GenerationArtifactRecord> {
        let text = response
            .text
            .clone()
            .and_then(normalize_text)
            .ok_or_else(|| {
                ServerError::internal(format!(
                        "AI {} execution returned an empty text response",
                        kind.operation_label()
                    ),
                )
            })?;
        let artifact_id = format!("{}-artifact", input.task_id);
        let task_label = kind.task_label();
        let file_name = format!(
            "{}-{}.txt",
            sanitize_path_segment(&input.output_name_prefix),
            input.task_id
        );
        let mut metadata = Map::new();
        metadata.insert("text".to_string(), Value::String(text.clone()));
        metadata.insert("content".to_string(), Value::String(text.clone()));
        metadata.insert("task".to_string(), Value::String(task_label.to_string()));
        metadata.insert(
            "responseFormat".to_string(),
            Value::String(response_format.to_string()),
        );
        metadata.insert(
            "providerModel".to_string(),
            Value::String(provider_model.to_string()),
        );
        metadata.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        metadata.insert(
            "sourceAudioName".to_string(),
            Value::String(source.file_name.clone()),
        );
        metadata.insert(
            "sourceAudioMimeType".to_string(),
            Value::String(source.mime_type.clone()),
        );
        if let Some(source_url) = source.source_url.clone().and_then(normalize_text) {
            metadata.insert("sourceAudioUrl".to_string(), Value::String(source_url));
        }
        if let Some(source_path) = source.source_path.clone().and_then(normalize_text) {
            metadata.insert("sourceAudioPath".to_string(), Value::String(source_path));
        }
        if let Some(language) = response
            .language
            .clone()
            .and_then(normalize_text)
            .or_else(|| input.language.clone().and_then(normalize_text))
            .or_else(|| {
                input
                    .source_language
                    .clone()
                    .and_then(normalize_text)
            })
            .or_else(|| {
                input
                    .target_language
                    .clone()
                    .and_then(normalize_text)
            })
        {
            metadata.insert("language".to_string(), Value::String(language));
        }
        if let Some(duration) = response
            .duration
            .filter(|value| value.is_finite() && *value >= 0.0)
        {
            if let Some(value) = serde_json::Number::from_f64(duration) {
                metadata.insert("duration".to_string(), Value::Number(value));
            }
        }
        if let Some(target_language) = input
            .target_language
            .clone()
            .and_then(normalize_text)
        {
            metadata.insert("targetLanguage".to_string(), Value::String(target_language));
        }
        if let Some(source_language) = input
            .source_language
            .clone()
            .and_then(normalize_text)
        {
            metadata.insert("sourceLanguage".to_string(), Value::String(source_language));
        }
        match kind {
            AudioTextExecutionKind::Transcription => {
                metadata.insert("transcript".to_string(), Value::String(text.clone()));
                metadata.insert("transcription".to_string(), Value::String(text.clone()));
            }
            AudioTextExecutionKind::Translation => {
                metadata.insert("translatedText".to_string(), Value::String(text.clone()));
            }
        }
        if let Some(segments) = response
            .segments
            .clone()
            .and_then(|value| serde_json::to_value(value).ok())
        {
            metadata.insert("segments".to_string(), segments);
        }
        if let Some(words) = response
            .words
            .clone()
            .and_then(|value| serde_json::to_value(value).ok())
        {
            metadata.insert("words".to_string(), words);
        }

        Ok(GenerationArtifactRecord {
            id: artifact_id.clone(),
            uuid: format!("client-entity:{artifact_id}"),
            r#type: "text".to_string(),
            role: "primary".to_string(),
            asset_id: None,
            asset_uuid: None,
            primary_resource_id: None,
            primary_resource_uuid: None,
            resource_view_id: None,
            resource_view_uuid: None,
            url: build_text_data_url(&text),
            poster_url: None,
            mime_type: Some("text/plain".to_string()),
            name: file_name,
            width: None,
            height: None,
            duration: response
                .duration
                .filter(|value| value.is_finite() && *value >= 0.0),
            metadata: Some(metadata),
        })
    }

    fn execute_audio_text(
        &self,
        kind: AudioTextExecutionKind,
        input: AudioTextExecutionRequest,
    ) -> ServerResult<AudioTextExecutionResult> {
        let config = self.configuration()?;
        let source = resolve_binary_source(&input.source_audio)?;
        let response_format = self.resolve_audio_text_response_format(kind, config, &input);
        let provider_model = self.resolve_audio_text_model(kind, config, &input);
        let response = self.execute_audio_text_call(config, kind, &input, &source)?;
        let artifact = self.build_audio_text_artifact(
            kind,
            &input,
            &provider_model,
            &response_format,
            &source,
            &response,
        )?;
        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("generated-ai-sdk".to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        provider_payload.insert(
            "provider".to_string(),
            Value::String("sdkwork-ai-api".to_string()),
        );
        provider_payload.insert(
            "baseUrl".to_string(),
            Value::String(config.base_url.clone()),
        );
        provider_payload.insert(
            "task".to_string(),
            Value::String(kind.task_label().to_string()),
        );
        provider_payload.insert("responseFormat".to_string(), Value::String(response_format));
        if let Some(source_url) = source.source_url.clone().and_then(normalize_text) {
            provider_payload.insert("sourceAudioUrl".to_string(), Value::String(source_url));
        }
        if let Some(source_path) = source.source_path.clone().and_then(normalize_text) {
            provider_payload.insert("sourceAudioPath".to_string(), Value::String(source_path));
        }
        provider_payload.insert(
            "sourceAudioName".to_string(),
            Value::String(source.file_name),
        );
        provider_payload.insert(
            "sourceAudioMimeType".to_string(),
            Value::String(source.mime_type),
        );
        if let Some(language) = response.language.clone().and_then(normalize_text) {
            provider_payload.insert("language".to_string(), Value::String(language));
        }
        if let Some(duration) = response
            .duration
            .filter(|value| value.is_finite() && *value >= 0.0)
        {
            if let Some(number) = serde_json::Number::from_f64(duration) {
                provider_payload.insert("duration".to_string(), Value::Number(number));
            }
        }
        if let Some(text) = artifact
            .metadata
            .as_ref()
            .and_then(|metadata| metadata.get("text"))
            .and_then(Value::as_str)
            .map(str::to_string)
        {
            provider_payload.insert("text".to_string(), Value::String(text));
        }
        if let Some(segments) = response
            .segments
            .clone()
            .and_then(|value| serde_json::to_value(value).ok())
        {
            provider_payload.insert("segments".to_string(), segments);
        }
        if let Some(words) = response
            .words
            .clone()
            .and_then(|value| serde_json::to_value(value).ok())
        {
            provider_payload.insert("words".to_string(), words);
        }
        if let Some(extra) = input.extra {
            provider_payload.extend(extra);
        }

        Ok(AudioTextExecutionResult {
            provider: "sdkwork-ai-api".to_string(),
            provider_model,
            artifact,
            provider_payload,
        })
    }
}

impl AudioExecutionService for CanonicalAudioExecutionService {
    fn is_configured(&self) -> bool {
        self.config.is_some()
    }

    fn adapter_status(&self) -> &'static str {
        if self.is_configured() {
            AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK
        } else {
            "not-configured"
        }
    }

    fn synthesize(&self, input: SpeechExecutionRequest) -> ServerResult<SpeechExecutionResult> {
        let config = self.configuration()?;
        let client = self.create_ai_client(config)?;

        let resolved_model = input
            .model
            .clone()
            .and_then(normalize_text)
            .or_else(|| config.default_speech_model.clone())
            .unwrap_or_else(|| "default".to_string());
        let resolved_voice = input
            .voice
            .clone()
            .and_then(normalize_text)
            .or_else(|| config.default_speech_voice.clone());
        let resolved_format = input
            .format
            .clone()
            .and_then(normalize_text)
            .or_else(|| config.default_speech_format.clone())
            .unwrap_or_else(|| "mp3".to_string());

        let mut extra = map_to_hash_map(input.extra.clone());
        if let Some(language) = input.language.clone().and_then(normalize_text) {
            extra.insert("language".to_string(), Value::String(language));
        }

        let request = SpeechRequest {
            model: normalize_optional_text(Some(resolved_model.clone())),
            input: Some(input.text.clone()),
            voice: resolved_voice.clone(),
            speed: input.speed,
            extra: if extra.is_empty() { None } else { Some(extra) },
            response_format: Some(resolved_format.clone()),
        };

        let bytes = self.execute_speech_call(&client, &request)?;
        if bytes.is_empty() {
            return Err(ServerError::internal("an internal error occurred"));
        }

        let output_path = self.persist_speech_output(
            &input.output_namespace,
            &input.task_id,
            &resolved_format,
            &bytes,
        )?;

        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("generated-ai-sdk".to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        provider_payload.insert(
            "provider".to_string(),
            Value::String("sdkwork-ai-api".to_string()),
        );
        provider_payload.insert(
            "baseUrl".to_string(),
            Value::String(config.base_url.clone()),
        );
        provider_payload.insert(
            "responseFormat".to_string(),
            Value::String(resolved_format.clone()),
        );
        provider_payload.insert(
            "outputPath".to_string(),
            Value::String(output_path.display().to_string()),
        );
        provider_payload.insert(
            "outputUri".to_string(),
            Value::String(file_uri(&output_path)),
        );
        if let Some(size_bytes) = u64_to_json_number(bytes.len() as u64) {
            provider_payload.insert("sizeBytes".to_string(), Value::Number(size_bytes));
        }
        if let Some(voice) = resolved_voice.clone() {
            provider_payload.insert("voice".to_string(), Value::String(voice));
        }

        let artifact = self.build_speech_artifact(
            &input,
            &resolved_model,
            &resolved_format,
            &bytes,
            &output_path,
        );

        Ok(SpeechExecutionResult {
            provider: "sdkwork-ai-api".to_string(),
            provider_model: resolved_model,
            artifact,
            provider_payload,
        })
    }

    fn transcribe(
        &self,
        input: AudioTextExecutionRequest,
    ) -> ServerResult<AudioTextExecutionResult> {
        self.execute_audio_text(AudioTextExecutionKind::Transcription, input)
    }

    fn translate(
        &self,
        input: AudioTextExecutionRequest,
    ) -> ServerResult<AudioTextExecutionResult> {
        self.execute_audio_text(AudioTextExecutionKind::Translation, input)
    }
}

pub struct CanonicalGenerationExecutionService {
    storage_paths: AppStoragePaths,
    config: Option<AiProviderConfig>,
    media_service: Arc<dyn MediaService>,
}

impl CanonicalGenerationExecutionService {
    pub fn new(storage_paths: AppStoragePaths, media_service: Arc<dyn MediaService>) -> Self {
        Self {
            storage_paths,
            config: AiProviderConfig::from_env(),
            media_service,
        }
    }

    fn configuration(&self) -> ServerResult<&AiProviderConfig> {
        self.config.as_ref().ok_or_else(|| {
            ServerError::internal("an internal error occurred")
        })
    }

    fn create_ai_client(&self, config: &AiProviderConfig) -> ServerResult<SdkworkAiClient> {
        let client = SdkworkAiClient::new(SdkworkConfig::new(config.base_url.clone()))
            .map_err(map_generation_sdk_error)?;

        if let Some(api_key) = config.api_key.as_ref() {
            client.set_api_key(api_key.clone());
        } else {
            if let Some(auth_token) = config.auth_token.as_ref() {
                client.set_auth_token(auth_token.clone());
            }
            if let Some(access_token) = config.access_token.as_ref() {
                client.set_access_token(access_token.clone());
            }
        }

        Ok(client)
    }

    fn resolve_image_model(
        &self,
        config: &AiProviderConfig,
        input: &ImageGenerationExecutionRequest,
    ) -> String {
        input
            .model
            .clone()
            .and_then(normalize_text)
            .or_else(|| config.default_image_model.clone())
            .unwrap_or_else(|| "default".to_string())
    }

    fn resolve_image_response_format(&self, config: &AiProviderConfig) -> String {
        config
            .default_image_response_format
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| DEFAULT_IMAGE_RESPONSE_FORMAT.to_string())
    }

    fn resolve_video_model(
        &self,
        config: &AiProviderConfig,
        input: &VideoGenerationExecutionRequest,
    ) -> String {
        input
            .model
            .clone()
            .and_then(normalize_text)
            .or_else(|| config.default_video_model.clone())
            .unwrap_or_else(|| "default".to_string())
    }

    fn resolve_video_response_format(&self, config: &AiProviderConfig) -> String {
        config
            .default_video_response_format
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| DEFAULT_VIDEO_RESPONSE_FORMAT.to_string())
    }

    fn resolve_music_model(
        &self,
        config: &AiProviderConfig,
        input: &MusicGenerationExecutionRequest,
    ) -> String {
        input
            .model
            .clone()
            .and_then(normalize_text)
            .or_else(|| config.default_music_model.clone())
            .unwrap_or_else(|| "default".to_string())
    }

    fn resolve_music_format(&self, config: &AiProviderConfig) -> String {
        config
            .default_music_format
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| DEFAULT_MUSIC_FORMAT.to_string())
    }

    fn resolve_music_response_format(&self, config: &AiProviderConfig) -> String {
        config
            .default_music_response_format
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| DEFAULT_MUSIC_RESPONSE_FORMAT.to_string())
    }

    fn build_image_request(
        &self,
        config: &AiProviderConfig,
        input: &ImageGenerationExecutionRequest,
    ) -> ServerResult<AiImageGenerationRequest> {
        let prompt = input.prompt.clone().and_then(normalize_text);
        let reference_images = resolve_media_input_reference_values(&input.input_refs)?;
        if prompt.is_none() {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let mut extra = HashMap::<String, Value>::new();
        insert_json_string(&mut extra, "mode", Some(input.mode.clone()));
        insert_json_string(&mut extra, "aspectRatio", input.aspect_ratio.clone());
        insert_json_number(&mut extra, "steps", input.steps);
        insert_json_number(&mut extra, "guidance", input.guidance);
        insert_json_number(&mut extra, "seed", input.seed);
        insert_json_string(&mut extra, "styleId", input.style_id.clone());
        insert_json_number(
            &mut extra,
            "batchSize",
            input.batch_size.map(|value| value as f64),
        );
        insert_json_bool(&mut extra, "useMultiModel", input.use_multi_model);
        insert_json_array(&mut extra, "models", input.models.clone());
        insert_json_string(&mut extra, "negativePrompt", input.negative_prompt.clone());

        Ok(AiImageGenerationRequest {
            model: Some(self.resolve_image_model(config, input)),
            prompt,
            n: input
                .batch_size
                .map(|value| value as i64)
                .filter(|value| *value > 0),
            quality: input.quality.clone().and_then(normalize_text),
            size: build_size_string(input.width, input.height),
            style: input.style.clone().and_then(normalize_text),
            user: None,
            image: if reference_images.is_empty() {
                None
            } else {
                Some(reference_images)
            },
            extra: if extra.is_empty() { None } else { Some(extra) },
            response_format: Some(self.resolve_image_response_format(config)),
        })
    }

    fn execute_image_call(
        &self,
        client: &SdkworkAiClient,
        body: &AiImageGenerationRequest,
    ) -> ServerResult<ImageGenerationResponse> {
        run_async(async {
            client
                .image()
                .create_image_generations(body)
                .await
                .map_err(map_generation_sdk_error)
        })
    }

    fn execute_image_multipart_call(
        &self,
        config: &AiProviderConfig,
        path: &str,
        form: Form,
        operation_label: &str,
    ) -> ServerResult<ImageGenerationResponse> {
        let client = Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .map_err(|error| {
                ServerError::internal(format!("failed to create AI image http client: {error}"),
                )
            })?;
        let request_url = resolve_ai_request_url(&config.base_url, path);

        run_async(async move {
            let mut request = client.post(request_url).multipart(form);
            if let Some(api_key) = config.api_key.as_ref() {
                request = request.bearer_auth(api_key);
            } else {
                if let Some(auth_token) = config.auth_token.as_ref() {
                    request = request.bearer_auth(auth_token);
                }
                if let Some(access_token) = config.access_token.as_ref() {
                    request = request.header("Access-Token", access_token);
                }
            }

            let response = request.send().await.map_err(|error| {
                ServerError::internal(format!("AI {operation_label} request failed: {error}"),
                )
            })?;
            let status = response.status();
            let body = response.bytes().await.map_err(|error| {
                ServerError::internal(format!("failed to read AI {operation_label} response: {error}"),
                )
            })?;

            if !status.is_success() {
                return Err(ServerError::internal(format!(
                        "AI {operation_label} upstream returned status {}",
                        status.as_u16()
                    ),
                )
                .with_detail(String::from_utf8_lossy(&body).to_string()));
            }

            serde_json::from_slice::<ImageGenerationResponse>(&body).map_err(|error| {
                ServerError::internal(format!("failed to parse AI {operation_label} response: {error}"),
                )
            })
        })
    }

    fn build_multipart_binary_part(&self, source: &ResolvedBinarySource) -> ServerResult<Part> {
        let mime_type = normalize_optional_text(Some(source.mime_type.clone()))
            .unwrap_or_else(|| "application/octet-stream".to_string());
        Part::bytes(source.bytes.clone())
            .file_name(source.file_name.clone())
            .mime_str(&mime_type)
            .map_err(|error| {
                ServerError::bad_request(format!("image source mime type {mime_type} is invalid: {error}"),
                )
            })
    }

    fn execute_image_variation_call(
        &self,
        config: &AiProviderConfig,
        input: &ImageGenerationExecutionRequest,
    ) -> ServerResult<ImageGenerationResponse> {
        let source = input
            .input_refs
            .first()
            .ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })
            .and_then(resolve_binary_source)?;
        let mut form = Form::new()
            .part("image", self.build_multipart_binary_part(&source)?)
            .text("model", self.resolve_image_model(config, input))
            .text(
                "response_format",
                self.resolve_image_response_format(config),
            );
        if let Some(size) = build_size_string(input.width, input.height) {
            form = form.text("size", size);
        }
        if let Some(count) = input.batch_size.filter(|value| *value > 0) {
            form = form.text("n", count.to_string());
        }

        self.execute_image_multipart_call(
            config,
            "/ai/v3/images/variations",
            form,
            "image variation",
        )
    }

    fn execute_image_edit_call(
        &self,
        config: &AiProviderConfig,
        input: &ImageGenerationExecutionRequest,
    ) -> ServerResult<ImageGenerationResponse> {
        let source = input
            .input_refs
            .first()
            .ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })
            .and_then(resolve_binary_source)?;
        let prompt = input
            .prompt
            .clone()
            .and_then(normalize_text)
            .ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })?;
        let mut form = Form::new()
            .part("image", self.build_multipart_binary_part(&source)?)
            .text("model", self.resolve_image_model(config, input))
            .text("prompt", prompt)
            .text(
                "response_format",
                self.resolve_image_response_format(config),
            );
        if let Some(mask) = input
            .input_refs
            .get(1)
            .map(resolve_binary_source)
            .transpose()?
        {
            form = form.part("mask", self.build_multipart_binary_part(&mask)?);
        }
        if let Some(size) = build_size_string(input.width, input.height) {
            form = form.text("size", size);
        }
        if let Some(count) = input.batch_size.filter(|value| *value > 0) {
            form = form.text("n", count.to_string());
        }

        self.execute_image_multipart_call(config, "/ai/v3/images/edits", form, "image edit")
    }

    fn build_image_artifact(
        &self,
        input: &ImageGenerationExecutionRequest,
        image: &ImageData,
        response_format: &str,
    ) -> ServerResult<GenerationArtifactRecord> {
        let artifact_id = format!("{}-artifact", input.task_id);
        let fallback_name = format!("generated-image-{}.png", input.task_id);
        let revised_prompt = image
            .revised_prompt
            .clone()
            .and_then(normalize_text);

        let (url, mime_type, file_name, local_path) = if let Some(url) =
            image.url.clone().and_then(normalize_text)
        {
            let mime_type = infer_mime_type_from_locator(Some(url.as_str()))
                .unwrap_or_else(|| "image/png".to_string());
            let file_name = file_name_from_locator(Some(url.as_str())).unwrap_or(fallback_name);
            (url, mime_type, file_name, None)
        } else if let Some(b64_json) = image.b64_json.clone().and_then(normalize_text) {
            let bytes = encoding::base64_decode(&b64_json).ok_or_else(|| {
                    ServerError::internal("failed to decode AI image base64 payload".to_string(),
                    )
                })?;
            let file_name = fallback_name;
            let output_path = persist_binary_output(
                &self.storage_paths,
                "generation-images",
                &input.task_id,
                &file_name,
                &bytes,
            )?;
            (
                file_uri(&output_path),
                "image/png".to_string(),
                file_name,
                Some(output_path.display().to_string()),
            )
        } else {
            return Err(ServerError::internal("an internal error occurred"));
        };

        let mut metadata = Map::new();
        metadata.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        metadata.insert("mode".to_string(), Value::String(input.mode.clone()));
        metadata.insert(
            "responseFormat".to_string(),
            Value::String(response_format.to_string()),
        );
        if let Some(prompt) = revised_prompt {
            metadata.insert("revisedPrompt".to_string(), Value::String(prompt));
        }
        if let Some(local_path) = local_path {
            metadata.insert("localPath".to_string(), Value::String(local_path));
        }
        if let Some(aspect_ratio) = input.aspect_ratio.clone().and_then(normalize_text) {
            metadata.insert("aspectRatio".to_string(), Value::String(aspect_ratio));
        }

        Ok(GenerationArtifactRecord {
            id: artifact_id.clone(),
            uuid: format!("client-entity:{artifact_id}"),
            r#type: "image".to_string(),
            role: "primary".to_string(),
            asset_id: None,
            asset_uuid: None,
            primary_resource_id: None,
            primary_resource_uuid: None,
            resource_view_id: None,
            resource_view_uuid: None,
            url,
            poster_url: None,
            mime_type: Some(mime_type),
            name: file_name,
            width: input.width,
            height: input.height,
            duration: None,
            metadata: Some(metadata),
        })
    }

    fn media_runtime_ready(&self) -> bool {
        self.media_service
            .media_command_available()
            .unwrap_or(false)
    }

    fn execute_host_image_upscale(
        &self,
        input: &ImageGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult> {
        if !self.media_runtime_ready() {
            return Err(ServerError::internal("an internal error occurred"));
        }

        if input.batch_size == Some(0) {
            return Err(ServerError::bad_request("request validation failed"));
        }

        if input.batch_size.unwrap_or(1) > 1 {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let source_input = input.input_refs.first().ok_or_else(|| {
            ServerError::bad_request("request validation failed")
        })?;
        let source = resolve_binary_source(source_input)?;
        let normalized_source_mime = source.mime_type.trim().to_ascii_lowercase();
        if normalized_source_mime.starts_with("audio/")
            || normalized_source_mime.starts_with("video/")
        {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let staged_input_path = persist_binary_output(
            &self.storage_paths,
            "generation-image-sources",
            &input.task_id,
            &source.file_name,
            &source.bytes,
        )?;
        let staged_input_path_string = staged_input_path.display().to_string();
        let probe = self
            .media_service
            .media_probe(staged_input_path_string.clone())?;
        let (source_width, source_height) =
            extract_probed_image_dimensions(&probe).ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })?;
        let (target_width, target_height, resolved_scale) =
            resolve_image_upscale_dimensions(input, source_width, source_height)?;
        let output_extension = resolve_image_output_extension(
            input.format.clone(),
            &source.mime_type,
            &source.file_name,
        )?;
        let output_file_name = format!(
            "{}-upscaled.{output_extension}",
            file_stem_from_name(&source.file_name, "upscaled-image")
        );
        let output_path = prepare_binary_output_path(
            &self.storage_paths,
            "generation-images",
            &input.task_id,
            &output_file_name,
        )?;
        let output_path_string = output_path.display().to_string();
        let resize_result = self.media_service.image_resize(ImageResizeRequest {
            input_path: staged_input_path_string.clone(),
            output_path: output_path_string.clone(),
            width: target_width,
            height: target_height,
            overwrite: Some(true),
        })?;
        ensure_media_command_succeeded(
            &resize_result,
            "APP_HOST_IMAGE_UPSCALE_FAILED",
            "host-local image upscale failed",
        )?;

        let output_uri = file_uri(&output_path);
        let output_mime_type = mime_type_for_media_extension(&output_extension).to_string();
        let artifact_id = format!("{}-artifact", input.task_id);
        let mut artifact_metadata = Map::new();
        artifact_metadata.insert(
            "adapterStatus".to_string(),
            Value::String(GENERATION_ADAPTER_STATUS_HOST_LOCAL.to_string()),
        );
        artifact_metadata.insert("mode".to_string(), Value::String(input.mode.clone()));
        artifact_metadata.insert(
            "localPath".to_string(),
            Value::String(output_path_string.clone()),
        );
        artifact_metadata.insert("fileUri".to_string(), Value::String(output_uri.clone()));
        artifact_metadata.insert(
            "stagedInputPath".to_string(),
            Value::String(staged_input_path_string.clone()),
        );
        artifact_metadata.insert(
            "sourceWidth".to_string(),
            Value::Number(
                u64_to_json_number(source_width as u64).expect("u32 width always fits json u64"),
            ),
        );
        artifact_metadata.insert(
            "sourceHeight".to_string(),
            Value::Number(
                u64_to_json_number(source_height as u64).expect("u32 height always fits json u64"),
            ),
        );
        artifact_metadata.insert(
            "targetWidth".to_string(),
            Value::Number(
                u64_to_json_number(target_width as u64).expect("u32 width always fits json u64"),
            ),
        );
        artifact_metadata.insert(
            "targetHeight".to_string(),
            Value::Number(
                u64_to_json_number(target_height as u64).expect("u32 height always fits json u64"),
            ),
        );
        artifact_metadata.insert(
            "format".to_string(),
            Value::String(output_extension.clone()),
        );
        if let Some(scale) = resolved_scale {
            artifact_metadata.insert(
                "scale".to_string(),
                Value::Number(
                    u64_to_json_number(scale as u64).expect("u32 scale always fits json u64"),
                ),
            );
        }
        if let Some(source_url) = source.source_url.clone().and_then(normalize_text) {
            artifact_metadata.insert("sourceUrl".to_string(), Value::String(source_url));
        }
        if let Some(source_path) = source.source_path.clone().and_then(normalize_text) {
            artifact_metadata.insert("sourcePath".to_string(), Value::String(source_path));
        }

        let artifact = GenerationArtifactRecord {
            id: artifact_id.clone(),
            uuid: format!("client-entity:{artifact_id}"),
            r#type: "image".to_string(),
            role: "primary".to_string(),
            asset_id: None,
            asset_uuid: None,
            primary_resource_id: None,
            primary_resource_uuid: None,
            resource_view_id: None,
            resource_view_uuid: None,
            url: output_uri.clone(),
            poster_url: None,
            mime_type: Some(output_mime_type),
            name: Path::new(&output_path_string)
                .file_name()
                .and_then(|value| value.to_str())
                .map(str::to_string)
                .unwrap_or(output_file_name),
            width: Some(target_width),
            height: Some(target_height),
            duration: None,
            metadata: Some(artifact_metadata),
        };

        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String(GENERATION_ADAPTER_STATUS_HOST_LOCAL.to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(GENERATION_ADAPTER_STATUS_HOST_LOCAL.to_string()),
        );
        provider_payload.insert(
            "provider".to_string(),
            Value::String("magic-studio-server".to_string()),
        );
        provider_payload.insert(
            "endpoint".to_string(),
            Value::String("images/upscales".to_string()),
        );
        provider_payload.insert(
            "stagedInputPath".to_string(),
            Value::String(staged_input_path_string),
        );
        provider_payload.insert("outputPath".to_string(), Value::String(output_path_string));
        provider_payload.insert("outputUri".to_string(), Value::String(output_uri));
        provider_payload.insert(
            "format".to_string(),
            Value::String(output_extension.to_string()),
        );
        provider_payload.insert(
            "sourceMimeType".to_string(),
            Value::String(source.mime_type.clone()),
        );
        if let Some(scale) = resolved_scale {
            provider_payload.insert(
                "scale".to_string(),
                Value::Number(
                    u64_to_json_number(scale as u64).expect("u32 scale always fits json u64"),
                ),
            );
        }
        if let Some(model_hint) = input.model.clone().and_then(normalize_text) {
            provider_payload.insert("requestedModelHint".to_string(), Value::String(model_hint));
        }
        if let Some(source_url) = source.source_url.and_then(normalize_text) {
            provider_payload.insert("sourceUrl".to_string(), Value::String(source_url));
        }
        if let Some(source_path) = source.source_path.and_then(normalize_text) {
            provider_payload.insert("sourcePath".to_string(), Value::String(source_path));
        }

        Ok(GenerationExecutionResult {
            provider: "magic-studio-server".to_string(),
            provider_model: "host-local-upscale".to_string(),
            remote_job_id: None,
            artifact,
            provider_payload,
        })
    }

    fn build_video_request(
        &self,
        config: &AiProviderConfig,
        input: &VideoGenerationExecutionRequest,
    ) -> ServerResult<AiVideoGenerationRequest> {
        let prompt = require_non_empty_text(
            &compose_video_prompt(&input.prompt, input.style_prompt.as_deref()),
            "APP_AI_VIDEO_PROMPT_REQUIRED",
            "prompt",
        )?;
        let image_urls = resolve_media_input_reference_values(&input.input_refs)?;
        let (width, height) = input
            .resolution
            .as_deref()
            .and_then(parse_resolution)
            .unwrap_or((None, None));

        Ok(AiVideoGenerationRequest {
            prompt,
            model: Some(self.resolve_video_model(config, input)),
            seconds: input.duration.clone().and_then(normalize_text),
            size: input.resolution.clone().and_then(normalize_text),
            quality: map_object_string(input.options.as_ref(), &["quality"]),
            width,
            height,
            seed: map_object_number(input.options.as_ref(), &["seed"])
                .map(|value| value.round() as i64),
            user: None,
            negative_prompt: input
                .negative_prompt
                .clone()
                .and_then(normalize_text),
            image_urls: if image_urls.is_empty() {
                None
            } else {
                Some(image_urls)
            },
            aspect_ratio: input.aspect_ratio.clone().and_then(normalize_text),
            response_format: Some(self.resolve_video_response_format(config)),
        })
    }

    fn execute_video_call(
        &self,
        client: &SdkworkAiClient,
        body: &AiVideoGenerationRequest,
    ) -> ServerResult<OpenAiVideo> {
        run_async(async {
            client
                .video()
                .create_video_generations2(body)
                .await
                .map_err(map_generation_sdk_error)
        })
    }

    fn poll_video_result(
        &self,
        client: &SdkworkAiClient,
        video_id: &str,
    ) -> ServerResult<OpenAiVideo> {
        let video_id = video_id.to_string();
        run_async(async move {
            for _ in 0..DEFAULT_GENERATION_POLL_ATTEMPTS {
                let video = client
                    .video()
                    .retrieve(&video_id)
                    .await
                    .map_err(map_generation_sdk_error)?;
                if video
                    .output_url
                    .clone()
                    .and_then(normalize_text)
                    .is_some()
                    || video_terminal_failure(&video)
                {
                    return Ok(video);
                }
                sleep(Duration::from_millis(DEFAULT_GENERATION_POLL_INTERVAL_MS)).await;
            }

            client
                .video()
                .retrieve(&video_id)
                .await
                .map_err(map_generation_sdk_error)
        })
    }

    fn build_video_artifact(
        &self,
        input: &VideoGenerationExecutionRequest,
        video: &OpenAiVideo,
        response_format: &str,
    ) -> ServerResult<GenerationArtifactRecord> {
        let output_url = video
            .output_url
            .clone()
            .and_then(normalize_text)
            .ok_or_else(|| {
                ServerError::internal("an internal error occurred")
            })?;
        let artifact_id = format!("{}-artifact", input.task_id);
        let file_name = file_name_from_locator(Some(output_url.as_str()))
            .unwrap_or_else(|| format!("generated-video-{}.mp4", input.task_id));
        let mime_type = infer_mime_type_from_locator(Some(output_url.as_str()))
            .unwrap_or_else(|| "video/mp4".to_string());
        let mut metadata = Map::new();
        metadata.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        metadata.insert("mode".to_string(), Value::String(input.mode.clone()));
        metadata.insert(
            "responseFormat".to_string(),
            Value::String(response_format.to_string()),
        );
        if let Some(size) = video.size.clone().and_then(normalize_text) {
            metadata.insert("size".to_string(), Value::String(size));
        }
        if let Some(quality) = video.quality.clone().and_then(normalize_text) {
            metadata.insert("quality".to_string(), Value::String(quality));
        }

        Ok(GenerationArtifactRecord {
            id: artifact_id.clone(),
            uuid: format!("client-entity:{artifact_id}"),
            r#type: "video".to_string(),
            role: "primary".to_string(),
            asset_id: None,
            asset_uuid: None,
            primary_resource_id: None,
            primary_resource_uuid: None,
            resource_view_id: None,
            resource_view_uuid: None,
            url: output_url,
            poster_url: None,
            mime_type: Some(mime_type),
            name: file_name,
            width: None,
            height: None,
            duration: video.seconds.as_deref().and_then(parse_duration_seconds),
            metadata: Some(metadata),
        })
    }

    fn build_music_request(
        &self,
        config: &AiProviderConfig,
        input: &MusicGenerationExecutionRequest,
    ) -> ServerResult<AiMusicGenerationRequest> {
        let mut metadata = HashMap::<String, String>::new();
        if let Some(title) = input.title.clone().and_then(normalize_text) {
            metadata.insert("title".to_string(), title);
        }
        if let Some(custom_mode) = input.custom_mode {
            metadata.insert("customMode".to_string(), custom_mode.to_string());
        }
        if let Some(instrumental) = input.instrumental {
            metadata.insert("instrumental".to_string(), instrumental.to_string());
        }
        metadata.insert("mode".to_string(), input.mode.clone());
        let reference_audio = resolve_music_reference_audio(&input.input_refs)?;

        Ok(AiMusicGenerationRequest {
            model: self.resolve_music_model(config, input),
            prompt: compose_music_prompt(input),
            duration: input
                .duration
                .filter(|value| value.is_finite() && *value > 0.0)
                .map(|value| value.round() as i64),
            format: Some(self.resolve_music_format(config)),
            n: Some(1),
            style: input.style.clone().and_then(normalize_text),
            metadata: if metadata.is_empty() {
                None
            } else {
                Some(metadata)
            },
            negative_prompt: input
                .negative_prompt
                .clone()
                .and_then(normalize_text),
            response_format: Some(self.resolve_music_response_format(config)),
            reference_audio,
        })
    }

    fn execute_music_call(
        &self,
        client: &SdkworkAiClient,
        body: &AiMusicGenerationRequest,
    ) -> ServerResult<SunoMusic> {
        run_async(async {
            client
                .music()
                .create_generate(body)
                .await
                .map_err(map_generation_sdk_error)
        })
    }

    fn poll_music_result(
        &self,
        client: &SdkworkAiClient,
        music_id: &str,
    ) -> ServerResult<SunoMusic> {
        let music_id = music_id.to_string();
        run_async(async move {
            for _ in 0..DEFAULT_GENERATION_POLL_ATTEMPTS {
                let music = client
                    .music()
                    .retrieve(&music_id)
                    .await
                    .map_err(map_generation_sdk_error)?;
                if music
                    .audio_url
                    .clone()
                    .and_then(normalize_text)
                    .is_some()
                    || music_terminal_failure(&music)
                {
                    return Ok(music);
                }
                sleep(Duration::from_millis(DEFAULT_GENERATION_POLL_INTERVAL_MS)).await;
            }

            client
                .music()
                .retrieve(&music_id)
                .await
                .map_err(map_generation_sdk_error)
        })
    }

    fn build_music_artifact(
        &self,
        input: &MusicGenerationExecutionRequest,
        music: &SunoMusic,
        format: &str,
    ) -> ServerResult<GenerationArtifactRecord> {
        let output_url = music
            .audio_url
            .clone()
            .and_then(normalize_text)
            .ok_or_else(|| {
                ServerError::internal("an internal error occurred")
            })?;
        let artifact_id = format!("{}-artifact", input.task_id);
        let title = input
            .title
            .clone()
            .and_then(normalize_text)
            .or_else(|| music.title.clone().and_then(normalize_text))
            .unwrap_or_else(|| "Generated Music".to_string());
        let extension = file_extension_for_media_format(format, "mp3");
        let file_name = format!(
            "{}-{}.{}",
            sanitize_path_segment(&title),
            input.task_id,
            extension
        );
        let mime_type = infer_mime_type_from_locator(Some(output_url.as_str()))
            .unwrap_or_else(|| mime_type_for_media_extension(extension).to_string());
        let mut metadata = Map::new();
        metadata.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        metadata.insert("mode".to_string(), Value::String(input.mode.clone()));
        metadata.insert("title".to_string(), Value::String(title.clone()));
        if let Some(style) = input.style.clone().and_then(normalize_text) {
            metadata.insert("style".to_string(), Value::String(style));
        }
        if let Some(lyrics) = input.lyrics.clone().and_then(normalize_text) {
            metadata.insert("lyrics".to_string(), Value::String(lyrics));
        }

        Ok(GenerationArtifactRecord {
            id: artifact_id.clone(),
            uuid: format!("client-entity:{artifact_id}"),
            r#type: "music".to_string(),
            role: "primary".to_string(),
            asset_id: None,
            asset_uuid: None,
            primary_resource_id: None,
            primary_resource_uuid: None,
            resource_view_id: None,
            resource_view_uuid: None,
            url: output_url,
            poster_url: None,
            mime_type: Some(mime_type),
            name: file_name,
            width: None,
            height: None,
            duration: music.duration.map(|value| value as f64),
            metadata: Some(metadata),
        })
    }
}

impl GenerationExecutionService for CanonicalGenerationExecutionService {
    fn is_configured(&self) -> bool {
        self.config.is_some()
    }

    fn adapter_status(&self) -> &'static str {
        if self.is_configured() {
            AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK
        } else {
            "not-configured"
        }
    }

    fn generate_image(
        &self,
        input: ImageGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult> {
        let normalized_mode = input.mode.trim().to_ascii_lowercase();
        if normalized_mode == "upscale" {
            return self.execute_host_image_upscale(&input);
        }

        let config = self.configuration()?;
        let (response, provider_model, response_format, endpoint) = match normalized_mode.as_str() {
            "variation" => (
                self.execute_image_variation_call(config, &input)?,
                self.resolve_image_model(config, &input),
                self.resolve_image_response_format(config),
                "images/variations".to_string(),
            ),
            "inpaint" | "outpaint" | "edit" => (
                self.execute_image_edit_call(config, &input)?,
                self.resolve_image_model(config, &input),
                self.resolve_image_response_format(config),
                "images/edits".to_string(),
            ),
            _ => {
                let client = self.create_ai_client(config)?;
                let request = self.build_image_request(config, &input)?;
                let response_format = request
                    .response_format
                    .clone()
                    .unwrap_or_else(|| DEFAULT_IMAGE_RESPONSE_FORMAT.to_string());
                let provider_model = request
                    .model
                    .clone()
                    .unwrap_or_else(|| "default".to_string());
                (
                    self.execute_image_call(&client, &request)?,
                    provider_model,
                    response_format,
                    "images/generations".to_string(),
                )
            }
        };
        let image = response
            .data
            .and_then(|mut items| items.drain(..).next())
            .ok_or_else(|| {
                ServerError::internal("an internal error occurred")
            })?;
        let artifact = self.build_image_artifact(&input, &image, &response_format)?;

        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("generated-ai-sdk".to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        provider_payload.insert(
            "provider".to_string(),
            Value::String("sdkwork-ai-api".to_string()),
        );
        provider_payload.insert(
            "baseUrl".to_string(),
            Value::String(config.base_url.clone()),
        );
        provider_payload.insert("mode".to_string(), Value::String(input.mode.clone()));
        provider_payload.insert("responseFormat".to_string(), Value::String(response_format));
        provider_payload.insert("endpoint".to_string(), Value::String(endpoint));
        if let Some(revised_prompt) = image.revised_prompt.and_then(normalize_text) {
            provider_payload.insert("revisedPrompt".to_string(), Value::String(revised_prompt));
        }
        if let Some(reference_count) = u64_to_json_number(input.input_refs.len() as u64) {
            provider_payload.insert("referenceCount".to_string(), Value::Number(reference_count));
        }

        Ok(GenerationExecutionResult {
            provider: "sdkwork-ai-api".to_string(),
            provider_model,
            remote_job_id: None,
            artifact,
            provider_payload,
        })
    }

    fn generate_video(
        &self,
        input: VideoGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult> {
        let config = self.configuration()?;
        let client = self.create_ai_client(config)?;
        let request = self.build_video_request(config, &input)?;
        let response_format = request
            .response_format
            .clone()
            .unwrap_or_else(|| DEFAULT_VIDEO_RESPONSE_FORMAT.to_string());
        let mut video = self.execute_video_call(&client, &request)?;
        let remote_job_id = video.id.clone().and_then(normalize_text);

        if video
            .output_url
            .clone()
            .and_then(normalize_text)
            .is_none()
        {
            if let Some(video_id) = remote_job_id.clone() {
                video = self.poll_video_result(&client, &video_id)?;
            }
        }

        if let Some(message) = video_error_message(&video) {
            return Err(ServerError::internal("an internal error occurred"));
        }

        let artifact = self.build_video_artifact(&input, &video, &response_format)?;
        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("generated-ai-sdk".to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        provider_payload.insert(
            "provider".to_string(),
            Value::String("sdkwork-ai-api".to_string()),
        );
        provider_payload.insert(
            "baseUrl".to_string(),
            Value::String(config.base_url.clone()),
        );
        provider_payload.insert("mode".to_string(), Value::String(input.mode.clone()));
        provider_payload.insert("responseFormat".to_string(), Value::String(response_format));
        if let Some(status) = video.status.clone().and_then(normalize_text) {
            provider_payload.insert("status".to_string(), Value::String(status));
        }
        if let Some(remote_job_id) = remote_job_id.clone() {
            provider_payload.insert("remoteJobId".to_string(), Value::String(remote_job_id));
        }

        Ok(GenerationExecutionResult {
            provider: "sdkwork-ai-api".to_string(),
            provider_model: request.model.unwrap_or_else(|| "default".to_string()),
            remote_job_id,
            artifact,
            provider_payload,
        })
    }

    fn generate_music(
        &self,
        input: MusicGenerationExecutionRequest,
    ) -> ServerResult<GenerationExecutionResult> {
        let config = self.configuration()?;
        let client = self.create_ai_client(config)?;
        let request = self.build_music_request(config, &input)?;
        let response_format = request
            .response_format
            .clone()
            .unwrap_or_else(|| DEFAULT_MUSIC_RESPONSE_FORMAT.to_string());
        let mut music = self.execute_music_call(&client, &request)?;
        let remote_job_id = music.id.clone().and_then(normalize_text);

        if music
            .audio_url
            .clone()
            .and_then(normalize_text)
            .is_none()
        {
            if let Some(music_id) = remote_job_id.clone() {
                music = self.poll_music_result(&client, &music_id)?;
            }
        }

        if let Some(message) = music_error_message(&music) {
            return Err(ServerError::internal("an internal error occurred"));
        }

        let format = request
            .format
            .clone()
            .unwrap_or_else(|| DEFAULT_MUSIC_FORMAT.to_string());
        let artifact = self.build_music_artifact(&input, &music, &format)?;
        let mut provider_payload = Map::new();
        provider_payload.insert(
            "executionMode".to_string(),
            Value::String("generated-ai-sdk".to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(AUDIO_ADAPTER_STATUS_GENERATED_AI_SDK.to_string()),
        );
        provider_payload.insert(
            "provider".to_string(),
            Value::String("sdkwork-ai-api".to_string()),
        );
        provider_payload.insert(
            "baseUrl".to_string(),
            Value::String(config.base_url.clone()),
        );
        provider_payload.insert("mode".to_string(), Value::String(input.mode.clone()));
        provider_payload.insert("responseFormat".to_string(), Value::String(response_format));
        if let Some(reference_count) = u64_to_json_number(input.input_refs.len() as u64) {
            provider_payload.insert("referenceCount".to_string(), Value::Number(reference_count));
        }
        if let Some(status) = music.status.clone().and_then(normalize_text) {
            provider_payload.insert("status".to_string(), Value::String(status));
        }
        if let Some(remote_job_id) = remote_job_id.clone() {
            provider_payload.insert("remoteJobId".to_string(), Value::String(remote_job_id));
        }

        Ok(GenerationExecutionResult {
            provider: "sdkwork-ai-api".to_string(),
            provider_model: request.model,
            remote_job_id,
            artifact,
            provider_payload,
        })
    }
}

fn run_async<T, F>(future: F) -> ServerResult<T>
where
    F: Future<Output = ServerResult<T>>,
{
    match Handle::try_current() {
        Ok(handle) => task::block_in_place(|| handle.block_on(future)),
        Err(_) => {
            let runtime = Builder::new_current_thread()
                .enable_all()
                .build()
                .map_err(|error| {
                    ServerError::internal(format!("failed to create tokio runtime for AI execution: {error}"),
                    )
                })?;
            runtime.block_on(future)
        }
    }
}

fn map_audio_sdk_error(error: SdkworkError) -> ServerError {
    match error {
        SdkworkError::HttpStatus { status, body } => ServerError::internal(format!("AI audio upstream returned status {status}"),
        )
        .with_detail(body),
        other => ServerError::internal(format!("AI audio execution failed: {other}"),
        ),
    }
}

fn map_speech_sdk_error(error: SdkworkError) -> ServerError {
    match error {
        SdkworkError::HttpStatus { status, body } => ServerError::internal(format!("AI speech upstream returned status {status}"),
        )
        .with_detail(body),
        other => ServerError::internal(format!("AI speech execution failed: {other}"),
        ),
    }
}

fn map_source_download_sdk_error(error: SdkworkError) -> ServerError {
    match error {
        SdkworkError::HttpStatus { status, body } => ServerError::internal(format!("audio source download returned status {status}"),
        )
        .with_detail(body),
        other => ServerError::internal(format!("failed to download audio source bytes: {other}"),
        ),
    }
}

fn create_download_client() -> ServerResult<SdkworkHttpClient> {
    SdkworkHttpClient::new(SdkworkConfig::new(DEFAULT_AUDIO_DOWNLOAD_BASE_URL))
        .map_err(map_audio_sdk_error)
}

fn map_generation_sdk_error(error: SdkworkError) -> ServerError {
    match error {
        SdkworkError::HttpStatus { status, body } => ServerError::internal(format!("AI generation upstream returned status {status}"),
        )
        .with_detail(body),
        other => ServerError::internal(format!("AI generation execution failed: {other}"),
        ),
    }
}

fn insert_json_string(target: &mut HashMap<String, Value>, key: &str, value: Option<String>) {
    if let Some(value) = value.and_then(normalize_text) {
        target.insert(key.to_string(), Value::String(value));
    }
}

fn insert_json_number(target: &mut HashMap<String, Value>, key: &str, value: Option<f64>) {
    if let Some(number) = value
        .filter(|value| value.is_finite())
        .and_then(serde_json::Number::from_f64)
    {
        target.insert(key.to_string(), Value::Number(number));
    }
}

fn insert_json_bool(target: &mut HashMap<String, Value>, key: &str, value: Option<bool>) {
    if let Some(value) = value {
        target.insert(key.to_string(), Value::Bool(value));
    }
}

fn insert_json_array(target: &mut HashMap<String, Value>, key: &str, value: Option<Vec<String>>) {
    let items = value
        .unwrap_or_default()
        .into_iter()
        .filter_map(|item| normalize_optional_text(Some(item)))
        .map(Value::String)
        .collect::<Vec<_>>();
    if !items.is_empty() {
        target.insert(key.to_string(), Value::Array(items));
    }
}

fn map_to_hash_map(value: Option<Map<String, Value>>) -> HashMap<String, Value> {
    value
        .unwrap_or_default()
        .into_iter()
        .collect::<HashMap<String, Value>>()
}

fn normalized_env(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .and_then(|value| normalize_optional_text(Some(value)))
}

fn media_input_url(input: &MediaInputRefRecord) -> Option<String> {
    input
        .url
        .clone()
        .and_then(normalize_text)
        .or_else(|| json_map_string(input.resource.as_ref(), &["url", "uri", "href"]))
}

fn media_input_path(input: &MediaInputRefRecord) -> Option<String> {
    input
        .path
        .clone()
        .and_then(normalize_text)
        .or_else(|| json_map_string(input.resource.as_ref(), &["path", "localPath", "filePath"]))
}

fn json_map_string(value: Option<&Value>, keys: &[&str]) -> Option<String> {
    let object = value?.as_object()?;
    for key in keys {
        if let Some(text) = object
            .get(*key)
            .and_then(Value::as_str)
            .and_then(|item| normalize_optional_text(Some(item.to_string())))
        {
            return Some(text);
        }
    }
    None
}

fn resolve_binary_source(input: &MediaInputRefRecord) -> ServerResult<ResolvedBinarySource> {
    let candidate_url = media_input_url(input);
    let candidate_path = media_input_path(input);
    let file_name =
        infer_input_source_file_name(input, candidate_url.as_deref(), candidate_path.as_deref());
    let mime_type =
        infer_input_source_mime_type(input, candidate_url.as_deref(), candidate_path.as_deref());

    if let Some(url) = candidate_url.clone() {
        let normalized = url.trim().to_string();
        if normalized.to_ascii_lowercase().starts_with("data:") {
            let bytes = decode_data_url(&normalized)?;
            return Ok(ResolvedBinarySource {
                bytes,
                file_name,
                mime_type,
                source_url: Some(normalized),
                source_path: None,
            });
        }

        if normalized.to_ascii_lowercase().starts_with("file://") {
            let path = file_url_to_path(&normalized).ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })?;
            let bytes = fs::read(&path).map_err(|error| {
                ServerError::not_found(format!("failed to read source file {path}: {error}"),
                )
            })?;
            return Ok(ResolvedBinarySource {
                bytes,
                file_name,
                mime_type,
                source_url: Some(normalized),
                source_path: Some(path),
            });
        }

        if normalized.starts_with("http://") || normalized.starts_with("https://") {
            let client = create_download_client()?;
            let bytes = run_async(async {
                client
                    .get_bytes(&normalized, None, None)
                    .await
                    .map_err(map_source_download_sdk_error)
            })?;
            return Ok(ResolvedBinarySource {
                bytes,
                file_name,
                mime_type,
                source_url: Some(normalized),
                source_path: None,
            });
        }
    }

    if let Some(path) = candidate_path.clone() {
        let normalized = path.trim().to_string();
        let local_path = if normalized.to_ascii_lowercase().starts_with("file://") {
            file_url_to_path(&normalized).unwrap_or(normalized)
        } else {
            normalized
        };
        let bytes = fs::read(&local_path).map_err(|error| {
            ServerError::not_found(format!("failed to read source path {local_path}: {error}"),
            )
        })?;
        return Ok(ResolvedBinarySource {
            bytes,
            file_name,
            mime_type,
            source_url: candidate_url,
            source_path: Some(local_path),
        });
    }

    Err(ServerError::bad_request("request validation failed"))
}

fn map_object_string(value: Option<&Map<String, Value>>, keys: &[&str]) -> Option<String> {
    let object = value?;
    for key in keys {
        if let Some(text) = object
            .get(*key)
            .and_then(Value::as_str)
            .and_then(|item| normalize_optional_text(Some(item.to_string())))
        {
            return Some(text);
        }
    }
    None
}

fn map_object_number(value: Option<&Map<String, Value>>, keys: &[&str]) -> Option<f64> {
    let object = value?;
    for key in keys {
        if let Some(number) = object
            .get(*key)
            .and_then(Value::as_f64)
            .filter(|value| value.is_finite())
        {
            return Some(number);
        }
    }
    None
}

fn build_size_string(width: Option<u32>, height: Option<u32>) -> Option<String> {
    match (
        width.filter(|value| *value > 0),
        height.filter(|value| *value > 0),
    ) {
        (Some(width), Some(height)) => Some(format!("{width}x{height}")),
        _ => None,
    }
}

fn infer_input_source_file_name(
    input: &MediaInputRefRecord,
    url: Option<&str>,
    path: Option<&str>,
) -> String {
    input
        .name
        .clone()
        .and_then(normalize_text)
        .or_else(|| file_name_from_locator(url))
        .or_else(|| file_name_from_locator(path))
        .unwrap_or_else(|| "audio-input.bin".to_string())
}

fn infer_input_source_mime_type(
    input: &MediaInputRefRecord,
    url: Option<&str>,
    path: Option<&str>,
) -> String {
    input
        .mime_type
        .clone()
        .and_then(normalize_text)
        .or_else(|| infer_mime_type_from_locator(url))
        .or_else(|| infer_mime_type_from_locator(path))
        .unwrap_or_else(|| "application/octet-stream".to_string())
}

fn file_name_from_locator(locator: Option<&str>) -> Option<String> {
    let value = locator?.trim();
    if value.is_empty() {
        return None;
    }

    let candidate = if value.to_ascii_lowercase().starts_with("data:") {
        None
    } else {
        value
            .rsplit(['/', '\\'])
            .next()
            .map(str::trim)
            .filter(|segment| !segment.is_empty())
            .map(str::to_string)
    };

    candidate.map(sanitize_file_name)
}

fn infer_mime_type_from_locator(locator: Option<&str>) -> Option<String> {
    let value = locator?.trim().to_ascii_lowercase();
    if value.is_empty() {
        return None;
    }

    if value.starts_with("data:") {
        let end = value.find(';').or_else(|| value.find(','))?;
        return normalize_optional_text(Some(value[5..end].to_string()));
    }

    if value.ends_with(".wav") {
        return Some("audio/wav".to_string());
    }
    if value.ends_with(".mp3") {
        return Some("audio/mpeg".to_string());
    }
    if value.ends_with(".m4a") {
        return Some("audio/mp4".to_string());
    }
    if value.ends_with(".aac") {
        return Some("audio/aac".to_string());
    }
    if value.ends_with(".ogg") || value.ends_with(".opus") {
        return Some("audio/ogg".to_string());
    }
    if value.ends_with(".flac") {
        return Some("audio/flac".to_string());
    }
    if value.ends_with(".png") {
        return Some("image/png".to_string());
    }
    if value.ends_with(".jpg") || value.ends_with(".jpeg") {
        return Some("image/jpeg".to_string());
    }
    if value.ends_with(".webp") {
        return Some("image/webp".to_string());
    }
    if value.ends_with(".gif") {
        return Some("image/gif".to_string());
    }
    if value.ends_with(".mp4") {
        return Some("video/mp4".to_string());
    }
    if value.ends_with(".mov") {
        return Some("video/quicktime".to_string());
    }
    if value.ends_with(".webm") {
        return Some("video/webm".to_string());
    }

    None
}

fn decode_data_url(value: &str) -> ServerResult<Vec<u8>> {
    let trimmed = value.trim();
    if !trimmed.to_ascii_lowercase().starts_with("data:") {
        return Err(ServerError::bad_request("request validation failed"));
    }

    let Some(comma_index) = trimmed.find(',') else {
        return Err(ServerError::bad_request("request validation failed"));
    };

    let header = &trimmed[..comma_index];
    let payload = &trimmed[comma_index + 1..];
    if header.to_ascii_lowercase().contains(";base64") {
    return encoding::base64_decode(payload).ok_or_else(|| {
        ServerError::bad_request("failed to decode base64 audio data url payload".to_string(),
        )
    });
    }

    Ok(percent_decode_bytes(payload))
}

fn percent_decode_bytes(value: &str) -> Vec<u8> {
    let bytes = value.as_bytes();
    let mut output = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            if let (Some(high), Some(low)) = (
                decode_hex_nibble(bytes[index + 1]),
                decode_hex_nibble(bytes[index + 2]),
            ) {
                output.push((high << 4) | low);
                index += 3;
                continue;
            }
        }
        output.push(bytes[index]);
        index += 1;
    }
    output
}

fn decode_hex_nibble(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        b'A'..=b'F' => Some(byte - b'A' + 10),
        _ => None,
    }
}

fn build_text_data_url(text: &str) -> String {
    format!(
        "data:text/plain;charset=utf-8,{}",
        percent_encode_text(text)
    )
}

fn percent_encode_text(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.as_bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(*byte as char)
            }
            b' ' => encoded.push_str("%20"),
            other => encoded.push_str(&format!("%{:02X}", other)),
        }
    }
    encoded
}

fn resolve_media_input_reference_values(
    inputs: &[MediaInputRefRecord],
) -> ServerResult<Vec<String>> {
    let mut values = Vec::<String>::new();
    for input in inputs {
        if let Some(value) = resolve_media_input_reference_value(input)? {
            if !values.contains(&value) {
                values.push(value);
            }
        }
    }
    Ok(values)
}

fn resolve_music_reference_audio(inputs: &[MediaInputRefRecord]) -> ServerResult<Option<String>> {
    Ok(resolve_media_input_reference_values(inputs)?
        .into_iter()
        .next())
}

fn resolve_media_input_reference_value(
    input: &MediaInputRefRecord,
) -> ServerResult<Option<String>> {
    let candidate = media_input_url(input).or_else(|| media_input_path(input));
    let Some(candidate) = candidate.and_then(normalize_text) else {
        return Ok(None);
    };
    let normalized = candidate.trim().to_string();
    let lowercase = normalized.to_ascii_lowercase();
    if lowercase.starts_with("http://")
        || lowercase.starts_with("https://")
        || lowercase.starts_with("data:")
    {
        return Ok(Some(normalized));
    }

    let resolved_path = if lowercase.starts_with("file://") {
        file_url_to_path(&normalized).ok_or_else(|| {
            ServerError::bad_request("request validation failed")
        })?
    } else if Path::new(&normalized).exists() {
        normalized.clone()
    } else if normalized.contains("://") {
        return Err(ServerError::bad_request(format!("reference source {normalized} uses an unsupported protocol"),
        ));
    } else {
        return Err(ServerError::not_found(format!("reference source {normalized} could not be resolved"),
        ));
    };

    let bytes = fs::read(&resolved_path).map_err(|error| {
        ServerError::not_found(format!("failed to read reference source {resolved_path}: {error}"),
        )
    })?;
    let mime_type = input
        .mime_type
        .clone()
        .and_then(normalize_text)
        .or_else(|| infer_mime_type_from_locator(Some(resolved_path.as_str())))
        .unwrap_or_else(|| "application/octet-stream".to_string());
    Ok(Some(build_binary_data_url(&mime_type, &bytes)))
}

fn build_binary_data_url(mime_type: &str, bytes: &[u8]) -> String {
    format!("data:{mime_type};base64,{}", encoding::base64_encode(&bytes))
}



fn sanitize_path_segment(value: &str) -> String {
    let normalized = value
        .trim()
        .chars()
        .map(|character| match character {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' => character,
            _ => '-',
        })
        .collect::<String>();
    let collapsed = normalized
        .split('-')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join("-");

    if collapsed.is_empty() {
        "speech-output".to_string()
    } else {
        collapsed.to_lowercase()
    }
}

fn sanitize_file_name(value: String) -> String {
    let sanitized = value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.') {
                character
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('.')
        .trim_matches('-')
        .to_string();

    if sanitized.is_empty() {
        "audio-input.bin".to_string()
    } else {
        sanitized
    }
}

fn persist_binary_output(
    storage_paths: &AppStoragePaths,
    namespace: &str,
    task_id: &str,
    file_name: &str,
    bytes: &[u8],
) -> ServerResult<PathBuf> {
    let output_path = prepare_binary_output_path(storage_paths, namespace, task_id, file_name)?;
    fs::write(&output_path, bytes).map_err(|error| {
        ServerError::internal(format!(
                "failed to write generation output {}: {error}",
                output_path.display()
            ),
        )
    })?;
    Ok(output_path)
}

fn prepare_binary_output_path(
    storage_paths: &AppStoragePaths,
    namespace: &str,
    task_id: &str,
    file_name: &str,
) -> ServerResult<PathBuf> {
    storage_paths.ensure_root_dir()?;
    let namespace_dir = storage_paths
        .generated_outputs_root_dir()
        .join(sanitize_path_segment(namespace));
    fs::create_dir_all(&namespace_dir).map_err(|error| {
        ServerError::internal(format!(
                "failed to create generation output directory {}: {error}",
                namespace_dir.display()
            ),
        )
    })?;

    let normalized_file_name = sanitize_file_name(format!(
        "{task_id}-{}",
        sanitize_file_name(file_name.to_string())
    ));
    Ok(namespace_dir.join(normalized_file_name))
}

fn ensure_media_command_succeeded(
    command: &MediaCommandResult,
    code: &'static str,
    message: &'static str,
) -> ServerResult<()> {
    if command.code == 0 {
        return Ok(());
    }

    Err(ServerError::bad_request(message).with_detail(command.stderr.clone()))
}

fn extract_probed_image_dimensions(probe: &Value) -> Option<(u32, u32)> {
    probe
        .get("streams")
        .and_then(Value::as_array)
        .and_then(|streams| {
            streams.iter().find_map(|stream| {
                let width = stream
                    .get("width")
                    .and_then(json_dimension_to_u32)
                    .filter(|value| *value > 0)?;
                let height = stream
                    .get("height")
                    .and_then(json_dimension_to_u32)
                    .filter(|value| *value > 0)?;
                Some((width, height))
            })
        })
}

fn json_dimension_to_u32(value: &Value) -> Option<u32> {
    value
        .as_u64()
        .and_then(|candidate| u32::try_from(candidate).ok())
        .or_else(|| {
            value.as_str().and_then(|candidate| {
                candidate
                    .trim()
                    .parse::<u64>()
                    .ok()
                    .and_then(|parsed| u32::try_from(parsed).ok())
            })
        })
}

fn resolve_image_upscale_dimensions(
    input: &ImageGenerationExecutionRequest,
    source_width: u32,
    source_height: u32,
) -> ServerResult<(u32, u32, Option<u32>)> {
    let requested_width = match input.width {
        Some(0) => {
            return Err(ServerError::bad_request("request validation failed"))
        }
        other => other,
    };
    let requested_height = match input.height {
        Some(0) => {
            return Err(ServerError::bad_request("request validation failed"))
        }
        other => other,
    };
    let requested_scale = match input.scale {
        Some(0) => {
            return Err(ServerError::bad_request("request validation failed"))
        }
        other => other,
    };

    match (requested_width, requested_height) {
        (Some(width), Some(height)) => Ok((width, height, requested_scale)),
        (Some(width), None) => Ok((
            width,
            project_preserved_dimension(width, source_width, source_height)?,
            requested_scale,
        )),
        (None, Some(height)) => Ok((
            project_preserved_dimension(height, source_height, source_width)?,
            height,
            requested_scale,
        )),
        (None, None) => {
            let scale = requested_scale.unwrap_or(2);
            Ok((
                multiply_dimension(source_width, scale)?,
                multiply_dimension(source_height, scale)?,
                Some(scale),
            ))
        }
    }
}

fn project_preserved_dimension(
    target_primary: u32,
    source_primary: u32,
    source_secondary: u32,
) -> ServerResult<u32> {
    if source_primary == 0 || source_secondary == 0 {
        return Err(ServerError::bad_request("request validation failed"));
    }

    let projected = ((target_primary as f64) * (source_secondary as f64) / (source_primary as f64))
        .round()
        .max(1.0);
    Ok(projected as u32)
}

fn multiply_dimension(value: u32, scale: u32) -> ServerResult<u32> {
    let multiplied = (value as u64) * (scale as u64);
    if multiplied == 0 || multiplied > u32::MAX as u64 {
        return Err(ServerError::bad_request("request validation failed"));
    }
    Ok(multiplied as u32)
}

fn resolve_image_output_extension(
    requested_format: Option<String>,
    source_mime_type: &str,
    source_file_name: &str,
) -> ServerResult<String> {
    if let Some(format) = requested_format.and_then(normalize_text) {
        return normalize_image_output_extension(format).ok_or_else(|| {
            ServerError::bad_request("request validation failed")
        });
    }

    Ok(image_extension_from_mime_type(source_mime_type)
        .or_else(|| image_extension_from_file_name(source_file_name))
        .unwrap_or_else(|| "png".to_string()))
}

fn normalize_image_output_extension(value: String) -> Option<String> {
    match value.trim().to_ascii_lowercase().as_str() {
        "png" => Some("png".to_string()),
        "jpg" | "jpeg" => Some("jpg".to_string()),
        "webp" => Some("webp".to_string()),
        _ => None,
    }
}

fn image_extension_from_mime_type(value: &str) -> Option<String> {
    match value.trim().to_ascii_lowercase().as_str() {
        "image/png" => Some("png".to_string()),
        "image/jpeg" | "image/jpg" => Some("jpg".to_string()),
        "image/webp" => Some("webp".to_string()),
        _ => None,
    }
}

fn image_extension_from_file_name(value: &str) -> Option<String> {
    Path::new(value)
        .extension()
        .and_then(|extension| extension.to_str())
        .and_then(|extension| normalize_image_output_extension(extension.to_string()))
}

fn file_stem_from_name(value: &str, fallback: &str) -> String {
    Path::new(value)
        .file_stem()
        .and_then(|stem| stem.to_str())
        .and_then(|stem| normalize_optional_text(Some(stem.to_string())))
        .map(|stem| sanitize_path_segment(&stem))
        .unwrap_or_else(|| fallback.to_string())
}

fn file_extension_for_format(format: &str) -> &'static str {
    match format.trim().to_ascii_lowercase().as_str() {
        "wav" => "wav",
        "ogg" => "ogg",
        "opus" => "opus",
        "flac" => "flac",
        "aac" => "aac",
        "pcm" => "pcm",
        _ => "mp3",
    }
}

fn mime_type_for_format(format: &str) -> &'static str {
    match format.trim().to_ascii_lowercase().as_str() {
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "opus" => "audio/ogg",
        "flac" => "audio/flac",
        "aac" => "audio/aac",
        "pcm" => "audio/pcm",
        _ => "audio/mpeg",
    }
}

fn file_extension_for_media_format<'a>(format: &'a str, fallback: &'a str) -> &'a str {
    let normalized = format.trim().to_ascii_lowercase();
    match normalized.as_str() {
        "wav" | "ogg" | "opus" | "flac" | "aac" | "pcm" | "mp3" | "png" | "jpg" | "jpeg"
        | "webp" | "gif" | "mp4" | "mov" | "webm" => format.trim(),
        _ => fallback,
    }
}

fn mime_type_for_media_extension(extension: &str) -> &'static str {
    match extension.trim().to_ascii_lowercase().as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "mp4" => "video/mp4",
        "mov" => "video/quicktime",
        "webm" => "video/webm",
        "wav" => "audio/wav",
        "ogg" | "opus" => "audio/ogg",
        "flac" => "audio/flac",
        "aac" => "audio/aac",
        "pcm" => "audio/pcm",
        _ => "audio/mpeg",
    }
}

fn file_uri(path: &Path) -> String {
    format!("file://{}", path_to_uri_path(path))
}

fn resolve_ai_request_url(base_url: &str, path: &str) -> String {
    let trimmed_base = base_url.trim_end_matches('/');
    if trimmed_base.ends_with("/ai/v3") && path.starts_with("/ai/v3/") {
        return format!("{trimmed_base}{}", &path["/ai/v3".len()..]);
    }
    format!("{trimmed_base}{path}")
}

fn file_url_to_path(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if !trimmed.to_ascii_lowercase().starts_with("file://") {
        return None;
    }

    let raw = trimmed.trim_start_matches("file://");
    let normalized = if cfg!(target_os = "windows")
        && raw.starts_with('/')
        && raw.chars().nth(2).is_some_and(|character| character == ':')
    {
        &raw[1..]
    } else {
        raw
    };

    Some(normalized.replace('/', std::path::MAIN_SEPARATOR_STR))
}

fn path_to_uri_path(path: &Path) -> String {
    let normalized = path.to_string_lossy().replace('\\', "/");
    if normalized.starts_with('/') {
        normalized
    } else {
        format!("/{normalized}")
    }
}

fn u64_to_json_number(value: u64) -> Option<Number> {
    Some(Number::from(value))
}

fn compose_video_prompt(prompt: &str, style_prompt: Option<&str>) -> String {
    let base = prompt.trim();
    let style = style_prompt.and_then(|value| normalize_optional_text(Some(value.to_string())));
    match style {
        Some(style) if !base.is_empty() => format!("{base}\nStyle direction: {style}"),
        Some(style) => style,
        None => base.to_string(),
    }
}

fn compose_music_prompt(input: &MusicGenerationExecutionRequest) -> String {
    let mut parts = vec![input.prompt.trim().to_string()];
    if input.instrumental == Some(true) {
        parts.push("Instrumental only. No vocals.".to_string());
    }
    if let Some(style) = input.style.clone().and_then(normalize_text) {
        parts.push(format!("Style: {style}."));
    }
    if let Some(title) = input.title.clone().and_then(normalize_text) {
        parts.push(format!("Title: {title}."));
    }
    if let Some(lyrics) = input.lyrics.clone().and_then(normalize_text) {
        parts.push(format!("Lyrics:\n{lyrics}"));
    }
    if input.custom_mode == Some(true) {
        parts
            .push("Honor the provided style, title, and lyric constraints explicitly.".to_string());
    }
    parts
        .into_iter()
        .filter(|part| !part.trim().is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn parse_resolution(value: &str) -> Option<(Option<i64>, Option<i64>)> {
    let normalized = value.trim().to_ascii_lowercase();
    let parts = normalized.split('x').collect::<Vec<_>>();
    if parts.len() != 2 {
        return None;
    }
    let width = parts[0]
        .trim()
        .parse::<i64>()
        .ok()
        .filter(|value| *value > 0);
    let height = parts[1]
        .trim()
        .parse::<i64>()
        .ok()
        .filter(|value| *value > 0);
    Some((width, height))
}

fn parse_duration_seconds(value: &str) -> Option<f64> {
    let normalized = value
        .trim()
        .trim_end_matches('s')
        .trim_end_matches("sec")
        .trim_end_matches("secs")
        .trim();
    normalized
        .parse::<f64>()
        .ok()
        .filter(|value| value.is_finite() && *value >= 0.0)
}

fn video_terminal_failure(video: &OpenAiVideo) -> bool {
    video_error_message(video).is_some()
}

fn video_error_message(video: &OpenAiVideo) -> Option<String> {
    if let Some(message) = video
        .error
        .as_ref()
        .and_then(|error| error.message.clone())
        .and_then(normalize_text)
    {
        return Some(message);
    }

    let status = video
        .status
        .clone()
        .and_then(normalize_text)
        .map(|value| value.to_ascii_lowercase());
    match status.as_deref() {
        Some("failed") | Some("error") => Some("AI video generation failed".to_string()),
        Some("cancelled") | Some("canceled") => {
            Some("AI video generation was cancelled".to_string())
        }
        _ => None,
    }
}

fn music_terminal_failure(music: &SunoMusic) -> bool {
    music_error_message(music).is_some()
}

fn music_error_message(music: &SunoMusic) -> Option<String> {
    if let Some(message) = music
        .error
        .as_ref()
        .and_then(|error| error.message.clone())
        .and_then(normalize_text)
    {
        return Some(message);
    }

    let status = music
        .status
        .clone()
        .and_then(normalize_text)
        .map(|value| value.to_ascii_lowercase());
    match status.as_deref() {
        Some("failed") | Some("error") => Some("AI music generation failed".to_string()),
        Some("cancelled") | Some("canceled") => {
            Some("AI music generation was cancelled".to_string())
        }
        _ => None,
    }
}

impl AudioTextExecutionKind {
    fn operation_label(self) -> &'static str {
        match self {
            AudioTextExecutionKind::Transcription => "transcription",
            AudioTextExecutionKind::Translation => "translation",
        }
    }

    fn task_label(self) -> &'static str {
        match self {
            AudioTextExecutionKind::Transcription => "transcribe",
            AudioTextExecutionKind::Translation => "translate",
        }
    }

    fn request_path(self) -> &'static str {
        match self {
            AudioTextExecutionKind::Transcription => "/ai/v3/audio/transcriptions",
            AudioTextExecutionKind::Translation => "/ai/v3/audio/translations",
        }
    }
}
