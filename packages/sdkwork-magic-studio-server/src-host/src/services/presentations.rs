use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

const PRESENTATIONS_SCHEMA_VERSION: &str = "magic-studio.presentations.v1";
const DEFAULT_PRESENTATIONS_PAGE_SIZE: usize = 50;
const MAX_PRESENTATIONS_PAGE_SIZE: usize = 200;

static PRESENTATION_COUNTER: AtomicU64 = AtomicU64::new(1);
static PRESENTATION_SLIDE_COUNTER: AtomicU64 = AtomicU64::new(1);
static PRESENTATION_ELEMENT_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PresentationSlideElementType {
    Text,
    Image,
    Shape,
    Chart,
    Table,
    Video,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PresentationSlideLayout {
    Title,
    BulletPoints,
    ImageLeft,
    ImageRight,
    TwoColumn,
    Blank,
    TitleContent,
    Comparison,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PresentationTheme {
    Modern,
    Classic,
    Dark,
    Vibrant,
    Minimal,
    Corporate,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSettingsRecord {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_font: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub primary_color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub secondary_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlideElementRecord {
    pub id: String,
    pub uuid: String,
    #[serde(rename = "type")]
    pub element_type: PresentationSlideElementType,
    pub content: String,
    pub x: f64,
    pub y: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub width: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub height: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub style: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlideRecord {
    pub id: String,
    pub uuid: String,
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    pub elements: Vec<PresentationSlideElementRecord>,
    pub layout: PresentationSlideLayout,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background_image: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub transition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationRecord {
    pub id: String,
    pub uuid: String,
    pub title: String,
    pub slides: Vec<PresentationSlideRecord>,
    pub theme: PresentationTheme,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub settings: Option<PresentationSettingsRecord>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone)]
pub struct PresentationListResult {
    pub items: Vec<PresentationRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PresentationListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub keyword: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationCreateRequest {
    pub title: String,
    pub theme: Option<PresentationTheme>,
    pub settings: Option<PresentationSettingsRecord>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlideElementPayload {
    pub id: Option<String>,
    pub uuid: Option<String>,
    #[serde(rename = "type")]
    pub element_type: PresentationSlideElementType,
    pub content: String,
    pub x: f64,
    pub y: f64,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub style: Option<Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlidePayload {
    pub id: Option<String>,
    pub uuid: Option<String>,
    pub title: String,
    pub notes: Option<String>,
    pub elements: Vec<PresentationSlideElementPayload>,
    pub layout: PresentationSlideLayout,
    pub background_color: Option<String>,
    pub background_image: Option<String>,
    pub transition: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationUpdateRequest {
    pub title: Option<String>,
    pub theme: Option<PresentationTheme>,
    pub settings: Option<PresentationSettingsRecord>,
    pub slides: Option<Vec<PresentationSlidePayload>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlideCreateRequest {
    pub layout: Option<PresentationSlideLayout>,
    pub title: Option<String>,
    pub heading: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentationSlideUpdateRequest {
    pub title: Option<String>,
    pub notes: Option<String>,
    pub elements: Option<Vec<PresentationSlideElementPayload>>,
    pub layout: Option<PresentationSlideLayout>,
    pub background_color: Option<String>,
    pub background_image: Option<String>,
    pub transition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PresentationRegistryDocument {
    pub schema_version: String,
    pub presentations: Vec<PresentationRecord>,
}

pub trait PresentationService: Send + Sync {
    fn list_presentations(
        &self,
        query: PresentationListQuery,
    ) -> ServerResult<PresentationListResult>;
    fn create_presentation(
        &self,
        input: PresentationCreateRequest,
    ) -> ServerResult<PresentationRecord>;
    fn read_presentation(&self, presentation_key: &str) -> ServerResult<PresentationRecord>;
    fn update_presentation(
        &self,
        presentation_key: &str,
        input: PresentationUpdateRequest,
    ) -> ServerResult<PresentationRecord>;
    fn delete_presentation(&self, presentation_key: &str) -> ServerResult<()>;
    fn create_slide(
        &self,
        presentation_key: &str,
        input: PresentationSlideCreateRequest,
    ) -> ServerResult<PresentationRecord>;
    fn update_slide(
        &self,
        presentation_key: &str,
        slide_key: &str,
        input: PresentationSlideUpdateRequest,
    ) -> ServerResult<PresentationRecord>;
}

pub struct FileBackedPresentationService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedPresentationService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_PRESENTATIONS_LOCK_FAILED",
                "presentations registry lock was poisoned",
            )
        })
    }

    fn default_document(&self) -> PresentationRegistryDocument {
        PresentationRegistryDocument {
            schema_version: PRESENTATIONS_SCHEMA_VERSION.to_string(),
            presentations: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<PresentationRegistryDocument> {
        let path = self.storage_paths.presentations_registry_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(self.default_document())
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_PRESENTATIONS_READ_FAILED",
                    format!(
                        "failed to read presentations registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document = serde_json::from_str::<PresentationRegistryDocument>(&contents)
            .map_err(|error| {
                ServerError::internal(
                    "APP_PRESENTATIONS_PARSE_FAILED",
                    format!(
                        "failed to parse presentations registry {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &PresentationRegistryDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_PRESENTATIONS_SERIALIZE_FAILED",
                format!("failed to serialize presentations registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.presentations_registry_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_PRESENTATIONS_WRITE_FAILED",
                format!(
                    "failed to write presentations registry to {}: {error}",
                    self.storage_paths.presentations_registry_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut PresentationRegistryDocument) {
        if document.schema_version.trim().is_empty() {
            document.schema_version = PRESENTATIONS_SCHEMA_VERSION.to_string();
        }

        document
            .presentations
            .sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    }

    fn find_presentation_mut<'a>(
        &self,
        document: &'a mut PresentationRegistryDocument,
        presentation_key: &str,
    ) -> ServerResult<&'a mut PresentationRecord> {
        let normalized = require_non_empty_text(
            presentation_key,
            "APP_PRESENTATION_ID_EMPTY",
            "presentationId",
        )?;

        document
            .presentations
            .iter_mut()
            .find(|presentation| presentation.id == normalized || presentation.uuid == normalized)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_PRESENTATION_NOT_FOUND",
                    format!("presentation {normalized} was not found"),
                )
            })
    }

    fn find_presentation<'a>(
        &self,
        document: &'a PresentationRegistryDocument,
        presentation_key: &str,
    ) -> ServerResult<&'a PresentationRecord> {
        let normalized = require_non_empty_text(
            presentation_key,
            "APP_PRESENTATION_ID_EMPTY",
            "presentationId",
        )?;

        document
            .presentations
            .iter()
            .find(|presentation| presentation.id == normalized || presentation.uuid == normalized)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_PRESENTATION_NOT_FOUND",
                    format!("presentation {normalized} was not found"),
                )
            })
    }
}

impl PresentationService for FileBackedPresentationService {
    fn list_presentations(
        &self,
        query: PresentationListQuery,
    ) -> ServerResult<PresentationListResult> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        let normalized_page = query.page.unwrap_or(1).max(1);
        let normalized_page_size = query
            .page_size
            .unwrap_or(DEFAULT_PRESENTATIONS_PAGE_SIZE)
            .clamp(1, MAX_PRESENTATIONS_PAGE_SIZE);
        let keyword = normalize_optional_text(query.keyword).map(|value| value.to_lowercase());

        let filtered: Vec<PresentationRecord> = document
            .presentations
            .into_iter()
            .filter(|presentation| presentation.deleted_at.is_none())
            .filter(|presentation| {
                keyword
                    .as_ref()
                    .map(|keyword| presentation.title.to_lowercase().contains(keyword))
                    .unwrap_or(true)
            })
            .collect();

        let total = filtered.len();
        let start = (normalized_page - 1) * normalized_page_size;
        let items = filtered
            .into_iter()
            .skip(start)
            .take(normalized_page_size)
            .collect();

        Ok(PresentationListResult {
            items,
            page: normalized_page,
            page_size: normalized_page_size,
            total,
        })
    }

    fn create_presentation(
        &self,
        input: PresentationCreateRequest,
    ) -> ServerResult<PresentationRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let title = require_non_empty_text(&input.title, "APP_PRESENTATION_TITLE_EMPTY", "title")?;
        let now = current_timestamp();
        let presentation_id = next_entity_id("presentation", &PRESENTATION_COUNTER);
        let presentation = PresentationRecord {
            id: presentation_id.clone(),
            uuid: to_client_entity_uuid(&presentation_id),
            title: title.clone(),
            slides: vec![create_title_slide(&title)],
            theme: input.theme.unwrap_or(PresentationTheme::Modern),
            settings: input.settings,
            created_at: now.clone(),
            updated_at: now,
            deleted_at: None,
        };
        document.presentations.insert(0, presentation.clone());
        self.persist_to_disk(&document)?;
        Ok(presentation)
    }

    fn read_presentation(&self, presentation_key: &str) -> ServerResult<PresentationRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_from_disk()?;
        Ok(self.find_presentation(&document, presentation_key)?.clone())
    }

    fn update_presentation(
        &self,
        presentation_key: &str,
        input: PresentationUpdateRequest,
    ) -> ServerResult<PresentationRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let presentation = self.find_presentation_mut(&mut document, presentation_key)?;

        if let Some(title) = input.title {
            presentation.title =
                require_non_empty_text(&title, "APP_PRESENTATION_TITLE_EMPTY", "title")?;
        }

        if let Some(theme) = input.theme {
            presentation.theme = theme;
        }

        if let Some(settings) = input.settings {
            presentation.settings = Some(settings);
        }

        if let Some(slides) = input.slides {
            presentation.slides = slides
                .into_iter()
                .map(normalize_slide_payload)
                .collect::<ServerResult<Vec<_>>>()?;
        }

        presentation.updated_at = current_timestamp();
        let updated = presentation.clone();
        document
            .presentations
            .sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        self.persist_to_disk(&document)?;
        Ok(updated)
    }

    fn delete_presentation(&self, presentation_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let normalized = require_non_empty_text(
            presentation_key,
            "APP_PRESENTATION_ID_EMPTY",
            "presentationId",
        )?;
        let before_len = document.presentations.len();
        document.presentations.retain(|presentation| {
            presentation.id != normalized && presentation.uuid != normalized
        });

        if document.presentations.len() == before_len {
            return Err(ServerError::not_found(
                "APP_PRESENTATION_NOT_FOUND",
                format!("presentation {normalized} was not found"),
            ));
        }

        self.persist_to_disk(&document)?;
        Ok(())
    }

    fn create_slide(
        &self,
        presentation_key: &str,
        input: PresentationSlideCreateRequest,
    ) -> ServerResult<PresentationRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let presentation = self.find_presentation_mut(&mut document, presentation_key)?;
        let slide = create_slide_record(
            input
                .layout
                .unwrap_or(PresentationSlideLayout::BulletPoints),
            normalize_optional_text(input.title),
            normalize_optional_text(input.heading),
        );
        presentation.slides.push(slide);
        presentation.updated_at = current_timestamp();
        let updated = presentation.clone();
        document
            .presentations
            .sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        self.persist_to_disk(&document)?;
        Ok(updated)
    }

    fn update_slide(
        &self,
        presentation_key: &str,
        slide_key: &str,
        input: PresentationSlideUpdateRequest,
    ) -> ServerResult<PresentationRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_from_disk()?;
        let presentation = self.find_presentation_mut(&mut document, presentation_key)?;
        let normalized_slide_key =
            require_non_empty_text(slide_key, "APP_PRESENTATION_SLIDE_ID_EMPTY", "slideId")?;
        let slide = presentation
            .slides
            .iter_mut()
            .find(|slide| slide.id == normalized_slide_key || slide.uuid == normalized_slide_key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_PRESENTATION_SLIDE_NOT_FOUND",
                    format!("slide {normalized_slide_key} was not found"),
                )
            })?;

        if let Some(title) = input.title {
            slide.title =
                require_non_empty_text(&title, "APP_PRESENTATION_SLIDE_TITLE_EMPTY", "title")?;
        }

        if let Some(notes) = input.notes {
            slide.notes = normalize_optional_text(Some(notes));
        }

        if let Some(elements) = input.elements {
            slide.elements = elements
                .into_iter()
                .map(normalize_slide_element_payload)
                .collect::<ServerResult<Vec<_>>>()?;
        }

        if let Some(layout) = input.layout {
            slide.layout = layout;
        }

        if let Some(background_color) = input.background_color {
            slide.background_color = normalize_optional_text(Some(background_color));
        }

        if let Some(background_image) = input.background_image {
            slide.background_image = normalize_optional_text(Some(background_image));
        }

        if let Some(transition) = input.transition {
            slide.transition = normalize_optional_text(Some(transition));
        }

        presentation.updated_at = current_timestamp();
        let updated = presentation.clone();
        document
            .presentations
            .sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        self.persist_to_disk(&document)?;
        Ok(updated)
    }
}

