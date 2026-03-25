use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::policy::{NativePolicyService, PathAccessType, PolicyService};
use crate::framework::services::FileSystemService;

const MIGRATION_TABLE_NAME: &str = "__framework_migrations";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationScript {
    pub version: i64,
    pub name: String,
    pub sql: String,
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationPlan {
    #[serde(default)]
    pub dry_run: bool,
    pub scripts: Vec<MigrationScript>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppliedMigration {
    pub version: i64,
    pub name: String,
    pub checksum: String,
    pub applied_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationStatus {
    pub current_version: i64,
    pub migrations: Vec<AppliedMigration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationApplyResult {
    pub from_version: i64,
    pub to_version: i64,
    pub applied_versions: Vec<i64>,
    pub skipped_versions: Vec<i64>,
    pub dry_run: bool,
}

pub trait MigrationService: Send + Sync {
    fn status(&self, db_path: String) -> FrameworkResult<MigrationStatus>;
    fn apply(&self, db_path: String, plan: MigrationPlan) -> FrameworkResult<MigrationApplyResult>;
}

pub struct SqliteMigrationService {
    file_system_service: Arc<dyn FileSystemService>,
    policy_service: Arc<dyn PolicyService>,
}

impl SqliteMigrationService {
    pub fn new(
        file_system_service: Arc<dyn FileSystemService>,
        policy_service: Arc<dyn PolicyService>,
    ) -> Self {
        Self {
            file_system_service,
            policy_service,
        }
    }

    fn ensure_db_path_allowed(&self, db_path: &str, access: PathAccessType) -> FrameworkResult<()> {
        self.policy_service
            .validate_path(db_path.to_string(), access)?
            .ensure_allowed()
    }

    fn now_millis() -> u64 {
        match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(duration) => duration.as_millis() as u64,
            Err(_) => 0,
        }
    }

    fn normalize_sql(sql: &str) -> String {
        sql.split_whitespace().collect::<Vec<_>>().join(" ")
    }

    fn script_signature(script: &MigrationScript) -> String {
        if let Some(checksum) = &script.checksum {
            let normalized = checksum.trim();
            if !normalized.is_empty() {
                return format!("checksum:{normalized}");
            }
        }
        format!("sql:{}", Self::normalize_sql(&script.sql))
    }

    fn ensure_migration_table(connection: &Connection) -> FrameworkResult<()> {
        connection
            .execute_batch(&format!(
                "
                CREATE TABLE IF NOT EXISTS {MIGRATION_TABLE_NAME} (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    checksum TEXT NOT NULL,
                    applied_at_ms INTEGER NOT NULL
                );
                "
            ))
            .map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_TABLE_INIT_FAILED",
                    format!("failed to initialize migration table: {error}"),
                )
            })
    }

    fn load_applied_migrations(connection: &Connection) -> FrameworkResult<Vec<AppliedMigration>> {
        let mut statement = connection
            .prepare(&format!(
                "
                SELECT version, name, checksum, applied_at_ms
                FROM {MIGRATION_TABLE_NAME}
                ORDER BY version ASC
                "
            ))
            .map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_QUERY_PREPARE_FAILED",
                    format!("failed to prepare migration query: {error}"),
                )
            })?;

        let rows = statement
            .query_map([], |row| {
                Ok(AppliedMigration {
                    version: row.get(0)?,
                    name: row.get(1)?,
                    checksum: row.get(2)?,
                    applied_at_ms: row.get(3)?,
                })
            })
            .map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_QUERY_FAILED",
                    format!("failed to query applied migrations: {error}"),
                )
            })?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_ROW_READ_FAILED",
                    format!("failed to read migration row: {error}"),
                )
            })?);
        }
        Ok(result)
    }

    fn validate_plan(plan: &MigrationPlan) -> FrameworkResult<Vec<MigrationScript>> {
        let mut scripts = plan.scripts.clone();
        scripts.sort_by_key(|script| script.version);

        let mut seen_versions = HashSet::new();
        for script in &scripts {
            if script.version <= 0 {
                return Err(FrameworkError::new(
                    "MIGRATION_VERSION_INVALID",
                    format!("migration version must be positive, got {}", script.version),
                ));
            }
            if script.name.trim().is_empty() {
                return Err(FrameworkError::new(
                    "MIGRATION_NAME_EMPTY",
                    format!("migration name is required for version {}", script.version),
                ));
            }
            if script.sql.trim().is_empty() {
                return Err(FrameworkError::new(
                    "MIGRATION_SQL_EMPTY",
                    format!("migration sql is required for version {}", script.version),
                ));
            }
            if !seen_versions.insert(script.version) {
                return Err(FrameworkError::new(
                    "MIGRATION_VERSION_DUPLICATED",
                    format!("duplicated migration version: {}", script.version),
                ));
            }
        }

        Ok(scripts)
    }
}

