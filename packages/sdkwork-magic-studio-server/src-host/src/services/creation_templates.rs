use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};

use serde::de::Deserializer;
use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::creation::{
    CreateCreationSessionRequest, CreationService, CreationSessionAttachmentRecord,
    CreationSessionRecord,
};
use super::creation_presets::CreationPresetService;
use super::creation_support::{
    current_time_millis, merge_creation_session_attachments,
    normalize_creation_session_attachments, normalize_creation_target,
    normalize_creation_template_step_id, normalize_optional_text, require_non_empty_text,
    to_client_entity_uuid,
};

const CREATION_TEMPLATES_SCHEMA_VERSION: &str = "magic-studio.creation-templates.v1";
const CREATION_TEMPLATE_SOURCE: &str = "creation-template";
const DEFAULT_CREATION_TEMPLATE_PAGE_SIZE: usize = 50;
const MAX_CREATION_TEMPLATE_PAGE_SIZE: usize = 200;

static CREATION_TEMPLATE_COUNTER: AtomicU64 = AtomicU64::new(1);
static CREATION_TEMPLATE_STEP_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationTemplateStepRecord {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub target: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preset_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gen_mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    #[serde(default)]
    pub attachments: Vec<CreationSessionAttachmentRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationTemplateRecord {
    pub id: String,
    pub uuid: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub primary_target: String,
    pub workspace_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    pub default_step_id: String,
    #[serde(default)]
    pub steps: Vec<CreationTemplateStepRecord>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub is_favorite: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone)]
pub struct CreationTemplateListResult {
    pub items: Vec<CreationTemplateRecord>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreationTemplateListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub keyword: Option<String>,
    pub primary_target: Option<String>,
    pub workspace_id: Option<String>,
    pub project_id: Option<String>,
    pub favorite_only: Option<bool>,
    pub category: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreationTemplateStepRequest {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub target: String,
    #[serde(default)]
    pub preset_id: Option<String>,
    #[serde(default)]
    pub prompt: Option<String>,
    #[serde(default)]
    pub gen_mode: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub style_id: Option<String>,
    #[serde(default)]
    pub aspect_ratio: Option<String>,
    #[serde(default)]
    pub resolution: Option<String>,
    #[serde(default)]
    pub duration: Option<String>,
    #[serde(default)]
    pub attachments: Option<Vec<CreationSessionAttachmentRecord>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCreationTemplateRequest {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub primary_target: String,
    pub workspace_id: String,
    #[serde(default)]
    pub project_id: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub default_step_id: Option<String>,
    pub steps: Vec<CreateCreationTemplateStepRequest>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCreationTemplateRequest {
    pub name: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub description: CreationTemplateOptionalTextUpdate,
    pub primary_target: Option<String>,
    pub workspace_id: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub project_id: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub category: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub default_step_id: CreationTemplateOptionalTextUpdate,
    pub steps: Option<Vec<CreateCreationTemplateStepRequest>>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ApplyCreationTemplateRequest {
    #[serde(default)]
    pub step_id: Option<String>,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub project_id: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub prompt: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub gen_mode: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub model: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub style_id: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub aspect_ratio: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub resolution: CreationTemplateOptionalTextUpdate,
    #[serde(
        default,
        deserialize_with = "deserialize_creation_template_optional_text_update"
    )]
    pub duration: CreationTemplateOptionalTextUpdate,
    pub attachments: Option<Vec<CreationSessionAttachmentRecord>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreationTemplateDocument {
    schema_version: String,
    #[serde(default)]
    templates: Vec<CreationTemplateRecord>,
}

#[derive(Debug, Clone, Default)]
pub enum CreationTemplateOptionalTextUpdate {
    #[default]
    Missing,
    Clear,
    Set(String),
}

pub trait CreationTemplateService: Send + Sync {
    fn list_templates(
        &self,
        query: CreationTemplateListQuery,
    ) -> ServerResult<CreationTemplateListResult>;
    fn create_template(
        &self,
        input: CreateCreationTemplateRequest,
    ) -> ServerResult<CreationTemplateRecord>;
    fn read_template(&self, template_key: &str) -> ServerResult<CreationTemplateRecord>;
    fn update_template(
        &self,
        template_key: &str,
        input: UpdateCreationTemplateRequest,
    ) -> ServerResult<CreationTemplateRecord>;
    fn delete_template(&self, template_key: &str) -> ServerResult<()>;
    fn apply_template(
        &self,
        template_key: &str,
        input: ApplyCreationTemplateRequest,
    ) -> ServerResult<CreationSessionRecord>;
}

pub struct FileBackedCreationTemplateService {
    storage_paths: AppStoragePaths,
    creation_service: Arc<dyn CreationService>,
    creation_preset_service: Arc<dyn CreationPresetService>,
    lock: Mutex<()>,
}

impl FileBackedCreationTemplateService {
    pub fn new(
        storage_paths: AppStoragePaths,
        creation_service: Arc<dyn CreationService>,
        creation_preset_service: Arc<dyn CreationPresetService>,
    ) -> Self {
        Self {
            storage_paths,
            creation_service,
            creation_preset_service,
            lock: Mutex::new(()),
        }
    }

    fn acquire_lock(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "CREATION_TEMPLATES_LOCK_FAILED",
                "failed to acquire creation templates lock",
            )
        })
    }

