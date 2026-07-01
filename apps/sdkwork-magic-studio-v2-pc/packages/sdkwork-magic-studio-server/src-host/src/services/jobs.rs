use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};

use super::toolkit::{
    ToolkitExecutionContext, ToolkitOperation, ToolkitOperationResult, ToolkitProgressUpdate,
    ToolkitService,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum JobKind {
    Toolkit,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum JobStatus {
    Pending,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobError {
    pub code: String,
    pub message: String,
}

impl From<ServerError> for JobError {
    fn from(value: ServerError) -> Self {
        Self {
            code: value.code().to_string(),
            message: value.detail,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobSnapshot {
    pub id: String,
    pub kind: JobKind,
    pub operation: String,
    pub status: JobStatus,
    pub progress: f32,
    pub stage: Option<String>,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub error: Option<JobError>,
    pub result: Option<ToolkitOperationResult>,
}

pub trait JobService: Send + Sync {
    fn submit_toolkit_job(&self, operation: ToolkitOperation) -> ServerResult<JobSnapshot>;
    fn get_job(&self, job_id: String) -> ServerResult<JobSnapshot>;
    fn list_jobs(&self) -> ServerResult<Vec<JobSnapshot>>;
    fn cancel_job(&self, job_id: String) -> ServerResult<JobSnapshot>;
}

struct JobState {
    snapshot: JobSnapshot,
    cancelled: Arc<AtomicBool>,
}

pub struct InMemoryJobService {
    toolkit_service: Arc<dyn ToolkitService>,
    jobs: Arc<Mutex<HashMap<String, JobState>>>,
    next_job_id: AtomicU64,
}

impl InMemoryJobService {
    pub fn new(toolkit_service: Arc<dyn ToolkitService>) -> Self {
        Self {
            toolkit_service,
            jobs: Arc::new(Mutex::new(HashMap::new())),
            next_job_id: AtomicU64::new(1),
        }
    }

    fn now_millis() -> u64 {
        match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(duration) => duration.as_millis() as u64,
            Err(_) => 0,
        }
    }

    fn operation_name(operation: &ToolkitOperation) -> String {
        match operation {
            ToolkitOperation::MediaProbe { .. } => "mediaProbe",
            ToolkitOperation::ImageResize { .. } => "imageResize",
            ToolkitOperation::VideoConcat { .. } => "videoConcat",
            ToolkitOperation::VideoTranscode { .. } => "videoTranscode",
            ToolkitOperation::VideoTrim { .. } => "videoTrim",
            ToolkitOperation::VideoExtractAudio { .. } => "videoExtractAudio",
            ToolkitOperation::VideoThumbnail { .. } => "videoThumbnail",
            ToolkitOperation::AudioConvert { .. } => "audioConvert",
            ToolkitOperation::AudioNormalize { .. } => "audioNormalize",
            ToolkitOperation::AudioMix { .. } => "audioMix",
            ToolkitOperation::ZipAssets { .. } => "zipAssets",
            ToolkitOperation::RecordAudio { .. } => "recordAudio",
            ToolkitOperation::RecordScreen { .. } => "recordScreen",
        }
        .to_string()
    }

    fn next_job_id(&self) -> String {
        let value = self.next_job_id.fetch_add(1, Ordering::Relaxed);
        format!("job-{value}")
    }

    fn progress_to_percent(progress: f32) -> f32 {
        ((progress.clamp(0.0, 1.0) * 1000.0).round()) / 10.0
    }

    fn update_running(state: &mut JobState) {
        state.snapshot.status = JobStatus::Running;
        state.snapshot.progress = 5.0;
        state.snapshot.stage = Some("running".to_string());
        state.snapshot.updated_at_ms = Self::now_millis();
    }

    fn update_cancelled(state: &mut JobState) {
        state.snapshot.status = JobStatus::Cancelled;
        state.snapshot.progress = 100.0;
        state.snapshot.stage = Some("cancelled".to_string());
        state.snapshot.updated_at_ms = Self::now_millis();
        state.snapshot.error = Some(JobError {
            code: "JOB_CANCELLED".to_string(),
            message: "job execution was cancelled".to_string(),
        });
        state.snapshot.result = None;
    }

    fn apply_progress_update(state: &mut JobState, update: ToolkitProgressUpdate) {
        state.snapshot.status = JobStatus::Running;
        state.snapshot.progress = Self::progress_to_percent(update.progress).clamp(0.0, 99.0);
        state.snapshot.stage = Some(update.stage);
        state.snapshot.updated_at_ms = Self::now_millis();
    }
}

impl JobService for InMemoryJobService {
    fn submit_toolkit_job(&self, operation: ToolkitOperation) -> ServerResult<JobSnapshot> {
        let job_id = self.next_job_id();
        let created_at = Self::now_millis();
        let cancelled = Arc::new(AtomicBool::new(false));

        let snapshot = JobSnapshot {
            id: job_id.clone(),
            kind: JobKind::Toolkit,
            operation: Self::operation_name(&operation),
            status: JobStatus::Pending,
            progress: 0.0,
            stage: Some("queued".to_string()),
            created_at_ms: created_at,
            updated_at_ms: created_at,
            error: None,
            result: None,
        };

        {
            let mut jobs = self.jobs.lock().map_err(|_| {
                ServerError::internal("failed to lock job state")
            })?;
            jobs.insert(
                job_id.clone(),
                JobState {
                    snapshot: snapshot.clone(),
                    cancelled: Arc::clone(&cancelled),
                },
            );
        }

        let jobs = Arc::clone(&self.jobs);
        let toolkit_service = Arc::clone(&self.toolkit_service);
        let operation_for_task = operation.clone();
        let job_id_for_task = job_id.clone();
        let cancelled_for_task = Arc::clone(&cancelled);

        tokio::spawn(async move {
            {
                if let Ok(mut jobs_map) = jobs.lock() {
                    if let Some(state) = jobs_map.get_mut(&job_id_for_task) {
                        InMemoryJobService::update_running(state);
                    }
                }
            }

            if cancelled_for_task.load(Ordering::SeqCst) {
                if let Ok(mut jobs_map) = jobs.lock() {
                    if let Some(state) = jobs_map.get_mut(&job_id_for_task) {
                        InMemoryJobService::update_cancelled(state);
                    }
                }
                return;
            }

            let progress_jobs = Arc::clone(&jobs);
            let progress_job_id = job_id_for_task.clone();
            let progress_callback: Arc<dyn Fn(ToolkitProgressUpdate) + Send + Sync> =
                Arc::new(move |update| {
                    if let Ok(mut jobs_map) = progress_jobs.lock() {
                        if let Some(state) = jobs_map.get_mut(&progress_job_id) {
                            if state.cancelled.load(Ordering::SeqCst) {
                                return;
                            }
                            InMemoryJobService::apply_progress_update(state, update);
                        }
                    }
                });

            let execution_context =
                ToolkitExecutionContext::new(Arc::clone(&cancelled_for_task), progress_callback);
            let task_result = tokio::task::spawn_blocking(move || {
                toolkit_service.execute_with_context(operation_for_task, execution_context)
            })
            .await;

            if let Ok(mut jobs_map) = jobs.lock() {
                if let Some(state) = jobs_map.get_mut(&job_id_for_task) {
                    if state.cancelled.load(Ordering::SeqCst) {
                        InMemoryJobService::update_cancelled(state);
                        return;
                    }

                    state.snapshot.updated_at_ms = InMemoryJobService::now_millis();
                    state.snapshot.progress = 100.0;
                    state.snapshot.stage = Some("completed".to_string());
                    match task_result {
                        Ok(Ok(result)) => {
                            state.snapshot.status = JobStatus::Succeeded;
                            state.snapshot.result = Some(result);
                            state.snapshot.error = None;
                        }
                        Ok(Err(error)) => {
                            state.snapshot.status = JobStatus::Failed;
                            state.snapshot.result = None;
                            state.snapshot.error = Some(error.into());
                            state.snapshot.stage = Some("failed".to_string());
                        }
                        Err(error) => {
                            state.snapshot.status = JobStatus::Failed;
                            state.snapshot.result = None;
                            state.snapshot.error = Some(JobError {
                                code: "JOB_JOIN_FAILED".to_string(),
                                message: format!("job worker join failed: {error}"),
                            });
                            state.snapshot.stage = Some("failed".to_string());
                        }
                    }
                }
            }
        });

        Ok(snapshot)
    }

    fn get_job(&self, job_id: String) -> ServerResult<JobSnapshot> {
        let jobs = self.jobs.lock().map_err(|_| {
            ServerError::internal("failed to lock job state")
        })?;

        jobs.get(&job_id)
            .map(|state| state.snapshot.clone())
            .ok_or_else(|| {
                ServerError::not_found(format!("job not found: {job_id}"),
                )
            })
    }

    fn list_jobs(&self) -> ServerResult<Vec<JobSnapshot>> {
        let jobs = self.jobs.lock().map_err(|_| {
            ServerError::internal("failed to lock job state")
        })?;
        let mut snapshots: Vec<JobSnapshot> =
            jobs.values().map(|state| state.snapshot.clone()).collect();
        snapshots.sort_by(|left, right| right.created_at_ms.cmp(&left.created_at_ms));
        Ok(snapshots)
    }

    fn cancel_job(&self, job_id: String) -> ServerResult<JobSnapshot> {
        let mut jobs = self.jobs.lock().map_err(|_| {
            ServerError::internal("failed to lock job state")
        })?;

        let state = jobs.get_mut(&job_id).ok_or_else(|| {
            ServerError::not_found(format!("job not found: {job_id}"),
            )
        })?;

        state.cancelled.store(true, Ordering::SeqCst);
        match state.snapshot.status {
            JobStatus::Pending | JobStatus::Running => {
                Self::update_cancelled(state);
            }
            JobStatus::Succeeded | JobStatus::Failed | JobStatus::Cancelled => {}
        }

        Ok(state.snapshot.clone())
    }
}
