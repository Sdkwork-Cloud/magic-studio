# Tauri Industry Desktop Capability Blueprint

## Goal

Define a reusable desktop capability framework for Tauri + Rust that can support multiple industry software categories:

- Digital Content Creation (video, image, audio, 3D)
- Engineering/CAD/Simulation tools
- Enterprise productivity clients
- Financial/trading terminals
- Operational/industrial control consoles
- Developer tooling products

This blueprint focuses on what should be abstracted at the framework layer so business modules only consume stable capabilities.

## Design Principles

1. Capability first: every desktop primitive is wrapped as a service, never used directly from commands or UI.
2. Contract stability: command/event protocols should be stable even when implementation is replaced.
3. Local-first by default: critical workflows must continue offline.
4. Security by architecture: permission, secret, and audit are first-class modules.
5. Observable operations: every long task must be traceable, cancellable, and measurable.
6. Multi-app reuse: same framework package should support many products with minimal branching.

## Capability Domains (Industry View)

### 1. Runtime Kernel

Scope:

- App lifecycle
- dependency injection container
- capability registration
- environment/profile bootstrap

Service candidates:

- `RuntimeService`
- `LifecycleService`
- `FeatureFlagService`

Current state in repo:

- Partially done (`AppContext`, unified `run_blocking`, service-based commands).

### 2. Security and Compliance

Scope:

- Command allowlist
- file/path permission policy
- secret storage and key management
- data encryption at rest
- audit logging and tamper evidence

Service candidates:

- `PolicyService`
- `SecretService`
- `CryptoService`
- `AuditService`

Industry drivers:

- Finance/enterprise/healthcare require policy + audit as baseline.

Current state:

- `PolicyService` baseline has been implemented with command/path validation and frontend SDK access.
- `SecretService` / `CryptoService` / `AuditService` are still pending.

### 3. System Integration

Scope:

- OS/runtime info
- shell/process management
- protocol/deep link registration
- tray/menu/hotkeys
- startup/login item control

Service candidates:

- `SystemService` (already present)
- `ProcessService`
- `DesktopIntegrationService`

Current state:

- Basic `SystemService` done; integration layer not yet standardized.

### 4. File and Workspace Plane

Scope:

- workspace root strategy
- file operations and guardrails
- file watcher/indexing
- snapshot/restore
- large asset cache governance

Service candidates:

- `FileSystemService` (already present)
- `WorkspaceService`
- `FileWatcherService`
- `CacheService`

Current state:

- Basic FS done, workspace conventions exist in frontend toolkit; watcher/index/snapshot not unified.

### 5. Data Persistence Plane

Scope:

- SQLite access abstraction
- schema migration/versioning
- transaction strategy
- kv + relational hybrid patterns
- optional search index (fts/vector)

Service candidates:

- `DatabaseService` (already present)
- `MigrationService`
- `IndexService`

Current state:

- SQL execution/query/batch done.
- `MigrationService` baseline is now implemented (versioned apply/status + idempotent conflict checks).
- Query governance and index strategy remain.

### 6. Job and Workflow Orchestration Plane

Scope:

- queue/scheduler
- retries/backoff
- cancellation and timeout
- priority and concurrency limits
- progress and stage events

Service candidates:

- `JobService` (already present)
- `WorkflowService` (DAG/step orchestration)
- `ResourceQuotaService`

Current state:

- Job submit/get/list/cancel + progress events + ffmpeg cancellation done.
- Missing: queue policy, quotas, workflow graph model.

### 7. Media and Compute Plane

Scope:

- ffmpeg/ffprobe orchestration
- image/video/audio operations
- recording/screen capture
- hardware acceleration strategy

Service candidates:

- `MediaService` (already present)
- `ToolkitService` (already present)
- `GpuAccelerationService`

Current state:

- Core media operations and toolkit commands are present.
- Missing: capability presets, GPU policy, media pipeline templating.

### 8. Device and Peripheral Plane

Scope:

- camera/microphone/screen
- serial/USB/HID/Bluetooth
- optional scanner/printer/pro cards

Service candidates:

- `DeviceService`
- `CaptureService`
- `PeripheralService`

Industry drivers:

- Manufacturing, healthcare, and kiosk products depend on this layer.

### 9. Network and Sync Plane

Scope:

- HTTP/WebSocket
- offline queue and replay
- background sync
- conflict resolution strategy

Service candidates:

- `NetworkService`
- `SyncService`
- `OfflineQueueService`

Current state:

- Network exists mostly via plugin/runtime; sync policy is not frameworkized yet.

### 10. UI Bridge Plane

Scope:

- typed command envelope
- typed event envelope
- error and telemetry contracts

Service candidates:

- `CommandGateway`
- `EventGateway`

Current state:

- command thin adapters are in place; typed shared schema governance should be strengthened.

### 11. Observability and Supportability

Scope:

- structured logs
- metrics
- tracing spans
- crash reporting and dump
- health diagnostics

Service candidates:

- `LogService`
- `MetricsService`
- `TraceService`
- `CrashService`

Industry value:

- Greatly reduces MTTR in production and enterprise delivery.

### 12. Delivery and Update Plane

Scope:

- updater strategy and channels
- rollback safety
- compatibility checks
- data migration hooks during upgrade

Service candidates:

- `UpdateService`
- `ReleasePolicyService`

Current state:

- updater plugin is wired; policy layer is not abstracted.

### 13. Extension and Plugin Plane

Scope:

- external module contracts
- capability negotiation
- sandboxed extension runtime
- version compatibility matrix

Service candidates:

- `ExtensionHostService`
- `CapabilityRegistryService`

Industry value:

- Enables ecosystem and long-term platformization.

## Priority Roadmap (Recommended)

### P0 (Immediate, framework hardening)

1. `PolicyService` for command/path allowlist + secure defaults.
2. `MigrationService` for sqlite schema versioning and upgrade safety.
3. `WorkflowService` on top of JobService for multi-step media pipelines.
4. `Log/Metrics` minimum observability envelope for job/command executions.

### P1 (Productization)

1. `WorkspaceService` + `CacheService` with deterministic local artifact policy.
2. `DeviceService` baseline (recording devices + permission probing).
3. `SyncService` offline queue and replay mechanism.
4. typed command/event schema generation for frontend SDK consistency.

### P2 (Platform scale)

1. extension/plugin host and capability registry.
2. GPU/acceleration strategy abstraction.
3. enterprise compliance pack (audit, encryption, retention policy).

## Capability Packaging Strategy

Recommended crate/module layout under `src-tauri/src/framework/services`:

- `core` (runtime, lifecycle, policy)
- `system` (system, process, integration)
- `data` (fs, workspace, db, cache, migration)
- `media` (media, toolkit, device, capture)
- `workflow` (job, workflow, quota)
- `infra` (network, sync, observability, update)
- `ext` (extension host, capability registry)

Each service should expose:

1. Trait contract
2. default implementation
3. command mapping adapter
4. event names and payload types
5. error code dictionary

## Existing vs Target (Quick Gap Summary)

Already strong:

- service-oriented architecture
- command thin adapters
- sqlite/ffmpeg/compression abstractions
- job progress and cancellation

Needs next focus:

- security policy layer
- schema migration governance
- workflow-level orchestration
- observability baseline
- sync/offline strategy

## Acceptance Criteria for "Industry-Grade" Framework

A capability module is considered framework-grade only when it has:

1. Stable trait contract
2. command/event adapter
3. deterministic error codes
4. cancellation/timeout semantics (if long-running)
5. observability hooks
6. test strategy (unit + integration surface)
