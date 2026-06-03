use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering as AtomicOrdering};
use std::sync::Mutex;

use serde::Deserialize;
use serde_json::{Map, Value};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;

static MAGICCUT_PROJECT_COUNTER: AtomicU64 = AtomicU64::new(1);
static MAGICCUT_TEMPLATE_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone)]
pub struct MagicCutListResult {
    pub items: Vec<Value>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutListQuery {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub keyword: Option<String>,
    #[serde(default)]
    pub sort: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutProjectWriteInput {
    pub project: Value,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutProjectDuplicateInput {
    pub name: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutTemplateInstantiateInput {
    pub name: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutTemplateMetadataInput {
    pub name: String,
    pub description: Option<String>,
    pub thumbnail_path: Option<String>,
    pub thumbnail_url: Option<String>,
    pub is_public: Option<bool>,
    pub price: Option<f64>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicCutTemplateSaveInput {
    pub metadata: MagicCutTemplateMetadataInput,
    pub project: Value,
}

#[derive(Debug, Clone)]
struct MagicCutSortField {
    field: &'static str,
    ascending: bool,
}

pub trait MagicCutService: Send + Sync {
    fn list_projects(&self, query: MagicCutListQuery) -> ServerResult<MagicCutListResult>;
    fn create_project(&self, input: MagicCutProjectWriteInput) -> ServerResult<Value>;
    fn read_project(&self, project_key: &str) -> ServerResult<Value>;
    fn update_project(
        &self,
        project_key: &str,
        input: MagicCutProjectWriteInput,
    ) -> ServerResult<Value>;
    fn delete_project(&self, project_key: &str) -> ServerResult<bool>;
    fn duplicate_project(
        &self,
        project_key: &str,
        input: MagicCutProjectDuplicateInput,
    ) -> ServerResult<Value>;
    fn list_templates(&self, query: MagicCutListQuery) -> ServerResult<MagicCutListResult>;
    fn create_template(&self, input: MagicCutTemplateSaveInput) -> ServerResult<Value>;
    fn read_template(&self, template_key: &str) -> ServerResult<Value>;
    fn update_template(
        &self,
        template_key: &str,
        input: MagicCutTemplateSaveInput,
    ) -> ServerResult<Value>;
    fn instantiate_template(
        &self,
        template_key: &str,
        input: MagicCutTemplateInstantiateInput,
    ) -> ServerResult<Value>;
    fn delete_template(&self, template_key: &str) -> ServerResult<bool>;
}

pub struct FileBackedMagicCutService {
    storage_paths: AppStoragePaths,
    lock: Mutex<()>,
}

impl FileBackedMagicCutService {
    pub fn new(storage_paths: AppStoragePaths) -> Self {
        Self {
            storage_paths,
            lock: Mutex::new(()),
        }
    }

    fn ensure_storage_dirs(&self) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.magiccut_root_dir()).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_ROOT_CREATE_FAILED",
                format!(
                    "failed to create magiccut root {}: {error}",
                    self.storage_paths.magiccut_root_dir().display()
                ),
            )
        })?;
        fs::create_dir_all(self.storage_paths.magiccut_projects_dir()).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_PROJECTS_DIR_CREATE_FAILED",
                format!(
                    "failed to create magiccut projects dir {}: {error}",
                    self.storage_paths.magiccut_projects_dir().display()
                ),
            )
        })?;
        fs::create_dir_all(self.storage_paths.magiccut_templates_dir()).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_TEMPLATES_DIR_CREATE_FAILED",
                format!(
                    "failed to create magiccut templates dir {}: {error}",
                    self.storage_paths.magiccut_templates_dir().display()
                ),
            )
        })?;
        Ok(())
    }

    fn read_document(path: &Path, error_prefix: &str) -> ServerResult<Value> {
        let contents = fs::read_to_string(path).map_err(|error| {
            ServerError::internal(
                format!("{error_prefix}_READ_FAILED"),
                format!("failed to read {}: {error}", path.display()),
            )
        })?;

        serde_json::from_str::<Value>(&contents).map_err(|error| {
            ServerError::internal(
                format!("{error_prefix}_PARSE_FAILED"),
                format!("failed to parse {}: {error}", path.display()),
            )
        })
    }

    fn write_document(path: &Path, document: &Value, error_prefix: &str) -> ServerResult<()> {
        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                format!("{error_prefix}_SERIALIZE_FAILED"),
                format!("failed to serialize document {}: {error}", path.display()),
            )
        })?;

        fs::write(path, contents).map_err(|error| {
            ServerError::internal(
                format!("{error_prefix}_WRITE_FAILED"),
                format!("failed to write {}: {error}", path.display()),
            )
        })
    }

    fn project_file_path(&self, key: &str) -> PathBuf {
        self.storage_paths
            .magiccut_projects_dir()
            .join(format!("{key}.json"))
    }

    fn template_file_path(&self, key: &str) -> PathBuf {
        self.storage_paths
            .magiccut_templates_dir()
            .join(format!("{key}.json"))
    }

    fn find_document_path_by_key(&self, dir: &Path, key: &str) -> ServerResult<Option<PathBuf>> {
        let direct_path = dir.join(format!("{key}.json"));
        if direct_path.exists() {
            return Ok(Some(direct_path));
        }

        if !dir.exists() {
            return Ok(None);
        }

        let entries = fs::read_dir(dir).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_DIR_READ_FAILED",
                format!(
                    "failed to read magiccut directory {}: {error}",
                    dir.display()
                ),
            )
        })?;

        for entry in entries {
            let entry = entry.map_err(|error| {
                ServerError::internal(
                    "MAGICCUT_DIR_ENTRY_READ_FAILED",
                    format!(
                        "failed to read a magiccut directory entry from {}: {error}",
                        dir.display()
                    ),
                )
            })?;
            let path = entry.path();
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                continue;
            }
            let document = Self::read_document(&path, "MAGICCUT_DOCUMENT")?;
            if matches_json_entity_key(&document, key) {
                return Ok(Some(path));
            }
        }

        Ok(None)
    }

    fn read_document_by_key(
        &self,
        dir: &Path,
        key: &str,
        entity_name: &str,
    ) -> ServerResult<(PathBuf, Value)> {
        let trimmed_key = require_non_empty_text(key, "MAGICCUT_ENTITY_KEY_EMPTY", entity_name)?;
        let path = self
            .find_document_path_by_key(dir, &trimmed_key)?
            .ok_or_else(|| {
                ServerError::not_found(
                    "MAGICCUT_ENTITY_NOT_FOUND",
                    format!("{entity_name} {trimmed_key} was not found"),
                )
            })?;
        let document = Self::read_document(&path, "MAGICCUT_DOCUMENT")?;
        Ok((path, document))
    }

    fn list_documents(&self, dir: &Path) -> ServerResult<Vec<Value>> {
        if !dir.exists() {
            return Ok(Vec::new());
        }

        let entries = fs::read_dir(dir).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_DIR_READ_FAILED",
                format!(
                    "failed to read magiccut directory {}: {error}",
                    dir.display()
                ),
            )
        })?;

        let mut documents = Vec::new();
        for entry in entries {
            let entry = entry.map_err(|error| {
                ServerError::internal(
                    "MAGICCUT_DIR_ENTRY_READ_FAILED",
                    format!(
                        "failed to read a magiccut directory entry from {}: {error}",
                        dir.display()
                    ),
                )
            })?;
            let path = entry.path();
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                continue;
            }
            documents.push(Self::read_document(&path, "MAGICCUT_DOCUMENT")?);
        }

        Ok(documents)
    }

    fn apply_list_query(documents: Vec<Value>, query: MagicCutListQuery) -> MagicCutListResult {
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.size);
        let keyword = normalize_optional_text(query.keyword).map(|value| value.to_lowercase());
        let sort_fields = normalize_sort_fields(query.sort);

        let mut filtered = documents
            .into_iter()
            .filter(|document| keyword_matches(document, keyword.as_deref()))
            .collect::<Vec<_>>();
        filtered.sort_by(|left, right| compare_documents(left, right, &sort_fields));

        let total = filtered.len();
        let start = (page - 1) * page_size;
        let items = filtered.into_iter().skip(start).take(page_size).collect();

        MagicCutListResult {
            items,
            page,
            page_size,
            total,
        }
    }
}

