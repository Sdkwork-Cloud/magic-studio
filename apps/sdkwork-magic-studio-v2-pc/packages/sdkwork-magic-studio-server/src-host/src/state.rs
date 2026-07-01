use std::sync::Arc;

use crate::config::ServerConfig;
use crate::contract::ServerContract;
use crate::services::admin_governance::{AdminGovernanceService, FileBackedAdminGovernanceService};
use crate::services::app_storage::AppStoragePaths;
use crate::services::assets::{AssetService, FileBackedAssetService};
use crate::services::capabilities::{CapabilityService, StaticCapabilityService};
use crate::services::chat::{ChatService, FileBackedChatService};
use crate::services::compression::CompressionService;
use crate::services::creation::{CreationService, FileBackedCreationService};
use crate::services::creation_batches::{CreationBatchService, FileBackedCreationBatchService};
use crate::services::creation_history::{CreationHistoryService, FileBackedCreationHistoryService};
use crate::services::creation_presets::{CreationPresetService, FileBackedCreationPresetService};
use crate::services::creation_templates::{
    CreationTemplateService, FileBackedCreationTemplateService,
};
use crate::services::database::{DatabaseService, SqliteDatabaseService};
use crate::services::drive::{DriveService, FileBackedDriveService};
use crate::services::execution::{
    AudioExecutionService, CanonicalAudioExecutionService, CanonicalGenerationExecutionService,
    GenerationExecutionService,
};
use crate::services::filesystem::FileSystemService;
use crate::services::film::{FileBackedFilmService, FilmService};
use crate::services::generation::{FileBackedGenerationService, GenerationService};
use crate::services::generation_catalog::{
    CanonicalGenerationCatalogService, GenerationCatalogService,
};
use crate::services::generation_governance::{
    CanonicalGenerationGovernanceService, GenerationGovernanceService,
};
use crate::services::identity::{FileBackedIdentityService, IdentityService};
use crate::services::jobs::{InMemoryJobService, JobService};
use crate::services::magiccut::{FileBackedMagicCutService, MagicCutService};
use crate::services::magiccut_render::{FileBackedMagicCutRenderService, MagicCutRenderService};
use crate::services::media::MediaService;
use crate::services::migration::MigrationService;
use crate::services::notes::{FileBackedNoteService, NoteService};
use crate::services::notifications::{FileBackedNotificationService, NotificationService};
use crate::services::plugins::{FileBackedPluginService, PluginService};
use crate::services::policy::PolicyService;
use crate::services::portal::{FileBackedPortalService, PortalService};
use crate::services::presentations::{FileBackedPresentationService, PresentationService};
use crate::services::settings::{AppSettingsService, FileBackedAppSettingsService};
use crate::services::system::{NativeSystemService, SystemService};
use crate::services::toolkit::{LocalToolkitService, ToolkitService};
use crate::services::trade::{FileBackedTradeService, TradeService};
use crate::services::trade_commerce::{FileBackedTradeCommerceService, TradeCommerceService};
use crate::services::vip::{FileBackedVipService, VipService};
use crate::services::voices::{FileBackedVoiceService, VoiceService};
use crate::services::workspaces::{FileBackedWorkspaceService, WorkspaceService};
use crate::services::{
    compression::NativeCompressionService, filesystem::LocalFileSystemService,
    media::SystemMediaService,
};

#[derive(Clone)]
pub struct AppState {
    pub config: ServerConfig,
    pub contract: ServerContract,
    pub storage_paths: AppStoragePaths,
    pub policy_service: PolicyService,
    pub migration_service: MigrationService,
    pub file_system_service: Arc<dyn FileSystemService>,
    pub toolkit_service: Arc<dyn ToolkitService>,
    pub job_service: Arc<dyn JobService>,
    pub media_service: Arc<dyn MediaService>,
    pub compression_service: Arc<dyn CompressionService>,
    pub database_service: Arc<dyn DatabaseService>,
    pub app_settings_service: Arc<dyn AppSettingsService>,
    pub notification_service: Arc<dyn NotificationService>,
    pub plugin_service: Arc<dyn PluginService>,
    pub identity_service: Arc<dyn IdentityService>,
    pub audio_execution_service: Arc<dyn AudioExecutionService>,
    pub generation_execution_service: Arc<dyn GenerationExecutionService>,
    pub generation_service: Arc<dyn GenerationService>,
    pub generation_governance_service: Arc<dyn GenerationGovernanceService>,
    pub generation_catalog_service: Arc<dyn GenerationCatalogService>,
    pub workspace_service: Arc<dyn WorkspaceService>,
    pub asset_service: Arc<dyn AssetService>,
    pub note_service: Arc<dyn NoteService>,
    pub presentation_service: Arc<dyn PresentationService>,
    pub drive_service: Arc<dyn DriveService>,
    pub portal_service: Arc<dyn PortalService>,
    pub trade_service: Arc<dyn TradeService>,
    pub trade_commerce_service: Arc<dyn TradeCommerceService>,
    pub vip_service: Arc<dyn VipService>,
    pub voice_service: Arc<dyn VoiceService>,
    pub film_service: Arc<dyn FilmService>,
    pub magiccut_service: Arc<dyn MagicCutService>,
    pub magiccut_render_service: Arc<dyn MagicCutRenderService>,
    pub capability_service: Arc<dyn CapabilityService>,
    pub creation_service: Arc<dyn CreationService>,
    pub creation_batch_service: Arc<dyn CreationBatchService>,
    pub creation_history_service: Arc<dyn CreationHistoryService>,
    pub creation_preset_service: Arc<dyn CreationPresetService>,
    pub creation_template_service: Arc<dyn CreationTemplateService>,
    pub chat_service: Arc<dyn ChatService>,
    pub admin_governance_service: Arc<dyn AdminGovernanceService>,
}

