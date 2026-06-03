use super::support::*;

#[tokio::test]
async fn docs_route_is_served() {
    let route_contract = contract();
    let response = call(server_app(), empty_request(route_contract.meta.docs_path)).await;

    assert_eq!(response.status().as_u16(), 200);
}
