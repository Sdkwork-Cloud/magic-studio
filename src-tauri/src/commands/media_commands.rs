use serde_json::Value;
use tauri::{command, State};

use crate::framework::services::MediaCommandResult;
use crate::framework::{run_blocking, AppContext};

#[command]
pub async fn media_ffmpeg_available(context: State<'_, AppContext>) -> Result<bool, String> {
    let media_service = context.media();
    run_blocking("media_ffmpeg_available", move || {
        media_service.ffmpeg_available()
    })
    .await
    .map_err(|error| error.to_string())
}

#[command]
pub async fn media_ffmpeg_exec(
    context: State<'_, AppContext>,
    args: Vec<String>,
) -> Result<MediaCommandResult, String> {
    let media_service = context.media();
    run_blocking("media_ffmpeg_exec", move || media_service.ffmpeg_exec(args))
        .await
        .map_err(|error| error.to_string())
}

#[command]
pub async fn media_ffprobe_json(
    context: State<'_, AppContext>,
    input: String,
) -> Result<Value, String> {
    let media_service = context.media();
    run_blocking("media_ffprobe_json", move || {
        media_service.ffprobe_json(input)
    })
    .await
    .map_err(|error| error.to_string())
}
