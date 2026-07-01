# @sdkwork/magic-studio-types

> Type definitions for Magic Studio applications

This package exports all shared types used across Magic Studio packages. It exists to break circular dependencies between `@sdkwork/magic-studio-commons` and `@sdkwork/magic-studio-core`.

## Installation

```bash
pnpm add @sdkwork/magic-studio-types
```

## Usage

```typescript
import type { Asset } from '@sdkwork/magic-studio-types/assets';
import type { User } from '@sdkwork/magic-studio-types/user';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
```

For internal Magic Studio packages, prefer focused `@sdkwork/magic-studio-types/<domain>` subpaths over the broad root facade.

## Exports

- All types from `@sdkwork/magic-studio-commons`

## License

MIT

## SDKWork Documentation Contract

Domain: platform
Capability: component
Package type: node-package
Status: standardizing

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm --filter @sdkwork/magic-studio-types typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
