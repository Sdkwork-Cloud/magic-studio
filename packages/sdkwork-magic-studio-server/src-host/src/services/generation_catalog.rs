use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};

use super::creation::{
    CreationCapabilitiesQuery, CreationModelCapabilitiesRecord, CreationService,
    CreationStyleAssetGroupRecord,
};
use super::voices::{
    VoiceListQuery, VoiceService, VoiceSpeakerPage, VoiceSpeakerRecord, VoiceSpeakerSource,
};

const DEFAULT_VOICE_PAGE_SIZE: usize = 50;
const MAX_VOICE_PAGE_SIZE: usize = 200;
const MAX_AGGREGATE_VOICE_FETCH_SIZE: usize = 500;

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GenerationCatalogQuery {
    pub target: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationCatalogProviderModelRecord {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<CreationModelCapabilitiesRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationCatalogProviderRecord {
    pub id: String,
    pub name: String,
    pub target: String,
    pub model_count: usize,
    pub models: Vec<GenerationCatalogProviderModelRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationCatalogModelRecord {
    pub id: String,
    pub name: String,
    pub target: String,
    pub provider_id: String,
    pub provider_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<CreationModelCapabilitiesRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationCatalogStyleRecord {
    pub id: String,
    pub target: String,
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub usage: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_zh: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assets: Option<CreationStyleAssetGroupRecord>,
}

pub trait GenerationCatalogService: Send + Sync {
    fn list_providers(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<Vec<GenerationCatalogProviderRecord>>;
    fn list_models(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<Vec<GenerationCatalogModelRecord>>;
    fn list_styles(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<Vec<GenerationCatalogStyleRecord>>;
    fn list_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage>;
}

pub struct CanonicalGenerationCatalogService {
    creation_service: Arc<dyn CreationService>,
    voice_service: Arc<dyn VoiceService>,
}

impl CanonicalGenerationCatalogService {
    pub fn new(
        creation_service: Arc<dyn CreationService>,
        voice_service: Arc<dyn VoiceService>,
    ) -> Self {
        Self {
            creation_service,
            voice_service,
        }
    }

    fn read_creation_catalog(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<super::creation::CreationCapabilitiesRecord> {
        self.creation_service
            .read_capabilities(CreationCapabilitiesQuery {
                target: query.target,
            })
    }

    fn paginate_voices(
        &self,
        items: Vec<VoiceSpeakerRecord>,
        page: usize,
        page_size: usize,
    ) -> VoiceSpeakerPage {
        let total = items.len();
        let start = page.saturating_sub(1).saturating_mul(page_size);
        let paged_items = items.into_iter().skip(start).take(page_size).collect();

        VoiceSpeakerPage {
            items: paged_items,
            page,
            page_size,
            total,
        }
    }

    fn list_voices_by_source(
        &self,
        source: VoiceSpeakerSource,
        query: VoiceListQuery,
    ) -> ServerResult<VoiceSpeakerPage> {
        match source {
            VoiceSpeakerSource::Market => self.voice_service.list_market_voices(query),
            VoiceSpeakerSource::Workspace => self.voice_service.list_workspace_voices(query),
            VoiceSpeakerSource::Custom => self.voice_service.list_custom_voices(query),
        }
    }
}

impl GenerationCatalogService for CanonicalGenerationCatalogService {
    fn list_providers(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<Vec<GenerationCatalogProviderRecord>> {
        let catalog = self.read_creation_catalog(query)?;
        let target = catalog.target.clone();

        Ok(catalog
            .channels
            .into_iter()
            .map(|channel| {
                let models = channel
                    .models
                    .into_iter()
                    .map(|model| map_generation_catalog_provider_model(&target, model))
                    .collect::<Vec<_>>();

                GenerationCatalogProviderRecord {
                    id: channel.channel,
                    name: channel.name,
                    target: target.clone(),
                    model_count: models.len(),
                    models,
                }
            })
            .collect())
    }

    fn list_models(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<Vec<GenerationCatalogModelRecord>> {
        let catalog = self.read_creation_catalog(query)?;
        let target = catalog.target.clone();

        Ok(catalog
            .channels
            .into_iter()
            .flat_map(|channel| {
                let provider_id = channel.channel;
                let provider_name = channel.name;
                let target = target.clone();

                channel.models.into_iter().map(move |model| {
                    map_generation_catalog_model(
                        &target,
                        provider_id.clone(),
                        provider_name.clone(),
                        model,
                    )
                })
            })
            .collect())
    }

    fn list_styles(
        &self,
        query: GenerationCatalogQuery,
    ) -> ServerResult<Vec<GenerationCatalogStyleRecord>> {
        let catalog = self.read_creation_catalog(query)?;
        let target = catalog.target.clone();

        Ok(catalog
            .style_options
            .into_iter()
            .map(|style| GenerationCatalogStyleRecord {
                id: style.id,
                target: target.clone(),
                label: style.label,
                description: style.description,
                usage: style.usage,
                prompt: style.prompt,
                prompt_zh: style.prompt_zh,
                custom: style.custom,
                preview_color: style.preview_color,
                assets: style.assets,
            })
            .collect())
    }

    fn list_voices(&self, query: VoiceListQuery) -> ServerResult<VoiceSpeakerPage> {
        let requested_page = normalize_page(query.page);
        let requested_size = normalize_page_size(query.size);
        let source = normalize_voice_source(query.source.clone())?;

        if let Some(source) = source {
            return self.list_voices_by_source(source, query);
        }

        let aggregate_query = VoiceListQuery {
            page: Some(1),
            size: Some(MAX_AGGREGATE_VOICE_FETCH_SIZE),
            keyword: query.keyword,
            source: None,
            language: query.language,
            gender: query.gender,
            style: query.style,
            provider: query.provider,
        };

        let mut items = Vec::new();
        items.extend(
            self.voice_service
                .list_market_voices(aggregate_query.clone())?
                .items,
        );
        items.extend(
            self.voice_service
                .list_workspace_voices(aggregate_query.clone())?
                .items,
        );
        items.extend(
            self.voice_service
                .list_custom_voices(aggregate_query)?
                .items,
        );
        items.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));

        Ok(self.paginate_voices(items, requested_page, requested_size))
    }
}

fn normalize_page(value: Option<usize>) -> usize {
    value.unwrap_or(1).max(1)
}

fn normalize_page_size(value: Option<usize>) -> usize {
    match value.unwrap_or(DEFAULT_VOICE_PAGE_SIZE) {
        0 => DEFAULT_VOICE_PAGE_SIZE,
        provided => provided.min(MAX_VOICE_PAGE_SIZE),
    }
}

fn normalize_voice_source(value: Option<String>) -> ServerResult<Option<VoiceSpeakerSource>> {
    let Some(normalized) = value
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| !value.is_empty())
    else {
        return Ok(None);
    };

    match normalized.as_str() {
        "market" => Ok(Some(VoiceSpeakerSource::Market)),
        "workspace" => Ok(Some(VoiceSpeakerSource::Workspace)),
        "custom" => Ok(Some(VoiceSpeakerSource::Custom)),
        _ => Err(ServerError::bad_request(
            "APP_GENERATION_CATALOG_VOICE_SOURCE_INVALID",
            "source must be one of market, workspace, or custom",
        )),
    }
}

fn map_generation_catalog_provider_model(
    target: &str,
    model: super::creation::CreationModelRecord,
) -> GenerationCatalogProviderModelRecord {
    let super::creation::CreationModelRecord {
        model: raw_model,
        name,
        description,
        model_key,
        model_type,
        capabilities,
        ..
    } = model;
    let (id, model_key) = canonicalize_generation_catalog_model_key(target, raw_model, model_key);

    GenerationCatalogProviderModelRecord {
        id,
        name,
        model_key,
        description,
        model_type,
        capabilities,
    }
}

fn map_generation_catalog_model(
    target: &str,
    provider_id: String,
    provider_name: String,
    model: super::creation::CreationModelRecord,
) -> GenerationCatalogModelRecord {
    let super::creation::CreationModelRecord {
        model: raw_model,
        name,
        description,
        model_key,
        model_type,
        capabilities,
        ..
    } = model;
    let (id, model_key) = canonicalize_generation_catalog_model_key(target, raw_model, model_key);

    GenerationCatalogModelRecord {
        id,
        name,
        target: target.to_string(),
        provider_id,
        provider_name,
        model_key,
        description,
        model_type,
        capabilities,
    }
}

fn canonicalize_generation_catalog_model_key(
    target: &str,
    raw_model: String,
    existing_model_key: Option<String>,
) -> (String, Option<String>) {
    let canonical_id = if is_speech_generation_target(target) {
        match raw_model.as_str() {
            "gemini-2.5-flash-tts" => "gemini-tts".to_string(),
            "azure-speech" => "azure-tts".to_string(),
            _ => raw_model.clone(),
        }
    } else {
        raw_model.clone()
    };

    let model_key = if canonical_id != raw_model {
        Some(raw_model)
    } else {
        existing_model_key.and_then(|value| {
            let normalized = value.trim().to_string();
            if normalized.is_empty() {
                None
            } else {
                Some(normalized)
            }
        })
    };

    (canonical_id, model_key)
}

fn is_speech_generation_target(target: &str) -> bool {
    matches!(
        target
            .trim()
            .to_ascii_lowercase()
            .replace('-', "_")
            .as_str(),
        "speech" | "audio" | "voice"
    )
}
