use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::compression::CompressionService;
use crate::framework::services::filesystem::FileSystemService;
use crate::framework::services::media::{MediaCommandResult, MediaExecutionControl, MediaService};
use crate::framework::services::policy::{NativePolicyService, PathAccessType, PolicyService};
use crate::framework::services::system::SystemService;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolkitCapabilityMatrix {
    pub ffmpeg_available: bool,
    pub ffprobe_available: bool,
    pub image_processing: bool,
    pub video_processing: bool,
    pub audio_processing: bool,
    pub compression: bool,
    pub file_system: bool,
    pub audio_recording: bool,
    pub screen_recording: bool,
    pub sqlite_embedded: bool,
    pub runtime_os: String,
    pub runtime_arch: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolkitCommandResult {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

impl From<MediaCommandResult> for ToolkitCommandResult {
    fn from(value: MediaCommandResult) -> Self {
        Self {
            code: value.code,
            stdout: value.stdout,
            stderr: value.stderr,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolkitOperationResult {
    pub operation: String,
    pub command: Option<ToolkitCommandResult>,
    pub probe: Option<Value>,
    pub archive_bytes: Option<Vec<u8>>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ToolkitOperation {
    ProbeMedia {
        input: String,
    },
    ResizeImage {
        input: String,
        output: String,
        width: u32,
        height: u32,
    },
    TranscodeVideoH264 {
        input: String,
        output: String,
    },
    ExtractAudioWav {
        input: String,
        output: String,
    },
    MergeVideoAndAudio {
        video_input: String,
        audio_input: String,
        output: String,
    },
    ZipAssets {
        source_paths: Vec<String>,
    },
    RecordAudio {
        output: String,
        duration_seconds: Option<u32>,
        input_device: Option<String>,
    },
    RecordScreen {
        output: String,
        duration_seconds: Option<u32>,
        source: Option<String>,
    },
}

#[derive(Debug, Clone)]
pub struct ToolkitProgressUpdate {
    pub progress: f32,
    pub stage: String,
}

#[derive(Clone)]
pub struct ToolkitExecutionContext {
    cancel_signal: Arc<AtomicBool>,
    on_progress: Arc<dyn Fn(ToolkitProgressUpdate) + Send + Sync>,
}

impl ToolkitExecutionContext {
    pub fn new(
        cancel_signal: Arc<AtomicBool>,
        on_progress: Arc<dyn Fn(ToolkitProgressUpdate) + Send + Sync>,
    ) -> Self {
        Self {
            cancel_signal,
            on_progress,
        }
    }

    pub fn ensure_not_cancelled(&self) -> FrameworkResult<()> {
        if self.cancel_signal.load(Ordering::SeqCst) {
            return Err(FrameworkError::new(
                "TOOLKIT_OPERATION_CANCELLED",
                "toolkit operation cancelled",
            ));
        }
        Ok(())
    }

    pub fn report_progress(&self, progress: f32, stage: impl Into<String>) {
        let update = ToolkitProgressUpdate {
            progress: progress.clamp(0.0, 1.0),
            stage: stage.into(),
        };
        (self.on_progress)(update);
    }

    pub fn cancel_signal(&self) -> Arc<AtomicBool> {
        Arc::clone(&self.cancel_signal)
    }
}

impl Default for ToolkitExecutionContext {
    fn default() -> Self {
        Self {
            cancel_signal: Arc::new(AtomicBool::new(false)),
            on_progress: Arc::new(|_| {}),
        }
    }
}

fn is_likely_url(value: &str) -> bool {
    let normalized = value.trim().to_ascii_lowercase();
    normalized.starts_with("http://")
        || normalized.starts_with("https://")
        || normalized.starts_with("file://")
        || normalized.starts_with("data:")
        || normalized.starts_with("blob:")
}

pub trait ToolkitService: Send + Sync {
    fn capabilities(&self) -> FrameworkResult<ToolkitCapabilityMatrix>;

    fn execute_with_context(
        &self,
        operation: ToolkitOperation,
        context: ToolkitExecutionContext,
    ) -> FrameworkResult<ToolkitOperationResult>;

    fn execute(&self, operation: ToolkitOperation) -> FrameworkResult<ToolkitOperationResult> {
        self.execute_with_context(operation, ToolkitExecutionContext::default())
    }
}

pub struct LocalToolkitService {
    media_service: Arc<dyn MediaService>,
    compression_service: Arc<dyn CompressionService>,
    file_system_service: Arc<dyn FileSystemService>,
    system_service: Arc<dyn SystemService>,
    policy_service: Arc<dyn PolicyService>,
}

impl LocalToolkitService {
    pub fn new(
        media_service: Arc<dyn MediaService>,
        compression_service: Arc<dyn CompressionService>,
        file_system_service: Arc<dyn FileSystemService>,
        system_service: Arc<dyn SystemService>,
        policy_service: Arc<dyn PolicyService>,
    ) -> Self {
        Self {
            media_service,
            compression_service,
            file_system_service,
            system_service,
            policy_service,
        }
    }

    fn require_non_empty(value: &str, field: &str) -> FrameworkResult<()> {
        if value.trim().is_empty() {
            return Err(FrameworkError::new(
                "TOOLKIT_REQUIRED_FIELD_EMPTY",
                format!("{field} cannot be empty"),
            ));
        }
        Ok(())
    }

    fn ensure_output_parent(&self, output: &str) -> FrameworkResult<()> {
        Self::require_non_empty(output, "output")?;
        self.policy_service
            .validate_path(output.to_string(), PathAccessType::Write)?
            .ensure_allowed()?;
        self.file_system_service
            .ensure_parent_dir(output.to_string())
    }

    fn ensure_input_path(&self, input: &str, field: &str) -> FrameworkResult<()> {
        Self::require_non_empty(input, field)?;
        if is_likely_url(input) {
            return Ok(());
        }
        self.policy_service
            .validate_path(input.to_string(), PathAccessType::Read)?
            .ensure_allowed()
    }

    fn ensure_command_allowed(&self, command_name: &str) -> FrameworkResult<()> {
        self.policy_service
            .validate_command(command_name.to_string())?
            .ensure_allowed()
    }

    fn build_record_audio_args(
        output: String,
        duration_seconds: Option<u32>,
        input_device: Option<String>,
    ) -> Vec<String> {
        let (format, source) = if cfg!(target_os = "windows") {
            (
                "dshow".to_string(),
                input_device.unwrap_or_else(|| "audio=default".to_string()),
            )
        } else if cfg!(target_os = "macos") {
            (
                "avfoundation".to_string(),
                input_device.unwrap_or_else(|| ":0".to_string()),
            )
        } else {
            (
                "pulse".to_string(),
                input_device.unwrap_or_else(|| "default".to_string()),
            )
        };

        let mut args = vec![
            "-y".to_string(),
            "-f".to_string(),
            format,
            "-i".to_string(),
            source,
        ];
        if let Some(duration) = duration_seconds {
            args.push("-t".to_string());
            args.push(duration.to_string());
        }
        args.extend([
            "-acodec".to_string(),
            "aac".to_string(),
            "-ar".to_string(),
            "48000".to_string(),
            "-ac".to_string(),
            "2".to_string(),
            output,
        ]);
        args
    }

    fn build_record_screen_args(
        output: String,
        duration_seconds: Option<u32>,
        source: Option<String>,
    ) -> Vec<String> {
        let (format, source_value) = if cfg!(target_os = "windows") {
            (
                "gdigrab".to_string(),
                source.unwrap_or_else(|| "desktop".to_string()),
            )
        } else if cfg!(target_os = "macos") {
            (
                "avfoundation".to_string(),
                source.unwrap_or_else(|| "1:none".to_string()),
            )
        } else {
            (
                "x11grab".to_string(),
                source.unwrap_or_else(|| ":0.0".to_string()),
            )
        };

        let mut args = vec![
            "-y".to_string(),
            "-f".to_string(),
            format,
            "-i".to_string(),
            source_value,
        ];
        if let Some(duration) = duration_seconds {
            args.push("-t".to_string());
            args.push(duration.to_string());
        }
        args.extend(["-pix_fmt".to_string(), "yuv420p".to_string(), output]);
        args
    }

    fn with_ffmpeg_progress_args(args: Vec<String>) -> Vec<String> {
        let mut final_args = Vec::with_capacity(args.len() + 3);
        final_args.push("-progress".to_string());
        final_args.push("pipe:2".to_string());
        final_args.push("-nostats".to_string());
        final_args.extend(args);
        final_args
    }

    fn media_duration_seconds(&self, input: &str) -> Option<f64> {
        let result = self.media_service.ffprobe_json(input.to_string()).ok()?;
        let duration_value = result.get("format")?.get("duration")?;
        if let Some(raw) = duration_value.as_str() {
            return raw.parse::<f64>().ok();
        }
        duration_value.as_f64()
    }

    fn parse_ffmpeg_time_to_seconds(raw: &str) -> Option<f64> {
        let normalized = raw.trim();
        let mut parts = normalized.split(':');
        let hours = parts.next()?.parse::<f64>().ok()?;
        let minutes = parts.next()?.parse::<f64>().ok()?;
        let seconds = parts.next()?.parse::<f64>().ok()?;
        Some(hours * 3600.0 + minutes * 60.0 + seconds)
    }

    fn ensure_ffmpeg_success(
        command: &MediaCommandResult,
        operation_name: &'static str,
    ) -> FrameworkResult<()> {
        if command.code == 0 {
            return Ok(());
        }
        Err(FrameworkError::new(
            "TOOLKIT_FFMPEG_NON_ZERO_EXIT",
            format!(
                "{operation_name} failed with code {}: {}",
                command.code, command.stderr
            ),
        ))
    }

    fn run_ffmpeg_with_progress(
        &self,
        args: Vec<String>,
        duration_seconds: Option<f64>,
        context: &ToolkitExecutionContext,
        stage_prefix: &'static str,
    ) -> FrameworkResult<MediaCommandResult> {
        let context_for_callback = context.clone();
        let duration = duration_seconds.unwrap_or(0.0);
        let stage_processing = format!("{stage_prefix}: processing");
        let stage_finalizing = format!("{stage_prefix}: finalizing");

        let callback = Arc::new(move |line: String| {
            if let Some(value) = line.strip_prefix("out_time=") {
                if duration > 0.0 {
                    if let Some(current) = LocalToolkitService::parse_ffmpeg_time_to_seconds(value)
                    {
                        let ratio = (current / duration).clamp(0.0, 1.0) as f32;
                        context_for_callback
                            .report_progress(0.1_f32 + ratio * 0.8_f32, stage_processing.clone());
                    }
                }
                return;
            }
            if line.trim() == "progress=end" {
                context_for_callback.report_progress(0.95, stage_finalizing.clone());
            }
        });

        self.media_service.ffmpeg_exec_controlled(
            args,
            MediaExecutionControl {
                cancel_signal: context.cancel_signal(),
                on_stderr_line: Some(callback),
            },
        )
    }
}

impl Default for LocalToolkitService {
    fn default() -> Self {
        let policy_service: Arc<dyn PolicyService> = Arc::new(NativePolicyService::default());
        let file_system_service: Arc<dyn FileSystemService> =
            Arc::new(super::LocalFileSystemService::default());
        let system_service: Arc<dyn SystemService> =
            Arc::new(super::NativeSystemService::default());
        let media_service: Arc<dyn MediaService> =
            Arc::new(super::SystemMediaService::new(Arc::clone(&system_service)));
        let compression_service: Arc<dyn CompressionService> = Arc::new(
            super::NativeCompressionService::new(Arc::clone(&file_system_service)),
        );

        Self::new(
            media_service,
            compression_service,
            file_system_service,
            system_service,
            policy_service,
        )
    }
}

impl ToolkitService for LocalToolkitService {
    fn capabilities(&self) -> FrameworkResult<ToolkitCapabilityMatrix> {
        let ffmpeg_available = self.media_service.ffmpeg_available().unwrap_or(false);
        let ffprobe_available = self
            .system_service
            .command_exists("ffprobe".to_string())
            .unwrap_or(false);
        let runtime_info = self.system_service.runtime_info()?;

        Ok(ToolkitCapabilityMatrix {
            ffmpeg_available,
            ffprobe_available,
            image_processing: ffmpeg_available,
            video_processing: ffmpeg_available,
            audio_processing: ffmpeg_available,
            compression: true,
            file_system: true,
            audio_recording: ffmpeg_available,
            screen_recording: ffmpeg_available,
            sqlite_embedded: true,
            runtime_os: runtime_info.os,
            runtime_arch: runtime_info.arch,
        })
    }

    fn execute_with_context(
        &self,
        operation: ToolkitOperation,
        context: ToolkitExecutionContext,
    ) -> FrameworkResult<ToolkitOperationResult> {
        context.ensure_not_cancelled()?;
        match operation {
            ToolkitOperation::ProbeMedia { input } => {
                context.report_progress(0.05, "probeMedia: starting");
                self.ensure_command_allowed("ffprobe")?;
                self.ensure_input_path(&input, "input")?;
                let probe = self.media_service.ffprobe_json(input)?;
                context.report_progress(1.0, "probeMedia: completed");
                Ok(ToolkitOperationResult {
                    operation: "probeMedia".to_string(),
                    command: None,
                    probe: Some(probe),
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::ResizeImage {
                input,
                output,
                width,
                height,
            } => {
                context.report_progress(0.05, "resizeImage: preparing");
                self.ensure_command_allowed("ffmpeg")?;
                self.ensure_input_path(&input, "input")?;
                self.ensure_output_parent(&output)?;
                let duration = self.media_duration_seconds(&input);
                let args = Self::with_ffmpeg_progress_args(vec![
                    "-y".to_string(),
                    "-i".to_string(),
                    input,
                    "-vf".to_string(),
                    format!("scale={width}:{height}"),
                    output,
                ]);
                let command =
                    self.run_ffmpeg_with_progress(args, duration, &context, "resizeImage")?;
                Self::ensure_ffmpeg_success(&command, "resizeImage")?;
                context.report_progress(1.0, "resizeImage: completed");
                Ok(ToolkitOperationResult {
                    operation: "resizeImage".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::TranscodeVideoH264 { input, output } => {
                context.report_progress(0.05, "transcodeVideoH264: preparing");
                self.ensure_command_allowed("ffmpeg")?;
                self.ensure_input_path(&input, "input")?;
                self.ensure_output_parent(&output)?;
                let duration = self.media_duration_seconds(&input);
                let args = Self::with_ffmpeg_progress_args(vec![
                    "-y".to_string(),
                    "-i".to_string(),
                    input,
                    "-c:v".to_string(),
                    "libx264".to_string(),
                    "-preset".to_string(),
                    "medium".to_string(),
                    "-crf".to_string(),
                    "23".to_string(),
                    "-c:a".to_string(),
                    "aac".to_string(),
                    "-b:a".to_string(),
                    "192k".to_string(),
                    output,
                ]);
                let command =
                    self.run_ffmpeg_with_progress(args, duration, &context, "transcodeVideoH264")?;
                Self::ensure_ffmpeg_success(&command, "transcodeVideoH264")?;
                context.report_progress(1.0, "transcodeVideoH264: completed");
                Ok(ToolkitOperationResult {
                    operation: "transcodeVideoH264".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::ExtractAudioWav { input, output } => {
                context.report_progress(0.05, "extractAudioWav: preparing");
                self.ensure_command_allowed("ffmpeg")?;
                self.ensure_input_path(&input, "input")?;
                self.ensure_output_parent(&output)?;
                let duration = self.media_duration_seconds(&input);
                let args = Self::with_ffmpeg_progress_args(vec![
                    "-y".to_string(),
                    "-i".to_string(),
                    input,
                    "-vn".to_string(),
                    "-acodec".to_string(),
                    "pcm_s16le".to_string(),
                    "-ar".to_string(),
                    "48000".to_string(),
                    "-ac".to_string(),
                    "2".to_string(),
                    output,
                ]);
                let command =
                    self.run_ffmpeg_with_progress(args, duration, &context, "extractAudioWav")?;
                Self::ensure_ffmpeg_success(&command, "extractAudioWav")?;
                context.report_progress(1.0, "extractAudioWav: completed");
                Ok(ToolkitOperationResult {
                    operation: "extractAudioWav".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::MergeVideoAndAudio {
                video_input,
                audio_input,
                output,
            } => {
                context.report_progress(0.05, "mergeVideoAndAudio: preparing");
                self.ensure_command_allowed("ffmpeg")?;
                self.ensure_input_path(&video_input, "videoInput")?;
                self.ensure_input_path(&audio_input, "audioInput")?;
                self.ensure_output_parent(&output)?;
                let duration = self.media_duration_seconds(&video_input);
                let args = Self::with_ffmpeg_progress_args(vec![
                    "-y".to_string(),
                    "-i".to_string(),
                    video_input,
                    "-i".to_string(),
                    audio_input,
                    "-c:v".to_string(),
                    "copy".to_string(),
                    "-c:a".to_string(),
                    "aac".to_string(),
                    "-shortest".to_string(),
                    output,
                ]);
                let command =
                    self.run_ffmpeg_with_progress(args, duration, &context, "mergeVideoAndAudio")?;
                Self::ensure_ffmpeg_success(&command, "mergeVideoAndAudio")?;
                context.report_progress(1.0, "mergeVideoAndAudio: completed");
                Ok(ToolkitOperationResult {
                    operation: "mergeVideoAndAudio".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::ZipAssets { source_paths } => {
                context.report_progress(0.05, "zipAssets: preparing");
                if source_paths.is_empty() {
                    return Err(FrameworkError::new(
                        "TOOLKIT_ZIP_ASSETS_EMPTY",
                        "source paths cannot be empty",
                    ));
                }
                for path in &source_paths {
                    self.ensure_input_path(path, "sourcePath")?;
                }
                context.ensure_not_cancelled()?;
                let archive_bytes = self.compression_service.zip_bytes(source_paths)?;
                context.report_progress(1.0, "zipAssets: completed");
                Ok(ToolkitOperationResult {
                    operation: "zipAssets".to_string(),
                    command: None,
                    probe: None,
                    archive_bytes: Some(archive_bytes),
                    notes: None,
                })
            }
            ToolkitOperation::RecordAudio {
                output,
                duration_seconds,
                input_device,
            } => {
                context.report_progress(0.05, "recordAudio: preparing");
                self.ensure_command_allowed("ffmpeg")?;
                self.ensure_output_parent(&output)?;
                if !self.media_service.ffmpeg_available()? {
                    return Err(FrameworkError::new(
                        "TOOLKIT_FFMPEG_NOT_AVAILABLE",
                        "ffmpeg/ffprobe is required for audio recording",
                    ));
                }
                let args = Self::with_ffmpeg_progress_args(Self::build_record_audio_args(
                    output,
                    duration_seconds,
                    input_device,
                ));
                let command = self.run_ffmpeg_with_progress(args, None, &context, "recordAudio")?;
                Self::ensure_ffmpeg_success(&command, "recordAudio")?;
                context.report_progress(1.0, "recordAudio: completed");
                Ok(ToolkitOperationResult {
                    operation: "recordAudio".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: Some("audio capture uses ffmpeg native backend".to_string()),
                })
            }
            ToolkitOperation::RecordScreen {
                output,
                duration_seconds,
                source,
            } => {
                context.report_progress(0.05, "recordScreen: preparing");
                self.ensure_command_allowed("ffmpeg")?;
                self.ensure_output_parent(&output)?;
                if !self.media_service.ffmpeg_available()? {
                    return Err(FrameworkError::new(
                        "TOOLKIT_FFMPEG_NOT_AVAILABLE",
                        "ffmpeg/ffprobe is required for screen recording",
                    ));
                }
                let args = Self::with_ffmpeg_progress_args(Self::build_record_screen_args(
                    output,
                    duration_seconds,
                    source,
                ));
                let command =
                    self.run_ffmpeg_with_progress(args, None, &context, "recordScreen")?;
                Self::ensure_ffmpeg_success(&command, "recordScreen")?;
                context.report_progress(1.0, "recordScreen: completed");
                Ok(ToolkitOperationResult {
                    operation: "recordScreen".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: Some("screen capture uses ffmpeg platform grab device".to_string()),
                })
            }
        }
    }
}
