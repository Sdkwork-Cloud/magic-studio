use std::io::{BufRead, BufReader, Read};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use serde::Serialize;
use serde_json::Value;

use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::SystemService;

#[derive(Debug, Serialize)]
pub struct MediaCommandResult {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Clone)]
pub struct MediaExecutionControl {
    pub cancel_signal: Arc<AtomicBool>,
    pub on_stderr_line: Option<Arc<dyn Fn(String) + Send + Sync>>,
}

impl Default for MediaExecutionControl {
    fn default() -> Self {
        Self {
            cancel_signal: Arc::new(AtomicBool::new(false)),
            on_stderr_line: None,
        }
    }
}

pub trait MediaService: Send + Sync {
    fn ffmpeg_available(&self) -> FrameworkResult<bool>;
    fn ffmpeg_exec(&self, args: Vec<String>) -> FrameworkResult<MediaCommandResult>;
    fn ffmpeg_exec_controlled(
        &self,
        args: Vec<String>,
        control: MediaExecutionControl,
    ) -> FrameworkResult<MediaCommandResult>;
    fn ffprobe_json(&self, input: String) -> FrameworkResult<Value>;
}

pub struct SystemMediaService {
    system_service: Arc<dyn SystemService>,
}

impl SystemMediaService {
    pub fn new(system_service: Arc<dyn SystemService>) -> Self {
        Self { system_service }
    }
}

impl Default for SystemMediaService {
    fn default() -> Self {
        Self {
            system_service: Arc::new(super::NativeSystemService::default()),
        }
    }
}

impl MediaService for SystemMediaService {
    fn ffmpeg_available(&self) -> FrameworkResult<bool> {
        Ok(self.system_service.command_exists("ffmpeg".to_string())?
            && self.system_service.command_exists("ffprobe".to_string())?)
    }

    fn ffmpeg_exec(&self, args: Vec<String>) -> FrameworkResult<MediaCommandResult> {
        self.ffmpeg_exec_controlled(args, MediaExecutionControl::default())
    }

    fn ffmpeg_exec_controlled(
        &self,
        args: Vec<String>,
        control: MediaExecutionControl,
    ) -> FrameworkResult<MediaCommandResult> {
        if args.is_empty() {
            return Err(FrameworkError::new(
                "MEDIA_FFMPEG_ARGS_EMPTY",
                "ffmpeg args cannot be empty",
            ));
        }

        let mut child = Command::new("ffmpeg")
            .args(args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| FrameworkError::new("MEDIA_FFMPEG_EXEC_FAILED", error.to_string()))?;

        let stdout = child.stdout.take().ok_or_else(|| {
            FrameworkError::new("MEDIA_FFMPEG_STDOUT_MISSING", "stdout pipe missing")
        })?;
        let stderr = child.stderr.take().ok_or_else(|| {
            FrameworkError::new("MEDIA_FFMPEG_STDERR_MISSING", "stderr pipe missing")
        })?;

        let stdout_acc = Arc::new(Mutex::new(Vec::<u8>::new()));
        let stdout_acc_clone = Arc::clone(&stdout_acc);
        let stdout_thread = thread::spawn(move || {
            let mut reader = BufReader::new(stdout);
            let mut buffer = Vec::new();
            let _ = reader.read_to_end(&mut buffer);
            if let Ok(mut target) = stdout_acc_clone.lock() {
                *target = buffer;
            }
        });

        let stderr_acc = Arc::new(Mutex::new(String::new()));
        let stderr_acc_clone = Arc::clone(&stderr_acc);
        let line_callback = control.on_stderr_line.clone();
        let stderr_thread = thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line_result in reader.lines() {
                let line = match line_result {
                    Ok(value) => value,
                    Err(_) => break,
                };
                if let Ok(mut target) = stderr_acc_clone.lock() {
                    target.push_str(&line);
                    target.push('\n');
                }
                if let Some(callback) = &line_callback {
                    callback(line);
                }
            }
        });

        let exit_code = loop {
            if control.cancel_signal.load(Ordering::SeqCst) {
                let _ = child.kill();
                let _ = child.wait();
                let _ = stdout_thread.join();
                let _ = stderr_thread.join();
                return Err(FrameworkError::new(
                    "MEDIA_FFMPEG_CANCELLED",
                    "ffmpeg execution was cancelled",
                ));
            }

            match child.try_wait() {
                Ok(Some(status)) => break status.code().unwrap_or(-1),
                Ok(None) => thread::sleep(Duration::from_millis(120)),
                Err(error) => {
                    let _ = stdout_thread.join();
                    let _ = stderr_thread.join();
                    return Err(FrameworkError::new(
                        "MEDIA_FFMPEG_WAIT_FAILED",
                        error.to_string(),
                    ));
                }
            }
        };

        let _ = stdout_thread.join();
        let _ = stderr_thread.join();

        let stdout = stdout_acc
            .lock()
            .map(|buffer| String::from_utf8_lossy(&buffer).to_string())
            .unwrap_or_default();
        let stderr = stderr_acc
            .lock()
            .map(|buffer| buffer.clone())
            .unwrap_or_default();

        Ok(MediaCommandResult {
            code: exit_code,
            stdout,
            stderr,
        })
    }

    fn ffprobe_json(&self, input: String) -> FrameworkResult<Value> {
        if input.trim().is_empty() {
            return Err(FrameworkError::new(
                "MEDIA_FFPROBE_INPUT_EMPTY",
                "ffprobe input is required",
            ));
        }

        let output = Command::new("ffprobe")
            .args([
                "-v",
                "error",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                &input,
            ])
            .output()
            .map_err(|error| FrameworkError::new("MEDIA_FFPROBE_EXEC_FAILED", error.to_string()))?;

        if !output.status.success() {
            return Err(FrameworkError::new(
                "MEDIA_FFPROBE_NON_ZERO_EXIT",
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        serde_json::from_slice::<Value>(&output.stdout).map_err(|error| {
            FrameworkError::new("MEDIA_FFPROBE_JSON_PARSE_FAILED", error.to_string())
        })
    }
}