    fn default_document(&self) -> CreationTemplateDocument {
        CreationTemplateDocument {
            schema_version: CREATION_TEMPLATES_SCHEMA_VERSION.to_string(),
            templates: Vec::new(),
        }
    }

    fn load_document(&self) -> ServerResult<CreationTemplateDocument> {
        let path = self.storage_paths.creation_templates_file();
        if !path.exists() {
            return Ok(self.default_document());
        }

        let contents = fs::read_to_string(path).map_err(|error| {
            ServerError::internal(
                "CREATION_TEMPLATES_READ_FAILED",
                format!(
                    "failed to read creation templates from {}: {error}",
                    path.display()
                ),
            )
        })?;

        if contents.trim().is_empty() {
            return Ok(self.default_document());
        }

        let mut document =
            serde_json::from_str::<CreationTemplateDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "CREATION_TEMPLATES_PARSE_FAILED",
                    format!(
                        "failed to parse creation templates document {}: {error}",
                        path.display()
                    ),
                )
            })?;
        sort_creation_templates(&mut document.templates);
        Ok(document)
    }

    fn persist_document(&self, document: &CreationTemplateDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(
                "CREATION_TEMPLATES_SERIALIZE_FAILED",
                format!("failed to serialize creation templates: {error}"),
            )
        })?;

        fs::write(self.storage_paths.creation_templates_file(), contents).map_err(|error| {
            ServerError::internal(
                "CREATION_TEMPLATES_WRITE_FAILED",
                format!(
                    "failed to write creation templates to {}: {error}",
                    self.storage_paths.creation_templates_file().display()
                ),
            )
        })
    }

    fn find_template<'a>(
        &self,
        document: &'a CreationTemplateDocument,
        template_key: &str,
    ) -> ServerResult<&'a CreationTemplateRecord> {
        let key = require_non_empty_text(
            template_key.to_string(),
            "CREATION_TEMPLATE_ID_EMPTY",
            "templateId",
        )?;
        document
            .templates
            .iter()
            .find(|template| template.id == key || template.uuid == key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "CREATION_TEMPLATE_NOT_FOUND",
                    format!("creation template {template_key} was not found"),
                )
            })
    }

    fn find_template_mut<'a>(
        &self,
        document: &'a mut CreationTemplateDocument,
        template_key: &str,
    ) -> ServerResult<&'a mut CreationTemplateRecord> {
        let key = require_non_empty_text(
            template_key.to_string(),
            "CREATION_TEMPLATE_ID_EMPTY",
            "templateId",
        )?;
        document
            .templates
            .iter_mut()
            .find(|template| template.id == key || template.uuid == key)
            .ok_or_else(|| {
                ServerError::not_found(
                    "CREATION_TEMPLATE_NOT_FOUND",
                    format!("creation template {template_key} was not found"),
                )
            })
    }

    fn normalize_steps(
        &self,
        steps: Vec<CreateCreationTemplateStepRequest>,
        now_ms: i64,
    ) -> ServerResult<Vec<CreationTemplateStepRecord>> {
        if steps.is_empty() {
            return Err(ServerError::bad_request(
                "CREATION_TEMPLATE_STEPS_EMPTY",
                "steps must include at least one template step",
            ));
        }

        let mut seen = std::collections::BTreeSet::new();
        let mut normalized = Vec::new();
        for step in steps {
            let step_id = normalize_optional_text(step.id)
                .map(|value| normalize_creation_template_step_id(&value))
                .unwrap_or_else(|| next_creation_template_step_id(now_ms));

            if !seen.insert(step_id.clone()) {
                return Err(ServerError::bad_request(
                    "CREATION_TEMPLATE_STEP_ID_DUPLICATE",
                    format!("duplicate creation template step id {step_id}"),
                ));
            }

            let target =
                normalize_creation_target(Some(step.target), "CREATION_TEMPLATE_TARGET_INVALID")?;
            let preset_id = normalize_optional_text(step.preset_id);
            if let Some(preset_key) = preset_id.as_ref() {
                let preset = self.creation_preset_service.read_preset(preset_key)?;
                if preset.target != target {
                    return Err(ServerError::bad_request(
                        "CREATION_TEMPLATE_STEP_PRESET_TARGET_MISMATCH",
                        format!(
                            "creation template step {step_id} target {target} does not match preset target {}",
                            preset.target
                        ),
                    ));
                }
            }

            normalized.push(CreationTemplateStepRecord {
                id: step_id,
                name: require_non_empty_text(
                    step.name,
                    "CREATION_TEMPLATE_STEP_NAME_EMPTY",
                    "step.name",
                )?,
                description: normalize_optional_text(step.description),
                target,
                preset_id,
                prompt: normalize_optional_text(step.prompt),
                gen_mode: normalize_optional_text(step.gen_mode),
                model: normalize_optional_text(step.model),
                style_id: normalize_optional_text(step.style_id),
                aspect_ratio: normalize_optional_text(step.aspect_ratio),
                resolution: normalize_optional_text(step.resolution),
                duration: normalize_optional_text(step.duration),
                attachments: normalize_creation_session_attachments(
                    step.attachments.unwrap_or_default(),
                ),
            });
        }

        Ok(normalized)
    }
}

