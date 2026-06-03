use axum::Router;

use super::support::*;

async fn submit_job(app: Router, body: &str) -> axum::response::Response {
    call(
        app,
        json_request("POST", route_path("coreJobsSubmit"), body),
    )
    .await
}

async fn submit_job_and_read_id(app: Router) -> String {
    let response = submit_job(
        app,
        r#"{"kind":"toolkit","operation":{"kind":"zipAssets","sourcePaths":["/tmp/demo.txt"]}}"#,
    )
    .await;
    assert_eq!(response.status().as_u16(), 200);
    let payload = response_json(response).await;
    payload["data"]["id"]
        .as_str()
        .expect("job id from submit response")
        .to_string()
}

#[tokio::test]
async fn submit_job_route_is_served() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"zipAssets","sourcePaths":["/tmp/demo.txt"]}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}

#[tokio::test]
async fn submit_job_route_accepts_typed_video_transcode_operation() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"videoTranscode","inputPath":"/tmp/input.mp4","outputPath":"/tmp/output.mp4","videoCodec":"libx264","audioCodec":"aac","overwrite":true}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}

#[tokio::test]
async fn submit_job_route_accepts_typed_video_concat_operation() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"videoConcat","inputPaths":["/tmp/input-a.mp4","/tmp/input-b.mp4"],"outputPath":"/tmp/output.mp4","overwrite":true}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}

#[tokio::test]
async fn submit_job_route_accepts_typed_image_resize_operation() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"imageResize","inputPath":"/tmp/input.png","outputPath":"/tmp/output.png","width":512,"height":512,"overwrite":true}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}

#[tokio::test]
async fn submit_job_route_accepts_typed_media_probe_operation() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"mediaProbe","input":"/tmp/input.mp4"}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}

#[tokio::test]
async fn submit_job_route_rejects_legacy_media_job_variants() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"transcodeVideoH264","input":"/tmp/input.mp4","output":"/tmp/output.mp4"}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 422);
}

#[tokio::test]
async fn submit_job_route_rejects_legacy_probe_media_operation() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"probeMedia","input":"/tmp/input.mp4"}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 422);
}

#[tokio::test]
async fn submit_job_route_rejects_legacy_resize_image_operation() {
    let response = submit_job(
        server_app(),
        r#"{"kind":"toolkit","operation":{"kind":"resizeImage","input":"/tmp/input.png","output":"/tmp/output.png","width":512,"height":512}}"#,
    )
    .await;

    assert_eq!(response.status().as_u16(), 422);
}

#[tokio::test]
async fn list_jobs_route_is_served() {
    let app = server_app();
    let job_id = submit_job_and_read_id(app.clone()).await;

    let response = call(app, empty_request(route_path("coreJobsList"))).await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert!(payload["items"]
        .as_array()
        .expect("job list items")
        .iter()
        .any(|item| item["id"] == job_id));
}

#[tokio::test]
async fn get_job_route_is_served() {
    let app = server_app();
    let job_id = submit_job_and_read_id(app.clone()).await;

    let response = call(
        app,
        empty_request(route_path_with_params(
            "coreJobsRead",
            &[("jobId", &job_id)],
        )),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}

#[tokio::test]
async fn cancel_job_route_is_served() {
    let app = server_app();
    let job_id = submit_job_and_read_id(app.clone()).await;

    let response = call(
        app,
        json_request(
            "POST",
            route_path_with_params("coreJobsCancel", &[("jobId", &job_id)]),
            "",
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);
}
