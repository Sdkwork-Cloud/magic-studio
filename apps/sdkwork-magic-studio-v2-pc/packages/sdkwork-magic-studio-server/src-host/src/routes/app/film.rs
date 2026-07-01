use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::response::{list, list_with_pagination, accepted, success, ServerResult};
use crate::services::film::{
    FilmAnalysisInput, FilmAssetBindInput, FilmAssetRelinkInput, FilmAuthoringBatchInput,
    FilmCreateShootingPlanInput, FilmExportPackageInput, FilmImportPackageInput,
    FilmPrepareAnalysisInput, FilmPresetApplyInput, FilmPresetWriteInput, FilmProjectListQuery,
    FilmProjectValidateInput, FilmProjectWriteInput, FilmPublishApproveInput,
    FilmPublishReopenInput, FilmPublishRequestChangesInput, FilmPublishRestoreInput,
    FilmPublishReviewAssignmentsInput, FilmPublishReviewCommentInput,
    FilmPublishReviewCommentResolveInput, FilmPublishReviewConsensusInput,
    FilmPublishReviewSubmitInput, FilmRebuildStoryboardInput, FilmRefreshAnalysisInput,
    FilmReviewQueueQuery, FilmSceneBreakdownCreateInput, FilmScriptStandardizeInput,
    FilmShotSyncInput, FilmShotVariantsGenerateInput, FilmStoryboardGenerateInput,
    FilmStoryboardPublishInput, FilmTemplateInstantiateInput, FilmTemplateSnapshotInput,
    FilmTemplateWriteInput,
};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilmProjectIdPath {
    pub project_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilmTemplateIdPath {
    pub template_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilmPublishIdPath {
    pub project_id: String,
    pub publish_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilmPublishReviewCommentPath {
    pub project_id: String,
    pub publish_id: String,
    pub comment_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilmPublishArtifactPath {
    pub project_id: String,
    pub publish_id: String,
    pub artifact_kind: String,
}

pub async fn list_projects(
    State(state): State<AppState>,
    Query(query): Query<FilmProjectListQuery>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    let page = state.film_service.list_projects(query)?;
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
    Json(payload): Json<FilmProjectWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.create_project(payload)?))
}

pub async fn list_presets(
    State(state): State<AppState>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    Ok(list(state.film_service.list_presets()?))
}

pub async fn create_preset(
    State(state): State<AppState>,
    Json(payload): Json<FilmPresetWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.create_preset(payload)?))
}

pub async fn list_templates(
    State(state): State<AppState>,
    Query(query): Query<FilmProjectListQuery>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    let page = state.film_service.list_templates(query)?;
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
    Json(payload): Json<FilmTemplateWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.create_template(payload)?))
}

pub async fn read_template(
    State(state): State<AppState>,
    Path(path): Path<FilmTemplateIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.film_service.read_template(&path.template_id)?,
    ))
}

pub async fn update_template(
    State(state): State<AppState>,
    Path(path): Path<FilmTemplateIdPath>,
    Json(payload): Json<FilmTemplateWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .update_template(&path.template_id, payload)?,
    ))
}

pub async fn instantiate_template(
    State(state): State<AppState>,
    Path(path): Path<FilmTemplateIdPath>,
    Json(payload): Json<FilmTemplateInstantiateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .instantiate_template(&path.template_id, payload)?,
    ))
}

pub async fn delete_template(
    State(state): State<AppState>,
    Path(path): Path<FilmTemplateIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.film_service.delete_template(&path.template_id)?;
    Ok(accepted())
}

pub async fn create_template_snapshot(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmTemplateSnapshotInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .create_template_snapshot(&path.project_id, payload)?,
    ))
}

pub async fn read_project(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_project(&path.project_id)?))
}

pub async fn read_project_graph(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.film_service.read_project_graph(&path.project_id)?,
    ))
}

pub async fn read_asset_inventory(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.film_service.read_asset_inventory(&path.project_id)?,
    ))
}

pub async fn list_publishes(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Query(query): Query<FilmProjectListQuery>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    let page = state.film_service.list_publishes(&path.project_id, query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn list_review_queue(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Query(query): Query<FilmReviewQueueQuery>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    let page = state
        .film_service
        .list_review_queue(&path.project_id, query)?;
    Ok(list_with_pagination(
        page.items,
        page.page as i32,
        page.page_size as i32,
        page.total as i32,
        None,
    ))
}

pub async fn read_project_review_portfolio_dashboard(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_portfolio_dashboard(&path.project_id)?,
    ))
}

pub async fn read_project_review_reviewer_capacity(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_reviewer_capacity(&path.project_id)?,
    ))
}

pub async fn read_project_review_decision_freshness(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_decision_freshness(&path.project_id)?,
    ))
}

pub async fn read_project_review_governance_drift(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_governance_drift(&path.project_id)?,
    ))
}

pub async fn read_project_review_escalation_forecast(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_escalation_forecast(&path.project_id)?,
    ))
}

pub async fn read_project_review_dependency_graph(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_dependency_graph(&path.project_id)?,
    ))
}

pub async fn read_project_review_intervention_plan(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_intervention_plan(&path.project_id)?,
    ))
}

pub async fn read_project_review_recovery_orchestration(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_recovery_orchestration(&path.project_id)?,
    ))
}

pub async fn read_project_review_approval_burn_down(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_approval_burn_down(&path.project_id)?,
    ))
}

pub async fn read_project_review_intervention_outcomes(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_intervention_outcomes(&path.project_id)?,
    ))
}

pub async fn read_project_review_effectiveness_baseline(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_effectiveness_baseline(&path.project_id)?,
    ))
}

pub async fn read_project_review_intervention_execution_history(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_project_review_intervention_execution_history(&path.project_id)?,
    ))
}

