use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list_with_meta, success, ServerResult};
use crate::services::generation::GenerationTaskRecord;
use crate::services::voices::{
    CustomVoiceCreateRequest, CustomVoiceUpdateRequest, VoiceCloneTaskCreateRequest,
    VoiceCloneTaskListQuery, VoiceCloneTaskRecord, VoiceListQuery, VoicePreviewUpdateRequest,
    VoiceSpeakerRecord, VoiceSpeechTaskCreateRequest, VoiceSpeechTaskListQuery,
    VoiceSpeechTaskUpdateRequest, VoiceSpeechTaskUpsertRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerIdPath {
    pub speaker_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskIdPath {
    pub task_id: String,
}

pub async fn list_market_voices(
    State(state): State<AppState>,
    Query(query): Query<VoiceListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<VoiceSpeakerRecord>>> {
    let page = state.voice_service.list_market_voices(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn list_workspace_voices(
    State(state): State<AppState>,
    Query(query): Query<VoiceListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<VoiceSpeakerRecord>>> {
    let page = state.voice_service.list_workspace_voices(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn list_custom_voices(
    State(state): State<AppState>,
    Query(query): Query<VoiceListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<VoiceSpeakerRecord>>> {
    let page = state.voice_service.list_custom_voices(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn create_custom_voice(
    State(state): State<AppState>,
    Json(payload): Json<CustomVoiceCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceSpeakerRecord>>> {
    Ok(success(state.voice_service.create_custom_voice(payload)?))
}

pub async fn update_custom_voice(
    State(state): State<AppState>,
    Path(path): Path<SpeakerIdPath>,
    Json(payload): Json<CustomVoiceUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceSpeakerRecord>>> {
    Ok(success(
        state
            .voice_service
            .update_custom_voice(&path.speaker_id, payload)?,
    ))
}

pub async fn delete_custom_voice(
    State(state): State<AppState>,
    Path(path): Path<SpeakerIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.voice_service.delete_custom_voice(&path.speaker_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn read_voice_speaker(
    State(state): State<AppState>,
    Path(path): Path<SpeakerIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceSpeakerRecord>>> {
    Ok(success(
        state.voice_service.read_voice_speaker(&path.speaker_id)?,
    ))
}

pub async fn create_clone_task(
    State(state): State<AppState>,
    Json(payload): Json<VoiceCloneTaskCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceCloneTaskRecord>>> {
    Ok(success(state.voice_service.create_clone_task(payload)?))
}

pub async fn list_clone_tasks(
    State(state): State<AppState>,
    Query(query): Query<VoiceCloneTaskListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<VoiceCloneTaskRecord>>> {
    let page = state.voice_service.list_clone_tasks(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn read_clone_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceCloneTaskRecord>>> {
    Ok(success(state.voice_service.read_clone_task(&path.task_id)?))
}

pub async fn delete_clone_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.voice_service.delete_clone_task(&path.task_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn cancel_clone_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceCloneTaskRecord>>> {
    Ok(success(
        state.voice_service.cancel_clone_task(&path.task_id)?,
    ))
}

pub async fn update_voice_preview(
    State(state): State<AppState>,
    Path(path): Path<SpeakerIdPath>,
    Json(payload): Json<VoicePreviewUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<VoiceSpeakerRecord>>> {
    Ok(success(
        state
            .voice_service
            .update_voice_preview(&path.speaker_id, payload)?,
    ))
}

pub async fn list_speech_tasks(
    State(state): State<AppState>,
    Query(query): Query<VoiceSpeechTaskListQuery>,
) -> ServerResult<Json<crate::response::ApiListEnvelope<GenerationTaskRecord>>> {
    let page = state.voice_service.list_speech_tasks(query)?;
    Ok(list_with_meta(
        page.items,
        page.page,
        page.page_size,
        page.total,
    ))
}

pub async fn create_speech_task(
    State(state): State<AppState>,
    Json(payload): Json<VoiceSpeechTaskCreateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<GenerationTaskRecord>>> {
    Ok(success(state.voice_service.create_speech_task(payload)?))
}

pub async fn read_speech_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<GenerationTaskRecord>>> {
    Ok(success(
        state.voice_service.read_speech_task(&path.task_id)?,
    ))
}

pub async fn update_speech_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
    Json(payload): Json<VoiceSpeechTaskUpdateRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<GenerationTaskRecord>>> {
    Ok(success(
        state
            .voice_service
            .update_speech_task(&path.task_id, payload)?,
    ))
}

pub async fn upsert_speech_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
    Json(payload): Json<VoiceSpeechTaskUpsertRequest>,
) -> ServerResult<Json<crate::response::ApiEnvelope<GenerationTaskRecord>>> {
    Ok(success(
        state
            .voice_service
            .upsert_speech_task(&path.task_id, payload)?,
    ))
}

pub async fn delete_speech_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<serde_json::Value>>> {
    state.voice_service.delete_speech_task(&path.task_id)?;
    Ok(success(json!({ "ok": true })))
}

pub async fn cancel_speech_task(
    State(state): State<AppState>,
    Path(path): Path<TaskIdPath>,
) -> ServerResult<Json<crate::response::ApiEnvelope<GenerationTaskRecord>>> {
    Ok(success(
        state.voice_service.cancel_speech_task(&path.task_id)?,
    ))
}