fn create_title_slide(title: &str) -> PresentationSlideRecord {
    create_slide_record(
        PresentationSlideLayout::Title,
        Some("Untitled Slide".to_string()),
        Some(title.to_string()),
    )
}

fn create_slide_record(
    layout: PresentationSlideLayout,
    title: Option<String>,
    heading: Option<String>,
) -> PresentationSlideRecord {
    let slide_id = next_entity_id("presentation-slide", &PRESENTATION_SLIDE_COUNTER);
    let element_id = next_entity_id("presentation-element", &PRESENTATION_ELEMENT_COUNTER);
    let resolved_title = title.unwrap_or_else(|| {
        if layout == PresentationSlideLayout::Title {
            "Untitled Slide".to_string()
        } else {
            "New Slide".to_string()
        }
    });
    let resolved_heading = heading.unwrap_or_else(|| "New Slide Title".to_string());

    PresentationSlideRecord {
        id: slide_id.clone(),
        uuid: to_client_entity_uuid(&slide_id),
        title: resolved_title,
        notes: None,
        elements: vec![PresentationSlideElementRecord {
            id: element_id.clone(),
            uuid: to_client_entity_uuid(&element_id),
            element_type: PresentationSlideElementType::Text,
            content: resolved_heading,
            x: if layout == PresentationSlideLayout::Title {
                10.0
            } else {
                5.0
            },
            y: if layout == PresentationSlideLayout::Title {
                40.0
            } else {
                10.0
            },
            width: Some(if layout == PresentationSlideLayout::Title {
                80.0
            } else {
                90.0
            }),
            height: None,
            style: if layout == PresentationSlideLayout::Title {
                Some(serde_json::json!({
                    "fontSize": "3rem",
                    "fontWeight": "bold"
                }))
            } else {
                None
            },
        }],
        layout,
        background_color: None,
        background_image: None,
        transition: None,
    }
}