pub async fn read_publish(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_state(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_state(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn read_publish_review_timeline(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_timeline(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn read_publish_review_rounds(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_rounds(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn read_publish_review_anchors(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_anchors(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn read_publish_review_activity(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_activity(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn read_publish_review_anchor_responsibility(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_anchor_responsibility(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_reviewer_backlog(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_reviewer_backlog(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_decision_matrix(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_decision_matrix(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_readiness(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_readiness(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn read_publish_review_reviewer_attention(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_reviewer_attention(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_reviewer_coverage(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_reviewer_coverage(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_operations_dashboard(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_operations_dashboard(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_stale_decisions(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_stale_decisions(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_latency_analytics(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .read_publish_review_latency_analytics(&path.project_id, &path.publish_id)?,
    ))
}

pub async fn read_publish_review_worklist(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_review_worklist(
        &path.project_id,
        &path.publish_id,
    )?))
}

pub async fn approve_publish(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishApproveInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.approve_publish(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn request_publish_changes(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishRequestChangesInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.request_publish_changes(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn create_publish_review_comment(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishReviewCommentInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.create_publish_review_comment(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn submit_publish_review(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishReviewSubmitInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.submit_publish_review(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn consensus_publish_review(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishReviewConsensusInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.consensus_publish_review(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn set_publish_review_assignments(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishReviewAssignmentsInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.set_publish_review_assignments(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn resolve_publish_review_comment(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishReviewCommentPath>,
    Json(payload): Json<FilmPublishReviewCommentResolveInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.resolve_publish_review_comment(
        &path.project_id,
        &path.publish_id,
        &path.comment_id,
        payload,
    )?))
}

pub async fn reopen_publish(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishReopenInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.reopen_publish(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn restore_publish(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
    Json(payload): Json<FilmPublishRestoreInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.restore_publish(
        &path.project_id,
        &path.publish_id,
        payload,
    )?))
}

pub async fn delete_publish(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state
        .film_service
        .delete_publish(&path.project_id, &path.publish_id)?;
    Ok(accepted())
}

pub async fn read_publish_artifact_content(
    State(state): State<AppState>,
    Path(path): Path<FilmPublishArtifactPath>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.read_publish_artifact_content(
        &path.project_id,
        &path.publish_id,
        &path.artifact_kind,
    )?))
}

pub async fn update_project(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmProjectWriteInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .update_project(&path.project_id, payload)?,
    ))
}

pub async fn delete_project(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
) -> ServerResult<Json<crate::response::ApiCommand>> {
    state.film_service.delete_project(&path.project_id)?;
    Ok(accepted())
}

pub async fn analyze_script(
    State(state): State<AppState>,
    Json(payload): Json<FilmAnalysisInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.analyze_script(payload)?))
}

pub async fn standardize_script(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmScriptStandardizeInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .standardize_script(&path.project_id, payload)?,
    ))
}

pub async fn prepare_analysis(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmPrepareAnalysisInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .prepare_analysis(&path.project_id, payload)?,
    ))
}

pub async fn rebuild_storyboard(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmRebuildStoryboardInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .rebuild_storyboard(&path.project_id, payload)?,
    ))
}

pub async fn create_scene_breakdown(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmSceneBreakdownCreateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .create_scene_breakdown(&path.project_id, payload)?,
    ))
}

pub async fn generate_shot_variants(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmShotVariantsGenerateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .generate_shot_variants(&path.project_id, payload)?,
    ))
}

pub async fn create_shooting_plan(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmCreateShootingPlanInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .create_shooting_plan(&path.project_id, payload)?,
    ))
}

pub async fn generate_storyboard(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmStoryboardGenerateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .generate_storyboard(&path.project_id, payload)?,
    ))
}

pub async fn sync_shots(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmShotSyncInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.film_service.sync_shots(&path.project_id, payload)?,
    ))
}

pub async fn relink_assets(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmAssetRelinkInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .relink_assets(&path.project_id, payload)?,
    ))
}

pub async fn bind_asset(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmAssetBindInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.film_service.bind_asset(&path.project_id, payload)?,
    ))
}

pub async fn export_package(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmExportPackageInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .export_package(&path.project_id, payload)?,
    ))
}

pub async fn publish_storyboard(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmStoryboardPublishInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .publish_storyboard(&path.project_id, payload)?,
    ))
}

pub async fn import_package(
    State(state): State<AppState>,
    Json(payload): Json<FilmImportPackageInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.import_package(payload)?))
}

pub async fn validate_project(
    State(state): State<AppState>,
    Json(payload): Json<FilmProjectValidateInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(state.film_service.validate_project(payload)?))
}

pub async fn run_authoring_batch(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmAuthoringBatchInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .run_authoring_batch(&path.project_id, payload)?,
    ))
}

pub async fn refresh_analysis(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmRefreshAnalysisInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state
            .film_service
            .refresh_analysis(&path.project_id, payload)?,
    ))
}

pub async fn apply_preset(
    State(state): State<AppState>,
    Path(path): Path<FilmProjectIdPath>,
    Json(payload): Json<FilmPresetApplyInput>,
) -> ServerResult<Json<crate::response::ApiSuccess<serde_json::Value>>> {
    Ok(success(
        state.film_service.apply_preset(&path.project_id, payload)?,
    ))
}

pub async fn extract_characters(
    State(state): State<AppState>,
    Json(payload): Json<FilmAnalysisInput>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    Ok(list(state.film_service.extract_characters(payload)?))
}

pub async fn extract_props(
    State(state): State<AppState>,
    Json(payload): Json<FilmAnalysisInput>,
) -> ServerResult<Json<crate::response::ApiList<serde_json::Value>>> {
    Ok(list(state.film_service.extract_props(payload)?))
}