impl Default for SqliteMigrationService {
    fn default() -> Self {
        Self {
            file_system_service: Arc::new(super::LocalFileSystemService::default()),
            policy_service: Arc::new(NativePolicyService::default()),
        }
    }
}

impl MigrationService for SqliteMigrationService {
    fn status(&self, db_path: String) -> FrameworkResult<MigrationStatus> {
        self.ensure_db_path_allowed(&db_path, PathAccessType::Read)?;
        let db_exists = self.file_system_service.exists(db_path.clone())?;
        if !db_exists {
            return Ok(MigrationStatus {
                current_version: 0,
                migrations: Vec::new(),
            });
        }

        let connection = Connection::open(&db_path)
            .map_err(|error| FrameworkError::new("MIGRATION_OPEN_DB_FAILED", error.to_string()))?;
        Self::ensure_migration_table(&connection)?;
        let migrations = Self::load_applied_migrations(&connection)?;
        let current_version = migrations.last().map(|item| item.version).unwrap_or(0);

        Ok(MigrationStatus {
            current_version,
            migrations,
        })
    }

    fn apply(&self, db_path: String, plan: MigrationPlan) -> FrameworkResult<MigrationApplyResult> {
        self.ensure_db_path_allowed(&db_path, PathAccessType::Write)?;
        self.file_system_service
            .ensure_parent_dir(db_path.clone())
            .map_err(|error| {
                FrameworkError::new("MIGRATION_CREATE_PARENT_DIR_FAILED", error.to_string())
            })?;

        let scripts = Self::validate_plan(&plan)?;
        let mut connection = Connection::open(&db_path)
            .map_err(|error| FrameworkError::new("MIGRATION_OPEN_DB_FAILED", error.to_string()))?;
        Self::ensure_migration_table(&connection)?;

        let existing = Self::load_applied_migrations(&connection)?;
        let from_version = existing.last().map(|item| item.version).unwrap_or(0);
        let existing_by_version: HashMap<i64, AppliedMigration> = existing
            .into_iter()
            .map(|item| (item.version, item))
            .collect();

        let transaction = connection.transaction().map_err(|error| {
            FrameworkError::new(
                "MIGRATION_TRANSACTION_BEGIN_FAILED",
                format!("failed to begin migration transaction: {error}"),
            )
        })?;

        let mut applied_versions = Vec::new();
        let mut skipped_versions = Vec::new();
        let applied_at_ms = Self::now_millis();

        for script in scripts {
            let script_name = script.name.trim().to_string();
            let signature = Self::script_signature(&script);
            if let Some(existing_item) = existing_by_version.get(&script.version) {
                if existing_item.name != script_name || existing_item.checksum != signature {
                    return Err(FrameworkError::new(
                        "MIGRATION_VERSION_CONFLICT",
                        format!(
                            "migration conflict at version {}: existing(name={}, checksum={}), incoming(name={}, checksum={})",
                            script.version,
                            existing_item.name,
                            existing_item.checksum,
                            script_name,
                            signature
                        ),
                    ));
                }
                skipped_versions.push(script.version);
                continue;
            }

            transaction.execute_batch(&script.sql).map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_EXECUTE_FAILED",
                    format!(
                        "failed to execute migration {} ({script_name}): {error}",
                        script.version
                    ),
                )
            })?;
            transaction
                .execute(
                    &format!(
                        "
                        INSERT INTO {MIGRATION_TABLE_NAME} (version, name, checksum, applied_at_ms)
                        VALUES (?1, ?2, ?3, ?4)
                        "
                    ),
                    params![script.version, script_name, signature, applied_at_ms],
                )
                .map_err(|error| {
                    FrameworkError::new(
                        "MIGRATION_RECORD_INSERT_FAILED",
                        format!(
                            "failed to record migration {} in metadata table: {error}",
                            script.version
                        ),
                    )
                })?;
            applied_versions.push(script.version);
        }

        let to_version = applied_versions.last().copied().unwrap_or(from_version);

        if plan.dry_run {
            transaction.rollback().map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_DRY_RUN_ROLLBACK_FAILED",
                    format!("failed to rollback dry-run migration transaction: {error}"),
                )
            })?;
        } else {
            transaction.commit().map_err(|error| {
                FrameworkError::new(
                    "MIGRATION_TRANSACTION_COMMIT_FAILED",
                    format!("failed to commit migration transaction: {error}"),
                )
            })?;
        }

        Ok(MigrationApplyResult {
            from_version,
            to_version,
            applied_versions,
            skipped_versions,
            dry_run: plan.dry_run,
        })
    }
}

