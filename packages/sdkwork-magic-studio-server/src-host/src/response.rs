use crate::contract::embedded_server_contract;
use std::sync::atomic::{AtomicU64, Ordering};

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

static REQUEST_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiMeta {
    pub version: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiListMeta {
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
    pub version: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiEnvelope<T> {
    pub request_id: String,
    pub timestamp: String,
    pub data: T,
    pub meta: ApiMeta,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiListEnvelope<T> {
    pub request_id: String,
    pub timestamp: String,
    pub items: Vec<T>,
    pub meta: ApiListMeta,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiProblemDetails {
    pub code: String,
    pub message: String,
    pub detail: Option<String>,
    pub retryable: bool,
    pub field_errors: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiProblemEnvelope {
    pub request_id: String,
    pub timestamp: String,
    pub error: ApiProblemDetails,
}

#[derive(Debug, Clone)]
pub struct ServerError {
    pub status: StatusCode,
    pub code: String,
    pub message: String,
    pub detail: Option<String>,
    pub retryable: bool,
}

impl ServerError {
    pub fn new(status: StatusCode, code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            status,
            code: code.into(),
            message: message.into(),
            detail: None,
            retryable: false,
        }
    }

    pub fn with_detail(mut self, detail: impl Into<String>) -> Self {
        self.detail = Some(detail.into());
        self
    }

    pub fn bad_request(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, code, message)
    }

    pub fn forbidden(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, code, message)
    }

    pub fn not_found(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, code, message)
    }

    pub fn conflict(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(StatusCode::CONFLICT, code, message)
    }

    pub fn internal(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, code, message)
    }
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let body = Json(ApiProblemEnvelope {
            request_id: next_request_id(),
            timestamp: current_timestamp(),
            error: ApiProblemDetails {
                code: self.code,
                message: self.message,
                detail: self.detail,
                retryable: self.retryable,
                field_errors: None,
            },
        });
        (self.status, body).into_response()
    }
}

pub type ServerResult<T> = Result<T, ServerError>;

pub fn success<T: Serialize>(data: T) -> Json<ApiEnvelope<T>> {
    Json(ApiEnvelope {
        request_id: next_request_id(),
        timestamp: current_timestamp(),
        data,
        meta: ApiMeta {
            version: embedded_server_contract().api_version.clone(),
        },
    })
}

pub fn list<T: Serialize>(items: Vec<T>) -> Json<ApiListEnvelope<T>> {
    let total = items.len();
    list_with_meta(items, 1, total, total)
}

pub fn list_with_meta<T: Serialize>(
    items: Vec<T>,
    page: usize,
    page_size: usize,
    total: usize,
) -> Json<ApiListEnvelope<T>> {
    Json(ApiListEnvelope {
        request_id: next_request_id(),
        timestamp: current_timestamp(),
        items,
        meta: ApiListMeta {
            page,
            page_size,
            total,
            version: embedded_server_contract().api_version.clone(),
        },
    })
}

fn next_request_id() -> String {
    let counter = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("local-request-{counter}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}
