use std::fs;

use super::support::*;

#[tokio::test]
async fn filesystem_routes_use_canonical_http_contract_round_trip() {
    let app = server_app();
    let temp_root = unique_temp_path("magic-studio-server-fs");
    let workspace_dir = temp_root.join("workspace");
    let text_file = workspace_dir.join("hello.txt");
    let binary_file = workspace_dir.join("hello.bin");
    let copied_file = workspace_dir.join("hello-copy.txt");
    let renamed_file = workspace_dir.join("hello-moved.txt");

    let workspace_dir_json = json_string(&workspace_dir);
    let text_file_json = json_string(&text_file);
    let binary_file_json = json_string(&binary_file);
    let copied_file_json = json_string(&copied_file);
    let renamed_file_json = json_string(&renamed_file);

    let ensure_dir_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemEnsureDir"),
            format!(r#"{{"path":{workspace_dir_json}}}"#),
        ),
    )
    .await;
    assert_eq!(ensure_dir_response.status().as_u16(), 200);

    let write_text_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemWriteText"),
            format!(r#"{{"path":{text_file_json},"text":"hello world"}}"#),
        ),
    )
    .await;
    assert_eq!(write_text_response.status().as_u16(), 200);

    let write_bytes_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemWriteBytes"),
            format!(r#"{{"path":{binary_file_json},"bytesBase64":"AQIDBA=="}}"#),
        ),
    )
    .await;
    assert_eq!(write_bytes_response.status().as_u16(), 200);

    let read_dir_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemReadDir"),
            format!(r#"{{"path":{workspace_dir_json}}}"#),
        ),
    )
    .await;
    assert_eq!(read_dir_response.status().as_u16(), 200);
    let read_dir_payload = response_json(read_dir_response).await;
    let items = read_dir_payload["items"]
        .as_array()
        .expect("filesystem read dir items");
    assert!(items.iter().any(|item| item["name"] == "hello.txt"));
    assert!(items.iter().any(|item| item["name"] == "hello.bin"));

    let read_text_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemReadText"),
            format!(r#"{{"path":{text_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(read_text_response.status().as_u16(), 200);
    let read_text_payload = response_json(read_text_response).await;
    assert_eq!(read_text_payload["data"]["text"], "hello world");

    let read_bytes_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemReadBytes"),
            format!(r#"{{"path":{binary_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(read_bytes_response.status().as_u16(), 200);
    let read_bytes_payload = response_json(read_bytes_response).await;
    assert_eq!(read_bytes_payload["data"]["bytesBase64"], "AQIDBA==");

    let exists_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemExists"),
            format!(r#"{{"path":{text_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(exists_response.status().as_u16(), 200);
    let exists_payload = response_json(exists_response).await;
    assert_eq!(exists_payload["data"]["exists"], true);

    let stat_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemStat"),
            format!(r#"{{"path":{text_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(stat_response.status().as_u16(), 200);
    let stat_payload = response_json(stat_response).await;
    assert_eq!(stat_payload["data"]["kind"], "file");

    let copy_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemCopyFile"),
            format!(r#"{{"sourcePath":{text_file_json},"destinationPath":{copied_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(copy_response.status().as_u16(), 200);

    let rename_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreFileSystemRename"),
            format!(r#"{{"oldPath":{copied_file_json},"newPath":{renamed_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(rename_response.status().as_u16(), 200);

    let remove_response = call(
        app,
        json_request(
            "POST",
            route_path("coreFileSystemRemove"),
            format!(r#"{{"path":{renamed_file_json}}}"#),
        ),
    )
    .await;
    assert_eq!(remove_response.status().as_u16(), 200);

    let _ = fs::remove_dir_all(&temp_root);
}

#[tokio::test]
async fn filesystem_stat_missing_path_uses_not_found_contract() {
    let missing_path = unique_temp_path("magic-studio-server-missing").with_extension("txt");
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreFileSystemStat"),
            format!(r#"{{"path":{}}}"#, json_string(&missing_path)),
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 404);
}
