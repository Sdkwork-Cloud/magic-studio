use std::sync::Arc;

use super::services::{
    AppBrowserService, BrowserService, CompressionService, DatabaseService, FileSystemService,
    InMemoryJobService, JobService, LocalFileSystemService, LocalToolkitService, MediaService,
    MigrationService, NativeCompressionService, NativePolicyService, NativeSystemService,
    PolicyService, PtyService, SqliteDatabaseService, SqliteMigrationService, SystemMediaService,
    SystemService, ToolkitService,
};
use crate::pty::PtyState;

pub struct AppContext {
    system_service: Arc<dyn SystemService>,
    policy_service: Arc<dyn PolicyService>,
    file_system_service: Arc<dyn FileSystemService>,
    media_service: Arc<dyn MediaService>,
    database_service: Arc<dyn DatabaseService>,
    migration_service: Arc<dyn MigrationService>,
    compression_service: Arc<dyn CompressionService>,
    toolkit_service: Arc<dyn ToolkitService>,
    job_service: Arc<dyn JobService>,
    pty_service: Arc<dyn PtyService>,
    browser_service: Arc<dyn BrowserService>,
}

impl AppContext {
    pub fn new(
        system_service: Arc<dyn SystemService>,
        policy_service: Arc<dyn PolicyService>,
        file_system_service: Arc<dyn FileSystemService>,
        media_service: Arc<dyn MediaService>,
        database_service: Arc<dyn DatabaseService>,
        migration_service: Arc<dyn MigrationService>,
        compression_service: Arc<dyn CompressionService>,
        toolkit_service: Arc<dyn ToolkitService>,
        job_service: Arc<dyn JobService>,
        pty_service: Arc<dyn PtyService>,
        browser_service: Arc<dyn BrowserService>,
    ) -> Self {
        Self {
            system_service,
            policy_service,
            file_system_service,
            media_service,
            database_service,
            migration_service,
            compression_service,
            toolkit_service,
            job_service,
            pty_service,
            browser_service,
        }
    }

    pub fn system(&self) -> Arc<dyn SystemService> {
        Arc::clone(&self.system_service)
    }

    pub fn file_system(&self) -> Arc<dyn FileSystemService> {
        Arc::clone(&self.file_system_service)
    }

    pub fn policy(&self) -> Arc<dyn PolicyService> {
        Arc::clone(&self.policy_service)
    }

    pub fn media(&self) -> Arc<dyn MediaService> {
        Arc::clone(&self.media_service)
    }

    pub fn database(&self) -> Arc<dyn DatabaseService> {
        Arc::clone(&self.database_service)
    }

    pub fn migration(&self) -> Arc<dyn MigrationService> {
        Arc::clone(&self.migration_service)
    }

    pub fn compression(&self) -> Arc<dyn CompressionService> {
        Arc::clone(&self.compression_service)
    }

    pub fn toolkit(&self) -> Arc<dyn ToolkitService> {
        Arc::clone(&self.toolkit_service)
    }

    pub fn jobs(&self) -> Arc<dyn JobService> {
        Arc::clone(&self.job_service)
    }

    pub fn pty(&self) -> Arc<dyn PtyService> {
        Arc::clone(&self.pty_service)
    }

    pub fn browser(&self) -> Arc<dyn BrowserService> {
        Arc::clone(&self.browser_service)
    }
}

impl Default for AppContext {
    fn default() -> Self {
        let system_service: Arc<dyn SystemService> = Arc::new(NativeSystemService::default());
        let policy_service: Arc<dyn PolicyService> = Arc::new(NativePolicyService::default());
        let file_system_service: Arc<dyn FileSystemService> =
            Arc::new(LocalFileSystemService::new(Arc::clone(&policy_service)));
        let media_service: Arc<dyn MediaService> =
            Arc::new(SystemMediaService::new(Arc::clone(&system_service)));
        let database_service: Arc<dyn DatabaseService> = Arc::new(SqliteDatabaseService::new(
            Arc::clone(&file_system_service),
            Arc::clone(&policy_service),
        ));
        let migration_service: Arc<dyn MigrationService> = Arc::new(SqliteMigrationService::new(
            Arc::clone(&file_system_service),
            Arc::clone(&policy_service),
        ));
        let compression_service: Arc<dyn CompressionService> = Arc::new(
            NativeCompressionService::new(Arc::clone(&file_system_service)),
        );
        let toolkit_service: Arc<dyn ToolkitService> = Arc::new(LocalToolkitService::new(
            Arc::clone(&media_service),
            Arc::clone(&compression_service),
            Arc::clone(&file_system_service),
            Arc::clone(&system_service),
            Arc::clone(&policy_service),
        ));
        let job_service: Arc<dyn JobService> =
            Arc::new(InMemoryJobService::new(Arc::clone(&toolkit_service)));
        let pty_service: Arc<dyn PtyService> = Arc::new(PtyState::default());
        let browser_service: Arc<dyn BrowserService> = Arc::new(AppBrowserService::default());

        Self::new(
            system_service,
            policy_service,
            file_system_service,
            media_service,
            database_service,
            migration_service,
            compression_service,
            toolkit_service,
            job_service,
            pty_service,
            browser_service,
        )
    }
}