impl MagicCutService for FileBackedMagicCutService {
    fn list_projects(&self, query: MagicCutListQuery) -> ServerResult<MagicCutListResult> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let projects = self.list_documents(self.storage_paths.magiccut_projects_dir())?;
        Ok(Self::apply_list_query(projects, query))
    }

    fn create_project(&self, input: MagicCutProjectWriteInput) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let project = normalize_magiccut_project(input.project, None, None)?;
        let project_key = resolve_json_entity_key(&project).ok_or_else(|| {
            ServerError::internal(
                "MAGICCUT_PROJECT_KEY_MISSING",
                "project key is missing after normalization",
            )
        })?;
        let path = self.project_file_path(&project_key);
        Self::write_document(&path, &project, "MAGICCUT_PROJECT")?;
        Ok(project)
    }

    fn read_project(&self, project_key: &str) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let (_, project) = self.read_document_by_key(
            self.storage_paths.magiccut_projects_dir(),
            project_key,
            "magiccut project",
        )?;
        Ok(project)
    }

    fn update_project(
        &self,
        project_key: &str,
        input: MagicCutProjectWriteInput,
    ) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let (_, existing_project) = self.read_document_by_key(
            self.storage_paths.magiccut_projects_dir(),
            project_key,
            "magiccut project",
        )?;
        let project = normalize_magiccut_project(
            input.project,
            Some(&existing_project),
            resolve_json_entity_key(&existing_project).as_deref(),
        )?;
        let stored_key = resolve_json_entity_key(&project).ok_or_else(|| {
            ServerError::internal(
                "MAGICCUT_PROJECT_KEY_MISSING",
                "project key is missing after normalization",
            )
        })?;
        let path = self.project_file_path(&stored_key);
        Self::write_document(&path, &project, "MAGICCUT_PROJECT")?;
        Ok(project)
    }

    fn delete_project(&self, project_key: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let path = self
            .find_document_path_by_key(self.storage_paths.magiccut_projects_dir(), project_key)?
            .ok_or_else(|| {
                ServerError::not_found(
                    "MAGICCUT_PROJECT_NOT_FOUND",
                    format!("magiccut project {project_key} was not found"),
                )
            })?;

        fs::remove_file(path).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_PROJECT_DELETE_FAILED",
                format!("failed to delete magiccut project {project_key}: {error}"),
            )
        })?;
        Ok(true)
    }

    fn duplicate_project(
        &self,
        project_key: &str,
        input: MagicCutProjectDuplicateInput,
    ) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let (_, existing_project) = self.read_document_by_key(
            self.storage_paths.magiccut_projects_dir(),
            project_key,
            "magiccut project",
        )?;
        let duplicated_project = duplicate_magiccut_project(existing_project, input)?;
        let duplicated_key = resolve_json_entity_key(&duplicated_project).ok_or_else(|| {
            ServerError::internal(
                "MAGICCUT_PROJECT_KEY_MISSING",
                "duplicated project key is missing after normalization",
            )
        })?;
        let path = self.project_file_path(&duplicated_key);
        Self::write_document(&path, &duplicated_project, "MAGICCUT_PROJECT")?;
        Ok(duplicated_project)
    }

    fn list_templates(&self, query: MagicCutListQuery) -> ServerResult<MagicCutListResult> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let templates = self.list_documents(self.storage_paths.magiccut_templates_dir())?;
        Ok(Self::apply_list_query(templates, query))
    }

    fn create_template(&self, input: MagicCutTemplateSaveInput) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let template = normalize_magiccut_template(input, None, None)?;
        let template_key = resolve_json_entity_key(&template).ok_or_else(|| {
            ServerError::internal(
                "MAGICCUT_TEMPLATE_KEY_MISSING",
                "template key is missing after normalization",
            )
        })?;
        let path = self.template_file_path(&template_key);
        Self::write_document(&path, &template, "MAGICCUT_TEMPLATE")?;
        Ok(template)
    }

    fn update_template(
        &self,
        template_key: &str,
        input: MagicCutTemplateSaveInput,
    ) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let (path, existing_template) = self.read_document_by_key(
            self.storage_paths.magiccut_templates_dir(),
            template_key,
            "magiccut template",
        )?;
        let template =
            normalize_magiccut_template(input, Some(&existing_template), Some(template_key))?;
        Self::write_document(&path, &template, "MAGICCUT_TEMPLATE")?;
        Ok(template)
    }

    fn read_template(&self, template_key: &str) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let (_, template) = self.read_document_by_key(
            self.storage_paths.magiccut_templates_dir(),
            template_key,
            "magiccut template",
        )?;
        Ok(template)
    }

    fn instantiate_template(
        &self,
        template_key: &str,
        input: MagicCutTemplateInstantiateInput,
    ) -> ServerResult<Value> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let (_, template) = self.read_document_by_key(
            self.storage_paths.magiccut_templates_dir(),
            template_key,
            "magiccut template",
        )?;
        let instantiated_project = instantiate_magiccut_template(template, input)?;
        let project_key = resolve_json_entity_key(&instantiated_project).ok_or_else(|| {
            ServerError::internal(
                "MAGICCUT_PROJECT_KEY_MISSING",
                "instantiated project key is missing after normalization",
            )
        })?;
        let path = self.project_file_path(&project_key);
        Self::write_document(&path, &instantiated_project, "MAGICCUT_PROJECT")?;
        Ok(instantiated_project)
    }

    fn delete_template(&self, template_key: &str) -> ServerResult<bool> {
        let _guard = self.lock.lock().map_err(|_| {
            ServerError::internal("MAGICCUT_LOCK_FAILED", "failed to acquire magiccut lock")
        })?;
        self.ensure_storage_dirs()?;

        let path = self
            .find_document_path_by_key(self.storage_paths.magiccut_templates_dir(), template_key)?
            .ok_or_else(|| {
                ServerError::not_found(
                    "MAGICCUT_TEMPLATE_NOT_FOUND",
                    format!("magiccut template {template_key} was not found"),
                )
            })?;

        fs::remove_file(path).map_err(|error| {
            ServerError::internal(
                "MAGICCUT_TEMPLATE_DELETE_FAILED",
                format!("failed to delete magiccut template {template_key}: {error}"),
            )
        })?;
        Ok(true)
    }
}

