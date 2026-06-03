use std::sync::Arc;

use super::services::{NativeSystemService, PtyService, SystemService};
use crate::shell::PtyState;

pub struct AppContext {
    system_service: Arc<dyn SystemService>,
    pty_service: Arc<dyn PtyService>,
}

impl AppContext {
    pub fn new(system_service: Arc<dyn SystemService>, pty_service: Arc<dyn PtyService>) -> Self {
        Self {
            system_service,
            pty_service,
        }
    }

    pub fn system(&self) -> Arc<dyn SystemService> {
        Arc::clone(&self.system_service)
    }

    pub fn pty(&self) -> Arc<dyn PtyService> {
        Arc::clone(&self.pty_service)
    }
}

impl Default for AppContext {
    fn default() -> Self {
        let system_service: Arc<dyn SystemService> = Arc::new(NativeSystemService::default());
        let pty_service: Arc<dyn PtyService> = Arc::new(PtyState::default());

        Self::new(system_service, pty_service)
    }
}
