use std::fs;
use std::sync::{Arc, Mutex, MutexGuard};

use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::identity::{IdentityService, UserProfileRecord};

const TRADE_MARKETPLACE_SCHEMA_VERSION: &str = "magic-studio.trade.marketplace.v1";
const DEFAULT_PAGE_SIZE: usize = 20;
const MAX_PAGE_SIZE: usize = 100;
const DEFAULT_SEED_TIMESTAMP: &str = "2026-04-22T00:00:00Z";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradeMarketplaceTaskType {
    TextToVideo,
    ImageToVideo,
    VideoExtend,
    VideoRestore,
    VideoSuperResolution,
    VideoFrameInterpolation,
    VideoColorization,
    VideoStyleTransfer,
    AvatarVideo,
    LipSync,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradeMarketplaceTaskStatus {
    Available,
    Accepted,
    InProgress,
    Completed,
    Cancelled,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradeMarketplaceTaskDifficulty {
    Easy,
    Medium,
    Hard,
    Expert,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeMarketplaceTaskRecord {
    pub id: String,
    pub uuid: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub task_type: TradeMarketplaceTaskType,
    pub requirements: Vec<String>,
    pub budget: f64,
    pub deadline: String,
    pub publisher_uuid: String,
    pub publisher_name: String,
    pub status: TradeMarketplaceTaskStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub acceptor_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub acceptor_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub submitted_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub approved_at: Option<String>,
    #[serde(default)]
    pub attachment_resource_uuids: Vec<String>,
    #[serde(default)]
    pub delivery_resource_uuids: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub difficulty: TradeMarketplaceTaskDifficulty,
    pub estimated_duration: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accept_message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub submission_description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub approval_feedback: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone)]
pub struct TradeMarketplaceTaskPage {
    pub items: Vec<TradeMarketplaceTaskRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradeMarketplaceTaskListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub keyword: Option<String>,
    pub status: Option<TradeMarketplaceTaskStatus>,
    #[serde(rename = "type")]
    pub task_type: Option<TradeMarketplaceTaskType>,
    pub difficulty: Option<TradeMarketplaceTaskDifficulty>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradeTaskAcceptRequest {
    pub message: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradeTaskSubmitRequest {
    #[serde(default)]
    pub delivery_resource_uuids: Vec<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeTaskApproveRequest {
    pub approved: bool,
    pub feedback: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TradeMarketplaceDocument {
    pub schema_version: String,
    #[serde(default)]
    pub tasks: Vec<TradeMarketplaceTaskRecord>,
}

#[derive(Debug, Clone)]
struct TradeActor {
    uuid: String,
    display_name: String,
}

#[derive(Debug, Clone, Copy)]
enum TradeTaskListScope {
    Available,
    Published,
    Accepted,
}

pub trait TradeService: Send + Sync {
    fn list_available_tasks(
        &self,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage>;
    fn list_published_tasks(
        &self,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage>;
    fn list_accepted_tasks(
        &self,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage>;
    fn read_task(&self, task_key: &str) -> ServerResult<TradeMarketplaceTaskRecord>;
    fn accept_task(
        &self,
        task_key: &str,
        input: TradeTaskAcceptRequest,
    ) -> ServerResult<TradeMarketplaceTaskRecord>;
    fn submit_task(
        &self,
        task_key: &str,
        input: TradeTaskSubmitRequest,
    ) -> ServerResult<TradeMarketplaceTaskRecord>;
    fn approve_task(
        &self,
        task_key: &str,
        input: TradeTaskApproveRequest,
    ) -> ServerResult<TradeMarketplaceTaskRecord>;
    fn cancel_task(&self, task_key: &str) -> ServerResult<TradeMarketplaceTaskRecord>;
}

pub struct FileBackedTradeService {
    storage_paths: AppStoragePaths,
    identity_service: Arc<dyn IdentityService>,
    lock: Mutex<()>,
}

impl FileBackedTradeService {
    pub fn new(storage_paths: AppStoragePaths, identity_service: Arc<dyn IdentityService>) -> Self {
        Self {
            storage_paths,
            identity_service,
            lock: Mutex::new(()),
        }
    }

    fn default_document(&self) -> ServerResult<TradeMarketplaceDocument> {
        let current_actor = self.current_actor()?;

        Ok(TradeMarketplaceDocument {
            schema_version: TRADE_MARKETPLACE_SCHEMA_VERSION.to_string(),
            tasks: vec![
                seed_task(
                    "1",
                    "trade-task-market-001",
                    "Cinematic launch trailer edit",
                    "Assemble a polished 45-second launch trailer from provided stills, brand cues, and a voice-over script.",
                    TradeMarketplaceTaskType::ImageToVideo,
                    &[
                        "Use the provided hero images as the primary visual anchors",
                        "Keep brand-safe typography and clean product framing",
                        "Deliver one landscape master and one short social cut",
                    ],
                    6800.0,
                    "2026-05-02T12:00:00Z",
                    "producer-aurora",
                    "Aurora Pictures",
                    TradeMarketplaceTaskStatus::Available,
                    &["launch", "trailer", "brand"],
                    TradeMarketplaceTaskDifficulty::Hard,
                    480,
                ),
                seed_task(
                    "2",
                    "trade-task-market-002",
                    "Avatar lip-sync promo revision",
                    "Refine an existing avatar promo clip with better timing, cleaner mouth closure, and a stronger intro hook.",
                    TradeMarketplaceTaskType::LipSync,
                    &[
                        "Maintain the existing avatar identity",
                        "Improve first five seconds retention",
                        "Return source notes for the final timing pass",
                    ],
                    3200.0,
                    "2026-04-29T18:00:00Z",
                    "studio-motion-lab",
                    "Motion Lab",
                    TradeMarketplaceTaskStatus::Available,
                    &["avatar", "marketing", "revision"],
                    TradeMarketplaceTaskDifficulty::Medium,
                    240,
                ),
                seed_task(
                    "3",
                    "trade-task-market-003",
                    "Historical footage restoration batch",
                    "Restore low-contrast archival footage with color stabilization and artifact cleanup for documentary use.",
                    TradeMarketplaceTaskType::VideoRestore,
                    &[
                        "Preserve period-authentic color mood",
                        "Avoid over-sharpening faces",
                        "Flag unresolved corruption frames in notes",
                    ],
                    9200.0,
                    "2026-05-06T10:00:00Z",
                    "docu-frame",
                    "DocuFrame",
                    TradeMarketplaceTaskStatus::Available,
                    &["restore", "archive", "documentary"],
                    TradeMarketplaceTaskDifficulty::Expert,
                    720,
                ),
                seed_task(
                    "4",
                    "trade-task-published-001",
                    "Current user showcase social cut",
                    "Package a short social teaser around the current user's film pitch deck and hero clips.",
                    TradeMarketplaceTaskType::TextToVideo,
                    &[
                        "Use the deck title cards as structure",
                        "Keep pacing fast and mobile friendly",
                    ],
                    2600.0,
                    "2026-04-30T09:00:00Z",
                    &current_actor.uuid,
                    &current_actor.display_name,
                    TradeMarketplaceTaskStatus::Available,
                    &["social", "teaser", "portfolio"],
                    TradeMarketplaceTaskDifficulty::Easy,
                    180,
                ),
                seed_task(
                    "5",
                    "trade-task-published-002",
                    "Premium reel upscale pass",
                    "Upscale a premium reel cut and repair compression damage before delivery to the showcase channel.",
                    TradeMarketplaceTaskType::VideoSuperResolution,
                    &[
                        "Prioritize face detail recovery",
                        "Do not introduce artificial sharpening halos",
                    ],
                    5400.0,
                    "2026-05-04T08:00:00Z",
                    &current_actor.uuid,
                    &current_actor.display_name,
                    TradeMarketplaceTaskStatus::Available,
                    &["upscale", "showcase", "premium"],
                    TradeMarketplaceTaskDifficulty::Hard,
                    360,
                ),
            ],
        })
    }

    fn load_from_disk(&self) -> ServerResult<TradeMarketplaceDocument> {
        let path = self.storage_paths.trade_marketplace_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return self.default_document();
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_TRADE_MARKETPLACE_READ_FAILED",
                    format!(
                        "failed to read trade marketplace registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<TradeMarketplaceDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_TRADE_MARKETPLACE_PARSE_FAILED",
                    format!(
                        "failed to parse trade marketplace registry {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &TradeMarketplaceDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.trade_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_TRADE_ROOT_CREATE_FAILED",
                format!(
                    "failed to create trade root {}: {error}",
                    self.storage_paths.trade_root_dir().display()
                ),
            )
        })?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_TRADE_MARKETPLACE_SERIALIZE_FAILED",
                format!("failed to serialize trade marketplace registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.trade_marketplace_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_TRADE_MARKETPLACE_WRITE_FAILED",
                format!(
                    "failed to write trade marketplace registry to {}: {error}",
                    self.storage_paths.trade_marketplace_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut TradeMarketplaceDocument) {
        document.schema_version = TRADE_MARKETPLACE_SCHEMA_VERSION.to_string();
        for task in &mut document.tasks {
            if task.attachment_resource_uuids.is_empty() {
                task.attachment_resource_uuids = Vec::new();
            }
            if task.delivery_resource_uuids.is_empty() {
                task.delivery_resource_uuids = Vec::new();
            }
            task.requirements = dedupe_strings(task.requirements.clone());
            task.tags = dedupe_strings(task.tags.clone());
            task.accept_message = normalize_optional_text(task.accept_message.clone());
            task.submission_description =
                normalize_optional_text(task.submission_description.clone());
            task.approval_feedback = normalize_optional_text(task.approval_feedback.clone());
            task.acceptor_uuid = normalize_optional_text(task.acceptor_uuid.clone());
            task.acceptor_name = normalize_optional_text(task.acceptor_name.clone());
            task.accepted_at = normalize_optional_text(task.accepted_at.clone());
            task.submitted_at = normalize_optional_text(task.submitted_at.clone());
            task.approved_at = normalize_optional_text(task.approved_at.clone());
        }
    }

    fn lock_document(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_TRADE_MARKETPLACE_LOCK_FAILED",
                "trade marketplace registry lock is poisoned",
            )
        })
    }

    fn current_actor(&self) -> ServerResult<TradeActor> {
        let profile = self.identity_service.read_user_profile()?;
        Ok(map_trade_actor(profile))
    }

    fn read_task_record<'a>(
        &self,
        document: &'a TradeMarketplaceDocument,
        task_key: &str,
    ) -> ServerResult<&'a TradeMarketplaceTaskRecord> {
        let trimmed = task_key.trim();
        document
            .tasks
            .iter()
            .find(|task| task.id == trimmed || task.uuid == trimmed)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_TASK_NOT_FOUND",
                    format!("trade marketplace task {trimmed} was not found"),
                )
            })
    }

    fn read_task_record_mut<'a>(
        &self,
        document: &'a mut TradeMarketplaceDocument,
        task_key: &str,
    ) -> ServerResult<&'a mut TradeMarketplaceTaskRecord> {
        let trimmed = task_key.trim();
        document
            .tasks
            .iter_mut()
            .find(|task| task.id == trimmed || task.uuid == trimmed)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_TASK_NOT_FOUND",
                    format!("trade marketplace task {trimmed} was not found"),
                )
            })
    }

    fn list_tasks(
        &self,
        scope: TradeTaskListScope,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage> {
        let actor = self.current_actor()?;
        let document = self.load_from_disk()?;
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);

        let mut tasks = document
            .tasks
            .into_iter()
            .filter(|task| match scope {
                TradeTaskListScope::Available => {
                    task.status == TradeMarketplaceTaskStatus::Available
                        && task.publisher_uuid != actor.uuid
                }
                TradeTaskListScope::Published => task.publisher_uuid == actor.uuid,
                TradeTaskListScope::Accepted => {
                    task.acceptor_uuid.as_deref() == Some(actor.uuid.as_str())
                }
            })
            .collect::<Vec<_>>();

        tasks = apply_task_query(tasks, &query);
        sort_tasks(
            &mut tasks,
            query.sort_by.as_deref(),
            query.sort_order.as_deref(),
        );

        let total = tasks.len();
        let start = (page.saturating_sub(1)).saturating_mul(page_size);
        let items = tasks.into_iter().skip(start).take(page_size).collect();

        Ok(TradeMarketplaceTaskPage {
            items,
            page,
            page_size,
            total,
        })
    }
}

