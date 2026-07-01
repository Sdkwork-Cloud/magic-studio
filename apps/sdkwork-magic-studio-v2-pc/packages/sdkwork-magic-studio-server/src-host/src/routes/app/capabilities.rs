use axum::extract::State;
use axum::Json;

use crate::response::{list, success, ServerResult};
use crate::state::AppState;

pub async fn read_capability_summary(
    State(state): State<AppState>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::capabilities::AppCapabilitySummaryRecord>>,
> {
    Ok(success(state.capability_service.read_summary()?))
}

pub async fn list_capability_domains(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiList<crate::services::capabilities::AppCapabilityDomainRecord>,
    >,
> {
    Ok(list(state.capability_service.list_domains()?))
}

pub async fn list_execution_capabilities(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::capabilities::AppExecutionCapabilityRecord,
        >,
    >,
> {
    Ok(list(
        state.capability_service.list_execution_capabilities()?,
    ))
}