fn normalize_magiccut_template(
    input: MagicCutTemplateSaveInput,
    existing: Option<&Value>,
    forced_key: Option<&str>,
) -> ServerResult<Value> {
    let existing_object = existing.and_then(|value| value.as_object());
    let name = require_non_empty_text(
        &input.metadata.name,
        "MAGICCUT_TEMPLATE_NAME_EMPTY",
        "template name",
    )?;
    let project = normalize_magiccut_project(
        input.project,
        existing_object.and_then(|value| value.get("projectData")),
        None,
    )?;
    let template_key = forced_key
        .map(str::to_string)
        .or_else(|| existing_object.and_then(|value| read_map_text(value, "uuid")))
        .or_else(|| existing_object.and_then(|value| read_map_text(value, "id")))
        .unwrap_or_else(|| {
            format!(
                "magiccut-template-{}",
                MAGICCUT_TEMPLATE_COUNTER.fetch_add(1, AtomicOrdering::Relaxed)
            )
        });
    let now_ms = current_time_millis();

    let mut document = Map::new();
    if let Some(existing_id) = existing_object.and_then(|value| value.get("id")).cloned() {
        document.insert("id".to_string(), existing_id);
    } else {
        document.insert("id".to_string(), Value::Null);
    }
    document.insert("uuid".to_string(), Value::String(template_key));
    document.insert(
        "type".to_string(),
        Value::String("CUT_TEMPLATE".to_string()),
    );
    document.insert("name".to_string(), Value::String(name));
    if let Some(description) = normalize_optional_text(input.metadata.description) {
        document.insert("description".to_string(), Value::String(description));
    }
    if let Some(thumbnail_path) = normalize_optional_text(input.metadata.thumbnail_path) {
        document.insert("thumbnailPath".to_string(), Value::String(thumbnail_path));
    }
    if let Some(thumbnail_url) = normalize_optional_text(input.metadata.thumbnail_url) {
        document.insert("thumbnailUrl".to_string(), Value::String(thumbnail_url));
    }
    if let Some(is_public) = input.metadata.is_public {
        document.insert("isPublic".to_string(), Value::Bool(is_public));
    }
    if let Some(price) = input.metadata.price {
        if let Some(number) = serde_json::Number::from_f64(price) {
            document.insert("price".to_string(), Value::Number(number));
        }
    }
    if let Some(tags) = input.metadata.tags {
        let tags: Vec<Value> = tags
            .into_iter()
            .filter_map(|tag| normalize_optional_text(Some(tag)).map(Value::String))
            .collect();
        if !tags.is_empty() {
            document.insert("tags".to_string(), Value::Array(tags));
        }
    }
    if let Some(created_at) = existing_object
        .and_then(|value| value.get("createdAt"))
        .cloned()
    {
        document.insert("createdAt".to_string(), created_at);
    } else {
        document.insert(
            "createdAt".to_string(),
            Value::Number(serde_json::Number::from(now_ms)),
        );
    }
    document.insert(
        "updatedAt".to_string(),
        Value::Number(serde_json::Number::from(now_ms)),
    );
    document.insert("projectData".to_string(), project);
    Ok(Value::Object(document))
}