impl TradeService for FileBackedTradeService {
    fn list_available_tasks(
        &self,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage> {
        self.list_tasks(TradeTaskListScope::Available, query)
    }

    fn list_published_tasks(
        &self,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage> {
        self.list_tasks(TradeTaskListScope::Published, query)
    }

    fn list_accepted_tasks(
        &self,
        query: TradeMarketplaceTaskListQuery,
    ) -> ServerResult<TradeMarketplaceTaskPage> {
        self.list_tasks(TradeTaskListScope::Accepted, query)
    }

    fn read_task(&self, task_key: &str) -> ServerResult<TradeMarketplaceTaskRecord> {
        let document = self.load_from_disk()?;
        Ok(self.read_task_record(&document, task_key)?.clone())
    }

    fn accept_task(
        &self,
        task_key: &str,
        input: TradeTaskAcceptRequest,
    ) -> ServerResult<TradeMarketplaceTaskRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let task = self.read_task_record_mut(&mut document, task_key)?;
        if task.publisher_uuid == actor.uuid {
            return Err(ServerError::forbidden(
                "APP_TRADE_TASK_SELF_ACCEPT_FORBIDDEN",
                "publishers cannot accept their own marketplace task",
            ));
        }
        if task.status != TradeMarketplaceTaskStatus::Available {
            return Err(ServerError::conflict(
                "APP_TRADE_TASK_NOT_ACCEPTABLE",
                "trade marketplace task is not available for acceptance",
            ));
        }

        task.status = TradeMarketplaceTaskStatus::Accepted;
        task.acceptor_uuid = Some(actor.uuid);
        task.acceptor_name = Some(actor.display_name);
        task.accepted_at = Some(now.clone());
        task.updated_at = now;
        task.accept_message = normalize_optional_text(input.message);
        task.submitted_at = None;
        task.approved_at = None;
        task.submission_description = None;
        task.approval_feedback = None;
        task.delivery_resource_uuids.clear();

        let response = task.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn submit_task(
        &self,
        task_key: &str,
        input: TradeTaskSubmitRequest,
    ) -> ServerResult<TradeMarketplaceTaskRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let task = self.read_task_record_mut(&mut document, task_key)?;
        if task.acceptor_uuid.as_deref() != Some(actor.uuid.as_str()) {
            return Err(ServerError::forbidden(
                "APP_TRADE_TASK_SUBMIT_FORBIDDEN",
                "only the accepted worker can submit this marketplace task",
            ));
        }
        if task.status != TradeMarketplaceTaskStatus::Accepted
            && task.status != TradeMarketplaceTaskStatus::InProgress
        {
            return Err(ServerError::conflict(
                "APP_TRADE_TASK_NOT_SUBMITTABLE",
                "trade marketplace task must be accepted before submission",
            ));
        }

        let delivery_resource_uuids = dedupe_strings(input.delivery_resource_uuids);
        let submission_description = normalize_optional_text(input.description);
        if delivery_resource_uuids.is_empty() && submission_description.is_none() {
            return Err(ServerError::bad_request(
                "APP_TRADE_TASK_SUBMISSION_EMPTY",
                "submission must include delivery resources or a delivery description",
            ));
        }

        task.status = TradeMarketplaceTaskStatus::Completed;
        task.delivery_resource_uuids = delivery_resource_uuids;
        task.submission_description = submission_description;
        task.submitted_at = Some(now.clone());
        task.updated_at = now;
        task.approved_at = None;
        task.approval_feedback = None;

        let response = task.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn approve_task(
        &self,
        task_key: &str,
        input: TradeTaskApproveRequest,
    ) -> ServerResult<TradeMarketplaceTaskRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let task = self.read_task_record_mut(&mut document, task_key)?;
        if task.publisher_uuid != actor.uuid {
            return Err(ServerError::forbidden(
                "APP_TRADE_TASK_APPROVAL_FORBIDDEN",
                "only the publishing user can approve or reopen this marketplace task",
            ));
        }

        if task.status != TradeMarketplaceTaskStatus::Completed
            && task.status != TradeMarketplaceTaskStatus::Accepted
            && task.status != TradeMarketplaceTaskStatus::InProgress
        {
            return Err(ServerError::conflict(
                "APP_TRADE_TASK_NOT_APPROVABLE",
                "trade marketplace task is not in a reviewable state",
            ));
        }

        task.approval_feedback = normalize_optional_text(input.feedback);
        task.updated_at = now.clone();

        if input.approved {
            if task.submitted_at.is_none()
                && task.delivery_resource_uuids.is_empty()
                && task.submission_description.is_none()
            {
                return Err(ServerError::conflict(
                    "APP_TRADE_TASK_APPROVAL_REQUIRES_SUBMISSION",
                    "trade marketplace task must be submitted before approval",
                ));
            }
            task.status = TradeMarketplaceTaskStatus::Completed;
            task.approved_at = Some(now);
        } else {
            task.status = TradeMarketplaceTaskStatus::Available;
            task.acceptor_uuid = None;
            task.acceptor_name = None;
            task.accepted_at = None;
            task.submitted_at = None;
            task.approved_at = None;
            task.accept_message = None;
            task.submission_description = None;
            task.delivery_resource_uuids.clear();
        }

        let response = task.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn cancel_task(&self, task_key: &str) -> ServerResult<TradeMarketplaceTaskRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let task = self.read_task_record_mut(&mut document, task_key)?;
        let is_publisher = task.publisher_uuid == actor.uuid;
        let is_acceptor = task.acceptor_uuid.as_deref() == Some(actor.uuid.as_str());

        if !is_publisher && !is_acceptor {
            return Err(ServerError::forbidden(
                "APP_TRADE_TASK_CANCEL_FORBIDDEN",
                "only the publisher or accepted worker can cancel this marketplace task",
            ));
        }

        if is_publisher {
            task.status = TradeMarketplaceTaskStatus::Cancelled;
        } else {
            task.status = TradeMarketplaceTaskStatus::Available;
            task.acceptor_uuid = None;
            task.acceptor_name = None;
            task.accepted_at = None;
            task.submitted_at = None;
            task.approved_at = None;
            task.accept_message = None;
            task.submission_description = None;
            task.delivery_resource_uuids.clear();
        }

        task.updated_at = now;
        let response = task.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }
}

fn seed_task(
    id: &str,
    uuid: &str,
    title: &str,
    description: &str,
    task_type: TradeMarketplaceTaskType,
    requirements: &[&str],
    budget: f64,
    deadline: &str,
    publisher_uuid: &str,
    publisher_name: &str,
    status: TradeMarketplaceTaskStatus,
    tags: &[&str],
    difficulty: TradeMarketplaceTaskDifficulty,
    estimated_duration: u32,
) -> TradeMarketplaceTaskRecord {
    TradeMarketplaceTaskRecord {
        id: id.to_string(),
        uuid: uuid.to_string(),
        title: title.to_string(),
        description: description.to_string(),
        task_type,
        requirements: requirements
            .iter()
            .map(|item| (*item).to_string())
            .collect(),
        budget,
        deadline: deadline.to_string(),
        publisher_uuid: publisher_uuid.to_string(),
        publisher_name: publisher_name.to_string(),
        status,
        acceptor_uuid: None,
        acceptor_name: None,
        accepted_at: None,
        submitted_at: None,
        approved_at: None,
        attachment_resource_uuids: Vec::new(),
        delivery_resource_uuids: Vec::new(),
        tags: tags.iter().map(|item| (*item).to_string()).collect(),
        difficulty,
        estimated_duration,
        accept_message: None,
        submission_description: None,
        approval_feedback: None,
        created_at: DEFAULT_SEED_TIMESTAMP.to_string(),
        updated_at: DEFAULT_SEED_TIMESTAMP.to_string(),
    }
}

fn map_trade_actor(profile: UserProfileRecord) -> TradeActor {
    let display_name = normalize_actor_name(&profile);
    TradeActor {
        uuid: profile.uuid,
        display_name,
    }
}

fn normalize_actor_name(profile: &UserProfileRecord) -> String {
    let nickname = profile.nickname.trim();
    if !nickname.is_empty() {
        return nickname.to_string();
    }

    let username = profile.username.trim();
    if !username.is_empty() {
        return username.to_string();
    }

    profile.user_id.clone()
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

fn normalize_page(page: Option<usize>) -> usize {
    page.filter(|page| *page > 0).unwrap_or(1)
}

fn normalize_page_size(page_size: Option<usize>) -> usize {
    page_size
        .filter(|page_size| *page_size > 0)
        .unwrap_or(DEFAULT_PAGE_SIZE)
        .min(MAX_PAGE_SIZE)
}

fn dedupe_strings(values: Vec<String>) -> Vec<String> {
    let mut deduped = Vec::new();
    for value in values {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            continue;
        }

        if !deduped.iter().any(|existing: &String| existing == trimmed) {
            deduped.push(trimmed.to_string());
        }
    }
    deduped
}

fn apply_task_query(
    tasks: Vec<TradeMarketplaceTaskRecord>,
    query: &TradeMarketplaceTaskListQuery,
) -> Vec<TradeMarketplaceTaskRecord> {
    let keyword = query
        .keyword
        .as_ref()
        .map(|value| value.trim().to_lowercase());
    let start_time = query
        .start_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));
    let end_time = query
        .end_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));

    tasks
        .into_iter()
        .filter(|task| {
            if let Some(status) = query.status {
                if task.status != status {
                    return false;
                }
            }

            if let Some(task_type) = query.task_type {
                if task.task_type != task_type {
                    return false;
                }
            }

            if let Some(difficulty) = query.difficulty {
                if task.difficulty != difficulty {
                    return false;
                }
            }

            if let Some(keyword) = keyword.as_ref() {
                let title = task.title.to_lowercase();
                let description = task.description.to_lowercase();
                let tags_match = task
                    .tags
                    .iter()
                    .any(|tag| tag.to_lowercase().contains(keyword));
                if !title.contains(keyword) && !description.contains(keyword) && !tags_match {
                    return false;
                }
            }

            if start_time.is_some() || end_time.is_some() {
                let created_at = parse_iso_millis(&task.created_at).unwrap_or_default();
                if let Some(start_time) = start_time {
                    if created_at < start_time {
                        return false;
                    }
                }
                if let Some(end_time) = end_time {
                    if created_at > end_time {
                        return false;
                    }
                }
            }

            true
        })
        .collect()
}