fn normalize_slide_payload(
    slide: PresentationSlidePayload,
) -> ServerResult<PresentationSlideRecord> {
    let slide_id = normalize_optional_text(slide.id)
        .unwrap_or_else(|| next_entity_id("presentation-slide", &PRESENTATION_SLIDE_COUNTER));
    let slide_uuid =
        normalize_optional_text(slide.uuid).unwrap_or_else(|| to_client_entity_uuid(&slide_id));

    Ok(PresentationSlideRecord {
        id: slide_id,
        uuid: slide_uuid,
        title: require_non_empty_text(&slide.title, "APP_PRESENTATION_SLIDE_TITLE_EMPTY", "title")?,
        notes: normalize_optional_text(slide.notes),
        elements: slide
            .elements
            .into_iter()
            .map(normalize_slide_element_payload)
            .collect::<ServerResult<Vec<_>>>()?,
        layout: slide.layout,
        background_color: normalize_optional_text(slide.background_color),
        background_image: normalize_optional_text(slide.background_image),
        transition: normalize_optional_text(slide.transition),
    })
}

fn normalize_slide_element_payload(
    element: PresentationSlideElementPayload,
) -> ServerResult<PresentationSlideElementRecord> {
    let element_id = normalize_optional_text(element.id)
        .unwrap_or_else(|| next_entity_id("presentation-element", &PRESENTATION_ELEMENT_COUNTER));
    let element_uuid =
        normalize_optional_text(element.uuid).unwrap_or_else(|| to_client_entity_uuid(&element_id));

    Ok(PresentationSlideElementRecord {
        id: element_id,
        uuid: element_uuid,
        element_type: element.element_type,
        content: require_non_empty_text(
            &element.content,
            "APP_PRESENTATION_ELEMENT_CONTENT_EMPTY",
            "content",
        )?,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        style: element.style,
    })
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn require_non_empty_text(value: &str, code: &str, field_name: &str) -> ServerResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServerError::bad_request(
            code,
            format!("{field_name} must not be empty"),
        ));
    }
    Ok(trimmed.to_string())
}

fn next_entity_id(prefix: &str, counter: &AtomicU64) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let sequence = counter.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{nonce}-{sequence}")
}

fn to_client_entity_uuid(id: &str) -> String {
    format!("client-entity:{id}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}
