use std::fs;

use super::support::*;

#[tokio::test]
async fn compression_zip_route_rejects_empty_sources() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreCompressionZip"),
            r#"{"sourcePaths":[]}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn compression_routes_round_trip_zip_and_unzip() {
    let app = server_app();
    let temp_root = unique_temp_path("magic-studio-server-compression");
    let source_file = temp_root.join("hello.txt");
    let zip_file = temp_root.join("hello.zip");
    let target_dir = temp_root.join("unzipped");

    fs::create_dir_all(&temp_root).expect("create compression temp root");
    fs::write(&source_file, "hello world").expect("write compression source file");

    let zip_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreCompressionZip"),
            format!(r#"{{"sourcePaths":[{}]}}"#, json_string(&source_file)),
        ),
    )
    .await;

    assert_eq!(zip_response.status().as_u16(), 200);

    let zip_payload = response_json(zip_response).await;
    let zip_bytes = zip_payload["data"]["bytes"]
        .as_array()
        .expect("compression zip bytes")
        .iter()
        .map(|value| {
            let value = value.as_u64().expect("zip byte value");
            u8::try_from(value).expect("zip byte within u8 range")
        })
        .collect::<Vec<_>>();
    fs::write(&zip_file, zip_bytes).expect("write compression zip file");

    let unzip_response = call(
        app,
        json_request(
            "POST",
            route_path("coreCompressionUnzip"),
            format!(
                r#"{{"zipPath":{},"targetDir":{}}}"#,
                json_string(&zip_file),
                json_string(&target_dir)
            ),
        ),
    )
    .await;

    assert_eq!(unzip_response.status().as_u16(), 200);

    let unzip_payload = response_json(unzip_response).await;
    assert_eq!(unzip_payload["data"]["ok"], true);
    assert_eq!(
        fs::read_to_string(target_dir.join("hello.txt")).expect("read extracted file"),
        "hello world"
    );

    let _ = fs::remove_dir_all(&temp_root);
}
