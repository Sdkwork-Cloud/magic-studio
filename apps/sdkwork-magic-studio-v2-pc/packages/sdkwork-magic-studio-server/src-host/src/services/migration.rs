use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use crate::response::{ServerError, ServerResult};
use crate::services::policy::{PathAccessType, PolicyService};

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

#[derive(Debug, Clone)]
pub struct MigrationService {
    policy_service: PolicyService,
}

impl MigrationService {
    pub fn new(policy_service: PolicyService) -> Self {
        Self { policy_service }
    }

    pub fn status(&self, db_path: String) -> ServerResult<MigrationStatus> {
        self.policy_service
            .validate_path(db_path.clone(), PathAccessType::Read)?
            .ensure_allowed()?;

        if !Path::new(&db_path).exists() {
            return Ok(MigrationStatus {
                current_version: 0,
                migrations: Vec::new(),
            });
        }

        let connection = Connection::open(&db_path).map_err(|error| {
            ServerError::internal(error.to_string())
        })?;
        Self::ensure_migration_table(&connection)?;
        let migrations = Self::load_applied_migrations(&connection)?;
        let current_version = migrations.last().map(|item| item.version).unwrap_or(0);

        Ok(MigrationStatus {
            current_version,
            migrations,
        })
    }

    pub fn apply(
        &self,
        db_path: String,
        plan: MigrationPlan,
    ) -> ServerResult<MigrationApplyResult> {
        self.policy_service
            .validate_path(db_path.clone(), PathAccessType::Write)?
            .ensure_allowed()?;

        if let Some(parent) = Path::new(&db_path).parent() {
            std::fs::create_dir_all(parent).map_err(|error| {
                ServerError::internal(format!("failed to create database parent dir: {error}"),
                )
            })?;
        }

        let scripts = Self::validate_plan(&plan)?;
        let mut connection = Connection::open(&db_path).map_err(|error| {
            ServerError::internal(error.to_string())
        })?;
        Self::ensure_migration_table(&connection)?;

        let existing = Self::load_applied_migrations(&connection)?;
        let from_version = existing.last().map(|item| item.version).unwrap_or(0);
        let existing_by_version: HashMap<i64, AppliedMigration> = existing
            .into_iter()
            .map(|item| (item.version, item))
            .collect();

        let transaction = connection.transaction().map_err(|error| {
            ServerError::internal(format!("failed to begin migration transaction: {error}"),
            )
        })?;

        let mut applied_versions = Vec::new();
        let mut skipped_versions = Vec::new();
        let applied_at_ms = Self::now_millis();
        let applied_at_ms_db = Self::sqlite_millis_from_u64(applied_at_ms)?;

        for script in scripts {
            let script_name = script.name.trim().to_string();
            let signature = Self::script_signature(&script);
            if let Some(existing_item) = existing_by_version.get(&script.version) {
                if existing_item.name != script_name || existing_item.checksum != signature {
                    return Err(ServerError::conflict(format!(
                            "migration conflict at version {}: existing(name={}, checksum={}), incoming(name={}, checksum={})",
                            script.version, existing_item.name, existing_item.checksum, script_name, signature
                        ),
                    ));
                }
                skipped_versions.push(script.version);
                continue;
            }

            transaction.execute_batch(&script.sql).map_err(|error| {
                ServerError::bad_request(format!(
                        "failed to execute migration {} ({}): {error}",
                        script.version, script_name
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
                    params![script.version, script_name, signature, applied_at_ms_db],
                )
                .map_err(|error| {
                    ServerError::internal(format!(
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
                ServerError::internal(format!("failed to rollback dry-run migration transaction: {error}"),
                )
            })?;
        } else {
            transaction.commit().map_err(|error| {
                ServerError::internal(format!("failed to commit migration transaction: {error}"),
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

    fn now_millis() -> u64 {
        match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(duration) => duration.as_millis() as u64,
            Err(_) => 0,
        }
    }

    fn sqlite_millis_from_u64(value: u64) -> ServerResult<i64> {
        if value > i64::MAX as u64 {
            return Err(ServerError::internal(format!("timestamp value exceeds SQLite INTEGER range: {value}"),
            ));
        }

        Ok(value as i64)
    }

    fn sqlite_millis_to_u64(value: i64) -> ServerResult<u64> {
        if value < 0 {
            return Err(ServerError::internal(format!("timestamp value cannot be negative: {value}"),
            ));
        }

        Ok(value as u64)
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

    fn ensure_migration_table(connection: &Connection) -> ServerResult<()> {
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
                ServerError::internal(format!("failed to initialize migration table: {error}"),
                )
            })
    }

    fn load_applied_migrations(connection: &Connection) -> ServerResult<Vec<AppliedMigration>> {
        let mut statement = connection
            .prepare(&format!(
                "
                SELECT version, name, checksum, applied_at_ms
                FROM {MIGRATION_TABLE_NAME}
                ORDER BY version ASC
                "
            ))
            .map_err(|error| {
                ServerError::internal(format!("failed to prepare migration query: {error}"),
                )
            })?;

        let rows = statement
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            })
            .map_err(|error| {
                ServerError::internal(format!("failed to query applied migrations: {error}"),
                )
            })?;

        let mut result = Vec::new();
        for row in rows {
            let (version, name, checksum, applied_at_ms) = row.map_err(|error| {
                ServerError::internal(format!("failed to read migration row: {error}"),
                )
            })?;
            result.push(AppliedMigration {
                version,
                name,
                checksum,
                applied_at_ms: Self::sqlite_millis_to_u64(applied_at_ms)?,
            });
        }
        Ok(result)
    }

    fn validate_plan(plan: &MigrationPlan) -> ServerResult<Vec<MigrationScript>> {
        let mut scripts = plan.scripts.clone();
        scripts.sort_by_key(|script| script.version);

        let mut seen_versions = HashSet::new();
        for script in &scripts {
            if script.version <= 0 {
                return Err(ServerError::bad_request(format!("migration version must be positive, got {}", script.version),
                ));
            }
            if script.name.trim().is_empty() {
                return Err(ServerError::bad_request(format!("migration name is required for version {}", script.version),
                ));
            }
            if script.sql.trim().is_empty() {
                return Err(ServerError::bad_request(format!("migration sql is required for version {}", script.version),
                ));
            }
            if !seen_versions.insert(script.version) {
                return Err(ServerError::bad_request(format!("duplicated migration version: {}", script.version),
                ));
            }
        }

        Ok(scripts)
    }
}
