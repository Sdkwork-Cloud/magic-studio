use serde_json::{Map, Value};
use std::{fs, path::PathBuf};

const SETTINGS_STORE_FILENAME: &str = "settings.json";
const APPEARANCE_SNAPSHOT_STORAGE_KEY: &str = "magic_studio_appearance_snapshot_v1";
const SETTINGS_STORAGE_KEYS: [&str; 2] = ["magic_studio_settings_v2", "open_studio_settings_v1"];
const TAURI_APPEARANCE_SNAPSHOT_WINDOW_KEY: &str = "__MAGIC_STUDIO_TAURI_APPEARANCE_SNAPSHOT__";

fn resolve_settings_store_path(identifier: &str) -> Option<PathBuf> {
    dirs::data_dir().map(|dir| dir.join(identifier).join(SETTINGS_STORE_FILENAME))
}

fn parse_json_value(raw: &str) -> Option<Value> {
    serde_json::from_str(raw).ok()
}

fn as_store_entry_string<'a>(value: &'a Value) -> Option<&'a str> {
    match value {
        Value::String(raw) => Some(raw.as_str()),
        _ => None,
    }
}

fn build_snapshot_from_settings(settings: Value) -> Option<Value> {
    let appearance = settings.get("appearance")?.clone();
    let editor = settings.get("editor").cloned();
    let terminal = settings.get("terminal").cloned();
    let language = settings
        .get("general")
        .and_then(|general| general.get("language"))
        .and_then(Value::as_str)
        .map(|language| language.to_string());

    let mut snapshot = Map::new();
    snapshot.insert("appearance".to_string(), appearance);

    if let Some(editor) = editor {
        snapshot.insert("editor".to_string(), editor);
    }

    if let Some(terminal) = terminal {
        snapshot.insert("terminal".to_string(), terminal);
    }

    if let Some(language) = language {
        snapshot.insert("language".to_string(), Value::String(language));
    }

    Some(Value::Object(snapshot))
}

fn extract_snapshot_from_store_json(store_json: &Value) -> Option<Value> {
    let store = store_json.as_object()?;

    if let Some(raw_snapshot) = store
        .get(APPEARANCE_SNAPSHOT_STORAGE_KEY)
        .and_then(as_store_entry_string)
    {
        let snapshot = parse_json_value(raw_snapshot)?;
        if snapshot.get("appearance").is_some() {
            return Some(snapshot);
        }
    }

    for key in SETTINGS_STORAGE_KEYS {
        let Some(settings) = store.get(key).and_then(as_store_entry_string) else {
            continue;
        };
        let Some(parsed_settings) = parse_json_value(settings) else {
            continue;
        };
        if let Some(snapshot) = build_snapshot_from_settings(parsed_settings) {
            return Some(snapshot);
        }
    }

    None
}

pub fn build_appearance_snapshot_init_script(identifier: &str) -> Option<String> {
    let settings_store_path = resolve_settings_store_path(identifier)?;
    let store_contents = fs::read_to_string(settings_store_path).ok()?;
    let snapshot = extract_snapshot_from_store_json(&parse_json_value(&store_contents)?)?;
    let snapshot_json = serde_json::to_string(&snapshot).ok()?;

    Some(format!(
        "window.{TAURI_APPEARANCE_SNAPSHOT_WINDOW_KEY} = {snapshot_json};"
    ))
}

#[cfg(test)]
mod tests {
    use super::{build_appearance_snapshot_init_script, extract_snapshot_from_store_json};
    use serde_json::json;

    #[test]
    fn extracts_snapshot_from_store_settings_entry() {
        let store_json = json!({
            "magic_studio_settings_v2": "{\"general\":{\"language\":\"zh-CN\"},\"appearance\":{\"theme\":\"light\",\"themeColor\":\"tech-blue\",\"fontFamily\":\"IBM Plex Sans\",\"fontSize\":16,\"lineHeight\":1.7,\"densityMode\":\"comfortable\",\"sidebarPosition\":\"right\"},\"editor\":{\"fontFamily\":\"JetBrains Mono\",\"fontSize\":15},\"terminal\":{\"fontFamily\":\"Fira Code\",\"fontSize\":14,\"lineHeight\":1.35}}"
        });

        let snapshot = extract_snapshot_from_store_json(&store_json).expect("snapshot");

        assert_eq!(snapshot["appearance"]["themeColor"], "tech-blue");
        assert_eq!(snapshot["language"], "zh-CN");
        assert_eq!(snapshot["editor"]["fontSize"], 15);
        assert_eq!(snapshot["terminal"]["lineHeight"], 1.35);
    }

    #[test]
    fn ignores_missing_store_file_when_building_init_script() {
        let script = build_appearance_snapshot_init_script("com.sdkwork.missing.appearance");
        assert!(script.is_none());
    }

    #[test]
    fn falls_back_to_legacy_settings_entry_when_primary_key_is_missing() {
        let store_json = json!({
            "open_studio_settings_v1": "{\"general\":{\"language\":\"en\"},\"appearance\":{\"theme\":\"dark\",\"themeColor\":\"lobster\",\"fontFamily\":\"Inter\",\"fontSize\":13,\"lineHeight\":1.5,\"densityMode\":\"standard\",\"sidebarPosition\":\"left\"}}"
        });

        let snapshot = extract_snapshot_from_store_json(&store_json).expect("snapshot");

        assert_eq!(snapshot["appearance"]["themeColor"], "lobster");
        assert_eq!(snapshot["language"], "en");
    }
}
