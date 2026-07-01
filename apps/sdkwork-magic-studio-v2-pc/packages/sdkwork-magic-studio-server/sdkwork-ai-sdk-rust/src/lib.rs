use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::Duration;

use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;

#[derive(Debug, Clone)]
pub struct SdkworkConfig {
    pub base_url: String,
    pub timeout_ms: u64,
}

impl SdkworkConfig {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
            timeout_ms: 30_000,
        }
    }
}

#[derive(Debug, Error)]
pub enum SdkworkError {
    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("invalid header name: {0}")]
    InvalidHeaderName(#[from] reqwest::header::InvalidHeaderName),
    #[error("invalid header value: {0}")]
    InvalidHeaderValue(#[from] reqwest::header::InvalidHeaderValue),
    #[error("http status {status}: {body}")]
    HttpStatus { status: u16, body: String },
}

#[derive(Clone)]
pub struct SdkworkHttpClient {
    base_url: String,
    client: Client,
    headers: Arc<RwLock<HashMap<String, String>>>,
}

impl SdkworkHttpClient {
    pub fn new(config: SdkworkConfig) -> Result<Self, SdkworkError> {
        let client = Client::builder()
            .timeout(Duration::from_millis(config.timeout_ms.max(1)))
            .build()?;

        Ok(Self {
            base_url: config.base_url.trim_end_matches('/').to_string(),
            client,
            headers: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    pub fn set_api_key(&self, api_key: impl Into<String>) {
        self.set_header("Authorization", format!("Bearer {}", api_key.into()));
    }

    pub fn set_auth_token(&self, token: impl Into<String>) {
        self.set_header("Authorization", format!("Bearer {}", token.into()));
    }

    pub fn set_access_token(&self, token: impl Into<String>) {
        self.set_header("Access-Token", token.into());
    }

    pub fn set_header(&self, key: impl Into<String>, value: impl Into<String>) {
        let mut headers = self.headers.write().expect("sdk headers lock poisoned");
        headers.insert(key.into(), value.into());
    }

    pub async fn get_bytes(
        &self,
        url: &str,
        query: Option<&HashMap<String, Value>>,
        headers: Option<&HashMap<String, String>>,
    ) -> Result<Vec<u8>, SdkworkError> {
        let mut request = self.client.get(self.url(url));
        if let Some(query_values) = query {
            request = request.query(&query_values);
        }
        request = request.headers(self.header_map(headers)?);
        let response = request.send().await?;
        let status = response.status();
        let body = response.bytes().await?;
        if !status.is_success() {
            return Err(SdkworkError::HttpStatus {
                status: status.as_u16(),
                body: String::from_utf8_lossy(&body).to_string(),
            });
        }
        Ok(body.to_vec())
    }

    async fn post_json<T, B>(&self, path: &str, body: &B) -> Result<T, SdkworkError>
    where
        T: DeserializeOwned,
        B: Serialize + ?Sized,
    {
        let response = self
            .client
            .post(self.url(path))
            .headers(self.header_map(None)?)
            .json(body)
            .send()
            .await?;
        decode_json_response(response).await
    }

    async fn post_bytes<B>(&self, path: &str, body: &B) -> Result<Vec<u8>, SdkworkError>
    where
        B: Serialize + ?Sized,
    {
        let response = self
            .client
            .post(self.url(path))
            .headers(self.header_map(None)?)
            .json(body)
            .send()
            .await?;
        let status = response.status();
        let body = response.bytes().await?;
        if !status.is_success() {
            return Err(SdkworkError::HttpStatus {
                status: status.as_u16(),
                body: String::from_utf8_lossy(&body).to_string(),
            });
        }
        Ok(body.to_vec())
    }

    async fn get_json<T>(&self, path: &str) -> Result<T, SdkworkError>
    where
        T: DeserializeOwned,
    {
        let response = self
            .client
            .get(self.url(path))
            .headers(self.header_map(None)?)
            .send()
            .await?;
        decode_json_response(response).await
    }

    fn url(&self, path: &str) -> String {
        if path.starts_with("http://") || path.starts_with("https://") {
            return path.to_string();
        }

        let base = self.base_url.trim_end_matches('/');
        let request_path = normalize_request_path(base, path);
        format!("{base}{request_path}")
    }

    fn header_map(
        &self,
        request_headers: Option<&HashMap<String, String>>,
    ) -> Result<HeaderMap, SdkworkError> {
        let mut headers = HeaderMap::new();
        for (key, value) in self.headers.read().expect("sdk headers lock poisoned").iter() {
            headers.insert(
                HeaderName::from_bytes(key.as_bytes())?,
                HeaderValue::from_str(value)?,
            );
        }
        if let Some(request_headers) = request_headers {
            for (key, value) in request_headers {
                headers.insert(
                    HeaderName::from_bytes(key.as_bytes())?,
                    HeaderValue::from_str(value)?,
                );
            }
        }
        Ok(headers)
    }
}

async fn decode_json_response<T>(response: reqwest::Response) -> Result<T, SdkworkError>
where
    T: DeserializeOwned,
{
    let status = response.status();
    let body = response.bytes().await?;
    if !status.is_success() {
        return Err(SdkworkError::HttpStatus {
            status: status.as_u16(),
            body: String::from_utf8_lossy(&body).to_string(),
        });
    }
    Ok(serde_json::from_slice(&body)?)
}

fn normalize_request_path(base: &str, path: &str) -> String {
    let normalized = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };

    for prefix in ["/ai/v3", "/v1"] {
        if base.ends_with(prefix) && normalized.starts_with(&format!("{prefix}/")) {
            return normalized[prefix.len()..].to_string();
        }
    }

    normalized
}

#[derive(Clone)]
pub struct SdkworkAiClient {
    http: Arc<SdkworkHttpClient>,
}

impl SdkworkAiClient {
    pub fn new(config: SdkworkConfig) -> Result<Self, SdkworkError> {
        Ok(Self {
            http: Arc::new(SdkworkHttpClient::new(config)?),
        })
    }

    pub fn set_api_key(&self, api_key: impl Into<String>) -> &Self {
        self.http.set_api_key(api_key);
        self
    }

    pub fn set_auth_token(&self, token: impl Into<String>) -> &Self {
        self.http.set_auth_token(token);
        self
    }

    pub fn set_access_token(&self, token: impl Into<String>) -> &Self {
        self.http.set_access_token(token);
        self
    }

    pub fn audio(&self) -> AudioApi {
        AudioApi {
            http: Arc::clone(&self.http),
        }
    }

    pub fn image(&self) -> ImageApi {
        ImageApi {
            http: Arc::clone(&self.http),
        }
    }

    pub fn video(&self) -> VideoApi {
        VideoApi {
            http: Arc::clone(&self.http),
        }
    }

    pub fn music(&self) -> MusicApi {
        MusicApi {
            http: Arc::clone(&self.http),
        }
    }
}

pub struct AudioApi {
    http: Arc<SdkworkHttpClient>,
}

impl AudioApi {
    pub async fn create_speech(&self, body: &SpeechRequest) -> Result<Vec<u8>, SdkworkError> {
        self.http.post_bytes("/ai/v3/audio/speech", body).await
    }
}

pub struct ImageApi {
    http: Arc<SdkworkHttpClient>,
}

impl ImageApi {
    pub async fn create_image_generations(
        &self,
        body: &ImageGenerationRequest,
    ) -> Result<ImageGenerationResponse, SdkworkError> {
        self.http
            .post_json("/ai/v3/images/generations", body)
            .await
    }
}

pub struct VideoApi {
    http: Arc<SdkworkHttpClient>,
}

impl VideoApi {
    pub async fn create_video_generations2(
        &self,
        body: &VideoGenerationRequest,
    ) -> Result<OpenAiVideo, SdkworkError> {
        self.http.post_json("/ai/v3/videos", body).await
    }

    pub async fn retrieve(&self, video_id: &str) -> Result<OpenAiVideo, SdkworkError> {
        self.http
            .get_json(&format!("/ai/v3/videos/{}", encode_path_segment(video_id)))
            .await
    }
}

pub struct MusicApi {
    http: Arc<SdkworkHttpClient>,
}

impl MusicApi {
    pub async fn create_generate(
        &self,
        body: &MusicGenerationRequest,
    ) -> Result<SunoMusic, SdkworkError> {
        self.http
            .post_json("/ai/v3/music/generations", body)
            .await
    }

    pub async fn retrieve(&self, music_id: &str) -> Result<SunoMusic, SdkworkError> {
        self.http
            .get_json(&format!(
                "/ai/v3/music/generations/{}",
                encode_path_segment(music_id)
            ))
            .await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SpeechRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub input: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub voice: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub speed: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extra: Option<HashMap<String, Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TranscriptionResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub segments: Option<Vec<Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub words: Option<Vec<Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImageGenerationRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub n: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quality: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub image: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extra: Option<HashMap<String, Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImageGenerationResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<ImageData>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImageData {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub b64_json: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revised_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VideoGenerationRequest {
    pub prompt: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seconds: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quality: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub image_urls: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OpenAiVideo {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(
        default,
        alias = "url",
        alias = "content_url",
        skip_serializing_if = "Option::is_none"
    )]
    pub output_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<ProviderError>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub quality: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seconds: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MusicGenerationRequest {
    pub model: String,
    pub prompt: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub n: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_format: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reference_audio: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SunoMusic {
    #[serde(default, alias = "task_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audio_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<ProviderError>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProviderError {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
}

fn encode_path_segment(value: &str) -> String {
    value
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![byte as char]
            }
            _ => format!("%{:02X}", byte).chars().collect(),
        })
        .collect()
}
