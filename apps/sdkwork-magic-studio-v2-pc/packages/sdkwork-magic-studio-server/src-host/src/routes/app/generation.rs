use axum::extract::{Path, Query, State};
use axum::Json;

use crate::response::{list, list_with_pagination, success, ServerResult};
use crate::services::generation::{
    AudioGenerationRequest, CharacterGenerationRequest, GenerationPromptEnhanceRequest,
    GenerationTaskListQuery, ImageEditRequest, ImageGenerationRequest, ImageUpscaleRequest,
    MusicExtendRequest, MusicGenerationRequest, MusicRemixRequest, MusicSimilarRequest,
    PromptOptimizeRequest, SfxCategoryRecord, SfxGenerationRequest, VideoGenerationRequest,
};
use crate::services::generation_catalog::GenerationCatalogQuery;
use crate::services::voices::VoiceListQuery;
use crate::state::AppState;

pub async fn list_generation_catalog_providers(
    State(state): State<AppState>,
    Query(query): Query<GenerationCatalogQuery>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::generation_catalog::GenerationCatalogProviderRecord,
        >,
    >,
> {
    Ok(list(
        state.generation_catalog_service.list_providers(query)?,
    ))
}

pub async fn list_generation_catalog_models(
    State(state): State<AppState>,
    Query(query): Query<GenerationCatalogQuery>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::generation_catalog::GenerationCatalogModelRecord,
        >,
    >,
> {
    Ok(list(state.generation_catalog_service.list_models(query)?))
}

pub async fn list_generation_catalog_styles(
    State(state): State<AppState>,
    Query(query): Query<GenerationCatalogQuery>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::generation_catalog::GenerationCatalogStyleRecord,
        >,
    >,
> {
    Ok(list(state.generation_catalog_service.list_styles(query)?))
}

pub async fn list_generation_catalog_voices(
    State(state): State<AppState>,
    Query(query): Query<VoiceListQuery>,
) -> ServerResult<Json<crate::response::ApiList<crate::services::voices::VoiceSpeakerRecord>>>
{
    let page = state.generation_catalog_service.list_voices(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn list_generation_tasks(
    State(state): State<AppState>,
    Query(query): Query<GenerationTaskListQuery>,
) -> ServerResult<
    Json<crate::response::ApiList<crate::services::generation::GenerationTaskRecord>>,
> {
    let page = state.generation_governance_service.list_tasks(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_generation_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_governance_service.read_task(&task_id)?,
    ))
}

pub async fn delete_generation_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_governance_service.delete_task(&task_id)?,
    ))
}

pub async fn cancel_generation_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_governance_service.cancel_task(&task_id)?,
    ))
}

pub async fn create_image_task(
    State(state): State<AppState>,
    Json(payload): Json<ImageGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_image_task(payload)?,
    ))
}

pub async fn create_image_variation_task(
    State(state): State<AppState>,
    Json(payload): Json<ImageGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_image_variation_task(payload)?,
    ))
}

pub async fn create_image_edit_task(
    State(state): State<AppState>,
    Json(payload): Json<ImageEditRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_image_edit_task(payload)?,
    ))
}

pub async fn create_image_upscale_task(
    State(state): State<AppState>,
    Json(payload): Json<ImageUpscaleRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_image_upscale_task(payload)?,
    ))
}

pub async fn enhance_image_prompt(
    State(state): State<AppState>,
    Json(payload): Json<GenerationPromptEnhanceRequest>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<
            crate::services::generation::GenerationPromptEnhanceResultRecord,
        >,
    >,
> {
    Ok(success(state.generation_service.enhance_prompt(
        with_default_scene(payload, "image-generation"),
    )?))
}

pub async fn read_image_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.read_image_task(&task_id)?))
}

pub async fn create_video_task(
    State(state): State<AppState>,
    Json(payload): Json<VideoGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_video_task(payload)?,
    ))
}

pub async fn create_image_to_video_task(
    State(state): State<AppState>,
    Json(payload): Json<VideoGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_image_to_video_task(payload)?,
    ))
}

pub async fn create_video_extend_task(
    State(state): State<AppState>,
    Json(payload): Json<VideoGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_video_extend_task(payload)?,
    ))
}

