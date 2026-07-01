use super::support::*;

fn assert_response_schema_ref(
    payload: &serde_json::Value,
    route_id: &str,
    method: &str,
    status: &str,
    schema_ref: &str,
) {
    let path = openapi_path(route_id);
    assert_eq!(
        payload["paths"][path.as_str()][method]["responses"][status]["content"]["application/json"]
            ["schema"]["$ref"],
        schema_ref
    );
}

fn assert_request_schema_ref(
    payload: &serde_json::Value,
    route_id: &str,
    method: &str,
    schema_ref: &str,
) {
    let path = openapi_path(route_id);
    assert_eq!(
        payload["paths"][path.as_str()][method]["requestBody"]["content"]["application/json"]
            ["schema"]["$ref"],
        schema_ref
    );
}

#[tokio::test]
async fn healthz_route_exposes_typed_server_status_contract() {
    let response = call(
        server_app(),
        empty_request(route_path("coreHealthStatusRead")),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["service"], "magic-studio-server");
    assert_eq!(payload["data"]["status"], "ok");
    assert_eq!(payload["meta"]["version"], "v1");
}

#[tokio::test]
async fn route_catalog_uses_list_envelope_and_includes_core_surface() {
    let response = call(server_app(), empty_request(route_path("coreRoutesList"))).await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["meta"]["page"], 1);
    assert!(payload["items"].is_array());
    assert_eq!(
        payload["meta"]["total"].as_u64(),
        Some(
            payload["items"]
                .as_array()
                .expect("route catalog items")
                .len() as u64
        )
    );
    assert!(payload["items"]
        .as_array()
        .expect("route catalog items")
        .iter()
        .any(|item| item["surface"] == "core"));
}

#[tokio::test]
async fn runtime_summary_route_exposes_contract_and_discovery_metadata() {
    let route_contract = contract();
    let response = call(
        server_app(),
        empty_request(route_contract.runtime_summary_path()),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["mode"], "server");
    assert_eq!(payload["data"]["apiVersion"], route_contract.api_version);
    assert!(payload["data"]["runtimeOs"].is_string());
    assert!(payload["data"]["runtimeArch"].is_string());
    assert_eq!(payload["data"]["docsPath"], route_contract.meta.docs_path);
    assert_eq!(
        payload["data"]["openApiPath"],
        route_contract.meta.live_open_api_path
    );
    assert_eq!(
        payload["data"]["routeCatalogPath"],
        route_contract.route_catalog_path()
    );
    assert!(payload["data"]["systemPaths"]["home"].is_string());
    assert!(payload["data"]["systemPaths"]["appData"].is_string());
    assert!(payload["data"]["systemPaths"]["downloads"].is_string());
    assert!(payload["data"]["systemPaths"]["temp"].is_string());
}

#[tokio::test]
async fn runtime_summary_route_reports_desktop_mode_for_desktop_state() {
    let route_contract = contract();
    let response = call(
        desktop_app(),
        empty_request(route_contract.runtime_summary_path()),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["data"]["mode"], "desktop");
}

