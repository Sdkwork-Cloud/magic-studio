use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list_with_pagination, accepted, success, ServerResult};
use crate::services::magiccut::{
    MagicCutListQuery, MagicCutProjectDuplicateInput, MagicCutProjectWriteInput,
    MagicCutTemplateInstantiateInput, MagicCutTemplateSaveInput,
};
use crate::services::magiccut_render::{MagicCutRenderCreateInput, MagicCutRenderListQuery};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutProjectIdPath {
    pub project_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutTemplateIdPath {
    pub template_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderIdPath {
    pub render_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderArtifactPath {
    pub render_id: String,
    pub artifact_id: String,
}

pub async fn read_render_capabilities(
    State(state): State<AppState>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<crate::services::magiccut_render::MagicCutRenderCapabilities>,
    >,
> {
    Ok(success(state.magiccut_render_service.read_capabilities()?))
}

pub async fn list_projects(
    State(state): State<AppState>,
    Query(query): Query<MagicCutListQuery>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    let page = state.magiccut_service.list_projects(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn create_project(
    State(state): State<AppState>,
    Json(payload): Json<MagicCutProjectWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.magiccut_service.create_project(payload)?))
}

pub async fn read_project(
    State(state): State<AppState>,
    Path(path): Path<MagicCutProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.magiccut_service.read_project(&path.project_id)?,
    ))
}

pub async fn update_project(
    State(state): State<AppState>,
    Path(path): Path<MagicCutProjectIdPath>,
    Json(payload): Json<MagicCutProjectWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .magiccut_service
            .update_project(&path.project_id, payload)?,
    ))
}

pub async fn delete_project(
    State(state): State<AppState>,
    Path(path): Path<MagicCutProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.magiccut_service.delete_project(&path.project_id)?;
    Ok(accepted())
}

pub async fn duplicate_project(
    State(state): State<AppState>,
    Path(path): Path<MagicCutProjectIdPath>,
    Json(payload): Json<MagicCutProjectDuplicateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .magiccut_service
            .duplicate_project(&path.project_id, payload)?,
    ))
}

pub async fn list_templates(
    State(state): State<AppState>,
    Query(query): Query<MagicCutListQuery>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    let page = state.magiccut_service.list_templates(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn create_template(
    State(state): State<AppState>,
    Json(payload): Json<MagicCutTemplateSaveInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.magiccut_service.create_template(payload)?))
}

pub async fn read_template(
    State(state): State<AppState>,
    Path(path): Path<MagicCutTemplateIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.magiccut_service.read_template(&path.template_id)?,
    ))
}

pub async fn update_template(
    State(state): State<AppState>,
    Path(path): Path<MagicCutTemplateIdPath>,
    Json(payload): Json<MagicCutTemplateSaveInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .magiccut_service
            .update_template(&path.template_id, payload)?,
    ))
}

pub async fn instantiate_template(
    State(state): State<AppState>,
    Path(path): Path<MagicCutTemplateIdPath>,
    Json(payload): Json<MagicCutTemplateInstantiateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .magiccut_service
            .instantiate_template(&path.template_id, payload)?,
    ))
}

pub async fn delete_template(
    State(state): State<AppState>,
    Path(path): Path<MagicCutTemplateIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.magiccut_service.delete_template(&path.template_id)?;
    Ok(accepted())
}

pub async fn list_renders(
    State(state): State<AppState>,
    Query(query): Query<MagicCutRenderListQuery>,
) -> ServerResult<
    Json<
        crate::response::ApiList<crate::services::magiccut_render::MagicCutRenderJobRecord>,
    >,
> {
    let page = state.magiccut_render_service.list_renders(query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn create_render(
    State(state): State<AppState>,
    Path(path): Path<MagicCutProjectIdPath>,
    Json(payload): Json<MagicCutRenderCreateInput>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::magiccut_render::MagicCutRenderJobRecord>>,
> {
    Ok(success(
        state
            .magiccut_render_service
            .create_render(&path.project_id, payload)?,
    ))
}

pub async fn read_render(
    State(state): State<AppState>,
    Path(path): Path<MagicCutRenderIdPath>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::magiccut_render::MagicCutRenderJobRecord>>,
> {
    Ok(success(
        state.magiccut_render_service.read_render(&path.render_id)?,
    ))
}

pub async fn cancel_render(
    State(state): State<AppState>,
    Path(path): Path<MagicCutRenderIdPath>,
) -> ServerResult<
    Json<crate::response::ApiSuccess<crate::services::magiccut_render::MagicCutRenderJobRecord>>,
> {
    Ok(success(
        state
            .magiccut_render_service
            .cancel_render(&path.render_id)?,
    ))
}

pub async fn list_render_artifacts(
    State(state): State<AppState>,
    Path(path): Path<MagicCutRenderIdPath>,
) -> ServerResult<
    Json<
        crate::response::ApiList<
            crate::services::magiccut_render::MagicCutRenderArtifactRecord,
        >,
    >,
> {
    Ok(crate::response::list(
        state
            .magiccut_render_service
            .list_artifacts(&path.render_id)?,
    ))
}

pub async fn read_render_artifact_content(
    State(state): State<AppState>,
    Path(path): Path<MagicCutRenderArtifactPath>,
) -> ServerResult<
    Json<
        crate::response::ApiSuccess<
            crate::services::magiccut_render::MagicCutRenderArtifactContent,
        >,
    >,
> {
    Ok(success(
        state
            .magiccut_render_service
            .read_artifact_content(&path.render_id, &path.artifact_id)?,
    ))
}
