use std::sync::Arc;

use rusqlite::{
    params_from_iter,
    types::{Value as SqlValue, ValueRef},
    Connection,
};
use serde::Serialize;
use serde_json::{Map, Number, Value};

use crate::framework::error::{FrameworkError, FrameworkResult};
use crate::framework::services::policy::{NativePolicyService, PathAccessType, PolicyService};
use crate::framework::services::FileSystemService;

#[derive(Debug, Serialize)]
pub struct DbExecuteResult {
    pub affected_rows: usize,
    pub last_insert_rowid: i64,
}

pub trait DatabaseService: Send + Sync {
    fn execute(
        &self,
        db_path: String,
        sql: String,
        params: Option<Vec<Value>>,
    ) -> FrameworkResult<DbExecuteResult>;
    fn query(
        &self,
        db_path: String,
        sql: String,
        params: Option<Vec<Value>>,
    ) -> FrameworkResult<Vec<Value>>;
    fn execute_batch(&self, db_path: String, sql_batch: String) -> FrameworkResult<()>;
}

pub struct SqliteDatabaseService {
    file_system_service: Arc<dyn FileSystemService>,
    policy_service: Arc<dyn PolicyService>,
}

impl SqliteDatabaseService {
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
}

impl Default for SqliteDatabaseService {
    fn default() -> Self {
        Self {
            file_system_service: Arc::new(super::LocalFileSystemService::default()),
            policy_service: Arc::new(NativePolicyService::default()),
        }
    }
}

fn json_to_sql_value(value: &Value) -> SqlValue {
    match value {
        Value::Null => SqlValue::Null,
        Value::Bool(v) => SqlValue::Integer(if *v { 1 } else { 0 }),
        Value::Number(num) => {
            if let Some(v) = num.as_i64() {
                SqlValue::Integer(v)
            } else if let Some(v) = num.as_u64() {
                SqlValue::Integer(v as i64)
            } else if let Some(v) = num.as_f64() {
                SqlValue::Real(v)
            } else {
                SqlValue::Null
            }
        }
        Value::String(v) => SqlValue::Text(v.clone()),
        Value::Array(_) | Value::Object(_) => SqlValue::Text(value.to_string()),
    }
}

fn sql_ref_to_json(value: ValueRef<'_>) -> Value {
    match value {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(v) => Value::Number(Number::from(v)),
        ValueRef::Real(v) => Number::from_f64(v)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        ValueRef::Text(v) => Value::String(String::from_utf8_lossy(v).to_string()),
        ValueRef::Blob(v) => Value::Array(
            v.iter()
                .map(|byte| Value::Number(Number::from(*byte)))
                .collect(),
        ),
    }
}

impl DatabaseService for SqliteDatabaseService {
    fn execute(
        &self,
        db_path: String,
        sql: String,
        params: Option<Vec<Value>>,
    ) -> FrameworkResult<DbExecuteResult> {
        self.ensure_db_path_allowed(&db_path, PathAccessType::Write)?;
        self.file_system_service
            .ensure_parent_dir(db_path.clone())
            .map_err(|error| {
                FrameworkError::new("DATABASE_CREATE_PARENT_DIR_FAILED", error.to_string())
            })?;
        let connection = Connection::open(&db_path)
            .map_err(|error| FrameworkError::new("DATABASE_OPEN_FAILED", error.to_string()))?;
        let parameter_values: Vec<SqlValue> = params
            .unwrap_or_default()
            .iter()
            .map(json_to_sql_value)
            .collect();
        let affected_rows = connection
            .execute(&sql, params_from_iter(parameter_values.iter()))
            .map_err(|error| FrameworkError::new("DATABASE_EXECUTE_FAILED", error.to_string()))?;

        Ok(DbExecuteResult {
            affected_rows,
            last_insert_rowid: connection.last_insert_rowid(),
        })
    }

    fn query(
        &self,
        db_path: String,
        sql: String,
        params: Option<Vec<Value>>,
    ) -> FrameworkResult<Vec<Value>> {
        self.ensure_db_path_allowed(&db_path, PathAccessType::Read)?;
        self.file_system_service
            .ensure_parent_dir(db_path.clone())
            .map_err(|error| {
                FrameworkError::new("DATABASE_CREATE_PARENT_DIR_FAILED", error.to_string())
            })?;
        let connection = Connection::open(&db_path)
            .map_err(|error| FrameworkError::new("DATABASE_OPEN_FAILED", error.to_string()))?;
        let parameter_values: Vec<SqlValue> = params
            .unwrap_or_default()
            .iter()
            .map(json_to_sql_value)
            .collect();

        let mut statement = connection
            .prepare(&sql)
            .map_err(|error| FrameworkError::new("DATABASE_PREPARE_FAILED", error.to_string()))?;
        let column_names: Vec<String> = statement
            .column_names()
            .iter()
            .map(|name| (*name).to_string())
            .collect();

        let rows = statement
            .query_map(params_from_iter(parameter_values.iter()), |row| {
                let mut object = Map::new();
                for (index, column_name) in column_names.iter().enumerate() {
                    let value = row.get_ref(index)?;
                    object.insert(column_name.clone(), sql_ref_to_json(value));
                }
                Ok(Value::Object(object))
            })
            .map_err(|error| FrameworkError::new("DATABASE_QUERY_FAILED", error.to_string()))?;

        let mut output = Vec::new();
        for row in rows {
            output.push(row.map_err(|error| {
                FrameworkError::new("DATABASE_ROW_READ_FAILED", error.to_string())
            })?);
        }

        Ok(output)
    }

    fn execute_batch(&self, db_path: String, sql_batch: String) -> FrameworkResult<()> {
        self.ensure_db_path_allowed(&db_path, PathAccessType::Write)?;
        self.file_system_service
            .ensure_parent_dir(db_path.clone())
            .map_err(|error| {
                FrameworkError::new("DATABASE_CREATE_PARENT_DIR_FAILED", error.to_string())
            })?;
        let connection = Connection::open(&db_path)
            .map_err(|error| FrameworkError::new("DATABASE_OPEN_FAILED", error.to_string()))?;
        connection.execute_batch(&sql_batch).map_err(|error| {
            FrameworkError::new("DATABASE_EXECUTE_BATCH_FAILED", error.to_string())
        })
    }
}
