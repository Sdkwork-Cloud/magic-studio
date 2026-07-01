use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::response::{ServerError, ServerResult};
use crate::services::policy::{PathAccessType, PolicyService};

use super::compression::{CompressionService, NativeCompressionService};
use super::filesystem::{FileSystemService, LocalFileSystemService};
use super::media::{
    AudioConvertRequest, AudioMixInput, AudioMixRequest, AudioNormalizeRequest, ImageResizeRequest,
    MediaCommandResult, MediaExecutionControl, MediaService, MediaVideoConcatRequest,
    SystemMediaService, VideoExtractAudioRequest, VideoThumbnailRequest, VideoTranscodeRequest,
    VideoTrimRequest,
};
use super::system::{NativeSystemService, SystemService};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolkitCapabilityMatrix {
    pub media_probe_available: bool,
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
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ToolkitOperation {
    MediaProbe {
        input: String,
    },
    ImageResize {
        input_path: String,
        output_path: String,
        width: u32,
        height: u32,
        overwrite: Option<bool>,
    },
    VideoConcat {
        input_paths: Vec<String>,
        output_path: String,
        overwrite: Option<bool>,
    },
    VideoTranscode {
        input_path: String,
        output_path: String,
        video_codec: Option<String>,
        audio_codec: Option<String>,
        fps: Option<f64>,
        width: Option<u32>,
        height: Option<u32>,
        video_bitrate_kbps: Option<u32>,
        audio_bitrate_kbps: Option<u32>,
        overwrite: Option<bool>,
    },
    VideoTrim {
        input_path: String,
        output_path: String,
        start_seconds: f64,
        duration_seconds: Option<f64>,
        overwrite: Option<bool>,
    },
    VideoExtractAudio {
        input_path: String,
        output_path: String,
        overwrite: Option<bool>,
    },
    VideoThumbnail {
        input_path: String,
        output_path: String,
        time_seconds: Option<f64>,
        width: Option<u32>,
        height: Option<u32>,
    },
    AudioConvert {
        input_path: String,
        output_path: String,
        codec: Option<String>,
        bitrate_kbps: Option<u32>,
        sample_rate: Option<u32>,
        channels: Option<u32>,
        overwrite: Option<bool>,
    },
    AudioNormalize {
        input_path: String,
        output_path: String,
        overwrite: Option<bool>,
    },
    AudioMix {
        inputs: Vec<AudioMixInput>,
        output_path: String,
        overwrite: Option<bool>,
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

    pub fn ensure_not_cancelled(&self) -> ServerResult<()> {
        if self.cancel_signal.load(Ordering::SeqCst) {
            return Err(ServerError::conflict("a conflict occurred"));
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
    fn capabilities(&self) -> ServerResult<ToolkitCapabilityMatrix>;

    fn execute_with_context(
        &self,
        operation: ToolkitOperation,
        context: ToolkitExecutionContext,
    ) -> ServerResult<ToolkitOperationResult>;

    fn execute(&self, operation: ToolkitOperation) -> ServerResult<ToolkitOperationResult> {
        self.execute_with_context(operation, ToolkitExecutionContext::default())
    }
}

pub struct LocalToolkitService {
    media_service: Arc<dyn MediaService>,
    compression_service: Arc<dyn CompressionService>,
    file_system_service: Arc<dyn FileSystemService>,
    system_service: Arc<dyn SystemService>,
    policy_service: PolicyService,
}

impl LocalToolkitService {
    pub fn new(
        media_service: Arc<dyn MediaService>,
        compression_service: Arc<dyn CompressionService>,
        file_system_service: Arc<dyn FileSystemService>,
        system_service: Arc<dyn SystemService>,
        policy_service: PolicyService,
    ) -> Self {
        Self {
            media_service,
            compression_service,
            file_system_service,
            system_service,
            policy_service,
        }
    }

    fn require_non_empty(value: &str, field: &str) -> ServerResult<()> {
        if value.trim().is_empty() {
            return Err(ServerError::bad_request(format!("{field} cannot be empty"),
            ));
        }
        Ok(())
    }

    fn ensure_output_parent(&self, output: &str) -> ServerResult<()> {
        Self::require_non_empty(output, "output")?;
        self.policy_service
            .validate_path(output.to_string(), PathAccessType::Write)?
            .ensure_allowed()?;
        self.file_system_service
            .ensure_parent_dir(output.to_string())
    }

    fn ensure_input_path(&self, input: &str, field: &str) -> ServerResult<()> {
        Self::require_non_empty(input, field)?;
        if is_likely_url(input) {
            return Ok(());
        }
        self.policy_service
            .validate_path(input.to_string(), PathAccessType::Read)?
            .ensure_allowed()
    }

    fn ensure_command_allowed(&self, command_name: &str) -> ServerResult<()> {
        self.policy_service
            .validate_command(command_name.to_string())
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

    fn with_media_progress_args(args: Vec<String>) -> Vec<String> {
        let mut final_args = Vec::with_capacity(args.len() + 3);
        final_args.push("-progress".to_string());
        final_args.push("pipe:2".to_string());
        final_args.push("-nostats".to_string());
        final_args.extend(args);
        final_args
    }

    fn media_duration_seconds(&self, input: &str) -> Option<f64> {
        let result = self.media_service.media_probe(input.to_string()).ok()?;
        let duration_value = result.get("format")?.get("duration")?;
        if let Some(raw) = duration_value.as_str() {
            return raw.parse::<f64>().ok();
        }
        duration_value.as_f64()
    }

    fn media_durations_seconds(&self, inputs: &[String]) -> Option<f64> {
        inputs
            .iter()
            .filter_map(|input| self.media_duration_seconds(input))
            .reduce(f64::max)
    }

    fn parse_media_progress_time_to_seconds(raw: &str) -> Option<f64> {
        let normalized = raw.trim();
        let mut parts = normalized.split(':');
        let hours = parts.next()?.parse::<f64>().ok()?;
        let minutes = parts.next()?.parse::<f64>().ok()?;
        let seconds = parts.next()?.parse::<f64>().ok()?;
        Some(hours * 3600.0 + minutes * 60.0 + seconds)
    }

    fn ensure_media_command_succeeded(
        command: &MediaCommandResult,
        operation_name: &'static str,
    ) -> ServerResult<()> {
        if command.code == 0 {
            return Ok(());
        }
        Err(ServerError::bad_request(format!(
                "{operation_name} failed with code {}: {}",
                command.code, command.stderr
            ),
        ))
    }

    fn audio_recording_not_available() -> ServerError {
        ServerError::bad_request("request validation failed")
    }

    fn screen_recording_not_available() -> ServerError {
        ServerError::bad_request("request validation failed")
    }

    fn run_controlled_media_with_progress<F>(
        &self,
        duration_seconds: Option<f64>,
        context: &ToolkitExecutionContext,
        stage_prefix: &'static str,
        runner: F,
    ) -> ServerResult<MediaCommandResult>
    where
        F: FnOnce(MediaExecutionControl) -> ServerResult<MediaCommandResult>,
    {
        let context_for_callback = context.clone();
        let duration = duration_seconds.unwrap_or(0.0);
        let stage_processing = format!("{stage_prefix}: processing");
        let stage_finalizing = format!("{stage_prefix}: finalizing");

        let callback = Arc::new(move |line: String| {
            if let Some(value) = line.strip_prefix("out_time=") {
                if duration > 0.0 {
                    if let Some(current) =
                        LocalToolkitService::parse_media_progress_time_to_seconds(value)
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

        runner(MediaExecutionControl {
            cancel_signal: context.cancel_signal(),
            on_stderr_line: Some(callback),
        })
    }

    fn run_media_command_with_progress(
        &self,
        args: Vec<String>,
        duration_seconds: Option<f64>,
        context: &ToolkitExecutionContext,
        stage_prefix: &'static str,
    ) -> ServerResult<MediaCommandResult> {
        self.run_controlled_media_with_progress(
            duration_seconds,
            context,
            stage_prefix,
            move |control| {
                self.media_service
                    .media_command_execute_controlled(args, control)
            },
        )
    }
}

impl Default for LocalToolkitService {
    fn default() -> Self {
        let policy_service = PolicyService::default();
        let file_system_service: Arc<dyn FileSystemService> =
            Arc::new(LocalFileSystemService::new(policy_service.clone()));
        let system_service: Arc<dyn SystemService> = Arc::new(NativeSystemService);
        let media_service: Arc<dyn MediaService> = Arc::new(SystemMediaService::new(
            Arc::clone(&system_service),
            policy_service.clone(),
        ));
        let compression_service: Arc<dyn CompressionService> = Arc::new(
            NativeCompressionService::new(Arc::clone(&file_system_service)),
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
    fn capabilities(&self) -> ServerResult<ToolkitCapabilityMatrix> {
        let media_command_available = self
            .media_service
            .media_command_available()
            .unwrap_or(false);
        let media_probe_available = self
            .system_service
            .command_exists("ffprobe".to_string())
            .unwrap_or(false);
        let runtime_info = self.system_service.runtime_info()?;

        Ok(ToolkitCapabilityMatrix {
            media_probe_available,
            image_processing: media_command_available,
            video_processing: media_command_available,
            audio_processing: media_command_available,
            compression: true,
            file_system: true,
            audio_recording: media_command_available,
            screen_recording: media_command_available,
            sqlite_embedded: true,
            runtime_os: runtime_info.os,
            runtime_arch: runtime_info.arch,
        })
    }

    fn execute_with_context(
        &self,
        operation: ToolkitOperation,
        context: ToolkitExecutionContext,
    ) -> ServerResult<ToolkitOperationResult> {
        context.ensure_not_cancelled()?;
        match operation {
            ToolkitOperation::MediaProbe { input } => {
                context.report_progress(0.05, "mediaProbe: starting");
                self.ensure_command_allowed("ffprobe")?;
                self.ensure_input_path(&input, "input")?;
                let probe = self.media_service.media_probe(input)?;
                context.report_progress(1.0, "mediaProbe: completed");
                Ok(ToolkitOperationResult {
                    operation: "mediaProbe".to_string(),
                    command: None,
                    probe: Some(probe),
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::ImageResize {
                input_path,
                output_path,
                width,
                height,
                overwrite,
            } => {
                context.report_progress(0.05, "imageResize: preparing");
                let command = self.run_controlled_media_with_progress(
                    None,
                    &context,
                    "imageResize",
                    move |control| {
                        self.media_service.image_resize_controlled(
                            ImageResizeRequest {
                                input_path,
                                output_path,
                                width,
                                height,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "imageResize")?;
                context.report_progress(1.0, "imageResize: completed");
                Ok(ToolkitOperationResult {
                    operation: "imageResize".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::VideoConcat {
                input_paths,
                output_path,
                overwrite,
            } => {
                context.report_progress(0.05, "videoConcat: preparing");
                let duration = self.media_durations_seconds(&input_paths);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "videoConcat",
                    move |control| {
                        self.media_service.video_concat_controlled(
                            MediaVideoConcatRequest {
                                input_paths,
                                output_path,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "videoConcat")?;
                context.report_progress(1.0, "videoConcat: completed");
                Ok(ToolkitOperationResult {
                    operation: "videoConcat".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::VideoTranscode {
                input_path,
                output_path,
                video_codec,
                audio_codec,
                fps,
                width,
                height,
                video_bitrate_kbps,
                audio_bitrate_kbps,
                overwrite,
            } => {
                context.report_progress(0.05, "videoTranscode: preparing");
                let duration = self.media_duration_seconds(&input_path);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "videoTranscode",
                    move |control| {
                        self.media_service.video_transcode_controlled(
                            VideoTranscodeRequest {
                                input_path,
                                output_path,
                                video_codec,
                                audio_codec,
                                fps,
                                width,
                                height,
                                video_bitrate_kbps,
                                audio_bitrate_kbps,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "videoTranscode")?;
                context.report_progress(1.0, "videoTranscode: completed");
                Ok(ToolkitOperationResult {
                    operation: "videoTranscode".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::VideoTrim {
                input_path,
                output_path,
                start_seconds,
                duration_seconds,
                overwrite,
            } => {
                context.report_progress(0.05, "videoTrim: preparing");
                let duration = self.media_duration_seconds(&input_path);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "videoTrim",
                    move |control| {
                        self.media_service.video_trim_controlled(
                            VideoTrimRequest {
                                input_path,
                                output_path,
                                start_seconds,
                                duration_seconds,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "videoTrim")?;
                context.report_progress(1.0, "videoTrim: completed");
                Ok(ToolkitOperationResult {
                    operation: "videoTrim".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::VideoExtractAudio {
                input_path,
                output_path,
                overwrite,
            } => {
                context.report_progress(0.05, "videoExtractAudio: preparing");
                let duration = self.media_duration_seconds(&input_path);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "videoExtractAudio",
                    move |control| {
                        self.media_service.video_extract_audio_controlled(
                            VideoExtractAudioRequest {
                                input_path,
                                output_path,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "videoExtractAudio")?;
                context.report_progress(1.0, "videoExtractAudio: completed");
                Ok(ToolkitOperationResult {
                    operation: "videoExtractAudio".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::VideoThumbnail {
                input_path,
                output_path,
                time_seconds,
                width,
                height,
            } => {
                context.report_progress(0.05, "videoThumbnail: preparing");
                let duration = self.media_duration_seconds(&input_path);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "videoThumbnail",
                    move |control| {
                        self.media_service.video_thumbnail_controlled(
                            VideoThumbnailRequest {
                                input_path,
                                output_path,
                                time_seconds,
                                width,
                                height,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "videoThumbnail")?;
                context.report_progress(1.0, "videoThumbnail: completed");
                Ok(ToolkitOperationResult {
                    operation: "videoThumbnail".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::AudioConvert {
                input_path,
                output_path,
                codec,
                bitrate_kbps,
                sample_rate,
                channels,
                overwrite,
            } => {
                context.report_progress(0.05, "audioConvert: preparing");
                let duration = self.media_duration_seconds(&input_path);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "audioConvert",
                    move |control| {
                        self.media_service.audio_convert_controlled(
                            AudioConvertRequest {
                                input_path,
                                output_path,
                                codec,
                                bitrate_kbps,
                                sample_rate,
                                channels,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "audioConvert")?;
                context.report_progress(1.0, "audioConvert: completed");
                Ok(ToolkitOperationResult {
                    operation: "audioConvert".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::AudioNormalize {
                input_path,
                output_path,
                overwrite,
            } => {
                context.report_progress(0.05, "audioNormalize: preparing");
                let duration = self.media_duration_seconds(&input_path);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "audioNormalize",
                    move |control| {
                        self.media_service.audio_normalize_controlled(
                            AudioNormalizeRequest {
                                input_path,
                                output_path,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "audioNormalize")?;
                context.report_progress(1.0, "audioNormalize: completed");
                Ok(ToolkitOperationResult {
                    operation: "audioNormalize".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::AudioMix {
                inputs,
                output_path,
                overwrite,
            } => {
                context.report_progress(0.05, "audioMix: preparing");
                let duration_inputs = inputs
                    .iter()
                    .map(|input| input.path.clone())
                    .collect::<Vec<_>>();
                let duration = self.media_durations_seconds(&duration_inputs);
                let command = self.run_controlled_media_with_progress(
                    duration,
                    &context,
                    "audioMix",
                    move |control| {
                        self.media_service.audio_mix_controlled(
                            AudioMixRequest {
                                inputs,
                                output_path,
                                overwrite,
                            },
                            control,
                        )
                    },
                )?;
                Self::ensure_media_command_succeeded(&command, "audioMix")?;
                context.report_progress(1.0, "audioMix: completed");
                Ok(ToolkitOperationResult {
                    operation: "audioMix".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
            ToolkitOperation::ZipAssets { source_paths } => {
                context.report_progress(0.05, "zipAssets: preparing");
                if source_paths.is_empty() {
                    return Err(ServerError::bad_request("request validation failed"));
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
                if !self.media_service.media_command_available()? {
                    return Err(Self::audio_recording_not_available());
                }
                let args = Self::with_media_progress_args(Self::build_record_audio_args(
                    output,
                    duration_seconds,
                    input_device,
                ));
                let command =
                    self.run_media_command_with_progress(args, None, &context, "recordAudio")?;
                Self::ensure_media_command_succeeded(&command, "recordAudio")?;
                context.report_progress(1.0, "recordAudio: completed");
                Ok(ToolkitOperationResult {
                    operation: "recordAudio".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
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
                if !self.media_service.media_command_available()? {
                    return Err(Self::screen_recording_not_available());
                }
                let args = Self::with_media_progress_args(Self::build_record_screen_args(
                    output,
                    duration_seconds,
                    source,
                ));
                let command =
                    self.run_media_command_with_progress(args, None, &context, "recordScreen")?;
                Self::ensure_media_command_succeeded(&command, "recordScreen")?;
                context.report_progress(1.0, "recordScreen: completed");
                Ok(ToolkitOperationResult {
                    operation: "recordScreen".to_string(),
                    command: Some(command.into()),
                    probe: None,
                    archive_bytes: None,
                    notes: None,
                })
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use serde_json::Value;

    use super::{LocalToolkitService, ToolkitOperation, ToolkitService};
    use crate::response::ServerResult;
    use crate::services::compression::CompressionService;
    use crate::services::filesystem::{
        FileSystemEntry, FileSystemNodeKind, FileSystemService, FileSystemStat,
    };
    use crate::services::media::{
        AudioConvertRequest, AudioMixRequest, AudioNormalizeRequest, ImageResizeRequest,
        MediaCommandResult, MediaExecutionControl, MediaService, MediaVideoConcatRequest,
        VideoExtractAudioRequest, VideoThumbnailRequest, VideoTranscodeRequest, VideoTrimRequest,
    };
    use crate::services::policy::PolicyService;
    use crate::services::system::{RuntimeInfo, SystemService};

    struct TestMediaService {
        media_command_available: bool,
        media_command_result: MediaCommandResult,
        media_probe_value: Value,
        executed_args: Mutex<Vec<Vec<String>>>,
    }

    impl TestMediaService {
        fn new(media_command_available: bool, media_command_result: MediaCommandResult) -> Self {
            Self {
                media_command_available,
                media_command_result,
                media_probe_value: Value::Null,
                executed_args: Mutex::new(Vec::new()),
            }
        }

        fn record_args(&self, args: Vec<String>) {
            self.executed_args
                .lock()
                .expect("lock executed args")
                .push(args);
        }

        fn executed_command_count(&self) -> usize {
            self.executed_args.lock().expect("lock executed args").len()
        }
    }

    impl MediaService for TestMediaService {
        fn media_command_available(&self) -> ServerResult<bool> {
            Ok(self.media_command_available)
        }

        fn media_command_execute(&self, args: Vec<String>) -> ServerResult<MediaCommandResult> {
            self.record_args(args);
            Ok(self.media_command_result.clone())
        }

        fn image_resize_controlled(
            &self,
            _request: ImageResizeRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("image_resize_controlled should not be called in recording tests")
        }

        fn video_concat_controlled(
            &self,
            _request: MediaVideoConcatRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("video_concat_controlled should not be called in recording tests")
        }

        fn media_command_execute_controlled(
            &self,
            args: Vec<String>,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            self.record_args(args);
            Ok(self.media_command_result.clone())
        }

        fn media_probe(&self, _input: String) -> ServerResult<Value> {
            Ok(self.media_probe_value.clone())
        }

        fn video_transcode_controlled(
            &self,
            _request: VideoTranscodeRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("video_transcode_controlled should not be called in recording tests")
        }

        fn video_trim_controlled(
            &self,
            _request: VideoTrimRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("video_trim_controlled should not be called in recording tests")
        }

        fn video_extract_audio_controlled(
            &self,
            _request: VideoExtractAudioRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("video_extract_audio_controlled should not be called in recording tests")
        }

        fn video_thumbnail_controlled(
            &self,
            _request: VideoThumbnailRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("video_thumbnail_controlled should not be called in recording tests")
        }

        fn audio_convert_controlled(
            &self,
            _request: AudioConvertRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("audio_convert_controlled should not be called in recording tests")
        }

        fn audio_normalize_controlled(
            &self,
            _request: AudioNormalizeRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("audio_normalize_controlled should not be called in recording tests")
        }

        fn audio_mix_controlled(
            &self,
            _request: AudioMixRequest,
            _control: MediaExecutionControl,
        ) -> ServerResult<MediaCommandResult> {
            unreachable!("audio_mix_controlled should not be called in recording tests")
        }
    }

    struct TestCompressionService;

    impl CompressionService for TestCompressionService {
        fn unzip(&self, _zip_path: String, _target_dir: String) -> ServerResult<()> {
            unreachable!("unzip should not be called in recording tests")
        }

        fn zip_bytes(&self, _source_paths: Vec<String>) -> ServerResult<Vec<u8>> {
            unreachable!("zip_bytes should not be called in recording tests")
        }
    }

    struct TestFileSystemService;

    impl FileSystemService for TestFileSystemService {
        fn ensure_dir(&self, _path: String) -> ServerResult<()> {
            Ok(())
        }

        fn ensure_parent_dir(&self, _path: String) -> ServerResult<()> {
            Ok(())
        }

        fn exists(&self, _path: String) -> ServerResult<bool> {
            Ok(true)
        }

        fn read_dir(&self, _path: String) -> ServerResult<Vec<FileSystemEntry>> {
            Ok(Vec::new())
        }

        fn read_string(&self, _path: String) -> ServerResult<String> {
            unreachable!("read_string should not be called in recording tests")
        }

        fn read_bytes(&self, _path: String) -> ServerResult<Vec<u8>> {
            unreachable!("read_bytes should not be called in recording tests")
        }

        fn write_string(&self, _path: String, _text: String) -> ServerResult<()> {
            unreachable!("write_string should not be called in recording tests")
        }

        fn write_bytes(&self, _path: String, _data: Vec<u8>) -> ServerResult<()> {
            unreachable!("write_bytes should not be called in recording tests")
        }

        fn remove(&self, _path: String) -> ServerResult<()> {
            unreachable!("remove should not be called in recording tests")
        }

        fn rename(&self, _old_path: String, _new_path: String) -> ServerResult<()> {
            unreachable!("rename should not be called in recording tests")
        }

        fn copy_file(&self, _source_path: String, _destination_path: String) -> ServerResult<()> {
            unreachable!("copy_file should not be called in recording tests")
        }

        fn stat(&self, _path: String) -> ServerResult<FileSystemStat> {
            Ok(FileSystemStat {
                kind: FileSystemNodeKind::File,
                size: 0,
                last_modified: None,
                created_at: None,
                readonly: false,
            })
        }
    }

    struct TestSystemService;

    impl SystemService for TestSystemService {
        fn default_shell(&self) -> ServerResult<String> {
            Ok("powershell".to_string())
        }

        fn home_dir(&self) -> ServerResult<Option<String>> {
            Ok(None)
        }

        fn command_exists(&self, _name: String) -> ServerResult<bool> {
            Ok(true)
        }

        fn runtime_info(&self) -> ServerResult<RuntimeInfo> {
            Ok(RuntimeInfo {
                os: "windows".to_string(),
                arch: "x86_64".to_string(),
                home_dir: None,
                default_shell: "powershell".to_string(),
            })
        }
    }

    fn success_command_result() -> MediaCommandResult {
        MediaCommandResult {
            code: 0,
            stdout: "ok".to_string(),
            stderr: String::new(),
        }
    }

    fn build_recording_service_with_command_result(
        media_command_available: bool,
        command_result: MediaCommandResult,
    ) -> (LocalToolkitService, Arc<TestMediaService>) {
        let media_service = Arc::new(TestMediaService::new(
            media_command_available,
            command_result,
        ));
        let toolkit_service = LocalToolkitService::new(
            media_service.clone(),
            Arc::new(TestCompressionService),
            Arc::new(TestFileSystemService),
            Arc::new(TestSystemService),
            PolicyService::default(),
        );
        (toolkit_service, media_service)
    }

    fn build_recording_service(
        media_command_available: bool,
    ) -> (LocalToolkitService, Arc<TestMediaService>) {
        build_recording_service_with_command_result(
            media_command_available,
            success_command_result(),
        )
    }

    #[test]
    fn record_audio_unavailable_uses_neutral_capability_error_contract() {
        let (toolkit_service, media_service) = build_recording_service(false);

        let error = toolkit_service
            .execute(ToolkitOperation::RecordAudio {
                output: "tmp/record-audio-output.m4a".to_string(),
                duration_seconds: Some(1),
                input_device: None,
            })
            .expect_err("record audio should fail when recording is unavailable");

        assert_eq!(error.code(), "TOOLKIT_AUDIO_RECORDING_NOT_AVAILABLE");
        assert_eq!(
            error.detail,
            "audio recording is not available in the current runtime"
        );
        assert_eq!(media_service.executed_command_count(), 0);
        assert!(!error.code().contains("FFMPEG"));
        assert!(!error.detail.contains("ffmpeg"));
        assert!(!error.detail.contains("ffprobe"));
    }

    #[test]
    fn record_screen_unavailable_uses_neutral_capability_error_contract() {
        let (toolkit_service, media_service) = build_recording_service(false);

        let error = toolkit_service
            .execute(ToolkitOperation::RecordScreen {
                output: "tmp/record-screen-output.mp4".to_string(),
                duration_seconds: Some(1),
                source: None,
            })
            .expect_err("record screen should fail when recording is unavailable");

        assert_eq!(error.code(), "TOOLKIT_SCREEN_RECORDING_NOT_AVAILABLE");
        assert_eq!(
            error.detail,
            "screen recording is not available in the current runtime"
        );
        assert_eq!(media_service.executed_command_count(), 0);
        assert!(!error.code().contains("FFMPEG"));
        assert!(!error.detail.contains("ffmpeg"));
        assert!(!error.detail.contains("ffprobe"));
    }

    #[test]
    fn record_audio_success_omits_backend_notes() {
        let (toolkit_service, media_service) = build_recording_service(true);

        let result = toolkit_service
            .execute(ToolkitOperation::RecordAudio {
                output: "tmp/record-audio-output.m4a".to_string(),
                duration_seconds: Some(1),
                input_device: None,
            })
            .expect("record audio should succeed");

        assert_eq!(result.operation, "recordAudio");
        assert_eq!(result.notes, None);
        assert_eq!(result.command.expect("record audio command result").code, 0);
        assert_eq!(media_service.executed_command_count(), 1);
    }

    #[test]
    fn record_screen_success_omits_backend_notes() {
        let (toolkit_service, media_service) = build_recording_service(true);

        let result = toolkit_service
            .execute(ToolkitOperation::RecordScreen {
                output: "tmp/record-screen-output.mp4".to_string(),
                duration_seconds: Some(1),
                source: None,
            })
            .expect("record screen should succeed");

        assert_eq!(result.operation, "recordScreen");
        assert_eq!(result.notes, None);
        assert_eq!(
            result.command.expect("record screen command result").code,
            0
        );
        assert_eq!(media_service.executed_command_count(), 1);
    }

    #[test]
    fn record_audio_non_zero_exit_uses_neutral_media_command_error() {
        let (toolkit_service, media_service) = build_recording_service_with_command_result(
            true,
            MediaCommandResult {
                code: 2,
                stdout: String::new(),
                stderr: "device busy".to_string(),
            },
        );

        let error = toolkit_service
            .execute(ToolkitOperation::RecordAudio {
                output: "tmp/record-audio-output.m4a".to_string(),
                duration_seconds: Some(1),
                input_device: None,
            })
            .expect_err("record audio should surface media command failures");

        assert_eq!(error.code(), "TOOLKIT_MEDIA_COMMAND_FAILED");
        assert_eq!(error.detail, "recordAudio failed with code 2: device busy");
        assert_eq!(media_service.executed_command_count(), 1);
        assert!(!error.code().contains("FFMPEG"));
        assert!(!error.detail.contains("ffmpeg"));
    }

    #[test]
    fn record_screen_non_zero_exit_uses_neutral_media_command_error() {
        let (toolkit_service, media_service) = build_recording_service_with_command_result(
            true,
            MediaCommandResult {
                code: 3,
                stdout: String::new(),
                stderr: "permission denied".to_string(),
            },
        );

        let error = toolkit_service
            .execute(ToolkitOperation::RecordScreen {
                output: "tmp/record-screen-output.mp4".to_string(),
                duration_seconds: Some(1),
                source: None,
            })
            .expect_err("record screen should surface media command failures");

        assert_eq!(error.code(), "TOOLKIT_MEDIA_COMMAND_FAILED");
        assert_eq!(
            error.detail,
            "recordScreen failed with code 3: permission denied"
        );
        assert_eq!(media_service.executed_command_count(), 1);
        assert!(!error.code().contains("FFMPEG"));
        assert!(!error.detail.contains("ffmpeg"));
    }
}