impl CreationTemplateService for FileBackedCreationTemplateService {
    fn list_templates(
        &self,
        query: CreationTemplateListQuery,
    ) -> ServerResult<CreationTemplateListResult> {
        let _guard = self.acquire_lock()?;
        let document = self.load_document()?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query
            .page_size
            .unwrap_or(DEFAULT_CREATION_TEMPLATE_PAGE_SIZE)
            .clamp(1, MAX_CREATION_TEMPLATE_PAGE_SIZE);
        let keyword =
            normalize_optional_text(query.keyword).map(|value| value.to_ascii_lowercase());
        let primary_target = match query.primary_target {
            Some(value) => Some(normalize_creation_target(
                Some(value),
                "CREATION_TEMPLATE_TARGET_INVALID",
            )?),
            None => None,
        };
        let workspace_id = normalize_optional_text(query.workspace_id);
        let project_id = normalize_optional_text(query.project_id);
        let favorite_only = query.favorite_only.unwrap_or(false);
        let category =
            normalize_optional_text(query.category).map(|value| value.to_ascii_lowercase());

        let filtered = document
            .templates
            .into_iter()
            .filter(|template| {
                primary_target
                    .as_ref()
                    .map(|target| template.primary_target == *target)
                    .unwrap_or(true)
            })
            .filter(|template| {
                workspace_id
                    .as_ref()
                    .map(|workspace_id| template.workspace_id == *workspace_id)
                    .unwrap_or(true)
            })
            .filter(|template| {
                project_id
                    .as_ref()
                    .map(|project_id| template.project_id.as_deref() == Some(project_id.as_str()))
                    .unwrap_or(true)
            })
            .filter(|template| !favorite_only || template.is_favorite)
            .filter(|template| {
                category
                    .as_ref()
                    .map(|category| {
                        template
                            .category
                            .as_deref()
                            .map(|value| value.to_ascii_lowercase() == *category)
                            .unwrap_or(false)
                    })
                    .unwrap_or(true)
            })
            .filter(|template| {
                keyword
                    .as_ref()
                    .map(|keyword| creation_template_matches_keyword(template, keyword))
                    .unwrap_or(true)
            })
            .collect::<Vec<_>>();

        let total = filtered.len();
        let start = (page - 1).saturating_mul(page_size);
        let items = filtered
            .into_iter()
            .skip(start)
            .take(page_size)
            .collect::<Vec<_>>();

        Ok(CreationTemplateListResult {
            items,
            page,
            page_size,
            total,
        })
    }

