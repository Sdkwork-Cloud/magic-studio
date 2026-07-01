use std::fs;

use super::support::*;

#[tokio::test]
async fn policy_snapshot_route_is_served_and_exposes_preferred_roots() {
    let response = call(
        server_app(),
        empty_request(route_path("corePolicySnapshotRead")),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert!(payload["data"]["allowDangerousCommands"].is_boolean());
    assert!(payload["data"]["allowSystemPaths"].is_boolean());
    assert!(payload["data"]["blockedCommands"].is_array());
    assert!(payload["data"]["blockedPathPrefixes"].is_array());
    assert!(
        payload["data"]["preferredWorkRoots"]
            .as_array()
            .expect("preferred work roots")
            .len()
            > 0
    );
}

#[tokio::test]
async fn validate_policy_path_route_allows_temp_directory() {
    let allowed_path = unique_temp_path("magic-studio-server-policy-path");
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("corePolicyValidatePath"),
            format!(
                r#"{{"path":{},"access":"read"}}"#,
                json_string(&allowed_path)
            ),
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["allowed"], true);
}

#[tokio::test]
async fn validate_policy_path_route_rejects_empty_path() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("corePolicyValidatePath"),
            r#"{"path":"","access":"read"}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["allowed"], false);
    assert_eq!(payload["data"]["code"], "POLICY_PATH_EMPTY");
}

#[tokio::test]
async fn validate_policy_command_route_rejects_empty_name() {
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("corePolicyValidateCommand"),
            r#"{"name":""}"#,
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["allowed"], false);
    assert_eq!(payload["data"]["code"], "POLICY_COMMAND_EMPTY");
}

#[tokio::test]
async fn migration_status_route_is_served_for_uninitialized_database() {
    let db_path = unique_temp_path("magic-studio-server-migration-status").with_extension("db");
    let response = call(
        server_app(),
        json_request(
            "POST",
            route_path("coreMigrationsStatusRead"),
            format!(r#"{{"dbPath":{}}}"#, json_string(&db_path)),
        ),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["currentVersion"], 0);
    assert_eq!(
        payload["data"]["migrations"]
            .as_array()
            .expect("migration status items")
            .len(),
        0
    );
}

#[tokio::test]
async fn migration_apply_route_executes_and_persists_version() {
    let app = server_app();
    let temp_root = unique_temp_path("magic-studio-server-migration-apply");
    let db_path = temp_root.join("demo.db");
    let db_path_json = json_string(&db_path);

    let apply_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreMigrationsApply"),
            format!(
                r#"{{"dbPath":{db_path_json},"plan":{{"dryRun":false,"scripts":[{{"version":1,"name":"init_demo","sql":"CREATE TABLE demo (id INTEGER PRIMARY KEY, value TEXT);"}}]}}}}"#
            ),
        ),
    )
    .await;

    assert_eq!(apply_response.status().as_u16(), 200);

    let apply_payload = response_json(apply_response).await;
    assert_eq!(apply_payload["data"]["fromVersion"], 0);
    assert_eq!(apply_payload["data"]["toVersion"], 1);
    assert_eq!(apply_payload["data"]["dryRun"], false);
    assert_eq!(apply_payload["data"]["appliedVersions"][0], 1);

    let status_response = call(
        app,
        json_request(
            "POST",
            route_path("coreMigrationsStatusRead"),
            format!(r#"{{"dbPath":{db_path_json}}}"#),
        ),
    )
    .await;

    assert_eq!(status_response.status().as_u16(), 200);

    let status_payload = response_json(status_response).await;
    assert_eq!(status_payload["data"]["currentVersion"], 1);
    assert_eq!(
        status_payload["data"]["migrations"]
            .as_array()
            .expect("applied migration items")
            .len(),
        1
    );

    let _ = fs::remove_dir_all(&temp_root);
}
