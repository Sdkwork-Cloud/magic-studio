use std::env;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::framework::error::{FrameworkError, FrameworkResult};

const DEFAULT_POLICY_DENY_CODE: &str = "POLICY_DENIED";
const DEFAULT_POLICY_DENY_REASON: &str = "operation blocked by policy";

const ENV_ALLOW_DANGEROUS_COMMANDS: &str = "OPEN_STUDIO_POLICY_ALLOW_DANGEROUS_COMMANDS";
const ENV_ALLOW_SYSTEM_PATHS: &str = "OPEN_STUDIO_POLICY_ALLOW_SYSTEM_PATHS";
const ENV_EXTRA_BLOCKED_COMMANDS: &str = "OPEN_STUDIO_POLICY_EXTRA_BLOCKED_COMMANDS";
const ENV_EXTRA_BLOCKED_PATHS: &str = "OPEN_STUDIO_POLICY_EXTRA_BLOCKED_PATHS";

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PathAccessType {
    Read,
    Write,
    EnsureDir,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PolicyValidationResult {
    pub allowed: bool,
    pub code: Option<String>,
    pub reason: Option<String>,
    pub matched_rule: Option<String>,
}

impl PolicyValidationResult {
    pub fn allow() -> Self {
        Self {
            allowed: true,
            code: None,
            reason: None,
            matched_rule: None,
        }
    }

    pub fn deny(
        code: impl Into<String>,
        reason: impl Into<String>,
        matched_rule: Option<String>,
    ) -> Self {
        Self {
            allowed: false,
            code: Some(code.into()),
            reason: Some(reason.into()),
            matched_rule,
        }
    }

    pub fn ensure_allowed(self) -> FrameworkResult<()> {
        if self.allowed {
            return Ok(());
        }

        Err(FrameworkError::new(
            self.code
                .unwrap_or_else(|| DEFAULT_POLICY_DENY_CODE.to_string()),
            self.reason
                .unwrap_or_else(|| DEFAULT_POLICY_DENY_REASON.to_string()),
        ))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PolicySnapshot {
    pub allow_dangerous_commands: bool,
    pub allow_system_paths: bool,
    pub blocked_commands: Vec<String>,
    pub blocked_path_prefixes: Vec<String>,
    pub preferred_work_roots: Vec<String>,
}

pub trait PolicyService: Send + Sync {
    fn validate_path(
        &self,
        path: String,
        access: PathAccessType,
    ) -> FrameworkResult<PolicyValidationResult>;
    fn validate_command(&self, name: String) -> FrameworkResult<PolicyValidationResult>;
    fn snapshot(&self) -> FrameworkResult<PolicySnapshot>;
}

pub struct NativePolicyService {
    blocked_commands: Vec<String>,
    blocked_path_prefixes: Vec<String>,
    preferred_work_roots: Vec<String>,
    allow_dangerous_commands: bool,
    allow_system_paths: bool,
}

impl NativePolicyService {
    fn from_env() -> Self {
        let allow_dangerous_commands = env_flag_enabled(ENV_ALLOW_DANGEROUS_COMMANDS);
        let allow_system_paths = env_flag_enabled(ENV_ALLOW_SYSTEM_PATHS);

        let mut blocked_commands = default_blocked_commands();
        blocked_commands.extend(parse_env_list(ENV_EXTRA_BLOCKED_COMMANDS));
        blocked_commands.sort();
        blocked_commands.dedup();

        let mut blocked_path_prefixes = default_blocked_path_prefixes();
        blocked_path_prefixes.extend(
            parse_env_list(ENV_EXTRA_BLOCKED_PATHS)
                .into_iter()
                .map(|path| normalize_path_for_compare(Path::new(&path))),
        );
        blocked_path_prefixes.retain(|prefix| !prefix.is_empty());
        blocked_path_prefixes.sort();
        blocked_path_prefixes.dedup();

        let preferred_work_roots = default_preferred_work_roots();

        Self {
            blocked_commands,
            blocked_path_prefixes,
            preferred_work_roots,
            allow_dangerous_commands,
            allow_system_paths,
        }
    }

    fn validate_path_value(
        &self,
        path: String,
        access: PathAccessType,
    ) -> FrameworkResult<PolicyValidationResult> {
        let trimmed = path.trim();
        if trimmed.is_empty() {
            return Ok(PolicyValidationResult::deny(
                "POLICY_PATH_EMPTY",
                "path cannot be empty",
                None,
            ));
        }

        if self.allow_system_paths {
            return Ok(PolicyValidationResult::allow());
        }

        let absolute_path = to_absolute_path(trimmed)?;
        let normalized = normalize_path_for_compare(&absolute_path);

        for blocked_prefix in &self.blocked_path_prefixes {
            if matches_path_prefix(&normalized, blocked_prefix) {
                let reason = match access {
                    PathAccessType::Read => "read access to system path is blocked",
                    PathAccessType::Write => "write access to system path is blocked",
                    PathAccessType::EnsureDir => {
                        "directory creation in protected system path is blocked"
                    }
                };
                return Ok(PolicyValidationResult::deny(
                    "POLICY_PATH_BLOCKED",
                    reason,
                    Some(blocked_prefix.clone()),
                ));
            }
        }

        Ok(PolicyValidationResult::allow())
    }

    fn validate_command_value(&self, name: String) -> PolicyValidationResult {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return PolicyValidationResult::deny(
                "POLICY_COMMAND_EMPTY",
                "command name cannot be empty",
                None,
            );
        }

        if self.allow_dangerous_commands {
            return PolicyValidationResult::allow();
        }

        let normalized_name = normalize_command_name(trimmed);
        if normalized_name.is_empty() {
            return PolicyValidationResult::deny(
                "POLICY_COMMAND_INVALID",
                "command name is invalid",
                None,
            );
        }

        if self
            .blocked_commands
            .iter()
            .any(|blocked| blocked == &normalized_name)
        {
            return PolicyValidationResult::deny(
                "POLICY_COMMAND_BLOCKED",
                format!("command \"{normalized_name}\" is blocked by policy"),
                Some(normalized_name),
            );
        }

        PolicyValidationResult::allow()
    }
}

impl Default for NativePolicyService {
    fn default() -> Self {
        Self::from_env()
    }
}

impl PolicyService for NativePolicyService {
    fn validate_path(
        &self,
        path: String,
        access: PathAccessType,
    ) -> FrameworkResult<PolicyValidationResult> {
        self.validate_path_value(path, access)
    }

    fn validate_command(&self, name: String) -> FrameworkResult<PolicyValidationResult> {
        Ok(self.validate_command_value(name))
    }

    fn snapshot(&self) -> FrameworkResult<PolicySnapshot> {
        Ok(PolicySnapshot {
            allow_dangerous_commands: self.allow_dangerous_commands,
            allow_system_paths: self.allow_system_paths,
            blocked_commands: self.blocked_commands.clone(),
            blocked_path_prefixes: self.blocked_path_prefixes.clone(),
            preferred_work_roots: self.preferred_work_roots.clone(),
        })
    }
}

fn default_blocked_commands() -> Vec<String> {
    let mut names = vec![
        "rm", "rmdir", "del", "erase", "format", "mkfs", "shutdown", "reboot", "poweroff", "halt",
    ];

    if cfg!(target_os = "windows") {
        names.extend(["diskpart", "bcdedit", "cipher", "reg"]);
    }

    names.into_iter().map(|value| value.to_string()).collect()
}

fn default_blocked_path_prefixes() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let defaults = [
            r"C:\Windows",
            r"C:\Program Files",
            r"C:\Program Files (x86)",
            r"C:\ProgramData",
            r"C:\$Recycle.Bin",
        ];
        defaults
            .into_iter()
            .map(|path| normalize_path_for_compare(Path::new(path)))
            .collect()
    }

    #[cfg(not(target_os = "windows"))]
    {
        let defaults = [
            "/etc", "/bin", "/sbin", "/usr", "/boot", "/proc", "/sys", "/dev", "/lib", "/lib64",
        ];
        defaults
            .into_iter()
            .map(|path| normalize_path_for_compare(Path::new(path)))
            .collect()
    }
}

