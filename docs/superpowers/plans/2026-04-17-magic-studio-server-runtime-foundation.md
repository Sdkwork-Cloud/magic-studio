# Magic Studio Server Runtime Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the first real `birdcoder`-style server foundation in `magic-studio-v2` by adding independent `types`, `host-core`, `server`, and `distribution` packages, a Rust local server skeleton, canonical server API contracts, and deployment scaffolding without breaking the current app shell.

**Architecture:** Implement the new server runtime as an additive, package-first lane. The first cut does not migrate every feature; it creates the canonical server authority and connects root scripts, release skeletons, and minimal runtime contracts so later iterations can migrate local capability services from `src-tauri` into the new server host.

**Tech Stack:** pnpm workspace, TypeScript, Node.js scripts, Rust, Axum, current Magic Studio React/Tauri workspace, Docker and Kubernetes deployment skeletons

---

## Scope

- In scope: `packages/sdkwork-magic-studio-host-types`, `packages/sdkwork-magic-studio-host-core`, `packages/sdkwork-magic-studio-server`, `packages/sdkwork-magic-studio-distribution`, root script wiring, Rust server meta routes, deploy skeletons, server artifact directory skeleton.
- Out of scope: full migration of business modules onto server transport.
- Out of scope: replacing current `src-tauri` host in this iteration.
- Constraint: work must remain additive and avoid rewriting or reverting unrelated dirty workspace changes.

## File Structure

### Root files

- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/package.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/README.md`

### New package: `@sdkwork/magic-studio-host-types`

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/index.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/server-api.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/plugin-manifest.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/host.ts`

### New package: `@sdkwork/magic-studio-host-core`

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-core/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-core/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-core/src/index.ts`

### New package: `@sdkwork/magic-studio-distribution`

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-distribution/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-distribution/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-distribution/src/index.ts`

### New package: `@sdkwork/magic-studio-server`

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/index.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/lib.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/main.rs`

### Build and deployment skeleton

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/scripts/run-magic-studio-server-build.mjs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/docker/Dockerfile`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/docker/docker-compose.yml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/docker/README.md`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/Chart.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/values.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/templates/deployment.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/templates/service.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/server/windows/x64/.gitkeep`

### Optional first-pass runtime integration

- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts`

## Task 1: Create the package-first server contract foundation

**Files:**

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/index.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/server-api.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/plugin-manifest.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/host.ts`

- [ ] **Step 1: Write the failing package boundary test**

```typescript
import { MAGIC_STUDIO_SERVER_API_VERSION, MAGIC_STUDIO_API_SURFACES } from '@sdkwork/magic-studio-host-types';

if (MAGIC_STUDIO_SERVER_API_VERSION !== 'v1') {
  throw new Error('Expected v1 server api version');
}

if (!MAGIC_STUDIO_API_SURFACES.includes('core')) {
  throw new Error('Expected core surface');
}
```

- [ ] **Step 2: Run the boundary test to confirm the package does not exist yet**

Run:

```powershell
node --input-type=module -e "import('@sdkwork/magic-studio-host-types').catch(() => { process.exit(1); })"
```

Expected: FAIL because the package is not created yet.

- [ ] **Step 3: Implement the types package minimally**

Create the package manifest, `tsconfig`, and `src` exports with:

- API surfaces: `core`, `app`, `admin`
- canonical prefixes
- route catalog types
- API envelope and problem detail types
- plugin manifest and permission scope types
- host mode and runtime descriptor types

- [ ] **Step 4: Re-run typecheck for the package**

Run:

```powershell
pnpm --dir packages/sdkwork-magic-studio-host-types exec tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdkwork-magic-studio-host-types
git commit -m "feat: add magic studio server contract types"
```

## Task 2: Add host-core and distribution metadata packages

**Files:**

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-core/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-core/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-core/src/index.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-distribution/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-distribution/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-distribution/src/index.ts`

- [ ] **Step 1: Write the failing metadata import test**

```typescript
import { MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT } from '@sdkwork/magic-studio-host-core';
import { MAGIC_STUDIO_RELEASE_FAMILIES } from '@sdkwork/magic-studio-distribution';

if (MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT !== 4318) {
  throw new Error('Unexpected local api port');
}

if (!MAGIC_STUDIO_RELEASE_FAMILIES.includes('server')) {
  throw new Error('Expected server release family');
}
```

- [ ] **Step 2: Run the import test and confirm failure**

Run:

```powershell
node --input-type=module -e "Promise.all([import('@sdkwork/magic-studio-host-core'), import('@sdkwork/magic-studio-distribution')]).catch(() => { process.exit(1); })"
```

Expected: FAIL because these packages do not exist yet.

- [ ] **Step 3: Implement host-core and distribution metadata**

Add:

- default local server host and port
- canonical host descriptor builder
- release family constants for `web`, `desktop`, `server`, `container`, `kubernetes`
- simple artifact metadata types

- [ ] **Step 4: Run package typechecks**

Run:

```powershell
pnpm --dir packages/sdkwork-magic-studio-host-core exec tsc --noEmit
pnpm --dir packages/sdkwork-magic-studio-distribution exec tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdkwork-magic-studio-host-core packages/sdkwork-magic-studio-distribution
git commit -m "feat: add magic studio host core and distribution metadata"
```

## Task 3: Implement the Rust local server skeleton

**Files:**

- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/package.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/tsconfig.json`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/index.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/lib.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/main.rs`

- [ ] **Step 1: Write a failing Rust route contract test**

```rust
#[tokio::test]
async fn route_catalog_includes_core_surface() {
    let app = build_app();
    let response = request_json(&app, "/api/core/v1/routes").await;
    assert!(response.contains("\"surface\":\"core\""));
}
```

- [ ] **Step 2: Run the Rust tests to verify failure**

Run:

```powershell
cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: FAIL because the crate does not exist yet.