pub async fn create_video_style_transfer_task(
    State(state): State<AppState>,
    Json(payload): Json<VideoGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_video_style_transfer_task(payload)?,
    ))
}

pub async fn create_video_lip_sync_task(
    State(state): State<AppState>,
    Json(payload): Json<VideoGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_video_lip_sync_task(payload)?,
    ))
}

pub async fn enhance_video_prompt(
    State(state): State<AppState>,
    Json(payload): Json<GenerationPromptEnhanceRequest>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<
            crate::services::generation::GenerationPromptEnhanceResultRecord,
        >,
    >,
> {
    Ok(success(state.generation_service.enhance_prompt(
        with_default_scene(payload, "video-generation"),
    )?))
}

pub async fn read_video_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.read_video_task(&task_id)?))
}

pub async fn cancel_video_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.cancel_video_task(&task_id)?,
    ))
}

pub async fn create_audio_text_to_speech_task(
    State(state): State<AppState>,
    Json(payload): Json<AudioGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_audio_text_to_speech_task(payload)?,
    ))
}

pub async fn create_audio_transcription_task(
    State(state): State<AppState>,
    Json(payload): Json<AudioGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_audio_transcription_task(payload)?,
    ))
}

pub async fn create_audio_translation_task(
    State(state): State<AppState>,
    Json(payload): Json<AudioGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_audio_translation_task(payload)?,
    ))
}

pub async fn read_audio_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.read_audio_task(&task_id)?))
}

pub async fn create_music_task(
    State(state): State<AppState>,
    Json(payload): Json<MusicGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_music_task(payload)?,
    ))
}

pub async fn create_music_similar_task(
    State(state): State<AppState>,
    Json(payload): Json<MusicSimilarRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state
            .generation_service
            .create_music_similar_task(payload)?,
    ))
}

pub async fn create_music_remix_task(
    State(state): State<AppState>,
    Json(payload): Json<MusicRemixRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_music_remix_task(payload)?,
    ))
}

pub async fn create_music_extend_task(
    State(state): State<AppState>,
    Json(payload): Json<MusicExtendRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_music_extend_task(payload)?,
    ))
}

pub async fn read_music_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.read_music_task(&task_id)?))
}

pub async fn create_sfx_task(
    State(state): State<AppState>,
    Json(payload): Json<SfxGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.create_sfx_task(payload)?))
}

pub async fn list_sfx_tasks(
    State(state): State<AppState>,
    Query(query): Query<GenerationTaskListQuery>,
) -> ServerResult<
    Json<crate::response::ApiList<crate::services::generation::GenerationTaskRecord>>,
> {
    let page = state.generation_service.list_sfx_tasks(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn list_sfx_categories(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiList<SfxCategoryRecord>>> {
    Ok(list(state.generation_service.list_sfx_categories()?))
}

pub async fn read_sfx_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.read_sfx_task(&task_id)?))
}

pub async fn cancel_sfx_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(state.generation_service.cancel_sfx_task(&task_id)?))
}

pub async fn create_character_task(
    State(state): State<AppState>,
    Json(payload): Json<CharacterGenerationRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.create_character_task(payload)?,
    ))
}

pub async fn list_character_tasks(
    State(state): State<AppState>,
    Query(query): Query<GenerationTaskListQuery>,
) -> ServerResult<
    Json<crate::response::ApiList<crate::services::generation::GenerationTaskRecord>>,
> {
    let page = state.generation_service.list_character_tasks(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_character_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.read_character_task(&task_id)?,
    ))
}

pub async fn cancel_character_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::GenerationTaskRecord>>,
> {
    Ok(success(
        state.generation_service.cancel_character_task(&task_id)?,
    ))
}

pub async fn optimize_prompt(
    State(state): State<AppState>,
    Json(payload): Json<PromptOptimizeRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::generation::PromptOptimizeResultRecord>>,
> {
    Ok(success(state.generation_service.optimize_prompt(payload)?))
}

fn with_default_scene(
    mut payload: GenerationPromptEnhanceRequest,
    default_scene: &str,
) -> GenerationPromptEnhanceRequest {
    if payload
        .scene
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .is_none()
    {
        payload.scene = Some(default_scene.to_string());
    }
    payload
}