fn default_preferred_work_roots() -> Vec<String> {
    let mut roots = Vec::new();

    if let Ok(current_dir) = env::current_dir() {
        roots.push(normalize_path_for_compare(&current_dir));
    }

    if let Some(home_dir) = dirs::home_dir() {
        roots.push(normalize_path_for_compare(&home_dir));
    }

    if let Some(data_dir) = dirs::data_local_dir() {
        roots.push(normalize_path_for_compare(&data_dir));
    }

    roots.push(normalize_path_for_compare(&env::temp_dir()));
    roots.sort();
    roots.dedup();
    roots
}

fn to_absolute_path(input: &str) -> FrameworkResult<PathBuf> {
    let path = PathBuf::from(input);
    if path.is_absolute() {
        return Ok(path);
    }

    let current_dir = env::current_dir().map_err(|error| {
        FrameworkError::new(
            "POLICY_RESOLVE_CURRENT_DIR_FAILED",
            format!("failed to resolve current dir: {error}"),
        )
    })?;
    Ok(current_dir.join(path))
}

fn env_flag_enabled(key: &str) -> bool {
    match env::var(key) {
        Ok(value) => {
            let normalized = value.trim().to_ascii_lowercase();
            matches!(normalized.as_str(), "1" | "true" | "yes" | "on")
        }
        Err(_) => false,
    }
}

