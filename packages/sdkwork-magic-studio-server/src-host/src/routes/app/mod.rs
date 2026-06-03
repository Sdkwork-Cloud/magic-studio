mod assets;
mod auth;
mod capabilities;
mod chat;
mod creation;
mod drive;
mod film;
mod generation;
mod magiccut;
mod notes;
mod notifications;
mod plugins;
mod portal;
mod presentations;
mod settings;
mod trade;
mod trade_commerce;
mod user;
mod vip;
mod voices;
mod workspaces;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

pub fn mount_routes(router: Router<AppState>, state: &AppState) -> Router<AppState> {
    let paths = AppRoutePaths::from_state(state);

    router
        .route(&paths.plugins, get(plugins::plugins))
        .route(
            &paths.capabilities_summary,
            get(capabilities::read_capability_summary),
        )
        .route(
            &paths.capabilities_domains,
            get(capabilities::list_capability_domains),
        )
        .route(
            &paths.capabilities_execution,
            get(capabilities::list_execution_capabilities),
        )
        .route(
            &paths.creation_capabilities,
            get(creation::read_creation_capabilities),
        )
        .route(
            &paths.creation_batches,
            get(creation::list_creation_batches).post(creation::create_creation_batch),
        )
        .route(
            &paths.creation_batch_detail,
            get(creation::read_creation_batch)
                .patch(creation::update_creation_batch)
                .delete(creation::delete_creation_batch),
        )
        .route(
            &paths.creation_batch_materialize,
            post(creation::materialize_creation_batch),
        )
        .route(
            &paths.creation_batch_item_status,
            post(creation::update_creation_batch_item_status),
        )
        .route(
            &paths.creation_presets,
            get(creation::list_creation_presets).post(creation::create_creation_preset),
        )
        .route(
            &paths.creation_preset_detail,
            get(creation::read_creation_preset)
                .patch(creation::update_creation_preset)
                .delete(creation::delete_creation_preset),
        )
        .route(
            &paths.creation_templates,
            get(creation::list_creation_templates).post(creation::create_creation_template),
        )
        .route(
            &paths.creation_template_detail,
            get(creation::read_creation_template)
                .patch(creation::update_creation_template)
                .delete(creation::delete_creation_template),
        )
        .route(
            &paths.creation_template_apply,
            post(creation::apply_creation_template),
        )
        .route(
            &paths.creation_history,
            get(creation::list_creation_history)
                .put(creation::upsert_creation_history_entry)
                .delete(creation::clear_creation_history),
        )
        .route(
            &paths.creation_history_entry,
            get(creation::read_creation_history_entry)
                .delete(creation::delete_creation_history_entry),
        )
        .route(
            &paths.creation_history_favorite,
            post(creation::favorite_creation_history_entry),
        )
        .route(
            &paths.creation_sessions,
            post(creation::create_creation_session),
        )
        .route(
            &paths.creation_current_session,
            get(creation::read_current_creation_session)
                .delete(creation::clear_current_creation_session),
        )
        .route(
            &paths.creation_current_session_consume,
            post(creation::consume_current_creation_session),
        )
        .route(
            &paths.chat_sessions,
            get(chat::list_sessions).post(chat::create_session),
        )
        .route(
            &paths.chat_session_detail,
            get(chat::read_session)
                .patch(chat::update_session)
                .delete(chat::delete_session),
        )
        .route(
            &paths.chat_session_transcript,
            get(chat::read_transcript).put(chat::update_transcript),
        )
        .route(
            &paths.presentations,
            get(presentations::list_presentations).post(presentations::create_presentation),
        )
        .route(
            &paths.presentation_detail,
            get(presentations::read_presentation)
                .patch(presentations::update_presentation)
                .delete(presentations::delete_presentation),
        )
        .route(
            &paths.presentation_slides,
            post(presentations::create_slide),
        )
        .route(
            &paths.presentation_slide_detail,
            axum::routing::patch(presentations::update_slide),
        )
        .route(
            &paths.settings,
            get(settings::read_settings).put(settings::update_settings),
        )
        .route(
            &paths.notifications,
            get(notifications::list_notifications).post(notifications::create_notification),
        )
        .route(
            &paths.notification_mark_read,
            post(notifications::mark_notification_as_read),
        )
        .route(
            &paths.notifications_mark_all_read,
            post(notifications::mark_all_notifications_as_read),
        )
        .route(
            &paths.notifications_unread_count,
            get(notifications::read_unread_count),
        )
        .route(
            &paths.notifications_delete,
            post(notifications::delete_notifications),
        )
        .route(
            &paths.workspaces,
            get(workspaces::list_workspaces).post(workspaces::create_workspace),
        )
        .route(
            &paths.workspace_detail,
            get(workspaces::read_workspace)
                .patch(workspaces::update_workspace)
                .delete(workspaces::delete_workspace),
        )
        .route(
            &paths.workspace_recent_projects,
            get(workspaces::list_recent_projects),
        )
        .route(
            &paths.workspace_projects,
            get(workspaces::list_projects).post(workspaces::create_project),
        )
        .route(
            &paths.workspace_project_detail,
            get(workspaces::read_project)
                .patch(workspaces::update_project)
                .delete(workspaces::delete_project),
        )
        .route(
            &paths.workspace_project_session,
            get(workspaces::read_project_session)
                .put(workspaces::upsert_project_session)
                .delete(workspaces::delete_project_session),
        )
        .route(
            &paths.workspace_project_git_sync,
            post(workspaces::sync_project_to_git),
        )
        .route(
            &paths.workspace_project_git_syncs,
            get(workspaces::list_project_git_syncs),
        )
        .route(
            &paths.workspace_project_latest_git_sync,
            get(workspaces::read_latest_project_git_sync),
        )
        .route(
            &paths.workspace_project_git_sync_detail,
            get(workspaces::read_project_git_sync),
        )
        .route(
            &paths.workspace_project_git_sync_retry,
            post(workspaces::retry_project_git_sync),
        )
        .route(
            &paths.workspace_project_releases,
            get(workspaces::list_project_releases).post(workspaces::create_project_release),
        )
        .route(
            &paths.workspace_project_release_stats,
            get(workspaces::read_project_release_stats),
        )
        .route(
            &paths.workspace_project_release_prune,
            post(workspaces::prune_project_releases),
        )
        .route(
            &paths.workspace_project_release_retention_policy,
            get(workspaces::read_project_release_retention_policy)
                .put(workspaces::update_project_release_retention_policy),
        )
        .route(
            &paths.workspace_project_release_retention_policy_apply,
            post(workspaces::apply_project_release_retention_policy),
        )
        .route(
            &paths.workspace_project_latest_release,
            get(workspaces::read_latest_project_release),
        )
        .route(
            &paths.workspace_project_release_detail,
            get(workspaces::read_project_release).delete(workspaces::delete_project_release),
        )
        .route(
            &paths.workspace_project_release_restore,
            post(workspaces::restore_project_release),
        )
        .route(
            &paths.workspace_project_release_manifest,
            get(workspaces::read_project_release_manifest),
        )
        .route(
            &paths.workspace_project_release_artifact,
            get(workspaces::read_project_release_artifact),
        )
        .route(
            &paths.workspace_project_release_rebuild,
            post(workspaces::rebuild_project_release),
        )
        .route(
            &paths.workspace_project_open,
            post(workspaces::open_project),
        )
        .route(
            &paths.workspace_project_duplicate,
            post(workspaces::duplicate_project),
        )
        .route(
            &paths.workspace_project_archive,
            post(workspaces::archive_project),
        )
        .route(
            &paths.workspace_project_restore,
            post(workspaces::restore_project),
        )
        .route(&paths.assets, get(assets::list_assets))
        .route(&paths.assets_stats, get(assets::read_stats))
        .route(&paths.asset_categories, get(assets::list_categories))
        .route(&paths.asset_import_file, post(assets::import_file))
        .route(&paths.asset_import_url, post(assets::import_url))
        .route(
            &paths.asset_detail,
            get(assets::read_asset)
                .put(assets::upsert_asset)
                .patch(assets::update_asset)
                .delete(assets::delete_asset),
        )
        .route(&paths.drive_root, get(drive::read_root))
        .route(&paths.drive_entries, get(drive::list_entries))
        .route(&paths.drive_stats, get(drive::read_stats))
        .route(
            &paths.drive_file_content,
            get(drive::read_file_content).put(drive::update_file_content),
        )
        .route(&paths.drive_folders, post(drive::create_folder))
        .route(&paths.drive_uploads, post(drive::upload_file))
        .route(&paths.drive_import_file, post(drive::import_file))
        .route(&paths.drive_rename, post(drive::rename_item))
        .route(&paths.drive_move, post(drive::move_items))
        .route(&paths.drive_delete, post(drive::delete_items))
        .route(&paths.drive_restore, post(drive::restore_items))
        .route(&paths.drive_empty_trash, post(drive::empty_trash))
        .route(&paths.drive_favorites, post(drive::favorite_item))
        .route(
            &paths.film_projects,
            get(film::list_projects).post(film::create_project),
        )
        .route(
            &paths.film_presets,
            get(film::list_presets).post(film::create_preset),
        )
        .route(
            &paths.film_templates,
            get(film::list_templates).post(film::create_template),
        )
        .route(&paths.film_import_package, post(film::import_package))
        .route(&paths.film_validate_project, post(film::validate_project))
        .route(
            &paths.film_template_detail,
            get(film::read_template)
                .put(film::update_template)
                .delete(film::delete_template),
        )
        .route(
            &paths.film_template_instantiate,
            post(film::instantiate_template),
        )
        .route(&paths.film_project_graph, get(film::read_project_graph))
        .route(
            &paths.film_project_asset_inventory,
            get(film::read_asset_inventory),
        )
        .route(&paths.film_project_publishes, get(film::list_publishes))
        .route(
            &paths.film_project_review_queue,
            get(film::list_review_queue),
        )
        .route(
            &paths.film_project_review_portfolio_dashboard,
            get(film::read_project_review_portfolio_dashboard),
        )
        .route(
            &paths.film_project_review_reviewer_capacity,
            get(film::read_project_review_reviewer_capacity),
        )
        .route(
            &paths.film_project_review_decision_freshness,
            get(film::read_project_review_decision_freshness),
        )
        .route(
            &paths.film_project_review_governance_drift,
            get(film::read_project_review_governance_drift),
        )
        .route(
            &paths.film_project_review_escalation_forecast,
            get(film::read_project_review_escalation_forecast),
        )
        .route(
            &paths.film_project_review_dependency_graph,
            get(film::read_project_review_dependency_graph),
        )
        .route(
            &paths.film_project_review_intervention_plan,
            get(film::read_project_review_intervention_plan),
        )
        .route(
            &paths.film_project_review_recovery_orchestration,
            get(film::read_project_review_recovery_orchestration),
        )
        .route(
            &paths.film_project_review_approval_burn_down,
            get(film::read_project_review_approval_burn_down),
        )
        .route(
            &paths.film_project_review_intervention_outcomes,
            get(film::read_project_review_intervention_outcomes),
        )
        .route(
            &paths.film_project_review_effectiveness_baseline,
            get(film::read_project_review_effectiveness_baseline),
        )
        .route(
            &paths.film_project_review_intervention_execution_history,
            get(film::read_project_review_intervention_execution_history),
        )
        .route(
            &paths.film_project_publish_detail,
            get(film::read_publish).delete(film::delete_publish),
        )
        .route(
            &paths.film_project_publish_review_state,
            get(film::read_publish_review_state),
        )
        .route(
            &paths.film_project_publish_review_timeline,
            get(film::read_publish_review_timeline),
        )
        .route(
            &paths.film_project_publish_review_rounds,
            get(film::read_publish_review_rounds),
        )
        .route(
            &paths.film_project_publish_review_anchors,
            get(film::read_publish_review_anchors),
        )
        .route(
            &paths.film_project_publish_review_activity,
            get(film::read_publish_review_activity),
        )
        .route(
            &paths.film_project_publish_review_anchor_responsibility,
            get(film::read_publish_review_anchor_responsibility),
        )
        .route(
            &paths.film_project_publish_review_reviewer_backlog,
            get(film::read_publish_review_reviewer_backlog),
        )
        .route(
            &paths.film_project_publish_review_decision_matrix,
            get(film::read_publish_review_decision_matrix),
        )
        .route(
            &paths.film_project_publish_review_readiness,
            get(film::read_publish_review_readiness),
        )
        .route(
            &paths.film_project_publish_review_reviewer_attention,
            get(film::read_publish_review_reviewer_attention),
        )
        .route(
            &paths.film_project_publish_review_reviewer_coverage,
            get(film::read_publish_review_reviewer_coverage),
        )
        .route(
            &paths.film_project_publish_review_operations_dashboard,
            get(film::read_publish_review_operations_dashboard),
        )
        .route(
            &paths.film_project_publish_review_stale_decisions,
            get(film::read_publish_review_stale_decisions),
        )
        .route(
            &paths.film_project_publish_review_latency_analytics,
            get(film::read_publish_review_latency_analytics),
        )
        .route(
            &paths.film_project_publish_review_worklist,
            get(film::read_publish_review_worklist),
        )
        .route(
            &paths.film_project_publish_approve,
            post(film::approve_publish),
        )
        .route(
            &paths.film_project_publish_request_changes,
            post(film::request_publish_changes),
        )
        .route(
            &paths.film_project_publish_review_comments,
            post(film::create_publish_review_comment),
        )
        .route(
            &paths.film_project_publish_review_submit,
            post(film::submit_publish_review),
        )
        .route(
            &paths.film_project_publish_review_consensus,
            post(film::consensus_publish_review),
        )
        .route(
            &paths.film_project_publish_review_assignments,
            post(film::set_publish_review_assignments),
        )
        .route(
            &paths.film_project_publish_review_comment_resolve,
            post(film::resolve_publish_review_comment),
        )
        .route(
            &paths.film_project_publish_reopen,
            post(film::reopen_publish),
        )
        .route(
            &paths.film_project_publish_restore,
            post(film::restore_publish),
        )
        .route(
            &paths.film_project_publish_artifact_content,
            get(film::read_publish_artifact_content),
        )
        .route(
            &paths.film_project_template_snapshots,
            post(film::create_template_snapshot),
        )
        .route(
            &paths.film_project_detail,
            get(film::read_project)
                .put(film::update_project)
                .delete(film::delete_project),
        )
        .route(&paths.film_analysis_script, post(film::analyze_script))
        .route(
            &paths.film_standardize_script,
            post(film::standardize_script),
        )
        .route(&paths.film_prepare_analysis, post(film::prepare_analysis))
        .route(
            &paths.film_rebuild_storyboard,
            post(film::rebuild_storyboard),
        )
        .route(
            &paths.film_create_scene_breakdown,
            post(film::create_scene_breakdown),
        )
        .route(
            &paths.film_generate_shot_variants,
            post(film::generate_shot_variants),
        )
        .route(
            &paths.film_create_shooting_plan,
            post(film::create_shooting_plan),
        )
        .route(
            &paths.film_storyboard_generate,
            post(film::generate_storyboard),
        )
        .route(&paths.film_shots_sync, post(film::sync_shots))
        .route(&paths.film_authoring_batch, post(film::run_authoring_batch))
        .route(&paths.film_refresh_analysis, post(film::refresh_analysis))
        .route(&paths.film_apply_preset, post(film::apply_preset))
        .route(&paths.film_assets_relink, post(film::relink_assets))
        .route(&paths.film_assets_bind, post(film::bind_asset))
        .route(&paths.film_export_package, post(film::export_package))
        .route(
            &paths.film_publish_storyboard,
            post(film::publish_storyboard),
        )
        .route(
            &paths.film_analysis_characters,
            post(film::extract_characters),
        )
        .route(&paths.film_analysis_props, post(film::extract_props))
        .route(
            &paths.magiccut_projects,
            get(magiccut::list_projects).post(magiccut::create_project),
        )
        .route(
            &paths.magiccut_project_detail,
            get(magiccut::read_project)
                .put(magiccut::update_project)
                .delete(magiccut::delete_project),
        )
        .route(
            &paths.magiccut_project_duplicate,
            post(magiccut::duplicate_project),
        )
        .route(
            &paths.magiccut_templates,
            get(magiccut::list_templates).post(magiccut::create_template),
        )
        .route(
            &paths.magiccut_template_detail,
            get(magiccut::read_template)
                .put(magiccut::update_template)
                .delete(magiccut::delete_template),
        )
        .route(
            &paths.magiccut_template_instantiate,
            post(magiccut::instantiate_template),
        )
        .route(
            &paths.magiccut_render_capabilities,
            get(magiccut::read_render_capabilities),
        )
        .route(&paths.magiccut_renders, get(magiccut::list_renders))
        .route(
            &paths.magiccut_project_renders,
            post(magiccut::create_render),
        )
        .route(&paths.magiccut_render_detail, get(magiccut::read_render))
        .route(&paths.magiccut_render_cancel, post(magiccut::cancel_render))
        .route(
            &paths.magiccut_render_artifacts,
            get(magiccut::list_render_artifacts),
        )
        .route(
            &paths.magiccut_render_artifact_content,
            get(magiccut::read_render_artifact_content),
        )
        .route(&paths.auth_session, get(auth::read_session))
        .route(&paths.auth_login, post(auth::login))
        .route(&paths.auth_login_phone, post(auth::login_with_phone))
        .route(&paths.auth_register, post(auth::register))
        .route(&paths.auth_logout, post(auth::logout))
        .route(&paths.auth_refresh_token, post(auth::refresh_token))
        .route(&paths.auth_verify_code_send, post(auth::send_verify_code))
        .route(&paths.auth_verify_code_check, post(auth::check_verify_code))
        .route(
            &paths.auth_password_reset_request,
            post(auth::request_password_reset),
        )
        .route(
            &paths.auth_password_reset_confirm,
            post(auth::reset_password),
        )
        .route(&paths.auth_qr_code, post(auth::create_qr_code))
        .route(&paths.auth_qr_code_detail, get(auth::read_qr_code_status))
        .route(
            &paths.user_profile,
            get(user::read_profile).patch(user::update_profile),
        )
        .route(&paths.user_avatar, post(user::upload_avatar))
        .route(
            &paths.user_settings,
            get(user::read_settings).put(user::update_settings),
        )
        .route(&paths.user_change_password, post(user::change_password))
        .route(
            &paths.user_addresses,
            get(user::list_addresses).post(user::create_address),
        )
        .route(&paths.user_default_address, get(user::read_default_address))
        .route(
            &paths.user_address_detail,
            axum::routing::patch(user::update_address).delete(user::delete_address),
        )
        .route(
            &paths.user_address_set_default,
            post(user::set_default_address),
        )
        .route(&paths.user_login_history, get(user::read_login_history))
        .route(
            &paths.user_generation_history,
            get(user::read_generation_history),
        )
        .route(&paths.user_sessions, get(user::list_sessions))
        .route(
            &paths.user_session_detail,
            axum::routing::delete(user::revoke_session),
        )
        .route(&paths.user_devices, get(user::list_devices))
        .route(
            &paths.user_device_detail,
            axum::routing::delete(user::revoke_device),
        )
        .route(
            &paths.user_two_factor,
            get(user::read_two_factor_status).delete(user::disable_two_factor),
        )
        .route(&paths.user_two_factor_setup, post(user::setup_two_factor))
        .route(&paths.user_two_factor_verify, post(user::verify_two_factor))
        .route(&paths.user_bindings, get(user::list_bindings))
        .route(
            &paths.user_bind_email,
            post(user::bind_email).delete(user::unbind_email),
        )
        .route(
            &paths.user_bind_phone,
            post(user::bind_phone).delete(user::unbind_phone),
        )
        .route(
            &paths.user_bind_platform,
            post(user::bind_platform).delete(user::unbind_platform),
        )
        .route(
            &paths.generation_catalog_models,
            get(generation::list_generation_catalog_models),
        )
        .route(
            &paths.generation_catalog_styles,
            get(generation::list_generation_catalog_styles),
        )
        .route(
            &paths.generation_catalog_providers,
            get(generation::list_generation_catalog_providers),
        )
        .route(
            &paths.generation_catalog_voices,
            get(generation::list_generation_catalog_voices),
        )
        .route(
            &paths.generation_tasks,
            get(generation::list_generation_tasks),
        )
        .route(
            &paths.generation_task_detail,
            get(generation::read_generation_task).delete(generation::delete_generation_task),
        )
        .route(
            &paths.generation_task_cancel,
            post(generation::cancel_generation_task),
        )
        .route(
            &paths.generation_image_tasks,
            post(generation::create_image_task),
        )
        .route(
            &paths.generation_image_variations,
            post(generation::create_image_variation_task),
        )
        .route(
            &paths.generation_image_edits,
            post(generation::create_image_edit_task),
        )
        .route(
            &paths.generation_image_upscales,
            post(generation::create_image_upscale_task),
        )
        .route(
            &paths.generation_image_prompt_enhance,
            post(generation::enhance_image_prompt),
        )
        .route(
            &paths.generation_image_task_detail,
            get(generation::read_image_task),
        )
        .route(
            &paths.generation_video_tasks,
            post(generation::create_video_task),
        )
        .route(
            &paths.generation_video_image_to_video,
            post(generation::create_image_to_video_task),
        )
        .route(
            &paths.generation_video_extend,
            post(generation::create_video_extend_task),
        )
        .route(
            &paths.generation_video_style_transfer,
            post(generation::create_video_style_transfer_task),
        )
        .route(
            &paths.generation_video_lip_sync,
            post(generation::create_video_lip_sync_task),
        )
        .route(
            &paths.generation_video_prompt_enhance,
            post(generation::enhance_video_prompt),
        )
        .route(
            &paths.generation_video_task_detail,
            get(generation::read_video_task),
        )
        .route(
            &paths.generation_video_task_cancel,
            post(generation::cancel_video_task),
        )
        .route(
            &paths.generation_audio_text_to_speech,
            post(generation::create_audio_text_to_speech_task),
        )
        .route(
            &paths.generation_audio_transcriptions,
            post(generation::create_audio_transcription_task),
        )
        .route(
            &paths.generation_audio_translations,
            post(generation::create_audio_translation_task),
        )
        .route(
            &paths.generation_audio_task_detail,
            get(generation::read_audio_task),
        )
        .route(
            &paths.generation_music_tasks,
            post(generation::create_music_task),
        )
        .route(
            &paths.generation_music_similar,
            post(generation::create_music_similar_task),
        )
        .route(
            &paths.generation_music_remix,
            post(generation::create_music_remix_task),
        )
        .route(
            &paths.generation_music_extend,
            post(generation::create_music_extend_task),
        )
        .route(
            &paths.generation_music_task_detail,
            get(generation::read_music_task),
        )
        .route(
            &paths.generation_sfx_tasks,
            get(generation::list_sfx_tasks).post(generation::create_sfx_task),
        )
        .route(
            &paths.generation_sfx_categories,
            get(generation::list_sfx_categories),
        )
        .route(
            &paths.generation_sfx_task_detail,
            get(generation::read_sfx_task),
        )
        .route(
            &paths.generation_sfx_task_cancel,
            post(generation::cancel_sfx_task),
        )
        .route(
            &paths.generation_character_tasks,
            get(generation::list_character_tasks).post(generation::create_character_task),
        )
        .route(
            &paths.generation_character_task_detail,
            get(generation::read_character_task),
        )
        .route(
            &paths.generation_character_task_cancel,
            post(generation::cancel_character_task),
        )
        .route(&paths.voices_market, get(voices::list_market_voices))
        .route(&paths.voices_workspace, get(voices::list_workspace_voices))
        .route(
            &paths.voices_custom,
            get(voices::list_custom_voices).post(voices::create_custom_voice),
        )
        .route(
            &paths.voice_custom_detail,
            axum::routing::patch(voices::update_custom_voice).delete(voices::delete_custom_voice),
        )
        .route(
            &paths.voice_clone_tasks,
            get(voices::list_clone_tasks).post(voices::create_clone_task),
        )
        .route(
            &paths.voice_clone_task_detail,
            get(voices::read_clone_task).delete(voices::delete_clone_task),
        )
        .route(
            &paths.voice_clone_task_cancel,
            post(voices::cancel_clone_task),
        )
        .route(
            &paths.voice_speech_tasks,
            get(voices::list_speech_tasks).post(voices::create_speech_task),
        )
        .route(
            &paths.voice_speech_task_detail,
            get(voices::read_speech_task)
                .put(voices::upsert_speech_task)
                .patch(voices::update_speech_task)
                .delete(voices::delete_speech_task),
        )
        .route(
            &paths.voice_speech_task_cancel,
            post(voices::cancel_speech_task),
        )
        .route(
            &paths.voice_speaker_preview,
            post(voices::update_voice_preview),
        )
        .route(&paths.voice_speaker_detail, get(voices::read_voice_speaker))
        .route(&paths.prompt_optimize, post(generation::optimize_prompt))
        .route(
            &paths.notes_workspace_snapshot,
            get(notes::read_workspace_snapshot),
        )
        .route(
            &paths.notes,
            get(notes::list_notes).post(notes::create_note),
        )
        .route(&paths.notes_trashed, get(notes::list_trashed_notes))
        .route(
            &paths.note_detail,
            get(notes::read_note)
                .put(notes::update_note)
                .delete(notes::delete_note),
        )
        .route(&paths.note_folders, post(notes::create_note_folder))
        .route(
            &paths.note_folder_detail,
            axum::routing::patch(notes::rename_note_folder).delete(notes::delete_note_folder),
        )
        .route(&paths.notes_clear_trash, post(notes::clear_trash))
        .route(&paths.note_trash, post(notes::trash_note))
        .route(&paths.note_restore, post(notes::restore_note))
        .route(&paths.note_folder_move, post(notes::move_note_folder))
        .route(&paths.note_move, post(notes::move_note))
        .route(&paths.note_publish, post(notes::publish_note))
        .route(&paths.portal_feeds, post(portal::create_feed))
        .route(
            &paths.portal_featured_feeds,
            get(portal::list_featured_feeds),
        )
        .route(
            &paths.portal_discover_feeds,
            get(portal::list_discover_feeds),
        )
        .route(
            &paths.portal_feed_detail,
            get(portal::read_feed).delete(portal::delete_feed),
        )
        .route(&paths.portal_feed_like, post(portal::like_feed))
        .route(&paths.portal_feed_unlike, post(portal::unlike_feed))
        .route(&paths.portal_feed_collect, post(portal::collect_feed))
        .route(&paths.portal_feed_uncollect, post(portal::uncollect_feed))
        .route(&paths.portal_feed_share, post(portal::share_feed))
        .route(
            &paths.trade_tasks_available,
            get(trade::list_available_tasks),
        )
        .route(
            &paths.trade_tasks_published,
            get(trade::list_published_tasks),
        )
        .route(&paths.trade_tasks_accepted, get(trade::list_accepted_tasks))
        .route(&paths.trade_task_detail, get(trade::read_task))
        .route(&paths.trade_task_accept, post(trade::accept_task))
        .route(&paths.trade_task_submit, post(trade::submit_task))
        .route(&paths.trade_task_approve, post(trade::approve_task))
        .route(&paths.trade_task_cancel, post(trade::cancel_task))
        .route(
            &paths.trade_orders,
            get(trade_commerce::list_orders).post(trade_commerce::create_order),
        )
        .route(
            &paths.trade_order_detail,
            get(trade_commerce::read_order).delete(trade_commerce::delete_order),
        )
        .route(
            &paths.trade_order_status,
            post(trade_commerce::update_order_status),
        )
        .route(
            &paths.trade_order_cancel,
            post(trade_commerce::cancel_order),
        )
        .route(
            &paths.trade_order_statistics,
            get(trade_commerce::read_order_statistics),
        )
        .route(
            &paths.trade_payments,
            get(trade_commerce::list_payments).post(trade_commerce::create_payment),
        )
        .route(
            &paths.trade_payment_detail,
            get(trade_commerce::read_payment),
        )
        .route(
            &paths.trade_payment_refund,
            post(trade_commerce::refund_payment),
        )
        .route(
            &paths.trade_payment_recharge,
            post(trade_commerce::recharge),
        )
        .route(&paths.trade_wallet, get(trade_commerce::read_wallet))
        .route(
            &paths.trade_transactions,
            get(trade_commerce::list_transactions),
        )
        .route(&paths.vip_plans, get(vip::list_plans))
        .route(&paths.vip_status, get(vip::read_status))
        .route(&paths.vip_purchase, post(vip::purchase))
        .route(&paths.vip_subscriptions, get(vip::list_subscriptions))
        .route(
            &paths.vip_subscription_cancel,
            post(vip::cancel_subscription),
        )
}

