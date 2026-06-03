use std::collections::{BTreeMap, BTreeSet};
use std::sync::LazyLock;

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

pub const MAGIC_STUDIO_OPENAPI_VERSION: &str = "3.1.0";

static EMBEDDED_SERVER_CONTRACT: LazyLock<ServerContract> = LazyLock::new(|| {
    let contract: ServerContract = serde_json::from_str(include_str!(
        "../../contracts/magic-studio-server.contract.json"
    ))
    .expect("embedded magic studio server contract should be valid json");
    validate_server_contract(&contract);
    contract
});

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerContractMeta {
    pub health_route_id: String,
    pub docs_path: String,
    pub open_api_path: String,
    pub live_open_api_path: String,
    pub route_catalog_route_id: String,
    pub runtime_summary_route_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerContractSurface {
    pub auth_mode: String,
    pub base_path: String,
    pub description: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerContractRoute {
    pub id: String,
    pub surface: String,
    pub auth_mode: String,
    pub method: String,
    pub path: String,
    pub summary: String,
    pub request_body_schema: Option<String>,
    pub success_response_schema: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerRouteCatalogEntry {
    pub id: String,
    pub surface: String,
    pub auth_mode: String,
    pub method: String,
    pub path: String,
    pub summary: String,
    pub operation_id: String,
    pub open_api_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerGatewaySurfaceSummary {
    pub auth_mode: String,
    pub base_path: String,
    pub description: String,
    pub name: String,
    pub route_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerGatewaySummary {
    pub base_path: String,
    pub docs_path: String,
    pub live_open_api_path: String,
    pub open_api_path: String,
    pub route_catalog_path: String,
    pub route_count: usize,
    pub routes_by_surface: BTreeMap<String, usize>,
    pub surfaces: Vec<ServerGatewaySurfaceSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerContract {
    pub api_version: String,
    pub meta: ServerContractMeta,
    pub routes: Vec<ServerContractRoute>,
    pub surfaces: Vec<ServerContractSurface>,
}

impl ServerContract {
    pub fn require_route_by_id(&self, route_id: &str) -> ServerContractRoute {
        self.routes
            .iter()
            .find(|route| route.id == route_id)
            .cloned()
            .unwrap_or_else(|| panic!("missing magic studio contract route id {route_id}"))
    }

    pub fn require_route_path_by_id(&self, route_id: &str) -> String {
        self.require_route_by_id(route_id).path
    }

    pub fn require_surface_base_path(&self, surface_name: &str) -> String {
        self.surfaces
            .iter()
            .find(|surface| surface.name == surface_name)
            .map(|surface| surface.base_path.clone())
            .unwrap_or_else(|| panic!("missing magic studio contract surface {surface_name}"))
    }

    pub fn health_path(&self) -> String {
        self.require_route_path_by_id(&self.meta.health_route_id)
    }

    pub fn route_catalog_path(&self) -> String {
        self.require_route_path_by_id(&self.meta.route_catalog_route_id)
    }

    pub fn runtime_summary_path(&self) -> String {
        self.require_route_path_by_id(&self.meta.runtime_summary_route_id)
    }

    pub fn openapi_path_for_route_id(&self, route_id: &str) -> String {
        to_openapi_path(&self.require_route_path_by_id(route_id))
    }

    pub fn axum_path_for_route_id(&self, route_id: &str) -> String {
        to_axum_path(&self.require_route_path_by_id(route_id))
    }

    pub fn materialize_route_path(&self, route_id: &str, parameters: &[(&str, &str)]) -> String {
        materialize_route_path(&self.require_route_path_by_id(route_id), parameters)
    }

    pub fn route_catalog(&self) -> Vec<ServerRouteCatalogEntry> {
        self.routes
            .iter()
            .map(|route| ServerRouteCatalogEntry {
                id: route.id.clone(),
                surface: route.surface.clone(),
                auth_mode: route.auth_mode.clone(),
                method: route.method.clone(),
                path: route.path.clone(),
                summary: route.summary.clone(),
                operation_id: route.id.clone(),
                open_api_path: to_openapi_path(&route.path),
            })
            .collect()
    }

    pub fn gateway_summary(&self) -> ServerGatewaySummary {
        let route_catalog = self.route_catalog();
        let mut routes_by_surface: BTreeMap<String, usize> = BTreeMap::new();
        for route in &route_catalog {
            *routes_by_surface.entry(route.surface.clone()).or_default() += 1;
        }

        let surfaces = self
            .surfaces
            .iter()
            .map(|surface| ServerGatewaySurfaceSummary {
                auth_mode: surface.auth_mode.clone(),
                base_path: surface.base_path.clone(),
                description: surface.description.clone(),
                name: surface.name.clone(),
                route_count: *routes_by_surface.get(&surface.name).unwrap_or(&0),
            })
            .collect();

        ServerGatewaySummary {
            base_path: derive_gateway_base_path(&self.surfaces),
            docs_path: self.meta.docs_path.clone(),
            live_open_api_path: self.meta.live_open_api_path.clone(),
            open_api_path: self.meta.open_api_path.clone(),
            route_catalog_path: self.route_catalog_path(),
            route_count: route_catalog.len(),
            routes_by_surface,
            surfaces,
        }
    }

    pub fn openapi_document(&self, server_url: &str) -> Value {
        let mut paths = Map::new();

        for route in &self.routes {
            let operation_id = route.id.clone();
            let open_api_path = to_openapi_path(&route.path);
            let method = route.method.to_ascii_lowercase();
            let mut operation = Map::new();
            operation.insert("operationId".to_string(), Value::String(operation_id));
            operation.insert("summary".to_string(), Value::String(route.summary.clone()));
            operation.insert("tags".to_string(), json!([route.surface]));
            if let Some(request_body) = openapi_request_body(route) {
                operation.insert("requestBody".to_string(), request_body);
            }
            operation.insert("responses".to_string(), openapi_responses(route));
            let operation = Value::Object(operation);

            if let Some(Value::Object(path_item)) = paths.get_mut(&open_api_path) {
                path_item.insert(method, operation);
            } else {
                let mut path_item = Map::new();
                path_item.insert(method, operation);
                paths.insert(open_api_path, Value::Object(path_item));
            }
        }

        json!({
            "openapi": MAGIC_STUDIO_OPENAPI_VERSION,
            "info": {
                "title": "Magic Studio Server API",
                "version": self.api_version,
                "description": "Canonical local server API for Magic Studio multi-runtime delivery."
            },
            "servers": [
                {
                    "url": server_url,
                    "description": "Local Magic Studio server"
                }
            ],
            "paths": paths,
            "components": load_embedded_openapi_components(),
            "x-sdkwork-api-gateway": self.gateway_summary()
        })
    }
}

pub fn embedded_server_contract() -> &'static ServerContract {
    &EMBEDDED_SERVER_CONTRACT
}

pub fn load_embedded_server_contract() -> ServerContract {
    embedded_server_contract().clone()
}

fn validate_server_contract(contract: &ServerContract) {
    let mut route_ids = BTreeSet::new();

    for route in &contract.routes {
        assert!(
            !route.id.trim().is_empty(),
            "embedded magic studio server contract route id cannot be empty"
        );
        assert!(
            route_ids.insert(route.id.clone()),
            "embedded magic studio server contract contains duplicate route id {}",
            route.id
        );
    }

    for (meta_field_name, route_id) in [
        ("health_route_id", contract.meta.health_route_id.as_str()),
        (
            "route_catalog_route_id",
            contract.meta.route_catalog_route_id.as_str(),
        ),
        (
            "runtime_summary_route_id",
            contract.meta.runtime_summary_route_id.as_str(),
        ),
    ] {
        assert!(
            !route_id.trim().is_empty(),
            "embedded magic studio server contract meta {} cannot be empty",
            meta_field_name
        );
        contract.require_route_by_id(route_id);
    }
}

fn load_embedded_openapi_components() -> Value {
    serde_json::from_str(include_str!(
        "../../contracts/magic-studio-server.openapi-components.json"
    ))
    .expect("embedded magic studio openapi components should be valid json")
}

fn derive_gateway_base_path(surfaces: &[ServerContractSurface]) -> String {
    if surfaces.is_empty() {
        return String::new();
    }

    let segments_by_path: Vec<Vec<&str>> = surfaces
        .iter()
        .map(|surface| {
            surface
                .base_path
                .split('/')
                .filter(|segment| !segment.is_empty())
                .collect()
        })
        .collect();
    let shortest_path_length = segments_by_path
        .iter()
        .map(|segments| segments.len())
        .min()
        .unwrap_or(0);
    let mut shared_segments = Vec::new();

    for index in 0..shortest_path_length {
        let Some(shared_segment) = segments_by_path[0].get(index) else {
            break;
        };

        if !segments_by_path
            .iter()
            .all(|segments| segments.get(index) == Some(shared_segment))
        {
            break;
        }

        shared_segments.push(*shared_segment);
    }

    if shared_segments.is_empty() {
        String::new()
    } else {
        format!("/{}", shared_segments.join("/"))
    }
}

fn openapi_responses(route: &ServerContractRoute) -> Value {
    let default_response = json!({
        "description": "Problem response",
        "content": {
            "application/json": {
                "schema": {
                    "$ref": "#/components/schemas/MagicStudioApiProblemEnvelope"
                }
            }
        }
    });

    if let Some(schema_name) = &route.success_response_schema {
        json!({
            "200": {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": format!("#/components/schemas/{schema_name}")
                        }
                    }
                }
            },
            "default": default_response
        })
    } else {
        json!({
            "200": { "description": "Successful response" },
            "default": default_response
        })
    }
}

fn openapi_request_body(route: &ServerContractRoute) -> Option<Value> {
    route.request_body_schema.as_ref().map(|schema_name| {
        json!({
            "required": true,
            "content": {
                "application/json": {
                    "schema": {
                        "$ref": format!("#/components/schemas/{schema_name}")
                    }
                }
            }
        })
    })
}

fn to_openapi_path(path: &str) -> String {
    path.split('/')
        .map(|segment| {
            if let Some(parameter_name) = segment.strip_prefix(':') {
                format!("{{{parameter_name}}}")
            } else {
                segment.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("/")
}

fn to_axum_path(path: &str) -> String {
    path.split('/')
        .map(|segment| {
            if let Some(parameter_name) = segment.strip_prefix(':') {
                format!("{{{parameter_name}}}")
            } else {
                segment.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("/")
}

fn materialize_route_path(path: &str, parameters: &[(&str, &str)]) -> String {
    let required_parameters = path_parameter_names(path);

    for (parameter_name, _) in parameters {
        assert!(
            required_parameters.iter().any(|required| required == parameter_name),
            "cannot materialize magic studio contract path {path}: unexpected parameter {parameter_name}"
        );
    }

    let mut rendered = path.to_string();
    for parameter_name in &required_parameters {
        let parameter_value = parameters
            .iter()
            .find(|(candidate, _)| candidate == parameter_name)
            .map(|(_, value)| *value)
            .unwrap_or_else(|| {
                panic!(
                    "cannot materialize magic studio contract path {path}: missing parameter {parameter_name}"
                )
            });
        rendered = rendered.replace(&format!(":{parameter_name}"), parameter_value);
    }

    rendered
}

fn path_parameter_names(path: &str) -> Vec<String> {
    path.split('/')
        .filter_map(|segment| segment.strip_prefix(':').map(str::to_string))
        .collect()
}
