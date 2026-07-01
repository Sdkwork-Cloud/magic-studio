use std::fs;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::response::{ServerError, ServerResult};
use crate::services::policy::{PathAccessType, PolicyService};

use super::system::{NativeSystemService, SystemService};

#[derive(Debug, Clone, Serialize)]
pub struct MediaCommandResult {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoTranscodeRequest {
    pub input_path: String,
    pub output_path: String,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    pub fps: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub video_bitrate_kbps: Option<u32>,
    pub audio_bitrate_kbps: Option<u32>,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaVideoConcatRequest {
    pub input_paths: Vec<String>,
    pub output_path: String,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoTrimRequest {
    pub input_path: String,
    pub output_path: String,
    pub start_seconds: f64,
    pub duration_seconds: Option<f64>,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoExtractAudioRequest {
    pub input_path: String,
    pub output_path: String,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoThumbnailRequest {
    pub input_path: String,
    pub output_path: String,
    pub time_seconds: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageResizeRequest {
    pub input_path: String,
    pub output_path: String,
    pub width: u32,
    pub height: u32,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioConvertRequest {
    pub input_path: String,
    pub output_path: String,
    pub codec: Option<String>,
    pub bitrate_kbps: Option<u32>,
    pub sample_rate: Option<u32>,
    pub channels: Option<u32>,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioNormalizeRequest {
    pub input_path: String,
    pub output_path: String,
    pub overwrite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioMixInput {
    pub path: String,
    pub volume: Option<f64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioMixRequest {
    pub inputs: Vec<AudioMixInput>,
    pub output_path: String,
    pub overwrite: Option<bool>,
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

#[allow(dead_code)]
pub trait MediaService: Send + Sync {
    fn media_command_available(&self) -> ServerResult<bool>;
    fn media_command_execute(&self, args: Vec<String>) -> ServerResult<MediaCommandResult>;
    fn image_resize_controlled(
        &self,
        request: ImageResizeRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn image_resize(&self, request: ImageResizeRequest) -> ServerResult<MediaCommandResult> {
        self.image_resize_controlled(request, MediaExecutionControl::default())
    }
    fn video_concat_controlled(
        &self,
        request: MediaVideoConcatRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn video_concat(&self, request: MediaVideoConcatRequest) -> ServerResult<MediaCommandResult> {
        self.video_concat_controlled(request, MediaExecutionControl::default())
    }
    fn media_command_execute_controlled(
        &self,
        args: Vec<String>,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn media_probe(&self, input: String) -> ServerResult<Value>;
    fn video_transcode_controlled(
        &self,
        request: VideoTranscodeRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn video_transcode(&self, request: VideoTranscodeRequest) -> ServerResult<MediaCommandResult> {
        self.video_transcode_controlled(request, MediaExecutionControl::default())
    }
    fn video_trim_controlled(
        &self,
        request: VideoTrimRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn video_trim(&self, request: VideoTrimRequest) -> ServerResult<MediaCommandResult> {
        self.video_trim_controlled(request, MediaExecutionControl::default())
    }
    fn video_extract_audio(
        &self,
        request: VideoExtractAudioRequest,
    ) -> ServerResult<MediaCommandResult> {
        self.video_extract_audio_controlled(request, MediaExecutionControl::default())
    }
    fn video_extract_audio_controlled(
        &self,
        request: VideoExtractAudioRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn video_thumbnail(&self, request: VideoThumbnailRequest) -> ServerResult<MediaCommandResult> {
        self.video_thumbnail_controlled(request, MediaExecutionControl::default())
    }
    fn video_thumbnail_controlled(
        &self,
        request: VideoThumbnailRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn audio_convert(&self, request: AudioConvertRequest) -> ServerResult<MediaCommandResult> {
        self.audio_convert_controlled(request, MediaExecutionControl::default())
    }
    fn audio_convert_controlled(
        &self,
        request: AudioConvertRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn audio_normalize(&self, request: AudioNormalizeRequest) -> ServerResult<MediaCommandResult> {
        self.audio_normalize_controlled(request, MediaExecutionControl::default())
    }
    fn audio_normalize_controlled(
        &self,
        request: AudioNormalizeRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
    fn audio_mix(&self, request: AudioMixRequest) -> ServerResult<MediaCommandResult> {
        self.audio_mix_controlled(request, MediaExecutionControl::default())
    }
    fn audio_mix_controlled(
        &self,
        request: AudioMixRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult>;
}

pub struct SystemMediaService {
    system_service: Arc<dyn SystemService>,
    policy_service: PolicyService,
}

impl SystemMediaService {
    pub fn new(system_service: Arc<dyn SystemService>, policy_service: PolicyService) -> Self {
        Self {
            system_service,
            policy_service,
        }
    }

    fn ensure_path_allowed(&self, path: &str, access: PathAccessType) -> ServerResult<()> {
        self.policy_service
            .validate_path(path.to_string(), access)?
            .ensure_allowed()
    }

    fn ensure_input_path(&self, path: &str) -> ServerResult<()> {
        let trimmed = path.trim();
        if trimmed.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }
        self.ensure_path_allowed(trimmed, PathAccessType::Read)?;
        if !Path::new(trimmed).exists() {
            return Err(ServerError::bad_request(format!("input path does not exist: {trimmed}"),
            ));
        }
        Ok(())
    }

    fn ensure_output_path(&self, path: &str) -> ServerResult<()> {
        let trimmed = path.trim();
        if trimmed.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }
        self.ensure_path_allowed(trimmed, PathAccessType::Write)?;
        if let Some(parent) = Path::new(trimmed).parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|error| {
                    ServerError::internal(error.to_string())
                })?;
            }
        }
        Ok(())
    }

    fn ensure_command_allowed(&self, command_name: &str) -> ServerResult<()> {
        self.policy_service
            .validate_command(command_name.to_string())
            .ensure_allowed()
    }

    fn parse_probe_output(output: &[u8]) -> ServerResult<Value> {
        serde_json::from_slice::<Value>(output).map_err(|error| {
            ServerError::internal("an internal error occurred")
            .with_detail(error.to_string())
        })
    }

    fn overwrite_flag(overwrite: Option<bool>) -> String {
        if overwrite.unwrap_or(true) {
            "-y".to_string()
        } else {
            "-n".to_string()
        }
    }

    fn optional_trimmed_string(value: Option<String>, field: &str) -> ServerResult<Option<String>> {
        match value {
            Some(candidate) => {
                let trimmed = candidate.trim();
                if trimmed.is_empty() {
                    Err(ServerError::bad_request(format!("{field} cannot be empty"),
                    ))
                } else {
                    Ok(Some(trimmed.to_string()))
                }
            }
            None => Ok(None),
        }
    }

    fn to_even_dimension(value: Option<u32>) -> Option<u32> {
        value.and_then(|candidate| {
            if candidate == 0 {
                return None;
            }
            let rounded = candidate.max(2);
            Some(if rounded % 2 == 0 {
                rounded
            } else {
                rounded - 1
            })
        })
    }

    fn build_scale_filter(width: Option<u32>, height: Option<u32>) -> Option<String> {
        let next_width = Self::to_even_dimension(width);
        let next_height = Self::to_even_dimension(height);
        if next_width.is_none() && next_height.is_none() {
            return None;
        }
        Some(format!(
            "scale={}:{}",
            next_width
                .map(|value| value.to_string())
                .unwrap_or_else(|| "-2".to_string()),
            next_height
                .map(|value| value.to_string())
                .unwrap_or_else(|| "-2".to_string())
        ))
    }

    fn build_video_concat_manifest_path(&self) -> ServerResult<std::path::PathBuf> {
        let manifest_path = std::env::temp_dir().join(format!(
            "magic-studio-video-concat-{}-{}.txt",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|error| {
                    ServerError::internal(error.to_string())
                })?
                .as_nanos()
        ));
        self.ensure_path_allowed(&manifest_path.to_string_lossy(), PathAccessType::Write)?;
        Ok(manifest_path)
    }

    fn build_video_concat_manifest(input_paths: &[String]) -> String {
        input_paths
            .iter()
            .map(|path| format!("file '{}'", path.replace('\'', "'\\''")))
            .collect::<Vec<_>>()
            .join("\n")
    }

    fn build_video_transcode_args(
        &self,
        request: VideoTranscodeRequest,
    ) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        let video_codec = Self::optional_trimmed_string(request.video_codec, "videoCodec")?;
        let audio_codec = Self::optional_trimmed_string(request.audio_codec, "audioCodec")?;
        let mut args = vec![
            Self::overwrite_flag(request.overwrite),
            "-i".to_string(),
            request.input_path,
        ];

        if let Some(scale_filter) = Self::build_scale_filter(request.width, request.height) {
            args.push("-vf".to_string());
            args.push(scale_filter);
        }
        if let Some(fps) = request.fps.filter(|value| *value > 0.0) {
            args.push("-r".to_string());
            args.push((fps.round() as i64).to_string());
        }
        if let Some(value) = video_codec {
            args.push("-c:v".to_string());
            args.push(value);
        }
        if let Some(value) = audio_codec {
            args.push("-c:a".to_string());
            args.push(value);
        }
        if let Some(value) = request.video_bitrate_kbps.filter(|value| *value > 0) {
            args.push("-b:v".to_string());
            args.push(format!("{value}k"));
        }
        if let Some(value) = request.audio_bitrate_kbps.filter(|value| *value > 0) {
            args.push("-b:a".to_string());
            args.push(format!("{value}k"));
        }
        args.push(request.output_path);
        Ok(args)
    }

    fn build_video_trim_args(&self, request: VideoTrimRequest) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        let mut args = vec![
            Self::overwrite_flag(request.overwrite),
            "-ss".to_string(),
            request.start_seconds.max(0.0).to_string(),
            "-i".to_string(),
            request.input_path,
        ];
        if let Some(duration_seconds) = request.duration_seconds.filter(|value| *value > 0.0) {
            args.push("-t".to_string());
            args.push(duration_seconds.to_string());
        }
        args.extend(["-c".to_string(), "copy".to_string(), request.output_path]);
        Ok(args)
    }

    fn build_video_extract_audio_args(
        &self,
        request: VideoExtractAudioRequest,
    ) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        Ok(vec![
            Self::overwrite_flag(request.overwrite),
            "-i".to_string(),
            request.input_path,
            "-vn".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "192k".to_string(),
            request.output_path,
        ])
    }

    fn build_video_thumbnail_args(
        &self,
        request: VideoThumbnailRequest,
    ) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        let mut args = vec![
            "-y".to_string(),
            "-ss".to_string(),
            request.time_seconds.unwrap_or(0.0).max(0.0).to_string(),
            "-i".to_string(),
            request.input_path,
            "-frames:v".to_string(),
            "1".to_string(),
        ];
        if let Some(scale_filter) = Self::build_scale_filter(request.width, request.height) {
            args.push("-vf".to_string());
            args.push(scale_filter);
        }
        args.push(request.output_path);
        Ok(args)
    }

    fn build_image_resize_args(&self, request: ImageResizeRequest) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        if request.width == 0 {
            return Err(ServerError::bad_request("request validation failed"));
        }
        if request.height == 0 {
            return Err(ServerError::bad_request("request validation failed"));
        }

        Ok(vec![
            Self::overwrite_flag(request.overwrite),
            "-i".to_string(),
            request.input_path,
            "-vf".to_string(),
            format!("scale={}:{}", request.width, request.height),
            "-frames:v".to_string(),
            "1".to_string(),
            request.output_path,
        ])
    }

    fn build_audio_convert_args(&self, request: AudioConvertRequest) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        let codec = Self::optional_trimmed_string(request.codec, "codec")?;
        let mut args = vec![
            Self::overwrite_flag(request.overwrite),
            "-i".to_string(),
            request.input_path,
        ];
        if let Some(value) = codec {
            args.push("-c:a".to_string());
            args.push(value);
        }
        if let Some(value) = request.bitrate_kbps.filter(|value| *value > 0) {
            args.push("-b:a".to_string());
            args.push(format!("{value}k"));
        }
        if let Some(value) = request.sample_rate.filter(|value| *value > 0) {
            args.push("-ar".to_string());
            args.push(value.to_string());
        }
        if let Some(value) = request.channels.filter(|value| *value > 0) {
            args.push("-ac".to_string());
            args.push(value.to_string());
        }
        args.push(request.output_path);
        Ok(args)
    }

    fn build_audio_normalize_args(
        &self,
        request: AudioNormalizeRequest,
    ) -> ServerResult<Vec<String>> {
        self.ensure_input_path(&request.input_path)?;
        self.ensure_output_path(&request.output_path)?;

        Ok(vec![
            Self::overwrite_flag(request.overwrite),
            "-i".to_string(),
            request.input_path,
            "-af".to_string(),
            "loudnorm".to_string(),
            request.output_path,
        ])
    }

    fn build_audio_mix_args(&self, request: AudioMixRequest) -> ServerResult<Vec<String>> {
        if request.inputs.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }
        for input in &request.inputs {
            self.ensure_input_path(&input.path)?;
        }
        self.ensure_output_path(&request.output_path)?;

        if request.inputs.len() == 1 {
            return Ok(vec![
                Self::overwrite_flag(request.overwrite),
                "-i".to_string(),
                request.inputs[0].path.clone(),
                request.output_path,
            ]);
        }

        let mut args = vec![Self::overwrite_flag(request.overwrite)];
        for input in &request.inputs {
            args.push("-i".to_string());
            args.push(input.path.clone());
        }

        let mut filter_parts = Vec::new();
        let mut mix_inputs = Vec::new();
        for (index, input) in request.inputs.iter().enumerate() {
            let input_tag = format!("{index}:a");
            let volume = input.volume.unwrap_or(1.0);
            if (volume - 1.0).abs() < f64::EPSILON {
                mix_inputs.push(format!("[{input_tag}]"));
                continue;
            }
            let output_tag = format!("a{index}");
            filter_parts.push(format!("[{input_tag}]volume={volume}[{output_tag}]"));
            mix_inputs.push(format!("[{output_tag}]"));
        }
        filter_parts.push(format!(
            "{}amix=inputs={}:duration=longest:normalize=0[outa]",
            mix_inputs.join(""),
            request.inputs.len()
        ));
        args.extend([
            "-filter_complex".to_string(),
            filter_parts.join(";"),
            "-map".to_string(),
            "[outa]".to_string(),
            request.output_path,
        ]);
        Ok(args)
    }
}

impl Default for SystemMediaService {
    fn default() -> Self {
        Self {
            system_service: Arc::new(NativeSystemService::default()),
            policy_service: PolicyService::default(),
        }
    }
}

impl MediaService for SystemMediaService {
    fn media_command_available(&self) -> ServerResult<bool> {
        Ok(self.system_service.command_exists("ffmpeg".to_string())?
            && self.system_service.command_exists("ffprobe".to_string())?)
    }

    fn media_command_execute(&self, args: Vec<String>) -> ServerResult<MediaCommandResult> {
        self.media_command_execute_controlled(args, MediaExecutionControl::default())
    }

    fn image_resize_controlled(
        &self,
        request: ImageResizeRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_image_resize_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn video_concat_controlled(
        &self,
        request: MediaVideoConcatRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let MediaVideoConcatRequest {
            input_paths,
            output_path,
            overwrite,
        } = request;
        if input_paths.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }

        for input_path in &input_paths {
            self.ensure_input_path(input_path)?;
        }
        self.ensure_output_path(&output_path)?;

        let manifest_path = self.build_video_concat_manifest_path()?;
        let manifest_text = Self::build_video_concat_manifest(&input_paths);
        fs::write(&manifest_path, manifest_text).map_err(|error| {
            ServerError::internal(error.to_string(),
            )
        })?;

        let manifest_path_string = manifest_path.to_string_lossy().to_string();
        let mut args = vec![
            if overwrite.unwrap_or(true) {
                "-y".to_string()
            } else {
                "-n".to_string()
            },
            "-f".to_string(),
            "concat".to_string(),
            "-safe".to_string(),
            "0".to_string(),
            "-i".to_string(),
            manifest_path_string,
            "-c".to_string(),
            "copy".to_string(),
            output_path,
        ];

        let result = self.media_command_execute_controlled(std::mem::take(&mut args), control);
        let _ = fs::remove_file(&manifest_path);
        result
    }

    fn media_command_execute_controlled(
        &self,
        args: Vec<String>,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        if args.is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }
        self.ensure_command_allowed("ffmpeg")?;

        let mut child = Command::new("ffmpeg")
            .args(args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| {
                ServerError::internal("media command failed to start")
                    .with_detail(error.to_string())
            })?;

        let stdout = child.stdout.take().ok_or_else(|| {
            ServerError::internal("stdout pipe missing")
        })?;
        let stderr = child.stderr.take().ok_or_else(|| {
            ServerError::internal("stderr pipe missing")
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
                return Err(ServerError::conflict("a conflict occurred"));
            }

            match child.try_wait() {
                Ok(Some(status)) => break status.code().unwrap_or(-1),
                Ok(None) => thread::sleep(Duration::from_millis(120)),
                Err(error) => {
                    let _ = stdout_thread.join();
                    let _ = stderr_thread.join();
                    return Err(ServerError::internal("an internal error occurred")
                    .with_detail(error.to_string()));
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

    fn media_probe(&self, input: String) -> ServerResult<Value> {
        if input.trim().is_empty() {
            return Err(ServerError::bad_request("request validation failed"));
        }
        self.ensure_command_allowed("ffprobe")?;
        self.ensure_input_path(&input)?;

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
            .map_err(|error| {
                ServerError::internal("an internal error occurred")
                .with_detail(error.to_string())
            })?;

        if !output.status.success() {
            return Err(
                ServerError::bad_request("media probe failed")
                    .with_detail(String::from_utf8_lossy(&output.stderr).to_string()),
            );
        }

        Self::parse_probe_output(&output.stdout)
    }

    fn video_transcode(&self, request: VideoTranscodeRequest) -> ServerResult<MediaCommandResult> {
        self.video_transcode_controlled(request, MediaExecutionControl::default())
    }

    fn video_transcode_controlled(
        &self,
        request: VideoTranscodeRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_video_transcode_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn video_trim(&self, request: VideoTrimRequest) -> ServerResult<MediaCommandResult> {
        self.video_trim_controlled(request, MediaExecutionControl::default())
    }

    fn video_trim_controlled(
        &self,
        request: VideoTrimRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_video_trim_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn video_extract_audio(
        &self,
        request: VideoExtractAudioRequest,
    ) -> ServerResult<MediaCommandResult> {
        self.video_extract_audio_controlled(request, MediaExecutionControl::default())
    }

    fn video_extract_audio_controlled(
        &self,
        request: VideoExtractAudioRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_video_extract_audio_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn video_thumbnail(&self, request: VideoThumbnailRequest) -> ServerResult<MediaCommandResult> {
        self.video_thumbnail_controlled(request, MediaExecutionControl::default())
    }

    fn video_thumbnail_controlled(
        &self,
        request: VideoThumbnailRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_video_thumbnail_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn audio_convert(&self, request: AudioConvertRequest) -> ServerResult<MediaCommandResult> {
        self.audio_convert_controlled(request, MediaExecutionControl::default())
    }

    fn audio_convert_controlled(
        &self,
        request: AudioConvertRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_audio_convert_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn audio_normalize(&self, request: AudioNormalizeRequest) -> ServerResult<MediaCommandResult> {
        self.audio_normalize_controlled(request, MediaExecutionControl::default())
    }

    fn audio_normalize_controlled(
        &self,
        request: AudioNormalizeRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_audio_normalize_args(request)?;
        self.media_command_execute_controlled(args, control)
    }

    fn audio_mix(&self, request: AudioMixRequest) -> ServerResult<MediaCommandResult> {
        self.audio_mix_controlled(request, MediaExecutionControl::default())
    }

    fn audio_mix_controlled(
        &self,
        request: AudioMixRequest,
        control: MediaExecutionControl,
    ) -> ServerResult<MediaCommandResult> {
        let args = self.build_audio_mix_args(request)?;
        self.media_command_execute_controlled(args, control)
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::{MediaExecutionControl, MediaService, SystemMediaService};

    fn unique_temp_path(name: &str, extension: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "magic-studio-media-{name}-{}-{}.{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system time after unix epoch")
                .as_nanos(),
            extension
        ))
    }

    fn write_temp_input_file(name: &str, bytes: &[u8]) -> PathBuf {
        let path = unique_temp_path(name, "bin");
        std::fs::write(&path, bytes).expect("write temporary media input");
        path
    }

    #[test]
    fn media_probe_empty_input_uses_neutral_error_contract() {
        let service = SystemMediaService::default();

        let error = service
            .media_probe(String::new())
            .expect_err("media probe should reject empty input");

        assert_eq!(error.code(), "MEDIA_PROBE_INPUT_EMPTY");
        assert_eq!(error.detail, "media probe input is required");
        assert!(!error.code().contains("FFPROBE"));
        assert!(!error.detail.contains("ffprobe"));
    }

    #[test]
    fn media_probe_non_zero_exit_uses_neutral_error_contract() {
        let input_path = write_temp_input_file("probe-invalid-media", b"not-a-real-media-file");
        let service = SystemMediaService::default();

        let error = service
            .media_probe(input_path.to_string_lossy().to_string())
            .expect_err("media probe should surface non-zero exits");
        let _ = std::fs::remove_file(input_path);

        assert_eq!(error.code(), "MEDIA_PROBE_FAILED");
        assert_eq!(error.detail, "media probe failed");
        assert!(!error.detail.as_deref().unwrap_or_default().is_empty());
        assert!(!error.code().contains("FFPROBE"));
        assert!(!error.detail.contains("ffprobe"));
    }

    #[test]
    fn media_probe_invalid_json_uses_neutral_error_contract() {
        let error = SystemMediaService::parse_probe_output(b"not-json")
            .expect_err("media probe should reject invalid json output");

        assert_eq!(error.code(), "MEDIA_PROBE_JSON_PARSE_FAILED");
        assert_eq!(error.detail, "media probe response could not be parsed");
        assert!(error
            .detail
            .as_deref()
            .unwrap_or_default()
            .contains("expected"));
        assert!(!error.code().contains("FFPROBE"));
        assert!(!error.detail.contains("ffprobe"));
    }

    #[test]
    fn media_command_empty_args_still_rejects_invalid_invocation() {
        let service = SystemMediaService::default();

        let error = service
            .media_command_execute_controlled(Vec::new(), MediaExecutionControl::default())
            .expect_err("empty media command args should be rejected");

        assert_eq!(error.code(), "MEDIA_COMMAND_ARGS_EMPTY");
        assert_eq!(error.detail, "media command args cannot be empty");
        assert!(!error.code().contains("FFMPEG"));
        assert!(!error.detail.contains("ffmpeg"));
    }
}
