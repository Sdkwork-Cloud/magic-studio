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
