mod compression;
mod database;
mod discovery;
mod filesystem;
mod governance;
mod jobs;
mod media;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

pub fn mount_routes(router: Router<AppState>, state: &AppState) -> Router<AppState> {
    let paths = CoreRoutePaths::from_state(state);

    router
        .route(&paths.health, get(discovery::healthz))
        .route(&paths.live_open_api, get(discovery::openapi_json))
        .route(&paths.open_api, get(discovery::openapi_json))
        .route(&paths.route_catalog, get(discovery::route_catalog))
        .route(&paths.runtime_summary, get(discovery::runtime_summary))
        .route(
            &paths.toolkit_capabilities,
            get(discovery::toolkit_capabilities),
        )
        .route(
            &paths.filesystem_read_dir,
            post(filesystem::filesystem_read_dir),
        )
        .route(
            &paths.filesystem_read_text,
            post(filesystem::filesystem_read_text),
        )
        .route(
            &paths.filesystem_read_bytes,
            post(filesystem::filesystem_read_bytes),
        )
        .route(
            &paths.filesystem_write_text,
            post(filesystem::filesystem_write_text),
        )
        .route(
            &paths.filesystem_write_bytes,
            post(filesystem::filesystem_write_bytes),
        )
        .route(&paths.filesystem_stat, post(filesystem::filesystem_stat))
        .route(
            &paths.filesystem_exists,
            post(filesystem::filesystem_exists),
        )
        .route(
            &paths.filesystem_ensure_dir,
            post(filesystem::filesystem_ensure_dir),
        )
        .route(
            &paths.filesystem_remove,
            post(filesystem::filesystem_remove),
        )
        .route(
            &paths.filesystem_rename,
            post(filesystem::filesystem_rename),
        )
        .route(
            &paths.filesystem_copy_file,
            post(filesystem::filesystem_copy_file),
        )
        .route(&paths.media_probe, post(media::media_probe))
        .route(&paths.media_image_resize, post(media::media_image_resize))
        .route(&paths.media_video_concat, post(media::media_video_concat))
        .route(
            &paths.media_video_transcode,
            post(media::media_video_transcode),
        )
        .route(&paths.media_video_trim, post(media::media_video_trim))
        .route(
            &paths.media_video_extract_audio,
            post(media::media_video_extract_audio),
        )
        .route(
            &paths.media_video_thumbnail,
            post(media::media_video_thumbnail),
        )
        .route(&paths.media_audio_convert, post(media::media_audio_convert))
        .route(
            &paths.media_audio_normalize,
            post(media::media_audio_normalize),
        )
        .route(&paths.media_audio_mix, post(media::media_audio_mix))
        .route(&paths.compression_zip, post(compression::compression_zip))
        .route(
            &paths.compression_unzip,
            post(compression::compression_unzip),
        )
        .route(&paths.sqlite_execute, post(database::sqlite_execute))
        .route(&paths.sqlite_query, post(database::sqlite_query))
        .route(
            &paths.sqlite_execute_batch,
            post(database::sqlite_execute_batch),
        )
        .route(&paths.jobs, get(jobs::list_jobs).post(jobs::submit_job))
        .route(&paths.job_detail, get(jobs::read_job))
        .route(&paths.job_cancel, post(jobs::cancel_job))
        .route(&paths.policy_snapshot, get(governance::policy_snapshot))
        .route(
            &paths.policy_validate_path,
            post(governance::validate_policy_path),
        )
        .route(
            &paths.policy_validate_command,
            post(governance::validate_policy_command),
        )
        .route(&paths.migration_status, post(governance::migration_status))
        .route(&paths.migration_apply, post(governance::migration_apply))
}

struct CoreRoutePaths {
    health: String,
    live_open_api: String,
    open_api: String,
    route_catalog: String,
    runtime_summary: String,
    toolkit_capabilities: String,
    filesystem_read_dir: String,
    filesystem_read_text: String,
    filesystem_read_bytes: String,
    filesystem_write_text: String,
    filesystem_write_bytes: String,
    filesystem_stat: String,
    filesystem_exists: String,
    filesystem_ensure_dir: String,
    filesystem_remove: String,
    filesystem_rename: String,
    filesystem_copy_file: String,
    media_probe: String,
    media_image_resize: String,
    media_video_concat: String,
    media_video_transcode: String,
    media_video_trim: String,
    media_video_extract_audio: String,
    media_video_thumbnail: String,
    media_audio_convert: String,
    media_audio_normalize: String,
    media_audio_mix: String,
    compression_zip: String,
    compression_unzip: String,
    sqlite_execute: String,
    sqlite_query: String,
    sqlite_execute_batch: String,
    jobs: String,
    job_detail: String,
    job_cancel: String,
    policy_snapshot: String,
    policy_validate_path: String,
    policy_validate_command: String,
    migration_status: String,
    migration_apply: String,
}