fn normalize_magiccut_project(
    document: Value,
    existing: Option<&Value>,
    forced_key: Option<&str>,
) -> ServerResult<Value> {
    let mut object = require_object(document, "MAGICCUT_PROJECT_INVALID")?;
    let existing_object = existing.and_then(|value| value.as_object());
    let now_ms = current_time_millis();

    let entity_key = forced_key
        .map(str::to_string)
        .or_else(|| read_object_text(&object, "uuid"))
        .or_else(|| read_object_text(&object, "id"))
        .or_else(|| existing_object.and_then(|value| read_map_text(value, "uuid")))
        .or_else(|| existing_object.and_then(|value| read_map_text(value, "id")))
        .unwrap_or_else(|| {
            format!(
                "magiccut-project-{}",
                MAGICCUT_PROJECT_COUNTER.fetch_add(1, AtomicOrdering::Relaxed)
            )
        });

    let project_name = read_object_text(&object, "name")
        .or_else(|| existing_object.and_then(|value| read_map_text(value, "name")))
        .unwrap_or_else(|| "Untitled MagicCut Project".to_string());

    object.insert("uuid".to_string(), Value::String(entity_key));
    if let Some(existing_id) = existing_object.and_then(|value| value.get("id")).cloned() {
        object.entry("id".to_string()).or_insert(existing_id);
    } else {
        object.entry("id".to_string()).or_insert(Value::Null);
    }
    object.insert("type".to_string(), Value::String("CUT_PROJECT".to_string()));
    object.insert("name".to_string(), Value::String(project_name));
    object
        .entry("description".to_string())
        .or_insert(Value::String(String::new()));
    object
        .entry("version".to_string())
        .or_insert(Value::Number(serde_json::Number::from(1)));
    if let Some(created_at) = object.get("createdAt").cloned().or_else(|| {
        existing_object
            .and_then(|value| value.get("createdAt"))
            .cloned()
    }) {
        object.insert("createdAt".to_string(), created_at);
    } else {
        object.insert(
            "createdAt".to_string(),
            Value::Number(serde_json::Number::from(now_ms)),
        );
    }
    object.insert(
        "updatedAt".to_string(),
        Value::Number(serde_json::Number::from(now_ms)),
    );

    Ok(Value::Object(object))
}

