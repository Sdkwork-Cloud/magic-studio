use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};



use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::execution::{
    AudioExecutionService, AudioTextExecutionRequest, GenerationExecutionService,
    ImageGenerationExecutionRequest, MusicGenerationExecutionRequest, SpeechExecutionRequest,
    VideoGenerationExecutionRequest, GENERATION_ADAPTER_STATUS_HOST_LOCAL,
};
use super::identity::{IdentityService, UserGenerationHistoryUpsert};

use super::service_utils::{current_timestamp, to_client_entity_uuid, require_non_empty_text, normalize_text};
const GENERATION_SCHEMA_VERSION: &str = "magic-studio.generation.v1";
const PROVIDER_NOT_CONFIGURED_CODE: &str = "APP_GENERATION_PROVIDER_NOT_CONFIGURED";
const PROVIDER_NOT_CONFIGURED_MESSAGE: &str =
    "Magic Studio canonical generation execution is not configured yet. The route contract, task registry, and prompt enhancement API are ready, but provider execution still needs a standardized backend adapter.";

static GENERATION_TASK_COUNTER: AtomicU64 = AtomicU64::new(1);
static GENERATION_INPUT_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GenerationProduct {
    Image,
    Video,
    Audio,
    Music,
    Character,
    Sfx,
    Speech,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GenerationTaskStatus {
    Draft,
    Queued,
    Processing,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct MediaInputRefRecord {
    pub id: Option<String>,
    pub uuid: String,
    pub asset_id: Option<String>,
    pub asset_uuid: Option<String>,
    pub primary_resource_id: Option<String>,
    pub primary_resource_uuid: Option<String>,
    pub resource_view_id: Option<String>,
    pub resource_view_uuid: Option<String>,
    pub path: Option<String>,
    pub url: Option<String>,
    pub name: Option<String>,
    pub mime_type: Option<String>,
    pub r#type: String,
    pub role: String,
    pub resource: Option<Value>,
    pub metadata: Option<Map<String, Value>>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationArtifactRecord {
    pub id: String,
    pub uuid: String,
    pub r#type: String,
    pub role: String,
    pub asset_id: Option<String>,
    pub asset_uuid: Option<String>,
    pub primary_resource_id: Option<String>,
    pub primary_resource_uuid: Option<String>,
    pub resource_view_id: Option<String>,
    pub resource_view_uuid: Option<String>,
    pub url: String,
    pub poster_url: Option<String>,
    pub mime_type: Option<String>,
    pub name: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration: Option<f64>,
    pub metadata: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationTaskRecord {
    pub id: String,
    pub uuid: String,
    pub task_id: String,
    pub product: GenerationProduct,
    pub mode: String,
    pub status: GenerationTaskStatus,
    pub prompt: Option<String>,
    pub negative_prompt: Option<String>,
    pub provider: String,
    pub provider_model: String,
    pub remote_job_id: Option<String>,
    pub progress: Option<f64>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub input_refs: Vec<MediaInputRefRecord>,
    pub artifacts: Vec<GenerationArtifactRecord>,
    pub primary_artifact: Option<GenerationArtifactRecord>,
    pub parameters: Option<Map<String, Value>>,
    pub provider_payload: Option<Map<String, Value>>,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
    pub cancelled_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationPromptEnhanceRequest {
    pub prompt: String,
    pub scene: Option<String>,
    pub style: Option<String>,
    pub language: Option<String>,
    pub max_words: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationPromptEnhanceResultRecord {
    pub prompt: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptOptimizeRequest {
    pub prompt: String,
    pub scene: Option<String>,
    pub r#type: Option<String>,
    pub mode: Option<String>,
    pub target_style: Option<String>,
    pub additional_instructions: Option<String>,
    pub input_image_name: Option<String>,
    pub input_image_url: Option<String>,
    pub input_video_name: Option<String>,
    pub input_video_url: Option<String>,
    pub language: Option<String>,
    pub max_words: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptOptimizeResultRecord {
    pub original_input: String,
    pub optimized_prompt: String,
    pub suggestions: Vec<String>,
    pub keywords: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ImageGenerationRequest {
    pub prompt: Option<String>,
    pub negative_prompt: Option<String>,
    pub reference_image: Option<MediaInputRefRecord>,
    #[serde(default)]
    pub reference_images: Vec<MediaInputRefRecord>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub aspect_ratio: Option<String>,
    pub steps: Option<f64>,
    pub guidance: Option<f64>,
    pub seed: Option<f64>,
    pub style: Option<String>,
    pub style_id: Option<String>,
    pub model: Option<String>,
    pub batch_size: Option<u32>,
    pub use_multi_model: Option<bool>,
    pub models: Option<Vec<String>>,
    pub media_type: Option<String>,
    pub quality: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CharacterGenerationRequest {
    pub prompt: String,
    pub description: Option<String>,
    pub model: Option<String>,
    pub archetype: Option<String>,
    pub gender: Option<String>,
    pub age: Option<u32>,
    pub outfit: Option<String>,
    pub aspect_ratio: Option<String>,
    pub voice_id: Option<String>,
    pub avatar_mode: Option<String>,
    pub hairstyle: Option<String>,
    pub hair_color: Option<String>,
    pub eye_color: Option<String>,
    pub skin_tone: Option<String>,
    pub accessories: Option<String>,
    pub avatar: Option<MediaInputRefRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageEditRequest {
    pub source: MediaInputRefRecord,
    pub mask: Option<MediaInputRefRecord>,
    pub prompt: Option<String>,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub strength: Option<f64>,
    pub format: Option<String>,
    pub n: Option<u32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUpscaleRequest {
    pub source: MediaInputRefRecord,
    pub prompt: Option<String>,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub scale: Option<u32>,
    pub target_width: Option<u32>,
    pub target_height: Option<u32>,
    pub format: Option<String>,
    pub n: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoGenerationAssetRecord {
    pub role: String,
    pub r#type: String,
    pub value: String,
    pub asset_id: Option<String>,
    pub asset_uuid: Option<String>,
    pub primary_resource_id: Option<String>,
    pub primary_resource_uuid: Option<String>,
    pub resource_view_id: Option<String>,
    pub resource_view_uuid: Option<String>,
    pub r#ref: Option<MediaInputRefRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoStyleSelectionRecord {
    pub id: String,
    pub prompt: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoGenerationRequest {
    pub generation_type: String,
    #[serde(default)]
    pub assets: Vec<VideoGenerationAssetRecord>,
    pub prompt: String,
    pub negative_prompt: String,
    pub duration: String,
    pub resolution: String,
    pub aspect_ratio: String,
    pub model: String,
    pub video_style: VideoStyleSelectionRecord,
    pub options: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioGenerationRequest {
    pub mode: Option<String>,
    pub prompt: Option<String>,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub voice: Option<String>,
    pub duration: Option<f64>,
    pub seed: Option<f64>,
    pub source_audio: Option<MediaInputRefRecord>,
    pub language: Option<String>,
    pub format: Option<String>,
    pub source_language: Option<String>,
    pub target_language: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicGenerationRequest {
    pub prompt: String,
    pub title: Option<String>,
    pub lyrics: Option<String>,
    pub style: Option<String>,
    pub duration: Option<f64>,
    pub model: Option<String>,
    pub custom_mode: Option<bool>,
    pub instrumental: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicSimilarRequest {
    pub source: MediaInputRefRecord,
    pub duration: Option<f64>,
    pub model: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicRemixRequest {
    pub source: MediaInputRefRecord,
    pub style: String,
    pub model: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicExtendRequest {
    pub source: MediaInputRefRecord,
    pub extend_duration: f64,
    pub style: Option<String>,
    pub model: Option<String>,
    pub idempotency_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SfxGenerationRequest {
    pub prompt: String,
    pub model: String,
    pub duration: f64,
    pub media_type: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GenerationTaskListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub product: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone)]
struct NormalizedGenerationTaskListQuery {
    page: usize,
    page_size: usize,
    product: Option<GenerationProduct>,
    status: Option<GenerationTaskStatus>,
}

#[derive(Debug, Clone)]
pub struct GenerationTaskPage {
    pub items: Vec<GenerationTaskRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SfxCategoryRecord {
    pub id: String,
    pub label: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerationRegistryDocument {
    pub schema_version: String,
    pub tasks: Vec<GenerationTaskRecord>,
}

pub trait GenerationService: Send + Sync {
    fn optimize_prompt(
        &self,
        input: PromptOptimizeRequest,
    ) -> ServerResult<PromptOptimizeResultRecord>;
    fn create_image_task(
        &self,
        input: ImageGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_image_variation_task(
        &self,
        input: ImageGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_image_edit_task(&self, input: ImageEditRequest)
        -> ServerResult<GenerationTaskRecord>;
    fn create_image_upscale_task(
        &self,
        input: ImageUpscaleRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn read_image_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn create_video_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_image_to_video_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_video_extend_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_video_style_transfer_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_video_lip_sync_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn read_video_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn cancel_video_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn create_audio_text_to_speech_task(
        &self,
        input: AudioGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_audio_transcription_task(
        &self,
        input: AudioGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_audio_translation_task(
        &self,
        input: AudioGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn read_audio_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn create_music_task(
        &self,
        input: MusicGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_music_similar_task(
        &self,
        input: MusicSimilarRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_music_remix_task(
        &self,
        input: MusicRemixRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn create_music_extend_task(
        &self,
        input: MusicExtendRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn read_music_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn create_character_task(
        &self,
        input: CharacterGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord>;
    fn list_character_tasks(
        &self,
        query: GenerationTaskListQuery,
    ) -> ServerResult<GenerationTaskPage>;
    fn read_character_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn cancel_character_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn create_sfx_task(&self, input: SfxGenerationRequest) -> ServerResult<GenerationTaskRecord>;
    fn list_sfx_tasks(&self, query: GenerationTaskListQuery) -> ServerResult<GenerationTaskPage>;
    fn list_sfx_categories(&self) -> ServerResult<Vec<SfxCategoryRecord>>;
    fn read_sfx_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn cancel_sfx_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn enhance_prompt(
        &self,
        input: GenerationPromptEnhanceRequest,
    ) -> ServerResult<GenerationPromptEnhanceResultRecord>;
    fn list_history_tasks(
        &self,
        product: Option<GenerationProduct>,
        status: Option<String>,
    ) -> ServerResult<Vec<GenerationTaskRecord>>;
    fn read_history_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn delete_history_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
}

pub struct FileBackedGenerationService {
    storage_paths: AppStoragePaths,
    identity_service: Arc<dyn IdentityService>,
    audio_execution_service: Arc<dyn AudioExecutionService>,
    generation_execution_service: Arc<dyn GenerationExecutionService>,
    lock: Mutex<()>,
}

impl FileBackedGenerationService {
    pub fn new(
        storage_paths: AppStoragePaths,
        identity_service: Arc<dyn IdentityService>,
        audio_execution_service: Arc<dyn AudioExecutionService>,
        generation_execution_service: Arc<dyn GenerationExecutionService>,
    ) -> Self {
        Self {
            storage_paths,
            identity_service,
            audio_execution_service,
            generation_execution_service,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })
    }

    fn load_from_disk(&self) -> ServerResult<GenerationRegistryDocument> {
        self.storage_paths.ensure_root_dir()?;
        let registry_file = self.storage_paths.generation_registry_file();
        if !registry_file.exists() {
            return Ok(GenerationRegistryDocument {
                schema_version: GENERATION_SCHEMA_VERSION.to_string(),
                tasks: Vec::new(),
            });
        }

        let contents = fs::read_to_string(registry_file).map_err(|error| {
            ServerError::internal(format!(
                    "failed to read generation registry {}: {error}",
                    registry_file.display()
                ),
            )
        })?;

        let mut document =
            serde_json::from_str::<GenerationRegistryDocument>(&contents).map_err(|error| {
                ServerError::internal(format!(
                        "failed to parse generation registry {}: {error}",
                        registry_file.display()
                    ),
                )
            })?;

        if document.schema_version.trim().is_empty() {
            document.schema_version = GENERATION_SCHEMA_VERSION.to_string();
        }

        Ok(document)
    }

    fn persist_to_disk(&self, document: &GenerationRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let registry_file = self.storage_paths.generation_registry_file();
        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(format!("failed to serialize generation registry: {error}"),
            )
        })?;
        fs::write(registry_file, contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write generation registry {}: {error}",
                    registry_file.display()
                ),
            )
        })
    }

    fn normalize_input_ref(&self, input: MediaInputRefRecord) -> MediaInputRefRecord {
        let fallback_id = input
            .id
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| next_entity_id("generation-input", &GENERATION_INPUT_COUNTER));
        let fallback_uuid = if input.uuid.trim().is_empty() {
            to_client_entity_uuid(&fallback_id)
        } else {
            input.uuid
        };

        MediaInputRefRecord {
            id: Some(fallback_id),
            uuid: fallback_uuid,
            asset_id: input.asset_id.and_then(normalize_text),
            asset_uuid: input.asset_uuid.and_then(normalize_text),
            primary_resource_id: input.primary_resource_id.and_then(normalize_text),
            primary_resource_uuid: input
                .primary_resource_uuid
                .and_then(normalize_text),
            resource_view_id: input.resource_view_id.and_then(normalize_text),
            resource_view_uuid: input.resource_view_uuid.and_then(normalize_text),
            path: input.path.and_then(normalize_text),
            url: input.url.and_then(normalize_text),
            name: input.name.and_then(normalize_text),
            mime_type: input.mime_type.and_then(normalize_text),
            r#type: normalize_non_empty_with_fallback(input.r#type, "file"),
            role: normalize_non_empty_with_fallback(input.role, "input"),
            resource: input.resource,
            metadata: input.metadata,
            created_at: input.created_at.and_then(normalize_text),
            updated_at: input.updated_at.and_then(normalize_text),
            deleted_at: input.deleted_at.and_then(normalize_text),
        }
    }

    fn image_reference_inputs(&self, input: &ImageGenerationRequest) -> Vec<MediaInputRefRecord> {
        let mut refs = Vec::new();
        if let Some(reference_image) = input.reference_image.clone() {
            refs.push(self.normalize_input_ref(reference_image));
        }
        refs.extend(
            input
                .reference_images
                .clone()
                .into_iter()
                .map(|item| self.normalize_input_ref(item)),
        );
        refs
    }

    fn video_reference_inputs(&self, input: &VideoGenerationRequest) -> Vec<MediaInputRefRecord> {
        input
            .assets
            .iter()
            .map(|asset| {
                if let Some(existing) = asset.r#ref.clone() {
                    let mut normalized = self.normalize_input_ref(existing);
                    if normalized.role.trim().is_empty() {
                        normalized.role = asset.role.clone();
                    }
                    if normalized.r#type.trim().is_empty() {
                        normalized.r#type = asset.r#type.clone();
                    }
                    normalized
                } else {
                    self.normalize_input_ref(MediaInputRefRecord {
                        id: None,
                        uuid: String::new(),
                        asset_id: asset.asset_id.clone(),
                        asset_uuid: asset.asset_uuid.clone(),
                        primary_resource_id: asset.primary_resource_id.clone(),
                        primary_resource_uuid: asset.primary_resource_uuid.clone(),
                        resource_view_id: asset.resource_view_id.clone(),
                        resource_view_uuid: asset.resource_view_uuid.clone(),
                        path: Some(asset.value.clone()),
                        url: Some(asset.value.clone()),
                        name: None,
                        mime_type: None,
                        r#type: asset.r#type.clone(),
                        role: asset.role.clone(),
                        resource: None,
                        metadata: None,
                        created_at: None,
                        updated_at: None,
                        deleted_at: None,
                    })
                }
            })
            .collect()
    }

    fn video_task_parameters(&self, input: &VideoGenerationRequest) -> Option<Map<String, Value>> {
        json_map(vec![
            optional_json_string("generationType", Some(input.generation_type.clone())),
            optional_json_string("duration", Some(input.duration.clone())),
            optional_json_string("resolution", Some(input.resolution.clone())),
            optional_json_string("aspectRatio", Some(input.aspect_ratio.clone())),
            optional_json_string("videoStyleId", Some(input.video_style.id.clone())),
            optional_json_string("videoStylePrompt", Some(input.video_style.prompt.clone())),
            optional_json_object("options", input.options.clone()),
        ])
    }

    fn character_reference_inputs(
        &self,
        input: &CharacterGenerationRequest,
    ) -> Vec<MediaInputRefRecord> {
        input
            .avatar
            .clone()
            .into_iter()
            .map(|avatar| {
                let mut normalized = self.normalize_input_ref(avatar);
                normalized.role = "character-reference".to_string();
                if normalized.r#type.trim().is_empty() || normalized.r#type == "file" {
                    normalized.r#type = "image".to_string();
                }
                normalized
            })
            .collect()
    }

    fn single_input_ref(&self, input: Option<MediaInputRefRecord>) -> Vec<MediaInputRefRecord> {
        input
            .into_iter()
            .map(|item| self.normalize_input_ref(item))
            .collect()
    }

    fn create_task_record(
        &self,
        product: GenerationProduct,
        mode: impl Into<String>,
        prompt: Option<String>,
        negative_prompt: Option<String>,
        input_refs: Vec<MediaInputRefRecord>,
        provider_model: Option<String>,
        parameters: Option<Map<String, Value>>,
    ) -> GenerationTaskRecord {
        let task_id = next_entity_id("generation-task", &GENERATION_TASK_COUNTER);
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

        GenerationTaskRecord {
            id: task_id.clone(),
            uuid: to_client_entity_uuid(&task_id),
            task_id,
            product,
            mode: mode.into(),
            status: GenerationTaskStatus::Failed,
            prompt: prompt.and_then(normalize_text),
            negative_prompt: negative_prompt.and_then(normalize_text),
            provider: "magic-studio-server".to_string(),
            provider_model: provider_model
                .and_then(normalize_text)
                .unwrap_or_else(|| "unconfigured".to_string()),
            remote_job_id: None,
            progress: Some(0.0),
            error_code: Some(PROVIDER_NOT_CONFIGURED_CODE.to_string()),
            error_message: Some(PROVIDER_NOT_CONFIGURED_MESSAGE.to_string()),
            input_refs,
            artifacts: Vec::new(),
            primary_artifact: None,
            parameters,
            provider_payload: Some(provider_payload),
            created_at: now.clone(),
            updated_at: now.clone(),
            completed_at: Some(now),
            cancelled_at: None,
        }
    }

    fn execute_music_task_if_configured(
        &self,
        task: &mut GenerationTaskRecord,
        request: MusicGenerationExecutionRequest,
    ) {
        if !self.generation_execution_service.is_configured() {
            return;
        }

        let execution = self.generation_execution_service.generate_music(request);

        match execution {
            Ok(result) => self.mark_task_execution_succeeded(
                task,
                result.provider,
                result.provider_model,
                result.remote_job_id,
                result.artifact,
                result.provider_payload,
            ),
            Err(error) => self.mark_task_execution_failed(
                task,
                error,
                self.generation_execution_service.adapter_status(),
            ),
        }
    }

    fn store_task(&self, task: GenerationTaskRecord) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        document.tasks.insert(0, task.clone());
        self.persist_to_disk(&document)?;
        self.record_history(&task);
        Ok(task)
    }

    fn mark_task_execution_succeeded(
        &self,
        task: &mut GenerationTaskRecord,
        provider: String,
        provider_model: String,
        remote_job_id: Option<String>,
        artifact: GenerationArtifactRecord,
        provider_payload: Map<String, Value>,
    ) {
        let now = current_timestamp();
        task.status = GenerationTaskStatus::Succeeded;
        task.provider = provider;
        task.provider_model = provider_model;
        task.remote_job_id = remote_job_id;
        task.progress = Some(100.0);
        task.error_code = None;
        task.error_message = None;
        task.artifacts = vec![artifact.clone()];
        task.primary_artifact = Some(artifact);
        task.provider_payload = Some(provider_payload);
        task.updated_at = now.clone();
        task.completed_at = Some(now);
    }

    fn mark_task_execution_failed(
        &self,
        task: &mut GenerationTaskRecord,
        error: ServerError,
        adapter_status: &str,
    ) {
        let now = current_timestamp();
        let detail = error.detail.clone();
        task.status = GenerationTaskStatus::Failed;
        task.progress = Some(0.0);
        task.error_code = Some(error.code().to_string());
        task.error_message = Some(error.detail);
        task.updated_at = now.clone();
        task.completed_at = Some(now);
        let mut provider_payload = task.provider_payload.take().unwrap_or_default();
        provider_payload.insert(
            "failureReason".to_string(),
            Value::String("provider_request_failed".to_string()),
        );
        provider_payload.insert(
            "adapterStatus".to_string(),
            Value::String(adapter_status.to_string()),
        );
        if !detail.is_empty() {
            provider_payload.insert("failureDetail".to_string(), Value::String(detail));
        }
        task.provider_payload = Some(provider_payload);
    }

    fn record_history(&self, task: &GenerationTaskRecord) {
        let input = UserGenerationHistoryUpsert {
            task_id: task.task_id.clone(),
            category: match task.product {
                GenerationProduct::Image => "image".to_string(),
                GenerationProduct::Video => "video".to_string(),
                GenerationProduct::Audio => "audio".to_string(),
                GenerationProduct::Music => "music".to_string(),
                GenerationProduct::Character => "character".to_string(),
                GenerationProduct::Sfx => "sfx".to_string(),
                GenerationProduct::Speech => "voice".to_string(),
            },
            status: status_label(task.status).to_string(),
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
            if error.code() != "APP_AUTH_SESSION_REQUIRED" {
                eprintln!(
                    "[magic-studio-server] failed to record generation history {}: {}",
                    task.task_id, error.detail
                );
            }
        }
    }

    fn read_task_by_id(
        &self,
        product: GenerationProduct,
        task_id: &str,
    ) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_GENERATION_TASK_ID_EMPTY", "taskId")?;

        document
            .tasks
            .into_iter()
            .find(|task| {
                task.product == product
                    && (task.task_id == normalized_task_id
                        || task.id == normalized_task_id
                        || task.uuid == normalized_task_id)
            })
            .ok_or_else(|| {
                ServerError::not_found(format!("generation task {normalized_task_id} was not found"),
                )
            })
    }

    fn cancel_task_by_id(
        &self,
        product: GenerationProduct,
        task_id: &str,
    ) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_GENERATION_TASK_ID_EMPTY", "taskId")?;
        let now = current_timestamp();

        let task = document
            .tasks
            .iter_mut()
            .find(|task| {
                task.product == product
                    && (task.task_id == normalized_task_id
                        || task.id == normalized_task_id
                        || task.uuid == normalized_task_id)
            })
            .ok_or_else(|| {
                ServerError::not_found(format!("generation task {normalized_task_id} was not found"),
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
            task.error_code = Some("APP_GENERATION_TASK_CANCELLED".to_string());
            task.error_message = Some("generation task was cancelled".to_string());
        }

        let record = task.clone();
        self.persist_to_disk(&document)?;
        self.record_history(&record);
        Ok(record)
    }

    fn read_history_task_by_id(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_GENERATION_TASK_ID_EMPTY", "taskId")?;

        document
            .tasks
            .into_iter()
            .find(|task| {
                task.task_id == normalized_task_id
                    || task.id == normalized_task_id
                    || task.uuid == normalized_task_id
            })
            .ok_or_else(|| {
                ServerError::not_found(format!("generation task {normalized_task_id} was not found"),
                )
            })
    }

    fn delete_history_task_by_id(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized_task_id =
            require_non_empty_text(task_id, "APP_GENERATION_TASK_ID_EMPTY", "taskId")?;
        let position = document
            .tasks
            .iter()
            .position(|task| {
                task.task_id == normalized_task_id
                    || task.id == normalized_task_id
                    || task.uuid == normalized_task_id
            })
            .ok_or_else(|| {
                ServerError::not_found(format!("generation task {normalized_task_id} was not found"),
                )
            })?;

        let removed = document.tasks.remove(position);
        self.persist_to_disk(&document)?;
        Ok(removed)
    }

    fn list_tasks_for_history(
        &self,
        product: Option<GenerationProduct>,
        status: Option<String>,
    ) -> ServerResult<Vec<GenerationTaskRecord>> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let status_filter = status.and_then(normalize_text);

        Ok(document
            .tasks
            .into_iter()
            .filter(|task| product.map(|value| task.product == value).unwrap_or(true))
            .filter(|task| {
                status_filter
                    .as_ref()
                    .map(|value| history_status_matches(task.status, value))
                    .unwrap_or(true)
            })
            .collect())
    }

    fn list_tasks_by_product(
        &self,
        product: GenerationProduct,
        query: GenerationTaskListQuery,
    ) -> ServerResult<GenerationTaskPage> {
        let query = normalize_generation_task_list_query(query, Some(product))?;
        self.list_tasks_with_query(query)
    }

    fn list_tasks_with_query(
        &self,
        query: NormalizedGenerationTaskListQuery,
    ) -> ServerResult<GenerationTaskPage> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let product_filter = query.product;
        let status_filter = query.status;

        let filtered: Vec<GenerationTaskRecord> = document
            .tasks
            .into_iter()
            .filter(|task| {
                product_filter
                    .map(|product| task.product == product)
                    .unwrap_or(true)
            })
            .filter(|task| {
                status_filter
                    .map(|status| task.status == status)
                    .unwrap_or(true)
            })
            .collect();
        let total = filtered.len();
        let start = (query.page - 1).saturating_mul(query.page_size);
        let items = filtered
            .into_iter()
            .skip(start)
            .take(query.page_size)
            .collect();

        Ok(GenerationTaskPage {
            items,
            page: query.page,
            page_size: query.page_size,
            total,
        })
    }

    fn optimize_prompt_scene(&self, input: &PromptOptimizeRequest) -> String {
        if let Some(scene) = input.scene.clone().and_then(normalize_text) {
            return scene;
        }

        let prompt_type = input
            .r#type
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| "image".to_string());
        let mode = input
            .mode
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| "text-to-prompt".to_string());
        format!("prompt-optimization-{prompt_type}-{mode}")
    }

    fn optimize_prompt_input_text(&self, input: &PromptOptimizeRequest) -> String {
        let mut segments = vec![input.prompt.trim().to_string()];
        let prompt_type = input
            .r#type
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| "image".to_string());
        let mode = input
            .mode
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| "text-to-prompt".to_string());

        if prompt_type == "video" {
            segments.push("Optimize this for high-quality video generation with explicit shot composition, motion, pacing, and cinematic lighting.".to_string());
        } else {
            segments.push("Optimize this for high-quality image generation with explicit composition, lighting, materials, and visual detail.".to_string());
        }

        match mode.as_str() {
            "image-to-prompt" => {
                segments.push("Reference mode: image-to-prompt. Preserve the key subject, framing, and composition from the reference image.".to_string());
            }
            "video-to-prompt" => {
                segments.push("Reference mode: video-to-prompt. Preserve the visual rhythm, continuity, and key moments from the reference video.".to_string());
            }
            _ => {
                segments.push("Reference mode: text-to-prompt. Expand the user intent into a production-ready generation prompt.".to_string());
            }
        }

        if let Some(name) = input
            .input_image_name
            .clone()
            .and_then(normalize_text)
        {
            segments.push(format!("Reference image file: {name}."));
        }
        if let Some(url) = input
            .input_image_url
            .clone()
            .and_then(normalize_text)
        {
            segments.push(format!("Reference image URL: {url}."));
        }
        if let Some(name) = input
            .input_video_name
            .clone()
            .and_then(normalize_text)
        {
            segments.push(format!("Reference video file: {name}."));
        }
        if let Some(url) = input
            .input_video_url
            .clone()
            .and_then(normalize_text)
        {
            segments.push(format!("Reference video URL: {url}."));
        }
        if let Some(style) = input.target_style.clone().and_then(normalize_text) {
            segments.push(format!("Target style: {style}."));
        }
        if let Some(extra) = input
            .additional_instructions
            .clone()
            .and_then(normalize_text)
        {
            segments.push(format!("Additional instructions: {extra}."));
        }

        segments.join(" ")
    }

    fn optimize_prompt_suggestions(&self, prompt_type: &str) -> Vec<String> {
        if prompt_type == "video" {
            vec![
                "Specify camera movement to strengthen motion design.".to_string(),
                "Add timing and pacing cues to improve scene continuity.".to_string(),
                "Describe mood and lighting direction to stabilize cinematic style.".to_string(),
            ]
        } else {
            vec![
                "Add focal subject details and scene context for clearer composition.".to_string(),
                "Specify lighting and color palette to reduce style ambiguity.".to_string(),
                "Include material and texture cues to improve visual fidelity.".to_string(),
            ]
        }
    }

    fn optimize_prompt_keywords(&self, prompt: &str, target_style: Option<&str>) -> Vec<String> {
        let mut keywords = Vec::new();
        if let Some(style) = target_style {
            for keyword in extract_prompt_keywords(style) {
                if !keywords.iter().any(|item| item == &keyword) {
                    keywords.push(keyword);
                }
            }
        }
        for keyword in extract_prompt_keywords(prompt) {
            if !keywords.iter().any(|item| item == &keyword) {
                keywords.push(keyword);
            }
        }
        keywords.truncate(8);
        keywords
    }
}

impl GenerationService for FileBackedGenerationService {
    fn optimize_prompt(
        &self,
        input: PromptOptimizeRequest,
    ) -> ServerResult<PromptOptimizeResultRecord> {
        let original_input =
            require_non_empty_text(&input.prompt, "APP_PROMPT_OPTIMIZE_EMPTY", "prompt")?;
        let prompt_type = input
            .r#type
            .clone()
            .and_then(normalize_text)
            .unwrap_or_else(|| "image".to_string());
        let enhanced = self.enhance_prompt(GenerationPromptEnhanceRequest {
            prompt: self.optimize_prompt_input_text(&input),
            scene: Some(self.optimize_prompt_scene(&input)),
            style: input.target_style.clone(),
            language: input.language.clone(),
            max_words: input.max_words,
        })?;

        Ok(PromptOptimizeResultRecord {
            original_input,
            optimized_prompt: enhanced.prompt.clone(),
            suggestions: self.optimize_prompt_suggestions(&prompt_type),
            keywords: self
                .optimize_prompt_keywords(&enhanced.prompt, input.target_style.as_deref()),
        })
    }

    fn create_image_task(
        &self,
        input: ImageGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.image_reference_inputs(&input);
        let mode = if input_refs.is_empty() {
            "text-to-image"
        } else {
            "image-to-image"
        };
        let parameters = json_map(vec![
            optional_json_number("width", input.width.map(|value| value as f64)),
            optional_json_number("height", input.height.map(|value| value as f64)),
            optional_json_string("aspectRatio", input.aspect_ratio.clone()),
            optional_json_number("steps", input.steps),
            optional_json_number("guidance", input.guidance),
            optional_json_number("seed", input.seed),
            optional_json_string("style", input.style.clone()),
            optional_json_string("styleId", input.style_id.clone()),
            optional_json_number("batchSize", input.batch_size.map(|value| value as f64)),
            optional_json_bool("useMultiModel", input.use_multi_model),
            optional_json_array("models", input.models.clone()),
            optional_json_string("quality", input.quality.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Image,
            mode,
            input.prompt.clone(),
            input.negative_prompt.clone(),
            input_refs.clone(),
            input.model.clone(),
            parameters,
        );

        if self.generation_execution_service.is_configured() {
            let execution =
                self.generation_execution_service
                    .generate_image(ImageGenerationExecutionRequest {
                        task_id: task.task_id.clone(),
                        mode: task.mode.clone(),
                        prompt: input.prompt,
                        negative_prompt: input.negative_prompt,
                        model: input.model,
                        input_refs,
                        width: input.width,
                        height: input.height,
                        scale: None,
                        format: None,
                        aspect_ratio: input.aspect_ratio,
                        steps: input.steps,
                        guidance: input.guidance,
                        seed: input.seed,
                        style: input.style,
                        style_id: input.style_id,
                        quality: input.quality,
                        batch_size: input.batch_size,
                        use_multi_model: input.use_multi_model,
                        models: input.models,
                    });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    result.remote_job_id,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.generation_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_image_variation_task(
        &self,
        input: ImageGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.image_reference_inputs(&input);
        if input_refs.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let mut task = self.create_task_record(
            GenerationProduct::Image,
            "variation",
            input.prompt.clone(),
            input.negative_prompt.clone(),
            input_refs.clone(),
            input.model.clone(),
            None,
        );

        if self.generation_execution_service.is_configured() {
            let execution =
                self.generation_execution_service
                    .generate_image(ImageGenerationExecutionRequest {
                        task_id: task.task_id.clone(),
                        mode: task.mode.clone(),
                        prompt: input.prompt,
                        negative_prompt: input.negative_prompt,
                        model: input.model,
                        input_refs,
                        width: input.width,
                        height: input.height,
                        scale: None,
                        format: None,
                        aspect_ratio: input.aspect_ratio,
                        steps: input.steps,
                        guidance: input.guidance,
                        seed: input.seed,
                        style: input.style,
                        style_id: input.style_id,
                        quality: input.quality,
                        batch_size: input.batch_size,
                        use_multi_model: input.use_multi_model,
                        models: input.models,
                    });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    result.remote_job_id,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.generation_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_image_edit_task(
        &self,
        input: ImageEditRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let mut input_refs = vec![self.normalize_input_ref(input.source.clone())];
        if let Some(mask) = input.mask.clone() {
            input_refs.push(self.normalize_input_ref(mask));
        }
        let parameters = json_map(vec![
            optional_json_number("strength", input.strength),
            optional_json_string("format", input.format.clone()),
            optional_json_number("n", input.n.map(|value| value as f64)),
            optional_json_number("width", input.width.map(|value| value as f64)),
            optional_json_number("height", input.height.map(|value| value as f64)),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Image,
            "inpaint",
            input.prompt.clone(),
            input.negative_prompt.clone(),
            input_refs.clone(),
            input.model.clone(),
            parameters,
        );

        if self.generation_execution_service.is_configured() {
            let execution =
                self.generation_execution_service
                    .generate_image(ImageGenerationExecutionRequest {
                        task_id: task.task_id.clone(),
                        mode: task.mode.clone(),
                        prompt: input.prompt,
                        negative_prompt: input.negative_prompt,
                        model: input.model,
                        input_refs,
                        width: input.width,
                        height: input.height,
                        scale: None,
                        format: input.format,
                        aspect_ratio: None,
                        steps: None,
                        guidance: input.strength,
                        seed: None,
                        style: None,
                        style_id: None,
                        quality: None,
                        batch_size: input.n,
                        use_multi_model: None,
                        models: None,
                    });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    result.remote_job_id,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.generation_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_image_upscale_task(
        &self,
        input: ImageUpscaleRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_ref = self.normalize_input_ref(input.source);
        let parameters = json_map(vec![
            optional_json_number("scale", input.scale.map(|value| value as f64)),
            optional_json_number("targetWidth", input.target_width.map(|value| value as f64)),
            optional_json_number(
                "targetHeight",
                input.target_height.map(|value| value as f64),
            ),
            optional_json_string("format", input.format.clone()),
            optional_json_number("n", input.n.map(|value| value as f64)),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Image,
            "upscale",
            input.prompt.clone(),
            input.negative_prompt.clone(),
            vec![input_ref.clone()],
            input.model.clone(),
            parameters,
        );

        let execution =
            self.generation_execution_service
                .generate_image(ImageGenerationExecutionRequest {
                    task_id: task.task_id.clone(),
                    mode: task.mode.clone(),
                    prompt: input.prompt,
                    negative_prompt: input.negative_prompt,
                    model: input.model,
                    input_refs: vec![input_ref],
                    width: input.target_width,
                    height: input.target_height,
                    scale: input.scale,
                    format: input.format,
                    aspect_ratio: None,
                    steps: None,
                    guidance: None,
                    seed: None,
                    style: None,
                    style_id: None,
                    quality: None,
                    batch_size: input.n,
                    use_multi_model: None,
                    models: None,
                });

        match execution {
            Ok(result) => self.mark_task_execution_succeeded(
                &mut task,
                result.provider,
                result.provider_model,
                result.remote_job_id,
                result.artifact,
                result.provider_payload,
            ),
            Err(error) => self.mark_task_execution_failed(
                &mut task,
                error.clone(),
                if error.code() == "APP_HOST_IMAGE_UPSCALE_RUNTIME_UNAVAILABLE" {
                    "not-configured"
                } else {
                    GENERATION_ADAPTER_STATUS_HOST_LOCAL
                },
            ),
        }

        self.store_task(task)
    }

    fn read_image_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_task_by_id(GenerationProduct::Image, task_id)
    }

    fn create_video_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.video_reference_inputs(&input);
        let parameters = self.video_task_parameters(&input);
        let mut task = self.create_task_record(
            GenerationProduct::Video,
            "text-to-video",
            Some(input.prompt.clone()),
            Some(input.negative_prompt.clone()),
            input_refs.clone(),
            Some(input.model.clone()),
            parameters,
        );

        if self.generation_execution_service.is_configured() {
            let execution =
                self.generation_execution_service
                    .generate_video(VideoGenerationExecutionRequest {
                        task_id: task.task_id.clone(),
                        mode: task.mode.clone(),
                        prompt: input.prompt,
                        negative_prompt: Some(input.negative_prompt),
                        model: Some(input.model),
                        input_refs,
                        duration: Some(input.duration),
                        resolution: Some(input.resolution),
                        aspect_ratio: Some(input.aspect_ratio),
                        style_prompt: Some(input.video_style.prompt),
                        options: input.options,
                    });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    result.remote_job_id,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.generation_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_image_to_video_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.video_reference_inputs(&input);
        let parameters = self.video_task_parameters(&input);
        let mut task = self.create_task_record(
            GenerationProduct::Video,
            "image-to-video",
            Some(input.prompt.clone()),
            Some(input.negative_prompt.clone()),
            input_refs.clone(),
            Some(input.model.clone()),
            parameters,
        );

        if self.generation_execution_service.is_configured() {
            let execution =
                self.generation_execution_service
                    .generate_video(VideoGenerationExecutionRequest {
                        task_id: task.task_id.clone(),
                        mode: task.mode.clone(),
                        prompt: input.prompt,
                        negative_prompt: Some(input.negative_prompt),
                        model: Some(input.model),
                        input_refs,
                        duration: Some(input.duration),
                        resolution: Some(input.resolution),
                        aspect_ratio: Some(input.aspect_ratio),
                        style_prompt: Some(input.video_style.prompt),
                        options: input.options,
                    });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    result.remote_job_id,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.generation_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_video_extend_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.video_reference_inputs(&input);
        let parameters = self.video_task_parameters(&input);
        self.store_task(self.create_task_record(
            GenerationProduct::Video,
            "extend",
            Some(input.prompt.clone()),
            Some(input.negative_prompt.clone()),
            input_refs,
            Some(input.model.clone()),
            parameters,
        ))
    }

    fn create_video_style_transfer_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.video_reference_inputs(&input);
        let parameters = self.video_task_parameters(&input);
        self.store_task(self.create_task_record(
            GenerationProduct::Video,
            "style-transfer",
            Some(input.prompt.clone()),
            Some(input.negative_prompt.clone()),
            input_refs,
            Some(input.model.clone()),
            parameters,
        ))
    }

    fn create_video_lip_sync_task(
        &self,
        input: VideoGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let input_refs = self.video_reference_inputs(&input);
        let parameters = self.video_task_parameters(&input);
        self.store_task(self.create_task_record(
            GenerationProduct::Video,
            "lip-sync",
            Some(input.prompt.clone()),
            Some(input.negative_prompt.clone()),
            input_refs,
            Some(input.model.clone()),
            parameters,
        ))
    }

    fn read_video_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_task_by_id(GenerationProduct::Video, task_id)
    }

    fn cancel_video_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.cancel_task_by_id(GenerationProduct::Video, task_id)
    }

    fn create_audio_text_to_speech_task(
        &self,
        input: AudioGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let prompt = input
            .prompt
            .clone()
            .ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })
            .and_then(|value| {
                require_non_empty_text(&value, "APP_GENERATION_AUDIO_PROMPT_REQUIRED", "prompt")
            })?;
        let input_refs = self.single_input_ref(input.source_audio.clone());
        let parameters = json_map(vec![
            optional_json_string("mode", input.mode.clone()),
            optional_json_string("voice", input.voice.clone()),
            optional_json_number("duration", input.duration),
            optional_json_number("seed", input.seed),
            optional_json_string("language", input.language.clone()),
            optional_json_string("format", input.format.clone()),
            optional_json_string("idempotencyKey", input.idempotency_key.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Audio,
            "text-to-speech",
            Some(prompt.clone()),
            input.negative_prompt,
            input_refs,
            input.model.clone(),
            parameters.clone(),
        );

        if self.audio_execution_service.is_configured() {
            let execution = self
                .audio_execution_service
                .synthesize(SpeechExecutionRequest {
                    task_id: task.task_id.clone(),
                    output_namespace: "generation-audio".to_string(),
                    output_name_prefix: "generation-audio".to_string(),
                    text: prompt,
                    model: input.model,
                    voice: input.voice,
                    format: input.format,
                    language: input.language,
                    speed: None,
                    extra: parameters,
                });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    None,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.audio_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_audio_transcription_task(
        &self,
        input: AudioGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let Some(source_audio) = input.source_audio.clone() else {
            return Err(ServerError::bad_request("request validation failed"));
        };
        let parameters = json_map(vec![
            optional_json_string("mode", input.mode.clone()),
            optional_json_string("language", input.language.clone()),
            optional_json_string("sourceLanguage", input.source_language.clone()),
            optional_json_string("format", input.format.clone()),
            optional_json_string("idempotencyKey", input.idempotency_key.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Audio,
            "speech-to-text",
            input.prompt.clone(),
            input.negative_prompt,
            self.single_input_ref(Some(source_audio.clone())),
            input.model.clone(),
            parameters,
        );

        if self.audio_execution_service.is_configured() {
            let execution = self
                .audio_execution_service
                .transcribe(AudioTextExecutionRequest {
                    task_id: task.task_id.clone(),
                    output_name_prefix: "generation-audio-transcription".to_string(),
                    source_audio,
                    prompt: input.prompt,
                    model: input.model,
                    language: input.language,
                    source_language: input.source_language,
                    target_language: None,
                    format: input.format,
                    temperature: None,
                    extra: task.parameters.clone(),
                });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    None,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.audio_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn create_audio_translation_task(
        &self,
        input: AudioGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let Some(source_audio) = input.source_audio.clone() else {
            return Err(ServerError::bad_request("request validation failed"));
        };
        if input
            .target_language
            .clone()
            .and_then(normalize_text)
            .is_none()
        {
            return Err(ServerError::bad_request("request validation failed"));
        }
        let parameters = json_map(vec![
            optional_json_string("mode", input.mode.clone()),
            optional_json_string("format", input.format.clone()),
            optional_json_string("language", input.language.clone()),
            optional_json_string("sourceLanguage", input.source_language.clone()),
            optional_json_string("targetLanguage", input.target_language.clone()),
            optional_json_string("idempotencyKey", input.idempotency_key.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Audio,
            "speech-to-text",
            input.prompt.clone(),
            input.negative_prompt,
            self.single_input_ref(Some(source_audio.clone())),
            input.model.clone(),
            parameters,
        );

        if self.audio_execution_service.is_configured() {
            let execution = self
                .audio_execution_service
                .translate(AudioTextExecutionRequest {
                    task_id: task.task_id.clone(),
                    output_name_prefix: "generation-audio-translation".to_string(),
                    source_audio,
                    prompt: input.prompt,
                    model: input.model,
                    language: input.language,
                    source_language: input.source_language,
                    target_language: input.target_language,
                    format: input.format,
                    temperature: None,
                    extra: task.parameters.clone(),
                });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    None,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.audio_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn read_audio_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_task_by_id(GenerationProduct::Audio, task_id)
    }

    fn create_music_task(
        &self,
        input: MusicGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let prompt = require_non_empty_text(
            &input.prompt,
            "APP_GENERATION_MUSIC_PROMPT_REQUIRED",
            "prompt",
        )?;
        let parameters = json_map(vec![
            optional_json_string("title", input.title.clone()),
            optional_json_string("lyrics", input.lyrics.clone()),
            optional_json_string("style", input.style.clone()),
            optional_json_number("duration", input.duration),
            optional_json_bool("customMode", input.custom_mode),
            optional_json_bool("instrumental", input.instrumental),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Music,
            "text-to-music",
            Some(prompt.clone()),
            None,
            Vec::new(),
            input.model.clone(),
            parameters,
        );
        let task_id = task.task_id.clone();
        let task_mode = task.mode.clone();

        self.execute_music_task_if_configured(
            &mut task,
            MusicGenerationExecutionRequest {
                task_id,
                mode: task_mode,
                prompt,
                negative_prompt: None,
                model: input.model,
                input_refs: Vec::new(),
                title: input.title,
                lyrics: input.lyrics,
                style: input.style,
                duration: input.duration,
                instrumental: input.instrumental,
                custom_mode: input.custom_mode,
            },
        );

        self.store_task(task)
    }

    fn create_music_similar_task(
        &self,
        input: MusicSimilarRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let MusicSimilarRequest {
            source,
            duration,
            model,
            idempotency_key,
        } = input;
        let source = self.normalize_input_ref(source);
        let source_title = music_source_title(&source);
        let source_style = music_source_style(&source);
        let output_duration = duration.or_else(|| music_source_duration(&source));
        let generated_title = derive_music_variant_title(source_title.as_deref(), "Similar");
        let parameters = json_map(vec![
            optional_json_string("title", generated_title.clone()),
            optional_json_string("style", source_style.clone()),
            optional_json_number("duration", output_duration),
            optional_json_string("idempotencyKey", idempotency_key.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Music,
            "variation",
            Some(
                "Create a new track inspired by the reference audio while preserving its mood, energy, and instrumentation.".to_string(),
            ),
            None,
            vec![source.clone()],
            model.clone(),
            parameters,
        );
        let task_id = task.task_id.clone();
        let task_mode = task.mode.clone();

        self.execute_music_task_if_configured(
            &mut task,
            MusicGenerationExecutionRequest {
                task_id,
                mode: task_mode,
                prompt: "Create a new track inspired by the reference audio while preserving its mood, energy, and instrumentation.".to_string(),
                negative_prompt: None,
                model,
                input_refs: vec![source],
                title: generated_title,
                lyrics: None,
                style: source_style,
                duration: output_duration,
                instrumental: None,
                custom_mode: None,
            },
        );

        self.store_task(task)
    }

    fn create_music_remix_task(
        &self,
        input: MusicRemixRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let MusicRemixRequest {
            source,
            style,
            model,
            idempotency_key,
        } = input;
        let normalized_style =
            require_non_empty_text(&style, "APP_GENERATION_MUSIC_STYLE_EMPTY", "style")?;
        let source = self.normalize_input_ref(source);
        let source_title = music_source_title(&source);
        let output_duration = music_source_duration(&source);
        let generated_title = derive_music_variant_title(source_title.as_deref(), "Remix");
        let parameters = json_map(vec![
            optional_json_string("title", generated_title.clone()),
            optional_json_string("style", Some(normalized_style.clone())),
            optional_json_number("duration", output_duration),
            optional_json_string("idempotencyKey", idempotency_key.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Music,
            "restyle",
            Some(
                "Remix the reference audio into a fresh arrangement while preserving its recognizable identity.".to_string(),
            ),
            None,
            vec![source.clone()],
            model.clone(),
            parameters,
        );
        let task_id = task.task_id.clone();
        let task_mode = task.mode.clone();

        self.execute_music_task_if_configured(
            &mut task,
            MusicGenerationExecutionRequest {
                task_id,
                mode: task_mode,
                prompt:
                    "Remix the reference audio into a fresh arrangement while preserving its recognizable identity.".to_string(),
                negative_prompt: None,
                model,
                input_refs: vec![source],
                title: generated_title,
                lyrics: None,
                style: Some(normalized_style),
                duration: output_duration,
                instrumental: None,
                custom_mode: None,
            },
        );

        self.store_task(task)
    }

    fn create_music_extend_task(
        &self,
        input: MusicExtendRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let MusicExtendRequest {
            source,
            extend_duration,
            style,
            model,
            idempotency_key,
        } = input;
        let source = self.normalize_input_ref(source);
        let source_title = music_source_title(&source);
        let source_style = music_source_style(&source);
        let source_duration = music_source_duration(&source);
        let normalized_style = style.and_then(normalize_text);
        let output_duration = source_duration
            .map(|value| value + extend_duration)
            .or(Some(extend_duration));
        let generated_title = derive_music_variant_title(source_title.as_deref(), "Extended");
        let parameters = json_map(vec![
            optional_json_string("title", generated_title.clone()),
            optional_json_number("duration", output_duration),
            optional_json_number("extendDuration", Some(extend_duration)),
            optional_json_string("style", normalized_style.clone().or(source_style.clone())),
            optional_json_string("idempotencyKey", idempotency_key.clone()),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Music,
            "extend",
            Some(
                "Extend the reference audio naturally while preserving tempo, mood, and instrumentation continuity.".to_string(),
            ),
            None,
            vec![source.clone()],
            model.clone(),
            parameters,
        );
        let task_id = task.task_id.clone();
        let task_mode = task.mode.clone();

        self.execute_music_task_if_configured(
            &mut task,
            MusicGenerationExecutionRequest {
                task_id,
                mode: task_mode,
                prompt:
                    "Extend the reference audio naturally while preserving tempo, mood, and instrumentation continuity.".to_string(),
                negative_prompt: None,
                model,
                input_refs: vec![source],
                title: generated_title,
                lyrics: None,
                style: normalized_style.or(source_style),
                duration: output_duration,
                instrumental: None,
                custom_mode: None,
            },
        );

        self.store_task(task)
    }

    fn read_music_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_task_by_id(GenerationProduct::Music, task_id)
    }

    fn create_character_task(
        &self,
        input: CharacterGenerationRequest,
    ) -> ServerResult<GenerationTaskRecord> {
        let prompt = require_non_empty_text(
            &input.prompt,
            "APP_GENERATION_CHARACTER_PROMPT_REQUIRED",
            "prompt",
        )?;
        let execution_prompt = compose_character_generation_prompt(&input, &prompt);
        let input_refs = self.character_reference_inputs(&input);
        let requested_model = input.model.clone();
        let requested_aspect_ratio = input.aspect_ratio.clone();
        let requested_style = input.archetype.clone();
        let (width, height) =
            character_dimensions_from_aspect_ratio(requested_aspect_ratio.as_deref());
        let parameters = json_map(vec![
            optional_json_string("description", input.description),
            optional_json_string("archetype", input.archetype),
            optional_json_string("gender", input.gender),
            optional_json_number("age", input.age.map(|value| value as f64)),
            optional_json_string("outfit", input.outfit),
            optional_json_string("aspectRatio", input.aspect_ratio),
            optional_json_string("voiceId", input.voice_id),
            optional_json_string("avatarMode", input.avatar_mode),
            optional_json_string("hairstyle", input.hairstyle),
            optional_json_string("hairColor", input.hair_color),
            optional_json_string("eyeColor", input.eye_color),
            optional_json_string("skinTone", input.skin_tone),
            optional_json_string("accessories", input.accessories),
        ]);
        let mut task = self.create_task_record(
            GenerationProduct::Character,
            "text-to-character",
            Some(prompt),
            None,
            input_refs.clone(),
            requested_model.clone(),
            parameters,
        );

        if self.generation_execution_service.is_configured() {
            let execution =
                self.generation_execution_service
                    .generate_image(ImageGenerationExecutionRequest {
                        task_id: task.task_id.clone(),
                        mode: task.mode.clone(),
                        prompt: Some(execution_prompt),
                        negative_prompt: None,
                        model: requested_model,
                        input_refs,
                        width,
                        height,
                        scale: None,
                        format: None,
                        aspect_ratio: requested_aspect_ratio,
                        steps: None,
                        guidance: None,
                        seed: None,
                        style: requested_style,
                        style_id: None,
                        quality: None,
                        batch_size: Some(1),
                        use_multi_model: None,
                        models: None,
                    });

            match execution {
                Ok(result) => self.mark_task_execution_succeeded(
                    &mut task,
                    result.provider,
                    result.provider_model,
                    result.remote_job_id,
                    result.artifact,
                    result.provider_payload,
                ),
                Err(error) => self.mark_task_execution_failed(
                    &mut task,
                    error,
                    self.generation_execution_service.adapter_status(),
                ),
            }
        }

        self.store_task(task)
    }

    fn list_character_tasks(
        &self,
        query: GenerationTaskListQuery,
    ) -> ServerResult<GenerationTaskPage> {
        self.list_tasks_by_product(GenerationProduct::Character, query)
    }

    fn read_character_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_task_by_id(GenerationProduct::Character, task_id)
    }

    fn cancel_character_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.cancel_task_by_id(GenerationProduct::Character, task_id)
    }

    fn create_sfx_task(&self, input: SfxGenerationRequest) -> ServerResult<GenerationTaskRecord> {
        let prompt = require_non_empty_text(
            &input.prompt,
            "APP_GENERATION_SFX_PROMPT_REQUIRED",
            "prompt",
        )?;
        let model =
            require_non_empty_text(&input.model, "APP_GENERATION_SFX_MODEL_REQUIRED", "model")?;
        let parameters = json_map(vec![
            optional_json_number("duration", Some(input.duration)),
            optional_json_string("mediaType", input.media_type),
        ]);
        self.store_task(self.create_task_record(
            GenerationProduct::Sfx,
            "text-to-audio",
            Some(prompt),
            None,
            Vec::new(),
            Some(model),
            parameters,
        ))
    }

    fn list_sfx_tasks(&self, query: GenerationTaskListQuery) -> ServerResult<GenerationTaskPage> {
        self.list_tasks_by_product(GenerationProduct::Sfx, query)
    }

    fn list_sfx_categories(&self) -> ServerResult<Vec<SfxCategoryRecord>> {
        Ok(vec![
            SfxCategoryRecord {
                id: "whoosh".to_string(),
                label: "Whoosh".to_string(),
                description: Some("Fast motion and transition effects.".to_string()),
            },
            SfxCategoryRecord {
                id: "impact".to_string(),
                label: "Impact".to_string(),
                description: Some("Hits, crashes, and heavy accent sounds.".to_string()),
            },
            SfxCategoryRecord {
                id: "ambient".to_string(),
                label: "Ambient".to_string(),
                description: Some("Environmental beds and atmosphere.".to_string()),
            },
            SfxCategoryRecord {
                id: "ui".to_string(),
                label: "UI".to_string(),
                description: Some("Interface taps, notifications, and transitions.".to_string()),
            },
            SfxCategoryRecord {
                id: "creature".to_string(),
                label: "Creature".to_string(),
                description: Some("Monster, animal, and fantasy vocalizations.".to_string()),
            },
        ])
    }

    fn read_sfx_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_task_by_id(GenerationProduct::Sfx, task_id)
    }

    fn cancel_sfx_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.cancel_task_by_id(GenerationProduct::Sfx, task_id)
    }

    fn enhance_prompt(
        &self,
        input: GenerationPromptEnhanceRequest,
    ) -> ServerResult<GenerationPromptEnhanceResultRecord> {
        let prompt =
            require_non_empty_text(&input.prompt, "APP_GENERATION_PROMPT_EMPTY", "prompt")?;
        let scene = input
            .scene
            .and_then(normalize_text)
            .unwrap_or_else(|| "general".to_string());
        let style = input.style.and_then(normalize_text);
        let language = input.language.and_then(normalize_text);
        let max_words = input.max_words.unwrap_or(120).clamp(12, 400);

        let lead = match scene.as_str() {
            "image-generation" => {
                "Create a visually specific image prompt with subject, composition, lighting, texture, and quality cues."
            }
            "video-generation" => {
                "Create a cinematic video prompt with subject, motion, camera intent, scene continuity, and finishing detail."
            }
            "agent-system-prompt" => {
                "Rewrite this as a clear, enforceable system prompt with explicit priorities, constraints, and behavioral rules."
            }
            _ => "Rewrite this into a precise, execution-ready prompt with concrete detail and minimal ambiguity.",
        };

        let mut parts = vec![lead.to_string(), prompt];
        if let Some(style_value) = style {
            parts.push(format!("Preferred style: {style_value}."));
        }
        if let Some(language_value) = language {
            parts.push(format!("Output language: {language_value}."));
        }

        let tail = match scene.as_str() {
            "image-generation" => {
                "Keep the final wording dense, descriptive, and visually grounded."
            }
            "video-generation" => {
                "Keep the final wording motion-aware, shot-consistent, and production friendly."
            }
            "agent-system-prompt" => {
                "Keep the final wording structured, concise, and suitable for direct runtime execution."
            }
            _ => "Keep the final wording specific, concise, and directly usable.",
        };
        parts.push(tail.to_string());

        Ok(GenerationPromptEnhanceResultRecord {
            prompt: trim_to_word_limit(parts.join(" "), max_words),
        })
    }

    fn list_history_tasks(
        &self,
        product: Option<GenerationProduct>,
        status: Option<String>,
    ) -> ServerResult<Vec<GenerationTaskRecord>> {
        self.list_tasks_for_history(product, status)
    }

    fn read_history_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.read_history_task_by_id(task_id)
    }

    fn delete_history_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        self.delete_history_task_by_id(task_id)
    }
}

fn optional_json_string(key: &str, value: Option<String>) -> Option<(String, Value)> {
    value
        .and_then(normalize_text)
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

fn optional_json_array(key: &str, value: Option<Vec<String>>) -> Option<(String, Value)> {
    value.map(|value| {
        (
            key.to_string(),
            Value::Array(value.into_iter().map(Value::String).collect()),
        )
    })
}

fn optional_json_object(key: &str, value: Option<Map<String, Value>>) -> Option<(String, Value)> {
    value.map(|value| (key.to_string(), Value::Object(value)))
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

fn media_input_metadata_string(input: &MediaInputRefRecord, key: &str) -> Option<String> {
    input
        .metadata
        .as_ref()
        .and_then(|metadata| metadata.get(key))
        .and_then(Value::as_str)
        .and_then(|value| normalize_text(value.to_string()))
}

fn media_input_metadata_number(input: &MediaInputRefRecord, key: &str) -> Option<f64> {
    input
        .metadata
        .as_ref()
        .and_then(|metadata| metadata.get(key))
        .and_then(Value::as_f64)
}

fn music_source_title(input: &MediaInputRefRecord) -> Option<String> {
    media_input_metadata_string(input, "title")
        .or_else(|| input.name.clone().and_then(normalize_text))
}

fn music_source_style(input: &MediaInputRefRecord) -> Option<String> {
    media_input_metadata_string(input, "style")
}

fn music_source_duration(input: &MediaInputRefRecord) -> Option<f64> {
    media_input_metadata_number(input, "duration").filter(|value| value.is_finite() && *value > 0.0)
}

fn derive_music_variant_title(source_title: Option<&str>, suffix: &str) -> Option<String> {
    source_title
.and_then(|value| normalize_text(value.to_string()))
.map(|title| format!("{title} {suffix}"))
}

fn character_dimensions_from_aspect_ratio(
    aspect_ratio: Option<&str>,
) -> (Option<u32>, Option<u32>) {
    match aspect_ratio
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or_default()
    {
        "9:16" => (Some(720), Some(1280)),
        "16:9" => (Some(1280), Some(720)),
        "4:5" => (Some(864), Some(1080)),
        "1:1" => (Some(1024), Some(1024)),
        _ => (None, None),
    }
}

fn compose_character_generation_prompt(input: &CharacterGenerationRequest, prompt: &str) -> String {
    let mut sections = vec![prompt.trim().to_string()];

    if let Some(description) = input
        .description
        .clone()
        .and_then(normalize_text)
        .filter(|description| description != prompt)
    {
        sections.push(format!("Character brief: {description}."));
    }

    let mut descriptors = Vec::<String>::new();
    if let Some(archetype) = input.archetype.clone().and_then(normalize_text) {
        descriptors.push(format!("archetype {archetype}"));
    }
    if let Some(gender) = input.gender.clone().and_then(normalize_text) {
        descriptors.push(format!("gender presentation {gender}"));
    }
    if let Some(age) = input.age.filter(|value| *value > 0) {
        descriptors.push(format!("apparent age around {age}"));
    }
    if let Some(outfit) = input.outfit.clone().and_then(normalize_text) {
        descriptors.push(format!("outfit {outfit}"));
    }
    if !descriptors.is_empty() {
        sections.push(format!("Core design cues: {}.", descriptors.join(", ")));
    }

    let mut appearance = Vec::<String>::new();
    if let Some(hairstyle) = input.hairstyle.clone().and_then(normalize_text) {
        appearance.push(format!("hairstyle {hairstyle}"));
    }
    if let Some(hair_color) = input.hair_color.clone().and_then(normalize_text) {
        appearance.push(format!("hair color {hair_color}"));
    }
    if let Some(eye_color) = input.eye_color.clone().and_then(normalize_text) {
        appearance.push(format!("eye color {eye_color}"));
    }
    if let Some(skin_tone) = input.skin_tone.clone().and_then(normalize_text) {
        appearance.push(format!("skin tone {skin_tone}"));
    }
    if let Some(accessories) = input.accessories.clone().and_then(normalize_text) {
        appearance.push(format!("accessories {accessories}"));
    }
    if !appearance.is_empty() {
        sections.push(format!("Appearance details: {}.", appearance.join(", ")));
    }

    if let Some(avatar_mode) = input.avatar_mode.clone().and_then(normalize_text) {
        let direction = match avatar_mode.as_str() {
            "portrait" => "Frame the result as a polished portrait focused on the face and upper body.",
            "three-view" => {
                "Present the character as a clear three-view design sheet with front, side, and back readability."
            }
            "full-body" => {
                "Render the full body with a strong silhouette, readable pose, and complete costume visibility."
            }
            _ => "Render a polished, production-ready character design image.",
        };
        sections.push(direction.to_string());
    } else {
        sections.push(
            "Render a polished, production-ready character design image with a clear silhouette and readable costume details."
                .to_string(),
        );
    }

    if input.avatar.is_some() {
        sections.push(
            "Use the reference image as visual guidance while preserving the requested design changes."
                .to_string(),
        );
    }

    sections.join("\n")
}

fn status_label(status: GenerationTaskStatus) -> &'static str {
    match status {
        GenerationTaskStatus::Draft => "draft",
        GenerationTaskStatus::Queued => "queued",
        GenerationTaskStatus::Processing => "processing",
        GenerationTaskStatus::Succeeded => "succeeded",
        GenerationTaskStatus::Failed => "failed",
        GenerationTaskStatus::Cancelled => "cancelled",
    }
}

fn generation_product_label(product: GenerationProduct) -> &'static str {
    match product {
        GenerationProduct::Image => "image",
        GenerationProduct::Video => "video",
        GenerationProduct::Audio => "audio",
        GenerationProduct::Music => "music",
        GenerationProduct::Character => "character",
        GenerationProduct::Sfx => "sfx",
        GenerationProduct::Speech => "speech",
    }
}

fn parse_generation_product(value: &str) -> ServerResult<GenerationProduct> {
    match value.trim().to_ascii_lowercase().as_str() {
        "image" => Ok(GenerationProduct::Image),
        "video" => Ok(GenerationProduct::Video),
        "audio" => Ok(GenerationProduct::Audio),
        "music" => Ok(GenerationProduct::Music),
        "character" => Ok(GenerationProduct::Character),
        "sfx" => Ok(GenerationProduct::Sfx),
        "speech" => Ok(GenerationProduct::Speech),
        _ => Err(ServerError::bad_request(format!(
                "product must be one of image, video, audio, music, character, sfx, or speech; received {value}"
            ),
        )),
    }
}

fn parse_generation_task_status(value: &str) -> ServerResult<GenerationTaskStatus> {
    match value.trim().to_ascii_lowercase().as_str() {
        "draft" => Ok(GenerationTaskStatus::Draft),
        "queued" | "pending" => Ok(GenerationTaskStatus::Queued),
        "processing" | "running" | "in_progress" | "in-progress" => {
            Ok(GenerationTaskStatus::Processing)
        }
        "succeeded" | "success" | "completed" | "done" => {
            Ok(GenerationTaskStatus::Succeeded)
        }
        "failed" | "error" => Ok(GenerationTaskStatus::Failed),
        "cancelled" | "canceled" => Ok(GenerationTaskStatus::Cancelled),
        _ => Err(ServerError::bad_request(format!(
                "status must be one of draft, queued, processing, succeeded, failed, or cancelled; received {value}"
            ),
        )),
    }
}

fn normalize_generation_task_list_query(
    query: GenerationTaskListQuery,
    required_product: Option<GenerationProduct>,
) -> ServerResult<NormalizedGenerationTaskListQuery> {
    let requested_product = query
        .product
        .and_then(normalize_text)
        .map(|value| parse_generation_product(&value))
        .transpose()?;
    let product = match (required_product, requested_product) {
        (Some(required), Some(requested)) if required != requested => {
            return Err(ServerError::bad_request(format!(
                    "task list route is scoped to product {}, but query requested {}",
                    generation_product_label(required),
                    generation_product_label(requested)
                ),
            ));
        }
        (Some(required), _) => Some(required),
        (None, requested) => requested,
    };
    let status = query
        .status
        .and_then(normalize_text)
        .map(|value| parse_generation_task_status(&value))
        .transpose()?;

    Ok(NormalizedGenerationTaskListQuery {
        page: query.page.unwrap_or(1).max(1),
        page_size: query.page_size.unwrap_or(20).clamp(1, 200),
        product,
        status,
    })
}

fn history_status_matches(status: GenerationTaskStatus, filter: &str) -> bool {
    match filter.trim().to_ascii_lowercase().as_str() {
        "draft" => matches!(status, GenerationTaskStatus::Draft),
        "queued" | "pending" => matches!(status, GenerationTaskStatus::Queued),
        "processing" | "running" | "in_progress" | "in-progress" => {
            matches!(status, GenerationTaskStatus::Processing)
        }
        "succeeded" | "success" | "completed" | "done" => {
            matches!(status, GenerationTaskStatus::Succeeded)
        }
        "failed" | "error" => matches!(status, GenerationTaskStatus::Failed),
        "cancelled" | "canceled" => matches!(status, GenerationTaskStatus::Cancelled),
        _ => false,
    }
}

fn trim_to_word_limit(value: String, max_words: usize) -> String {
    let words: Vec<&str> = value.split_whitespace().collect();
    if words.len() <= max_words {
        return value;
    }

    words[..max_words].join(" ")
}


fn normalize_non_empty_with_fallback(value: String, fallback: &str) -> String {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        fallback.to_string()
    } else {
        trimmed.to_string()
    }
}


fn next_entity_id(prefix: &str, counter: &AtomicU64) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = counter.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}



fn extract_prompt_keywords(value: &str) -> Vec<String> {
    let mut keywords = Vec::new();
    for token in value.split(|char: char| !char.is_alphanumeric() && char != '-') {
        let normalized = token.trim().to_lowercase();
        if normalized.len() < 4 {
            continue;
        }
        if keywords.iter().any(|item| item == &normalized) {
            continue;
        }
        keywords.push(normalized);
        if keywords.len() >= 8 {
            break;
        }
    }
    keywords
}
