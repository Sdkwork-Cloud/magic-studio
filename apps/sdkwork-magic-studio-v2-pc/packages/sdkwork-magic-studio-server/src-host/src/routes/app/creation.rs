use axum::extract::{Json as RequestJson, Path, Query, State};
use axum::Json;
use serde_json::json;

use crate::response::{list_with_pagination, accepted, success, ServerResult};
use crate::services::creation::{
    CreateCreationSessionRequest, CreationCapabilitiesQuery, CreationSessionQuery,
};
use crate::services::creation_batches::{
    CreateCreationBatchRequest, CreationBatchListQuery, MaterializeCreationBatchRequest,
    UpdateCreationBatchItemStatusRequest, UpdateCreationBatchRequest,
};
use crate::services::creation_history::{
    CreationHistoryFavoriteRequest, CreationHistoryListQuery, UpsertCreationHistoryEntryRequest,
};
use crate::services::creation_presets::{
    CreateCreationPresetRequest, CreationPresetListQuery, UpdateCreationPresetRequest,
};
use crate::services::creation_templates::{
    ApplyCreationTemplateRequest, CreateCreationTemplateRequest, CreationTemplateListQuery,
    UpdateCreationTemplateRequest,
};
use crate::state::AppState;

pub async fn read_creation_capabilities(
    State(state): State<AppState>,
    Query(query): Query<CreationCapabilitiesQuery>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation::CreationCapabilitiesRecord>>,
> {
    Ok(success(state.creation_service.read_capabilities(query)?))
}

pub async fn create_creation_session(
    State(state): State<AppState>,
    RequestJson(payload): RequestJson<CreateCreationSessionRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation::CreationSessionRecord>>,
> {
    Ok(success(state.creation_service.create_session(payload)?))
}

pub async fn list_creation_presets(
    State(state): State<AppState>,
    Query(query): Query<CreationPresetListQuery>,
) -> ServerResult<
    Json<crate::response::ApiList<crate::services::creation_presets::CreationPresetRecord>>,
> {
    let page = state.creation_preset_service.list_presets(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn list_creation_batches(
    State(state): State<AppState>,
    Query(query): Query<CreationBatchListQuery>,
) -> ServerResult<
    Json<crate::response::ApiList<crate::services::creation_batches::CreationBatchRecord>>,
> {
    let page = state.creation_batch_service.list_batches(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn create_creation_batch(
    State(state): State<AppState>,
    RequestJson(payload): RequestJson<CreateCreationBatchRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_batches::CreationBatchRecord>>,
> {
    Ok(success(state.creation_batch_service.create_batch(payload)?))
}

pub async fn read_creation_batch(
    State(state): State<AppState>,
    Path(batch_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_batches::CreationBatchRecord>>,
> {
    Ok(success(state.creation_batch_service.read_batch(&batch_id)?))
}

pub async fn update_creation_batch(
    State(state): State<AppState>,
    Path(batch_id): Path<String>,
    RequestJson(payload): RequestJson<UpdateCreationBatchRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_batches::CreationBatchRecord>>,
> {
    Ok(success(
        state
            .creation_batch_service
            .update_batch(&batch_id, payload)?,
    ))
}

pub async fn delete_creation_batch(
    State(state): State<AppState>,
    Path(batch_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.creation_batch_service.delete_batch(&batch_id)?;
    Ok(accepted())
}

pub async fn materialize_creation_batch(
    State(state): State<AppState>,
    Path(batch_id): Path<String>,
    RequestJson(payload): RequestJson<MaterializeCreationBatchRequest>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<
            crate::services::creation_batches::CreationBatchMaterializationRecord,
        >,
    >,
> {
    Ok(success(
        state
            .creation_batch_service
            .materialize_batch(&batch_id, payload)?,
    ))
}

pub async fn update_creation_batch_item_status(
    State(state): State<AppState>,
    Path((batch_id, item_id)): Path<(String, String)>,
    RequestJson(payload): RequestJson<UpdateCreationBatchItemStatusRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_batches::CreationBatchRecord>>,
> {
    Ok(success(
        state
            .creation_batch_service
            .update_batch_item_status(&batch_id, &item_id, payload)?,
    ))
}

pub async fn create_creation_preset(
    State(state): State<AppState>,
    RequestJson(payload): RequestJson<CreateCreationPresetRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_presets::CreationPresetRecord>>,
> {
    Ok(success(
        state.creation_preset_service.create_preset(payload)?,
    ))
}

pub async fn read_creation_preset(
    State(state): State<AppState>,
    Path(preset_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_presets::CreationPresetRecord>>,
> {
    Ok(success(
        state.creation_preset_service.read_preset(&preset_id)?,
    ))
}

pub async fn update_creation_preset(
    State(state): State<AppState>,
    Path(preset_id): Path<String>,
    RequestJson(payload): RequestJson<UpdateCreationPresetRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_presets::CreationPresetRecord>>,
> {
    Ok(success(
        state
            .creation_preset_service
            .update_preset(&preset_id, payload)?,
    ))
}

pub async fn delete_creation_preset(
    State(state): State<AppState>,
    Path(preset_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.creation_preset_service.delete_preset(&preset_id)?;
    Ok(accepted())
}

pub async fn list_creation_templates(
    State(state): State<AppState>,
    Query(query): Query<CreationTemplateListQuery>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::creation_templates::CreationTemplateRecord,
        >,
    >,
> {
    let page = state.creation_template_service.list_templates(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn create_creation_template(
    State(state): State<AppState>,
    RequestJson(payload): RequestJson<CreateCreationTemplateRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_templates::CreationTemplateRecord>>,
> {
    Ok(success(
        state.creation_template_service.create_template(payload)?,
    ))
}

pub async fn read_creation_template(
    State(state): State<AppState>,
    Path(template_id): Path<String>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_templates::CreationTemplateRecord>>,
> {
    Ok(success(
        state
            .creation_template_service
            .read_template(&template_id)?,
    ))
}

pub async fn update_creation_template(
    State(state): State<AppState>,
    Path(template_id): Path<String>,
    RequestJson(payload): RequestJson<UpdateCreationTemplateRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation_templates::CreationTemplateRecord>>,
> {
    Ok(success(
        state
            .creation_template_service
            .update_template(&template_id, payload)?,
    ))
}

pub async fn delete_creation_template(
    State(state): State<AppState>,
    Path(template_id): Path<String>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state
        .creation_template_service
        .delete_template(&template_id)?;
    Ok(accepted())
}

pub async fn apply_creation_template(
    State(state): State<AppState>,
    Path(template_id): Path<String>,
    RequestJson(payload): RequestJson<ApplyCreationTemplateRequest>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation::CreationSessionRecord>>,
> {
    Ok(success(
        state
            .creation_template_service
            .apply_template(&template_id, payload)?,
    ))
}

pub async fn read_current_creation_session(
    State(state): State<AppState>,
    Query(query): Query<CreationSessionQuery>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation::CreationSessionSnapshotRecord>>,
> {
    Ok(success(state.creation_service.read_current_session(query)?))
}

pub async fn consume_current_creation_session(
    State(state): State<AppState>,
    Query(query): Query<CreationSessionQuery>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::creation::CreationSessionSnapshotRecord>>,
> {
    Ok(success(
        state.creation_service.consume_current_session(query)?,
    ))
}

pub async fn clear_current_creation_session(
    State(state): State<AppState>,
    Query(query): Query<CreationSessionQuery>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.creation_service.clear_current_session(query)?;
    Ok(accepted())
}

pub async fn list_creation_history(
    State(state): State<AppState>,
    Query(query): Query<CreationHistoryListQuery>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::creation_history::CreationHistoryEntryRecord,
        >,
    >,
> {
    let page = state.creation_history_service.list_history(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_creation_history_entry(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<crate::services::creation_history::CreationHistoryEntryRecord>,
    >,
> {
    Ok(success(
        state
            .creation_history_service
            .read_history_entry(&entry_id)?,
    ))
}

pub async fn upsert_creation_history_entry(
    State(state): State<AppState>,
    RequestJson(payload): RequestJson<UpsertCreationHistoryEntryRequest>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<crate::services::creation_history::CreationHistoryEntryRecord>,
    >,
> {
    Ok(success(
        state
            .creation_history_service
            .upsert_history_entry(payload)?,
    ))
}

pub async fn favorite_creation_history_entry(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    RequestJson(payload): RequestJson<CreationHistoryFavoriteRequest>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<crate::services::creation_history::CreationHistoryEntryRecord>,
    >,
> {
    Ok(success(
        state
            .creation_history_service
            .set_history_entry_favorite(&entry_id, payload)?,
    ))
}

pub async fn delete_creation_history_entry(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<crate::services::creation_history::CreationHistoryEntryRecord>,
    >,
> {
    Ok(success(
        state
            .creation_history_service
            .delete_history_entry(&entry_id)?,
    ))
}

pub async fn clear_creation_history(
    State(state): State<AppState>,
    Query(query): Query<CreationHistoryListQuery>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.creation_history_service.clear_history(query)?;
    Ok(accepted())
}
