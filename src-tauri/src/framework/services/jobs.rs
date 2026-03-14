use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

use crate::events::JOB_UPDATED;
use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::toolkit::{
    ToolkitExecutionContext, ToolkitOperation, ToolkitOperationResult, ToolkitProgressUpdate,
    ToolkitService,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
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
pub struct JobSnapshot {
    pub id: String,
    pub operation: String,
    pub status: JobStatus,
    pub progress: f32,
    pub stage: Option<String>,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub error: Option<FrameworkError>,
    pub result: Option<ToolkitOperationResult>,
}

pub trait JobService: Send + Sync {
    fn submit_toolkit_job(
        &self,
        app_handle: AppHandle,
        operation: ToolkitOperation,
    ) -> FrameworkResult<JobSnapshot>;
    fn get_job(&self, job_id: String) -> FrameworkResult<JobSnapshot>;
    fn list_jobs(&self) -> FrameworkResult<Vec<JobSnapshot>>;
    fn cancel_job(&self, app_handle: AppHandle, job_id: String) -> FrameworkResult<JobSnapshot>;
}

struct JobState {
    snapshot: JobSnapshot,
    cancelled: Arc<AtomicBool>,
}

pub struct InMemoryJobService {
    toolkit_service: Arc<dyn ToolkitService>,
    jobs: Arc<Mutex<HashMap<String, JobState>>>,
}

impl InMemoryJobService {
    pub fn new(toolkit_service: Arc<dyn ToolkitService>) -> Self {
        Self {
            toolkit_service,
            jobs: Arc::new(Mutex::new(HashMap::new())),
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
            ToolkitOperation::ProbeMedia { .. } => "probeMedia",
            ToolkitOperation::ResizeImage { .. } => "resizeImage",
            ToolkitOperation::TranscodeVideoH264 { .. } => "transcodeVideoH264",
            ToolkitOperation::ExtractAudioWav { .. } => "extractAudioWav",
            ToolkitOperation::MergeVideoAndAudio { .. } => "mergeVideoAndAudio",
            ToolkitOperation::ZipAssets { .. } => "zipAssets",
            ToolkitOperation::RecordAudio { .. } => "recordAudio",
            ToolkitOperation::RecordScreen { .. } => "recordScreen",
        }
        .to_string()
    }

    fn emit_snapshot(app_handle: &AppHandle, snapshot: &JobSnapshot) {
        let _ = app_handle.emit(JOB_UPDATED, snapshot);
    }

    fn update_running(state: &mut JobState) {
        state.snapshot.status = JobStatus::Running;
        state.snapshot.progress = 0.05;
        state.snapshot.stage = Some("running".to_string());
        state.snapshot.updated_at_ms = Self::now_millis();
    }

    fn update_cancelled(state: &mut JobState) {
        state.snapshot.status = JobStatus::Cancelled;
        state.snapshot.progress = 1.0;
        state.snapshot.stage = Some("cancelled".to_string());
        state.snapshot.updated_at_ms = Self::now_millis();
        state.snapshot.error = Some(FrameworkError::new(
            "JOB_CANCELLED",
            "job execution was cancelled",
        ));
        state.snapshot.result = None;
    }

    fn apply_progress_update(state: &mut JobState, update: ToolkitProgressUpdate) {
        state.snapshot.status = JobStatus::Running;
        state.snapshot.progress = update.progress.clamp(0.0, 0.99);
        state.snapshot.stage = Some(update.stage);
        state.snapshot.updated_at_ms = Self::now_millis();
    }
}

impl JobService for InMemoryJobService {
    fn submit_toolkit_job(
        &self,
        app_handle: AppHandle,
        operation: ToolkitOperation,
    ) -> FrameworkResult<JobSnapshot> {
        let job_id = Uuid::new_v4().to_string();
        let created_at = Self::now_millis();
        let cancelled = Arc::new(AtomicBool::new(false));

        let snapshot = JobSnapshot {
            id: job_id.clone(),
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
                FrameworkError::new("JOB_STATE_LOCK_FAILED", "failed to lock job state")
            })?;
            jobs.insert(
                job_id.clone(),
                JobState {
                    snapshot: snapshot.clone(),
                    cancelled: Arc::clone(&cancelled),
                },
            );
        }
        Self::emit_snapshot(&app_handle, &snapshot);

        let jobs = Arc::clone(&self.jobs);
        let toolkit_service = Arc::clone(&self.toolkit_service);
        let operation_for_task = operation.clone();
        let job_id_for_task = job_id.clone();
        let cancelled_for_task = Arc::clone(&cancelled);
        let app_for_task = app_handle.clone();

        tauri::async_runtime::spawn(async move {
            let running_snapshot = {
                if let Ok(mut jobs_map) = jobs.lock() {
                    if let Some(state) = jobs_map.get_mut(&job_id_for_task) {
                        InMemoryJobService::update_running(state);
                        Some(state.snapshot.clone())
                    } else {
                        None
                    }
                } else {
                    None
                }
            };
            if let Some(snapshot) = running_snapshot {
                InMemoryJobService::emit_snapshot(&app_for_task, &snapshot);
            }

            if cancelled_for_task.load(Ordering::SeqCst) {
                let cancelled_snapshot = {
                    if let Ok(mut jobs_map) = jobs.lock() {
                        if let Some(state) = jobs_map.get_mut(&job_id_for_task) {
                            InMemoryJobService::update_cancelled(state);
                            Some(state.snapshot.clone())
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                };
                if let Some(snapshot) = cancelled_snapshot {
                    InMemoryJobService::emit_snapshot(&app_for_task, &snapshot);
                }
                return;
            }

            let progress_jobs = Arc::clone(&jobs);
            let progress_job_id = job_id_for_task.clone();
            let progress_app = app_for_task.clone();
            let progress_callback: Arc<dyn Fn(ToolkitProgressUpdate) + Send + Sync> =
                Arc::new(move |update| {
                    let snapshot = {
                        if let Ok(mut jobs_map) = progress_jobs.lock() {
                            if let Some(state) = jobs_map.get_mut(&progress_job_id) {
                                if state.cancelled.load(Ordering::SeqCst) {
                                    return;
                                }
                                InMemoryJobService::apply_progress_update(state, update);
                                Some(state.snapshot.clone())
                            } else {
                                None
                            }
                        } else {
                            None
                        }
                    };
                    if let Some(snapshot) = snapshot {
                        InMemoryJobService::emit_snapshot(&progress_app, &snapshot);
                    }
                });

            let execution_context =
                ToolkitExecutionContext::new(Arc::clone(&cancelled_for_task), progress_callback);
            let task_result = tauri::async_runtime::spawn_blocking(move || {
                toolkit_service.execute_with_context(operation_for_task, execution_context)
            })
            .await;

            let final_snapshot = {
                if let Ok(mut jobs_map) = jobs.lock() {
                    if let Some(state) = jobs_map.get_mut(&job_id_for_task) {
                        if state.cancelled.load(Ordering::SeqCst) {
                            InMemoryJobService::update_cancelled(state);
                            Some(state.snapshot.clone())
                        } else {
                            state.snapshot.updated_at_ms = InMemoryJobService::now_millis();
                            state.snapshot.progress = 1.0;
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
                                    state.snapshot.error = Some(error);
                                    state.snapshot.stage = Some("failed".to_string());
                                }
                                Err(error) => {
                                    state.snapshot.status = JobStatus::Failed;
                                    state.snapshot.result = None;
                                    state.snapshot.error = Some(FrameworkError::new(
                                        "JOB_JOIN_FAILED",
                                        format!("job worker join failed: {error}"),
                                    ));
                                    state.snapshot.stage = Some("failed".to_string());
                                }
                            }
                            Some(state.snapshot.clone())
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            if let Some(snapshot) = final_snapshot {
                InMemoryJobService::emit_snapshot(&app_for_task, &snapshot);
            }
        });

        Ok(snapshot)
    }

    fn get_job(&self, job_id: String) -> FrameworkResult<JobSnapshot> {
        let jobs = self.jobs.lock().map_err(|_| {
            FrameworkError::new("JOB_STATE_LOCK_FAILED", "failed to lock job state")
        })?;

        jobs.get(&job_id)
            .map(|state| state.snapshot.clone())
            .ok_or_else(|| FrameworkError::new("JOB_NOT_FOUND", format!("job not found: {job_id}")))
    }

    fn list_jobs(&self) -> FrameworkResult<Vec<JobSnapshot>> {
        let jobs = self.jobs.lock().map_err(|_| {
            FrameworkError::new("JOB_STATE_LOCK_FAILED", "failed to lock job state")
        })?;
        let mut snapshots: Vec<JobSnapshot> =
            jobs.values().map(|state| state.snapshot.clone()).collect();
        snapshots.sort_by(|left, right| right.created_at_ms.cmp(&left.created_at_ms));
        Ok(snapshots)
    }

    fn cancel_job(&self, app_handle: AppHandle, job_id: String) -> FrameworkResult<JobSnapshot> {
        let mut jobs = self.jobs.lock().map_err(|_| {
            FrameworkError::new("JOB_STATE_LOCK_FAILED", "failed to lock job state")
        })?;

        let state = jobs.get_mut(&job_id).ok_or_else(|| {
            FrameworkError::new("JOB_NOT_FOUND", format!("job not found: {job_id}"))
        })?;

        state.cancelled.store(true, Ordering::SeqCst);
        match state.snapshot.status {
            JobStatus::Pending | JobStatus::Running => {
                Self::update_cancelled(state);
            }
            JobStatus::Succeeded | JobStatus::Failed | JobStatus::Cancelled => {}
        }

        let snapshot = state.snapshot.clone();
        drop(jobs);
        Self::emit_snapshot(&app_handle, &snapshot);
        Ok(snapshot)
    }
}