struct AppRoutePaths {
    plugins: String,
    capabilities_summary: String,
    capabilities_domains: String,
    capabilities_execution: String,
    creation_capabilities: String,
    creation_batches: String,
    creation_batch_detail: String,
    creation_batch_materialize: String,
    creation_batch_item_status: String,
    creation_presets: String,
    creation_preset_detail: String,
    creation_templates: String,
    creation_template_detail: String,
    creation_template_apply: String,
    creation_history: String,
    creation_history_entry: String,
    creation_history_favorite: String,
    creation_sessions: String,
    creation_current_session: String,
    creation_current_session_consume: String,
    chat_sessions: String,
    chat_session_detail: String,
    chat_session_transcript: String,
    presentations: String,
    presentation_detail: String,
    presentation_slides: String,
    presentation_slide_detail: String,
    settings: String,
    notifications: String,
    notification_mark_read: String,
    notifications_mark_all_read: String,
    notifications_unread_count: String,
    notifications_delete: String,
    workspaces: String,
    workspace_detail: String,
    workspace_recent_projects: String,
    workspace_projects: String,
    workspace_project_detail: String,
    workspace_project_session: String,
    workspace_project_git_sync: String,
    workspace_project_git_syncs: String,
    workspace_project_latest_git_sync: String,
    workspace_project_git_sync_detail: String,
    workspace_project_git_sync_retry: String,
    workspace_project_releases: String,
    workspace_project_release_stats: String,
    workspace_project_release_prune: String,
    workspace_project_release_retention_policy: String,
    workspace_project_release_retention_policy_apply: String,
    workspace_project_latest_release: String,
    workspace_project_release_detail: String,
    workspace_project_release_restore: String,
    workspace_project_release_manifest: String,
    workspace_project_release_artifact: String,
    workspace_project_release_rebuild: String,
    workspace_project_open: String,
    workspace_project_duplicate: String,
    workspace_project_archive: String,
    workspace_project_restore: String,
    assets: String,
    assets_stats: String,
    asset_categories: String,
    asset_import_file: String,
    asset_import_url: String,
    asset_detail: String,
    drive_root: String,
    drive_entries: String,
    drive_stats: String,
    drive_file_content: String,
    drive_folders: String,
    drive_uploads: String,
    drive_import_file: String,
    drive_rename: String,
    drive_move: String,
    drive_delete: String,
    drive_restore: String,
    drive_empty_trash: String,
    drive_favorites: String,
    film_projects: String,
    film_presets: String,
    film_templates: String,
    film_template_detail: String,
    film_template_instantiate: String,
    film_project_detail: String,
    film_project_graph: String,
    film_project_asset_inventory: String,
    film_project_publishes: String,
    film_project_review_queue: String,
    film_project_review_portfolio_dashboard: String,
    film_project_review_reviewer_capacity: String,
    film_project_review_decision_freshness: String,
    film_project_review_governance_drift: String,
    film_project_review_escalation_forecast: String,
    film_project_review_dependency_graph: String,
    film_project_review_intervention_plan: String,
    film_project_review_recovery_orchestration: String,
    film_project_review_approval_burn_down: String,
    film_project_review_intervention_outcomes: String,
    film_project_review_effectiveness_baseline: String,
    film_project_review_intervention_execution_history: String,
    film_project_publish_detail: String,
    film_project_publish_review_state: String,
    film_project_publish_review_timeline: String,
    film_project_publish_review_rounds: String,
    film_project_publish_review_anchors: String,
    film_project_publish_review_activity: String,
    film_project_publish_review_anchor_responsibility: String,
    film_project_publish_review_reviewer_backlog: String,
    film_project_publish_review_decision_matrix: String,
    film_project_publish_review_readiness: String,
    film_project_publish_review_reviewer_attention: String,
    film_project_publish_review_reviewer_coverage: String,
    film_project_publish_review_operations_dashboard: String,
    film_project_publish_review_stale_decisions: String,
    film_project_publish_review_latency_analytics: String,
    film_project_publish_review_worklist: String,
    film_project_publish_approve: String,
    film_project_publish_request_changes: String,
    film_project_publish_review_comments: String,
    film_project_publish_review_submit: String,
    film_project_publish_review_consensus: String,
    film_project_publish_review_assignments: String,
    film_project_publish_review_comment_resolve: String,
    film_project_publish_reopen: String,
    film_project_publish_restore: String,
    film_project_publish_artifact_content: String,
    film_project_template_snapshots: String,
    film_analysis_script: String,
    film_standardize_script: String,
    film_prepare_analysis: String,
    film_rebuild_storyboard: String,
    film_create_scene_breakdown: String,
    film_generate_shot_variants: String,
    film_create_shooting_plan: String,
    film_analysis_characters: String,
    film_analysis_props: String,
    film_storyboard_generate: String,
    film_shots_sync: String,
    film_authoring_batch: String,
    film_refresh_analysis: String,
    film_apply_preset: String,
    film_assets_relink: String,
    film_assets_bind: String,
    film_export_package: String,
    film_publish_storyboard: String,
    film_import_package: String,
    film_validate_project: String,
    magiccut_projects: String,
    magiccut_project_detail: String,
    magiccut_project_duplicate: String,
    magiccut_templates: String,
    magiccut_template_detail: String,
    magiccut_template_instantiate: String,
    magiccut_render_capabilities: String,
    magiccut_renders: String,
    magiccut_project_renders: String,
    magiccut_render_detail: String,
    magiccut_render_cancel: String,
    magiccut_render_artifacts: String,
    magiccut_render_artifact_content: String,
    auth_session: String,
    auth_login: String,
    auth_login_phone: String,
    auth_register: String,
    auth_logout: String,
    auth_refresh_token: String,
    auth_verify_code_send: String,
    auth_verify_code_check: String,
    auth_password_reset_request: String,
    auth_password_reset_confirm: String,
    auth_qr_code: String,
    auth_qr_code_detail: String,
    user_profile: String,
    user_avatar: String,
    user_settings: String,
    user_change_password: String,
    user_addresses: String,
    user_default_address: String,
    user_address_detail: String,
    user_address_set_default: String,
    user_login_history: String,
    user_generation_history: String,
    user_sessions: String,
    user_session_detail: String,
    user_devices: String,
    user_device_detail: String,
    user_two_factor: String,
    user_two_factor_setup: String,
    user_two_factor_verify: String,
    user_bindings: String,
    user_bind_email: String,
    user_bind_phone: String,
    user_bind_platform: String,
    generation_catalog_models: String,
    generation_catalog_styles: String,
    generation_catalog_providers: String,
    generation_catalog_voices: String,
    generation_tasks: String,
    generation_task_detail: String,
    generation_task_cancel: String,
    generation_image_tasks: String,
    generation_image_variations: String,
    generation_image_edits: String,
    generation_image_upscales: String,
    generation_image_prompt_enhance: String,
    generation_image_task_detail: String,
    generation_video_tasks: String,
    generation_video_image_to_video: String,
    generation_video_extend: String,
    generation_video_style_transfer: String,
    generation_video_lip_sync: String,
    generation_video_prompt_enhance: String,
    generation_video_task_detail: String,
    generation_video_task_cancel: String,
    generation_audio_text_to_speech: String,
    generation_audio_transcriptions: String,
    generation_audio_translations: String,
    generation_audio_task_detail: String,
    generation_music_tasks: String,
    generation_music_similar: String,
    generation_music_remix: String,
    generation_music_extend: String,
    generation_music_task_detail: String,
    generation_sfx_tasks: String,
    generation_sfx_categories: String,
    generation_sfx_task_detail: String,
    generation_sfx_task_cancel: String,
    generation_character_tasks: String,
    generation_character_task_detail: String,
    generation_character_task_cancel: String,
    voices_market: String,
    voices_workspace: String,
    voices_custom: String,
    voice_custom_detail: String,
    voice_speaker_detail: String,
    voice_speaker_preview: String,
    voice_clone_tasks: String,
    voice_clone_task_detail: String,
    voice_clone_task_cancel: String,
    voice_speech_tasks: String,
    voice_speech_task_detail: String,
    voice_speech_task_cancel: String,
    prompt_optimize: String,
    notes_workspace_snapshot: String,
    notes: String,
    notes_trashed: String,
    note_detail: String,
    note_folders: String,
    note_folder_detail: String,
    notes_clear_trash: String,
    note_trash: String,
    note_restore: String,
    note_folder_move: String,
    note_move: String,
    note_publish: String,
    portal_feeds: String,
    portal_featured_feeds: String,
    portal_discover_feeds: String,
    portal_feed_detail: String,
    portal_feed_like: String,
    portal_feed_unlike: String,
    portal_feed_collect: String,
    portal_feed_uncollect: String,
    portal_feed_share: String,
    trade_tasks_available: String,
    trade_tasks_published: String,
    trade_tasks_accepted: String,
    trade_task_detail: String,
    trade_task_accept: String,
    trade_task_submit: String,
    trade_task_approve: String,
    trade_task_cancel: String,
    trade_orders: String,
    trade_order_detail: String,
    trade_order_status: String,
    trade_order_cancel: String,
    trade_order_statistics: String,
    trade_payments: String,
    trade_payment_detail: String,
    trade_payment_refund: String,
    trade_payment_recharge: String,
    trade_wallet: String,
    trade_transactions: String,
    vip_plans: String,
    vip_status: String,
    vip_purchase: String,
    vip_subscriptions: String,
    vip_subscription_cancel: String,
}

