
#[cfg(target_os = "windows")]
pub fn get_default_shell() -> String {
    "powershell".to_string()
}

#[cfg(not(target_os = "windows"))]
pub fn get_default_shell() -> String {
    use std::env;
    env::var("SHELL").unwrap_or_else(|_| "bash".to_string())
}

pub fn get_home_dir() -> String {
    match dirs::home_dir() {
        Some(path) => path.to_string_lossy().to_string(),
        None => ".".to_string(),
    }
}