impl CoreRoutePaths {
    fn from_state(state: &AppState) -> Self {
        let meta = state.contract.meta.clone();

        Self {
            health: state
                .contract
                .require_route_path_by_id(&meta.health_route_id),
            live_open_api: meta.live_open_api_path,
            open_api: meta.open_api_path,
            route_catalog: state
                .contract
                .require_route_path_by_id(&meta.route_catalog_route_id),
            runtime_summary: state
                .contract
                .require_route_path_by_id(&meta.runtime_summary_route_id),
            toolkit_capabilities: state
                .contract
                .require_route_path_by_id("coreToolkitCapabilitiesRead"),
            filesystem_read_dir: state
                .contract
                .require_route_path_by_id("coreFileSystemReadDir"),
            filesystem_read_text: state
                .contract
                .require_route_path_by_id("coreFileSystemReadText"),
            filesystem_read_bytes: state
                .contract
                .require_route_path_by_id("coreFileSystemReadBytes"),
            filesystem_write_text: state
                .contract
                .require_route_path_by_id("coreFileSystemWriteText"),
            filesystem_write_bytes: state
                .contract
                .require_route_path_by_id("coreFileSystemWriteBytes"),
            filesystem_stat: state
                .contract
                .require_route_path_by_id("coreFileSystemStat"),
            filesystem_exists: state
                .contract
                .require_route_path_by_id("coreFileSystemExists"),
            filesystem_ensure_dir: state
                .contract
                .require_route_path_by_id("coreFileSystemEnsureDir"),
            filesystem_remove: state
                .contract
                .require_route_path_by_id("coreFileSystemRemove"),
            filesystem_rename: state
                .contract
                .require_route_path_by_id("coreFileSystemRename"),
            filesystem_copy_file: state
                .contract
                .require_route_path_by_id("coreFileSystemCopyFile"),
            media_probe: state.contract.require_route_path_by_id("coreMediaProbe"),
            media_image_resize: state
                .contract
                .require_route_path_by_id("coreMediaImageResize"),
            media_video_concat: state
                .contract
                .require_route_path_by_id("coreMediaVideoConcat"),
            media_video_transcode: state
                .contract
                .require_route_path_by_id("coreMediaVideoTranscode"),
            media_video_trim: state
                .contract
                .require_route_path_by_id("coreMediaVideoTrim"),
            media_video_extract_audio: state
                .contract
                .require_route_path_by_id("coreMediaVideoExtractAudio"),
            media_video_thumbnail: state
                .contract
                .require_route_path_by_id("coreMediaVideoThumbnail"),
            media_audio_convert: state
                .contract
                .require_route_path_by_id("coreMediaAudioConvert"),
            media_audio_normalize: state
                .contract
                .require_route_path_by_id("coreMediaAudioNormalize"),
            media_audio_mix: state.contract.require_route_path_by_id("coreMediaAudioMix"),
            compression_zip: state
                .contract
                .require_route_path_by_id("coreCompressionZip"),
            compression_unzip: state
                .contract
                .require_route_path_by_id("coreCompressionUnzip"),
            sqlite_execute: state
                .contract
                .require_route_path_by_id("coreDatabaseSqliteExecute"),
            sqlite_query: state
                .contract
                .require_route_path_by_id("coreDatabaseSqliteQuery"),
            sqlite_execute_batch: state
                .contract
                .require_route_path_by_id("coreDatabaseSqliteExecuteBatch"),
            jobs: state.contract.require_route_path_by_id("coreJobsList"),
            job_detail: state.contract.axum_path_for_route_id("coreJobsRead"),
            job_cancel: state.contract.axum_path_for_route_id("coreJobsCancel"),
            policy_snapshot: state
                .contract
                .require_route_path_by_id("corePolicySnapshotRead"),
            policy_validate_path: state
                .contract
                .require_route_path_by_id("corePolicyValidatePath"),
            policy_validate_command: state
                .contract
                .require_route_path_by_id("corePolicyValidateCommand"),
            migration_status: state
                .contract
                .require_route_path_by_id("coreMigrationsStatusRead"),
            migration_apply: state
                .contract
                .require_route_path_by_id("coreMigrationsApply"),
        }
    }
}