fn sort_tasks(
    tasks: &mut [TradeMarketplaceTaskRecord],
    sort_by: Option<&str>,
    sort_order: Option<&str>,
) {
    let descending = matches!(sort_order, Some(value) if value.eq_ignore_ascii_case("desc"));
    let sort_key = sort_by.unwrap_or("latest");

    tasks.sort_by(|left, right| {
        let ordering = match sort_key {
            "budget" => left
                .budget
                .partial_cmp(&right.budget)
                .unwrap_or(std::cmp::Ordering::Equal),
            "difficulty" => left.difficulty.cmp(&right.difficulty),
            _ => parse_iso_millis(&left.created_at).cmp(&parse_iso_millis(&right.created_at)),
        };

        let ordering = if descending {
            ordering.reverse()
        } else {
            ordering
        };

        if ordering == std::cmp::Ordering::Equal {
            left.uuid.cmp(&right.uuid)
        } else {
            ordering
        }
    });

    if sort_key == "latest" && !descending {
        tasks.reverse();
    }
}

fn parse_iso_millis(value: &str) -> Option<i128> {
    OffsetDateTime::parse(value, &Rfc3339)
        .ok()
        .map(|value| value.unix_timestamp_nanos() / 1_000_000)
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| DEFAULT_SEED_TIMESTAMP.to_string())
}