fn parse_env_list(key: &str) -> Vec<String> {
    match env::var(key) {
        Ok(value) => value
            .split(';')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| value.to_string())
            .collect(),
        Err(_) => Vec::new(),
    }
}

fn normalize_command_name(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    let token = if let Some(stripped) = trimmed.strip_prefix('"') {
        if let Some(end_index) = stripped.find('"') {
            &stripped[..end_index]
        } else {
            stripped
        }
    } else {
        trimmed
            .split_whitespace()
            .next()
            .unwrap_or(trimmed)
            .trim_matches('"')
    };

    let file_name = Path::new(token)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| token.to_string());

    let normalized = file_name.to_ascii_lowercase();
    strip_windows_executable_suffix(&normalized).to_string()
}

fn strip_windows_executable_suffix(name: &str) -> &str {
    for suffix in [".exe", ".cmd", ".bat", ".ps1"] {
        if let Some(stripped) = name.strip_suffix(suffix) {
            return stripped;
        }
    }
    name
}

fn normalize_path_for_compare(path: &Path) -> String {
    #[cfg(target_os = "windows")]
    {
        normalize_windows_path(path.to_string_lossy().as_ref())
    }

    #[cfg(not(target_os = "windows"))]
    {
        normalize_unix_path(path.to_string_lossy().as_ref())
    }
}

#[cfg(target_os = "windows")]
fn normalize_windows_path(value: &str) -> String {
    let mut output = value.trim().replace('/', "\\");
    while output.ends_with('\\') && output.len() > 3 {
        output.pop();
    }
    output.to_ascii_lowercase()
}

#[cfg(not(target_os = "windows"))]
fn normalize_unix_path(value: &str) -> String {
    let mut output = value.trim().replace('\\', "/");
    while output.ends_with('/') && output.len() > 1 {
        output.pop();
    }
    output
}

fn matches_path_prefix(path: &str, prefix: &str) -> bool {
    if path == prefix {
        return true;
    }

    if let Some(remaining) = path.strip_prefix(prefix) {
        #[cfg(target_os = "windows")]
        {
            return remaining.starts_with('\\');
        }

        #[cfg(not(target_os = "windows"))]
        {
            return remaining.starts_with('/');
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    fn service_for_test() -> NativePolicyService {
        NativePolicyService {
            blocked_commands: vec!["rm".to_string(), "del".to_string()],
            blocked_path_prefixes: default_blocked_path_prefixes(),
            preferred_work_roots: Vec::new(),
            allow_dangerous_commands: false,
            allow_system_paths: false,
        }
    }

    #[test]
    fn blocks_dangerous_commands() {
        let service = service_for_test();
        let result = service
            .validate_command("rm -rf ./tmp".to_string())
            .expect("policy should return validation result");
        assert!(!result.allowed);
        assert_eq!(result.code.as_deref(), Some("POLICY_COMMAND_BLOCKED"));
    }

    #[test]
    fn allows_safe_commands() {
        let service = service_for_test();
        let result = service
            .validate_command("ffmpeg -version".to_string())
            .expect("policy should return validation result");
        assert!(result.allowed);
    }

    #[test]
    fn blocks_system_paths() {
        let service = service_for_test();
        #[cfg(target_os = "windows")]
        let path = r"C:\Windows\System32\drivers\etc\hosts";
        #[cfg(not(target_os = "windows"))]
        let path = "/etc/hosts";

        let result = service
            .validate_path(path.to_string(), PathAccessType::Read)
            .expect("policy should return validation result");
        assert!(!result.allowed);
        assert_eq!(result.code.as_deref(), Some("POLICY_PATH_BLOCKED"));
    }

    #[test]
    fn allows_regular_workspace_path() {
        let service = service_for_test();
        let result = service
            .validate_path("./tmp/output.mp4".to_string(), PathAccessType::Write)
            .expect("policy should return validation result");
        assert!(result.allowed);
    }
}