#[cfg(test)]
mod tests {
    use std::env;
    use std::path::PathBuf;

    use uuid::Uuid;

    use super::{MigrationPlan, MigrationScript, MigrationService, SqliteMigrationService};

    fn test_db_path(label: &str) -> String {
        let mut path = env::temp_dir();
        path.push(format!(
            "magic-studio-migration-{label}-{}.db",
            Uuid::new_v4()
        ));
        path.to_string_lossy().to_string()
    }

    fn remove_db(path: &str) {
        let _ = std::fs::remove_file(PathBuf::from(path));
    }

    fn sample_plan() -> MigrationPlan {
        MigrationPlan {
            dry_run: false,
            scripts: vec![
                MigrationScript {
                    version: 1,
                    name: "create_notes".to_string(),
                    sql: "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT NOT NULL);".to_string(),
                    checksum: None,
                },
                MigrationScript {
                    version: 2,
                    name: "add_body".to_string(),
                    sql: "ALTER TABLE notes ADD COLUMN body TEXT DEFAULT '';".to_string(),
                    checksum: None,
                },
            ],
        }
    }

    #[test]
    fn apply_then_read_status() {
        let service = SqliteMigrationService::default();
        let db_path = test_db_path("apply-status");
        let plan = sample_plan();

        let result = service
            .apply(db_path.clone(), plan)
            .expect("apply should succeed");
        assert_eq!(result.from_version, 0);
        assert_eq!(result.to_version, 2);
        assert_eq!(result.applied_versions, vec![1, 2]);
        assert!(result.skipped_versions.is_empty());
        assert!(!result.dry_run);

        let status = service
            .status(db_path.clone())
            .expect("status should succeed");
        assert_eq!(status.current_version, 2);
        assert_eq!(status.migrations.len(), 2);
        assert_eq!(status.migrations[0].version, 1);
        assert_eq!(status.migrations[1].version, 2);

        remove_db(&db_path);
    }

    #[test]
    fn repeated_apply_is_idempotent() {
        let service = SqliteMigrationService::default();
        let db_path = test_db_path("idempotent");

        service
            .apply(db_path.clone(), sample_plan())
            .expect("first apply should succeed");
        let second = service
            .apply(db_path.clone(), sample_plan())
            .expect("second apply should succeed");

        assert_eq!(second.from_version, 2);
        assert_eq!(second.to_version, 2);
        assert!(second.applied_versions.is_empty());
        assert_eq!(second.skipped_versions, vec![1, 2]);

        remove_db(&db_path);
    }

    #[test]
    fn detects_version_conflict() {
        let service = SqliteMigrationService::default();
        let db_path = test_db_path("conflict");

        service
            .apply(db_path.clone(), sample_plan())
            .expect("initial apply should succeed");

        let conflict_plan = MigrationPlan {
            dry_run: false,
            scripts: vec![MigrationScript {
                version: 1,
                name: "create_notes_changed".to_string(),
                sql: "CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT, updated_at INTEGER);"
                    .to_string(),
                checksum: None,
            }],
        };

        let error = service
            .apply(db_path.clone(), conflict_plan)
            .expect_err("conflict apply should fail");
        assert_eq!(error.code, "MIGRATION_VERSION_CONFLICT");

        remove_db(&db_path);
    }

    #[test]
    fn dry_run_does_not_persist() {
        let service = SqliteMigrationService::default();
        let db_path = test_db_path("dry-run");
        let mut plan = sample_plan();
        plan.dry_run = true;

        let result = service
            .apply(db_path.clone(), plan)
            .expect("dry-run apply should succeed");
        assert!(result.dry_run);
        assert_eq!(result.applied_versions, vec![1, 2]);

        let status = service
            .status(db_path.clone())
            .expect("status should succeed");
        assert_eq!(status.current_version, 0);
        assert!(status.migrations.is_empty());

        remove_db(&db_path);
    }
}
