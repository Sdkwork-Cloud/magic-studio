use super::support::*;
use http_body_util::BodyExt;

#[test]
fn app_trade_contract_does_not_expose_payment_callback_simulation() {
    let contract = contract();
    for route in &contract.routes {
        assert_ne!(route.id, "appTradePaymentsSimulateCallback");
        assert!(!route.path.contains("simulate-callback"));
        assert_ne!(
            route.request_body_schema.as_deref(),
            Some("MagicStudioTradePaymentCallbackSimulationRequest")
        );
    }
}

#[tokio::test]
async fn app_plugins_route_is_served() {
    let response = call(server_app(), empty_request(route_path("appPluginsList"))).await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert!(payload["items"].is_array());
}

#[tokio::test]
async fn app_execution_capabilities_do_not_advertise_fake_success_paths() {
    let response = call(
        server_app(),
        empty_request(route_path("appCapabilitiesListExecution")),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let body = response_text(response).await;
    assert!(!body.to_lowercase().contains("fake"));
    assert!(body.contains("non-executed failed task record"));
}

#[tokio::test]
async fn app_vip_purchase_uses_real_balance_payment_settlement() {
    let data_root = unique_temp_path("magic-studio-server-vip-real-settlement");
    let app = server_app_with_data_root(&data_root);
    establish_authenticated_session(app.clone(), "vip-real-settlement").await;

    let wallet_before_response =
        call(app.clone(), empty_request(route_path("appTradeWalletRead"))).await;
    assert_eq!(wallet_before_response.status().as_u16(), 200);
    let wallet_before_payload = response_json(wallet_before_response).await;
    let balance_before = wallet_before_payload["data"]["balance"]
        .as_i64()
        .expect("wallet balance before purchase");
    let total_spent_before = wallet_before_payload["data"]["totalSpent"]
        .as_i64()
        .expect("wallet total spent before purchase");

    let purchase_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appVipPurchase"),
            r#"{"planId":"basic","billingCycle":"month","paymentMethod":"BALANCE"}"#,
        ),
    )
    .await;
    let purchase_status = purchase_response.status().as_u16();
    let purchase_body = response_text(purchase_response).await;
    assert_eq!(purchase_status, 200, "purchase response: {purchase_body}");
    let purchase_payload: serde_json::Value =
        serde_json::from_str(&purchase_body).expect("parse purchase response json");

    assert_eq!(purchase_payload["data"]["subscription"]["status"], "ACTIVE");
    assert_eq!(purchase_payload["data"]["status"]["active"], true);
    assert_eq!(purchase_payload["data"]["payment"]["status"], "SUCCESS");
    assert_eq!(purchase_payload["data"]["order"]["status"], "PAID");
    assert_eq!(
        purchase_payload["data"]["order"]["paymentStatus"],
        "SUCCESS"
    );
    let purchase_amount = purchase_payload["data"]["subscription"]["amount"]
        .as_i64()
        .expect("vip subscription amount");
    assert_eq!(purchase_amount, 3_900);
    assert_eq!(
        purchase_payload["data"]["order"]["usedBalance"],
        purchase_amount
    );
    assert_eq!(
        purchase_payload["data"]["payment"]["metadata"]["useBalance"],
        purchase_amount
    );

    let payment_id = purchase_payload["data"]["payment"]["uuid"]
        .as_str()
        .expect("payment uuid")
        .to_string();
    let payment_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appTradePaymentsRead",
            &[("paymentId", payment_id.as_str())],
        )),
    )
    .await;
    assert_eq!(payment_response.status().as_u16(), 200);
    let payment_payload = response_json(payment_response).await;
    assert_eq!(payment_payload["data"]["status"], "SUCCESS");
    assert_eq!(
        payment_payload["data"]["metadata"]["useBalance"],
        purchase_amount
    );

    let wallet_after_response = call(app, empty_request(route_path("appTradeWalletRead"))).await;
    assert_eq!(wallet_after_response.status().as_u16(), 200);
    let wallet_after_payload = response_json(wallet_after_response).await;
    assert_eq!(
        wallet_after_payload["data"]["balance"],
        balance_before - purchase_amount
    );
    assert_eq!(
        wallet_after_payload["data"]["totalSpent"],
        total_spent_before + purchase_amount
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_trade_balance_payment_defaults_to_full_order_settlement() {
    let data_root = unique_temp_path("magic-studio-server-trade-balance-default");
    let app = server_app_with_data_root(&data_root);
    establish_authenticated_session(app.clone(), "trade-balance-default").await;

    let wallet_before_response =
        call(app.clone(), empty_request(route_path("appTradeWalletRead"))).await;
    assert_eq!(wallet_before_response.status().as_u16(), 200);
    let wallet_before_payload = response_json(wallet_before_response).await;
    let balance_before = wallet_before_payload["data"]["balance"]
        .as_i64()
        .expect("wallet balance before payment");

    let create_order_body = serde_json::json!({
        "type": "SERVICE",
        "title": "Balance settlement contract test",
        "amount": 5_000,
    })
    .to_string();
    let create_order_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appTradeOrdersCreate"),
            create_order_body,
        ),
    )
    .await;
    assert_eq!(create_order_response.status().as_u16(), 200);
    let create_order_payload = response_json(create_order_response).await;
    let order_id = create_order_payload["data"]["uuid"]
        .as_str()
        .expect("order uuid");

    let create_payment_body = serde_json::json!({
        "orderUuid": order_id,
        "method": "BALANCE",
    })
    .to_string();
    let create_payment_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appTradePaymentsCreate"),
            create_payment_body,
        ),
    )
    .await;
    assert_eq!(create_payment_response.status().as_u16(), 200);
    let create_payment_payload = response_json(create_payment_response).await;
    assert_eq!(
        create_payment_payload["data"]["payment"]["status"],
        "SUCCESS"
    );
    assert_eq!(
        create_payment_payload["data"]["payment"]["metadata"]["useBalance"],
        5_000
    );

    let read_order_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appTradeOrdersRead",
            &[("orderId", order_id)],
        )),
    )
    .await;
    assert_eq!(read_order_response.status().as_u16(), 200);
    let read_order_payload = response_json(read_order_response).await;
    assert_eq!(read_order_payload["data"]["status"], "PAID");
    assert_eq!(read_order_payload["data"]["usedBalance"], 5_000);
    assert_eq!(read_order_payload["data"]["usedPoints"], 0);

    let wallet_after_response = call(app, empty_request(route_path("appTradeWalletRead"))).await;
    assert_eq!(wallet_after_response.status().as_u16(), 200);
    let wallet_after_payload = response_json(wallet_after_response).await;
    assert_eq!(
        wallet_after_payload["data"]["balance"],
        balance_before - 5_000
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_trade_balance_payment_rejects_partial_wallet_success() {
    let data_root = unique_temp_path("magic-studio-server-trade-balance-partial");
    let app = server_app_with_data_root(&data_root);
    establish_authenticated_session(app.clone(), "trade-balance-partial").await;

    let create_order_body = serde_json::json!({
        "type": "SERVICE",
        "title": "Partial balance should not settle",
        "amount": 5_000,
    })
    .to_string();
    let create_order_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appTradeOrdersCreate"),
            create_order_body,
        ),
    )
    .await;
    assert_eq!(create_order_response.status().as_u16(), 200);
    let create_order_payload = response_json(create_order_response).await;
    let order_id = create_order_payload["data"]["uuid"]
        .as_str()
        .expect("order uuid");

    let create_payment_body = serde_json::json!({
        "orderUuid": order_id,
        "method": "BALANCE",
        "useBalance": 1_000,
    })
    .to_string();
    let create_payment_response = call(
        app,
        json_request(
            "POST",
            route_path("appTradePaymentsCreate"),
            create_payment_body,
        ),
    )
    .await;
    let create_payment_status = create_payment_response.status().as_u16();
    let create_payment_text = response_text(create_payment_response).await;
    assert_eq!(
        create_payment_status, 400,
        "partial balance payment response: {create_payment_text}"
    );
    let create_payment_payload: serde_json::Value =
        serde_json::from_str(&create_payment_text).expect("parse payment response json");
    assert_eq!(
        create_payment_payload["error"]["code"],
        "APP_TRADE_PAYMENT_WALLET_AMOUNT_MISMATCH"
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_settings_routes_are_served_and_persist_documents() {
    let data_root = unique_temp_path("magic-studio-server-app-settings");
    let app = server_app_with_data_root(&data_root);

    let read_response = call(app.clone(), empty_request(route_path("appSettingsRead"))).await;
    assert_eq!(read_response.status().as_u16(), 200);
    let read_payload = response_json(read_response).await;
    assert_eq!(read_payload["data"]["scope"], "user");
    assert!(read_payload["data"]["settings"].is_object());

    let update_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path("appSettingsUpdate"),
            r#"{"settings":{"general":{"language":"zh-CN"},"appearance":{"theme":"dark"}}}"#,
        ),
    )
    .await;
    assert_eq!(update_response.status().as_u16(), 200);
    let update_payload = response_json(update_response).await;
    assert_eq!(
        update_payload["data"]["settings"]["general"]["language"],
        "zh-CN"
    );
    assert_eq!(
        update_payload["data"]["settings"]["appearance"]["theme"],
        "dark"
    );

    let persisted_response = call(app, empty_request(route_path("appSettingsRead"))).await;
    assert_eq!(persisted_response.status().as_u16(), 200);
    let persisted_payload = response_json(persisted_response).await;
    assert_eq!(
        persisted_payload["data"]["settings"]["general"]["language"],
        "zh-CN"
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_notification_routes_are_served_and_support_state_transitions() {
    let data_root = unique_temp_path("magic-studio-server-app-notifications");
    let app = server_app_with_data_root(&data_root);

    let create_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appNotificationsCreate"),
            r#"{"title":"Build Complete","message":"A render job finished.","type":"SUCCESS"}"#,
        ),
    )
    .await;
    assert_eq!(create_response.status().as_u16(), 200);
    let created_payload = response_json(create_response).await;
    let notification_id = created_payload["data"]["id"]
        .as_str()
        .expect("notification id");
    assert_eq!(created_payload["data"]["isRead"], false);

    let unread_count_response = call(
        app.clone(),
        empty_request(route_path("appNotificationsReadUnreadCount")),
    )
    .await;
    assert_eq!(unread_count_response.status().as_u16(), 200);
    let unread_count_payload = response_json(unread_count_response).await;
    assert_eq!(unread_count_payload["data"]["unreadCount"], 1);

    let mark_read_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appNotificationsMarkRead",
                &[("notificationId", notification_id)],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(mark_read_response.status().as_u16(), 200);

    let list_response = call(
        app.clone(),
        empty_request(route_path("appNotificationsList")),
    )
    .await;
    assert_eq!(list_response.status().as_u16(), 200);
    let list_payload = response_json(list_response).await;
    assert_eq!(list_payload["items"][0]["isRead"], true);

    let delete_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appNotificationsDeleteBatch"),
            &format!(r#"{{"notificationIds":["{notification_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(delete_response.status().as_u16(), 200);

    let empty_list_response = call(app, empty_request(route_path("appNotificationsList"))).await;
    assert_eq!(empty_list_response.status().as_u16(), 200);
    let empty_list_payload = response_json(empty_list_response).await;
    assert_eq!(
        empty_list_payload["items"]
            .as_array()
            .expect("notification list array")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_workspace_routes_are_served_and_support_topology_management() {
    let data_root = unique_temp_path("magic-studio-server-app-workspaces");
    let app = server_app_with_data_root(&data_root);

    let create_workspace_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appWorkspacesCreate"),
            r#"{"name":"Main Workspace","description":"Primary workspace","icon":"folder"}"#,
        ),
    )
    .await;
    assert_eq!(create_workspace_response.status().as_u16(), 200);
    let create_workspace_payload = response_json(create_workspace_response).await;
    let workspace_id = create_workspace_payload["data"]["id"]
        .as_str()
        .expect("workspace id")
        .to_string();
    let workspace_uuid = create_workspace_payload["data"]["uuid"]
        .as_str()
        .expect("workspace uuid")
        .to_string();
    assert_eq!(create_workspace_payload["data"]["name"], "Main Workspace");

    let create_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreate",
                &[("workspaceId", workspace_id.as_str())],
            ),
            r#"{"name":"Brand Video","type":"VIDEO","description":"Launch trailer"}"#,
        ),
    )
    .await;
    assert_eq!(create_project_response.status().as_u16(), 200);
    let create_project_payload = response_json(create_project_response).await;
    let project_id = create_project_payload["data"]["id"]
        .as_str()
        .expect("project id")
        .to_string();
    let project_path = create_project_payload["data"]["path"]
        .as_str()
        .expect("project path")
        .to_string();
    assert_eq!(
        create_project_payload["data"]["workspaceId"],
        workspace_uuid.as_str()
    );

    let update_project_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appWorkspaceProjectsUpdate",
                &[
                    ("workspaceId", workspace_uuid.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"name":"Brand Video Final","thumbnailUrl":"assets://project-covers/brand-video.png"}"#,
        ),
    )
    .await;
    assert_eq!(update_project_response.status().as_u16(), 200);
    let update_project_payload = response_json(update_project_response).await;
    assert_eq!(update_project_payload["data"]["name"], "Brand Video Final");
    assert_eq!(
        update_project_payload["data"]["thumbnailUrl"],
        "assets://project-covers/brand-video.png"
    );
    std::fs::write(
        std::path::Path::new(&project_path).join("project-manifest.json"),
        br#"{"version":1,"name":"Brand Video Final"}"#,
    )
    .expect("write source project manifest");

    let open_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsOpen",
                &[
                    ("workspaceId", workspace_uuid.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(open_project_response.status().as_u16(), 200);
    let open_project_payload = response_json(open_project_response).await;
    assert_eq!(open_project_payload["data"]["id"], project_id.as_str());
    assert!(open_project_payload["data"]["lastOpenedAt"].is_string());

    let recent_projects_response = call(
        app.clone(),
        empty_request(route_path("appWorkspaceProjectsListRecent")),
    )
    .await;
    assert_eq!(recent_projects_response.status().as_u16(), 200);
    let recent_projects_payload = response_json(recent_projects_response).await;
    let recent_projects = recent_projects_payload["items"]
        .as_array()
        .expect("recent projects array");
    assert_eq!(recent_projects.len(), 1);
    assert_eq!(recent_projects[0]["id"], project_id.as_str());

    let read_initial_session_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadSession",
            &[
                ("workspaceId", workspace_uuid.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_initial_session_response.status().as_u16(), 200);
    let read_initial_session_payload = response_json(read_initial_session_response).await;
    assert!(read_initial_session_payload["data"]["session"].is_null());

    let upsert_session_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params(
                "appWorkspaceProjectsUpsertSession",
                &[
                    ("workspaceId", workspace_uuid.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"openFiles":[{"path":"src/main.tsx"},{"path":"README.md","isPreview":true}],"activeFilePath":"src/main.tsx","selectedPath":"src","expandedPaths":["src","src/components"]}"#,
        ),
    )
    .await;
    assert_eq!(upsert_session_response.status().as_u16(), 200);
    let upsert_session_payload = response_json(upsert_session_response).await;
    assert_eq!(
        upsert_session_payload["data"]["id"],
        format!("project-session-{project_id}")
    );
    assert_eq!(
        upsert_session_payload["data"]["workspaceId"],
        workspace_uuid.as_str()
    );
    assert_eq!(
        upsert_session_payload["data"]["projectId"],
        format!("client-entity:{project_id}")
    );
    assert_eq!(
        upsert_session_payload["data"]["openFiles"][0]["path"],
        "src/main.tsx"
    );
    assert_eq!(
        upsert_session_payload["data"]["openFiles"][1]["isPreview"],
        true
    );
    assert_eq!(
        upsert_session_payload["data"]["activeFilePath"],
        "src/main.tsx"
    );
    assert_eq!(upsert_session_payload["data"]["selectedPath"], "src");
    assert_eq!(
        upsert_session_payload["data"]["expandedPaths"]
            .as_array()
            .expect("session expanded paths")
            .len(),
        2
    );
    assert!(upsert_session_payload["data"]["uuid"].is_string());

    let read_session_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadSession",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_session_response.status().as_u16(), 200);
    let read_session_payload = response_json(read_session_response).await;
    assert_eq!(
        read_session_payload["data"]["session"]["id"],
        format!("project-session-{project_id}")
    );
    assert_eq!(
        read_session_payload["data"]["session"]["workspaceId"],
        workspace_uuid.as_str()
    );
    assert_eq!(
        read_session_payload["data"]["session"]["openFiles"][0]["path"],
        "src/main.tsx"
    );
    assert_eq!(
        read_session_payload["data"]["session"]["expandedPaths"][1],
        "src/components"
    );

    let delete_session_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDeleteSession",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_session_response.status().as_u16(), 200);
    let delete_session_payload = response_json(delete_session_response).await;
    assert_eq!(delete_session_payload["data"]["ok"], true);

    let read_deleted_session_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadSession",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_deleted_session_response.status().as_u16(), 200);
    let read_deleted_session_payload = response_json(read_deleted_session_response).await;
    assert!(read_deleted_session_payload["data"]["session"].is_null());

    let duplicate_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsDuplicate",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(duplicate_project_response.status().as_u16(), 200);
    let duplicate_project_payload = response_json(duplicate_project_response).await;
    let duplicated_project_id = duplicate_project_payload["data"]["id"]
        .as_str()
        .expect("duplicated project id")
        .to_string();
    let duplicated_project_path = duplicate_project_payload["data"]["path"]
        .as_str()
        .expect("duplicated project path");
    assert_ne!(duplicated_project_id, project_id);
    assert_eq!(
        duplicate_project_payload["data"]["name"],
        "Brand Video Final Copy"
    );
    assert!(duplicate_project_payload["data"]["archivedAt"].is_null());
    assert!(std::path::Path::new(duplicated_project_path)
        .join("project-manifest.json")
        .exists());

    let archive_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsArchive",
                &[
                    ("workspaceId", workspace_uuid.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(archive_project_response.status().as_u16(), 200);
    let archive_project_payload = response_json(archive_project_response).await;
    assert!(archive_project_payload["data"]["archivedAt"].is_string());

    let restore_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsRestore",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(restore_project_response.status().as_u16(), 200);
    let restore_project_payload = response_json(restore_project_response).await;
    assert!(restore_project_payload["data"]["archivedAt"].is_null());

    let read_workspace_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspacesRead",
            &[("workspaceId", workspace_uuid.as_str())],
        )),
    )
    .await;
    assert_eq!(read_workspace_response.status().as_u16(), 200);
    let read_workspace_payload = response_json(read_workspace_response).await;
    assert_eq!(
        read_workspace_payload["data"]["projects"][0]["name"],
        "Brand Video Final"
    );

    let list_projects_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsList",
            &[("workspaceId", workspace_id.as_str())],
        )),
    )
    .await;
    assert_eq!(list_projects_response.status().as_u16(), 200);
    let list_projects_payload = response_json(list_projects_response).await;
    assert_eq!(
        list_projects_payload["items"]
            .as_array()
            .expect("projects array")
            .len(),
        2
    );

    let delete_project_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDelete",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", duplicated_project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_project_response.status().as_u16(), 200);

    let delete_original_project_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDelete",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_original_project_response.status().as_u16(), 200);

    let delete_workspace_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspacesDelete",
                &[("workspaceId", workspace_uuid.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_workspace_response.status().as_u16(), 200);

    let empty_workspaces_response = call(app, empty_request(route_path("appWorkspacesList"))).await;
    assert_eq!(empty_workspaces_response.status().as_u16(), 200);
    let empty_workspaces_payload = response_json(empty_workspaces_response).await;
    assert_eq!(
        empty_workspaces_payload["items"]
            .as_array()
            .expect("workspace array")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_workspace_project_governance_routes_are_served_and_support_git_sync_and_release_packaging(
) {
    let data_root = unique_temp_path("magic-studio-server-app-project-governance");
    let app = server_app_with_data_root(&data_root);

    let create_workspace_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appWorkspacesCreate"),
            r#"{"name":"Governance Workspace","description":"Workspace for governance routes"}"#,
        ),
    )
    .await;
    assert_eq!(create_workspace_response.status().as_u16(), 200);
    let create_workspace_payload = response_json(create_workspace_response).await;
    let workspace_id = create_workspace_payload["data"]["id"]
        .as_str()
        .expect("workspace id")
        .to_string();

    let create_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreate",
                &[("workspaceId", workspace_id.as_str())],
            ),
            r#"{"name":"Governance Project","type":"APP","description":"Project for governance routes"}"#,
        ),
    )
    .await;
    assert_eq!(create_project_response.status().as_u16(), 200);
    let create_project_payload = response_json(create_project_response).await;
    let project_id = create_project_payload["data"]["id"]
        .as_str()
        .expect("project id")
        .to_string();
    let project_path = create_project_payload["data"]["path"]
        .as_str()
        .expect("project path")
        .to_string();

    std::fs::write(
        std::path::Path::new(&project_path).join("README.md"),
        br#"# Governance Project"#,
    )
    .expect("write project readme");
    std::fs::create_dir_all(std::path::Path::new(&project_path).join("src"))
        .expect("create src directory");
    std::fs::write(
        std::path::Path::new(&project_path)
            .join("src")
            .join("main.ts"),
        br#"console.log('magic studio');"#,
    )
    .expect("write project source file");

    let remote_repo = data_root.join("project-remote.git");
    let remote_init_output = std::process::Command::new("git")
        .args(["init", "--bare", remote_repo.to_string_lossy().as_ref()])
        .output()
        .expect("init bare git repository");
    assert!(
        remote_init_output.status.success(),
        "failed to initialize bare git repository: {}",
        String::from_utf8_lossy(&remote_init_output.stderr)
    );

    let git_sync_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsGitSync",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            &format!(
                r#"{{"repository":{},"branch":"main","message":"feat: initial sync"}}"#,
                json_string(&remote_repo)
            ),
        ),
    )
    .await;
    assert_eq!(git_sync_response.status().as_u16(), 200);
    let git_sync_payload = response_json(git_sync_response).await;
    assert_eq!(git_sync_payload["data"]["status"], "SUCCEEDED");
    let synced_commit_hash = git_sync_payload["data"]["commitHash"]
        .as_str()
        .expect("synced commit hash")
        .to_string();
    let remote_repo_arg = remote_repo.to_string_lossy().to_string();
    let remote_head_output = std::process::Command::new("git")
        .args([
            "--git-dir",
            remote_repo_arg.as_str(),
            "rev-parse",
            "refs/heads/main",
        ])
        .output()
        .expect("read bare repository main ref");
    assert!(
        remote_head_output.status.success(),
        "failed to read bare repository main ref: {}",
        String::from_utf8_lossy(&remote_head_output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&remote_head_output.stdout).trim(),
        synced_commit_hash
    );

    let git_sync_no_changes_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsGitSync",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            &format!(
                r#"{{"repository":{},"branch":"main","message":"feat: no changes"}}"#,
                json_string(&remote_repo)
            ),
        ),
    )
    .await;
    assert_eq!(git_sync_no_changes_response.status().as_u16(), 200);
    let git_sync_no_changes_payload = response_json(git_sync_no_changes_response).await;
    assert_eq!(git_sync_no_changes_payload["data"]["status"], "NO_CHANGES");
    let first_sync_id = git_sync_payload["data"]["id"]
        .as_str()
        .expect("first git sync id")
        .to_string();
    let latest_sync_id = git_sync_no_changes_payload["data"]["id"]
        .as_str()
        .expect("latest git sync id")
        .to_string();

    let list_git_syncs_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsListGitSyncs",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(list_git_syncs_response.status().as_u16(), 200);
    let list_git_syncs_payload = response_json(list_git_syncs_response).await;
    let git_sync_items = list_git_syncs_payload["items"]
        .as_array()
        .expect("git sync list");
    assert_eq!(git_sync_items.len(), 2);
    assert_eq!(git_sync_items[0]["status"], "NO_CHANGES");
    assert_eq!(git_sync_items[1]["status"], "SUCCEEDED");

    let read_latest_git_sync_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestGitSync",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_git_sync_response.status().as_u16(), 200);
    let read_latest_git_sync_payload = response_json(read_latest_git_sync_response).await;
    assert_eq!(
        read_latest_git_sync_payload["data"]["id"],
        latest_sync_id.as_str()
    );
    assert!(read_latest_git_sync_payload["data"]["retryOfSyncId"].is_null());

    let read_first_git_sync_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadGitSync",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("syncId", first_sync_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_first_git_sync_response.status().as_u16(), 200);
    let read_first_git_sync_payload = response_json(read_first_git_sync_response).await;
    assert_eq!(read_first_git_sync_payload["data"]["status"], "SUCCEEDED");

    let retry_git_sync_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsRetryGitSync",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("syncId", first_sync_id.as_str()),
                ],
            ),
            r#"{"message":"chore: retry canonical sync"}"#,
        ),
    )
    .await;
    assert_eq!(retry_git_sync_response.status().as_u16(), 200);
    let retry_git_sync_payload = response_json(retry_git_sync_response).await;
    let retried_sync_id = retry_git_sync_payload["data"]["id"]
        .as_str()
        .expect("retried git sync id")
        .to_string();
    assert_ne!(retried_sync_id, first_sync_id);
    assert_eq!(retry_git_sync_payload["data"]["status"], "NO_CHANGES");
    assert_eq!(
        retry_git_sync_payload["data"]["retryOfSyncId"],
        first_sync_id.as_str()
    );
    assert_eq!(
        retry_git_sync_payload["data"]["message"],
        "chore: retry canonical sync"
    );

    let read_latest_retried_git_sync_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestGitSync",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_retried_git_sync_response.status().as_u16(), 200);
    let read_latest_retried_git_sync_payload =
        response_json(read_latest_retried_git_sync_response).await;
    assert_eq!(
        read_latest_retried_git_sync_payload["data"]["id"],
        retried_sync_id.as_str()
    );
    assert_eq!(
        read_latest_retried_git_sync_payload["data"]["retryOfSyncId"],
        first_sync_id.as_str()
    );

    let list_initial_releases_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsListReleases",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(list_initial_releases_response.status().as_u16(), 200);
    let list_initial_releases_payload = response_json(list_initial_releases_response).await;
    assert_eq!(
        list_initial_releases_payload["items"]
            .as_array()
            .expect("initial release list")
            .len(),
        0
    );

    let create_release_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreateRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"appName":"governance-app","version":"1.0.0","target":"WEB_STATIC"}"#,
        ),
    )
    .await;
    assert_eq!(create_release_response.status().as_u16(), 200);
    let create_release_payload = response_json(create_release_response).await;
    let release_id = create_release_payload["data"]["id"]
        .as_str()
        .expect("release id")
        .to_string();
    let artifact_path = create_release_payload["data"]["artifactPath"]
        .as_str()
        .expect("artifact path")
        .to_string();
    assert_eq!(create_release_payload["data"]["status"], "READY");
    assert_eq!(
        artifact_path,
        route_path_with_params(
            "appWorkspaceProjectsReadReleaseArtifact",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("releaseId", release_id.as_str()),
            ],
        )
    );

    let read_latest_release_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_release_response.status().as_u16(), 200);
    let read_latest_release_payload = response_json(read_latest_release_response).await;
    assert_eq!(
        read_latest_release_payload["data"]["id"],
        release_id.as_str()
    );

    let read_release_manifest_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseManifest",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("releaseId", release_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_release_manifest_response.status().as_u16(), 200);
    let read_release_manifest_payload = response_json(read_release_manifest_response).await;
    assert_eq!(
        read_release_manifest_payload["data"]["release"]["id"],
        release_id.as_str()
    );
    let manifest_entries = read_release_manifest_payload["data"]["entries"]
        .as_array()
        .expect("release manifest entries");
    assert_eq!(manifest_entries.len(), 2);
    assert_eq!(manifest_entries[0]["path"], "README.md");
    assert_eq!(manifest_entries[1]["path"], "src/main.ts");

    let rebuild_release_response = call(
        app.clone(),
        empty_request_with_method(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsRebuildRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("releaseId", release_id.as_str()),
                ],
            ),
        ),
    )
    .await;
    assert_eq!(rebuild_release_response.status().as_u16(), 200);
    let rebuild_release_payload = response_json(rebuild_release_response).await;
    let rebuilt_release_id = rebuild_release_payload["data"]["id"]
        .as_str()
        .expect("rebuilt release id")
        .to_string();
    assert_ne!(rebuilt_release_id, release_id);
    assert_eq!(rebuild_release_payload["data"]["appName"], "governance-app");
    assert_eq!(rebuild_release_payload["data"]["version"], "1.0.0");
    assert_eq!(
        rebuild_release_payload["data"]["rebuildOfReleaseId"],
        release_id.as_str()
    );

    let list_releases_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsListReleases",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(list_releases_response.status().as_u16(), 200);
    let list_releases_payload = response_json(list_releases_response).await;
    assert_eq!(
        list_releases_payload["items"]
            .as_array()
            .expect("release list")
            .len(),
        2
    );

    let read_latest_rebuilt_release_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_rebuilt_release_response.status().as_u16(), 200);
    let read_latest_rebuilt_release_payload =
        response_json(read_latest_rebuilt_release_response).await;
    assert_eq!(
        read_latest_rebuilt_release_payload["data"]["id"],
        rebuilt_release_id.as_str()
    );

    let delete_rebuilt_release_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDeleteRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("releaseId", rebuilt_release_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_rebuilt_release_response.status().as_u16(), 200);
    let delete_rebuilt_release_payload = response_json(delete_rebuilt_release_response).await;
    assert_eq!(
        delete_rebuilt_release_payload["data"]["id"],
        rebuilt_release_id.as_str()
    );
    assert!(delete_rebuilt_release_payload["data"]["deletedAt"].is_string());

    let read_latest_after_delete_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_after_delete_response.status().as_u16(), 200);
    let read_latest_after_delete_payload = response_json(read_latest_after_delete_response).await;
    assert_eq!(
        read_latest_after_delete_payload["data"]["id"],
        release_id.as_str()
    );

    let restore_rebuilt_release_response = call(
        app.clone(),
        empty_request_with_method(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsRestoreRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("releaseId", rebuilt_release_id.as_str()),
                ],
            ),
        ),
    )
    .await;
    assert_eq!(restore_rebuilt_release_response.status().as_u16(), 200);
    let restore_rebuilt_release_payload = response_json(restore_rebuilt_release_response).await;
    assert_eq!(
        restore_rebuilt_release_payload["data"]["id"],
        rebuilt_release_id.as_str()
    );
    assert!(restore_rebuilt_release_payload["data"]["deletedAt"].is_null());

    let read_latest_after_restore_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_after_restore_response.status().as_u16(), 200);
    let read_latest_after_restore_payload = response_json(read_latest_after_restore_response).await;
    assert_eq!(
        read_latest_after_restore_payload["data"]["id"],
        rebuilt_release_id.as_str()
    );

    let read_release_stats_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseStats",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_release_stats_response.status().as_u16(), 200);
    let read_release_stats_payload = response_json(read_release_stats_response).await;
    assert_eq!(read_release_stats_payload["data"]["totalCount"], 2);
    assert_eq!(read_release_stats_payload["data"]["activeCount"], 2);
    assert_eq!(read_release_stats_payload["data"]["deletedCount"], 0);
    assert_eq!(
        read_release_stats_payload["data"]["latestActiveReleaseId"],
        rebuilt_release_id.as_str()
    );

    let delete_rebuilt_release_again_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDeleteRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("releaseId", rebuilt_release_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_rebuilt_release_again_response.status().as_u16(), 200);

    let read_release_stats_after_delete_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseStats",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(
        read_release_stats_after_delete_response.status().as_u16(),
        200
    );
    let read_release_stats_after_delete_payload =
        response_json(read_release_stats_after_delete_response).await;
    assert_eq!(
        read_release_stats_after_delete_payload["data"]["totalCount"],
        2
    );
    assert_eq!(
        read_release_stats_after_delete_payload["data"]["activeCount"],
        1
    );
    assert_eq!(
        read_release_stats_after_delete_payload["data"]["deletedCount"],
        1
    );
    assert_eq!(
        read_release_stats_after_delete_payload["data"]["latestActiveReleaseId"],
        release_id.as_str()
    );
    assert_eq!(
        read_release_stats_after_delete_payload["data"]["latestDeletedReleaseId"],
        rebuilt_release_id.as_str()
    );

    let dry_run_prune_releases_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsPruneReleases",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            &format!(r#"{{"dryRun":true,"releaseIds":["{rebuilt_release_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(dry_run_prune_releases_response.status().as_u16(), 200);
    let dry_run_prune_releases_payload = response_json(dry_run_prune_releases_response).await;
    assert_eq!(dry_run_prune_releases_payload["data"]["dryRun"], true);
    assert_eq!(dry_run_prune_releases_payload["data"]["prunedCount"], 1);
    assert_eq!(
        dry_run_prune_releases_payload["data"]["prunedReleaseIds"][0],
        rebuilt_release_id.as_str()
    );
    assert_eq!(
        dry_run_prune_releases_payload["data"]["remainingStats"]["totalCount"],
        1
    );
    assert_eq!(
        dry_run_prune_releases_payload["data"]["remainingStats"]["activeCount"],
        1
    );
    assert_eq!(
        dry_run_prune_releases_payload["data"]["remainingStats"]["deletedCount"],
        0
    );

    let prune_releases_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsPruneReleases",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            &format!(r#"{{"releaseIds":["{rebuilt_release_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(prune_releases_response.status().as_u16(), 200);
    let prune_releases_payload = response_json(prune_releases_response).await;
    assert_eq!(prune_releases_payload["data"]["dryRun"], false);
    assert_eq!(prune_releases_payload["data"]["prunedCount"], 1);
    assert_eq!(
        prune_releases_payload["data"]["prunedReleaseIds"][0],
        rebuilt_release_id.as_str()
    );
    assert_eq!(
        prune_releases_payload["data"]["remainingStats"]["totalCount"],
        1
    );
    assert_eq!(
        prune_releases_payload["data"]["remainingStats"]["activeCount"],
        1
    );
    assert_eq!(
        prune_releases_payload["data"]["remainingStats"]["deletedCount"],
        0
    );

    let list_releases_after_prune_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsListReleases",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(list_releases_after_prune_response.status().as_u16(), 200);
    let list_releases_after_prune_payload = response_json(list_releases_after_prune_response).await;
    assert_eq!(
        list_releases_after_prune_payload["items"]
            .as_array()
            .expect("release list after prune")
            .len(),
        1
    );
    assert_eq!(
        list_releases_after_prune_payload["items"][0]["id"],
        release_id.as_str()
    );

    let read_pruned_release_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("releaseId", rebuilt_release_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_pruned_release_response.status().as_u16(), 404);

    let read_latest_after_prune_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_latest_after_prune_response.status().as_u16(), 200);
    let read_latest_after_prune_payload = response_json(read_latest_after_prune_response).await;
    assert_eq!(
        read_latest_after_prune_payload["data"]["id"],
        release_id.as_str()
    );

    let read_release_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("releaseId", release_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_release_response.status().as_u16(), 200);
    let read_release_payload = response_json(read_release_response).await;
    assert_eq!(read_release_payload["data"]["id"], release_id.as_str());
    assert_eq!(read_release_payload["data"]["artifactPath"], artifact_path);

    let artifact_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseArtifact",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("releaseId", release_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(artifact_response.status().as_u16(), 200);
    assert_eq!(
        artifact_response
            .headers()
            .get("content-type")
            .and_then(|value| value.to_str().ok()),
        Some("application/zip")
    );
    let artifact_bytes = artifact_response
        .into_body()
        .collect()
        .await
        .expect("collect artifact body")
        .to_bytes();
    assert!(artifact_bytes.starts_with(b"PK"));

    let read_default_retention_policy_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseRetentionPolicy",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(
        read_default_retention_policy_response.status().as_u16(),
        200
    );
    let read_default_retention_policy_payload =
        response_json(read_default_retention_policy_response).await;
    assert_eq!(
        read_default_retention_policy_payload["data"]["enabled"],
        false
    );
    assert_eq!(
        read_default_retention_policy_payload["data"]["keepLatestCount"],
        5
    );

    let update_retention_policy_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params(
                "appWorkspaceProjectsUpdateReleaseRetentionPolicy",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"enabled":true,"keepLatestCount":1,"maxDeletedCount":0,"autoApplyOnCreate":true}"#,
        ),
    )
    .await;
    assert_eq!(update_retention_policy_response.status().as_u16(), 200);
    let update_retention_policy_payload = response_json(update_retention_policy_response).await;
    assert_eq!(update_retention_policy_payload["data"]["enabled"], true);
    assert_eq!(
        update_retention_policy_payload["data"]["keepLatestCount"],
        1
    );
    assert_eq!(
        update_retention_policy_payload["data"]["maxDeletedCount"],
        0
    );
    assert_eq!(
        update_retention_policy_payload["data"]["autoApplyOnCreate"],
        true
    );

    let create_retention_policy_release_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreateRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"appName":"governance-app","version":"1.0.1","target":"WEB_STATIC","autoDeploy":false}"#,
        ),
    )
    .await;
    assert_eq!(
        create_retention_policy_release_response.status().as_u16(),
        200
    );
    let create_retention_policy_release_payload =
        response_json(create_retention_policy_release_response).await;
    let retained_release_id = create_retention_policy_release_payload["data"]["id"]
        .as_str()
        .expect("retained release id")
        .to_string();
    assert_ne!(retained_release_id, release_id);

    let read_stats_after_auto_apply_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseStats",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_stats_after_auto_apply_response.status().as_u16(), 200);
    let read_stats_after_auto_apply_payload =
        response_json(read_stats_after_auto_apply_response).await;
    assert_eq!(read_stats_after_auto_apply_payload["data"]["totalCount"], 2);
    assert_eq!(
        read_stats_after_auto_apply_payload["data"]["activeCount"],
        1
    );
    assert_eq!(
        read_stats_after_auto_apply_payload["data"]["deletedCount"],
        1
    );
    assert_eq!(
        read_stats_after_auto_apply_payload["data"]["latestActiveReleaseId"],
        retained_release_id.as_str()
    );
    assert_eq!(
        read_stats_after_auto_apply_payload["data"]["latestDeletedReleaseId"],
        release_id.as_str()
    );

    let dry_run_apply_retention_policy_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsApplyReleaseRetentionPolicy",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"dryRun":true}"#,
        ),
    )
    .await;
    assert_eq!(
        dry_run_apply_retention_policy_response.status().as_u16(),
        200
    );
    let dry_run_apply_retention_policy_payload =
        response_json(dry_run_apply_retention_policy_response).await;
    assert_eq!(
        dry_run_apply_retention_policy_payload["data"]["deletedCount"],
        0
    );
    assert_eq!(
        dry_run_apply_retention_policy_payload["data"]["prunedCount"],
        1
    );
    assert_eq!(
        dry_run_apply_retention_policy_payload["data"]["prunedReleaseIds"][0],
        release_id.as_str()
    );
    assert_eq!(
        dry_run_apply_retention_policy_payload["data"]["statsBefore"]["deletedCount"],
        1
    );
    assert_eq!(
        dry_run_apply_retention_policy_payload["data"]["statsAfter"]["totalCount"],
        1
    );

    let apply_retention_policy_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsApplyReleaseRetentionPolicy",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(apply_retention_policy_response.status().as_u16(), 200);
    let apply_retention_policy_payload = response_json(apply_retention_policy_response).await;
    assert_eq!(apply_retention_policy_payload["data"]["deletedCount"], 0);
    assert_eq!(apply_retention_policy_payload["data"]["prunedCount"], 1);
    assert_eq!(
        apply_retention_policy_payload["data"]["prunedReleaseIds"][0],
        release_id.as_str()
    );
    assert_eq!(
        apply_retention_policy_payload["data"]["statsAfter"]["totalCount"],
        1
    );
    assert_eq!(
        apply_retention_policy_payload["data"]["statsAfter"]["activeCount"],
        1
    );
    assert_eq!(
        apply_retention_policy_payload["data"]["statsAfter"]["deletedCount"],
        0
    );

    let read_pruned_by_policy_release_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
                ("releaseId", release_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(
        read_pruned_by_policy_release_response.status().as_u16(),
        404
    );

    let read_latest_after_retention_policy_response = call(
        app,
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadLatestRelease",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(
        read_latest_after_retention_policy_response
            .status()
            .as_u16(),
        200
    );
    let read_latest_after_retention_policy_payload =
        response_json(read_latest_after_retention_policy_response).await;
    assert_eq!(
        read_latest_after_retention_policy_payload["data"]["id"],
        retained_release_id.as_str()
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn admin_workspace_release_retention_run_routes_are_served_and_persist_audit_history() {
    let data_root = unique_temp_path("magic-studio-server-admin-release-retention-runs");
    let app = server_app_with_data_root(&data_root);

    let create_workspace_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appWorkspacesCreate"),
            r#"{"name":"Admin Governance Workspace","description":"Workspace for admin governance routes"}"#,
        ),
    )
    .await;
    assert_eq!(create_workspace_response.status().as_u16(), 200);
    let create_workspace_payload = response_json(create_workspace_response).await;
    let workspace_id = create_workspace_payload["data"]["id"]
        .as_str()
        .expect("workspace id")
        .to_string();
    let workspace_uuid = create_workspace_payload["data"]["uuid"]
        .as_str()
        .expect("workspace uuid")
        .to_string();

    let create_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreate",
                &[("workspaceId", workspace_id.as_str())],
            ),
            r#"{"name":"Retention Audit Project","type":"APP","description":"Project for admin governance retention routes"}"#,
        ),
    )
    .await;
    assert_eq!(create_project_response.status().as_u16(), 200);
    let create_project_payload = response_json(create_project_response).await;
    let project_id = create_project_payload["data"]["id"]
        .as_str()
        .expect("project id")
        .to_string();
    let project_uuid = create_project_payload["data"]["uuid"]
        .as_str()
        .expect("project uuid")
        .to_string();
    let project_path = create_project_payload["data"]["path"]
        .as_str()
        .expect("project path")
        .to_string();

    std::fs::write(
        std::path::Path::new(&project_path).join("README.md"),
        br#"# Retention Audit Project"#,
    )
    .expect("write project readme");
    std::fs::create_dir_all(std::path::Path::new(&project_path).join("src"))
        .expect("create src directory");
    std::fs::write(
        std::path::Path::new(&project_path)
            .join("src")
            .join("main.ts"),
        br#"console.log('retention-audit');"#,
    )
    .expect("write project source file");

    let create_first_release_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreateRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"appName":"retention-audit-app","version":"1.0.0","target":"WEB_STATIC"}"#,
        ),
    )
    .await;
    assert_eq!(create_first_release_response.status().as_u16(), 200);
    let create_first_release_payload = response_json(create_first_release_response).await;
    let first_release_id = create_first_release_payload["data"]["id"]
        .as_str()
        .expect("first release id")
        .to_string();

    let create_second_release_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreateRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"appName":"retention-audit-app","version":"1.0.1","target":"WEB_STATIC"}"#,
        ),
    )
    .await;
    assert_eq!(create_second_release_response.status().as_u16(), 200);

    let delete_first_release_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDeleteRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("releaseId", first_release_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_first_release_response.status().as_u16(), 200);

    let update_retention_policy_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params(
                "appWorkspaceProjectsUpdateReleaseRetentionPolicy",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"enabled":true,"keepLatestCount":1,"maxDeletedCount":0,"autoApplyOnCreate":false}"#,
        ),
    )
    .await;
    assert_eq!(update_retention_policy_response.status().as_u16(), 200);

    let initial_runs_response = call(
        app.clone(),
        empty_request(route_path("adminWorkspaceReleaseRetentionRunsList")),
    )
    .await;
    assert_eq!(initial_runs_response.status().as_u16(), 200);
    let initial_runs_payload = response_json(initial_runs_response).await;
    assert_eq!(
        initial_runs_payload["items"]
            .as_array()
            .expect("initial retention run list")
            .len(),
        0
    );

    let create_run_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("adminWorkspaceReleaseRetentionRunsCreate"),
            &format!(r#"{{"workspaceIds":["{workspace_uuid}"],"projectIds":["{project_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(create_run_response.status().as_u16(), 200);
    let create_run_payload = response_json(create_run_response).await;
    let run_id = create_run_payload["data"]["id"]
        .as_str()
        .expect("run id")
        .to_string();
    assert_eq!(create_run_payload["data"]["status"], "SUCCEEDED");
    assert_eq!(create_run_payload["data"]["workspaceCount"], 1);
    assert_eq!(create_run_payload["data"]["projectCount"], 1);
    assert_eq!(create_run_payload["data"]["appliedProjectCount"], 1);
    assert_eq!(create_run_payload["data"]["skippedProjectCount"], 0);
    assert_eq!(create_run_payload["data"]["failedProjectCount"], 0);
    assert_eq!(create_run_payload["data"]["deletedCount"], 0);
    assert_eq!(create_run_payload["data"]["prunedCount"], 1);
    assert_eq!(
        create_run_payload["data"]["results"]
            .as_array()
            .expect("run results")
            .len(),
        1
    );
    assert_eq!(
        create_run_payload["data"]["results"][0]["status"],
        "APPLIED"
    );
    assert_eq!(
        create_run_payload["data"]["results"][0]["workspaceId"],
        workspace_uuid.as_str()
    );
    assert_eq!(
        create_run_payload["data"]["results"][0]["projectId"],
        project_uuid.as_str()
    );
    assert_eq!(create_run_payload["data"]["results"][0]["prunedCount"], 1);
    assert_eq!(
        create_run_payload["data"]["results"][0]["prunedReleaseIds"][0],
        first_release_id.as_str()
    );

    let list_runs_response = call(
        app.clone(),
        empty_request(route_path("adminWorkspaceReleaseRetentionRunsList")),
    )
    .await;
    assert_eq!(list_runs_response.status().as_u16(), 200);
    let list_runs_payload = response_json(list_runs_response).await;
    let listed_runs = list_runs_payload["items"]
        .as_array()
        .expect("listed retention runs");
    assert_eq!(listed_runs.len(), 1);
    assert_eq!(listed_runs[0]["id"], run_id.as_str());
    assert_eq!(listed_runs[0]["prunedCount"], 1);

    let read_run_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "adminWorkspaceReleaseRetentionRunsRead",
            &[("runId", run_id.as_str())],
        )),
    )
    .await;
    assert_eq!(read_run_response.status().as_u16(), 200);
    let read_run_payload = response_json(read_run_response).await;
    assert_eq!(read_run_payload["data"]["id"], run_id.as_str());
    assert_eq!(
        read_run_payload["data"]["results"][0]["projectId"],
        project_uuid
    );

    let read_stats_after_run_response = call(
        app,
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseStats",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_stats_after_run_response.status().as_u16(), 200);
    let read_stats_after_run_payload = response_json(read_stats_after_run_response).await;
    assert_eq!(read_stats_after_run_payload["data"]["totalCount"], 1);
    assert_eq!(read_stats_after_run_payload["data"]["activeCount"], 1);
    assert_eq!(read_stats_after_run_payload["data"]["deletedCount"], 0);

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn admin_workspace_release_retention_schedule_routes_are_served_and_support_triggered_governance(
) {
    let data_root = unique_temp_path("magic-studio-server-admin-release-retention-schedules");
    let app = server_app_with_data_root(&data_root);

    let create_workspace_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appWorkspacesCreate"),
            r#"{"name":"Admin Schedule Workspace","description":"Workspace for admin schedule governance routes"}"#,
        ),
    )
    .await;
    assert_eq!(create_workspace_response.status().as_u16(), 200);
    let create_workspace_payload = response_json(create_workspace_response).await;
    let workspace_id = create_workspace_payload["data"]["id"]
        .as_str()
        .expect("workspace id")
        .to_string();
    let workspace_uuid = create_workspace_payload["data"]["uuid"]
        .as_str()
        .expect("workspace uuid")
        .to_string();

    let create_project_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreate",
                &[("workspaceId", workspace_id.as_str())],
            ),
            r#"{"name":"Retention Schedule Project","type":"APP","description":"Project for admin schedule retention routes"}"#,
        ),
    )
    .await;
    assert_eq!(create_project_response.status().as_u16(), 200);
    let create_project_payload = response_json(create_project_response).await;
    let project_id = create_project_payload["data"]["id"]
        .as_str()
        .expect("project id")
        .to_string();
    let project_uuid = create_project_payload["data"]["uuid"]
        .as_str()
        .expect("project uuid")
        .to_string();
    let project_path = create_project_payload["data"]["path"]
        .as_str()
        .expect("project path")
        .to_string();

    std::fs::write(
        std::path::Path::new(&project_path).join("README.md"),
        br#"# Retention Schedule Project"#,
    )
    .expect("write project readme");

    let create_first_release_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreateRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"appName":"retention-schedule-app","version":"1.0.0","target":"WEB_STATIC"}"#,
        ),
    )
    .await;
    assert_eq!(create_first_release_response.status().as_u16(), 200);
    let create_first_release_payload = response_json(create_first_release_response).await;
    let first_release_id = create_first_release_payload["data"]["id"]
        .as_str()
        .expect("first release id")
        .to_string();

    let create_second_release_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appWorkspaceProjectsCreateRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"appName":"retention-schedule-app","version":"1.0.1","target":"WEB_STATIC"}"#,
        ),
    )
    .await;
    assert_eq!(create_second_release_response.status().as_u16(), 200);

    let delete_first_release_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appWorkspaceProjectsDeleteRelease",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                    ("releaseId", first_release_id.as_str()),
                ],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_first_release_response.status().as_u16(), 200);

    let update_retention_policy_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params(
                "appWorkspaceProjectsUpdateReleaseRetentionPolicy",
                &[
                    ("workspaceId", workspace_id.as_str()),
                    ("projectId", project_id.as_str()),
                ],
            ),
            r#"{"enabled":true,"keepLatestCount":1,"maxDeletedCount":0,"autoApplyOnCreate":false}"#,
        ),
    )
    .await;
    assert_eq!(update_retention_policy_response.status().as_u16(), 200);

    let create_schedule_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("adminWorkspaceReleaseRetentionSchedulesCreate"),
            &format!(
                r#"{{"name":"Nightly Cleanup","enabled":true,"dryRun":false,"intervalMinutes":60,"workspaceIds":["{workspace_uuid}"],"projectIds":["{project_uuid}"]}}"#
            ),
        ),
    )
    .await;
    assert_eq!(create_schedule_response.status().as_u16(), 200);
    let create_schedule_payload = response_json(create_schedule_response).await;
    let schedule_id = create_schedule_payload["data"]["id"]
        .as_str()
        .expect("schedule id")
        .to_string();
    assert_eq!(create_schedule_payload["data"]["name"], "Nightly Cleanup");
    assert_eq!(create_schedule_payload["data"]["enabled"], true);
    assert_eq!(create_schedule_payload["data"]["intervalMinutes"], 60);
    assert!(create_schedule_payload["data"]["nextRunAt"].is_string());

    let list_schedules_response = call(
        app.clone(),
        empty_request(route_path("adminWorkspaceReleaseRetentionSchedulesList")),
    )
    .await;
    assert_eq!(list_schedules_response.status().as_u16(), 200);
    let list_schedules_payload = response_json(list_schedules_response).await;
    assert_eq!(
        list_schedules_payload["items"]
            .as_array()
            .expect("schedule list")
            .len(),
        1
    );

    let update_schedule_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "adminWorkspaceReleaseRetentionSchedulesUpdate",
                &[("scheduleId", schedule_id.as_str())],
            ),
            r#"{"enabled":false,"dryRun":true,"intervalMinutes":120}"#,
        ),
    )
    .await;
    assert_eq!(update_schedule_response.status().as_u16(), 200);
    let update_schedule_payload = response_json(update_schedule_response).await;
    assert_eq!(update_schedule_payload["data"]["enabled"], false);
    assert_eq!(update_schedule_payload["data"]["dryRun"], true);
    assert_eq!(update_schedule_payload["data"]["intervalMinutes"], 120);
    assert!(update_schedule_payload["data"]["nextRunAt"].is_null());

    let trigger_schedule_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "adminWorkspaceReleaseRetentionSchedulesTrigger",
                &[("scheduleId", schedule_id.as_str())],
            ),
            r#"{"dryRun":false}"#,
        ),
    )
    .await;
    assert_eq!(trigger_schedule_response.status().as_u16(), 200);
    let trigger_schedule_payload = response_json(trigger_schedule_response).await;
    let run_id = trigger_schedule_payload["data"]["run"]["id"]
        .as_str()
        .expect("triggered run id")
        .to_string();
    assert_eq!(
        trigger_schedule_payload["data"]["schedule"]["id"],
        schedule_id
    );
    assert_eq!(
        trigger_schedule_payload["data"]["schedule"]["enabled"],
        false
    );
    assert_eq!(
        trigger_schedule_payload["data"]["schedule"]["lastRunId"],
        run_id
    );
    assert_eq!(
        trigger_schedule_payload["data"]["schedule"]["lastRunStatus"],
        "SUCCEEDED"
    );
    assert_eq!(
        trigger_schedule_payload["data"]["schedule"]["nextRunAt"],
        serde_json::Value::Null
    );
    assert_eq!(trigger_schedule_payload["data"]["run"]["prunedCount"], 1);
    assert_eq!(
        trigger_schedule_payload["data"]["run"]["results"][0]["projectId"],
        project_uuid
    );

    let read_schedule_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "adminWorkspaceReleaseRetentionSchedulesRead",
            &[("scheduleId", schedule_id.as_str())],
        )),
    )
    .await;
    assert_eq!(read_schedule_response.status().as_u16(), 200);
    let read_schedule_payload = response_json(read_schedule_response).await;
    assert_eq!(read_schedule_payload["data"]["lastRunId"], run_id);

    let list_runs_response = call(
        app.clone(),
        empty_request(route_path("adminWorkspaceReleaseRetentionRunsList")),
    )
    .await;
    assert_eq!(list_runs_response.status().as_u16(), 200);
    let list_runs_payload = response_json(list_runs_response).await;
    assert_eq!(
        list_runs_payload["items"]
            .as_array()
            .expect("retention run list")
            .len(),
        1
    );

    let read_stats_after_trigger_response = call(
        app,
        empty_request(route_path_with_params(
            "appWorkspaceProjectsReadReleaseStats",
            &[
                ("workspaceId", workspace_id.as_str()),
                ("projectId", project_id.as_str()),
            ],
        )),
    )
    .await;
    assert_eq!(read_stats_after_trigger_response.status().as_u16(), 200);
    let read_stats_after_trigger_payload = response_json(read_stats_after_trigger_response).await;
    assert_eq!(read_stats_after_trigger_payload["data"]["totalCount"], 1);
    assert_eq!(read_stats_after_trigger_payload["data"]["activeCount"], 1);
    assert_eq!(read_stats_after_trigger_payload["data"]["deletedCount"], 0);

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn admin_execution_governance_routes_are_served_and_report_inventory_health_and_failures() {
    let data_root = unique_temp_path("magic-studio-server-admin-execution-governance");
    std::fs::create_dir_all(&data_root).expect("create admin execution governance data root");
    let app = server_app_with_data_root(&data_root);

    let providers_response = call(
        app.clone(),
        empty_request(route_path("adminExecutionProvidersList")),
    )
    .await;
    assert_eq!(providers_response.status().as_u16(), 200);
    let providers_payload = response_json(providers_response).await;
    let providers = providers_payload["items"]
        .as_array()
        .expect("execution providers array");
    assert!(!providers.is_empty());
    assert!(providers
        .iter()
        .any(|item| item["key"] == "image-generation"));
    assert!(providers
        .iter()
        .any(|item| item["key"] == "video-generation"));
    assert!(providers
        .iter()
        .any(|item| item["executionStatus"] == "ready"));

    let health_response = call(
        app.clone(),
        empty_request(route_path("adminExecutionProvidersReadHealth")),
    )
    .await;
    assert_eq!(health_response.status().as_u16(), 200);
    let health_payload = response_json(health_response).await;
    let health_items = health_payload["items"]
        .as_array()
        .expect("execution provider health array");
    assert!(!health_items.is_empty());
    assert!(health_items
        .iter()
        .any(|item| item["status"] == "degraded" || item["status"] == "blocked"));
    assert!(health_items
        .iter()
        .all(|item| item["lastEvaluatedAt"].is_string()));

    let failures_response = call(
        app.clone(),
        empty_request(route_path("adminExecutionFailuresList")),
    )
    .await;
    assert_eq!(failures_response.status().as_u16(), 200);
    let failures_payload = response_json(failures_response).await;
    let failures = failures_payload["items"]
        .as_array()
        .expect("execution failures array");
    assert!(!failures.is_empty());
    assert!(failures
        .iter()
        .any(|item| item["providerKey"] == "video-generation"));
    assert!(failures
        .iter()
        .all(|item| item["severity"] == "warning" || item["severity"] == "critical"));

    let video_failure = failures
        .iter()
        .find(|item| item["providerKey"] == "video-generation")
        .expect("video generation failure");
    let failure_id = video_failure["id"]
        .as_str()
        .expect("failure id")
        .to_string();
    let provider_key = video_failure["providerKey"]
        .as_str()
        .expect("provider key")
        .to_string();
    assert_eq!(video_failure["acknowledged"], false);

    let provider_detail_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "adminExecutionProvidersRead",
            &[("providerKey", provider_key.as_str())],
        )),
    )
    .await;
    assert_eq!(provider_detail_response.status().as_u16(), 200);
    let provider_detail_payload = response_json(provider_detail_response).await;
    assert_eq!(
        provider_detail_payload["data"]["provider"]["key"],
        provider_key
    );
    assert!(
        provider_detail_payload["data"]["activeFailureCount"]
            .as_u64()
            .unwrap_or(0)
            >= 1
    );

    let acknowledge_failure_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "adminExecutionFailuresAcknowledge",
                &[("failureId", failure_id.as_str())],
            ),
            r#"{"actor":"architect","note":"operator acknowledged canonical failure"}"#,
        ),
    )
    .await;
    assert_eq!(acknowledge_failure_response.status().as_u16(), 200);
    let acknowledge_failure_payload = response_json(acknowledge_failure_response).await;
    assert_eq!(acknowledge_failure_payload["data"]["acknowledged"], true);
    assert_eq!(
        acknowledge_failure_payload["data"]["acknowledgement"]["actor"],
        "architect"
    );

    let retry_failure_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "adminExecutionFailuresRetry",
                &[("failureId", failure_id.as_str())],
            ),
            r#"{"actor":"architect","note":"re-evaluate canonical failure"}"#,
        ),
    )
    .await;
    assert_eq!(retry_failure_response.status().as_u16(), 200);
    let retry_failure_payload = response_json(retry_failure_response).await;
    assert_eq!(retry_failure_payload["data"]["failureId"], failure_id);
    assert_eq!(retry_failure_payload["data"]["providerKey"], provider_key);
    assert!(
        retry_failure_payload["data"]["outcome"] == "still-blocked"
            || retry_failure_payload["data"]["outcome"] == "resolved"
    );
    assert_eq!(retry_failure_payload["data"]["retry"]["actor"], "architect");

    let reconcile_provider_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "adminExecutionProvidersReconcile",
                &[("providerKey", provider_key.as_str())],
            ),
            r#"{"actor":"architect","note":"manual canonical reconcile"}"#,
        ),
    )
    .await;
    assert_eq!(reconcile_provider_response.status().as_u16(), 200);
    let reconcile_provider_payload = response_json(reconcile_provider_response).await;
    assert_eq!(
        reconcile_provider_payload["data"]["lastReconciliation"]["actor"],
        "architect"
    );
    assert_eq!(
        reconcile_provider_payload["data"]["lastReconciliation"]["healthStatus"],
        reconcile_provider_payload["data"]["health"]["status"]
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_asset_routes_are_served_and_support_catalog_management() {
    let data_root = unique_temp_path("magic-studio-server-app-assets");
    std::fs::create_dir_all(&data_root).expect("create data root");
    let source_file = data_root.join("source-image.png");
    std::fs::write(&source_file, b"fake-image-bytes").expect("write source file");
    let app = server_app_with_data_root(&data_root);

    let create_workspace_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appWorkspacesCreate"),
            r#"{"name":"Assets Workspace","description":"Workspace for asset tests"}"#,
        ),
    )
    .await;
    assert_eq!(create_workspace_response.status().as_u16(), 200);
    let create_workspace_payload = response_json(create_workspace_response).await;
    let workspace_id = create_workspace_payload["data"]["id"]
        .as_str()
        .expect("workspace id")
        .to_string();
    let workspace_uuid = create_workspace_payload["data"]["uuid"]
        .as_str()
        .expect("workspace uuid")
        .to_string();

    let import_asset_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAssetsImportFile"),
            &format!(
                r#"{{"scope":{{"workspaceId":"{workspace_uuid}","domain":"asset-center"}},"type":"image","sourcePath":{},"name":"Imported Cover","tags":["cover","hero"]}}"#,
                json_string(&source_file),
            ),
        ),
    )
    .await;
    assert_eq!(import_asset_response.status().as_u16(), 200);
    let import_asset_payload = response_json(import_asset_response).await;
    let asset_id = import_asset_payload["data"]["assetId"]
        .as_str()
        .expect("asset id")
        .to_string();
    assert_eq!(import_asset_payload["data"]["storage"]["mode"], "hybrid");
    assert_eq!(
        import_asset_payload["data"]["scope"]["workspaceId"],
        workspace_uuid
    );

    let list_assets_response = call(
        app.clone(),
        empty_request(format!(
            "{}?workspaceId={workspace_id}",
            route_path("appAssetsList")
        )),
    )
    .await;
    assert_eq!(list_assets_response.status().as_u16(), 200);
    let list_assets_payload = response_json(list_assets_response).await;
    assert_eq!(
        list_assets_payload["items"]
            .as_array()
            .expect("asset array")
            .len(),
        1
    );
    assert_eq!(list_assets_payload["meta"]["page"], 0);

    let stats_response = call(
        app.clone(),
        empty_request(format!(
            "{}?workspaceId={workspace_id}",
            route_path("appAssetsReadStats")
        )),
    )
    .await;
    assert_eq!(stats_response.status().as_u16(), 200);
    let stats_payload = response_json(stats_response).await;
    assert_eq!(stats_payload["data"]["totalAssets"], 1);
    assert_eq!(stats_payload["data"]["byType"]["image"], 1);

    let update_asset_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params("appAssetsUpdate", &[("assetId", asset_id.as_str())]),
            r#"{"title":"Imported Cover Final","isFavorite":true}"#,
        ),
    )
    .await;
    assert_eq!(update_asset_response.status().as_u16(), 200);
    let update_asset_payload = response_json(update_asset_response).await;
    assert_eq!(
        update_asset_payload["data"]["title"],
        "Imported Cover Final"
    );
    assert_eq!(update_asset_payload["data"]["isFavorite"], true);

    let mut upsert_asset_body = update_asset_payload["data"].clone();
    upsert_asset_body["title"] = serde_json::json!("Imported Cover Upserted");
    upsert_asset_body["metadata"] = serde_json::json!({
        "source": "asset-upsert-route",
        "origin": "upload"
    });
    let upsert_asset_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params("appAssetsUpsert", &[("assetId", asset_id.as_str())]),
            serde_json::to_string(&upsert_asset_body).expect("asset upsert body"),
        ),
    )
    .await;
    assert_eq!(upsert_asset_response.status().as_u16(), 200);
    let upsert_asset_payload = response_json(upsert_asset_response).await;
    assert_eq!(
        upsert_asset_payload["data"]["title"],
        "Imported Cover Upserted"
    );
    assert_eq!(
        upsert_asset_payload["data"]["metadata"]["source"],
        "asset-upsert-route"
    );

    let delete_asset_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params("appAssetsDelete", &[("assetId", asset_id.as_str())]),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_asset_response.status().as_u16(), 200);

    let empty_assets_response = call(
        app,
        empty_request(format!(
            "{}?workspaceId={workspace_id}",
            route_path("appAssetsList")
        )),
    )
    .await;
    assert_eq!(empty_assets_response.status().as_u16(), 200);
    let empty_assets_payload = response_json(empty_assets_response).await;
    assert_eq!(
        empty_assets_payload["items"]
            .as_array()
            .expect("asset array")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_drive_routes_are_served_and_support_virtual_content_management() {
    let data_root = unique_temp_path("magic-studio-server-app-drive");
    let app = server_app_with_data_root(&data_root);

    let root_response = call(app.clone(), empty_request(route_path("appDriveReadRoot"))).await;
    assert_eq!(root_response.status().as_u16(), 200);
    let root_payload = response_json(root_response).await;
    assert_eq!(root_payload["data"]["rootPath"], "/");
    assert_eq!(root_payload["data"]["defaultScope"], "my-drive");

    let create_folder_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appDriveCreateFolder"),
            r#"{"name":"Docs"}"#,
        ),
    )
    .await;
    assert_eq!(create_folder_response.status().as_u16(), 200);
    let create_folder_payload = response_json(create_folder_response).await;
    let folder_id = create_folder_payload["data"]["id"]
        .as_str()
        .expect("folder id")
        .to_string();
    assert_eq!(create_folder_payload["data"]["path"], "/Docs");

    let upload_file_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appDriveUploadFile"),
            &format!(
                r##"{{"name":"readme.md","content":"# Hello Drive","encoding":"utf-8","parentId":"{folder_id}","mimeType":"text/markdown"}}"##
            ),
        ),
    )
    .await;
    assert_eq!(upload_file_response.status().as_u16(), 200);
    let upload_file_payload = response_json(upload_file_response).await;
    let file_id = upload_file_payload["data"]["id"]
        .as_str()
        .expect("file id")
        .to_string();
    assert_eq!(upload_file_payload["data"]["path"], "/Docs/readme.md");

    let list_entries_response = call(
        app.clone(),
        empty_request(format!(
            "{}?parentId={folder_id}",
            route_path("appDriveListEntries")
        )),
    )
    .await;
    assert_eq!(list_entries_response.status().as_u16(), 200);
    let list_entries_payload = response_json(list_entries_response).await;
    assert_eq!(
        list_entries_payload["items"]
            .as_array()
            .expect("drive items array")
            .len(),
        1
    );
    assert_eq!(list_entries_payload["items"][0]["name"], "readme.md");

    let read_content_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appDriveReadFileContent",
            &[("itemId", file_id.as_str())],
        )),
    )
    .await;
    assert_eq!(read_content_response.status().as_u16(), 200);
    let read_content_payload = response_json(read_content_response).await;
    assert_eq!(read_content_payload["data"]["content"], "# Hello Drive");

    let update_content_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params("appDriveUpdateFileContent", &[("itemId", file_id.as_str())]),
            r##"{"content":"# Updated Drive","encoding":"utf-8"}"##,
        ),
    )
    .await;
    assert_eq!(update_content_response.status().as_u16(), 200);
    let update_content_payload = response_json(update_content_response).await;
    assert_eq!(update_content_payload["data"]["content"], "# Updated Drive");

    let favorite_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appDriveFavoriteItem"),
            &format!(r#"{{"itemId":"{file_id}","isFavorite":true}}"#),
        ),
    )
    .await;
    assert_eq!(favorite_response.status().as_u16(), 200);
    let favorite_payload = response_json(favorite_response).await;
    assert_eq!(favorite_payload["data"]["isFavorite"], true);

    let delete_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appDriveDeleteItems"),
            &format!(r#"{{"itemIds":["{file_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(delete_response.status().as_u16(), 200);

    let trash_response = call(
        app.clone(),
        empty_request(format!("{}?scope=trash", route_path("appDriveListEntries"))),
    )
    .await;
    assert_eq!(trash_response.status().as_u16(), 200);
    let trash_payload = response_json(trash_response).await;
    assert_eq!(
        trash_payload["items"]
            .as_array()
            .expect("trash items array")
            .len(),
        1
    );

    let restore_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appDriveRestoreItems"),
            &format!(r#"{{"itemIds":["{file_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(restore_response.status().as_u16(), 200);

    let delete_again_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appDriveDeleteItems"),
            &format!(r#"{{"itemIds":["{file_id}"]}}"#),
        ),
    )
    .await;
    assert_eq!(delete_again_response.status().as_u16(), 200);

    let empty_trash_response = call(
        app.clone(),
        json_request("POST", route_path("appDriveEmptyTrash"), "{}"),
    )
    .await;
    assert_eq!(empty_trash_response.status().as_u16(), 200);

    let empty_trash_list_response = call(
        app,
        empty_request(format!("{}?scope=trash", route_path("appDriveListEntries"))),
    )
    .await;
    assert_eq!(empty_trash_list_response.status().as_u16(), 200);
    let empty_trash_list_payload = response_json(empty_trash_list_response).await;
    assert_eq!(
        empty_trash_list_payload["items"]
            .as_array()
            .expect("empty trash items array")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_notes_routes_are_served_and_support_content_lifecycle_management() {
    let data_root = unique_temp_path("magic-studio-server-app-notes");
    let app = server_app_with_data_root(&data_root);

    let snapshot_response = call(
        app.clone(),
        empty_request(route_path("appNotesWorkspaceSnapshot")),
    )
    .await;
    assert_eq!(snapshot_response.status().as_u16(), 200);
    let snapshot_payload = response_json(snapshot_response).await;
    assert_eq!(
        snapshot_payload["data"]["notes"]
            .as_array()
            .expect("notes array")
            .len(),
        0
    );
    assert_eq!(
        snapshot_payload["data"]["folders"]
            .as_array()
            .expect("folders array")
            .len(),
        0
    );

    let create_folder_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appNotesCreateFolder"),
            r#"{"name":"Articles"}"#,
        ),
    )
    .await;
    assert_eq!(create_folder_response.status().as_u16(), 200);
    let create_folder_payload = response_json(create_folder_response).await;
    let folder_id = create_folder_payload["data"]["id"]
        .as_str()
        .expect("folder id")
        .to_string();
    assert_eq!(create_folder_payload["data"]["name"], "Articles");

    let create_note_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appNotesCreate"),
            &format!(
                r##"{{"title":"Launch Plan","type":"article","parentId":"{folder_id}","content":"<p>Initial content</p>","tags":["launch","plan"]}}"##
            ),
        ),
    )
    .await;
    assert_eq!(create_note_response.status().as_u16(), 200);
    let create_note_payload = response_json(create_note_response).await;
    let note_id = create_note_payload["data"]["id"]
        .as_str()
        .expect("note id")
        .to_string();
    assert_eq!(create_note_payload["data"]["title"], "Launch Plan");
    assert_eq!(create_note_payload["data"]["parentId"], folder_id.as_str());

    let list_notes_response = call(app.clone(), empty_request(route_path("appNotesList"))).await;
    assert_eq!(list_notes_response.status().as_u16(), 200);
    let list_notes_payload = response_json(list_notes_response).await;
    assert_eq!(
        list_notes_payload["items"]
            .as_array()
            .expect("note items array")
            .len(),
        1
    );

    let read_note_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appNotesRead",
            &[("noteId", note_id.as_str())],
        )),
    )
    .await;
    assert_eq!(read_note_response.status().as_u16(), 200);
    let read_note_payload = response_json(read_note_response).await;
    assert_eq!(
        read_note_payload["data"]["content"],
        "<p>Initial content</p>"
    );

    let update_note_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params("appNotesUpdate", &[("noteId", note_id.as_str())]),
            r##"{"title":"Launch Plan Final","content":"<p>Updated content</p>","isFavorite":true}"##,
        ),
    )
    .await;
    assert_eq!(update_note_response.status().as_u16(), 200);
    let update_note_payload = response_json(update_note_response).await;
    assert_eq!(update_note_payload["data"]["title"], "Launch Plan Final");
    assert_eq!(update_note_payload["data"]["isFavorite"], true);

    let move_note_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params("appNotesMove", &[("noteId", note_id.as_str())]),
            r#"{"targetFolderId":null}"#,
        ),
    )
    .await;
    assert_eq!(move_note_response.status().as_u16(), 200);

    let trash_note_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params("appNotesTrash", &[("noteId", note_id.as_str())]),
            "{}",
        ),
    )
    .await;
    assert_eq!(trash_note_response.status().as_u16(), 200);

    let trashed_notes_response = call(
        app.clone(),
        empty_request(route_path("appNotesListTrashed")),
    )
    .await;
    assert_eq!(trashed_notes_response.status().as_u16(), 200);
    let trashed_notes_payload = response_json(trashed_notes_response).await;
    assert_eq!(
        trashed_notes_payload["items"]
            .as_array()
            .expect("trashed notes array")
            .len(),
        1
    );

    let restore_note_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params("appNotesRestore", &[("noteId", note_id.as_str())]),
            "{}",
        ),
    )
    .await;
    assert_eq!(restore_note_response.status().as_u16(), 200);

    let publish_note_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params("appNotesPublish", &[("noteId", note_id.as_str())]),
            r#"{"platform":"wechat","targetName":"Official Account"}"#,
        ),
    )
    .await;
    assert_eq!(publish_note_response.status().as_u16(), 200);
    let publish_note_payload = response_json(publish_note_response).await;
    assert_eq!(publish_note_payload["data"]["success"], true);
    assert_eq!(publish_note_payload["data"]["platformId"], "wechat");

    let delete_note_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params("appNotesTrash", &[("noteId", note_id.as_str())]),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_note_response.status().as_u16(), 200);

    let clear_trash_response = call(
        app.clone(),
        json_request("POST", route_path("appNotesClearTrash"), "{}"),
    )
    .await;
    assert_eq!(clear_trash_response.status().as_u16(), 200);
    let clear_trash_payload = response_json(clear_trash_response).await;
    assert_eq!(clear_trash_payload["data"]["ok"], true);

    let delete_folder_response = call(
        app,
        json_request(
            "DELETE",
            route_path_with_params("appNotesDeleteFolder", &[("folderId", folder_id.as_str())]),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_folder_response.status().as_u16(), 200);

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_presentations_routes_are_served_and_support_presentation_lifecycle_management() {
    let data_root = unique_temp_path("magic-studio-server-app-presentations");
    let app = server_app_with_data_root(&data_root);

    let empty_list_response = call(
        app.clone(),
        empty_request(route_path("appPresentationsList")),
    )
    .await;
    assert_eq!(empty_list_response.status().as_u16(), 200);
    let empty_list_payload = response_json(empty_list_response).await;
    assert_eq!(
        empty_list_payload["items"]
            .as_array()
            .expect("presentations array")
            .len(),
        0
    );

    let create_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appPresentationsCreate"),
            r##"{"title":"Investor Pitch","theme":"corporate","settings":{"aspectRatio":"16:9","defaultFont":"Inter","primaryColor":"#112233","secondaryColor":"#ddeeff"}}"##,
        ),
    )
    .await;
    assert_eq!(create_response.status().as_u16(), 200);
    let create_payload = response_json(create_response).await;
    let presentation_id = create_payload["data"]["id"]
        .as_str()
        .expect("presentation id")
        .to_string();
    assert_eq!(create_payload["data"]["title"], "Investor Pitch");
    assert_eq!(create_payload["data"]["theme"], "corporate");
    assert_eq!(
        create_payload["data"]["slides"]
            .as_array()
            .expect("slides")
            .len(),
        1
    );

    let read_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appPresentationsRead",
            &[("presentationId", presentation_id.as_str())],
        )),
    )
    .await;
    assert_eq!(read_response.status().as_u16(), 200);
    let read_payload = response_json(read_response).await;
    assert_eq!(read_payload["data"]["settings"]["aspectRatio"], "16:9");

    let update_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appPresentationsUpdate",
                &[("presentationId", presentation_id.as_str())],
            ),
            r##"{"title":"Investor Pitch Final","theme":"minimal","settings":{"aspectRatio":"4:3","defaultFont":"Noto Sans","primaryColor":"#445566","secondaryColor":"#f5f5f5"}}"##,
        ),
    )
    .await;
    assert_eq!(update_response.status().as_u16(), 200);
    let update_payload = response_json(update_response).await;
    assert_eq!(update_payload["data"]["title"], "Investor Pitch Final");
    assert_eq!(update_payload["data"]["theme"], "minimal");
    assert_eq!(update_payload["data"]["settings"]["aspectRatio"], "4:3");

    let create_slide_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appPresentationsCreateSlide",
                &[("presentationId", presentation_id.as_str())],
            ),
            r#"{"layout":"comparison","title":"Comparison Slide","heading":"Current vs Future"}"#,
        ),
    )
    .await;
    assert_eq!(create_slide_response.status().as_u16(), 200);
    let create_slide_payload = response_json(create_slide_response).await;
    let slides = create_slide_payload["data"]["slides"]
        .as_array()
        .expect("presentation slides");
    assert_eq!(slides.len(), 2);
    let slide_id = slides[1]["id"].as_str().expect("slide id").to_string();
    assert_eq!(slides[1]["layout"], "comparison");

    let update_slide_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appPresentationsUpdateSlide",
                &[
                    ("presentationId", presentation_id.as_str()),
                    ("slideId", slide_id.as_str()),
                ],
            ),
            r##"{"title":"Comparison Slide Final","notes":"Discuss roadmap and milestones","layout":"two-column","backgroundColor":"#ffffff","transition":"fade","elements":[{"type":"text","content":"Roadmap","x":10,"y":15,"width":80,"height":20}]}"##,
        ),
    )
    .await;
    assert_eq!(update_slide_response.status().as_u16(), 200);
    let update_slide_payload = response_json(update_slide_response).await;
    let updated_slide = &update_slide_payload["data"]["slides"][1];
    assert_eq!(updated_slide["title"], "Comparison Slide Final");
    assert_eq!(updated_slide["layout"], "two-column");
    assert_eq!(updated_slide["backgroundColor"], "#ffffff");
    assert_eq!(updated_slide["transition"], "fade");
    assert_eq!(
        updated_slide["elements"]
            .as_array()
            .expect("slide elements")
            .len(),
        1
    );

    let delete_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appPresentationsDelete",
                &[("presentationId", presentation_id.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_response.status().as_u16(), 200);
    let delete_payload = response_json(delete_response).await;
    assert_eq!(delete_payload["data"]["ok"], true);

    let final_list_response = call(app, empty_request(route_path("appPresentationsList"))).await;
    assert_eq!(final_list_response.status().as_u16(), 200);
    let final_list_payload = response_json(final_list_response).await;
    assert_eq!(
        final_list_payload["items"]
            .as_array()
            .expect("final presentations array")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_chat_routes_are_served_and_support_chat_session_and_transcript_lifecycle_management() {
    let data_root = unique_temp_path("magic-studio-server-app-chat");
    let app = server_app_with_data_root(&data_root);

    let initial_list_response = call(
        app.clone(),
        empty_request(route_path("appChatListSessions")),
    )
    .await;
    assert_eq!(initial_list_response.status().as_u16(), 200);
    let initial_list_payload = response_json(initial_list_response).await;
    assert_eq!(
        initial_list_payload["items"]
            .as_array()
            .expect("chat sessions array")
            .len(),
        0
    );

    let create_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appChatCreateSession"),
            r#"{"title":"Draft Chat","modelId":"gpt-4o-mini"}"#,
        ),
    )
    .await;
    assert_eq!(create_response.status().as_u16(), 200);
    let create_payload = response_json(create_response).await;
    let session_id = create_payload["data"]["id"]
        .as_str()
        .expect("chat session id")
        .to_string();
    assert_eq!(create_payload["data"]["title"], "Draft Chat");
    assert_eq!(create_payload["data"]["modelId"], "gpt-4o-mini");
    assert_eq!(create_payload["data"]["messageCount"], 0);

    let read_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appChatReadSession",
            &[("sessionId", session_id.as_str())],
        )),
    )
    .await;
    assert_eq!(read_response.status().as_u16(), 200);
    let read_payload = response_json(read_response).await;
    assert_eq!(read_payload["data"]["id"], session_id.as_str());

    let update_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appChatUpdateSession",
                &[("sessionId", session_id.as_str())],
            ),
            r#"{"title":"Creative Review","pinned":true,"summary":"Discuss launch direction"}"#,
        ),
    )
    .await;
    assert_eq!(update_response.status().as_u16(), 200);
    let update_payload = response_json(update_response).await;
    assert_eq!(update_payload["data"]["title"], "Creative Review");
    assert_eq!(update_payload["data"]["pinned"], true);
    assert_eq!(
        update_payload["data"]["summary"],
        "Discuss launch direction"
    );

    let clear_summary_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appChatUpdateSession",
                &[("sessionId", session_id.as_str())],
            ),
            r#"{"summary":null}"#,
        ),
    )
    .await;
    assert_eq!(clear_summary_response.status().as_u16(), 200);
    let clear_summary_payload = response_json(clear_summary_response).await;
    assert!(clear_summary_payload["data"]["summary"].is_null());

    let empty_transcript_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appChatReadTranscript",
            &[("sessionId", session_id.as_str())],
        )),
    )
    .await;
    assert_eq!(empty_transcript_response.status().as_u16(), 200);
    let empty_transcript_payload = response_json(empty_transcript_response).await;
    assert_eq!(
        empty_transcript_payload["data"]["messages"]
            .as_array()
            .expect("chat transcript messages")
            .len(),
        0
    );

    let update_transcript_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path_with_params(
                "appChatUpdateTranscript",
                &[("sessionId", session_id.as_str())],
            ),
            r#"{
                "messages":[
                    {
                        "id":"chat-message-1",
                        "uuid":"client-entity:chat-message-1",
                        "role":"user",
                        "content":"Outline a launch plan",
                        "timestamp":"2026-04-23T12:00:00Z",
                        "status":"completed"
                    },
                    {
                        "id":"chat-message-2",
                        "uuid":"client-entity:chat-message-2",
                        "role":"ai",
                        "content":"Step 1: define goals.",
                        "timestamp":"2026-04-23T12:00:01Z",
                        "model":"gpt-4o-mini",
                        "status":"completed",
                        "metadata":{"tokens":18}
                    }
                ]
            }"#,
        ),
    )
    .await;
    assert_eq!(update_transcript_response.status().as_u16(), 200);
    let update_transcript_payload = response_json(update_transcript_response).await;
    assert_eq!(
        update_transcript_payload["data"]["messages"]
            .as_array()
            .expect("updated transcript messages")
            .len(),
        2
    );

    let persisted_transcript_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appChatReadTranscript",
            &[("sessionId", session_id.as_str())],
        )),
    )
    .await;
    assert_eq!(persisted_transcript_response.status().as_u16(), 200);
    let persisted_transcript_payload = response_json(persisted_transcript_response).await;
    assert_eq!(
        persisted_transcript_payload["data"]["messages"][1]["content"],
        "Step 1: define goals."
    );

    let updated_session_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appChatReadSession",
            &[("sessionId", session_id.as_str())],
        )),
    )
    .await;
    assert_eq!(updated_session_response.status().as_u16(), 200);
    let updated_session_payload = response_json(updated_session_response).await;
    assert_eq!(updated_session_payload["data"]["messageCount"], 2);

    let delete_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appChatDeleteSession",
                &[("sessionId", session_id.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_response.status().as_u16(), 200);
    let delete_payload = response_json(delete_response).await;
    assert_eq!(delete_payload["data"]["ok"], true);

    let final_list_response = call(
        app.clone(),
        empty_request(route_path("appChatListSessions")),
    )
    .await;
    assert_eq!(final_list_response.status().as_u16(), 200);
    let final_list_payload = response_json(final_list_response).await;
    assert_eq!(
        final_list_payload["items"]
            .as_array()
            .expect("final chat sessions array")
            .len(),
        0
    );

    let missing_transcript_response = call(
        app,
        empty_request(route_path_with_params(
            "appChatReadTranscript",
            &[("sessionId", session_id.as_str())],
        )),
    )
    .await;
    assert_eq!(missing_transcript_response.status().as_u16(), 404);

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_creation_preset_routes_are_served_and_support_canonical_creation_preset_lifecycle_management(
) {
    let data_root = unique_temp_path("magic-studio-server-app-creation-presets");
    let app = server_app_with_data_root(&data_root);

    let initial_list_response = call(
        app.clone(),
        empty_request(route_path("appCreationListPresets")),
    )
    .await;
    assert_eq!(initial_list_response.status().as_u16(), 200);
    let initial_list_payload = response_json(initial_list_response).await;
    assert_eq!(
        initial_list_payload["items"]
            .as_array()
            .expect("creation preset items")
            .len(),
        0
    );

    let create_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreatePreset"),
            r#"{
                "name":"Launch Video Favorite",
                "description":"Hero preset",
                "target":"video",
                "workspaceId":"workspace-main",
                "projectId":"project-alpha",
                "prompt":"Cinematic skyline teaser",
                "genMode":"quality",
                "model":"veo-3",
                "styleId":"filmic",
                "aspectRatio":"16:9",
                "resolution":"1080p",
                "duration":"8s",
                "attachments":[
                    {
                        "id":"asset-1",
                        "uuid":"client-entity:asset-1",
                        "name":"Reference Frame",
                        "type":"image",
                        "assetId":"asset-1",
                        "assetUuid":"client-entity:asset-1",
                        "locator":"assets://references/frame-1.png"
                    },
                    {
                        "id":"asset-1",
                        "uuid":"client-entity:asset-1",
                        "name":"Reference Frame",
                        "type":"image",
                        "assetId":"asset-1",
                        "assetUuid":"client-entity:asset-1",
                        "locator":"assets://references/frame-1.png"
                    },
                    {
                        "uuid":"client-entity:script-1",
                        "name":"Creative Direction",
                        "type":"script",
                        "content":"Focus on skyline reflections"
                    }
                ],
                "tags":["Hero","hero","Launch"," launch "],
                "isFavorite":true
            }"#,
        ),
    )
    .await;
    assert_eq!(create_response.status().as_u16(), 200);
    let create_payload = response_json(create_response).await;
    let preset_id = create_payload["data"]["id"]
        .as_str()
        .expect("creation preset id")
        .to_string();
    let preset_uuid = create_payload["data"]["uuid"]
        .as_str()
        .expect("creation preset uuid")
        .to_string();
    assert_eq!(create_payload["data"]["name"], "Launch Video Favorite");
    assert_eq!(create_payload["data"]["target"], "video");
    assert_eq!(create_payload["data"]["workspaceId"], "workspace-main");
    assert_eq!(create_payload["data"]["projectId"], "project-alpha");
    assert_eq!(create_payload["data"]["isFavorite"], true);
    assert_eq!(
        create_payload["data"]["attachments"]
            .as_array()
            .expect("creation preset attachments")
            .len(),
        2
    );
    assert_eq!(
        create_payload["data"]["tags"]
            .as_array()
            .expect("creation preset tags"),
        &vec![
            serde_json::Value::String("Hero".to_string()),
            serde_json::Value::String("Launch".to_string()),
        ]
    );

    let read_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appCreationReadPreset",
            &[("presetId", preset_uuid.as_str())],
        )),
    )
    .await;
    assert_eq!(read_response.status().as_u16(), 200);
    let read_payload = response_json(read_response).await;
    assert_eq!(read_payload["data"]["id"], preset_id.as_str());

    let filtered_list_response = call(
        app.clone(),
        empty_request(format!(
            "{}?favoriteOnly=true&target=video&workspaceId=workspace-main",
            route_path("appCreationListPresets")
        )),
    )
    .await;
    assert_eq!(filtered_list_response.status().as_u16(), 200);
    let filtered_list_payload = response_json(filtered_list_response).await;
    assert_eq!(
        filtered_list_payload["items"]
            .as_array()
            .expect("filtered creation presets")
            .len(),
        1
    );

    let update_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appCreationUpdatePreset",
                &[("presetId", preset_id.as_str())],
            ),
            r#"{
                "name":"Launch Video Final",
                "description":null,
                "projectId":null,
                "prompt":null,
                "genMode":"fast",
                "model":"veo-3-fast",
                "styleId":null,
                "aspectRatio":"9:16",
                "resolution":"4k",
                "duration":"12s",
                "attachments":[],
                "tags":[],
                "isFavorite":false
            }"#,
        ),
    )
    .await;
    assert_eq!(update_response.status().as_u16(), 200);
    let update_payload = response_json(update_response).await;
    assert_eq!(update_payload["data"]["name"], "Launch Video Final");
    assert!(update_payload["data"]["description"].is_null());
    assert!(update_payload["data"]["projectId"].is_null());
    assert!(update_payload["data"]["prompt"].is_null());
    assert!(update_payload["data"]["styleId"].is_null());
    assert_eq!(update_payload["data"]["genMode"], "fast");
    assert_eq!(update_payload["data"]["model"], "veo-3-fast");
    assert_eq!(update_payload["data"]["aspectRatio"], "9:16");
    assert_eq!(update_payload["data"]["resolution"], "4k");
    assert_eq!(update_payload["data"]["duration"], "12s");
    assert_eq!(update_payload["data"]["isFavorite"], false);
    assert_eq!(
        update_payload["data"]["attachments"]
            .as_array()
            .expect("updated creation preset attachments")
            .len(),
        0
    );
    assert_eq!(
        update_payload["data"]["tags"]
            .as_array()
            .expect("updated creation preset tags")
            .len(),
        0
    );

    let delete_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appCreationDeletePreset",
                &[("presetId", preset_uuid.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_response.status().as_u16(), 200);
    let delete_payload = response_json(delete_response).await;
    assert_eq!(delete_payload["data"]["ok"], true);

    let final_list_response = call(app, empty_request(route_path("appCreationListPresets"))).await;
    assert_eq!(final_list_response.status().as_u16(), 200);
    let final_list_payload = response_json(final_list_response).await;
    assert_eq!(
        final_list_payload["items"]
            .as_array()
            .expect("final creation preset items")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_creation_template_routes_are_served_and_support_canonical_creation_template_lifecycle_management(
) {
    let data_root = unique_temp_path("magic-studio-server-app-creation-templates");
    let app = server_app_with_data_root(&data_root);

    let initial_list_response = call(
        app.clone(),
        empty_request(route_path("appCreationListTemplates")),
    )
    .await;
    assert_eq!(initial_list_response.status().as_u16(), 200);
    let initial_list_payload = response_json(initial_list_response).await;
    assert_eq!(
        initial_list_payload["items"]
            .as_array()
            .expect("creation template items")
            .len(),
        0
    );

    let create_preset_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreatePreset"),
            r#"{
                "name":"Launch Video Base",
                "target":"video",
                "workspaceId":"workspace-main",
                "projectId":"project-alpha",
                "prompt":"Preset video prompt",
                "model":"veo-3",
                "styleId":"cinematic",
                "attachments":[
                    {
                        "id":"preset-asset-1",
                        "uuid":"client-entity:preset-asset-1",
                        "name":"Preset Reference",
                        "type":"image",
                        "assetId":"preset-asset-1",
                        "assetUuid":"client-entity:preset-asset-1",
                        "locator":"assets://references/preset-frame.png"
                    }
                ]
            }"#,
        ),
    )
    .await;
    assert_eq!(create_preset_response.status().as_u16(), 200);
    let create_preset_payload = response_json(create_preset_response).await;
    let preset_id = create_preset_payload["data"]["id"]
        .as_str()
        .expect("creation preset id")
        .to_string();

    let create_portal_session_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreateSession"),
            r#"{
                "target":"video",
                "workspaceId":"workspace-main",
                "projectId":"project-alpha",
                "prompt":"Portal Launch Prompt"
            }"#,
        ),
    )
    .await;
    assert_eq!(create_portal_session_response.status().as_u16(), 200);

    let create_template_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreateTemplate"),
            &format!(
                r#"{{
                    "name":"Launch Recipe",
                    "description":"Two-step launch recipe",
                    "primaryTarget":"video",
                    "workspaceId":"workspace-main",
                    "projectId":"project-alpha",
                    "category":"launch",
                    "defaultStepId":"intro",
                    "steps":[
                        {{
                            "id":"intro",
                            "name":"Intro Motion",
                            "target":"video",
                            "presetId":"{preset_id}",
                            "prompt":"Template video prompt",
                            "resolution":"1080p",
                            "duration":"8s",
                            "attachments":[
                                {{
                                    "uuid":"client-entity:script-1",
                                    "name":"Story Beat",
                                    "type":"script",
                                    "content":"Lead with kinetic skyline motion"
                                }}
                            ]
                        }},
                        {{
                            "id":"poster",
                            "name":"Poster Frame",
                            "target":"image",
                            "prompt":"Create a launch poster"
                        }}
                    ],
                    "tags":["Launch","launch"],
                    "isFavorite":true
                }}"#
            ),
        ),
    )
    .await;
    assert_eq!(create_template_response.status().as_u16(), 200);
    let create_template_payload = response_json(create_template_response).await;
    let template_id = create_template_payload["data"]["id"]
        .as_str()
        .expect("creation template id")
        .to_string();
    let template_uuid = create_template_payload["data"]["uuid"]
        .as_str()
        .expect("creation template uuid")
        .to_string();
    assert_eq!(create_template_payload["data"]["name"], "Launch Recipe");
    assert_eq!(create_template_payload["data"]["primaryTarget"], "video");
    assert_eq!(
        create_template_payload["data"]["defaultStepId"],
        "creation-template-step-intro"
    );
    assert_eq!(
        create_template_payload["data"]["steps"]
            .as_array()
            .expect("creation template steps")
            .len(),
        2
    );
    assert_eq!(
        create_template_payload["data"]["tags"]
            .as_array()
            .expect("creation template tags"),
        &vec![serde_json::Value::String("Launch".to_string())]
    );

    let read_template_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appCreationReadTemplate",
            &[("templateId", template_uuid.as_str())],
        )),
    )
    .await;
    assert_eq!(read_template_response.status().as_u16(), 200);
    let read_template_payload = response_json(read_template_response).await;
    assert_eq!(read_template_payload["data"]["id"], template_id.as_str());

    let filtered_list_response = call(
        app.clone(),
        empty_request(format!(
            "{}?favoriteOnly=true&primaryTarget=video&workspaceId=workspace-main&category=launch",
            route_path("appCreationListTemplates")
        )),
    )
    .await;
    assert_eq!(filtered_list_response.status().as_u16(), 200);
    let filtered_list_payload = response_json(filtered_list_response).await;
    assert_eq!(
        filtered_list_payload["items"]
            .as_array()
            .expect("filtered creation templates")
            .len(),
        1
    );

    let apply_template_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appCreationApplyTemplate",
                &[("templateId", template_id.as_str())],
            ),
            r#"{
                "projectId":"project-runtime",
                "prompt":"Runtime Prompt",
                "styleId":null,
                "attachments":[]
            }"#,
        ),
    )
    .await;
    assert_eq!(apply_template_response.status().as_u16(), 200);
    let apply_template_payload = response_json(apply_template_response).await;
    assert_eq!(
        apply_template_payload["data"]["source"],
        "creation-template"
    );
    assert_eq!(apply_template_payload["data"]["target"], "video");
    assert_eq!(apply_template_payload["data"]["prompt"], "Runtime Prompt");
    assert_eq!(apply_template_payload["data"]["model"], "veo-3");
    assert!(apply_template_payload["data"]["styleId"].is_null());
    assert_eq!(apply_template_payload["data"]["resolution"], "1080p");
    assert_eq!(apply_template_payload["data"]["duration"], "8s");
    assert_eq!(
        apply_template_payload["data"]["workspaceId"],
        "workspace-main"
    );
    assert_eq!(
        apply_template_payload["data"]["projectId"],
        "project-runtime"
    );
    assert_eq!(
        apply_template_payload["data"]["attachments"]
            .as_array()
            .expect("applied session attachments")
            .len(),
        0
    );

    let current_session_response = call(
        app.clone(),
        empty_request(format!(
            "{}?target=video&workspaceId=workspace-main&projectId=project-runtime",
            route_path("appCreationReadCurrentSession")
        )),
    )
    .await;
    assert_eq!(current_session_response.status().as_u16(), 200);
    let current_session_payload = response_json(current_session_response).await;
    assert_eq!(
        current_session_payload["data"]["session"]["source"],
        "creation-template"
    );
    assert_eq!(
        current_session_payload["data"]["session"]["prompt"],
        "Runtime Prompt"
    );

    let update_template_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appCreationUpdateTemplate",
                &[("templateId", template_id.as_str())],
            ),
            r#"{
                "name":"Launch Recipe Final",
                "description":null,
                "primaryTarget":"image",
                "category":null,
                "defaultStepId":null,
                "steps":[
                    {
                        "id":"poster-final",
                        "name":"Poster Final",
                        "target":"image",
                        "prompt":"Hero poster final",
                        "aspectRatio":"1:1"
                    }
                ],
                "tags":[],
                "isFavorite":false
            }"#,
        ),
    )
    .await;
    assert_eq!(update_template_response.status().as_u16(), 200);
    let update_template_payload = response_json(update_template_response).await;
    assert_eq!(
        update_template_payload["data"]["name"],
        "Launch Recipe Final"
    );
    assert!(update_template_payload["data"]["description"].is_null());
    assert_eq!(update_template_payload["data"]["primaryTarget"], "image");
    assert!(update_template_payload["data"]["category"].is_null());
    assert_eq!(
        update_template_payload["data"]["defaultStepId"],
        "creation-template-step-poster-final"
    );
    assert_eq!(
        update_template_payload["data"]["steps"]
            .as_array()
            .expect("updated creation template steps")
            .len(),
        1
    );
    assert_eq!(
        update_template_payload["data"]["tags"]
            .as_array()
            .expect("updated creation template tags")
            .len(),
        0
    );
    assert_eq!(update_template_payload["data"]["isFavorite"], false);

    let delete_template_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appCreationDeleteTemplate",
                &[("templateId", template_uuid.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_template_response.status().as_u16(), 200);
    let delete_template_payload = response_json(delete_template_response).await;
    assert_eq!(delete_template_payload["data"]["ok"], true);

    let final_list_response =
        call(app, empty_request(route_path("appCreationListTemplates"))).await;
    assert_eq!(final_list_response.status().as_u16(), 200);
    let final_list_payload = response_json(final_list_response).await;
    assert_eq!(
        final_list_payload["items"]
            .as_array()
            .expect("final creation template items")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_creation_batch_routes_are_served_and_support_canonical_creation_batch_orchestration() {
    let data_root = unique_temp_path("magic-studio-server-app-creation-batches");
    let app = server_app_with_data_root(&data_root);

    let create_preset_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreatePreset"),
            r#"{
                "name":"Batch Video Base",
                "target":"video",
                "workspaceId":"workspace-main",
                "prompt":"Preset base prompt",
                "model":"veo-3"
            }"#,
        ),
    )
    .await;
    assert_eq!(create_preset_response.status().as_u16(), 200);
    let create_preset_payload = response_json(create_preset_response).await;
    let preset_id = create_preset_payload["data"]["id"]
        .as_str()
        .expect("creation preset id")
        .to_string();

    let create_template_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreateTemplate"),
            &format!(
                r#"{{
                    "name":"Batch Recipe",
                    "primaryTarget":"video",
                    "workspaceId":"workspace-main",
                    "defaultStepId":"launch-shot",
                    "steps":[
                        {{
                            "id":"launch-shot",
                            "name":"Launch Shot",
                            "target":"video",
                            "presetId":"{preset_id}",
                            "prompt":"Template step prompt",
                            "resolution":"1080p"
                        }}
                    ]
                }}"#
            ),
        ),
    )
    .await;
    assert_eq!(create_template_response.status().as_u16(), 200);
    let create_template_payload = response_json(create_template_response).await;
    let template_uuid = create_template_payload["data"]["uuid"]
        .as_str()
        .expect("creation template uuid")
        .to_string();

    let create_batch_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appCreationCreateBatch"),
            &format!(
                r#"{{
                    "name":"Launch Campaign",
                    "description":"Video batch",
                    "target":"video",
                    "templateId":"{template_uuid}",
                    "workspaceId":"workspace-main",
                    "projectId":"project-batch",
                    "status":"ready",
                    "items":[
                        {{
                            "id":"hero-cut",
                            "name":"Hero Cut",
                            "prompt":"Item prompt",
                            "attachments":[
                                {{
                                    "uuid":"client-entity:script-1",
                                    "name":"Direction",
                                    "type":"script",
                                    "content":"Keep the camera motion confident"
                                }}
                            ]
                        }}
                    ],
                    "tags":["launch","Launch"],
                    "isFavorite":true
                }}"#
            ),
        ),
    )
    .await;
    assert_eq!(create_batch_response.status().as_u16(), 200);
    let create_batch_payload = response_json(create_batch_response).await;
    let batch_id = create_batch_payload["data"]["id"]
        .as_str()
        .expect("creation batch id")
        .to_string();
    let batch_uuid = create_batch_payload["data"]["uuid"]
        .as_str()
        .expect("creation batch uuid")
        .to_string();
    let item_id = create_batch_payload["data"]["items"][0]["id"]
        .as_str()
        .expect("creation batch item id")
        .to_string();
    assert_eq!(create_batch_payload["data"]["status"], "ready");
    assert_eq!(create_batch_payload["data"]["sourceKind"], "template");
    assert_eq!(create_batch_payload["data"]["progress"]["total"], 1);
    assert_eq!(create_batch_payload["data"]["tags"][0], "launch");

    let list_batch_response = call(
        app.clone(),
        empty_request(format!(
            "{}?favoriteOnly=true&workspaceId=workspace-main&status=ready",
            route_path("appCreationListBatches")
        )),
    )
    .await;
    assert_eq!(list_batch_response.status().as_u16(), 200);
    let list_batch_payload = response_json(list_batch_response).await;
    assert_eq!(
        list_batch_payload["items"]
            .as_array()
            .expect("creation batch list")
            .len(),
        1
    );

    let read_batch_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appCreationReadBatch",
            &[("batchId", batch_uuid.as_str())],
        )),
    )
    .await;
    assert_eq!(read_batch_response.status().as_u16(), 200);
    let read_batch_payload = response_json(read_batch_response).await;
    assert_eq!(read_batch_payload["data"]["id"], batch_id.as_str());

    let update_batch_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params("appCreationUpdateBatch", &[("batchId", batch_id.as_str())]),
            r#"{
                "name":"Launch Campaign Final",
                "description":null,
                "tags":["hero"],
                "isFavorite":false
            }"#,
        ),
    )
    .await;
    assert_eq!(update_batch_response.status().as_u16(), 200);
    let update_batch_payload = response_json(update_batch_response).await;
    assert_eq!(
        update_batch_payload["data"]["name"],
        "Launch Campaign Final"
    );
    assert!(update_batch_payload["data"]["description"].is_null());
    assert_eq!(update_batch_payload["data"]["isFavorite"], false);
    assert_eq!(update_batch_payload["data"]["tags"][0], "hero");

    let materialize_batch_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appCreationMaterializeBatch",
                &[("batchId", batch_id.as_str())],
            ),
            r#"{
                "itemId":"creation-batch-item-hero-cut",
                "projectId":"project-runtime",
                "prompt":"Runtime batch prompt"
            }"#,
        ),
    )
    .await;
    assert_eq!(materialize_batch_response.status().as_u16(), 200);
    let materialize_batch_payload = response_json(materialize_batch_response).await;
    assert_eq!(
        materialize_batch_payload["data"]["session"]["source"],
        "creation-batch"
    );
    assert_eq!(
        materialize_batch_payload["data"]["session"]["prompt"],
        "Runtime batch prompt"
    );
    assert_eq!(
        materialize_batch_payload["data"]["session"]["model"],
        "veo-3"
    );
    assert_eq!(
        materialize_batch_payload["data"]["session"]["resolution"],
        "1080p"
    );
    assert_eq!(
        materialize_batch_payload["data"]["item"]["status"],
        "materialized"
    );
    assert_eq!(
        materialize_batch_payload["data"]["batch"]["status"],
        "running"
    );

    let current_session_response = call(
        app.clone(),
        empty_request(format!(
            "{}?target=video&workspaceId=workspace-main&projectId=project-runtime",
            route_path("appCreationReadCurrentSession")
        )),
    )
    .await;
    assert_eq!(current_session_response.status().as_u16(), 200);
    let current_session_payload = response_json(current_session_response).await;
    assert_eq!(
        current_session_payload["data"]["session"]["source"],
        "creation-batch"
    );

    let update_item_status_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appCreationUpdateBatchItemStatus",
                &[("batchId", batch_id.as_str()), ("itemId", item_id.as_str())],
            ),
            r#"{"status":"completed"}"#,
        ),
    )
    .await;
    assert_eq!(update_item_status_response.status().as_u16(), 200);
    let update_item_status_payload = response_json(update_item_status_response).await;
    assert_eq!(
        update_item_status_payload["data"]["items"][0]["status"],
        "completed"
    );
    assert_eq!(update_item_status_payload["data"]["status"], "completed");
    assert_eq!(
        update_item_status_payload["data"]["progress"]["completed"],
        1
    );

    let delete_batch_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appCreationDeleteBatch",
                &[("batchId", batch_uuid.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_batch_response.status().as_u16(), 200);
    let delete_batch_payload = response_json(delete_batch_response).await;
    assert_eq!(delete_batch_payload["data"]["ok"], true);

    let final_batch_list_response =
        call(app, empty_request(route_path("appCreationListBatches"))).await;
    assert_eq!(final_batch_list_response.status().as_u16(), 200);
    let final_batch_list_payload = response_json(final_batch_list_response).await;
    assert_eq!(
        final_batch_list_payload["items"]
            .as_array()
            .expect("final creation batch list")
            .len(),
        0
    );

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_auth_and_user_routes_are_served_and_support_identity_lifecycle_management() {
    let data_root = unique_temp_path("magic-studio-server-app-identity");
    let app = server_app_with_data_root(&data_root);

    let read_session_response =
        call(app.clone(), empty_request(route_path("appAuthReadSession"))).await;
    assert_eq!(read_session_response.status().as_u16(), 200);
    let read_session_payload = response_json(read_session_response).await;
    assert_eq!(read_session_payload["data"]["isAuthenticated"], false);
    assert!(read_session_payload["data"]["session"].is_null());

    let send_code_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthSendVerifyCode"),
            r#"{"verifyType":"EMAIL","target":"alice@example.com","scene":"REGISTER"}"#,
        ),
    )
    .await;
    assert_eq!(send_code_response.status().as_u16(), 200);

    let check_code_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthCheckVerifyCode"),
            r#"{"verifyType":"EMAIL","target":"alice@example.com","scene":"REGISTER","code":"246810"}"#,
        ),
    )
    .await;
    assert_eq!(check_code_response.status().as_u16(), 200);
    let check_code_payload = response_json(check_code_response).await;
    assert_eq!(check_code_payload["data"]["valid"], true);

    let register_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthRegister"),
            r#"{"username":"alice","password":"initial-pass","confirmPassword":"initial-pass","email":"alice@example.com","verificationCode":"246810"}"#,
        ),
    )
    .await;
    assert_eq!(register_response.status().as_u16(), 200);
    let register_payload = response_json(register_response).await;
    let refresh_token = register_payload["data"]["refreshToken"]
        .as_str()
        .expect("refresh token")
        .to_string();
    assert_eq!(register_payload["data"]["user"]["username"], "alice");

    let profile_response = call(app.clone(), empty_request(route_path("appUserReadProfile"))).await;
    assert_eq!(profile_response.status().as_u16(), 200);
    let profile_payload = response_json(profile_response).await;
    assert_eq!(profile_payload["data"]["email"], "alice@example.com");

    let update_profile_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path("appUserUpdateProfile"),
            r#"{"nickname":"Alice","bio":"Creator","region":"Shanghai"}"#,
        ),
    )
    .await;
    assert_eq!(update_profile_response.status().as_u16(), 200);
    let update_profile_payload = response_json(update_profile_response).await;
    assert_eq!(update_profile_payload["data"]["nickname"], "Alice");
    assert_eq!(update_profile_payload["data"]["region"], "Shanghai");

    let upload_avatar_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appUserUploadAvatar"),
            r#"{"file":"data:image/png;base64,ZmFrZS1hdmF0YXI="}"#,
        ),
    )
    .await;
    assert_eq!(upload_avatar_response.status().as_u16(), 200);
    let upload_avatar_payload = response_json(upload_avatar_response).await;
    assert_eq!(
        upload_avatar_payload["data"]["avatarUrl"],
        "data:image/png;base64,ZmFrZS1hdmF0YXI="
    );

    let read_settings_response = call(
        app.clone(),
        empty_request(route_path("appUserReadSettings")),
    )
    .await;
    assert_eq!(read_settings_response.status().as_u16(), 200);
    let read_settings_payload = response_json(read_settings_response).await;
    assert_eq!(read_settings_payload["data"]["theme"], "system");

    let update_settings_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path("appUserUpdateSettings"),
            r#"{"language":"zh-CN","theme":"dark","general":{"launchOnStartup":true},"security":{"loginAlerts":false}}"#,
        ),
    )
    .await;
    assert_eq!(update_settings_response.status().as_u16(), 200);
    let update_settings_payload = response_json(update_settings_response).await;
    assert_eq!(update_settings_payload["data"]["language"], "zh-CN");
    assert_eq!(update_settings_payload["data"]["theme"], "dark");
    assert_eq!(
        update_settings_payload["data"]["general"]["launchOnStartup"],
        true
    );
    assert_eq!(
        update_settings_payload["data"]["security"]["loginAlerts"],
        false
    );
    assert_eq!(
        update_settings_payload["data"]["security"]["twoFactorAuth"],
        false
    );

    let login_history_response = call(
        app.clone(),
        empty_request(route_path("appUserReadLoginHistory")),
    )
    .await;
    assert_eq!(login_history_response.status().as_u16(), 200);
    let login_history_payload = response_json(login_history_response).await;
    assert_eq!(login_history_payload["items"][0]["authMethod"], "register");

    let generation_history_response = call(
        app.clone(),
        empty_request(route_path("appUserReadGenerationHistory")),
    )
    .await;
    assert_eq!(generation_history_response.status().as_u16(), 200);
    let generation_history_payload = response_json(generation_history_response).await;
    assert_eq!(
        generation_history_payload["items"]
            .as_array()
            .expect("generation history array")
            .len(),
        0
    );

    let initial_bindings_response = call(
        app.clone(),
        empty_request(route_path("appUserListBindings")),
    )
    .await;
    assert_eq!(initial_bindings_response.status().as_u16(), 200);
    let initial_bindings_payload = response_json(initial_bindings_response).await;
    assert_eq!(initial_bindings_payload["items"][0]["platform"], "email");

    let create_address_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appUserCreateAddress"),
            r#"{"name":"Alice","phone":"18800001111","addressDetail":"Lane 88","cityCode":"SH","districtCode":"PD"}"#,
        ),
    )
    .await;
    assert_eq!(create_address_response.status().as_u16(), 200);
    let create_address_payload = response_json(create_address_response).await;
    let primary_address_id = create_address_payload["data"]["id"]
        .as_str()
        .expect("primary address id")
        .to_string();
    assert_eq!(create_address_payload["data"]["isDefault"], true);

    let read_default_address_response = call(
        app.clone(),
        empty_request(route_path("appUserReadDefaultAddress")),
    )
    .await;
    assert_eq!(read_default_address_response.status().as_u16(), 200);
    let read_default_address_payload = response_json(read_default_address_response).await;
    assert_eq!(
        read_default_address_payload["data"]["id"],
        primary_address_id.as_str()
    );

    let create_second_address_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appUserCreateAddress"),
            r#"{"name":"Alice Office","phone":"18800002222","addressDetail":"Road 18","cityCode":"SH","districtCode":"XH","postalCode":"200030"}"#,
        ),
    )
    .await;
    assert_eq!(create_second_address_response.status().as_u16(), 200);
    let create_second_address_payload = response_json(create_second_address_response).await;
    let second_address_id = create_second_address_payload["data"]["id"]
        .as_str()
        .expect("second address id")
        .to_string();

    let set_default_address_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appUserSetDefaultAddress",
                &[("addressId", second_address_id.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(set_default_address_response.status().as_u16(), 200);
    let set_default_address_payload = response_json(set_default_address_response).await;
    assert_eq!(
        set_default_address_payload["data"]["id"],
        second_address_id.as_str()
    );
    assert_eq!(set_default_address_payload["data"]["isDefault"], true);

    let update_address_response = call(
        app.clone(),
        json_request(
            "PATCH",
            route_path_with_params(
                "appUserUpdateAddress",
                &[("addressId", second_address_id.as_str())],
            ),
            r#"{"addressDetail":"Road 18 Tower A","postalCode":"200031"}"#,
        ),
    )
    .await;
    assert_eq!(update_address_response.status().as_u16(), 200);
    let update_address_payload = response_json(update_address_response).await;
    assert_eq!(
        update_address_payload["data"]["addressDetail"],
        "Road 18 Tower A"
    );
    assert_eq!(update_address_payload["data"]["postalCode"], "200031");

    let list_addresses_response = call(
        app.clone(),
        empty_request(route_path("appUserListAddresses")),
    )
    .await;
    assert_eq!(list_addresses_response.status().as_u16(), 200);
    let list_addresses_payload = response_json(list_addresses_response).await;
    assert_eq!(
        list_addresses_payload["items"]
            .as_array()
            .expect("address list array")
            .len(),
        2
    );
    assert_eq!(
        list_addresses_payload["items"][1]["id"],
        second_address_id.as_str()
    );
    assert_eq!(list_addresses_payload["items"][1]["isDefault"], true);

    let delete_primary_address_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params(
                "appUserDeleteAddress",
                &[("addressId", primary_address_id.as_str())],
            ),
            "{}",
        ),
    )
    .await;
    assert_eq!(delete_primary_address_response.status().as_u16(), 200);

    let send_bind_phone_code_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthSendVerifyCode"),
            r#"{"verifyType":"PHONE","target":"18800001111","scene":"BIND_PHONE"}"#,
        ),
    )
    .await;
    assert_eq!(send_bind_phone_code_response.status().as_u16(), 200);

    let bind_phone_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appUserBindPhone"),
            r#"{"phone":"18800001111","verificationCode":"246810"}"#,
        ),
    )
    .await;
    assert_eq!(bind_phone_response.status().as_u16(), 200);
    let bind_phone_payload = response_json(bind_phone_response).await;
    assert_eq!(bind_phone_payload["data"]["phone"], "18800001111");

    let bind_third_party_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path_with_params(
                "appUserBindThirdParty",
                &[("platform", "wechat")],
            ),
            r#"{"code":"oauth-code","state":"oauth-state","thirdPartyUserId":"wechat-alice","thirdPartyUserName":"Alice WX","thirdPartyAvatar":"https://example.com/avatar.png"}"#,
        ),
    )
    .await;
    assert_eq!(bind_third_party_response.status().as_u16(), 200);
    let bind_third_party_payload = response_json(bind_third_party_response).await;
    assert_eq!(bind_third_party_payload["data"]["platform"], "wechat");

    let bindings_after_bind_response = call(
        app.clone(),
        empty_request(route_path("appUserListBindings")),
    )
    .await;
    assert_eq!(bindings_after_bind_response.status().as_u16(), 200);
    let bindings_after_bind_payload = response_json(bindings_after_bind_response).await;
    assert_eq!(
        bindings_after_bind_payload["items"]
            .as_array()
            .expect("binding list array")
            .len(),
        3
    );

    let unbind_email_response = call(
        app.clone(),
        json_request("DELETE", route_path("appUserUnbindEmail"), "{}"),
    )
    .await;
    assert_eq!(unbind_email_response.status().as_u16(), 200);
    let unbind_email_payload = response_json(unbind_email_response).await;
    assert!(unbind_email_payload["data"]["email"].is_null());

    let send_bind_email_code_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthSendVerifyCode"),
            r#"{"verifyType":"EMAIL","target":"alice@example.com","scene":"BIND_EMAIL"}"#,
        ),
    )
    .await;
    assert_eq!(send_bind_email_code_response.status().as_u16(), 200);

    let bind_email_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appUserBindEmail"),
            r#"{"email":"alice@example.com","verificationCode":"246810"}"#,
        ),
    )
    .await;
    assert_eq!(bind_email_response.status().as_u16(), 200);
    let bind_email_payload = response_json(bind_email_response).await;
    assert_eq!(bind_email_payload["data"]["email"], "alice@example.com");

    let unbind_third_party_response = call(
        app.clone(),
        json_request(
            "DELETE",
            route_path_with_params("appUserUnbindThirdParty", &[("platform", "wechat")]),
            "{}",
        ),
    )
    .await;
    assert_eq!(unbind_third_party_response.status().as_u16(), 200);

    let change_password_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appUserChangePassword"),
            r#"{"oldPassword":"initial-pass","newPassword":"next-pass","confirmPassword":"next-pass"}"#,
        ),
    )
    .await;
    assert_eq!(change_password_response.status().as_u16(), 200);

    let logout_response = call(
        app.clone(),
        json_request("POST", route_path("appAuthLogout"), "{}"),
    )
    .await;
    assert_eq!(logout_response.status().as_u16(), 200);

    let reset_request_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthRequestPasswordReset"),
            r#"{"account":"alice@example.com","channel":"EMAIL"}"#,
        ),
    )
    .await;
    assert_eq!(reset_request_response.status().as_u16(), 200);

    let reset_password_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthResetPassword"),
            r#"{"account":"alice@example.com","code":"246810","newPassword":"reset-pass","confirmPassword":"reset-pass"}"#,
        ),
    )
    .await;
    assert_eq!(reset_password_response.status().as_u16(), 200);

    let login_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthLogin"),
            r#"{"username":"alice","password":"reset-pass","deviceType":"web"}"#,
        ),
    )
    .await;
    assert_eq!(login_response.status().as_u16(), 200);
    let login_payload = response_json(login_response).await;
    assert_eq!(login_payload["data"]["user"]["displayName"], "Alice");

    let web_session_response = call(
        app.clone(),
        empty_request(route_path("appUserListSessions")),
    )
    .await;
    assert_eq!(web_session_response.status().as_u16(), 200);
    let web_session_payload = response_json(web_session_response).await;
    assert_eq!(web_session_payload["items"][0]["clientKind"], "web");

    let web_login_history_response = call(
        app.clone(),
        empty_request(route_path("appUserReadLoginHistory")),
    )
    .await;
    assert_eq!(web_login_history_response.status().as_u16(), 200);
    let web_login_history_payload = response_json(web_login_history_response).await;
    assert_eq!(web_login_history_payload["items"][0]["authMethod"], "password");
    assert_eq!(web_login_history_payload["items"][0]["clientKind"], "web");

    let refresh_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthRefreshToken"),
            &format!(r#"{{"refreshToken":"{refresh_token}"}}"#),
        ),
    )
    .await;
    assert_eq!(refresh_response.status().as_u16(), 403);

    let refreshed_login_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthLogin"),
            r#"{"username":"alice","password":"reset-pass"}"#,
        ),
    )
    .await;
    assert_eq!(refreshed_login_response.status().as_u16(), 200);
    let refreshed_login_payload = response_json(refreshed_login_response).await;
    let next_refresh_token = refreshed_login_payload["data"]["refreshToken"]
        .as_str()
        .expect("next refresh token");

    let refresh_success_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthRefreshToken"),
            &format!(r#"{{"refreshToken":"{next_refresh_token}"}}"#),
        ),
    )
    .await;
    assert_eq!(refresh_success_response.status().as_u16(), 200);
    let refresh_success_payload = response_json(refresh_success_response).await;
    assert!(refresh_success_payload["data"]["authToken"].is_string());

    let create_qr_response = call(
        app.clone(),
        json_request("POST", route_path("appAuthCreateQrCode"), "{}"),
    )
    .await;
    assert_eq!(create_qr_response.status().as_u16(), 200);
    let create_qr_payload = response_json(create_qr_response).await;
    let qr_key = create_qr_payload["data"]["qrKey"].as_str().expect("qr key");

    let read_qr_response = call(
        app.clone(),
        empty_request(route_path_with_params(
            "appAuthReadQrCodeStatus",
            &[("qrKey", qr_key)],
        )),
    )
    .await;
    assert_eq!(read_qr_response.status().as_u16(), 200);
    let read_qr_payload = response_json(read_qr_response).await;
    assert_eq!(read_qr_payload["data"]["status"], "confirmed");

    let final_session_response = call(app, empty_request(route_path("appAuthReadSession"))).await;
    assert_eq!(final_session_response.status().as_u16(), 200);
    let final_session_payload = response_json(final_session_response).await;
    assert_eq!(final_session_payload["data"]["isAuthenticated"], true);

    let _ = std::fs::remove_dir_all(&data_root);
}

#[tokio::test]
async fn app_user_settings_route_rejects_two_factor_auth_mutation_outside_dedicated_flow() {
    let data_root = unique_temp_path("magic-studio-server-app-identity-settings");
    let app = server_app_with_data_root(&data_root);

    let send_code_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthSendVerifyCode"),
            r#"{"verifyType":"EMAIL","target":"alice@example.com","scene":"REGISTER"}"#,
        ),
    )
    .await;
    assert_eq!(send_code_response.status().as_u16(), 200);

    let register_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("appAuthRegister"),
            r#"{"username":"alice","password":"initial-pass","confirmPassword":"initial-pass","email":"alice@example.com","verificationCode":"246810"}"#,
        ),
    )
    .await;
    assert_eq!(register_response.status().as_u16(), 200);

    let update_settings_response = call(
        app.clone(),
        json_request(
            "PUT",
            route_path("appUserUpdateSettings"),
            r#"{"security":{"twoFactorAuth":true}}"#,
        ),
    )
    .await;
    assert_eq!(update_settings_response.status().as_u16(), 422);

    let _ = std::fs::remove_dir_all(&data_root);
}