impl AppState {
    pub fn new(config: ServerConfig, contract: ServerContract) -> Self {
        let policy_service = PolicyService::default();
        let migration_service = MigrationService::new(policy_service.clone());
        let file_system_service: Arc<dyn FileSystemService> =
            Arc::new(LocalFileSystemService::new(policy_service.clone()));
        let system_service: Arc<dyn SystemService> = Arc::new(NativeSystemService);
        let media_service: Arc<dyn MediaService> = Arc::new(SystemMediaService::new(
            Arc::clone(&system_service),
            policy_service.clone(),
        ));
        let media_toolkit_ready = media_service.media_command_available().unwrap_or(false);
        let compression_service: Arc<dyn CompressionService> = Arc::new(
            NativeCompressionService::new(Arc::clone(&file_system_service)),
        );
        let database_service: Arc<dyn DatabaseService> = Arc::new(SqliteDatabaseService::new(
            Arc::clone(&file_system_service),
            policy_service.clone(),
        ));
        let toolkit_service: Arc<dyn ToolkitService> = Arc::new(LocalToolkitService::new(
            Arc::clone(&media_service),
            Arc::clone(&compression_service),
            Arc::clone(&file_system_service),
            Arc::clone(&system_service),
            policy_service.clone(),
        ));
        let storage_paths = AppStoragePaths::from_config(&config);
        let default_shell = system_service
            .default_shell()
            .unwrap_or_else(|_| default_shell_fallback());
        let app_settings_service: Arc<dyn AppSettingsService> = Arc::new(
            FileBackedAppSettingsService::new(storage_paths.clone(), default_shell),
        );
        let notification_service: Arc<dyn NotificationService> =
            Arc::new(FileBackedNotificationService::new(storage_paths.clone()));
        let plugin_service: Arc<dyn PluginService> =
            Arc::new(FileBackedPluginService::new(storage_paths.clone()));
        let identity_service: Arc<dyn IdentityService> =
            Arc::new(FileBackedIdentityService::new(storage_paths.clone()));
        let audio_execution_service: Arc<dyn AudioExecutionService> =
            Arc::new(CanonicalAudioExecutionService::new(storage_paths.clone()));
        let generation_execution_service: Arc<dyn GenerationExecutionService> =
            Arc::new(CanonicalGenerationExecutionService::new(
                storage_paths.clone(),
                Arc::clone(&media_service),
            ));
        let generation_service: Arc<dyn GenerationService> =
            Arc::new(FileBackedGenerationService::new(
                storage_paths.clone(),
                Arc::clone(&identity_service),
                Arc::clone(&audio_execution_service),
                Arc::clone(&generation_execution_service),
            ));
        let workspace_service: Arc<dyn WorkspaceService> =
            Arc::new(FileBackedWorkspaceService::new(storage_paths.clone()));
        let asset_service: Arc<dyn AssetService> = Arc::new(FileBackedAssetService::new(
            storage_paths.clone(),
            Arc::clone(&workspace_service),
        ));
        let note_service: Arc<dyn NoteService> =
            Arc::new(FileBackedNoteService::new(storage_paths.clone()));
        let presentation_service: Arc<dyn PresentationService> =
            Arc::new(FileBackedPresentationService::new(storage_paths.clone()));
        let drive_service: Arc<dyn DriveService> =
            Arc::new(FileBackedDriveService::new(storage_paths.clone()));
        let portal_service: Arc<dyn PortalService> = Arc::new(FileBackedPortalService::new(
            storage_paths.clone(),
            Arc::clone(&identity_service),
        ));
        let trade_service: Arc<dyn TradeService> = Arc::new(FileBackedTradeService::new(
            storage_paths.clone(),
            Arc::clone(&identity_service),
        ));
        let trade_commerce_service: Arc<dyn TradeCommerceService> =
            Arc::new(FileBackedTradeCommerceService::new(
                storage_paths.clone(),
                Arc::clone(&identity_service),
            ));
        let vip_service: Arc<dyn VipService> = Arc::new(FileBackedVipService::new(
            storage_paths.clone(),
            Arc::clone(&identity_service),
            Arc::clone(&trade_commerce_service),
        ));
        let voice_service: Arc<dyn VoiceService> = Arc::new(FileBackedVoiceService::new(
            storage_paths.clone(),
            Arc::clone(&asset_service),
            Arc::clone(&identity_service),
            Arc::clone(&audio_execution_service),
        ));
        let generation_governance_service: Arc<dyn GenerationGovernanceService> =
            Arc::new(CanonicalGenerationGovernanceService::new(
                Arc::clone(&generation_service),
                Arc::clone(&voice_service),
            ));
        let film_service: Arc<dyn FilmService> = Arc::new(FileBackedFilmService::new(
            storage_paths.clone(),
            Arc::clone(&compression_service),
        ));
        let magiccut_service: Arc<dyn MagicCutService> =
            Arc::new(FileBackedMagicCutService::new(storage_paths.clone()));
        let magiccut_render_service: Arc<dyn MagicCutRenderService> =
            Arc::new(FileBackedMagicCutRenderService::new(
                storage_paths.clone(),
                Arc::clone(&magiccut_service),
                Arc::clone(&asset_service),
                Arc::clone(&media_service),
            ));
        let capability_service: Arc<dyn CapabilityService> =
            Arc::new(StaticCapabilityService::new(
                contract.clone(),
                audio_execution_service.is_configured(),
                audio_execution_service.adapter_status().to_string(),
                generation_execution_service.is_configured(),
                generation_execution_service.adapter_status().to_string(),
                media_toolkit_ready,
            ));
        let creation_service: Arc<dyn CreationService> =
            Arc::new(FileBackedCreationService::new(storage_paths.clone()));
        let generation_catalog_service: Arc<dyn GenerationCatalogService> =
            Arc::new(CanonicalGenerationCatalogService::new(
                Arc::clone(&creation_service),
                Arc::clone(&voice_service),
            ));
        let creation_history_service: Arc<dyn CreationHistoryService> =
            Arc::new(FileBackedCreationHistoryService::new(
                storage_paths.clone(),
                Arc::clone(&generation_service),
            ));
        let creation_preset_service: Arc<dyn CreationPresetService> =
            Arc::new(FileBackedCreationPresetService::new(storage_paths.clone()));
        let creation_template_service: Arc<dyn CreationTemplateService> =
            Arc::new(FileBackedCreationTemplateService::new(
                storage_paths.clone(),
                Arc::clone(&creation_service),
                Arc::clone(&creation_preset_service),
            ));
        let creation_batch_service: Arc<dyn CreationBatchService> =
            Arc::new(FileBackedCreationBatchService::new(
                storage_paths.clone(),
                Arc::clone(&creation_service),
                Arc::clone(&creation_preset_service),
                Arc::clone(&creation_template_service),
                Arc::clone(&generation_service),
                Arc::clone(&voice_service),
            ));
        let chat_service: Arc<dyn ChatService> =
            Arc::new(FileBackedChatService::new(storage_paths.clone()));
        let admin_governance_service: Arc<dyn AdminGovernanceService> =
            Arc::new(FileBackedAdminGovernanceService::new(
                storage_paths.clone(),
                Arc::clone(&workspace_service),
            ));
        let job_service: Arc<dyn JobService> =
            Arc::new(InMemoryJobService::new(Arc::clone(&toolkit_service)));

        Self {
            config,
            contract,
            storage_paths,
            policy_service,
            migration_service,
            file_system_service,
            toolkit_service,
            job_service,
            media_service,
            compression_service,
            database_service,
            app_settings_service,
            notification_service,
            plugin_service,
            identity_service,
            audio_execution_service,
            generation_execution_service,
            generation_service,
            generation_governance_service,
            generation_catalog_service,
            workspace_service,
            asset_service,
            note_service,
            presentation_service,
            drive_service,
            portal_service,
            trade_service,
            trade_commerce_service,
            vip_service,
            voice_service,
            film_service,
            magiccut_service,
            magiccut_render_service,
            capability_service,
            creation_service,
            creation_batch_service,
            creation_history_service,
            creation_preset_service,
            creation_template_service,
            chat_service,
            admin_governance_service,
        }
    }
}

fn default_shell_fallback() -> String {
    if cfg!(target_os = "windows") {
        "powershell".to_string()
    } else {
        "bash".to_string()
    }
}
