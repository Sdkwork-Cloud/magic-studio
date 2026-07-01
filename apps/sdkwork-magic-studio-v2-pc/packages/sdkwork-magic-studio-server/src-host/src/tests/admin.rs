use super::support::*;

#[tokio::test]
async fn admin_deployments_route_reports_server_family() {
    let response = call(
        server_app(),
        empty_request(route_path("adminDeploymentsList")),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["items"][0]["family"], "server");
    assert_eq!(payload["items"][0]["channel"], "local");
    assert_eq!(payload["items"][0]["status"], "active");
    assert_eq!(payload["items"][0]["openApiVersion"], "3.1.0");
    assert!(payload["items"][0]["checksum"].is_null());
}

#[tokio::test]
async fn admin_deployments_route_reports_desktop_family_for_desktop_state() {
    let response = call(
        desktop_app(),
        empty_request(route_path("adminDeploymentsList")),
    )
    .await;

    assert_eq!(response.status().as_u16(), 200);

    let payload = response_json(response).await;
    assert_eq!(payload["items"][0]["family"], "desktop");
}