    fn create_template(
        &self,
        input: CreateCreationTemplateRequest,
    ) -> ServerResult<CreationTemplateRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let now_ms = current_time_millis();
        let steps = self.normalize_steps(input.steps, now_ms)?;
        let default_step_id = resolve_creation_template_default_step_id(
            &steps,
            input.default_step_id,
            CreationTemplateOptionalTextUpdate::Missing,
        )?;
        let primary_target = normalize_creation_target(
            Some(input.primary_target),
            "CREATION_TEMPLATE_TARGET_INVALID",
        )?;
        validate_creation_template_primary_target(&steps, &default_step_id, &primary_target)?;

        let template_id = next_creation_template_id(now_ms);
        let template = CreationTemplateRecord {
            id: template_id.clone(),
            uuid: to_client_entity_uuid(&template_id),
            name: require_non_empty_text(input.name, "CREATION_TEMPLATE_NAME_EMPTY", "name")?,
            description: normalize_optional_text(input.description),
            primary_target,
            workspace_id: require_non_empty_text(
                input.workspace_id,
                "CREATION_TEMPLATE_WORKSPACE_ID_EMPTY",
                "workspaceId",
            )?,
            project_id: normalize_optional_text(input.project_id),
            category: normalize_optional_text(input.category),
            default_step_id,
            steps,
            tags: normalize_creation_template_tags(input.tags.unwrap_or_default()),
            is_favorite: input.is_favorite.unwrap_or(false),
            created_at: now_ms,
            updated_at: now_ms,
        };

