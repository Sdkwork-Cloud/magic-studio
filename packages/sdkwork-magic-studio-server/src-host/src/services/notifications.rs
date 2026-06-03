use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};
use crate::services::app_storage::AppStoragePaths;

static NOTIFICATION_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NotificationType {
    Info,
    Success,
    Warning,
    Error,
}

impl Default for NotificationType {
    fn default() -> Self {
        Self::Info
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationRecord {
    pub id: String,
    pub uuid: String,
    pub title: String,
    pub message: String,
    #[serde(rename = "type")]
    pub notification_type: NotificationType,
    pub is_read: bool,
    pub action_url: Option<String>,
    pub action_label: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationCreateInput {
    pub title: String,
    pub message: String,
    #[serde(default, rename = "type")]
    pub notification_type: Option<NotificationType>,
    pub action_url: Option<String>,
    pub action_label: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationUnreadCount {
    pub unread_count: usize,
}

pub trait NotificationService: Send + Sync {
    fn list_notifications(&self) -> ServerResult<Vec<NotificationRecord>>;
    fn create_notification(
        &self,
        input: NotificationCreateInput,
    ) -> ServerResult<NotificationRecord>;
    fn mark_notification_as_read(&self, notification_id: &str) -> ServerResult<bool>;
    fn mark_all_notifications_as_read(&self) -> ServerResult<bool>;
    fn unread_count(&self) -> ServerResult<NotificationUnreadCount>;
    fn delete_notifications(&self, notification_ids: &[String]) -> ServerResult<bool>;
}

pub struct FileBackedNotificationService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedNotificationService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn load_from_disk(&self) -> ServerResult<Vec<NotificationRecord>> {
        let path = self.storage_paths.notifications_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_NOTIFICATIONS_READ_FAILED",
                    format!(
                        "failed to read notifications from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        serde_json::from_str::<Vec<NotificationRecord>>(&contents).map_err(|error| {
            ServerError::internal(
                "APP_NOTIFICATIONS_PARSE_FAILED",
                format!(
                    "failed to parse notifications document {}: {error}",
                    path.display()
                ),
            )
        })
    }

    fn persist_to_disk(&self, items: &[NotificationRecord]) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_vec_pretty(items).map_err(|error| {
            ServerError::internal(
                "APP_NOTIFICATIONS_SERIALIZE_FAILED",
                format!("failed to serialize notifications: {error}"),
            )
        })?;

        fs::write(self.storage_paths.notifications_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_NOTIFICATIONS_WRITE_FAILED",
                format!(
                    "failed to write notifications to {}: {error}",
                    self.storage_paths.notifications_file().display()
                ),
            )
        })
    }
}

impl NotificationService for FileBackedNotificationService {
    fn list_notifications(&self) -> ServerResult<Vec<NotificationRecord>> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_NOTIFICATIONS_LOCK_FAILED",
                "failed to acquire notifications lock",
            )
        })?;
        let mut items = self.load_from_disk()?;
        items.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        Ok(items)
    }

    fn create_notification(
        &self,
        input: NotificationCreateInput,
    ) -> ServerResult<NotificationRecord> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_NOTIFICATIONS_LOCK_FAILED",
                "failed to acquire notifications lock",
            )
        })?;

        let title = require_non_empty_text(&input.title, "NOTIFICATION_TITLE_EMPTY", "title")?;
        let message =
            require_non_empty_text(&input.message, "NOTIFICATION_MESSAGE_EMPTY", "message")?;
        let action_url = normalize_optional_text(input.action_url);
        let action_label = normalize_optional_text(input.action_label);
        let mut items = self.load_from_disk()?;
        let timestamp = current_timestamp();
        let id = next_notification_id();

        let record = NotificationRecord {
            uuid: id.clone(),
            id,
            title,
            message,
            notification_type: input.notification_type.unwrap_or_default(),
            is_read: false,
            action_url,
            action_label,
            created_at: timestamp.clone(),
            updated_at: timestamp,
        };

        items.insert(0, record.clone());
        self.persist_to_disk(&items)?;
        Ok(record)
    }

    fn mark_notification_as_read(&self, notification_id: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_NOTIFICATIONS_LOCK_FAILED",
                "failed to acquire notifications lock",
            )
        })?;

        let notification_id =
            require_non_empty_text(notification_id, "NOTIFICATION_ID_EMPTY", "notificationId")?;
        let mut items = self.load_from_disk()?;
        let Some(notification) = items.iter_mut().find(|item| item.id == notification_id) else {
            return Err(ServerError::not_found(
                "NOTIFICATION_NOT_FOUND",
                format!("notification {notification_id} was not found"),
            ));
        };

        notification.is_read = true;
        notification.updated_at = current_timestamp();
        self.persist_to_disk(&items)?;
        Ok(true)
    }

    fn mark_all_notifications_as_read(&self) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_NOTIFICATIONS_LOCK_FAILED",
                "failed to acquire notifications lock",
            )
        })?;

        let mut items = self.load_from_disk()?;
        let timestamp = current_timestamp();
        for item in &mut items {
            item.is_read = true;
            item.updated_at = timestamp.clone();
        }
        self.persist_to_disk(&items)?;
        Ok(true)
    }

    fn unread_count(&self) -> ServerResult<NotificationUnreadCount> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_NOTIFICATIONS_LOCK_FAILED",
                "failed to acquire notifications lock",
            )
        })?;

        let items = self.load_from_disk()?;
        Ok(NotificationUnreadCount {
            unread_count: items.iter().filter(|item| !item.is_read).count(),
        })
    }

    fn delete_notifications(&self, notification_ids: &[String]) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_NOTIFICATIONS_LOCK_FAILED",
                "failed to acquire notifications lock",
            )
        })?;

        if notification_ids.is_empty() {
            return Err(ServerError::bad_request(
                "NOTIFICATION_IDS_EMPTY",
                "notificationIds must not be empty",
            ));
        }

        let normalized_ids: Vec<String> = notification_ids
            .iter()
            .map(|value| {
                require_non_empty_text(
                    value,
                    "NOTIFICATION_ID_EMPTY",
                    "notificationIds contains an empty id",
                )
            })
            .collect::<ServerResult<Vec<_>>>()?;

        let mut items = self.load_from_disk()?;
        items.retain(|item| !normalized_ids.iter().any(|id| id == &item.id));
        self.persist_to_disk(&items)?;
        Ok(true)
    }
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|entry| {
        let trimmed = entry.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
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

fn next_notification_id() -> String {
    let counter = NOTIFICATION_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("notification-{counter}")
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}