impl AppRoutePaths {
    fn from_state(state: &AppState) -> Self {
        Self {
            plugins: state.contract.require_route_path_by_id("appPluginsList"),
            capabilities_summary: state
                .contract
                .require_route_path_by_id("appCapabilitiesReadSummary"),
            capabilities_domains: state
                .contract
                .require_route_path_by_id("appCapabilitiesListDomains"),
            capabilities_execution: state
                .contract
                .require_route_path_by_id("appCapabilitiesListExecution"),
            creation_capabilities: state
                .contract
                .require_route_path_by_id("appCreationReadCapabilities"),
            creation_batches: state
                .contract
                .require_route_path_by_id("appCreationListBatches"),
            creation_batch_detail: state
                .contract
                .axum_path_for_route_id("appCreationReadBatch"),
            creation_batch_materialize: state
                .contract
                .axum_path_for_route_id("appCreationMaterializeBatch"),
            creation_batch_item_status: state
                .contract
                .axum_path_for_route_id("appCreationUpdateBatchItemStatus"),
            creation_presets: state
                .contract
                .require_route_path_by_id("appCreationListPresets"),
            creation_preset_detail: state
                .contract
                .axum_path_for_route_id("appCreationReadPreset"),
            creation_templates: state
                .contract
                .require_route_path_by_id("appCreationListTemplates"),
            creation_template_detail: state
                .contract
                .axum_path_for_route_id("appCreationReadTemplate"),
            creation_template_apply: state
                .contract
                .axum_path_for_route_id("appCreationApplyTemplate"),
            creation_history: state
                .contract
                .require_route_path_by_id("appCreationListHistory"),
            creation_history_entry: state
                .contract
                .axum_path_for_route_id("appCreationReadHistoryEntry"),
            creation_history_favorite: state
                .contract
                .axum_path_for_route_id("appCreationFavoriteHistoryEntry"),
            creation_sessions: state
                .contract
                .require_route_path_by_id("appCreationCreateSession"),
            creation_current_session: state
                .contract
                .require_route_path_by_id("appCreationReadCurrentSession"),
            creation_current_session_consume: state
                .contract
                .require_route_path_by_id("appCreationConsumeCurrentSession"),
            chat_sessions: state
                .contract
                .require_route_path_by_id("appChatListSessions"),
            chat_session_detail: state.contract.axum_path_for_route_id("appChatReadSession"),
            chat_session_transcript: state
                .contract
                .axum_path_for_route_id("appChatReadTranscript"),
            presentations: state
                .contract
                .require_route_path_by_id("appPresentationsList"),
            presentation_detail: state
                .contract
                .axum_path_for_route_id("appPresentationsRead"),
            presentation_slides: state
                .contract
                .axum_path_for_route_id("appPresentationsCreateSlide"),
            presentation_slide_detail: state
                .contract
                .axum_path_for_route_id("appPresentationsUpdateSlide"),
            settings: state.contract.require_route_path_by_id("appSettingsRead"),
            notifications: state
                .contract
                .require_route_path_by_id("appNotificationsList"),
            notification_mark_read: state
                .contract
                .axum_path_for_route_id("appNotificationsMarkRead"),
            notifications_mark_all_read: state
                .contract
                .require_route_path_by_id("appNotificationsMarkAllRead"),
            notifications_unread_count: state
                .contract
                .require_route_path_by_id("appNotificationsReadUnreadCount"),
            notifications_delete: state
                .contract
                .require_route_path_by_id("appNotificationsDeleteBatch"),
            workspaces: state.contract.require_route_path_by_id("appWorkspacesList"),
            workspace_detail: state.contract.axum_path_for_route_id("appWorkspacesRead"),
            workspace_recent_projects: state
                .contract
                .require_route_path_by_id("appWorkspaceProjectsListRecent"),
            workspace_projects: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsList"),
            workspace_project_detail: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsRead"),
            workspace_project_session: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadSession"),
            workspace_project_git_sync: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsGitSync"),
            workspace_project_git_syncs: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsListGitSyncs"),
            workspace_project_latest_git_sync: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadLatestGitSync"),
            workspace_project_git_sync_detail: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadGitSync"),
            workspace_project_git_sync_retry: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsRetryGitSync"),
            workspace_project_releases: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsListReleases"),
            workspace_project_release_stats: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadReleaseStats"),
            workspace_project_release_prune: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsPruneReleases"),
            workspace_project_release_retention_policy: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadReleaseRetentionPolicy"),
            workspace_project_release_retention_policy_apply: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsApplyReleaseRetentionPolicy"),
            workspace_project_latest_release: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadLatestRelease"),
            workspace_project_release_detail: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadRelease"),
            workspace_project_release_restore: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsRestoreRelease"),
            workspace_project_release_manifest: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadReleaseManifest"),
            workspace_project_release_artifact: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsReadReleaseArtifact"),
            workspace_project_release_rebuild: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsRebuildRelease"),
            workspace_project_open: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsOpen"),
            workspace_project_duplicate: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsDuplicate"),
            workspace_project_archive: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsArchive"),
            workspace_project_restore: state
                .contract
                .axum_path_for_route_id("appWorkspaceProjectsRestore"),
            assets: state.contract.require_route_path_by_id("appAssetsList"),
            assets_stats: state
                .contract
                .require_route_path_by_id("appAssetsReadStats"),
            asset_categories: state
                .contract
                .require_route_path_by_id("appAssetsListCategories"),
            asset_import_file: state
                .contract
                .require_route_path_by_id("appAssetsImportFile"),
            asset_import_url: state
                .contract
                .require_route_path_by_id("appAssetsImportUrl"),
            asset_detail: state.contract.axum_path_for_route_id("appAssetsRead"),
            drive_root: state.contract.require_route_path_by_id("appDriveReadRoot"),
            drive_entries: state
                .contract
                .require_route_path_by_id("appDriveListEntries"),
            drive_stats: state.contract.require_route_path_by_id("appDriveReadStats"),
            drive_file_content: state
                .contract
                .axum_path_for_route_id("appDriveReadFileContent"),
            drive_folders: state
                .contract
                .require_route_path_by_id("appDriveCreateFolder"),
            drive_uploads: state
                .contract
                .require_route_path_by_id("appDriveUploadFile"),
            drive_import_file: state
                .contract
                .require_route_path_by_id("appDriveImportFile"),
            drive_rename: state
                .contract
                .require_route_path_by_id("appDriveRenameItem"),
            drive_move: state.contract.require_route_path_by_id("appDriveMoveItems"),
            drive_delete: state
                .contract
                .require_route_path_by_id("appDriveDeleteItems"),
            drive_restore: state
                .contract
                .require_route_path_by_id("appDriveRestoreItems"),
            drive_empty_trash: state
                .contract
                .require_route_path_by_id("appDriveEmptyTrash"),
            drive_favorites: state
                .contract
                .require_route_path_by_id("appDriveFavoriteItem"),
            film_projects: state
                .contract
                .require_route_path_by_id("appFilmProjectsList"),
            film_presets: state
                .contract
                .require_route_path_by_id("appFilmPresetsList"),
            film_templates: state
                .contract
                .require_route_path_by_id("appFilmTemplatesList"),
            film_template_detail: state
                .contract
                .axum_path_for_route_id("appFilmTemplatesRead"),
            film_template_instantiate: state
                .contract
                .axum_path_for_route_id("appFilmTemplatesInstantiate"),
            film_project_detail: state.contract.axum_path_for_route_id("appFilmProjectsRead"),
            film_project_graph: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadProjectGraph"),
            film_project_asset_inventory: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadAssetInventory"),
            film_project_publishes: state
                .contract
                .axum_path_for_route_id("appFilmProjectsListPublishes"),
            film_project_review_queue: state
                .contract
                .axum_path_for_route_id("appFilmProjectsListReviewQueue"),
            film_project_review_portfolio_dashboard: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewPortfolioDashboard"),
            film_project_review_reviewer_capacity: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewReviewerCapacity"),
            film_project_review_decision_freshness: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewDecisionFreshness"),
            film_project_review_governance_drift: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewGovernanceDrift"),
            film_project_review_escalation_forecast: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewEscalationForecast"),
            film_project_review_dependency_graph: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewDependencyGraph"),
            film_project_review_intervention_plan: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewInterventionPlan"),
            film_project_review_recovery_orchestration: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewRecoveryOrchestration"),
            film_project_review_approval_burn_down: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewApprovalBurnDown"),
            film_project_review_intervention_outcomes: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewInterventionOutcomes"),
            film_project_review_effectiveness_baseline: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewEffectivenessBaseline"),
            film_project_review_intervention_execution_history: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadReviewInterventionExecutionHistory"),
            film_project_publish_detail: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublish"),
            film_project_publish_review_state: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewState"),
            film_project_publish_review_timeline: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewTimeline"),
            film_project_publish_review_rounds: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewRounds"),
            film_project_publish_review_anchors: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewAnchors"),
            film_project_publish_review_activity: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewActivity"),
            film_project_publish_review_anchor_responsibility: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewAnchorResponsibility"),
            film_project_publish_review_reviewer_backlog: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewReviewerBacklog"),
            film_project_publish_review_decision_matrix: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewDecisionMatrix"),
            film_project_publish_review_readiness: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewReadiness"),
            film_project_publish_review_reviewer_attention: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewReviewerAttention"),
            film_project_publish_review_reviewer_coverage: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewReviewerCoverage"),
            film_project_publish_review_operations_dashboard: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewOperationsDashboard"),
            film_project_publish_review_stale_decisions: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewStaleDecisions"),
            film_project_publish_review_latency_analytics: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewLatencyAnalytics"),
            film_project_publish_review_worklist: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishReviewWorklist"),
            film_project_publish_approve: state
                .contract
                .axum_path_for_route_id("appFilmProjectsApprovePublish"),
            film_project_publish_request_changes: state
                .contract
                .axum_path_for_route_id("appFilmProjectsRequestPublishChanges"),
            film_project_publish_review_comments: state
                .contract
                .axum_path_for_route_id("appFilmProjectsCreatePublishReviewComment"),
            film_project_publish_review_submit: state
                .contract
                .axum_path_for_route_id("appFilmProjectsSubmitPublishReview"),
            film_project_publish_review_consensus: state
                .contract
                .axum_path_for_route_id("appFilmProjectsConsensusPublishReview"),
            film_project_publish_review_assignments: state
                .contract
                .axum_path_for_route_id("appFilmProjectsSetPublishReviewAssignments"),
            film_project_publish_review_comment_resolve: state
                .contract
                .axum_path_for_route_id("appFilmProjectsResolvePublishReviewComment"),
            film_project_publish_reopen: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReopenPublish"),
            film_project_publish_restore: state
                .contract
                .axum_path_for_route_id("appFilmProjectsRestorePublish"),
            film_project_publish_artifact_content: state
                .contract
                .axum_path_for_route_id("appFilmProjectsReadPublishArtifactContent"),
            film_project_template_snapshots: state
                .contract
                .axum_path_for_route_id("appFilmProjectsCreateTemplateSnapshot"),
            film_analysis_script: state
                .contract
                .require_route_path_by_id("appFilmAnalysisScript"),
            film_standardize_script: state
                .contract
                .axum_path_for_route_id("appFilmProjectsStandardizeScript"),
            film_prepare_analysis: state
                .contract
                .axum_path_for_route_id("appFilmProjectsPrepareAnalysis"),
            film_rebuild_storyboard: state
                .contract
                .axum_path_for_route_id("appFilmProjectsRebuildStoryboard"),
            film_create_scene_breakdown: state
                .contract
                .axum_path_for_route_id("appFilmProjectsCreateSceneBreakdown"),
            film_generate_shot_variants: state
                .contract
                .axum_path_for_route_id("appFilmProjectsGenerateShotVariants"),
            film_create_shooting_plan: state
                .contract
                .axum_path_for_route_id("appFilmProjectsCreateShootingPlan"),
            film_analysis_characters: state
                .contract
                .require_route_path_by_id("appFilmAnalysisCharacters"),
            film_analysis_props: state
                .contract
                .require_route_path_by_id("appFilmAnalysisProps"),
            film_storyboard_generate: state
                .contract
                .axum_path_for_route_id("appFilmProjectsGenerateStoryboard"),
            film_shots_sync: state
                .contract
                .axum_path_for_route_id("appFilmProjectsSyncShots"),
            film_authoring_batch: state
                .contract
                .axum_path_for_route_id("appFilmProjectsRunAuthoringBatch"),
            film_refresh_analysis: state
                .contract
                .axum_path_for_route_id("appFilmProjectsRefreshAnalysis"),
            film_apply_preset: state
                .contract
                .axum_path_for_route_id("appFilmProjectsApplyPreset"),
            film_assets_relink: state
                .contract
                .axum_path_for_route_id("appFilmProjectsRelinkAssets"),
            film_assets_bind: state
                .contract
                .axum_path_for_route_id("appFilmProjectsBindAsset"),
            film_export_package: state
                .contract
                .axum_path_for_route_id("appFilmProjectsExportPackage"),
            film_publish_storyboard: state
                .contract
                .axum_path_for_route_id("appFilmProjectsPublishStoryboard"),
            film_import_package: state
                .contract
                .require_route_path_by_id("appFilmProjectsImportPackage"),
            film_validate_project: state
                .contract
                .require_route_path_by_id("appFilmProjectsValidate"),
            magiccut_projects: state
                .contract
                .require_route_path_by_id("appMagicCutProjectsList"),
            magiccut_project_detail: state
                .contract
                .axum_path_for_route_id("appMagicCutProjectsRead"),
            magiccut_project_duplicate: state
                .contract
                .axum_path_for_route_id("appMagicCutProjectsDuplicate"),
            magiccut_templates: state
                .contract
                .require_route_path_by_id("appMagicCutTemplatesList"),
            magiccut_template_detail: state
                .contract
                .axum_path_for_route_id("appMagicCutTemplatesRead"),
            magiccut_template_instantiate: state
                .contract
                .axum_path_for_route_id("appMagicCutTemplatesInstantiate"),
            magiccut_render_capabilities: state
                .contract
                .require_route_path_by_id("appMagicCutReadRenderCapabilities"),
            magiccut_renders: state
                .contract
                .require_route_path_by_id("appMagicCutListRenders"),
            magiccut_project_renders: state
                .contract
                .axum_path_for_route_id("appMagicCutCreateRender"),
            magiccut_render_detail: state
                .contract
                .axum_path_for_route_id("appMagicCutReadRender"),
            magiccut_render_cancel: state
                .contract
                .axum_path_for_route_id("appMagicCutCancelRender"),
            magiccut_render_artifacts: state
                .contract
                .axum_path_for_route_id("appMagicCutListRenderArtifacts"),
            magiccut_render_artifact_content: state
                .contract
                .axum_path_for_route_id("appMagicCutReadRenderArtifactContent"),
            auth_session: state
                .contract
                .require_route_path_by_id("appAuthReadSession"),
            auth_login: state.contract.require_route_path_by_id("appAuthLogin"),
            auth_login_phone: state
                .contract
                .require_route_path_by_id("appAuthLoginWithPhone"),
            auth_register: state.contract.require_route_path_by_id("appAuthRegister"),
            auth_logout: state.contract.require_route_path_by_id("appAuthLogout"),
            auth_refresh_token: state
                .contract
                .require_route_path_by_id("appAuthRefreshToken"),
            auth_verify_code_send: state
                .contract
                .require_route_path_by_id("appAuthSendVerifyCode"),
            auth_verify_code_check: state
                .contract
                .require_route_path_by_id("appAuthCheckVerifyCode"),
            auth_password_reset_request: state
                .contract
                .require_route_path_by_id("appAuthRequestPasswordReset"),
            auth_password_reset_confirm: state
                .contract
                .require_route_path_by_id("appAuthResetPassword"),
            auth_qr_code: state
                .contract
                .require_route_path_by_id("appAuthCreateQrCode"),
            auth_qr_code_detail: state
                .contract
                .axum_path_for_route_id("appAuthReadQrCodeStatus"),
            user_profile: state
                .contract
                .require_route_path_by_id("appUserReadProfile"),
            user_avatar: state
                .contract
                .require_route_path_by_id("appUserUploadAvatar"),
            user_settings: state
                .contract
                .require_route_path_by_id("appUserReadSettings"),
            user_change_password: state
                .contract
                .require_route_path_by_id("appUserChangePassword"),
            user_addresses: state
                .contract
                .require_route_path_by_id("appUserListAddresses"),
            user_default_address: state
                .contract
                .require_route_path_by_id("appUserReadDefaultAddress"),
            user_address_detail: state
                .contract
                .axum_path_for_route_id("appUserUpdateAddress"),
            user_address_set_default: state
                .contract
                .axum_path_for_route_id("appUserSetDefaultAddress"),
            user_login_history: state
                .contract
                .require_route_path_by_id("appUserReadLoginHistory"),
            user_generation_history: state
                .contract
                .require_route_path_by_id("appUserReadGenerationHistory"),
            user_sessions: state
                .contract
                .require_route_path_by_id("appUserListSessions"),
            user_session_detail: state
                .contract
                .axum_path_for_route_id("appUserRevokeSession"),
            user_devices: state
                .contract
                .require_route_path_by_id("appUserListDevices"),
            user_device_detail: state.contract.axum_path_for_route_id("appUserRevokeDevice"),
            user_two_factor: state
                .contract
                .require_route_path_by_id("appUserReadTwoFactorStatus"),
            user_two_factor_setup: state
                .contract
                .require_route_path_by_id("appUserSetupTwoFactor"),
            user_two_factor_verify: state
                .contract
                .require_route_path_by_id("appUserVerifyTwoFactor"),
            user_bindings: state
                .contract
                .require_route_path_by_id("appUserListBindings"),
            user_bind_email: state.contract.require_route_path_by_id("appUserBindEmail"),
            user_bind_phone: state.contract.require_route_path_by_id("appUserBindPhone"),
            user_bind_platform: state
                .contract
                .axum_path_for_route_id("appUserBindThirdParty"),
            generation_catalog_models: state
                .contract
                .require_route_path_by_id("appGenerationCatalogListModels"),
            generation_catalog_styles: state
                .contract
                .require_route_path_by_id("appGenerationCatalogListStyles"),
            generation_catalog_providers: state
                .contract
                .require_route_path_by_id("appGenerationCatalogListProviders"),
            generation_catalog_voices: state
                .contract
                .require_route_path_by_id("appGenerationCatalogListVoices"),
            generation_tasks: state
                .contract
                .require_route_path_by_id("appGenerationListTasks"),
            generation_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationReadTask"),
            generation_task_cancel: state
                .contract
                .axum_path_for_route_id("appGenerationCancelTask"),
            generation_image_tasks: state
                .contract
                .require_route_path_by_id("appGenerationImagesCreateTask"),
            generation_image_variations: state
                .contract
                .require_route_path_by_id("appGenerationImagesCreateVariation"),
            generation_image_edits: state
                .contract
                .require_route_path_by_id("appGenerationImagesCreateEdit"),
            generation_image_upscales: state
                .contract
                .require_route_path_by_id("appGenerationImagesCreateUpscale"),
            generation_image_prompt_enhance: state
                .contract
                .require_route_path_by_id("appGenerationImagesEnhancePrompt"),
            generation_image_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationImagesReadTask"),
            generation_video_tasks: state
                .contract
                .require_route_path_by_id("appGenerationVideosCreateTask"),
            generation_video_image_to_video: state
                .contract
                .require_route_path_by_id("appGenerationVideosCreateImageToVideo"),
            generation_video_extend: state
                .contract
                .require_route_path_by_id("appGenerationVideosCreateExtend"),
            generation_video_style_transfer: state
                .contract
                .require_route_path_by_id("appGenerationVideosCreateStyleTransfer"),
            generation_video_lip_sync: state
                .contract
                .require_route_path_by_id("appGenerationVideosCreateLipSync"),
            generation_video_prompt_enhance: state
                .contract
                .require_route_path_by_id("appGenerationVideosEnhancePrompt"),
            generation_video_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationVideosReadTask"),
            generation_video_task_cancel: state
                .contract
                .axum_path_for_route_id("appGenerationVideosCancelTask"),
            generation_audio_text_to_speech: state
                .contract
                .require_route_path_by_id("appGenerationAudioCreateTextToSpeech"),
            generation_audio_transcriptions: state
                .contract
                .require_route_path_by_id("appGenerationAudioCreateTranscription"),
            generation_audio_translations: state
                .contract
                .require_route_path_by_id("appGenerationAudioCreateTranslation"),
            generation_audio_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationAudioReadTask"),
            generation_music_tasks: state
                .contract
                .require_route_path_by_id("appGenerationMusicCreateTask"),
            generation_music_similar: state
                .contract
                .require_route_path_by_id("appGenerationMusicCreateSimilar"),
            generation_music_remix: state
                .contract
                .require_route_path_by_id("appGenerationMusicCreateRemix"),
            generation_music_extend: state
                .contract
                .require_route_path_by_id("appGenerationMusicCreateExtend"),
            generation_music_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationMusicReadTask"),
            generation_sfx_tasks: state
                .contract
                .require_route_path_by_id("appGenerationSfxCreateTask"),
            generation_sfx_categories: state
                .contract
                .require_route_path_by_id("appGenerationSfxListCategories"),
            generation_sfx_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationSfxReadTask"),
            generation_sfx_task_cancel: state
                .contract
                .axum_path_for_route_id("appGenerationSfxCancelTask"),
            generation_character_tasks: state
                .contract
                .require_route_path_by_id("appGenerationCharactersListTasks"),
            generation_character_task_detail: state
                .contract
                .axum_path_for_route_id("appGenerationCharactersReadTask"),
            generation_character_task_cancel: state
                .contract
                .axum_path_for_route_id("appGenerationCharactersCancelTask"),
            voices_market: state
                .contract
                .require_route_path_by_id("appVoicesListMarket"),
            voices_workspace: state
                .contract
                .require_route_path_by_id("appVoicesListWorkspace"),
            voices_custom: state
                .contract
                .require_route_path_by_id("appVoicesListCustom"),
            voice_custom_detail: state
                .contract
                .axum_path_for_route_id("appVoicesUpdateCustom"),
            voice_speaker_detail: state
                .contract
                .axum_path_for_route_id("appVoicesReadSpeaker"),
            voice_speaker_preview: state
                .contract
                .axum_path_for_route_id("appVoicesUpdatePreview"),
            voice_clone_tasks: state
                .contract
                .require_route_path_by_id("appVoicesListCloneTasks"),
            voice_clone_task_detail: state
                .contract
                .axum_path_for_route_id("appVoicesReadCloneTask"),
            voice_clone_task_cancel: state
                .contract
                .axum_path_for_route_id("appVoicesCancelCloneTask"),
            voice_speech_tasks: state
                .contract
                .require_route_path_by_id("appVoicesListSpeechTasks"),
            voice_speech_task_detail: state
                .contract
                .axum_path_for_route_id("appVoicesReadSpeechTask"),
            voice_speech_task_cancel: state
                .contract
                .axum_path_for_route_id("appVoicesCancelSpeechTask"),
            prompt_optimize: state.contract.require_route_path_by_id("appPromptOptimize"),
            notes_workspace_snapshot: state
                .contract
                .require_route_path_by_id("appNotesWorkspaceSnapshot"),
            notes: state.contract.require_route_path_by_id("appNotesList"),
            notes_trashed: state
                .contract
                .require_route_path_by_id("appNotesListTrashed"),
            note_detail: state.contract.axum_path_for_route_id("appNotesRead"),
            note_folders: state
                .contract
                .require_route_path_by_id("appNotesCreateFolder"),
            note_folder_detail: state
                .contract
                .axum_path_for_route_id("appNotesRenameFolder"),
            notes_clear_trash: state
                .contract
                .require_route_path_by_id("appNotesClearTrash"),
            note_trash: state.contract.axum_path_for_route_id("appNotesTrash"),
            note_restore: state.contract.axum_path_for_route_id("appNotesRestore"),
            note_folder_move: state.contract.axum_path_for_route_id("appNotesMoveFolder"),
            note_move: state.contract.axum_path_for_route_id("appNotesMove"),
            note_publish: state.contract.axum_path_for_route_id("appNotesPublish"),
            portal_feeds: state
                .contract
                .axum_path_for_route_id("appPortalFeedsCreate"),
            portal_featured_feeds: state
                .contract
                .require_route_path_by_id("appPortalFeedsListFeatured"),
            portal_discover_feeds: state
                .contract
                .require_route_path_by_id("appPortalFeedsListDiscover"),
            portal_feed_detail: state.contract.axum_path_for_route_id("appPortalFeedsRead"),
            portal_feed_like: state.contract.axum_path_for_route_id("appPortalFeedsLike"),
            portal_feed_unlike: state
                .contract
                .axum_path_for_route_id("appPortalFeedsUnlike"),
            portal_feed_collect: state
                .contract
                .axum_path_for_route_id("appPortalFeedsCollect"),
            portal_feed_uncollect: state
                .contract
                .axum_path_for_route_id("appPortalFeedsUncollect"),
            portal_feed_share: state.contract.axum_path_for_route_id("appPortalFeedsShare"),
            trade_tasks_available: state
                .contract
                .require_route_path_by_id("appTradeTasksListAvailable"),
            trade_tasks_published: state
                .contract
                .require_route_path_by_id("appTradeTasksListPublished"),
            trade_tasks_accepted: state
                .contract
                .require_route_path_by_id("appTradeTasksListAccepted"),
            trade_task_detail: state.contract.axum_path_for_route_id("appTradeTasksRead"),
            trade_task_accept: state.contract.axum_path_for_route_id("appTradeTasksAccept"),
            trade_task_submit: state.contract.axum_path_for_route_id("appTradeTasksSubmit"),
            trade_task_approve: state
                .contract
                .axum_path_for_route_id("appTradeTasksApprove"),
            trade_task_cancel: state.contract.axum_path_for_route_id("appTradeTasksCancel"),
            trade_orders: state.contract.axum_path_for_route_id("appTradeOrdersList"),
            trade_order_detail: state.contract.axum_path_for_route_id("appTradeOrdersRead"),
            trade_order_status: state
                .contract
                .axum_path_for_route_id("appTradeOrdersUpdateStatus"),
            trade_order_cancel: state
                .contract
                .axum_path_for_route_id("appTradeOrdersCancel"),
            trade_order_statistics: state
                .contract
                .axum_path_for_route_id("appTradeOrdersReadStatistics"),
            trade_payments: state
                .contract
                .axum_path_for_route_id("appTradePaymentsList"),
            trade_payment_detail: state
                .contract
                .axum_path_for_route_id("appTradePaymentsRead"),
            trade_payment_refund: state
                .contract
                .axum_path_for_route_id("appTradePaymentsRefund"),
            trade_payment_recharge: state
                .contract
                .axum_path_for_route_id("appTradePaymentsRecharge"),
            trade_wallet: state.contract.axum_path_for_route_id("appTradeWalletRead"),
            trade_transactions: state
                .contract
                .axum_path_for_route_id("appTradeTransactionsList"),
            vip_plans: state.contract.axum_path_for_route_id("appVipPlansList"),
            vip_status: state.contract.axum_path_for_route_id("appVipReadStatus"),
            vip_purchase: state.contract.axum_path_for_route_id("appVipPurchase"),
            vip_subscriptions: state
                .contract
                .axum_path_for_route_id("appVipSubscriptionsList"),
            vip_subscription_cancel: state
                .contract
                .axum_path_for_route_id("appVipSubscriptionsCancel"),
        }
    }
}