#[tokio::test]
async fn toolkit_capabilities_route_uses_neutral_public_fields() {
    let response = call(
        server_app(),
        empty_request(route_path("coreToolkitCapabilitiesRead")),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let text = response_text(response).await;
    assert!(text.contains("\"mediaProbeAvailable\""));
    assert!(!text.contains("\"ffmpegAvailable\""));
    assert!(!text.contains("\"ffprobeAvailable\""));
}

#[tokio::test]
async fn live_openapi_route_returns_openapi_document() {
    let route_contract = contract();
    let response = call(
        server_app(),
        empty_request(route_contract.meta.live_open_api_path.clone()),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["openapi"], "3.1.0");

    assert_response_schema_ref(
        &payload,
        "coreHealthStatusRead",
        "get",
        "200",
        "#/components/schemas/MagicStudioServerHealthStatusEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreRoutesList",
        "get",
        "200",
        "#/components/schemas/MagicStudioApiRouteCatalogEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreRuntimeSummaryRead",
        "get",
        "200",
        "#/components/schemas/MagicStudioRuntimeSummaryEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreToolkitCapabilitiesRead",
        "get",
        "200",
        "#/components/schemas/MagicStudioToolkitCapabilityMatrixEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "coreFileSystemReadDir",
        "post",
        "#/components/schemas/MagicStudioFileSystemPathRequest",
    );
    assert_response_schema_ref(
        &payload,
        "coreFileSystemReadDir",
        "post",
        "200",
        "#/components/schemas/MagicStudioFileSystemEntryListEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "coreFileSystemWriteBytes",
        "post",
        "#/components/schemas/MagicStudioFileSystemWriteBytesRequest",
    );
    assert_response_schema_ref(
        &payload,
        "coreFileSystemReadBytes",
        "post",
        "200",
        "#/components/schemas/MagicStudioFileSystemBytesPayloadEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreFileSystemStat",
        "post",
        "200",
        "#/components/schemas/MagicStudioFileSystemStatEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "corePolicySnapshotRead",
        "get",
        "200",
        "#/components/schemas/MagicStudioPolicySnapshotEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "corePolicyValidatePath",
        "post",
        "#/components/schemas/MagicStudioPolicyPathValidationRequest",
    );
    assert_request_schema_ref(
        &payload,
        "corePolicyValidateCommand",
        "post",
        "#/components/schemas/MagicStudioPolicyCommandValidationRequest",
    );
    assert_request_schema_ref(
        &payload,
        "coreMigrationsStatusRead",
        "post",
        "#/components/schemas/MagicStudioMigrationStatusRequest",
    );
    assert_request_schema_ref(
        &payload,
        "coreMigrationsApply",
        "post",
        "#/components/schemas/MagicStudioMigrationApplyRequest",
    );
    assert_response_schema_ref(
        &payload,
        "coreMigrationsStatusRead",
        "post",
        "200",
        "#/components/schemas/MagicStudioMigrationStatusEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreMigrationsApply",
        "post",
        "200",
        "#/components/schemas/MagicStudioMigrationApplyResultEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "coreMediaProbe",
        "post",
        "#/components/schemas/MagicStudioMediaProbeRequest",
    );
    assert_response_schema_ref(
        &payload,
        "coreMediaProbe",
        "post",
        "200",
        "#/components/schemas/MagicStudioMediaProbeResultEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "coreCompressionZip",
        "post",
        "#/components/schemas/MagicStudioCompressionZipRequest",
    );
    assert_request_schema_ref(
        &payload,
        "coreCompressionUnzip",
        "post",
        "#/components/schemas/MagicStudioCompressionUnzipRequest",
    );
    assert_response_schema_ref(
        &payload,
        "coreCompressionZip",
        "post",
        "200",
        "#/components/schemas/MagicStudioCompressionZipResultEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreCompressionUnzip",
        "post",
        "200",
        "#/components/schemas/MagicStudioOperationOkResultEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "coreDatabaseSqliteQuery",
        "post",
        "#/components/schemas/MagicStudioSqlExecuteRequest",
    );
    assert_response_schema_ref(
        &payload,
        "coreDatabaseSqliteQuery",
        "post",
        "200",
        "#/components/schemas/MagicStudioSqlRowListEnvelope",
    );
    assert_request_schema_ref(
        &payload,
        "coreJobsSubmit",
        "post",
        "#/components/schemas/MagicStudioToolkitJobSubmission",
    );
    assert_response_schema_ref(
        &payload,
        "coreJobsSubmit",
        "post",
        "200",
        "#/components/schemas/MagicStudioToolkitJobSnapshotEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreJobsList",
        "get",
        "200",
        "#/components/schemas/MagicStudioToolkitJobSnapshotListEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreJobsRead",
        "get",
        "200",
        "#/components/schemas/MagicStudioToolkitJobSnapshotEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "coreJobsCancel",
        "post",
        "200",
        "#/components/schemas/MagicStudioToolkitJobSnapshotEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "appPluginsList",
        "get",
        "200",
        "#/components/schemas/MagicStudioPluginManifestListEnvelope",
    );
    assert_response_schema_ref(
        &payload,
        "adminDeploymentsList",
        "get",
        "200",
        "#/components/schemas/MagicStudioServerDeploymentRecordListEnvelope",
    );
    assert!(payload["components"]["schemas"]["SdkWorkProblemDetail"].is_object());
}