fn duplicate_magiccut_project(
    document: Value,
    input: MagicCutProjectDuplicateInput,
) -> ServerResult<Value> {
    let mut object = require_object(document, "MAGICCUT_PROJECT_INVALID")?;
    let now_ms = current_time_millis();
    let duplicated_key = format!(
        "magiccut-project-{}",
        MAGICCUT_PROJECT_COUNTER.fetch_add(1, AtomicOrdering::Relaxed)
    );
    let source_name =
        read_map_text(&object, "name").unwrap_or_else(|| "Untitled MagicCut Project".to_string());
    let duplicated_name =
        normalize_optional_text(input.name).unwrap_or_else(|| format!("{source_name} (Copy)"));

    object.insert("id".to_string(), Value::Null);
    object.insert("uuid".to_string(), Value::String(duplicated_key));
    object.insert("name".to_string(), Value::String(duplicated_name));
    object.insert(
        "createdAt".to_string(),
        Value::Number(serde_json::Number::from(now_ms)),
    );
    object.insert(
        "updatedAt".to_string(),
        Value::Number(serde_json::Number::from(now_ms)),
    );
    object.remove("projectGraph");

    if let Some(normalized_state) = object
        .get_mut("normalizedState")
        .and_then(|value| value.as_object_mut())
    {
        normalized_state.remove("projectGraph");
    }

    Ok(Value::Object(object))
}

fn instantiate_magiccut_template(
    template: Value,
    input: MagicCutTemplateInstantiateInput,
) -> ServerResult<Value> {
    let template_object = require_object(template, "MAGICCUT_TEMPLATE_INVALID")?;
    let template_name = read_map_text(&template_object, "name")
        .unwrap_or_else(|| "Untitled MagicCut Template".to_string());
    let project = template_object.get("projectData").cloned().ok_or_else(|| {
        ServerError::bad_request(
            "MAGICCUT_TEMPLATE_PROJECT_MISSING",
            "magiccut template is missing projectData",
        )
    })?;

    duplicate_magiccut_project(
        project,
        MagicCutProjectDuplicateInput {
            name: Some(
                normalize_optional_text(input.name)
                    .unwrap_or_else(|| format!("{template_name} (Copy)")),
            ),
        },
    )
}