- [ ] **Step 3: Implement the minimal server host**

Add:

- Axum app bootstrap
- `GET /healthz`
- `GET /openapi.json`
- `GET /openapi/magic-studio-server-v1.json`
- `GET /api/core/v1/routes`
- `GET /api/core/v1/runtime/summary`

- [ ] **Step 4: Re-run Rust tests**

Run:

```powershell
cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: PASS

- [ ] **Step 5: Verify TypeScript package wrapper**

Run:

```powershell
pnpm --dir packages/sdkwork-magic-studio-server exec tsc --noEmit
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/sdkwork-magic-studio-server
git commit -m "feat: add magic studio rust local server skeleton"
```

## Task 4: Wire root scripts and deployment skeletons

**Files:**

- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/package.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/README.md`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/scripts/run-magic-studio-server-build.mjs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/docker/Dockerfile`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/docker/docker-compose.yml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/docker/README.md`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/Chart.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/values.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/templates/deployment.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/deploy/kubernetes/templates/service.yaml`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/server/windows/x64/.gitkeep`

- [ ] **Step 1: Write a failing root script contract test**

```javascript
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!pkg.scripts['server:dev']) throw new Error('Missing server:dev');
if (!pkg.scripts['server:build']) throw new Error('Missing server:build');
```

- [ ] **Step 2: Run the contract test to verify failure**

Run:

```powershell
node --input-type=module -e "import fs from 'node:fs'; const pkg = JSON.parse(fs.readFileSync('package.json','utf8')); if (!pkg.scripts['server:dev'] || !pkg.scripts['server:build']) process.exit(1);"
```

Expected: FAIL because root server scripts do not exist yet.

- [ ] **Step 3: Implement build and deployment skeleton**

Add:

- root scripts `server:dev`, `server:build`, `check:server`
- build helper script
- Docker and Kubernetes skeleton manifests
- server artifact directory placeholders
- README section for server mode

- [ ] **Step 4: Verify root script and server build command wiring**

Run:

```powershell
node --input-type=module -e "import fs from 'node:fs'; const pkg = JSON.parse(fs.readFileSync('package.json','utf8')); if (!pkg.scripts['server:dev'] || !pkg.scripts['server:build'] || !pkg.scripts['check:server']) process.exit(1);"
pnpm server:build
```

Expected:

- root script contract passes
- `pnpm server:build` exits successfully

- [ ] **Step 5: Commit**

```bash
git add package.json README.md scripts/run-magic-studio-server-build.mjs deploy server
git commit -m "feat: add magic studio server delivery skeleton"
```

## Task 5: Add minimal runtime awareness for server mode

**Files:**

- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts`

- [ ] **Step 1: Write a failing runtime type assertion**

```typescript
type Kind = PlatformRuntime['system']['kind'] extends () => infer T ? T : never;
const expectedKinds: Kind[] = ['web', 'desktop', 'server'];
void expectedKinds;
```

- [ ] **Step 2: Run package typecheck and confirm failure**

Run:

```powershell
pnpm --dir packages/sdkwork-magic-studio-core exec tsc --noEmit
```

Expected: FAIL because `server` is not part of the runtime kind union yet.

- [ ] **Step 3: Add the minimal runtime type extension**

Only extend the runtime kind contract enough for later transport work. Do not rewire the full runtime implementation in this task.

- [ ] **Step 4: Re-run the typecheck**

Run:

```powershell
pnpm --dir packages/sdkwork-magic-studio-core exec tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts
git commit -m "feat: add server runtime kind contract"
```

## Final Verification

- [ ] **Step 1: Run package-level verification**

```powershell
pnpm --dir packages/sdkwork-magic-studio-host-types exec tsc --noEmit
pnpm --dir packages/sdkwork-magic-studio-host-core exec tsc --noEmit
pnpm --dir packages/sdkwork-magic-studio-distribution exec tsc --noEmit
pnpm --dir packages/sdkwork-magic-studio-server exec tsc --noEmit
cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: PASS

- [ ] **Step 2: Run root-level verification**

```powershell
pnpm server:build
pnpm check:server
```

Expected: PASS

- [ ] **Step 3: Run workspace-level verification**

```powershell
pnpm typecheck
```

Expected: PASS or a clearly identified unrelated pre-existing failure set. No new failures caused by the server foundation work.

- [ ] **Step 4: Commit the verified foundation**

```bash
git add .
git commit -m "feat: add magic studio server runtime foundation"
```