        document.templates.push(template.clone());
        sort_creation_templates(&mut document.templates);
        self.persist_document(&document)?;
        Ok(template)
    }

    fn read_template(&self, template_key: &str) -> ServerResult<CreationTemplateRecord> {
        let _guard = self.acquire_lock()?;
        let document = self.load_document()?;
        Ok(self.find_template(&document, template_key)?.clone())
    }

    fn update_template(
        &self,
        template_key: &str,
        input: UpdateCreationTemplateRequest,
    ) -> ServerResult<CreationTemplateRecord> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let template = self.find_template_mut(&mut document, template_key)?;

        if let Some(name) = input.name {
            template.name = require_non_empty_text(name, "CREATION_TEMPLATE_NAME_EMPTY", "name")?;
        }

        if let Some(primary_target) = input.primary_target {
            template.primary_target = normalize_creation_target(
                Some(primary_target),
                "CREATION_TEMPLATE_TARGET_INVALID",
            )?;
        }

        if let Some(workspace_id) = input.workspace_id {
            template.workspace_id = require_non_empty_text(
                workspace_id,
                "CREATION_TEMPLATE_WORKSPACE_ID_EMPTY",
                "workspaceId",
            )?;
        }

        apply_optional_text_update(&mut template.description, input.description);
        apply_optional_text_update(&mut template.project_id, input.project_id);
        apply_optional_text_update(&mut template.category, input.category);

        if let Some(steps) = input.steps {
            template.steps = self.normalize_steps(steps, current_time_millis())?;
        }

        template.default_step_id = resolve_creation_template_default_step_id(
            &template.steps,
            Some(template.default_step_id.clone()),
            input.default_step_id,
        )?;
        validate_creation_template_primary_target(
            &template.steps,
            &template.default_step_id,
            &template.primary_target,
        )?;

        if let Some(tags) = input.tags {
            template.tags = normalize_creation_template_tags(tags);
        }

        if let Some(is_favorite) = input.is_favorite {
            template.is_favorite = is_favorite;
        }

        template.updated_at = current_time_millis();
        let updated = template.clone();
        sort_creation_templates(&mut document.templates);
        self.persist_document(&document)?;
        Ok(updated)
    }

    fn delete_template(&self, template_key: &str) -> ServerResult<()> {
        let _guard = self.acquire_lock()?;
        let mut document = self.load_document()?;
        let template_id = self.find_template(&document, template_key)?.id.clone();
        let before_len = document.templates.len();
        document
            .templates
            .retain(|template| template.id != template_id);

        if document.templates.len() == before_len {
            return Err(ServerError::not_found(
                "CREATION_TEMPLATE_NOT_FOUND",
                format!("creation template {template_key} was not found"),
            ));
        }

        self.persist_document(&document)?;
        Ok(())
    }

    fn apply_template(
        &self,
        template_key: &str,
        input: ApplyCreationTemplateRequest,
    ) -> ServerResult<CreationSessionRecord> {
        let template = {
            let _guard = self.acquire_lock()?;
            let document = self.load_document()?;
            self.find_template(&document, template_key)?.clone()
        };

        let requested_step_id = normalize_optional_text(input.step_id);
        let step = if let Some(step_id) = requested_step_id.as_deref() {
            find_creation_template_step(&template.steps, step_id)?.clone()
        } else {
            find_creation_template_step(&template.steps, &template.default_step_id)?.clone()
        };

        let preset = step
            .preset_id
            .as_ref()
            .map(|preset_id| self.creation_preset_service.read_preset(preset_id))
            .transpose()?;

        let prompt = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.prompt.clone()),
            step.prompt.clone(),
            input.prompt,
        );
        let gen_mode = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.gen_mode.clone()),
            step.gen_mode.clone(),
            input.gen_mode,
        );
        let model = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.model.clone()),
            step.model.clone(),
            input.model,
        );
        let style_id = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.style_id.clone()),
            step.style_id.clone(),
            input.style_id,
        );
        let aspect_ratio = apply_optional_text_override(
            preset
                .as_ref()
                .and_then(|preset| preset.aspect_ratio.clone()),
            step.aspect_ratio.clone(),
            input.aspect_ratio,
        );
        let resolution = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.resolution.clone()),
            step.resolution.clone(),
            input.resolution,
        );
        let duration = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.duration.clone()),
            step.duration.clone(),
            input.duration,
        );
        let project_id = apply_optional_text_override(
            preset.as_ref().and_then(|preset| preset.project_id.clone()),
            template.project_id.clone(),
            input.project_id,
        );

        let base_attachments = merge_creation_session_attachments(
            preset
                .as_ref()
                .map(|preset| preset.attachments.clone())
                .unwrap_or_default(),
            step.attachments.clone(),
        );
        let attachments = input
            .attachments
            .map(normalize_creation_session_attachments)
            .unwrap_or(base_attachments);

        self.creation_service.create_session_with_source(
            CreateCreationSessionRequest {
                target: step.target,
                prompt,
                gen_mode,
                model,
                style_id,
                aspect_ratio,
                resolution,
                duration,
                attachments: Some(attachments),
                workspace_id: template.workspace_id,
                project_id,
            },
            CREATION_TEMPLATE_SOURCE,
        )
    }
}

fn creation_template_matches_keyword(template: &CreationTemplateRecord, keyword: &str) -> bool {
    template.name.to_ascii_lowercase().contains(keyword)
        || template
            .description
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || template
            .category
            .as_deref()
            .map(|value| value.to_ascii_lowercase().contains(keyword))
            .unwrap_or(false)
        || template
            .tags
            .iter()
            .any(|tag| tag.to_ascii_lowercase().contains(keyword))
        || template.steps.iter().any(|step| {
            step.name.to_ascii_lowercase().contains(keyword)
                || step
                    .description
                    .as_deref()
                    .map(|value| value.to_ascii_lowercase().contains(keyword))
                    .unwrap_or(false)
                || step
                    .prompt
                    .as_deref()
                    .map(|value| value.to_ascii_lowercase().contains(keyword))
                    .unwrap_or(false)
        })
}

fn sort_creation_templates(templates: &mut [CreationTemplateRecord]) {
    templates.sort_by(|left, right| {
        right
            .is_favorite
            .cmp(&left.is_favorite)
            .then_with(|| right.updated_at.cmp(&left.updated_at))
            .then_with(|| {
                left.name
                    .to_ascii_lowercase()
                    .cmp(&right.name.to_ascii_lowercase())
            })
            .then_with(|| left.id.cmp(&right.id))
    });
}

