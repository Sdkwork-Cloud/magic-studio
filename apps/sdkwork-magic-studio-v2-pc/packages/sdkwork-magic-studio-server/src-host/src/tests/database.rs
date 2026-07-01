use std::fs;

use super::support::*;

#[tokio::test]
async fn database_execute_and_query_routes_are_served() {
    let app = server_app();
    let db_path = unique_temp_path("magic-studio-server-route").with_extension("db");
    let db_path_json = json_string(&db_path);

    let execute_batch_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreDatabaseSqliteExecuteBatch"),
            format!(
                r#"{{"dbPath":{db_path_json},"sqlBatch":"CREATE TABLE IF NOT EXISTS demo (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO demo(value) VALUES ('ok');"}}"#
            ),
        ),
    )
    .await;
    assert_eq!(execute_batch_response.status().as_u16(), 200);

    let query_response = call(
        app.clone(),
        json_request(
            "POST",
            route_path("coreDatabaseSqliteQuery"),
            format!(r#"{{"dbPath":{db_path_json},"sql":"SELECT value FROM demo","params":[]}}"#),
        ),
    )
    .await;
    assert_eq!(query_response.status().as_u16(), 200);

    let execute_response = call(
        app,
        json_request(
            "POST",
            route_path("coreDatabaseSqliteExecute"),
            format!(
                r#"{{"dbPath":{db_path_json},"sql":"INSERT INTO demo(value) VALUES (?)","params":["next"]}}"#
            ),
        ),
    )
    .await;
    assert_eq!(execute_response.status().as_u16(), 200);

    let _ = fs::remove_file(&db_path);
}
