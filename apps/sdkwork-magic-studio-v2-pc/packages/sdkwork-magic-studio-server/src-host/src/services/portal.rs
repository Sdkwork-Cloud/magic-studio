use std::cmp::Ordering;
use std::fs;
use std::sync::{Arc, Mutex, MutexGuard};

use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::identity::{IdentityService, UserProfileRecord};

use super::service_utils::{normalize_optional_text};
const PORTAL_SCHEMA_VERSION: &str = "magic-studio.portal.v1";
const DEFAULT_PAGE_SIZE: usize = 20;
const MAX_PAGE_SIZE: usize = 100;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PortalFeedContentType {
    Image,
    Video,
    Audio,
    Music,
    Voice,
    Short,
    Character,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PortalFeedContentTypeFilter {
    All,
    Image,
    Video,
    Audio,
    Music,
    Voice,
    Short,
    Character,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PortalDiscoverTab {
    Trending,
    Latest,
    Following,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PortalFeaturedStrategy {
    Hot,
    Top,
    Recommended,
    MostViewed,
    MostLiked,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortalFeedAuthorRecord {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    pub is_following: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortalFeedStatsRecord {
    pub views: i64,
    pub likes: i64,
    pub comments: i64,
    pub shares: i64,
    pub collects: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortalFeedRecord {
    pub id: String,
    pub title: String,
    pub content: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cover_url: Option<String>,
    pub content_type: PortalFeedContentType,
    pub tags: Vec<String>,
    pub author: PortalFeedAuthorRecord,
    pub stats: PortalFeedStatsRecord,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category_id: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub is_liked: bool,
    pub is_collected: bool,
}

#[derive(Debug, Clone)]
pub struct PortalFeedPage<T> {
    pub items: Vec<T>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct PortalFeedListQuery {
    pub keyword: Option<String>,
    pub content_type: Option<PortalFeedContentTypeFilter>,
    pub page: Option<usize>,
    #[serde(alias = "size", alias = "pageSize", alias = "limit")]
    pub page_size: Option<usize>,
    pub category_id: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct PortalFeaturedFeedQuery {
    #[serde(flatten)]
    pub list: PortalFeedListQuery,
    pub strategy: Option<PortalFeaturedStrategy>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct PortalDiscoverFeedQuery {
    #[serde(flatten)]
    pub list: PortalFeedListQuery,
    pub tab: Option<PortalDiscoverTab>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortalFeedCreateRequest {
    #[serde(default)]
    pub title: Option<String>,
    pub content: String,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub cover_url: Option<String>,
    #[serde(default)]
    pub category_id: Option<u64>,
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub source_url: Option<String>,
    #[serde(default)]
    pub content_type: Option<PortalFeedContentType>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PortalDocument {
    schema_version: String,
    authors: Vec<StoredPortalAuthor>,
    feeds: Vec<StoredPortalFeed>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredPortalAuthor {
    uuid: String,
    name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    avatar_url: Option<String>,
    #[serde(default)]
    follower_user_uuids: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredPortalFeed {
    uuid: String,
    author_uuid: String,
    title: String,
    content: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    summary: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    cover_url: Option<String>,
    content_type: PortalFeedContentType,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    category_id: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    source_url: Option<String>,
    view_count: i64,
    like_count: i64,
    comment_count: i64,
    share_count: i64,
    collect_count: i64,
    #[serde(default)]
    liked_user_uuids: Vec<String>,
    #[serde(default)]
    collected_user_uuids: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone)]
struct PortalActor {
    user_uuid: String,
    display_name: String,
    avatar_url: Option<String>,
}

pub trait PortalService: Send + Sync {
    fn create_feed(&self, input: PortalFeedCreateRequest) -> ServerResult<PortalFeedRecord>;
    fn list_featured_feeds(
        &self,
        query: PortalFeaturedFeedQuery,
    ) -> ServerResult<PortalFeedPage<PortalFeedRecord>>;
    fn list_discover_feeds(
        &self,
        query: PortalDiscoverFeedQuery,
    ) -> ServerResult<PortalFeedPage<PortalFeedRecord>>;
    fn read_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord>;
    fn like_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord>;
    fn unlike_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord>;
    fn collect_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord>;
    fn uncollect_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord>;
    fn share_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord>;
    fn delete_feed(&self, feed_key: &str) -> ServerResult<()>;
}

pub struct FileBackedPortalService {
    storage_paths: AppStoragePaths,
    identity_service: Arc<dyn IdentityService>,
    lock: Mutex<()>,
}

impl FileBackedPortalService {
    pub fn new(storage_paths: AppStoragePaths, identity_service: Arc<dyn IdentityService>) -> Self {
        Self {
            storage_paths,
            identity_service,
            lock: Mutex::new(()),
        }
    }

    fn default_document(&self) -> PortalDocument {
        PortalDocument {
            schema_version: PORTAL_SCHEMA_VERSION.to_string(),
            authors: seed_portal_authors(),
            feeds: seed_portal_feeds(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<PortalDocument> {
        let path = self.storage_paths.portal_registry_file();
        match fs::read_to_string(path) {
            Ok(contents) => {
                let mut document =
                    serde_json::from_str::<PortalDocument>(&contents).map_err(|error| {
                        ServerError::internal(format!(
                                "failed to parse portal registry {}: {error}",
                                path.display()
                            ),
                        )
                    })?;
                normalize_document(&mut document);
                Ok(document)
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                Ok(self.default_document())
            }
            Err(error) => Err(ServerError::internal(format!("failed to read portal registry {}: {error}", path.display()),
            )),
        }
    }

    fn persist_to_disk(&self, document: &PortalDocument) -> ServerResult<()> {
        let parent = self
            .storage_paths
            .portal_registry_file()
            .parent()
            .ok_or_else(|| {
                ServerError::internal("an internal error occurred")
            })?;

        fs::create_dir_all(parent).map_err(|error| {
            ServerError::internal(format!(
                    "failed to create portal registry directory {}: {error}",
                    parent.display()
                ),
            )
        })?;

        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(format!("failed to serialize portal registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.portal_registry_file(), contents).map_err(|error| {
            ServerError::internal(format!(
                    "failed to write portal registry {}: {error}",
                    self.storage_paths.portal_registry_file().display()
                ),
            )
        })
    }

    fn lock_document(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("portal registry lock is poisoned")
        })
    }

    fn current_actor(&self) -> ServerResult<PortalActor> {
        let profile = self.identity_service.read_user_profile()?;
        let display_name = derive_display_name(&profile);
        let user_uuid = profile.uuid.clone();
        let avatar_url = profile.avatar_url.clone().or(profile.avatar.clone());
        Ok(PortalActor {
            user_uuid,
            display_name,
            avatar_url,
        })
    }

    fn ensure_current_author(
        &self,
        document: &mut PortalDocument,
        actor: &PortalActor,
        now_string: &str,
    ) -> String {
        if let Some(index) = document
            .authors
            .iter()
            .position(|author| author.uuid == actor.user_uuid)
        {
            let author = &mut document.authors[index];
            author.name = actor.display_name.clone();
            author.avatar_url = actor.avatar_url.clone();
            author.updated_at = now_string.to_string();
            return author.uuid.clone();
        }

        document.authors.push(StoredPortalAuthor {
            uuid: actor.user_uuid.clone(),
            name: actor.display_name.clone(),
            avatar_url: actor.avatar_url.clone(),
            follower_user_uuids: Vec::new(),
            created_at: now_string.to_string(),
            updated_at: now_string.to_string(),
        });
        actor.user_uuid.clone()
    }

    fn find_feed_index(&self, document: &PortalDocument, feed_key: &str) -> ServerResult<usize> {
        let trimmed = feed_key.trim();
        document
            .feeds
            .iter()
            .position(|feed| feed.uuid == trimmed)
            .ok_or_else(|| {
                ServerError::not_found(format!("portal feed {trimmed} was not found"),
                )
            })
    }

    fn map_feed(
        &self,
        document: &PortalDocument,
        actor_uuid: &str,
        feed: &StoredPortalFeed,
    ) -> PortalFeedRecord {
        let author = document
            .authors
            .iter()
            .find(|author| author.uuid == feed.author_uuid)
            .cloned()
            .unwrap_or_else(|| fallback_author(feed.author_uuid.clone()));

        PortalFeedRecord {
            id: feed.uuid.clone(),
            title: feed.title.clone(),
            content: feed.content.clone(),
            summary: feed.summary.clone(),
            cover_url: feed.cover_url.clone(),
            content_type: feed.content_type,
            tags: feed.tags.clone(),
            author: PortalFeedAuthorRecord {
                id: author.uuid.clone(),
                name: author.name,
                avatar_url: author.avatar_url,
                is_following: author
                    .follower_user_uuids
                    .iter()
                    .any(|user_uuid| user_uuid == actor_uuid),
            },
            stats: PortalFeedStatsRecord {
                views: feed.view_count.max(0),
                likes: feed.like_count.max(0),
                comments: feed.comment_count.max(0),
                shares: feed.share_count.max(0),
                collects: feed.collect_count.max(0),
            },
            category_id: feed.category_id,
            source: feed.source.clone(),
            source_url: feed.source_url.clone(),
            created_at: feed.created_at.clone(),
            updated_at: feed.updated_at.clone(),
            is_liked: feed
                .liked_user_uuids
                .iter()
                .any(|user_uuid| user_uuid == actor_uuid),
            is_collected: feed
                .collected_user_uuids
                .iter()
                .any(|user_uuid| user_uuid == actor_uuid),
        }
    }
}

impl PortalService for FileBackedPortalService {
    fn create_feed(&self, input: PortalFeedCreateRequest) -> ServerResult<PortalFeedRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = OffsetDateTime::now_utc();
        let now_string = now_as_string(now);
        let author_uuid = self.ensure_current_author(&mut document, &actor, &now_string);

        let content = require_non_empty_text(
            input.content,
            "APP_PORTAL_FEED_CONTENT_REQUIRED",
            "content is required to publish a portal feed",
        )?;
        let title = normalize_optional_text(input.title)
            .unwrap_or_else(|| derive_title_from_content(&content));
        let summary =
            normalize_optional_text(input.summary).or_else(|| Some(truncate_text(&content, 160)));
        let cover_url = normalize_optional_text(input.cover_url);
        let source =
            normalize_optional_text(input.source).or_else(|| Some("magic-studio-v2".to_string()));
        let source_url = normalize_optional_text(input.source_url);
        let tags = normalize_tags(input.tags.unwrap_or_default());
        let feed = StoredPortalFeed {
            uuid: generate_key("portal-feed"),
            author_uuid,
            title,
            content,
            summary,
            cover_url,
            content_type: input.content_type.unwrap_or(PortalFeedContentType::Video),
            tags,
            category_id: input.category_id,
            source,
            source_url,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            collect_count: 0,
            liked_user_uuids: Vec::new(),
            collected_user_uuids: Vec::new(),
            created_at: now_string.clone(),
            updated_at: now_string,
        };

        document.feeds.push(feed.clone());
        sort_document_feeds(&mut document);
        self.persist_to_disk(&document)?;
        Ok(self.map_feed(&document, &actor.user_uuid, &feed))
    }

    fn list_featured_feeds(
        &self,
        query: PortalFeaturedFeedQuery,
    ) -> ServerResult<PortalFeedPage<PortalFeedRecord>> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = now_as_string(OffsetDateTime::now_utc());
        let changed = ensure_portal_personalization(&mut document, &actor, &now);

        let page = normalize_page(query.list.page);
        let page_size = normalize_page_size(query.list.page_size);
        let keyword = normalize_optional_text(query.list.keyword.clone());
        let strategy = query.strategy.unwrap_or(PortalFeaturedStrategy::Hot);

        let mut items = document
            .feeds
            .iter()
            .filter(|feed| feed_matches_query(feed, &document, &query.list, keyword.as_deref()))
            .cloned()
            .collect::<Vec<_>>();

        items.sort_by(|left, right| {
            compare_featured_feeds(
                strategy,
                &document,
                &actor.user_uuid,
                keyword.as_deref(),
                left,
                right,
            )
        });

        let total = items.len();
        let start = (page - 1) * page_size;
        let page_items = items
            .into_iter()
            .skip(start)
            .take(page_size)
            .map(|feed| self.map_feed(&document, &actor.user_uuid, &feed))
            .collect::<Vec<_>>();

        if changed {
            self.persist_to_disk(&document)?;
        }

        Ok(PortalFeedPage {
            items: page_items,
            page,
            page_size,
            total,
        })
    }

    fn list_discover_feeds(
        &self,
        query: PortalDiscoverFeedQuery,
    ) -> ServerResult<PortalFeedPage<PortalFeedRecord>> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = now_as_string(OffsetDateTime::now_utc());
        let changed = ensure_portal_personalization(&mut document, &actor, &now);

        let page = normalize_page(query.list.page);
        let page_size = normalize_page_size(query.list.page_size);
        let keyword = normalize_optional_text(query.list.keyword.clone());
        let tab = query.tab.unwrap_or(PortalDiscoverTab::Trending);

        let mut items = document
            .feeds
            .iter()
            .filter(|feed| feed_matches_query(feed, &document, &query.list, keyword.as_deref()))
            .filter(|feed| match tab {
                PortalDiscoverTab::Following => document
                    .authors
                    .iter()
                    .find(|author| author.uuid == feed.author_uuid)
                    .map(|author| {
                        author
                            .follower_user_uuids
                            .iter()
                            .any(|user_uuid| user_uuid == &actor.user_uuid)
                    })
                    .unwrap_or(false),
                PortalDiscoverTab::Trending | PortalDiscoverTab::Latest => true,
            })
            .cloned()
            .collect::<Vec<_>>();

        items.sort_by(|left, right| {
            compare_discover_feeds(
                tab,
                &document,
                &actor.user_uuid,
                keyword.as_deref(),
                left,
                right,
            )
        });

        let total = items.len();
        let start = (page - 1) * page_size;
        let page_items = items
            .into_iter()
            .skip(start)
            .take(page_size)
            .map(|feed| self.map_feed(&document, &actor.user_uuid, &feed))
            .collect::<Vec<_>>();

        if changed {
            self.persist_to_disk(&document)?;
        }

        Ok(PortalFeedPage {
            items: page_items,
            page,
            page_size,
            total,
        })
    }

    fn read_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = now_as_string(OffsetDateTime::now_utc());
        let changed = ensure_portal_personalization(&mut document, &actor, &now);
        let index = self.find_feed_index(&document, feed_key)?;
        let item = self.map_feed(&document, &actor.user_uuid, &document.feeds[index]);
        if changed {
            self.persist_to_disk(&document)?;
        }
        Ok(item)
    }

    fn like_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord> {
        self.update_feed_interaction(feed_key, |feed, actor_uuid, now_string| {
            if !feed
                .liked_user_uuids
                .iter()
                .any(|user_uuid| user_uuid == actor_uuid)
            {
                feed.liked_user_uuids.push(actor_uuid.to_string());
                feed.like_count += 1;
                feed.updated_at = now_string.to_string();
            }
        })
    }

    fn unlike_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord> {
        self.update_feed_interaction(feed_key, |feed, actor_uuid, now_string| {
            let original_len = feed.liked_user_uuids.len();
            feed.liked_user_uuids
                .retain(|user_uuid| user_uuid != actor_uuid);
            if feed.liked_user_uuids.len() != original_len {
                feed.like_count = feed.like_count.saturating_sub(1);
                feed.updated_at = now_string.to_string();
            }
        })
    }

    fn collect_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord> {
        self.update_feed_interaction(feed_key, |feed, actor_uuid, now_string| {
            if !feed
                .collected_user_uuids
                .iter()
                .any(|user_uuid| user_uuid == actor_uuid)
            {
                feed.collected_user_uuids.push(actor_uuid.to_string());
                feed.collect_count += 1;
                feed.updated_at = now_string.to_string();
            }
        })
    }

    fn uncollect_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord> {
        self.update_feed_interaction(feed_key, |feed, actor_uuid, now_string| {
            let original_len = feed.collected_user_uuids.len();
            feed.collected_user_uuids
                .retain(|user_uuid| user_uuid != actor_uuid);
            if feed.collected_user_uuids.len() != original_len {
                feed.collect_count = feed.collect_count.saturating_sub(1);
                feed.updated_at = now_string.to_string();
            }
        })
    }

    fn share_feed(&self, feed_key: &str) -> ServerResult<PortalFeedRecord> {
        self.update_feed_interaction(feed_key, |feed, _actor_uuid, now_string| {
            feed.share_count += 1;
            feed.updated_at = now_string.to_string();
        })
    }

    fn delete_feed(&self, feed_key: &str) -> ServerResult<()> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let index = self.find_feed_index(&document, feed_key)?;
        let feed = &document.feeds[index];

        if feed.author_uuid != actor.user_uuid {
            return Err(ServerError::forbidden("access was forbidden"));
        }

        document.feeds.remove(index);
        self.persist_to_disk(&document)?;
        Ok(())
    }
}

impl FileBackedPortalService {
    fn update_feed_interaction<F>(
        &self,
        feed_key: &str,
        mutator: F,
    ) -> ServerResult<PortalFeedRecord>
    where
        F: FnOnce(&mut StoredPortalFeed, &str, &str),
    {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let index = self.find_feed_index(&document, feed_key)?;
        let now_string = now_as_string(OffsetDateTime::now_utc());
        let feed = &mut document.feeds[index];
        mutator(feed, &actor.user_uuid, &now_string);
        let response = self.map_feed(&document, &actor.user_uuid, &document.feeds[index]);
        self.persist_to_disk(&document)?;
        Ok(response)
    }
}

fn normalize_document(document: &mut PortalDocument) {
    if document.schema_version.trim().is_empty() {
        document.schema_version = PORTAL_SCHEMA_VERSION.to_string();
    }

    if document.authors.is_empty() {
        document.authors = seed_portal_authors();
    }

    if document.feeds.is_empty() {
        document.feeds = seed_portal_feeds();
    }

    sort_document_feeds(document);
}

fn sort_document_feeds(document: &mut PortalDocument) {
    document.feeds.sort_by(sort_feeds_by_created_desc);
}

fn seed_portal_authors() -> Vec<StoredPortalAuthor> {
    vec![
        seeded_author(
            "portal-author-nova",
            "Nova Scene Lab",
            Some("https://picsum.photos/seed/magic-studio-author-nova/128/128"),
            7,
        ),
        seeded_author(
            "portal-author-cinema",
            "Cinematic Forge",
            Some("https://picsum.photos/seed/magic-studio-author-cinema/128/128"),
            6,
        ),
        seeded_author(
            "portal-author-audio",
            "Audio Atlas",
            Some("https://picsum.photos/seed/magic-studio-author-audio/128/128"),
            5,
        ),
        seeded_author(
            "portal-author-character",
            "Character Signal",
            Some("https://picsum.photos/seed/magic-studio-author-character/128/128"),
            4,
        ),
    ]
}

fn seed_portal_feeds() -> Vec<StoredPortalFeed> {
    vec![
        seeded_feed(
            "portal-feed-001",
            "portal-author-cinema",
            "Neon Rooftop Escape",
            "A fast-cut rooftop chase with chrome reflections, rain haze, and a 16:9 night palette.",
            Some("A kinetic cyberpunk rooftop scene designed for trailer-style previews."),
            Some("https://picsum.photos/seed/magic-studio-portal-feed-1/1280/720"),
            PortalFeedContentType::Video,
            &["16:9", "model:Magic Cinema", "cyberpunk", "night"],
            Some(101),
            Some("magic-studio-seed"),
            Some("https://magic.studio/local/portal/neon-rooftop-escape"),
            18_420,
            1_482,
            128,
            234,
            320,
            4,
        ),
        seeded_feed(
            "portal-feed-002",
            "portal-author-nova",
            "Editorial Portrait Set",
            "Studio-grade portrait frames with high-contrast key lighting and polished fashion styling.",
            Some("A premium portrait pack tuned for discovery and creator showcases."),
            Some("https://picsum.photos/seed/magic-studio-portal-feed-2/1024/1365"),
            PortalFeedContentType::Image,
            &["4:5", "model:Portrait Pro", "editorial", "fashion"],
            Some(102),
            Some("magic-studio-seed"),
            Some("https://magic.studio/local/portal/editorial-portrait-set"),
            12_860,
            1_144,
            96,
            142,
            284,
            3,
        ),
        seeded_feed(
            "portal-feed-003",
            "portal-author-audio",
            "Ambient Pulse Bed",
            "Layered ambient pulses and glass percussion built for motion reels and teaser soundtracks.",
            Some("A modern music bed with broad reuse across portal showcases."),
            Some("https://picsum.photos/seed/magic-studio-portal-feed-3/1280/720"),
            PortalFeedContentType::Music,
            &["16:9", "model:Audio Atlas", "ambient", "teaser"],
            Some(103),
            Some("magic-studio-seed"),
            Some("https://magic.studio/local/portal/ambient-pulse-bed"),
            8_940,
            812,
            54,
            96,
            188,
            2,
        ),
        seeded_feed(
            "portal-feed-004",
            "portal-author-character",
            "Hero Character Turntable",
            "A stylized protagonist reveal with costume detail sheets and cinematic angle studies.",
            Some("Character-focused feed entry for showcase and prompt inspiration."),
            Some("https://picsum.photos/seed/magic-studio-portal-feed-4/1280/720"),
            PortalFeedContentType::Character,
            &["16:9", "model:Character Studio", "hero", "turntable"],
            Some(104),
            Some("magic-studio-seed"),
            Some("https://magic.studio/local/portal/hero-character-turntable"),
            6_520,
            690,
            41,
            73,
            144,
            1,
        ),
        seeded_feed(
            "portal-feed-005",
            "portal-author-cinema",
            "Product Macro Reveal",
            "High-speed product reveal frames with sharp reflections, clean motion arcs, and premium finish.",
            Some("A polished featured feed item optimized for product storytelling."),
            Some("https://picsum.photos/seed/magic-studio-portal-feed-5/1280/720"),
            PortalFeedContentType::Video,
            &["16:9", "model:Magic Cinema", "product", "macro"],
            Some(105),
            Some("magic-studio-seed"),
            Some("https://magic.studio/local/portal/product-macro-reveal"),
            10_730,
            968,
            77,
            118,
            226,
            2,
        ),
    ]
}

fn seeded_author(
    uuid: &str,
    name: &str,
    avatar_url: Option<&str>,
    days_ago: i64,
) -> StoredPortalAuthor {
    let timestamp = now_as_string(
        OffsetDateTime::now_utc()
            .checked_sub(Duration::days(days_ago))
            .unwrap_or_else(OffsetDateTime::now_utc),
    );
    StoredPortalAuthor {
        uuid: uuid.to_string(),
        name: name.to_string(),
        avatar_url: avatar_url.map(|value| value.to_string()),
        follower_user_uuids: Vec::new(),
        created_at: timestamp.clone(),
        updated_at: timestamp,
    }
}

#[allow(clippy::too_many_arguments)]
fn seeded_feed(
    uuid: &str,
    author_uuid: &str,
    title: &str,
    content: &str,
    summary: Option<&str>,
    cover_url: Option<&str>,
    content_type: PortalFeedContentType,
    tags: &[&str],
    category_id: Option<u64>,
    source: Option<&str>,
    source_url: Option<&str>,
    view_count: i64,
    like_count: i64,
    comment_count: i64,
    share_count: i64,
    collect_count: i64,
    days_ago: i64,
) -> StoredPortalFeed {
    let timestamp = now_as_string(
        OffsetDateTime::now_utc()
            .checked_sub(Duration::days(days_ago))
            .unwrap_or_else(OffsetDateTime::now_utc),
    );
    StoredPortalFeed {
        uuid: uuid.to_string(),
        author_uuid: author_uuid.to_string(),
        title: title.to_string(),
        content: content.to_string(),
        summary: summary.map(|value| value.to_string()),
        cover_url: cover_url.map(|value| value.to_string()),
        content_type,
        tags: tags.iter().map(|tag| (*tag).to_string()).collect(),
        category_id,
        source: source.map(|value| value.to_string()),
        source_url: source_url.map(|value| value.to_string()),
        view_count,
        like_count,
        comment_count,
        share_count,
        collect_count,
        liked_user_uuids: Vec::new(),
        collected_user_uuids: Vec::new(),
        created_at: timestamp.clone(),
        updated_at: timestamp,
    }
}

fn fallback_author(uuid: String) -> StoredPortalAuthor {
    let now = now_as_string(OffsetDateTime::now_utc());
    StoredPortalAuthor {
        uuid,
        name: "Creator".to_string(),
        avatar_url: None,
        follower_user_uuids: Vec::new(),
        created_at: now.clone(),
        updated_at: now,
    }
}

fn derive_display_name(profile: &UserProfileRecord) -> String {
    normalize_optional_text(Some(profile.nickname.clone()))
        .or_else(|| normalize_optional_text(Some(profile.username.clone())))
        .unwrap_or_else(|| "Creator".to_string())
}

fn ensure_portal_personalization(
    document: &mut PortalDocument,
    actor: &PortalActor,
    now_string: &str,
) -> bool {
    if document.authors.iter().any(|author| {
        author.uuid != actor.user_uuid
            && author
                .follower_user_uuids
                .iter()
                .any(|user_uuid| user_uuid == &actor.user_uuid)
    }) {
        return false;
    }

    let mut changed = false;
    for author in document
        .authors
        .iter_mut()
        .filter(|author| author.uuid != actor.user_uuid)
        .take(2)
    {
        author.follower_user_uuids.push(actor.user_uuid.clone());
        author.updated_at = now_string.to_string();
        changed = true;
    }

    changed
}

fn feed_matches_query(
    feed: &StoredPortalFeed,
    document: &PortalDocument,
    query: &PortalFeedListQuery,
    keyword: Option<&str>,
) -> bool {
    if let Some(category_id) = query.category_id {
        if feed.category_id != Some(category_id) {
            return false;
        }
    }

    if let Some(content_type) = query.content_type {
        if !content_type_matches(content_type, feed.content_type) {
            return false;
        }
    }

    if let Some(keyword) = keyword {
        return feed_matches_keyword(feed, document, keyword);
    }

    true
}

fn feed_matches_keyword(feed: &StoredPortalFeed, document: &PortalDocument, keyword: &str) -> bool {
    let author_name = document
        .authors
        .iter()
        .find(|author| author.uuid == feed.author_uuid)
        .map(|author| author.name.as_str())
        .unwrap_or("");
    let keyword = keyword.trim().to_lowercase();

    [
        feed.title.as_str(),
        feed.content.as_str(),
        feed.summary.as_deref().unwrap_or(""),
        author_name,
    ]
    .iter()
    .any(|value| value.to_lowercase().contains(&keyword))
        || feed
            .tags
            .iter()
            .any(|tag| tag.to_lowercase().contains(&keyword))
}

fn content_type_matches(
    filter: PortalFeedContentTypeFilter,
    content_type: PortalFeedContentType,
) -> bool {
    match filter {
        PortalFeedContentTypeFilter::All => true,
        PortalFeedContentTypeFilter::Image => content_type == PortalFeedContentType::Image,
        PortalFeedContentTypeFilter::Video => content_type == PortalFeedContentType::Video,
        PortalFeedContentTypeFilter::Audio => {
            matches!(
                content_type,
                PortalFeedContentType::Audio | PortalFeedContentType::Voice
            )
        }
        PortalFeedContentTypeFilter::Music => content_type == PortalFeedContentType::Music,
        PortalFeedContentTypeFilter::Voice => content_type == PortalFeedContentType::Voice,
        PortalFeedContentTypeFilter::Short => content_type == PortalFeedContentType::Short,
        PortalFeedContentTypeFilter::Character => content_type == PortalFeedContentType::Character,
    }
}

fn compare_featured_feeds(
    strategy: PortalFeaturedStrategy,
    document: &PortalDocument,
    actor_uuid: &str,
    keyword: Option<&str>,
    left: &StoredPortalFeed,
    right: &StoredPortalFeed,
) -> Ordering {
    featured_score(strategy, document, actor_uuid, keyword, right)
        .cmp(&featured_score(
            strategy, document, actor_uuid, keyword, left,
        ))
        .then_with(|| sort_feeds_by_created_desc(left, right))
}

fn featured_score(
    strategy: PortalFeaturedStrategy,
    document: &PortalDocument,
    actor_uuid: &str,
    keyword: Option<&str>,
    feed: &StoredPortalFeed,
) -> i64 {
    let keyword_bonus = keyword
        .map(|query| search_score(feed, document, query) * 1_000)
        .unwrap_or(0);
    let following_bonus = document
        .authors
        .iter()
        .find(|author| author.uuid == feed.author_uuid)
        .map(|author| {
            if author
                .follower_user_uuids
                .iter()
                .any(|user_uuid| user_uuid == actor_uuid)
            {
                25_000
            } else {
                0
            }
        })
        .unwrap_or(0);

    keyword_bonus
        + following_bonus
        + match strategy {
            PortalFeaturedStrategy::Hot => hot_score(feed),
            PortalFeaturedStrategy::Top => top_score(feed),
            PortalFeaturedStrategy::Recommended => recommended_score(feed),
            PortalFeaturedStrategy::MostViewed => feed.view_count,
            PortalFeaturedStrategy::MostLiked => feed.like_count * 10,
        }
}

fn compare_discover_feeds(
    tab: PortalDiscoverTab,
    document: &PortalDocument,
    _actor_uuid: &str,
    keyword: Option<&str>,
    left: &StoredPortalFeed,
    right: &StoredPortalFeed,
) -> Ordering {
    if let Some(keyword) = keyword {
        return search_score(right, document, keyword)
            .cmp(&search_score(left, document, keyword))
            .then_with(|| sort_feeds_by_created_desc(left, right));
    }

    match tab {
        PortalDiscoverTab::Latest | PortalDiscoverTab::Following => {
            sort_feeds_by_created_desc(left, right)
        }
        PortalDiscoverTab::Trending => hot_score(right)
            .cmp(&hot_score(left))
            .then_with(|| sort_feeds_by_created_desc(left, right)),
    }
}

fn hot_score(feed: &StoredPortalFeed) -> i64 {
    feed.view_count / 8
        + feed.like_count * 18
        + feed.comment_count * 20
        + feed.share_count * 24
        + feed.collect_count * 16
}

fn top_score(feed: &StoredPortalFeed) -> i64 {
    hot_score(feed) + recency_bonus(feed)
}

fn recommended_score(feed: &StoredPortalFeed) -> i64 {
    hot_score(feed) + feed.collect_count * 8 + recency_bonus(feed)
}

fn recency_bonus(feed: &StoredPortalFeed) -> i64 {
    parse_timestamp(&feed.created_at)
        .map(|timestamp| timestamp.unix_timestamp() / 600)
        .unwrap_or(0)
}

fn search_score(feed: &StoredPortalFeed, document: &PortalDocument, keyword: &str) -> i64 {
    let lower_keyword = keyword.trim().to_lowercase();
    let author_name = document
        .authors
        .iter()
        .find(|author| author.uuid == feed.author_uuid)
        .map(|author| author.name.to_lowercase())
        .unwrap_or_default();
    let title = feed.title.to_lowercase();
    let content = feed.content.to_lowercase();
    let summary = feed.summary.clone().unwrap_or_default().to_lowercase();

    let mut score = 0;
    if title.contains(&lower_keyword) {
        score += 50;
    }
    if summary.contains(&lower_keyword) {
        score += 30;
    }
    if content.contains(&lower_keyword) {
        score += 20;
    }
    if author_name.contains(&lower_keyword) {
        score += 18;
    }
    score
        + feed
            .tags
            .iter()
            .filter(|tag| tag.to_lowercase().contains(&lower_keyword))
            .count() as i64
            * 12
}

fn sort_feeds_by_created_desc(left: &StoredPortalFeed, right: &StoredPortalFeed) -> Ordering {
    parse_timestamp(&right.created_at)
        .cmp(&parse_timestamp(&left.created_at))
        .then_with(|| right.uuid.cmp(&left.uuid))
}

fn require_non_empty_text(value: String, code: &str, message: &str) -> ServerResult<String> {
    normalize_optional_text(Some(value)).ok_or_else(|| ServerError::bad_request(message))
}

fn truncate_text(value: &str, max_chars: usize) -> String {
    let trimmed = value.trim();
    if trimmed.chars().count() <= max_chars {
        return trimmed.to_string();
    }
    trimmed
        .chars()
        .take(max_chars)
        .collect::<String>()
        .trim()
        .to_string()
}

fn derive_title_from_content(content: &str) -> String {
    let title = truncate_text(content, 36);
    if title.is_empty() {
        "Untitled Feed".to_string()
    } else {
        title
    }
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut items = tags
        .into_iter()
        .filter_map(|tag| normalize_optional_text(Some(tag)))
        .collect::<Vec<_>>();
    items.sort();
    items.dedup();
    items
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

fn parse_timestamp(value: &str) -> Option<OffsetDateTime> {
    OffsetDateTime::parse(value, &Rfc3339).ok()
}

fn now_as_string(now: OffsetDateTime) -> String {
    now.format(&Rfc3339)
        .unwrap_or_else(|_| now.unix_timestamp().to_string())
}

fn generate_key(prefix: &str) -> String {
    use rand::Rng;

    let timestamp = OffsetDateTime::now_utc().unix_timestamp_nanos();
    let random = rand::thread_rng().gen_range(1000_u32..9999_u32);
    format!("{prefix}-{timestamp}-{random}")
}
