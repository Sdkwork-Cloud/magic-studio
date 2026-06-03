use super::support::*;

#[tokio::test]
async fn media_probe_route_is_wired() {
    let response = call(
        server_app(),
        json_request("POST", route_path("coreMediaProbe"), r#"{"input":""}"#),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn retired_media_probe_legacy_route_is_not_publicly_served() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            "/api/core/v1/media/ffprobe",
            r#"{"input":"/tmp/input.mp4"}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 404);
}

#[tokio::test]
async fn media_image_resize_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaImageResize"),
            r#"{"inputPath":"","outputPath":"/tmp/output.png","width":512,"height":512,"overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn retired_media_command_execute_legacy_route_is_not_publicly_served() {
    let response = call(
        server_app(),
        json_request("POST", "/api/core/v1/media/ffmpeg/exec", r#"{"args":[]}"#),
    )
    .await;

    assert_eq!(response.status().as_u16(), 404);
}

#[tokio::test]
async fn media_video_concat_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaVideoConcat"),
            r#"{"inputPaths":[],"outputPath":"/tmp/output.mp4","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn retired_media_video_concat_legacy_route_is_not_publicly_served() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            "/api/core/v1/media/ffmpeg/concat",
            r#"{"inputPaths":[],"outputPath":"/tmp/output.mp4","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 404);
}

#[tokio::test]
async fn media_video_transcode_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaVideoTranscode"),
            r#"{"inputPath":"","outputPath":"/tmp/output.mp4","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn media_video_trim_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaVideoTrim"),
            r#"{"inputPath":"","outputPath":"/tmp/output.mp4","startSeconds":0,"overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn media_video_extract_audio_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaVideoExtractAudio"),
            r#"{"inputPath":"","outputPath":"/tmp/output.m4a","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn media_video_thumbnail_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaVideoThumbnail"),
            r#"{"inputPath":"","outputPath":"/tmp/output.jpg","timeSeconds":0}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn media_audio_convert_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaAudioConvert"),
            r#"{"inputPath":"","outputPath":"/tmp/output.mp3","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn media_audio_normalize_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaAudioNormalize"),
            r#"{"inputPath":"","outputPath":"/tmp/output.wav","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn media_audio_mix_route_is_wired() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMediaAudioMix"),
            r#"{"inputs":[],"outputPath":"/tmp/output.wav","overwrite":true}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}