fn require_object(value: Value, code: &str) -> ServerResult<Map<String, Value>> {
    match value {
        Value::Object(object) => Ok(object),
        _ => Err(ServerError::bad_request(
            code,
            "expected an object payload for magiccut document",
        )),
    }
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

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|entry| {
        let trimmed = entry.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn read_object_text(object: &Map<String, Value>, field_name: &str) -> Option<String> {
    read_map_text(object, field_name)
}

fn read_map_text(object: &Map<String, Value>, field_name: &str) -> Option<String> {
    object.get(field_name).and_then(read_value_text)
}

fn read_value_text(value: &Value) -> Option<String> {
    match value {
        Value::String(entry) => {
            let trimmed = entry.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        }
        _ => None,
    }
}

fn resolve_json_entity_key(document: &Value) -> Option<String> {
    document
        .as_object()
        .and_then(|value| read_map_text(value, "uuid").or_else(|| read_map_text(value, "id")))
}

fn matches_json_entity_key(document: &Value, candidate_key: &str) -> bool {
    resolve_json_entity_key(document)
        .map(|key| key == candidate_key)
        .unwrap_or(false)
}

fn keyword_matches(document: &Value, keyword: Option<&str>) -> bool {
    let Some(keyword) = keyword else {
        return true;
    };

    let name = document_name(document).to_lowercase();
    if name.contains(keyword) {
        return true;
    }

    let description = document_description(document).to_lowercase();
    if description.contains(keyword) {
        return true;
    }

    document
        .as_object()
        .and_then(|object| object.get("tags"))
        .and_then(|value| value.as_array())
        .is_some_and(|tags| {
            tags.iter()
                .filter_map(read_value_text)
                .any(|tag| tag.to_lowercase().contains(keyword))
        })
}

fn compare_documents(left: &Value, right: &Value, sort_fields: &[MagicCutSortField]) -> Ordering {
    for sort_field in sort_fields {
        let comparison = match sort_field.field {
            "name" => document_name(left)
                .to_lowercase()
                .cmp(&document_name(right).to_lowercase()),
            "createdAt" => created_at_millis(left).cmp(&created_at_millis(right)),
            _ => updated_at_millis(left).cmp(&updated_at_millis(right)),
        };

        if comparison != Ordering::Equal {
            return if sort_field.ascending {
                comparison
            } else {
                comparison.reverse()
            };
        }
    }

    Ordering::Equal
}

fn normalize_sort_fields(values: Vec<String>) -> Vec<MagicCutSortField> {
    let mut fields = values
        .into_iter()
        .filter_map(|value| parse_sort_field(&value))
        .collect::<Vec<_>>();

    if fields.is_empty() {
        fields.push(MagicCutSortField {
            field: "updatedAt",
            ascending: false,
        });
    }

    fields
}

fn parse_sort_field(value: &str) -> Option<MagicCutSortField> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    let mut parts = trimmed.split(',');
    let raw_field = parts.next()?.trim();
    let field = match raw_field {
        "name" => "name",
        "createdAt" => "createdAt",
        "updatedAt" => "updatedAt",
        _ => return None,
    };
    let ascending = parts
        .next()
        .map(|direction| direction.trim().eq_ignore_ascii_case("asc"))
        .unwrap_or(false);

    Some(MagicCutSortField { field, ascending })
}

fn document_name(document: &Value) -> String {
    document
        .as_object()
        .and_then(|object| read_map_text(object, "name"))
        .unwrap_or_default()
}

fn document_description(document: &Value) -> String {
    document
        .as_object()
        .and_then(|object| read_map_text(object, "description"))
        .unwrap_or_default()
}

fn normalize_page(value: Option<usize>) -> usize {
    value.unwrap_or(1).max(1)
}

fn normalize_page_size(value: Option<usize>) -> usize {
    value.unwrap_or(20).clamp(1, 200)
}

fn created_at_millis(document: &Value) -> i64 {
    document
        .as_object()
        .and_then(|object| object.get("createdAt"))
        .and_then(read_timestamp_millis)
        .unwrap_or_default()
}

fn updated_at_millis(document: &Value) -> i64 {
    document
        .as_object()
        .and_then(|object| object.get("updatedAt"))
        .and_then(read_timestamp_millis)
        .unwrap_or_default()
}

fn read_timestamp_millis(value: &Value) -> Option<i64> {
    match value {
        Value::Number(number) => number.as_i64(),
        Value::String(text) => text.trim().parse::<i64>().ok(),
        _ => None,
    }
}

fn current_time_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}
