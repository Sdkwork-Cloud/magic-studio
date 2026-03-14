use super::error::{FrameworkError, FrameworkResult};

pub async fn run_blocking<T, F>(operation: &'static str, task: F) -> FrameworkResult<T>
where
    T: Send + 'static,
    F: FnOnce() -> FrameworkResult<T> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|error| {
            FrameworkError::new(
                "RUNTIME_BLOCKING_TASK_JOIN_FAILED",
                format!("{operation} join failed: {error}"),
            )
        })?
}
