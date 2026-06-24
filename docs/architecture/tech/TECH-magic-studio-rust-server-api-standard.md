> Migrated from `docs/standards/magic-studio-rust-server-api-standard.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio Rust Server API Standard

## Goal

Define the Rust server as the canonical local capability boundary for Magic Studio and prevent contract drift across TypeScript clients, Rust handlers, and generated OpenAPI output.

## Authority

This document specializes `docs/magic-studio-unified-host-api-standard.md` for route-contract, DTO, and OpenAPI governance.

For package/server/shell ownership summary, use `docs/standards/magic-studio-authority-matrix.md`.

If any statement in this document conflicts with the unified host standard, follow `docs/magic-studio-unified-host-api-standard.md`.

## Canonical Sources of Truth

1. Route definitions live in `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`.
2. Shared OpenAPI request and response schemas live in `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json`.
3. Host/runtime/server transport DTO shapes live in `packages/sdkwork-magic-studio-host-types/src`. Cross-domain business DTO shapes live in `packages/sdkwork-magic-studio-types/src`.
4. Server-owned route metadata projections such as published API version, canonical surface inventory, surface base-path constants, and route-path constants live in `packages/sdkwork-magic-studio-server/src/contract.ts`.
5. Stable canonical route ids live on every route entry in the contract JSON.
6. TypeScript and Rust must both consume the same contract artifacts. No side may hardcode response schemas, envelope version metadata, gateway base paths, or rebuild route metadata with ad hoc path switches.
7. Discovery metadata in `meta` must point at discovery routes by route id. It must not duplicate route path authority already owned by `routes[*].path`.
8. `@sdkwork/magic-studio-host-core` may help discover host, port, and api baseUrl, but canonical discovery endpoint paths and full host descriptors remain owned by `@sdkwork/magic-studio-server`.
9. Public host resolution input typing belongs to `@sdkwork/magic-studio-server`. `@sdkwork/magic-studio-host-core` discovery input shapes are implementation detail, not part of the server package facade.
10. Cross-package TypeScript imports between `@sdkwork/magic-studio-*` foundation packages must use published package facades or focused public subpaths such as `@sdkwork/magic-studio-types/entity`, `@sdkwork/magic-studio-types/service`, and `@sdkwork/magic-studio-host-core`, never sibling `../other-package/src/*` source paths.

## Ownership Rules

1. `@sdkwork/magic-studio-host-types` owns public host/runtime/server transport DTO shapes that cross package boundaries.
2. `@sdkwork/magic-studio-types` owns shared domain, entity, pagination, service-result, asset, and runtime-neutral DTO shapes that are reused across product packages.
3. `@sdkwork/magic-studio-types` must not own canonical route prefixes, published API version constants, or canonical surface/base-path authority.
4. `@sdkwork/magic-studio-server` owns canonical contract metadata projections derived from the route contract.
5. `@sdkwork/magic-studio-server` may keep local transport helpers, but it must not become the canonical owner of shared host/runtime/governance/media/compression/database/plugin/deployment transport DTOs or broader cross-domain business DTOs.
6. Rust services may use internal structs, but route-layer response shapes must stay aligned with the canonical public contract.
7. Each Rust surface module under `packages/sdkwork-magic-studio-server/src-host/src/routes` owns its route-path resolution and `Router<AppState>` mount function for that surface. `lib.rs` is limited to host composition and must not hardcode or manually register per-route ids outside surface composition.
8. Rust runtime contract coverage under `packages/sdkwork-magic-studio-server/src-host/src/tests` must mirror public surface ownership. Shared helpers may live in `tests/support.rs`, but route coverage must be split into focused per-surface modules instead of a monolithic `tests.rs`.

## Surface Rules

1. The Rust server is server-first. Browser, desktop, and future container runtimes consume one canonical HTTP contract.
2. Stable discovery and governance endpoints are part of the public API surface and must be documented with the same rigor as feature endpoints.
3. Every public endpoint that returns JSON must have a declared success schema unless the payload is intentionally opaque.
4. Every public endpoint that accepts a JSON body must have a declared request body schema.

## Runtime Convergence Rules

1. `packages/sdkwork-magic-studio-server/src-host` is the only canonical Rust capability kernel for toolkit, governance, migration, media, compression, database, plugin, and deployment APIs.
2. Standalone server deployment and Tauri desktop must both host that same kernel. Desktop must embed it during native startup instead of re-implementing a parallel business/service layer behind custom invoke commands.
3. Tauri bridge commands are allowed only for shell responsibilities that do not belong to the canonical HTTP contract:
   - window lifecycle
   - native dialogs/notifications
   - PTY/session bridging
   - browser/webview shell operations
4. Frontend bootstrap must not assume the local Rust server is instantly ready on desktop. It must gate server-dependent initialization on canonical health readiness.
5. Runtime discovery endpoints must describe the actual runtime mode. Embedded desktop must report `desktop`; standalone host must report `server`.
6. Deployment inventory endpoints must describe the actual deployment family of the running host. Embedded desktop must report `desktop`; standalone host must report `server`.
7. Both runtime modes must have focused Rust runtime coverage for discovery and deployment-family reporting so unified-host behavior is verified at the kernel boundary, not inferred from shell startup code.
8. Frontend browser delivery may start as `web` and promote itself to `server` after same-origin runtime discovery. Feature code must treat `web` and `server` as one browser-hosted family unless a distinction is explicitly required by the contract.
9. Frontend product logic must not use literal `=== 'web'` branches to stand in for browser-hosted behavior. Shared browser-hosted rules must be expressed through the platform runtime classification layer.
10. Frontend local-storage features must resolve browser-hosted and desktop-local filesystem roots through the canonical MagicStudio storage layout builders. `/mock/*`-style anonymous roots are not part of the architecture standard.
11. If a downstream API contract uses a narrower device-family vocabulary than runtime kinds, frontend code must map runtime kind into that vocabulary through one centralized adapter instead of passing raw runtime kinds through feature code.
12. Service and domain layers must import narrow helper subpaths when available. They must not depend on broad presentation-root package entries just to reach low-level plumbing utilities.
13. Foundational cross-package DTOs, pagination contracts, service-result envelopes, runtime-neutral enums, entity-identity helpers, and canonical workspace/project contracts belong to `@sdkwork/magic-studio-types`.
14. Host/runtime/server transport DTOs, discovery envelopes, governance DTOs, toolkit operation DTOs, filesystem/media/compression/sqlite request and response shapes, and server API envelopes belong to `@sdkwork/magic-studio-host-types`.
15. The canonical low-level `@sdkwork/magic-studio-commons` utility subpaths are `utils/helpers`, `utils/logger`, `utils/assetIdentity`, and `utils/serviceAdapter`. Focused algorithmic primitives that still belong to commons must come from explicit non-root subpaths such as `@sdkwork/magic-studio-commons/algorithms`. Foundational runtime, storage, service, store, and domain files must import those subpaths directly instead of the broad root entry when they only need those helpers or algorithms.
16. Foundational runtime, storage, service, store, and domain files must not import `Result`, `ServiceResult`, `Page`, `PageRequest`, `Sort`, entity identity helpers, media/resource enums, or shared asset DTOs from the broad `@sdkwork/magic-studio-commons` root.

## Desktop Shell Boundary Rules

1. `src-tauri` is a native host shell, not a second backend.
2. The allowed Tauri invoke surface is limited to shell concerns such as PTY/session management, browser/webview actions, and command existence checks.
3. Tauri must not expose business invoke commands for toolkit, media, compression, database, migration, jobs, or deployment/governance APIs.
4. Desktop-specific runtime metadata that matters to frontend business code must come from canonical HTTP discovery endpoints, not from a parallel Tauri runtime-info command.
5. Tauri-native policy should protect shell file access only. Canonical governance and policy APIs remain owned by the Rust server kernel.
6. Frontend feature packages must not import `@tauri-apps/*` directly for business flows. They must consume desktop shell capabilities through `@sdkwork/magic-studio-core/platform` and `PlatformRuntime`.
7. The desktop runtime bridge must expose a closed shell-only vocabulary for commands and events. New bridge names require explicit architectural review.
8. Public frontend/environment naming must use runtime-neutral desktop terminology. `Tauri` is a host implementation detail, not a product-layer platform contract.
9. `src-tauri/src/main.rs` must not inline the desktop invoke allowlist. Shell command registration belongs to one dedicated shell registry module so the allowed native command surface has a single code owner.
10. Shell event naming authority must be centralized as well. Rust PTY emitters and TypeScript bridge consumers must derive shell event names from dedicated shell vocabulary helpers instead of handwritten string templates.
11. Shell-private Rust implementation modules must live under one `src-tauri/src/shell/**` namespace. Do not keep sibling top-level `commands`, `pty`, or `session` modules once shell ownership has been centralized.

## Envelope Rules

1. Singular resource responses use `ApiEnvelope<T>` with `data`.
2. Collection responses use `ApiListEnvelope<T>` with `items`.
3. A route must not return an array inside `data` when it semantically represents a collection. Use the list envelope instead.
4. Error responses use the canonical problem envelope schema.

## OpenAPI Rules

1. Success schema binding comes from `successResponseSchema` on the canonical contract route entry.
2. Request body schema binding comes from `requestBodySchema` on the canonical contract route entry.
3. OpenAPI `operationId` is derived directly from the canonical route id. It must not be synthesized from path segments or implementation naming.
4. OpenAPI path generation must merge operations by path. Multiple HTTP methods on the same path must never overwrite each other.
5. The live Rust OpenAPI document and the TypeScript-generated OpenAPI document must expose equivalent path/method coverage and schema refs.

## Request Body Rules

1. Body-bearing routes must use a single request DTO object whose fields mirror the JSON payload exactly.
2. Low-level TypeScript server client methods for body-bearing routes must accept that request DTO object directly. No mixed positional body arguments.
3. Shared request DTOs must live in `@sdkwork/magic-studio-types`, not inside `client.ts`.
4. If a toolkit job operation is the asynchronous form of a canonical synchronous route, both surfaces must reuse the same field vocabulary and semantic operation name. For example, `POST /api/core/v1/media/video/concat` and async job submission must both use `videoConcat`.
5. Parameterized canonical paths such as job detail and cancel routes must be materialized through server contract helpers owned by `@sdkwork/magic-studio-server` or the Rust contract loader. Do not duplicate `:param` replacement logic in unrelated layers.
6. Storage workflows that need server participation must be authored here as canonical Rust server routes. Frontend packages must not define independent storage-proxy HTTP contracts outside `@sdkwork/magic-studio-server`.

## Current Required Typed Routes

At minimum, the following endpoints must stay fully typed through contract, OpenAPI, client, and runtime:

1. `GET /healthz`
2. `GET /api/core/v1/routes`
3. `GET /api/core/v1/runtime/summary`
4. `GET /api/core/v1/toolkit/capabilities`
5. `GET /api/core/v1/policy/snapshot`
6. `POST /api/core/v1/policy/validate-path`
7. `POST /api/core/v1/policy/validate-command`
8. `POST /api/core/v1/migrations/status`
9. `POST /api/core/v1/migrations/apply`
10. `POST /api/core/v1/jobs`
11. `GET /api/core/v1/jobs`
12. `GET /api/core/v1/jobs/:jobId`
13. `POST /api/core/v1/jobs/:jobId/cancel`
14. `GET /api/app/v1/plugins`
15. `GET /api/admin/v1/deployments`
16. `POST /api/core/v1/media/probe`
17. `POST /api/core/v1/media/image/resize`
18. `POST /api/core/v1/media/video/concat`
19. `POST /api/core/v1/media/video/transcode`
20. `POST /api/core/v1/media/video/trim`
21. `POST /api/core/v1/media/video/extract-audio`
22. `POST /api/core/v1/media/video/thumbnail`
23. `POST /api/core/v1/media/audio/convert`
24. `POST /api/core/v1/media/audio/normalize`
25. `POST /api/core/v1/media/audio/mix`
26. `POST /api/core/v1/compression/zip`
27. `POST /api/core/v1/compression/unzip`
28. `POST /api/core/v1/database/sqlite/execute`
29. `POST /api/core/v1/database/sqlite/query`
30. `POST /api/core/v1/database/sqlite/execute-batch`

## Review Findings Fixed In This Standard

1. OpenAPI generation previously overwrote duplicate path entries, so `/api/core/v1/jobs` could not expose both `GET` and `POST` correctly.
2. Discovery and governance DTOs were partially owned by `client.ts` instead of shared types.
3. `/api/core/v1/routes` previously violated the collection envelope rule by returning an array under `data`.
4. `healthz` previously used an anonymous JSON payload instead of a typed transport DTO.
5. Multiple core governance endpoints had no canonical `successResponseSchema`, which left the OpenAPI document under-specified.
6. Multiple body-bearing routes had no canonical `requestBodySchema`, which left the OpenAPI request contract and client surface under-specified.
7. Desktop and standalone Rust hosts previously existed as parallel runtime shapes instead of one shared kernel plus a thin native shell.
8. Tauri still carried residual native business commands, command-governance policy, and runtime-info/event artifacts that did not belong in the shell boundary.

## Extension Rules

When adding a new public server route:

1. Add the route to the canonical contract JSON.
2. Assign a stable semantic route id that will remain the canonical identity across TypeScript, Rust, route catalog output, and OpenAPI `operationId`.
3. Add or reuse shared DTOs in `@sdkwork/magic-studio-types`.
4. Add or reuse component schemas in the canonical OpenAPI components JSON.
5. Bind the route to a `successResponseSchema`.
6. Bind the route to a `requestBodySchema` when it accepts JSON.
7. Add TypeScript boundary coverage and Rust runtime coverage before considering the route complete.