fn resolve_creation_template_default_step_id(
    steps: &[CreationTemplateStepRecord],
    current_default_step_id: Option<String>,
    update: CreationTemplateOptionalTextUpdate,
) -> ServerResult<String> {
    let first_step_id = steps.first().map(|step| step.id.clone()).ok_or_else(|| {
        ServerError::bad_request(
            "CREATION_TEMPLATE_STEPS_EMPTY",
            "steps must include at least one template step",
        )
    })?;

    let requested = match update {
        CreationTemplateOptionalTextUpdate::Missing => current_default_step_id
            .map(|value| normalize_creation_template_step_id(&value))
            .unwrap_or_else(|| first_step_id.clone()),
        CreationTemplateOptionalTextUpdate::Clear => first_step_id.clone(),
        CreationTemplateOptionalTextUpdate::Set(value) => {
            normalize_creation_template_step_id(value.trim())
        }
    };

    if steps.iter().any(|step| step.id == requested) {
        return Ok(requested);
    }

    Err(ServerError::bad_request(
        "CREATION_TEMPLATE_DEFAULT_STEP_NOT_FOUND",
        format!("defaultStepId {requested} does not match any template step"),
    ))
}

fn validate_creation_template_primary_target(
    steps: &[CreationTemplateStepRecord],
    default_step_id: &str,
    primary_target: &str,
) -> ServerResult<()> {
    let default_step = find_creation_template_step(steps, default_step_id)?;
    if default_step.target == primary_target {
        return Ok(());
    }

    Err(ServerError::bad_request(
        "CREATION_TEMPLATE_PRIMARY_TARGET_MISMATCH",
        format!(
            "primaryTarget {primary_target} must match the target {} of default step {default_step_id}",
            default_step.target
        ),
    ))
}

fn find_creation_template_step<'a>(
    steps: &'a [CreationTemplateStepRecord],
    step_id: &str,
) -> ServerResult<&'a CreationTemplateStepRecord> {
    let normalized = normalize_creation_template_step_id(step_id);
    steps
        .iter()
        .find(|step| step.id == normalized)
        .ok_or_else(|| {
            ServerError::not_found(
                "CREATION_TEMPLATE_STEP_NOT_FOUND",
                format!("creation template step {step_id} was not found"),
            )
        })
}

fn apply_optional_text_update(
    slot: &mut Option<String>,
    update: CreationTemplateOptionalTextUpdate,
) {
    match update {
        CreationTemplateOptionalTextUpdate::Missing => {}
        CreationTemplateOptionalTextUpdate::Clear => {
            *slot = None;
        }
        CreationTemplateOptionalTextUpdate::Set(value) => {
            *slot = normalize_optional_text(Some(value));
        }
    }
}

fn apply_optional_text_override(
    base: Option<String>,
    overlay: Option<String>,
    update: CreationTemplateOptionalTextUpdate,
) -> Option<String> {
    match update {
        CreationTemplateOptionalTextUpdate::Missing => overlay.or(base),
        CreationTemplateOptionalTextUpdate::Clear => None,
        CreationTemplateOptionalTextUpdate::Set(value) => normalize_optional_text(Some(value)),
    }
}

fn deserialize_creation_template_optional_text_update<'de, D>(
    deserializer: D,
) -> Result<CreationTemplateOptionalTextUpdate, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<String>::deserialize(deserializer)? {
        Some(value) => Ok(CreationTemplateOptionalTextUpdate::Set(value)),
        None => Ok(CreationTemplateOptionalTextUpdate::Clear),
    }
}

fn normalize_creation_template_tags(tags: Vec<String>) -> Vec<String> {
    let mut seen = std::collections::BTreeSet::new();
    let mut normalized = Vec::new();

    for tag in tags {
        let normalized_tag = tag.trim().to_string();
        if normalized_tag.is_empty() {
            continue;
        }

        let dedupe_key = normalized_tag.to_ascii_lowercase();
        if seen.insert(dedupe_key) {
            normalized.push(normalized_tag);
        }
    }

    normalized
}

fn next_creation_template_id(now_ms: i64) -> String {
    let counter = CREATION_TEMPLATE_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("creation-template-{now_ms}-{counter}")
}

fn next_creation_template_step_id(now_ms: i64) -> String {
    let counter = CREATION_TEMPLATE_STEP_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("creation-template-step-{now_ms}-{counter}")
}
