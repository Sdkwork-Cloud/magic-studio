//! Standard SDKWork API response envelope (`API_SPEC.md` §4.5, §14–§16).
//!
//! Success: `SdkWorkApiResponse<T>` with `{ "code": 0, "data": <payload>, "traceId": "<uuid>" }`.
//! Error: HTTP 4xx/5xx `application/problem+json` (`SdkWorkProblemDetail`) with numeric `code` and `traceId`.

use std::sync::atomic::{AtomicU64, Ordering};

use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use sdkwork_utils_rust::http_api::{
    SdkWorkApiResponse, SdkWorkCommandData, SdkWorkPageData, SdkWorkProblemDetail,
    SdkWorkResourceData, PageInfo, PageMode, SDKWORK_SUCCESS_CODE,
};

// Re-export for use across the server crate.
pub use sdkwork_utils_rust::http_api::SdkWorkResultCode;

static REQUEST_COUNTER: AtomicU64 = AtomicU64::new(1);

/// Type alias for single-resource success responses.
pub type ApiSuccess<T> = SdkWorkApiResponse<SdkWorkResourceData<T>>;
/// Type alias for list success responses.
pub type ApiList<T> = SdkWorkApiResponse<SdkWorkPageData<T>>;
/// Type alias for command success responses.
pub type ApiCommand = SdkWorkApiResponse<SdkWorkCommandData>;

/// Standard success envelope builder for single-resource responses.
///
/// Returns `{ "code": 0, "data": { "item": <payload> }, "traceId": "<uuid>" }`.
pub fn success<T: Serialize>(data: T) -> Json<SdkWorkApiResponse<SdkWorkResourceData<T>>> {
    Json(SdkWorkApiResponse::success(
        SdkWorkResourceData { item: data },
        next_trace_id(),
    ))
}

/// Standard success envelope builder for raw data responses (no `item` wrapper).
///
/// Returns `{ "code": 0, "data": <payload>, "traceId": "<uuid>" }`.
pub fn success_raw<T: Serialize>(data: T) -> Json<SdkWorkApiResponse<T>> {
    Json(SdkWorkApiResponse::success(data, next_trace_id()))
}

/// Standard success envelope builder for list responses.
///
/// Returns `{ "code": 0, "data": { "items": [...], "pageInfo": {...} }, "traceId": "<uuid>" }`.
pub fn list<T: Serialize>(items: Vec<T>) -> Json<SdkWorkApiResponse<SdkWorkPageData<T>>> {
    let total = items.len() as i32;
    list_with_pagination(items, 1, total, total, None)
}

/// Standard success envelope builder for list responses with explicit pagination.
pub fn list_with_pagination<T: Serialize>(
    items: Vec<T>,
    page: i32,
    page_size: i32,
    total_items: i32,
    next_cursor: Option<String>,
) -> Json<SdkWorkApiResponse<SdkWorkPageData<T>>> {
    let has_more = next_cursor.is_some();
    let total_pages = if page_size > 0 {
        (total_items + page_size - 1) / page_size
    } else {
        1
    };

    Json(SdkWorkApiResponse::success(
        SdkWorkPageData {
            items,
            page_info: PageInfo {
                mode: PageMode::Offset,
                page: Some(page),
                page_size: Some(page_size),
                total_items: Some(total_items.to_string()),
                total_pages: Some(total_pages),
                next_cursor,
                has_more: Some(has_more),
            },
        },
        next_trace_id(),
    ))
}

/// Standard success envelope builder for command responses.
///
/// Returns `{ "code": 0, "data": { "accepted": true, "resourceId": "...", "status": "..." }, "traceId": "<uuid>" }`.
pub fn command(
    resource_id: Option<String>,
    status: Option<String>,
) -> Json<SdkWorkApiResponse<SdkWorkCommandData>> {
    Json(SdkWorkApiResponse::success(
        SdkWorkCommandData {
            accepted: true,
            resource_id,
            status,
        },
        next_trace_id(),
    ))
}

/// Standard success envelope builder for accepted command responses without resource id.
pub fn accepted() -> Json<SdkWorkApiResponse<SdkWorkCommandData>> {
    Json(SdkWorkApiResponse::success(
        SdkWorkCommandData::accepted(),
        next_trace_id(),
    ))
}

/// Server error type using standard numeric result codes.
#[derive(Debug, Clone)]
pub struct ServerError {
    pub result_code: SdkWorkResultCode,
    pub detail: String,
    pub tag: Option<String>,
}

impl ServerError {
    pub fn new(result_code: SdkWorkResultCode, detail: impl Into<String>) -> Self {
        Self {
            result_code,
            detail: detail.into(),
            tag: None,
        }
    }

    pub fn bad_request(detail: impl Into<String>) -> Self {
        Self::new(SdkWorkResultCode::ValidationError, detail)
    }

    pub fn not_found(detail: impl Into<String>) -> Self {
        Self::new(SdkWorkResultCode::NotFound, detail)
    }

    pub fn forbidden(detail: impl Into<String>) -> Self {
        Self::new(SdkWorkResultCode::PermissionRequired, detail)
    }

    pub fn conflict(detail: impl Into<String>) -> Self {
        Self::new(SdkWorkResultCode::Conflict, detail)
    }

    pub fn internal(detail: impl Into<String>) -> Self {
        Self::new(SdkWorkResultCode::InternalError, detail)
    }

    pub fn unprocessable(detail: impl Into<String>) -> Self {
        Self::new(SdkWorkResultCode::UnprocessableEntity, detail)
    }

    /// Appends a custom error tag for backward-compatible code comparisons.
    pub fn with_tag(mut self, tag: impl Into<String>) -> Self {
        self.tag = Some(tag.into());
        self
    }

    /// Returns the custom tag if set, otherwise the result code symbol.
    pub fn code(&self) -> &str {
        self.tag.as_deref().unwrap_or(self.result_code.symbol())
    }

    /// Returns the HTTP status code for this error.
    pub fn status_code(&self) -> u16 {
        self.result_code.http_status_code()
    }

    /// Appends additional detail to the error message.
    pub fn with_detail(mut self, detail: impl Into<String>) -> Self {
        let detail_text = detail.into();
        if detail_text.is_empty() {
            return self;
        }
        if self.detail.is_empty() {
            self.detail = detail_text;
        } else {
            self.detail = format!("{}: {}", self.detail, detail_text);
        }
        self
    }
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let problem = SdkWorkProblemDetail::platform(
            self.result_code,
            &self.detail,
            next_trace_id(),
        );

        let status = StatusCode::from_u16(self.result_code.http_status_code())
            .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

        let body = Json(problem);
        let mut response = (status, body).into_response();
        response.headers_mut().insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/problem+json"),
        );
        response
    }
}

pub type ServerResult<T> = Result<T, ServerError>;

fn next_trace_id() -> String {
    let _counter = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    sdkwork_utils_rust::id::uuid()
}

/// Returns the canonical success code for reference.
#[allow(dead_code)]
pub fn success_code() -> i32 {
    SDKWORK_SUCCESS_CODE
}
