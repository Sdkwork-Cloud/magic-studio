use std::cmp::Ordering;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering as AtomicOrdering};
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use sdkwork_utils_rust::encoding;
use serde_json::Value;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::assets::{AssetLocatorProtocol, AssetService};
use super::magiccut::MagicCutService;
use super::media::{MediaExecutionControl, MediaService};

use super::service_utils::{normalize_optional_text, current_time_millis, require_non_empty_text};
static MAGICCUT_RENDER_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MagicCutRenderTarget {
    Audio,
    Video,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MagicCutRenderFormat {
    Wav,
    Mp4,
    Webm,
    Mov,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum MagicCutRenderStatus {
    Pending,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MagicCutRenderArtifactRole {
    Primary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderError {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderTargetCapability {
    pub target: MagicCutRenderTarget,
    pub supported: bool,
    pub formats: Vec<MagicCutRenderFormat>,
    pub default_format: Option<MagicCutRenderFormat>,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderCapabilities {
    pub queueing: bool,
    pub targets: Vec<MagicCutRenderTargetCapability>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderCreateInput {
    pub timeline_id: String,
    pub target: MagicCutRenderTarget,
    pub format: MagicCutRenderFormat,
    pub file_name: String,
    pub start_time_seconds: Option<f64>,
    pub end_time_seconds: Option<f64>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderListQuery {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub project_id: Option<String>,
    pub target: Option<MagicCutRenderTarget>,
    pub status: Option<MagicCutRenderStatus>,
    #[serde(default)]
    pub sort: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct MagicCutRenderListResult {
    pub items: Vec<MagicCutRenderJobRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderArtifactRecord {
    pub id: String,
    pub render_id: String,
    pub role: MagicCutRenderArtifactRole,
    pub target: MagicCutRenderTarget,
    pub format: MagicCutRenderFormat,
    pub file_name: String,
    pub relative_path: String,
    pub mime_type: String,
    pub size_bytes: Option<u64>,
    pub duration_seconds: Option<f64>,
    pub created_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderArtifactContent {
    pub artifact_id: String,
    pub file_name: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub bytes_base64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutRenderJobRecord {
    pub id: String,
    pub project_id: String,
    pub timeline_id: String,
    pub target: MagicCutRenderTarget,
    pub format: MagicCutRenderFormat,
    pub file_name: String,
    pub status: MagicCutRenderStatus,
    pub progress: f32,
    pub stage: Option<String>,
    pub range_start_seconds: Option<f64>,
    pub range_end_seconds: Option<f64>,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub error: Option<MagicCutRenderError>,
    #[serde(default)]
    pub artifacts: Vec<MagicCutRenderArtifactRecord>,
}

pub trait MagicCutRenderService: Send + Sync {
    fn read_capabilities(&self) -> ServerResult<MagicCutRenderCapabilities>;
    fn list_renders(
        &self,
        query: MagicCutRenderListQuery,
    ) -> ServerResult<MagicCutRenderListResult>;
    fn create_render(
        &self,
        project_key: &str,
        input: MagicCutRenderCreateInput,
    ) -> ServerResult<MagicCutRenderJobRecord>;
    fn read_render(&self, render_id: &str) -> ServerResult<MagicCutRenderJobRecord>;
    fn cancel_render(&self, render_id: &str) -> ServerResult<MagicCutRenderJobRecord>;
    fn list_artifacts(&self, render_id: &str) -> ServerResult<Vec<MagicCutRenderArtifactRecord>>;
    fn read_artifact_content(
        &self,
        render_id: &str,
        artifact_id: &str,
    ) -> ServerResult<MagicCutRenderArtifactContent>;
}

struct FileBackedMagicCutRenderServiceInner {
    storage_paths: AppStoragePaths,
    magiccut_service: Arc<dyn MagicCutService>,
    asset_service: Arc<dyn AssetService>,
    media_service: Arc<dyn MediaService>,
    lock: Mutex<()>,
    live_jobs: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

#[derive(Clone)]
pub struct FileBackedMagicCutRenderService {
    inner: Arc<FileBackedMagicCutRenderServiceInner>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutEntityRef {
    id: Option<String>,
    uuid: Option<String>,
    asset_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutProjectSnapshot {
    id: Option<String>,
    uuid: Option<String>,
    normalized_state: Option<MagicCutNormalizedState>,
    settings: Option<MagicCutProjectSettings>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct MagicCutProjectSettings {
    audio_sample_rate: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutNormalizedState {
    #[serde(default)]
    resources: HashMap<String, MagicCutResourceRecord>,
    #[serde(default)]
    timelines: HashMap<String, MagicCutTimelineRecord>,
    #[serde(default)]
    tracks: HashMap<String, MagicCutTrackRecord>,
    #[serde(default)]
    clips: HashMap<String, MagicCutClipRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutTimelineRecord {
    id: Option<String>,
    uuid: Option<String>,
    duration: Option<f64>,
    #[serde(default)]
    tracks: Vec<MagicCutEntityRef>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutTrackRecord {
    id: Option<String>,
    uuid: Option<String>,
    track_type: String,
    muted: Option<bool>,
    volume: Option<f64>,
    pan: Option<f64>,
    #[serde(default)]
    audio_effects: Vec<Value>,
    #[serde(default)]
    clips: Vec<MagicCutEntityRef>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutClipRecord {
    id: Option<String>,
    uuid: Option<String>,
    resource: MagicCutEntityRef,
    start: f64,
    duration: f64,
    offset: Option<f64>,
    speed: Option<f64>,
    volume: Option<f64>,
    muted: Option<bool>,
    fade_in: Option<f64>,
    fade_out: Option<f64>,
    #[serde(default)]
    audio_effects: Vec<Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MagicCutResourceRecord {
    id: Option<String>,
    uuid: Option<String>,
    asset_id: Option<String>,
    path: Option<String>,
    url: Option<String>,
    #[serde(rename = "type")]
    resource_type: String,
}

#[derive(Debug, Clone)]
struct PreparedAudioClip {
    source_path: String,
    source_offset_seconds: f64,
    source_duration_seconds: f64,
    output_offset_seconds: f64,
    speed: f64,
    volume: f64,
}

#[derive(Debug, Clone)]
struct AudioRenderPlan {
    sample_rate: u32,
    duration_seconds: f64,
    clips: Vec<PreparedAudioClip>,
}

#[derive(Debug, Clone)]
struct RenderSortField {
    field: &'static str,
    ascending: bool,
}

impl FileBackedMagicCutRenderService {
    pub fn new(
        storage_paths: AppStoragePaths,
        magiccut_service: Arc<dyn MagicCutService>,
        asset_service: Arc<dyn AssetService>,
        media_service: Arc<dyn MediaService>,
    ) -> Self {
        let service = Self {
            inner: Arc::new(FileBackedMagicCutRenderServiceInner {
                storage_paths,
                magiccut_service,
                asset_service,
                media_service,
                lock: Mutex::new(()),
                live_jobs: Mutex::new(HashMap::new()),
            }),
        };
        let _ = service.ensure_storage_dirs();
        let _ = service.recover_unfinished_jobs();
        service
    }

    fn ensure_storage_dirs(&self) -> ServerResult<()> {
        self.inner.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.inner.storage_paths.magiccut_root_dir()).map_err(|error| {
            ServerError::internal(format!(
                    "failed to create magiccut root {}: {error}",
                    self.inner.storage_paths.magiccut_root_dir().display()
                ),
            )
        })?;
        fs::create_dir_all(self.inner.storage_paths.magiccut_renders_dir()).map_err(|error| {
            ServerError::internal(format!(
                    "failed to create magiccut renders dir {}: {error}",
                    self.inner.storage_paths.magiccut_renders_dir().display()
                ),
            )
        })?;
        fs::create_dir_all(self.inner.storage_paths.generated_outputs_root_dir()).map_err(
            |error| {
                ServerError::internal(format!(
                        "failed to create generated outputs root {}: {error}",
                        self.inner
                            .storage_paths
                            .generated_outputs_root_dir()
                            .display()
                    ),
                )
            },
        )?;
        fs::create_dir_all(self.inner.storage_paths.generated_magiccut_renders_dir()).map_err(
            |error| {
                ServerError::internal(format!(
                        "failed to create generated magiccut renders dir {}: {error}",
                        self.inner
                            .storage_paths
                            .generated_magiccut_renders_dir()
                            .display()
                    ),
                )
            },
        )?;
        Ok(())
    }

    fn recover_unfinished_jobs(&self) -> ServerResult<()> {
        let _guard = self.inner.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;
        self.ensure_storage_dirs()?;
        for mut job in self.read_all_render_jobs_unlocked()? {
            if !matches!(
                job.status,
                MagicCutRenderStatus::Pending | MagicCutRenderStatus::Running
            ) {
                continue;
            }
            job.status = MagicCutRenderStatus::Failed;
            job.progress = 100.0;
            job.stage = Some("failed".to_string());
            job.updated_at_ms = current_time_millis() as u64;
            job.error = Some(MagicCutRenderError {
                code: "MAGICCUT_RENDER_HOST_RESTARTED".to_string(),
                message: "render job was interrupted because the host restarted".to_string(),
            });
            self.write_render_job_unlocked(&job)?;
        }
        Ok(())
    }

    fn render_job_file_path(&self, render_id: &str) -> PathBuf {
        self.inner
            .storage_paths
            .magiccut_renders_dir()
            .join(format!("{render_id}.json"))
    }

    fn render_output_dir(&self, render_id: &str) -> PathBuf {
        self.inner
            .storage_paths
            .generated_magiccut_renders_dir()
            .join(render_id)
    }

    fn read_render_job_unlocked(&self, render_id: &str) -> ServerResult<MagicCutRenderJobRecord> {
        let path = self.render_job_file_path(render_id);
        let contents = fs::read_to_string(&path).map_err(|error| {
            ServerError::not_found(format!("magiccut render {render_id} was not found: {error}"),
            )
        })?;
        serde_json::from_str::<MagicCutRenderJobRecord>(&contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to parse magiccut render {}: {error}",
                    path.display()
                ),
            )
        })
    }

    fn write_render_job_unlocked(&self, record: &MagicCutRenderJobRecord) -> ServerResult<()> {
        let contents = serde_json::to_vec_pretty(record).map_err(|error| {
            ServerError::internal(format!("failed to serialize magiccut render {}: {error}", record.id),
            )
        })?;
        fs::write(self.render_job_file_path(&record.id), contents).map_err(|error| {
            ServerError::internal(format!("failed to persist magiccut render {}: {error}", record.id),
            )
        })
    }

    fn read_all_render_jobs_unlocked(&self) -> ServerResult<Vec<MagicCutRenderJobRecord>> {
        if !self.inner.storage_paths.magiccut_renders_dir().exists() {
            return Ok(Vec::new());
        }
        let entries =
            fs::read_dir(self.inner.storage_paths.magiccut_renders_dir()).map_err(|error| {
                ServerError::internal(format!(
                        "failed to read magiccut renders dir {}: {error}",
                        self.inner.storage_paths.magiccut_renders_dir().display()
                    ),
                )
            })?;

        let mut jobs = Vec::new();
        for entry in entries {
            let entry = entry.map_err(|error| {
                ServerError::internal(format!("failed to read magiccut render entry: {error}"),
                )
            })?;
            let path = entry.path();
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                continue;
            }
            let contents = fs::read_to_string(&path).map_err(|error| {
                ServerError::internal(format!("failed to read {}: {error}", path.display()),
                )
            })?;
            let job =
                serde_json::from_str::<MagicCutRenderJobRecord>(&contents).map_err(|error| {
                    ServerError::internal(format!("failed to parse {}: {error}", path.display()),
                    )
                })?;
            jobs.push(job);
        }
        Ok(jobs)
    }

    fn update_job_snapshot<F>(
        &self,
        render_id: &str,
        updater: F,
    ) -> ServerResult<MagicCutRenderJobRecord>
    where
        F: FnOnce(&mut MagicCutRenderJobRecord),
    {
        let _guard = self.inner.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;
        self.ensure_storage_dirs()?;
        let mut snapshot = self.read_render_job_unlocked(render_id)?;
        updater(&mut snapshot);
snapshot.updated_at_ms = current_time_millis() as u64;
self.write_render_job_unlocked(&snapshot)?;
        Ok(snapshot)
    }

    fn resolve_project_snapshot(&self, project_key: &str) -> ServerResult<MagicCutProjectSnapshot> {
        let project = self.inner.magiccut_service.read_project(project_key)?;
        serde_json::from_value::<MagicCutProjectSnapshot>(project).map_err(|error| {
            ServerError::bad_request(format!("magiccut project {project_key} is not a renderable snapshot: {error}"),
            )
        })
    }

    fn read_audio_render_capability(&self) -> MagicCutRenderTargetCapability {
        match self.inner.media_service.media_command_available() {
            Ok(true) => MagicCutRenderTargetCapability {
                target: MagicCutRenderTarget::Audio,
                supported: true,
                formats: vec![MagicCutRenderFormat::Wav],
                default_format: Some(MagicCutRenderFormat::Wav),
                reason: None,
            },
            Ok(false) => MagicCutRenderTargetCapability {
                target: MagicCutRenderTarget::Audio,
                supported: false,
                formats: Vec::new(),
                default_format: None,
                reason: Some(
                    "Audio render requires ffmpeg and ffprobe in the canonical server runtime."
                        .to_string(),
                ),
            },
            Err(error) => MagicCutRenderTargetCapability {
                target: MagicCutRenderTarget::Audio,
                supported: false,
                formats: Vec::new(),
                default_format: None,
                reason: Some(error.detail),
            },
        }
    }

    fn resolve_render_query(
        jobs: Vec<MagicCutRenderJobRecord>,
        query: MagicCutRenderListQuery,
    ) -> MagicCutRenderListResult {
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.size);
        let sort_fields = normalize_sort_fields(query.sort);

        let mut filtered = jobs
            .into_iter()
            .filter(|job| match query.project_id.as_deref() {
                Some(project_id) => job.project_id == project_id,
                None => true,
            })
            .filter(|job| match query.target.as_ref() {
                Some(target) => &job.target == target,
                None => true,
            })
            .filter(|job| match query.status.as_ref() {
                Some(status) => &job.status == status,
                None => true,
            })
            .collect::<Vec<_>>();

        filtered.sort_by(|left, right| compare_render_jobs(left, right, &sort_fields));

        let total = filtered.len();
        let start = (page - 1) * page_size;
        let items = filtered.into_iter().skip(start).take(page_size).collect();

        MagicCutRenderListResult {
            items,
            page,
            page_size,
            total,
        }
    }

    fn ensure_render_supported(&self, input: &MagicCutRenderCreateInput) -> ServerResult<()> {
        let capabilities = self.read_capabilities()?;
        let Some(target_capability) = capabilities
            .targets
            .iter()
            .find(|target| target.target == input.target)
        else {
            return Err(ServerError::bad_request("request validation failed"));
        };

        if !target_capability.supported {
            return Err(ServerError::bad_request(target_capability.reason.clone().unwrap_or_else(|| {
                    "requested render target is not supported in the canonical host".to_string()
                }),
            ));
        }

        if !target_capability.formats.contains(&input.format) {
            return Err(ServerError::bad_request(format!(
                    "render format {:?} is not supported for target {:?}",
                    input.format, input.target
                ),
            ));
        }

        Ok(())
    }

    fn start_render_job(
        &self,
        snapshot: MagicCutRenderJobRecord,
        project_snapshot: MagicCutProjectSnapshot,
        input: MagicCutRenderCreateInput,
    ) -> ServerResult<()> {
        let cancel_signal = Arc::new(AtomicBool::new(false));
        self.inner
            .live_jobs
            .lock()
            .map_err(|_| {
                ServerError::internal("an internal error occurred")
            })?
            .insert(snapshot.id.clone(), Arc::clone(&cancel_signal));

        let service = self.clone();
        let render_id = snapshot.id.clone();
        tokio::runtime::Handle::try_current()
            .map_err(|_| {
                ServerError::internal("an internal error occurred")
            })?
            .spawn_blocking(move || {
                let execution_result =
                    service.execute_render_job(&render_id, project_snapshot, input, cancel_signal);
                if let Err(error) = execution_result {
                    let _ = service.fail_render_job(&render_id, error);
                }
                let _ = service
                    .inner
                    .live_jobs
                    .lock()
                    .map(|mut live| live.remove(&render_id));
            });

        Ok(())
    }

    fn execute_render_job(
        &self,
        render_id: &str,
        project_snapshot: MagicCutProjectSnapshot,
        input: MagicCutRenderCreateInput,
        cancel_signal: Arc<AtomicBool>,
    ) -> ServerResult<()> {
        if cancel_signal.load(AtomicOrdering::SeqCst) {
            let _ = self.mark_render_cancelled(render_id);
            return Ok(());
        }

        self.update_job_snapshot(render_id, |snapshot| {
            snapshot.status = MagicCutRenderStatus::Running;
            snapshot.progress = 5.0;
            snapshot.stage = Some("preparing".to_string());
            snapshot.error = None;
        })?;

        let output_dir = self.render_output_dir(render_id);
        fs::create_dir_all(&output_dir).map_err(|error| {
            ServerError::internal(format!(
                    "failed to create render output dir {}: {error}",
                    output_dir.display()
                ),
            )
        })?;

        match input.target {
            MagicCutRenderTarget::Audio => {
                let plan = self.build_audio_render_plan(&project_snapshot, &input)?;
                let output_file_name = build_output_file_name(&input.file_name, &input.format)?;
                let output_path = output_dir.join(&output_file_name);
                self.run_audio_render_command(render_id, &plan, &output_path, cancel_signal)?;

                let size_bytes = fs::metadata(&output_path)
                    .map(|metadata| metadata.len())
                    .ok();
                let artifact = MagicCutRenderArtifactRecord {
                    id: format!("{render_id}-artifact-primary"),
                    render_id: render_id.to_string(),
                    role: MagicCutRenderArtifactRole::Primary,
                    target: MagicCutRenderTarget::Audio,
                    format: MagicCutRenderFormat::Wav,
                    file_name: output_file_name,
                    relative_path: path_relative_to(
                        self.inner.storage_paths.generated_outputs_root_dir(),
                        &output_path,
                    ),
                    mime_type: "audio/wav".to_string(),
                    size_bytes,
                    duration_seconds: Some(plan.duration_seconds),
                    created_at_ms: current_time_millis() as u64,
                };

                self.update_job_snapshot(render_id, |snapshot| {
                    snapshot.status = MagicCutRenderStatus::Succeeded;
                    snapshot.progress = 100.0;
                    snapshot.stage = Some("completed".to_string());
                    snapshot.error = None;
                    snapshot.artifacts = vec![artifact];
                })?;
            }
            MagicCutRenderTarget::Video => {
                return Err(ServerError::bad_request("request validation failed"));
            }
        }

        Ok(())
    }

    fn build_audio_render_plan(
        &self,
        project_snapshot: &MagicCutProjectSnapshot,
        input: &MagicCutRenderCreateInput,
    ) -> ServerResult<AudioRenderPlan> {
        if input.target != MagicCutRenderTarget::Audio {
            return Err(ServerError::bad_request("request validation failed"));
        }

        if input.format != MagicCutRenderFormat::Wav {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let normalized_state = project_snapshot.normalized_state.as_ref().ok_or_else(|| {
            ServerError::bad_request("request validation failed")
        })?;

        let timeline = resolve_timeline_record(normalized_state, &input.timeline_id)?.clone();
        let timeline_duration = resolve_timeline_duration(&timeline, normalized_state);
        let range_start = input
            .start_time_seconds
            .unwrap_or(0.0)
            .clamp(0.0, timeline_duration);
        let requested_end = input.end_time_seconds.unwrap_or(timeline_duration);
        let range_end = requested_end.clamp(range_start, timeline_duration);

        if range_end <= range_start {
            return Err(ServerError::bad_request("request validation failed"));
        }

        let sample_rate = project_snapshot
            .settings
            .as_ref()
            .and_then(|settings| settings.audio_sample_rate)
            .filter(|value| *value > 0)
            .unwrap_or(48_000);

        let mut probe_cache = HashMap::<String, bool>::new();
        let mut clips = Vec::new();

        for track_ref in &timeline.tracks {
            let track = resolve_track_record(normalized_state, track_ref)?.clone();
            if !supports_audio_render_for_track_type(&track.track_type) {
                continue;
            }

            if track.muted.unwrap_or(false) {
                continue;
            }

            validate_track_audio_features(&track)?;
            let track_volume = track.volume.unwrap_or(1.0);
            if track_volume <= 0.0 {
                continue;
            }

            for clip_ref in &track.clips {
                let clip = resolve_clip_record(normalized_state, clip_ref)?.clone();
                if clip.muted.unwrap_or(false) {
                    continue;
                }

                validate_clip_audio_features(&clip)?;

                if clip.duration <= 0.0 {
                    continue;
                }

                let clip_start = clip.start.max(0.0);
                let clip_end = clip_start + clip.duration;
                let overlap_start = clip_start.max(range_start);
                let overlap_end = clip_end.min(range_end);

                if overlap_end <= overlap_start {
                    continue;
                }

                let speed = clip.speed.unwrap_or(1.0);
                if speed <= 0.0 {
                    return Err(ServerError::bad_request("request validation failed"));
                }

                let clip_volume = clip.volume.unwrap_or(1.0);
                let final_volume = track_volume * clip_volume;
                if final_volume <= 0.0 {
                    continue;
                }

                let resource = resolve_resource_record(normalized_state, &clip.resource)?.clone();
                if !resource_type_can_produce_audio(&resource.resource_type) {
                    continue;
                }

                let source_path = self.resolve_resource_input_path(&resource)?;
                let has_audio = self.probe_audio_stream(&source_path, &mut probe_cache)?;
                if !has_audio {
                    continue;
                }

                let clip_overlap_start = overlap_start - clip_start;
                let source_offset_seconds =
                    clip.offset.unwrap_or(0.0).max(0.0) + (clip_overlap_start * speed);
                let source_duration_seconds = (overlap_end - overlap_start) * speed;
                let output_offset_seconds = overlap_start - range_start;

                clips.push(PreparedAudioClip {
                    source_path,
                    source_offset_seconds,
                    source_duration_seconds,
                    output_offset_seconds,
                    speed,
                    volume: final_volume,
                });
            }
        }

        Ok(AudioRenderPlan {
            sample_rate,
            duration_seconds: range_end - range_start,
            clips,
        })
    }

    fn probe_audio_stream(
        &self,
        source_path: &str,
        cache: &mut HashMap<String, bool>,
    ) -> ServerResult<bool> {
        if let Some(cached) = cache.get(source_path) {
            return Ok(*cached);
        }

        let probe = self
            .inner
            .media_service
            .media_probe(source_path.to_string())?;
        let has_audio = probe
            .get("streams")
            .and_then(|value| value.as_array())
            .is_some_and(|streams| {
                streams.iter().any(|stream| {
                    stream
                        .get("codec_type")
                        .and_then(|value| value.as_str())
                        .is_some_and(|codec_type| codec_type.eq_ignore_ascii_case("audio"))
                })
            });
        cache.insert(source_path.to_string(), has_audio);
        Ok(has_audio)
    }

    fn resolve_resource_input_path(
        &self,
        resource: &MagicCutResourceRecord,
    ) -> ServerResult<String> {
        if let Some(path) = normalize_optional_text(resource.path.clone()) {
            if !looks_like_asset_uri(&path) && Path::new(&path).exists() {
                return Ok(path);
            }
        }

        if let Some(url) = normalize_optional_text(resource.url.clone()) {
            if let Some(path) = file_url_to_path(&url) {
                if Path::new(&path).exists() {
                    return Ok(path);
                }
            }
        }

        if let Some(asset_key) = resource
            .asset_id
            .clone()
            .and_then(|value| normalize_optional_text(Some(value)))
            .or_else(|| {
                resource
                    .path
                    .clone()
                    .and_then(|value| normalize_optional_text(Some(value)))
                    .and_then(|value| parse_asset_locator_key(&value))
            })
            .or_else(|| {
                resource
                    .url
                    .clone()
                    .and_then(|value| normalize_optional_text(Some(value)))
                    .and_then(|value| parse_asset_locator_key(&value))
            })
        {
            let asset = self.inner.asset_service.read_asset(&asset_key)?;
            if let Some(path) = asset.storage.replicas.as_ref().and_then(|replicas| {
                replicas.iter().find_map(|locator| match locator.protocol {
                    AssetLocatorProtocol::File | AssetLocatorProtocol::Desktop => locator
                        .path
                        .clone()
                        .and_then(|value| normalize_optional_text(Some(value))),
                    _ => None,
                })
            }) {
                if Path::new(&path).exists() {
                    return Ok(path);
                }
            }

            if matches!(
                asset.storage.primary.protocol,
                AssetLocatorProtocol::File | AssetLocatorProtocol::Desktop
            ) {
                if let Some(path) = asset
                    .storage
                    .primary
                    .path
                    .clone()
                    .and_then(|value| normalize_optional_text(Some(value)))
                {
                    if Path::new(&path).exists() {
                        return Ok(path);
                    }
                }
            }
        }

        Err(ServerError::bad_request(format!(
                "resource {} cannot be resolved to a local media file for server render",
                resolve_entity_key_optional(&resource.id, &resource.uuid)
                    .unwrap_or_else(|| "unknown-resource".to_string())
            ),
        ))
    }

    fn run_audio_render_command(
        &self,
        render_id: &str,
        plan: &AudioRenderPlan,
        output_path: &Path,
        cancel_signal: Arc<AtomicBool>,
    ) -> ServerResult<()> {
        let output_path_string = output_path.to_string_lossy().to_string();
        let args = if plan.clips.is_empty() {
            vec![
                "-progress".to_string(),
                "pipe:2".to_string(),
                "-nostats".to_string(),
                "-y".to_string(),
                "-f".to_string(),
                "lavfi".to_string(),
                "-i".to_string(),
                format!("anullsrc=r={}:cl=stereo", plan.sample_rate),
                "-t".to_string(),
                format_seconds(plan.duration_seconds),
                "-c:a".to_string(),
                "pcm_s16le".to_string(),
                output_path_string,
            ]
        } else {
            build_audio_render_args(plan, &output_path_string)
        };

        let render_id_for_progress = render_id.to_string();
        let service_for_progress = self.clone();
        let duration_seconds = plan.duration_seconds.max(0.001);
        let progress_callback = Arc::new(move |line: String| {
            if let Some(value) = line.strip_prefix("out_time=") {
                if let Some(current_seconds) = parse_media_progress_time_to_seconds(value) {
                    let ratio = (current_seconds / duration_seconds).clamp(0.0, 1.0) as f32;
                    let progress = 10.0 + (ratio * 85.0);
                    let _ = service_for_progress.update_job_snapshot(
                        &render_id_for_progress,
                        |snapshot| {
                            snapshot.status = MagicCutRenderStatus::Running;
                            snapshot.progress = progress.min(99.0);
                            snapshot.stage = Some("rendering".to_string());
                            snapshot.error = None;
                        },
                    );
                }
                return;
            }

            if line.trim() == "progress=end" {
                let _ =
                    service_for_progress.update_job_snapshot(&render_id_for_progress, |snapshot| {
                        snapshot.status = MagicCutRenderStatus::Running;
                        snapshot.progress = 98.0;
                        snapshot.stage = Some("finalizing".to_string());
                        snapshot.error = None;
                    });
            }
        });

        let command = self
            .inner
            .media_service
            .media_command_execute_controlled(
                args,
                MediaExecutionControl {
                    cancel_signal,
                    on_stderr_line: Some(progress_callback),
                },
            )
            .map_err(map_render_media_error)?;

        if command.code != 0 {
            return Err(ServerError::bad_request(format!("magiccut audio render failed with code {}", command.code),
            )
            .with_detail(command.stderr));
        }

        Ok(())
    }

    fn mark_render_cancelled(&self, render_id: &str) -> ServerResult<()> {
        self.update_job_snapshot(render_id, |snapshot| {
            snapshot.status = MagicCutRenderStatus::Cancelled;
            snapshot.progress = 100.0;
            snapshot.stage = Some("cancelled".to_string());
            snapshot.error = Some(MagicCutRenderError {
                code: "MAGICCUT_RENDER_CANCELLED".to_string(),
                message: "render execution was cancelled".to_string(),
            });
        })?;
        Ok(())
    }

    fn fail_render_job(&self, render_id: &str, error: ServerError) -> ServerResult<()> {
        if error.code() == "MAGICCUT_RENDER_CANCELLED" || error.code() == "MEDIA_COMMAND_CANCELLED" {
            return self.mark_render_cancelled(render_id);
        }

        self.update_job_snapshot(render_id, |snapshot| {
            snapshot.status = MagicCutRenderStatus::Failed;
            snapshot.progress = 100.0;
            snapshot.stage = Some("failed".to_string());
            snapshot.error = Some(MagicCutRenderError {
                code: error.code().to_string(),
                message: error.detail,
            });
        })?;
        Ok(())
    }
}

impl MagicCutRenderService for FileBackedMagicCutRenderService {
    fn read_capabilities(&self) -> ServerResult<MagicCutRenderCapabilities> {
        Ok(MagicCutRenderCapabilities {
            queueing: true,
            targets: vec![
                self.read_audio_render_capability(),
                MagicCutRenderTargetCapability {
                    target: MagicCutRenderTarget::Video,
                    supported: false,
                    formats: Vec::new(),
                    default_format: None,
                    reason: Some(
                        "Video render is not yet implemented in the canonical server render service."
                            .to_string(),
                    ),
                },
            ],
        })
    }

    fn list_renders(
        &self,
        query: MagicCutRenderListQuery,
    ) -> ServerResult<MagicCutRenderListResult> {
        let _guard = self.inner.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;
        self.ensure_storage_dirs()?;
        let jobs = self.read_all_render_jobs_unlocked()?;
        Ok(Self::resolve_render_query(jobs, query))
    }

    fn create_render(
        &self,
        project_key: &str,
        input: MagicCutRenderCreateInput,
    ) -> ServerResult<MagicCutRenderJobRecord> {
        self.ensure_render_supported(&input)?;
        let project_snapshot = self.resolve_project_snapshot(project_key)?;
        let timeline_id = require_non_empty_text(
            &input.timeline_id,
            "MAGICCUT_RENDER_TIMELINE_ID_EMPTY",
            "timelineId",
        )?;
        resolve_timeline_record(
            project_snapshot.normalized_state.as_ref().ok_or_else(|| {
                ServerError::bad_request("request validation failed")
            })?,
            &timeline_id,
        )?;
        let file_name = build_output_file_name(&input.file_name, &input.format)?;
        let now_ms = current_time_millis() as u64;
        let render_id = format!(
            "magiccut-render-{}",
            MAGICCUT_RENDER_COUNTER.fetch_add(1, AtomicOrdering::Relaxed)
        );
        let project_id = resolve_entity_key_optional(&project_snapshot.id, &project_snapshot.uuid)
            .unwrap_or_else(|| project_key.trim().to_string());

        let snapshot = MagicCutRenderJobRecord {
            id: render_id.clone(),
            project_id,
            timeline_id,
            target: input.target.clone(),
            format: input.format.clone(),
            file_name,
            status: MagicCutRenderStatus::Pending,
            progress: 0.0,
            stage: Some("queued".to_string()),
            range_start_seconds: input.start_time_seconds,
            range_end_seconds: input.end_time_seconds,
            created_at_ms: now_ms,
            updated_at_ms: now_ms,
            error: None,
            artifacts: Vec::new(),
        };

        {
            let _guard = self.inner.lock.lock().map_err(|_| {
                ServerError::internal("an internal error occurred")
            })?;
            self.ensure_storage_dirs()?;
            self.write_render_job_unlocked(&snapshot)?;
        }

        self.start_render_job(snapshot.clone(), project_snapshot, input)?;
        Ok(snapshot)
    }

    fn read_render(&self, render_id: &str) -> ServerResult<MagicCutRenderJobRecord> {
        let _guard = self.inner.lock.lock().map_err(|_| {
            ServerError::internal("an internal error occurred")
        })?;
        self.ensure_storage_dirs()?;
        self.read_render_job_unlocked(render_id)
    }

    fn cancel_render(&self, render_id: &str) -> ServerResult<MagicCutRenderJobRecord> {
        if let Ok(live_jobs) = self.inner.live_jobs.lock() {
            if let Some(cancel_signal) = live_jobs.get(render_id) {
                cancel_signal.store(true, AtomicOrdering::SeqCst);
            }
        }

        self.update_job_snapshot(render_id, |snapshot| {
            if matches!(
                snapshot.status,
                MagicCutRenderStatus::Pending | MagicCutRenderStatus::Running
            ) {
                snapshot.status = MagicCutRenderStatus::Cancelled;
                snapshot.progress = 100.0;
                snapshot.stage = Some("cancelled".to_string());
                snapshot.error = Some(MagicCutRenderError {
                    code: "MAGICCUT_RENDER_CANCELLED".to_string(),
                    message: "render execution was cancelled".to_string(),
                });
            }
        })
    }

    fn list_artifacts(&self, render_id: &str) -> ServerResult<Vec<MagicCutRenderArtifactRecord>> {
        Ok(self.read_render(render_id)?.artifacts)
    }

    fn read_artifact_content(
        &self,
        render_id: &str,
        artifact_id: &str,
    ) -> ServerResult<MagicCutRenderArtifactContent> {
        let job = self.read_render(render_id)?;
        let artifact = job
            .artifacts
            .into_iter()
            .find(|artifact| artifact.id == artifact_id)
            .ok_or_else(|| {
                ServerError::not_found(format!("artifact {artifact_id} was not found for render {render_id}"),
                )
            })?;

        let absolute_path = self
            .inner
            .storage_paths
            .generated_outputs_root_dir()
            .join(&artifact.relative_path);
        let bytes = fs::read(&absolute_path).map_err(|error| {
            ServerError::not_found(format!(
                    "failed to read render artifact {}: {error}",
                    absolute_path.display()
                ),
            )
        })?;

        Ok(MagicCutRenderArtifactContent {
            artifact_id: artifact.id,
            file_name: artifact.file_name,
            mime_type: artifact.mime_type,
            size_bytes: bytes.len() as u64,
            bytes_base64: encoding::base64_encode(&bytes),
        })
    }
}

fn build_audio_render_args(plan: &AudioRenderPlan, output_path: &str) -> Vec<String> {
    let mut args = vec![
        "-progress".to_string(),
        "pipe:2".to_string(),
        "-nostats".to_string(),
        "-y".to_string(),
    ];

    for clip in &plan.clips {
        args.push("-i".to_string());
        args.push(clip.source_path.clone());
    }

    let mut filters = Vec::new();
    let mut labels = Vec::new();

    for (index, clip) in plan.clips.iter().enumerate() {
        let label = format!("a{index}");
        let delay_samples = (clip.output_offset_seconds * plan.sample_rate as f64)
            .round()
            .max(0.0);
        let mut chain = vec![
            format!(
                "[{index}:a]atrim=start={}:duration={}",
                format_seconds(clip.source_offset_seconds),
                format_seconds(clip.source_duration_seconds),
            ),
            "asetpts=PTS-STARTPTS".to_string(),
        ];

        for atempo in build_atempo_chain(clip.speed) {
            chain.push(format!("atempo={atempo}"));
        }

        if (clip.volume - 1.0).abs() > f64::EPSILON {
            chain.push(format!("volume={}", format_decimal(clip.volume)));
        }

        if delay_samples > 0.0 {
            chain.push(format!("adelay={}S:all=1", delay_samples as u64));
        }

        chain.push(format!("[{label}]"));
        filters.push(chain.join(","));
        labels.push(format!("[{label}]"));
    }

    let mixed_label = if labels.len() == 1 {
        labels[0].clone()
    } else {
        filters.push(format!(
            "{}amix=inputs={}:duration=longest:normalize=0[mixed]",
            labels.join(""),
            labels.len()
        ));
        "[mixed]".to_string()
    };

    filters.push(format!(
        "{mixed_label}atrim=duration={},aresample={},aformat=sample_fmts=s16:channel_layouts=stereo[outa]",
        format_seconds(plan.duration_seconds),
        plan.sample_rate
    ));

    args.push("-filter_complex".to_string());
    args.push(filters.join(";"));
    args.push("-map".to_string());
    args.push("[outa]".to_string());
    args.push("-c:a".to_string());
    args.push("pcm_s16le".to_string());
    args.push(output_path.to_string());
    args
}

fn build_atempo_chain(speed: f64) -> Vec<String> {
    let mut values = Vec::new();
    let mut remaining = speed.max(0.000_001);

    while remaining > 2.0 {
        values.push("2.0".to_string());
        remaining /= 2.0;
    }

    while remaining < 0.5 {
        values.push("0.5".to_string());
        remaining /= 0.5;
    }

    if (remaining - 1.0).abs() > f64::EPSILON {
        values.push(format_decimal(remaining));
    }

    values
}

fn validate_track_audio_features(track: &MagicCutTrackRecord) -> ServerResult<()> {
    if track.pan.unwrap_or(0.0).abs() > f64::EPSILON {
        return Err(ServerError::bad_request(format!(
                "track {} uses pan, which is not yet supported by canonical server audio render",
                resolve_entity_key_optional(&track.id, &track.uuid)
                    .unwrap_or_else(|| "unknown-track".to_string())
            ),
        ));
    }

    if !track.audio_effects.is_empty() {
        return Err(ServerError::bad_request(format!(
                "track {} uses audio effects, which are not yet supported by canonical server audio render",
                resolve_entity_key_optional(&track.id, &track.uuid)
                    .unwrap_or_else(|| "unknown-track".to_string())
            ),
        ));
    }

    Ok(())
}

fn validate_clip_audio_features(clip: &MagicCutClipRecord) -> ServerResult<()> {
    if clip.fade_in.unwrap_or(0.0) > 0.0 || clip.fade_out.unwrap_or(0.0) > 0.0 {
        return Err(ServerError::bad_request(format!(
                "clip {} uses fades, which are not yet supported by canonical server audio render",
                resolve_entity_key_optional(&clip.id, &clip.uuid)
                    .unwrap_or_else(|| "unknown-clip".to_string())
            ),
        ));
    }

    if !clip.audio_effects.is_empty() {
        return Err(ServerError::bad_request(format!(
                "clip {} uses audio effects, which are not yet supported by canonical server audio render",
                resolve_entity_key_optional(&clip.id, &clip.uuid)
                    .unwrap_or_else(|| "unknown-clip".to_string())
            ),
        ));
    }

    Ok(())
}

fn supports_audio_render_for_track_type(track_type: &str) -> bool {
    !matches!(track_type, "text" | "subtitle" | "effect")
}

fn resource_type_can_produce_audio(resource_type: &str) -> bool {
    matches!(
        resource_type,
        "VIDEO" | "AUDIO" | "MUSIC" | "VOICE" | "SPEECH" | "SFX"
    )
}

fn resolve_timeline_record<'a>(
    state: &'a MagicCutNormalizedState,
    candidate_key: &str,
) -> ServerResult<&'a MagicCutTimelineRecord> {
    resolve_record_by_key(&state.timelines, candidate_key).ok_or_else(|| {
        ServerError::bad_request(format!("timeline {candidate_key} was not found in the project snapshot"),
        )
    })
}

fn resolve_track_record<'a>(
    state: &'a MagicCutNormalizedState,
    candidate: &MagicCutEntityRef,
) -> ServerResult<&'a MagicCutTrackRecord> {
    resolve_record_by_ref(&state.tracks, candidate).ok_or_else(|| {
        ServerError::bad_request(format!(
                "track {} was not found in the project snapshot",
                describe_entity_ref(candidate)
            ),
        )
    })
}

fn resolve_clip_record<'a>(
    state: &'a MagicCutNormalizedState,
    candidate: &MagicCutEntityRef,
) -> ServerResult<&'a MagicCutClipRecord> {
    resolve_record_by_ref(&state.clips, candidate).ok_or_else(|| {
        ServerError::bad_request(format!(
                "clip {} was not found in the project snapshot",
                describe_entity_ref(candidate)
            ),
        )
    })
}

fn resolve_resource_record<'a>(
    state: &'a MagicCutNormalizedState,
    candidate: &MagicCutEntityRef,
) -> ServerResult<&'a MagicCutResourceRecord> {
    resolve_record_by_ref(&state.resources, candidate)
        .or_else(|| {
            candidate
                .asset_id
                .as_deref()
                .and_then(|asset_id| resolve_resource_by_asset_id(&state.resources, asset_id))
        })
        .ok_or_else(|| {
            ServerError::bad_request(format!(
                    "resource {} was not found in the project snapshot",
                    describe_entity_ref(candidate)
                ),
            )
        })
}

fn resolve_record_by_key<'a, T>(
    records: &'a HashMap<String, T>,
    candidate_key: &str,
) -> Option<&'a T>
where
    T: HasEntityIdentity,
{
    let trimmed = candidate_key.trim();
    if trimmed.is_empty() {
        return None;
    }
    if let Some(record) = records.get(trimmed) {
        return Some(record);
    }
    records.values().find(|record| record.matches_key(trimmed))
}

fn resolve_record_by_ref<'a, T>(
    records: &'a HashMap<String, T>,
    candidate: &MagicCutEntityRef,
) -> Option<&'a T>
where
    T: HasEntityIdentity,
{
    candidate
        .uuid
        .as_deref()
        .and_then(|uuid| resolve_record_by_key(records, uuid))
        .or_else(|| {
            candidate
                .id
                .as_deref()
                .and_then(|id| resolve_record_by_key(records, id))
        })
}

fn resolve_resource_by_asset_id<'a>(
    records: &'a HashMap<String, MagicCutResourceRecord>,
    asset_id: &str,
) -> Option<&'a MagicCutResourceRecord> {
    let trimmed = asset_id.trim();
    if trimmed.is_empty() {
        return None;
    }
    records.values().find(|record| {
        record
            .asset_id
            .as_deref()
            .is_some_and(|value| value == trimmed)
    })
}

fn resolve_timeline_duration(
    timeline: &MagicCutTimelineRecord,
    state: &MagicCutNormalizedState,
) -> f64 {
    let mut duration = timeline.duration.unwrap_or(0.0);
    for track_ref in &timeline.tracks {
        if let Some(track) = resolve_record_by_ref(&state.tracks, track_ref) {
            for clip_ref in &track.clips {
                if let Some(clip) = resolve_record_by_ref(&state.clips, clip_ref) {
                    duration = duration.max(clip.start + clip.duration);
                }
            }
        }
    }
    duration.max(0.0)
}

fn describe_entity_ref(entity: &MagicCutEntityRef) -> String {
    entity
        .uuid
        .as_ref()
        .or(entity.id.as_ref())
        .or(entity.asset_id.as_ref())
        .cloned()
        .unwrap_or_else(|| "unknown".to_string())
}

trait HasEntityIdentity {
    fn matches_key(&self, key: &str) -> bool;
}

impl HasEntityIdentity for MagicCutTimelineRecord {
    fn matches_key(&self, key: &str) -> bool {
        matches_entity_identity(&self.id, &self.uuid, key)
    }
}

impl HasEntityIdentity for MagicCutTrackRecord {
    fn matches_key(&self, key: &str) -> bool {
        matches_entity_identity(&self.id, &self.uuid, key)
    }
}

impl HasEntityIdentity for MagicCutClipRecord {
    fn matches_key(&self, key: &str) -> bool {
        matches_entity_identity(&self.id, &self.uuid, key)
    }
}

impl HasEntityIdentity for MagicCutResourceRecord {
    fn matches_key(&self, key: &str) -> bool {
        matches_entity_identity(&self.id, &self.uuid, key)
            || self
                .asset_id
                .as_deref()
                .is_some_and(|asset_id| asset_id.trim() == key)
    }
}

fn matches_entity_identity(id: &Option<String>, uuid: &Option<String>, key: &str) -> bool {
    uuid.as_deref().is_some_and(|value| value.trim() == key)
        || id.as_deref().is_some_and(|value| value.trim() == key)
}

fn build_output_file_name(file_name: &str, format: &MagicCutRenderFormat) -> ServerResult<String> {
    let trimmed = require_non_empty_text(file_name, "MAGICCUT_RENDER_FILE_NAME_EMPTY", "fileName")?;
    let extension = match format {
        MagicCutRenderFormat::Wav => "wav",
        MagicCutRenderFormat::Mp4 => "mp4",
        MagicCutRenderFormat::Webm => "webm",
        MagicCutRenderFormat::Mov => "mov",
    };
    let base_name = trimmed
        .trim_end_matches(".wav")
        .trim_end_matches(".mp4")
        .trim_end_matches(".webm")
        .trim_end_matches(".mov")
        .trim();
    if base_name.is_empty() {
        return Err(ServerError::bad_request("request validation failed"));
    }
    Ok(format!("{}.{}", sanitize_file_name(base_name), extension))
}

fn sanitize_file_name(value: &str) -> String {
    let sanitized = value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | ' ' | '.') {
                character
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim()
        .trim_matches('.')
        .to_string();

    if sanitized.is_empty() {
        "magiccut-render".to_string()
    } else {
        sanitized
    }
}

fn path_relative_to(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map(|relative| relative.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| path.to_string_lossy().replace('\\', "/"))
}

fn parse_asset_locator_key(value: &str) -> Option<String> {
    if !looks_like_asset_uri(value) {
        return None;
    }
    value
        .rsplit('/')
        .next()
        .map(|segment| segment.trim().to_string())
}

fn looks_like_asset_uri(value: &str) -> bool {
    value.trim().starts_with("assets://")
}

fn file_url_to_path(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if !trimmed.to_ascii_lowercase().starts_with("file://") {
        return None;
    }

    let raw = trimmed.trim_start_matches("file://");
    let normalized = if cfg!(target_os = "windows")
        && raw.starts_with('/')
        && raw.chars().nth(2).is_some_and(|character| character == ':')
    {
        &raw[1..]
    } else {
        raw
    };

    Some(normalized.replace('/', std::path::MAIN_SEPARATOR_STR))
}

fn parse_media_progress_time_to_seconds(raw: &str) -> Option<f64> {
    let normalized = raw.trim();
    let mut parts = normalized.split(':');
    let hours = parts.next()?.parse::<f64>().ok()?;
    let minutes = parts.next()?.parse::<f64>().ok()?;
    let seconds = parts.next()?.parse::<f64>().ok()?;
    Some(hours * 3600.0 + minutes * 60.0 + seconds)
}

fn format_seconds(value: f64) -> String {
    format_decimal(value.max(0.0))
}

fn format_decimal(value: f64) -> String {
    let formatted = format!("{value:.6}");
    formatted
        .trim_end_matches('0')
        .trim_end_matches('.')
        .to_string()
}


fn map_render_media_error(error: ServerError) -> ServerError {
    if error.code() == "MEDIA_COMMAND_CANCELLED" {
        return ServerError::conflict("a conflict occurred");
    }
    error
}



fn resolve_entity_key_optional(id: &Option<String>, uuid: &Option<String>) -> Option<String> {
    uuid.as_ref()
        .and_then(|value| normalize_optional_text(Some(value.clone())))
        .or_else(|| {
            id.as_ref()
                .and_then(|value| normalize_optional_text(Some(value.clone())))
        })
}

fn normalize_page(value: Option<usize>) -> usize {
    value.unwrap_or(1).max(1)
}

fn normalize_page_size(value: Option<usize>) -> usize {
    value.unwrap_or(20).clamp(1, 200)
}

fn normalize_sort_fields(values: Vec<String>) -> Vec<RenderSortField> {
    let mut fields = values
        .into_iter()
        .filter_map(|value| parse_sort_field(&value))
        .collect::<Vec<_>>();

    if fields.is_empty() {
        fields.push(RenderSortField {
            field: "updatedAt",
            ascending: false,
        });
    }

    fields
}

fn parse_sort_field(value: &str) -> Option<RenderSortField> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    let mut parts = trimmed.split(',');
    let raw_field = parts.next()?.trim();
    let field = match raw_field {
        "fileName" => "fileName",
        "createdAt" => "createdAt",
        "updatedAt" => "updatedAt",
        "status" => "status",
        _ => return None,
    };

    let ascending = parts
        .next()
        .map(|direction| direction.trim().eq_ignore_ascii_case("asc"))
        .unwrap_or(false);

    Some(RenderSortField { field, ascending })
}

fn compare_render_jobs(
    left: &MagicCutRenderJobRecord,
    right: &MagicCutRenderJobRecord,
    sort_fields: &[RenderSortField],
) -> Ordering {
    for sort_field in sort_fields {
        let comparison = match sort_field.field {
            "fileName" => left
                .file_name
                .to_lowercase()
                .cmp(&right.file_name.to_lowercase()),
            "createdAt" => left.created_at_ms.cmp(&right.created_at_ms),
            "status" => render_status_rank(&left.status).cmp(&render_status_rank(&right.status)),
            _ => left.updated_at_ms.cmp(&right.updated_at_ms),
        };

        if comparison != Ordering::Equal {
            return if sort_field.ascending {
                comparison
            } else {
                comparison.reverse()
            };
        }
    }

    Ordering::Equal
}

fn render_status_rank(status: &MagicCutRenderStatus) -> u8 {
    match status {
        MagicCutRenderStatus::Pending => 0,
        MagicCutRenderStatus::Running => 1,
        MagicCutRenderStatus::Succeeded => 2,
        MagicCutRenderStatus::Failed => 3,
        MagicCutRenderStatus::Cancelled => 4,
    }
}
