use axum::extract::State;
use axum::Json;
use serde::Deserialize;
use serde_json::Value;

use crate::response::{success, ServerResult};
use crate::services::media::{
    AudioConvertRequest, AudioMixRequest, AudioNormalizeRequest, ImageResizeRequest,
    MediaCommandResult, MediaVideoConcatRequest, VideoExtractAudioRequest, VideoThumbnailRequest,
    VideoTranscodeRequest, VideoTrimRequest,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaProbeRequest {
    pub input: String,
}

pub async fn media_probe(
    State(state): State<AppState>,
    Json(payload): Json<MediaProbeRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<Value>>> {
    Ok(success(state.media_service.media_probe(payload.input)?))
}

pub async fn media_image_resize(
    State(state): State<AppState>,
    Json(payload): Json<ImageResizeRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.image_resize(payload)?))
}

pub async fn media_video_concat(
    State(state): State<AppState>,
    Json(payload): Json<MediaVideoConcatRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.video_concat(payload)?))
}

pub async fn media_video_transcode(
    State(state): State<AppState>,
    Json(payload): Json<VideoTranscodeRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.video_transcode(payload)?))
}

pub async fn media_video_trim(
    State(state): State<AppState>,
    Json(payload): Json<VideoTrimRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.video_trim(payload)?))
}

pub async fn media_video_extract_audio(
    State(state): State<AppState>,
    Json(payload): Json<VideoExtractAudioRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.video_extract_audio(payload)?))
}

pub async fn media_video_thumbnail(
    State(state): State<AppState>,
    Json(payload): Json<VideoThumbnailRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.video_thumbnail(payload)?))
}

pub async fn media_audio_convert(
    State(state): State<AppState>,
    Json(payload): Json<AudioConvertRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.audio_convert(payload)?))
}

pub async fn media_audio_normalize(
    State(state): State<AppState>,
    Json(payload): Json<AudioNormalizeRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.audio_normalize(payload)?))
}

pub async fn media_audio_mix(
    State(state): State<AppState>,
    Json(payload): Json<AudioMixRequest>,
) -> ServerResult<Json<crate::response::ApiSuccess<MediaCommandResult>>> {
    Ok(success(state.media_service.audio_mix(payload)?))
}
