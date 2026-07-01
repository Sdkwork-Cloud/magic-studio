use std::sync::Arc;

use crate::response::{ServerError, ServerResult, SdkWorkResultCode };

use super::generation::{
    GenerationProduct, GenerationService, GenerationTaskListQuery, GenerationTaskPage,
    GenerationTaskRecord, GenerationTaskStatus,
};
use super::voices::VoiceService;

use super::service_utils::{normalize_optional_text};
pub trait GenerationGovernanceService: Send + Sync {
    fn list_tasks(&self, query: GenerationTaskListQuery) -> ServerResult<GenerationTaskPage>;
    fn read_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn delete_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
    fn cancel_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord>;
}

pub struct CanonicalGenerationGovernanceService {
    generation_service: Arc<dyn GenerationService>,
    voice_service: Arc<dyn VoiceService>,
}

impl CanonicalGenerationGovernanceService {
    pub fn new(
        generation_service: Arc<dyn GenerationService>,
        voice_service: Arc<dyn VoiceService>,
    ) -> Self {
        Self {
            generation_service,
            voice_service,
        }
    }

    fn read_task_from_sources(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        match self.generation_service.read_history_task(task_id) {
            Ok(task) => Ok(task),
            Err(error) if is_not_found(&error) => {
                match self.voice_service.read_speech_task(task_id) {
                    Ok(task) => Ok(task),
                    Err(error) if is_not_found(&error) => Err(canonical_task_not_found(task_id)),
                    Err(error) => Err(error),
                }
            }
            Err(error) => Err(error),
        }
    }
}

impl GenerationGovernanceService for CanonicalGenerationGovernanceService {
    fn list_tasks(&self, query: GenerationTaskListQuery) -> ServerResult<GenerationTaskPage> {
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query.page_size.unwrap_or(20).clamp(1, 200);
        let product_filter = normalize_optional_text(query.product)
            .map(|value| parse_generation_governance_product(&value))
            .transpose()?;
        let status_filter = normalize_optional_text(query.status)
            .map(|value| parse_generation_governance_status(&value))
            .transpose()?;

        let mut items = match product_filter {
            Some(GenerationGovernanceProduct::Speech) => {
                self.voice_service.list_history_speech_tasks(None)?
            }
            Some(GenerationGovernanceProduct::Standard(product)) => self
                .generation_service
                .list_history_tasks(Some(product), None)?,
            None => {
                let mut merged = self.generation_service.list_history_tasks(None, None)?;
                merged.extend(self.voice_service.list_history_speech_tasks(None)?);
                merged
            }
        };

        if let Some(status) = status_filter {
            items.retain(|task| task.status == status);
        }

        items.sort_by(|left, right| {
            right
                .updated_at
                .cmp(&left.updated_at)
                .then_with(|| right.created_at.cmp(&left.created_at))
                .then_with(|| left.task_id.cmp(&right.task_id))
        });

        let total = items.len();
        let start = (page - 1).saturating_mul(page_size);
        let items = items.into_iter().skip(start).take(page_size).collect();

        Ok(GenerationTaskPage {
            items,
            page,
            page_size,
            total,
        })
    }

    fn read_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let normalized_task_id = normalize_task_id(task_id)?;
        self.read_task_from_sources(&normalized_task_id)
    }

    fn delete_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let normalized_task_id = normalize_task_id(task_id)?;

        match self
            .generation_service
            .delete_history_task(&normalized_task_id)
        {
            Ok(task) => Ok(task),
            Err(error) if is_not_found(&error) => {
                let task = match self.voice_service.read_speech_task(&normalized_task_id) {
                    Ok(task) => task,
                    Err(error) if is_not_found(&error) => {
                        return Err(canonical_task_not_found(&normalized_task_id));
                    }
                    Err(error) => return Err(error),
                };
                self.voice_service.delete_speech_task(&normalized_task_id)?;
                Ok(task)
            }
            Err(error) => Err(error),
        }
    }

    fn cancel_task(&self, task_id: &str) -> ServerResult<GenerationTaskRecord> {
        let normalized_task_id = normalize_task_id(task_id)?;
        let task = self.read_task_from_sources(&normalized_task_id)?;

        match task.product {
            GenerationProduct::Video => self
                .generation_service
                .cancel_video_task(&normalized_task_id),
            GenerationProduct::Character => self
                .generation_service
                .cancel_character_task(&normalized_task_id),
            GenerationProduct::Sfx => self.generation_service.cancel_sfx_task(&normalized_task_id),
            GenerationProduct::Speech => self.voice_service.cancel_speech_task(&normalized_task_id),
            GenerationProduct::Image | GenerationProduct::Audio | GenerationProduct::Music => {
                Err(ServerError::conflict(format!(
                        "generation task {} does not support canonical cancellation for product {}",
                        normalized_task_id,
                        generation_governance_product_label(task.product)
                    ),
                ))
            }
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum GenerationGovernanceProduct {
    Standard(GenerationProduct),
    Speech,
}

fn parse_generation_governance_product(value: &str) -> ServerResult<GenerationGovernanceProduct> {
    match value.trim().to_ascii_lowercase().as_str() {
        "image" => Ok(GenerationGovernanceProduct::Standard(
            GenerationProduct::Image,
        )),
        "video" => Ok(GenerationGovernanceProduct::Standard(
            GenerationProduct::Video,
        )),
        "audio" => Ok(GenerationGovernanceProduct::Standard(
            GenerationProduct::Audio,
        )),
        "music" => Ok(GenerationGovernanceProduct::Standard(
            GenerationProduct::Music,
        )),
        "character" => Ok(GenerationGovernanceProduct::Standard(
            GenerationProduct::Character,
        )),
        "sfx" => Ok(GenerationGovernanceProduct::Standard(GenerationProduct::Sfx)),
        "speech" => Ok(GenerationGovernanceProduct::Speech),
        _ => Err(ServerError::bad_request(format!(
                "product must be one of image, video, audio, music, character, sfx, or speech; received {value}"
            ),
        )),
    }
}

fn parse_generation_governance_status(value: &str) -> ServerResult<GenerationTaskStatus> {
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

fn generation_governance_product_label(product: GenerationProduct) -> &'static str {
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

fn normalize_task_id(task_id: &str) -> ServerResult<String> {
    normalize_optional_text(Some(task_id.to_string())).ok_or_else(|| {
        ServerError::bad_request("request validation failed")
    })
}

fn canonical_task_not_found(task_id: &str) -> ServerError {
    ServerError::not_found(format!("generation task {task_id} was not found"),
    )
}

fn is_not_found(error: &ServerError) -> bool {
    error.result_code == SdkWorkResultCode::NotFound
}

