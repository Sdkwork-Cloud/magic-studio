use std::collections::BTreeMap;

use serde::Serialize;

use crate::contract::ServerContract;
use crate::response::ServerResult;

const STANDARD_VERSION: &str = "2026-04-22";
const BUSINESS_KERNEL_PATH: &str = "packages/sdkwork-magic-studio-server/src-host";

const DOMAIN_STATUS_CANONICAL: &str = "canonical";
const DOMAIN_STATUS_PLANNED: &str = "planned";
const DOMAIN_STATUS_PACKAGE_LOCAL: &str = "package-local";

const EXECUTION_STATUS_READY: &str = "ready";
const EXECUTION_STATUS_MIXED: &str = "mixed";
const EXECUTION_STATUS_LIFECYCLE_ONLY: &str = "lifecycle-only";
const EXECUTION_STATUS_NOT_APPLICABLE: &str = "not-applicable";

const ADAPTER_STATUS_HOST_LOCAL: &str = "host-local";
const ADAPTER_STATUS_MIXED: &str = "mixed";
const ADAPTER_STATUS_NOT_CONFIGURED: &str = "not-configured";
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCapabilityFamilyCountRecord {
    pub family: String,
    pub route_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCapabilityRouteCountsRecord {
    pub core: usize,
    pub app: usize,
    pub admin: usize,
    pub total: usize,
    pub app_families: Vec<AppCapabilityFamilyCountRecord>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCapabilitySummaryRecord {
    pub product: String,
    pub standard_version: String,
    pub business_kernel: String,
    pub host_delivery_modes: Vec<String>,
    pub runtime_kinds: Vec<String>,
    pub api_surfaces: Vec<String>,
    pub route_counts: AppCapabilityRouteCountsRecord,
    pub extracted_domain_count: usize,
    pub planned_domain_count: usize,
    pub package_local_domain_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppCapabilityDomainRecord {
    pub key: String,
    pub name: String,
    pub surface: String,
    pub owner_package: String,
    pub path_prefix: Option<String>,
    pub route_count: usize,
    pub status: String,
    pub execution_status: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppExecutionCapabilityRecord {
    pub key: String,
    pub name: String,
    pub domain: String,
    pub path_prefix: String,
    pub route_ids: Vec<String>,
    pub operations: Vec<String>,
    pub operation_details: Vec<AppExecutionOperationRecord>,
    pub execution_status: String,
    pub adapter_status: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppExecutionOperationRecord {
    pub key: String,
    pub execution_status: String,
    pub adapter_status: String,
    pub description: String,
}

pub trait CapabilityService: Send + Sync {
    fn read_summary(&self) -> ServerResult<AppCapabilitySummaryRecord>;
    fn list_domains(&self) -> ServerResult<Vec<AppCapabilityDomainRecord>>;
    fn list_execution_capabilities(&self) -> ServerResult<Vec<AppExecutionCapabilityRecord>>;
}

pub struct StaticCapabilityService {
    contract: ServerContract,
    audio_execution_ready: bool,
    audio_adapter_status: String,
    generation_execution_ready: bool,
    generation_adapter_status: String,
    media_toolkit_ready: bool,
}

impl StaticCapabilityService {
    pub fn new(
        contract: ServerContract,
        audio_execution_ready: bool,
        audio_adapter_status: impl Into<String>,
        generation_execution_ready: bool,
        generation_adapter_status: impl Into<String>,
        media_toolkit_ready: bool,
    ) -> Self {
        Self {
            contract,
            audio_execution_ready,
            audio_adapter_status: audio_adapter_status.into(),
            generation_execution_ready,
            generation_adapter_status: generation_adapter_status.into(),
            media_toolkit_ready,
        }
    }

    fn surface_route_count(&self, surface: &str) -> usize {
        self.contract
            .routes
            .iter()
            .filter(|route| route.surface == surface)
            .count()
    }

    fn app_family_counts(&self) -> Vec<AppCapabilityFamilyCountRecord> {
        let mut counts = BTreeMap::<String, usize>::new();

        for route in &self.contract.routes {
            if route.surface != "app" {
                continue;
            }
            if let Some(family) = app_family_from_path(&route.path) {
                *counts.entry(family).or_default() += 1;
            }
        }

        let mut records = counts
            .into_iter()
            .map(|(family, route_count)| AppCapabilityFamilyCountRecord {
                family,
                route_count,
            })
            .collect::<Vec<_>>();
        records.sort_by(|left, right| {
            family_sort_index(&left.family)
                .cmp(&family_sort_index(&right.family))
                .then_with(|| left.family.cmp(&right.family))
        });
        records
    }

    fn route_count_for_prefix(&self, path_prefix: &str) -> usize {
        self.contract
            .routes
            .iter()
            .filter(|route| route.path.starts_with(path_prefix))
            .count()
    }

    fn route_count_by_ids(&self, route_ids: &[&str]) -> usize {
        self.route_ids_by_id(route_ids).len()
    }

    fn route_ids_with_prefix(&self, path_prefix: &str) -> Vec<String> {
        self.contract
            .routes
            .iter()
            .filter(|route| route.path.starts_with(path_prefix))
            .map(|route| route.id.clone())
            .collect()
    }

    fn route_ids_by_id(&self, route_ids: &[&str]) -> Vec<String> {
        route_ids
            .iter()
            .filter(|route_id| {
                self.contract
                    .routes
                    .iter()
                    .any(|route| route.id.as_str() == **route_id)
            })
            .map(|route_id| (*route_id).to_string())
            .collect()
    }

    fn capability_domains(&self) -> Vec<AppCapabilityDomainRecord> {
        vec![
            canonical_domain(
                "capabilities",
                "Capabilities Catalog",
                "app",
                "@sdkwork/magic-studio-server",
                "/api/app/v1/capabilities",
                self.route_count_for_prefix("/api/app/v1/capabilities"),
                EXECUTION_STATUS_READY,
                "Canonical architecture, domain extraction, and execution-readiness discovery APIs.",
            ),
            canonical_domain(
                "creation",
                "Creation Catalog",
                "app",
                "@sdkwork/magic-studio-server",
                "/api/app/v1/creation",
                self.route_count_for_prefix("/api/app/v1/creation"),
                EXECUTION_STATUS_READY,
                "Canonical creation discovery, reusable preset and template lifecycle, cross-feature creation session handoff, and cross-media creation history APIs for creation-facing product flows.",
            ),
            canonical_domain(
                "assets",
                "Assets",
                "app",
                "@sdkwork/magic-studio-assets",
                "/api/app/v1/assets",
                self.route_count_for_prefix("/api/app/v1/assets"),
                EXECUTION_STATUS_READY,
                "Workspace asset registry, import, categorization, and metadata management.",
            ),
            canonical_domain(
                "auth",
                "Auth",
                "app",
                "@sdkwork/magic-studio-auth",
                "/api/app/v1/auth",
                self.route_count_for_prefix("/api/app/v1/auth"),
                EXECUTION_STATUS_READY,
                "Canonical session, login, register, verification-code, and password-reset APIs.",
            ),
            canonical_domain(
                "drive",
                "Drive",
                "app",
                "@sdkwork/magic-studio-drive",
                "/api/app/v1/drive",
                self.route_count_for_prefix("/api/app/v1/drive"),
                EXECUTION_STATUS_READY,
                "Canonical file tree, content editing, uploads, moves, trash, and favorites.",
            ),
            canonical_domain(
                "generation",
                "Generation",
                "app",
                "@sdkwork/magic-studio-server",
                "/api/app/v1/generation",
                self.route_count_for_prefix("/api/app/v1/generation"),
                EXECUTION_STATUS_MIXED,
                "Canonical cross-family generation task governance plus image, video, audio, music, sfx, character, and speech task APIs with standardized lifecycle. Audio text-to-speech, transcription, and translation already execute through the generated AI SDK when configured, and the Rust host now also owns real text-to-image, prompt-guided image-to-image, image variation, image edit, host-local image upscale, text/image-to-video, full text/similar/remix/extend music execution, and image-backed character generation through the same adapter foundation.",
            ),
            canonical_domain(
                "chat",
                "Chat",
                "app",
                "@sdkwork/magic-studio-chat",
                "/api/app/v1/chat",
                self.route_count_for_prefix("/api/app/v1/chat"),
                EXECUTION_STATUS_READY,
                "Canonical chat session metadata and transcript persistence for server deployment and desktop embedding, with durable state now owned by the Rust host while provider streaming remains an explicitly separate execution concern.",
            ),
            canonical_domain(
                "notes",
                "Notes",
                "app",
                "@sdkwork/magic-studio-notes",
                "/api/app/v1/notes",
                self.route_count_for_prefix("/api/app/v1/notes"),
                EXECUTION_STATUS_READY,
                "Canonical note, folder, trash, movement, and publish flows.",
            ),
            canonical_domain(
                "presentations",
                "Presentations",
                "app",
                "@sdkwork/magic-studio-chatppt",
                "/api/app/v1/presentations",
                self.route_count_for_prefix("/api/app/v1/presentations"),
                EXECUTION_STATUS_READY,
                "Canonical presentation persistence, slide lifecycle, and host-owned editing state APIs for server deployment and desktop embedding.",
            ),
            canonical_domain(
                "notifications",
                "Notifications",
                "app",
                "@sdkwork/magic-studio-notifications",
                "/api/app/v1/notifications",
                self.route_count_for_prefix("/api/app/v1/notifications"),
                EXECUTION_STATUS_READY,
                "Canonical notification feed, unread state, and user action flows.",
            ),
            canonical_domain(
                "plugins",
                "Plugins",
                "app",
                "@sdkwork/magic-studio-plugins",
                "/api/app/v1/plugins",
                self.route_count_for_prefix("/api/app/v1/plugins"),
                EXECUTION_STATUS_READY,
                "Canonical plugin discovery surface for product-visible plugin inventory.",
            ),
            canonical_domain(
                "prompt",
                "Prompt",
                "app",
                "@sdkwork/magic-studio-prompt",
                "/api/app/v1/prompt",
                self.route_count_for_prefix("/api/app/v1/prompt"),
                EXECUTION_STATUS_READY,
                "Canonical prompt optimization APIs for generation-oriented authoring flows.",
            ),
            canonical_domain(
                "settings",
                "Settings",
                "app",
                "@sdkwork/magic-studio-settings",
                "/api/app/v1/settings",
                self.route_count_for_prefix("/api/app/v1/settings"),
                EXECUTION_STATUS_READY,
                "Canonical user-scoped application settings authority.",
            ),
            canonical_domain(
                "user",
                "User",
                "app",
                "@sdkwork/magic-studio-user",
                "/api/app/v1/user",
                self.route_count_for_prefix("/api/app/v1/user"),
                EXECUTION_STATUS_READY,
                "Canonical profile, address, credential, bindings, and history APIs.",
            ),
            canonical_domain(
                "voices",
                "Voices",
                "app",
                "@sdkwork/magic-studio-voicespeaker",
                "/api/app/v1/voices",
                self.route_count_for_prefix("/api/app/v1/voices"),
                EXECUTION_STATUS_MIXED,
                "Canonical market/workspace/custom speaker registry plus clone and speech task lifecycle APIs. Speech synthesis can execute through the generated AI SDK when configured.",
            ),
            canonical_domain(
                "workspaces",
                "Workspaces",
                "app",
                "@sdkwork/magic-studio-workspace",
                "/api/app/v1/workspaces",
                self.route_count_for_prefix("/api/app/v1/workspaces"),
                EXECUTION_STATUS_READY,
                "Canonical workspace and project topology APIs.",
            ),
            canonical_domain(
                "deployments",
                "Deployments",
                "admin",
                "@sdkwork/magic-studio-server",
                "/api/admin/v1/deployments",
                self.route_count_for_prefix("/api/admin/v1/deployments"),
                EXECUTION_STATUS_READY,
                "Canonical administrative deployment inventory and host diagnostics entrypoint.",
            ),
            canonical_domain(
                "governance",
                "Governance",
                "admin",
                "@sdkwork/magic-studio-server",
                "/api/admin/v1",
                self.route_count_by_ids(&[
                    "adminRuntimeAuditsRead",
                    "adminJobsMetricsRead",
                    "adminPolicyAuditsRead",
                    "adminStorageProvidersList",
                    "adminPluginsList",
                    "adminPluginsEnable",
                    "adminPluginsDisable",
                ]),
                EXECUTION_STATUS_READY,
                "Canonical administrative runtime audit, job metrics, policy audit, storage provider, and plugin governance APIs.",
            ),
            canonical_domain(
                "film",
                "Film",
                "app",
                "@sdkwork/magic-studio-film",
                "/api/app/v1/film",
                self.route_count_for_prefix("/api/app/v1/film"),
                EXECUTION_STATUS_READY,
                "Canonical film project, project-governance portfolio, reviewer-capacity, project-level decision-freshness, project-level governance-drift, project-level escalation-forecast, project-level dependency-graph, project-level intervention-plan, project-level recovery-orchestration, project-level approval-burn-down, project-level intervention-outcomes, project-level effectiveness-baseline, project-level intervention-execution-history, review-governance, operations-dashboard, latency-analytics, analysis, authoring, publish, import, and export APIs.",
            ),
            canonical_domain(
                "magiccut",
                "MagicCut",
                "app",
                "@sdkwork/magic-studio-magiccut",
                "/api/app/v1/magiccut",
                self.route_count_for_prefix("/api/app/v1/magiccut"),
                EXECUTION_STATUS_MIXED,
                "Canonical MagicCut project and template persistence plus honest render APIs for the server-first editing workspace. Audio-only WAV render is available today while video composition remains intentionally unavailable.",
            ),
            canonical_domain(
                "portal",
                "Portal",
                "app",
                "@sdkwork/magic-studio-portal-video",
                "/api/app/v1/portal",
                self.route_count_for_prefix("/api/app/v1/portal"),
                EXECUTION_STATUS_READY,
                "Canonical portal feed publishing, featured/discover discovery, detail, interaction, and deletion APIs are host-owned for server and desktop parity.",
            ),
            canonical_domain(
                "trade",
                "Trade",
                "app",
                "@sdkwork/magic-studio-trade",
                "/api/app/v1/trade",
                self.route_count_for_prefix("/api/app/v1/trade"),
                EXECUTION_STATUS_READY,
                "Canonical trade marketplace, order lifecycle, payment lifecycle, wallet balance, recharge, refund, and transaction-history APIs are host-owned for server and desktop parity.",
            ),
            canonical_domain(
                "vip",
                "VIP",
                "app",
                "@sdkwork/magic-studio-vip",
                "/api/app/v1/vip",
                self.route_count_for_prefix("/api/app/v1/vip"),
                EXECUTION_STATUS_READY,
                "Canonical VIP plan catalog, status, purchase orchestration, subscription history, and cancellation APIs are host-owned for server and desktop parity.",
            ),
            package_local_domain(
                "canvas-interaction",
                "Canvas Interaction",
                "@sdkwork/magic-studio-canvas",
                "Ephemeral selection, hit-testing, and interaction helpers should remain package-local.",
            ),
            package_local_domain(
                "editor-session-ui",
                "Editor Session UI",
                "@sdkwork/magic-studio-editor",
                "Editor-only session composition and presentation state should not become host APIs.",
            ),
            package_local_domain(
                "browser-presentation",
                "Browser Presentation",
                "@sdkwork/magic-studio-browser",
                "View-only browser formatting and presentation adapters should remain package-local.",
            ),
        ]
    }

    fn execution_capabilities(&self) -> Vec<AppExecutionCapabilityRecord> {
        vec![
            execution_capability(
                "creation-catalog",
                "Creation Catalog",
                "creation",
                "/api/app/v1/creation",
                self.route_ids_by_id(&[
                    "appCreationReadCapabilities",
                    "appCreationCreateSession",
                    "appCreationReadCurrentSession",
                    "appCreationConsumeCurrentSession",
                    "appCreationClearCurrentSession",
                ]),
                &["read-target-capabilities"],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Creation capability discovery and creation session handoff are executed directly inside the host-owned Rust business kernel and act as the authoritative transport for target, channel, model, style, and portal-to-generation session transfer.",
            ),
            execution_capability(
                "creation-presets",
                "Creation Presets",
                "creation",
                "/api/app/v1/creation/presets",
                self.route_ids_by_id(&[
                    "appCreationListPresets",
                    "appCreationCreatePreset",
                    "appCreationReadPreset",
                    "appCreationUpdatePreset",
                    "appCreationDeletePreset",
                ]),
                &[
                    "list-presets",
                    "create-preset",
                    "read-preset",
                    "update-preset",
                    "delete-preset",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Reusable single-step creation defaults are persisted inside the Rust host so preset lifecycle stays identical across standalone server deployment and desktop embedding.",
            ),
            execution_capability(
                "creation-templates",
                "Creation Templates",
                "creation",
                "/api/app/v1/creation/templates",
                self.route_ids_by_id(&[
                    "appCreationListTemplates",
                    "appCreationCreateTemplate",
                    "appCreationReadTemplate",
                    "appCreationUpdateTemplate",
                    "appCreationDeleteTemplate",
                    "appCreationApplyTemplate",
                ]),
                &[
                    "list-templates",
                    "create-template",
                    "read-template",
                    "update-template",
                    "delete-template",
                    "apply-template",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Reusable multi-step creation recipes are persisted and resolved inside the Rust host, and template apply materializes a canonical current creation session instead of relying on browser-local workflow composition.",
            ),
            execution_capability(
                "creation-session-handoff",
                "Creation Session Handoff",
                "creation",
                "/api/app/v1/creation",
                self.route_ids_by_id(&[
                    "appCreationCreateSession",
                    "appCreationReadCurrentSession",
                    "appCreationConsumeCurrentSession",
                    "appCreationClearCurrentSession",
                ]),
                &["create-current-session", "read-current-session", "consume-current-session", "clear-current-session"],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Cross-surface creation launch context handoff is persisted and consumed inside the Rust host so standalone server deployment and desktop embedding share the same creation session semantics.",
            ),
            execution_capability(
                "creation-history",
                "Creation History",
                "creation",
                "/api/app/v1/creation/history",
                self.route_ids_by_id(&[
                    "appCreationReadHistoryEntry",
                    "appCreationListHistory",
                    "appCreationUpsertHistoryEntry",
                    "appCreationFavoriteHistoryEntry",
                    "appCreationDeleteHistoryEntry",
                    "appCreationClearHistory",
                ]),
                &[
                    "read-history-entry",
                    "list-history",
                    "upsert-history-entry",
                    "favorite-history-entry",
                    "delete-history-entry",
                    "clear-history",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Cross-media creation history is persisted inside the Rust host so generated tasks and imported entries share one canonical history surface across standalone server deployment and desktop embedding.",
            ),
            execution_capability(
                "prompt-optimization",
                "Prompt Optimization",
                "prompt",
                "/api/app/v1/prompt",
                self.route_ids_by_id(&["appPromptOptimize"]),
                &["optimize"],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Prompt rewriting and optimization are executed directly inside the host without a provider adapter.",
            ),
            execution_capability_with_operation_details(
                "generation-task-governance",
                "Generation Task Governance",
                "generation/tasks",
                "/api/app/v1/generation/tasks",
                self.route_ids_by_id(&[
                    "appGenerationListTasks",
                    "appGenerationReadTask",
                    "appGenerationDeleteTask",
                    "appGenerationCancelTask",
                ]),
                &["list-tasks", "read-task", "delete-task", "cancel-task"],
                vec![
                    execution_operation(
                        "list-tasks",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Cross-family generation task listing executes through the canonical host governance layer, merging the generation registry with canonical voice speech task persistence.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Cross-family generation task lookup executes through the canonical host governance layer, merging the generation registry with canonical voice speech task persistence.",
                    ),
                    execution_operation(
                        "delete-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Cross-family generation task deletion executes through the canonical host governance layer, including canonical voice speech task persistence.",
                    ),
                    execution_operation(
                        "cancel-task",
                        EXECUTION_STATUS_MIXED,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Canonical governance cancel delegates to real host-owned cancel semantics for video, sfx, character, and speech tasks, and returns an explicit unsupported error for products whose task families do not yet own canonical cancellation.",
                    ),
                ],
                EXECUTION_STATUS_MIXED,
                ADAPTER_STATUS_HOST_LOCAL,
                "Cross-family generation task listing, lookup, deletion, and honest cancel governance execute through the canonical host governance layer, merging the generation registry with canonical voice speech task persistence across image, video, audio, music, sfx, character, and speech records.",
            ),
            execution_capability_with_operation_details(
                "image-generation",
                "Image Generation",
                "generation/images",
                "/api/app/v1/generation/images",
                self.route_ids_with_prefix("/api/app/v1/generation/images"),
                &["create", "variation", "edit", "upscale", "enhance-prompt", "read-task"],
                vec![
                    execution_operation(
                        "create",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Text-to-image generation runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "variation",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Image variation requests run through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "edit",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Image edit requests run through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "upscale",
                        if self.media_toolkit_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.media_toolkit_ready {
                            ADAPTER_STATUS_HOST_LOCAL
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        if self.media_toolkit_ready {
                            "Image upscale executes directly through the host-local Rust media runtime."
                        } else {
                            "Image upscale is standardized as a canonical lifecycle contract, but the host-local media toolkit is not available in the current runtime."
                        },
                    ),
                    execution_operation(
                        "enhance-prompt",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Prompt enhancement executes directly inside the Rust host without a provider dependency.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task lookup executes directly against canonical host persistence.",
                    ),
                ],
                EXECUTION_STATUS_MIXED,
                if self.generation_execution_ready && self.media_toolkit_ready {
                    ADAPTER_STATUS_MIXED
                } else if self.generation_execution_ready {
                    self.generation_adapter_status.as_str()
                } else if self.media_toolkit_ready {
                    ADAPTER_STATUS_HOST_LOCAL
                } else {
                    ADAPTER_STATUS_NOT_CONFIGURED
                },
                if self.generation_execution_ready && self.media_toolkit_ready {
                    "Canonical image generation now executes through the generated AI SDK for text-to-image, prompt-guided image-to-image, variation, and edit requests, while upscale executes host-locally through the shared Rust media runtime."
                } else if self.generation_execution_ready {
                    "Canonical image generation now executes through the generated AI SDK for text-to-image, prompt-guided image-to-image, variation, and edit requests, while upscale remains unavailable until the host-local media toolkit is present."
                } else if self.media_toolkit_ready {
                    "Canonical image prompt enhancement, task lookup, and host-local upscale already execute inside the Rust host, while provider-backed image generation operations remain lifecycle-only until the unified adapter layer is configured."
                } else {
                    "Canonical image prompt enhancement and task lookup already execute inside the host, while provider-backed image generation operations remain lifecycle-only until the unified adapter layer is configured."
                },
            ),
            execution_capability_with_operation_details(
                "video-generation",
                "Video Generation",
                "generation/videos",
                "/api/app/v1/generation/videos",
                self.route_ids_with_prefix("/api/app/v1/generation/videos"),
                &[
                    "create",
                    "image-to-video",
                    "extend",
                    "style-transfer",
                    "lip-sync",
                    "enhance-prompt",
                    "read-task",
                    "cancel-task",
                ],
                vec![
                    execution_operation(
                        "create",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Text-to-video generation runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "image-to-video",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Image-to-video generation runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "extend",
                        EXECUTION_STATUS_LIFECYCLE_ONLY,
                        ADAPTER_STATUS_NOT_CONFIGURED,
                        "Video extend is standardized as a canonical lifecycle contract, but no real upstream execution adapter is wired yet.",
                    ),
                    execution_operation(
                        "style-transfer",
                        EXECUTION_STATUS_LIFECYCLE_ONLY,
                        ADAPTER_STATUS_NOT_CONFIGURED,
                        "Video style-transfer is standardized as a canonical lifecycle contract, but no real upstream execution adapter is wired yet.",
                    ),
                    execution_operation(
                        "lip-sync",
                        EXECUTION_STATUS_LIFECYCLE_ONLY,
                        ADAPTER_STATUS_NOT_CONFIGURED,
                        "Video lip-sync is standardized as a canonical lifecycle contract, but no real upstream execution adapter is wired yet.",
                    ),
                    execution_operation(
                        "enhance-prompt",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Prompt enhancement executes directly inside the Rust host without a provider dependency.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task lookup executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "cancel-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task cancellation metadata is persisted directly inside the host.",
                    ),
                ],
                EXECUTION_STATUS_MIXED,
                if self.generation_execution_ready {
                    self.generation_adapter_status.as_str()
                } else {
                    ADAPTER_STATUS_NOT_CONFIGURED
                },
                if self.generation_execution_ready {
                    "Canonical video generation now executes through the generated AI SDK for text-to-video and image-to-video requests, while extend, style-transfer, and lip-sync remain standardized lifecycle contracts until a real upstream adapter is selected."
                } else {
                    "Canonical video task lifecycle is standardized, but provider execution is still pending the unified adapter layer."
                },
            ),
            execution_capability_with_operation_details(
                "audio-generation",
                "Audio Generation",
                "generation/audio",
                "/api/app/v1/generation/audio",
                self.route_ids_with_prefix("/api/app/v1/generation/audio"),
                &["text-to-speech", "transcription", "translation", "read-task"],
                vec![
                    execution_operation(
                        "text-to-speech",
                        if self.audio_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.audio_execution_ready {
                            self.audio_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Text-to-speech runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "transcription",
                        if self.audio_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.audio_execution_ready {
                            self.audio_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Audio transcription runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "translation",
                        if self.audio_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.audio_execution_ready {
                            self.audio_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Audio translation runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task lookup executes directly against canonical host persistence.",
                    ),
                ],
                if self.audio_execution_ready {
                    EXECUTION_STATUS_READY
                } else {
                    EXECUTION_STATUS_MIXED
                },
                if self.audio_execution_ready {
                    self.audio_adapter_status.as_str()
                } else {
                    ADAPTER_STATUS_NOT_CONFIGURED
                },
                if self.audio_execution_ready {
                    "Audio text-to-speech, transcription, and translation execute through the generated AI SDK adapter, with host-owned task persistence and normalized audio/text artifacts."
                } else {
                    "Canonical audio task lifecycle is standardized, but provider execution is still pending the unified adapter layer."
                },
            ),
            execution_capability_with_operation_details(
                "music-generation",
                "Music Generation",
                "generation/music",
                "/api/app/v1/generation/music",
                self.route_ids_with_prefix("/api/app/v1/generation/music"),
                &["create", "similar", "remix", "extend", "read-task"],
                vec![
                    execution_operation(
                        "create",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Text-to-music generation runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "similar",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Reference-guided similar-music generation runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "remix",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Reference-guided music remix runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "extend",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Reference-guided music extend runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task lookup executes directly against canonical host persistence.",
                    ),
                ],
                if self.generation_execution_ready {
                    EXECUTION_STATUS_READY
                } else {
                    EXECUTION_STATUS_MIXED
                },
                if self.generation_execution_ready {
                    self.generation_adapter_status.as_str()
                } else {
                    ADAPTER_STATUS_NOT_CONFIGURED
                },
                if self.generation_execution_ready {
                    "Canonical music generation now executes through the generated AI SDK for text-to-music, similar, remix, and extend workflows, with one host-owned task model across server and desktop deployment."
                } else {
                    "Canonical music task lifecycle is standardized, but provider execution is still pending the unified adapter layer."
                },
            ),
            execution_capability_with_operation_details(
                "sfx-generation",
                "SFX Generation",
                "generation/sfx",
                "/api/app/v1/generation/sfx",
                self.route_ids_with_prefix("/api/app/v1/generation/sfx"),
                &["create", "list-tasks", "list-categories", "read-task", "cancel-task"],
                vec![
                    execution_operation(
                        "create",
                        EXECUTION_STATUS_LIFECYCLE_ONLY,
                        ADAPTER_STATUS_NOT_CONFIGURED,
                        "SFX generation is standardized as a canonical lifecycle contract, but no real upstream execution adapter is wired yet.",
                    ),
                    execution_operation(
                        "list-tasks",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "SFX task listing executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "list-categories",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "SFX category discovery executes directly inside the host.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task lookup executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "cancel-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Task cancellation executes directly against canonical host persistence.",
                    ),
                ],
                EXECUTION_STATUS_MIXED,
                ADAPTER_STATUS_NOT_CONFIGURED,
                "Canonical SFX task create/list/read/cancel lifecycle plus category discovery are standardized, but provider execution is still pending the unified adapter layer.",
            ),
            execution_capability_with_operation_details(
                "character-generation",
                "Character Generation",
                "generation/characters",
                "/api/app/v1/generation/characters",
                self.route_ids_with_prefix("/api/app/v1/generation/characters"),
                &["create", "list", "read-task", "cancel-task"],
                vec![
                    execution_operation(
                        "create",
                        if self.generation_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.generation_execution_ready {
                            self.generation_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Character generation runs through the canonical Rust image execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "list",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Character task listing executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "read-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Character task lookup executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "cancel-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Character task cancellation metadata is persisted directly inside the host.",
                    ),
                ],
                if self.generation_execution_ready {
                    EXECUTION_STATUS_READY
                } else {
                    EXECUTION_STATUS_MIXED
                },
                if self.generation_execution_ready {
                    self.generation_adapter_status.as_str()
                } else {
                    ADAPTER_STATUS_NOT_CONFIGURED
                },
                if self.generation_execution_ready {
                    "Canonical character generation now executes through the shared Rust image adapter, while list/read/cancel remain host-local task lifecycle operations."
                } else {
                    "Canonical character task lifecycle, listing, lookup, and cancellation are standardized, but provider execution is still pending the unified adapter layer."
                },
            ),
            execution_capability(
                "voice-speaker-registry",
                "Voice Speaker Registry",
                "voices",
                "/api/app/v1/voices",
                self.route_ids_by_id(&[
                    "appVoicesListMarket",
                    "appVoicesListWorkspace",
                    "appVoicesListCustom",
                    "appVoicesCreateCustom",
                    "appVoicesUpdateCustom",
                    "appVoicesDeleteCustom",
                    "appVoicesReadSpeaker",
                    "appVoicesUpdatePreview",
                ]),
                &[
                    "list-market",
                    "list-workspace",
                    "list-custom",
                    "create-custom",
                    "update-custom",
                    "delete-custom",
                    "read-speaker",
                    "update-preview",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Speaker registry, preview metadata, and custom-voice persistence are canonical host-owned capabilities.",
            ),
            execution_capability_with_operation_details(
                "voice-clone-tasks",
                "Voice Clone Tasks",
                "voices",
                "/api/app/v1/voices/clone-tasks",
                self.route_ids_by_id(&[
                    "appVoicesListCloneTasks",
                    "appVoicesCreateCloneTask",
                    "appVoicesReadCloneTask",
                    "appVoicesDeleteCloneTask",
                    "appVoicesCancelCloneTask",
                ]),
                &[
                    "list-clone-tasks",
                    "create-clone-task",
                    "read-clone-task",
                    "delete-clone-task",
                    "cancel-clone-task",
                ],
                vec![
                    execution_operation(
                        "list-clone-tasks",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Clone-task listing executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "create-clone-task",
                        EXECUTION_STATUS_LIFECYCLE_ONLY,
                        ADAPTER_STATUS_NOT_CONFIGURED,
                        "Clone-task creation is standardized, but without a real upstream adapter the host returns an honest non-executed failed task record and does not report provider success.",
                    ),
                    execution_operation(
                        "read-clone-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Clone-task lookup executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "delete-clone-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Clone-task deletion executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "cancel-clone-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Clone-task cancellation metadata is persisted directly inside the host.",
                    ),
                ],
                EXECUTION_STATUS_MIXED,
                ADAPTER_STATUS_NOT_CONFIGURED,
                "Canonical clone-task lifecycle is standardized, but provider execution is still pending the unified adapter layer and the host reports provider execution as unavailable until that adapter exists.",
            ),
            execution_capability_with_operation_details(
                "voice-speech-tasks",
                "Voice Speech Tasks",
                "voices",
                "/api/app/v1/voices/speech/tasks",
                self.route_ids_by_id(&[
                    "appVoicesListSpeechTasks",
                    "appVoicesCreateSpeechTask",
                    "appVoicesReadSpeechTask",
                    "appVoicesUpsertSpeechTask",
                    "appVoicesUpdateSpeechTask",
                    "appVoicesDeleteSpeechTask",
                    "appVoicesCancelSpeechTask",
                ]),
                &[
                    "list-speech-tasks",
                    "create-speech-task",
                    "read-speech-task",
                    "upsert-speech-task",
                    "update-speech-task",
                    "delete-speech-task",
                    "cancel-speech-task",
                ],
                vec![
                    execution_operation(
                        "list-speech-tasks",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Speech-task listing executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "create-speech-task",
                        if self.audio_execution_ready {
                            EXECUTION_STATUS_READY
                        } else {
                            EXECUTION_STATUS_LIFECYCLE_ONLY
                        },
                        if self.audio_execution_ready {
                            self.audio_adapter_status.as_str()
                        } else {
                            ADAPTER_STATUS_NOT_CONFIGURED
                        },
                        "Speech synthesis runs through the canonical Rust execution adapter when an upstream provider is configured.",
                    ),
                    execution_operation(
                        "read-speech-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Speech-task lookup executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "upsert-speech-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Speech-task upsert persists imported or external task state directly inside the host.",
                    ),
                    execution_operation(
                        "update-speech-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Speech-task metadata updates execute directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "delete-speech-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Speech-task deletion executes directly against canonical host persistence.",
                    ),
                    execution_operation(
                        "cancel-speech-task",
                        EXECUTION_STATUS_READY,
                        ADAPTER_STATUS_HOST_LOCAL,
                        "Speech-task cancellation metadata is persisted directly inside the host.",
                    ),
                ],
                if self.audio_execution_ready {
                    EXECUTION_STATUS_READY
                } else {
                    EXECUTION_STATUS_MIXED
                },
                if self.audio_execution_ready {
                    self.audio_adapter_status.as_str()
                } else {
                    ADAPTER_STATUS_NOT_CONFIGURED
                },
                if self.audio_execution_ready {
                    "Canonical speech-task execution is handled through the generated AI SDK adapter, with task persistence and artifact metadata owned by the host."
                } else {
                    "Canonical speech-task lifecycle is standardized, but provider execution is still pending the unified adapter layer."
                },
            ),
            execution_capability(
                "chat",
                "Chat",
                "chat",
                "/api/app/v1/chat",
                self.route_ids_by_id(&[
                    "appChatListSessions",
                    "appChatCreateSession",
                    "appChatReadSession",
                    "appChatUpdateSession",
                    "appChatDeleteSession",
                    "appChatReadTranscript",
                    "appChatUpdateTranscript",
                ]),
                &[
                    "list-sessions",
                    "create-session",
                    "read-session",
                    "update-session",
                    "delete-session",
                    "read-transcript",
                    "update-transcript",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical chat durable state is executed directly inside the host-owned Rust business kernel with file-backed session and transcript persistence shared by server deployment and desktop embedding. Streaming model execution intentionally remains outside this capability until the host owns real moderation, attachment, and provider-policy semantics.",
            ),
            execution_capability(
                "presentations",
                "Presentations",
                "presentations",
                "/api/app/v1/presentations",
                self.route_ids_by_id(&[
                    "appPresentationsList",
                    "appPresentationsCreate",
                    "appPresentationsRead",
                    "appPresentationsUpdate",
                    "appPresentationsDelete",
                    "appPresentationsCreateSlide",
                    "appPresentationsUpdateSlide",
                ]),
                &[
                    "list-presentations",
                    "create-presentation",
                    "read-presentation",
                    "update-presentation",
                    "delete-presentation",
                    "create-slide",
                    "update-slide",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical presentation persistence and slide mutation are executed directly inside the host-owned Rust business kernel with durable app-owned storage shared by server deployment and desktop embedding.",
            ),
            execution_capability(
                "magiccut-workspace",
                "MagicCut Workspace",
                "magiccut",
                "/api/app/v1/magiccut",
                self.route_ids_with_prefix("/api/app/v1/magiccut"),
                &[
                    "project-lifecycle",
                    "template-lifecycle",
                    "render-capabilities",
                    "render-jobs",
                    "render-artifacts",
                ],
                EXECUTION_STATUS_MIXED,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical MagicCut authoring and render execution are host-owned. Audio-only WAV render is supported today, while video composition stays intentionally unavailable until a real server-side engine exists.",
            ),
            execution_capability(
                "portal-feed",
                "Portal Feed",
                "portal",
                "/api/app/v1/portal",
                self.route_ids_by_id(&[
                    "appPortalFeedsCreate",
                    "appPortalFeedsListFeatured",
                    "appPortalFeedsListDiscover",
                    "appPortalFeedsRead",
                    "appPortalFeedsLike",
                    "appPortalFeedsUnlike",
                    "appPortalFeedsCollect",
                    "appPortalFeedsUncollect",
                    "appPortalFeedsShare",
                    "appPortalFeedsDelete",
                ]),
                &[
                    "create-feed",
                    "list-featured",
                    "list-discover",
                    "read-feed",
                    "like-feed",
                    "unlike-feed",
                    "collect-feed",
                    "uncollect-feed",
                    "share-feed",
                    "delete-feed",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical portal community feed publish, discovery, detail, interaction, and deletion flows are executed directly inside the host-owned Rust business kernel with durable app-owned storage.",
            ),
            execution_capability(
                "trade-marketplace",
                "Trade Marketplace",
                "trade",
                "/api/app/v1/trade/tasks",
                self.route_ids_by_id(&[
                    "appTradeTasksListAvailable",
                    "appTradeTasksListPublished",
                    "appTradeTasksListAccepted",
                    "appTradeTasksRead",
                    "appTradeTasksAccept",
                    "appTradeTasksSubmit",
                    "appTradeTasksApprove",
                    "appTradeTasksCancel",
                ]),
                &[
                    "list-available",
                    "list-published",
                    "list-accepted",
                    "read-task",
                    "accept-task",
                    "submit-task",
                    "approve-task",
                    "cancel-task",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical trade marketplace discovery, acceptance, delivery submission, approval, and cancellation are executed directly inside the host-owned Rust business kernel with durable app-owned storage.",
            ),
            execution_capability(
                "trade-commerce",
                "Trade Commerce",
                "trade",
                "/api/app/v1/trade",
                self.route_ids_by_id(&[
                    "appTradeOrdersList",
                    "appTradeOrdersRead",
                    "appTradeOrdersCreate",
                    "appTradeOrdersUpdateStatus",
                    "appTradeOrdersCancel",
                    "appTradeOrdersDelete",
                    "appTradeOrdersReadStatistics",
                    "appTradePaymentsList",
                    "appTradePaymentsRead",
                    "appTradePaymentsCreate",
                    "appTradePaymentsRefund",
                    "appTradePaymentsRecharge",
                    "appTradeWalletRead",
                    "appTradeTransactionsList",
                ]),
                &[
                    "list-orders",
                    "read-order",
                    "create-order",
                    "update-order-status",
                    "cancel-order",
                    "delete-order",
                    "read-order-statistics",
                    "list-payments",
                    "read-payment",
                    "create-payment",
                    "refund-payment",
                    "recharge-wallet",
                    "read-wallet",
                    "list-transactions",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical trade order lifecycle, payment initiation, refund, recharge, wallet read-models, and transaction history are executed directly inside the host-owned Rust business kernel with durable app-owned storage.",
            ),
            execution_capability(
                "film-pipeline",
                "Film Pipeline",
                "film",
                "/api/app/v1/film",
                self.route_ids_with_prefix("/api/app/v1/film"),
                &[
                    "project-lifecycle",
                    "project-review-portfolio",
                    "project-reviewer-capacity",
                    "project-review-decision-freshness",
                    "project-review-governance-drift",
                    "project-review-escalation-forecast",
                    "project-review-dependency-graph",
                    "project-review-intervention-plan",
                    "project-review-recovery-orchestration",
                    "project-review-approval-burn-down",
                    "project-review-intervention-outcomes",
                    "project-review-effectiveness-baseline",
                    "project-review-intervention-execution-history",
                    "preset-catalog",
                    "template-lifecycle",
                    "review-governance",
                    "review-operations-dashboard",
                    "review-latency-analytics",
                    "storyboard-publish",
                    "analysis",
                    "authoring",
                    "asset-binding",
                    "import-package",
                    "export-package",
                ],
                EXECUTION_STATUS_READY,
                ADAPTER_STATUS_HOST_LOCAL,
                "Canonical film authoring, project-level review portfolio, reviewer-capacity supervision, project-level decision-freshness supervision, project-level governance-drift supervision, project-level escalation forecasting, project-level dependency graph projection, project-level intervention planning, project-level recovery orchestration, project-level approval burn-down supervision, project-level intervention outcome supervision, project-level effectiveness baselining, project-level intervention execution history, publish-level review governance, operations dashboard, latency analytics, publish orchestration, analysis, import, and export are executed directly inside the host-owned Rust business kernel.",
            ),
        ]
    }
}

impl CapabilityService for StaticCapabilityService {
    fn read_summary(&self) -> ServerResult<AppCapabilitySummaryRecord> {
        let domains = self.capability_domains();
        let extracted_domain_count = domains
            .iter()
            .filter(|domain| domain.status == DOMAIN_STATUS_CANONICAL)
            .count();
        let planned_domain_count = domains
            .iter()
            .filter(|domain| domain.status == DOMAIN_STATUS_PLANNED)
            .count();
        let package_local_domain_count = domains
            .iter()
            .filter(|domain| domain.status == DOMAIN_STATUS_PACKAGE_LOCAL)
            .count();

        let core = self.surface_route_count("core");
        let app = self.surface_route_count("app");
        let admin = self.surface_route_count("admin");

        Ok(AppCapabilitySummaryRecord {
            product: "magic-studio".to_string(),
            standard_version: STANDARD_VERSION.to_string(),
            business_kernel: BUSINESS_KERNEL_PATH.to_string(),
            host_delivery_modes: vec![
                "server-deployment".to_string(),
                "desktop-embedded".to_string(),
            ],
            runtime_kinds: vec![
                "web".to_string(),
                "server".to_string(),
                "desktop".to_string(),
            ],
            api_surfaces: vec!["core".to_string(), "app".to_string(), "admin".to_string()],
            route_counts: AppCapabilityRouteCountsRecord {
                core,
                app,
                admin,
                total: core + app + admin,
                app_families: self.app_family_counts(),
            },
            extracted_domain_count,
            planned_domain_count,
            package_local_domain_count,
        })
    }

    fn list_domains(&self) -> ServerResult<Vec<AppCapabilityDomainRecord>> {
        Ok(self.capability_domains())
    }

    fn list_execution_capabilities(&self) -> ServerResult<Vec<AppExecutionCapabilityRecord>> {
        Ok(self.execution_capabilities())
    }
}

fn canonical_domain(
    key: &str,
    name: &str,
    surface: &str,
    owner_package: &str,
    path_prefix: &str,
    route_count: usize,
    execution_status: &str,
    description: &str,
) -> AppCapabilityDomainRecord {
    AppCapabilityDomainRecord {
        key: key.to_string(),
        name: name.to_string(),
        surface: surface.to_string(),
        owner_package: owner_package.to_string(),
        path_prefix: Some(path_prefix.to_string()),
        route_count,
        status: DOMAIN_STATUS_CANONICAL.to_string(),
        execution_status: execution_status.to_string(),
        description: description.to_string(),
    }
}

fn package_local_domain(
    key: &str,
    name: &str,
    owner_package: &str,
    description: &str,
) -> AppCapabilityDomainRecord {
    AppCapabilityDomainRecord {
        key: key.to_string(),
        name: name.to_string(),
        surface: DOMAIN_STATUS_PACKAGE_LOCAL.to_string(),
        owner_package: owner_package.to_string(),
        path_prefix: None,
        route_count: 0,
        status: DOMAIN_STATUS_PACKAGE_LOCAL.to_string(),
        execution_status: EXECUTION_STATUS_NOT_APPLICABLE.to_string(),
        description: description.to_string(),
    }
}

fn execution_capability(
    key: &str,
    name: &str,
    domain: &str,
    path_prefix: &str,
    route_ids: Vec<String>,
    operations: &[&str],
    execution_status: &str,
    adapter_status: &str,
    description: &str,
) -> AppExecutionCapabilityRecord {
    execution_capability_with_operation_details(
        key,
        name,
        domain,
        path_prefix,
        route_ids,
        operations,
        uniform_operation_details(operations, execution_status, adapter_status, description),
        execution_status,
        adapter_status,
        description,
    )
}

fn execution_capability_with_operation_details(
    key: &str,
    name: &str,
    domain: &str,
    path_prefix: &str,
    route_ids: Vec<String>,
    operations: &[&str],
    operation_details: Vec<AppExecutionOperationRecord>,
    execution_status: &str,
    adapter_status: &str,
    description: &str,
) -> AppExecutionCapabilityRecord {
    AppExecutionCapabilityRecord {
        key: key.to_string(),
        name: name.to_string(),
        domain: domain.to_string(),
        path_prefix: path_prefix.to_string(),
        route_ids,
        operations: operations.iter().map(|item| (*item).to_string()).collect(),
        operation_details,
        execution_status: execution_status.to_string(),
        adapter_status: adapter_status.to_string(),
        description: description.to_string(),
    }
}

fn uniform_operation_details(
    operations: &[&str],
    execution_status: &str,
    adapter_status: &str,
    description: &str,
) -> Vec<AppExecutionOperationRecord> {
    operations
        .iter()
        .map(|operation| {
            execution_operation(operation, execution_status, adapter_status, description)
        })
        .collect()
}

fn execution_operation(
    key: &str,
    execution_status: &str,
    adapter_status: &str,
    description: &str,
) -> AppExecutionOperationRecord {
    AppExecutionOperationRecord {
        key: key.to_string(),
        execution_status: execution_status.to_string(),
        adapter_status: adapter_status.to_string(),
        description: description.to_string(),
    }
}

fn app_family_from_path(path: &str) -> Option<String> {
    let trimmed = path.strip_prefix("/api/app/v1/")?;
    let mut segments = trimmed.split('/').filter(|segment| !segment.is_empty());
    let first = segments.next()?;

    if first == "generation" {
        let second = segments.next()?;
        return Some(format!("generation/{second}"));
    }

    Some(first.to_string())
}

fn family_sort_index(family: &str) -> usize {
    match family {
        "capabilities" => 0,
        "creation" => 1,
        "assets" => 2,
        "auth" => 3,
        "drive" => 4,
        "generation/tasks" => 5,
        "generation/images" => 6,
        "generation/videos" => 7,
        "generation/audio" => 8,
        "generation/catalog" => 9,
        "generation/music" => 10,
        "generation/sfx" => 11,
        "generation/characters" => 12,
        "film" => 13,
        "magiccut" => 14,
        "chat" => 15,
        "notes" => 16,
        "presentations" => 17,
        "notifications" => 18,
        "portal" => 19,
        "plugins" => 20,
        "prompt" => 21,
        "settings" => 22,
        "trade" => 23,
        "user" => 24,
        "vip" => 25,
        "voices" => 26,
        "workspaces" => 27,
        _ => usize::MAX,
    }
}
