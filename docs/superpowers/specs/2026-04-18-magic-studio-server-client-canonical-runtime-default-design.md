# Magic Studio Server Client Canonical Runtime Default Design

## Scope

- include: `TypeScript server client default host selection`
- include: `public runtime semantics of createMagicStudioServerClient()`
- include: `server-first regression tests for default host identity`
- exclude: changing runtime-aware wrapper behavior in `magicStudioServerRuntime.ts`
- exclude: changing explicit host override behavior

## Problem

`createMagicStudioServerClient()` currently resolves its default host descriptor using:

- `runtimeMode: 'desktop'`

This is architecturally wrong for a canonical server client:

- the package name is `sdkwork-magic-studio-server`
- the canonical runtime contract is `MAGIC_STUDIO_SERVER_RUNTIME`
- the app strategy is explicitly Rust server-first

As a result, the public client can expose a default host descriptor whose `kind` is `desktop`,
even when the caller is using the dedicated server client package.

## Options

### Option 1: Keep discovery but change `'desktop'` to `'server'`

Pros:
- minimal code change

Cons:
- still routes the canonical server client through generic discovery
- leaves the default semantics coupled to a heuristic instead of the server contract

### Option 2: Recommended

- default `createMagicStudioServerClient()` to `MAGIC_STUDIO_SERVER_RUNTIME`
- keep explicit `host` overrides unchanged
- keep `baseUrl` override behavior unchanged

Pros:
- default semantics come directly from the canonical server contract
- removes unnecessary discovery indirection
- makes the package’s default identity unambiguous

Cons:
- slightly broader import adjustment in `client.ts`

### Option 3: Require explicit host from all callers

Pros:
- no implicit default

Cons:
- worse ergonomics
- unnecessary friction for the canonical local-server case

## Decision

Adopt Option 2.

## Design

### Default Host Source

Replace host discovery in `createMagicStudioServerClient()` with:

- `options.host ?? MAGIC_STUDIO_SERVER_RUNTIME`

This makes the server package default to the canonical server descriptor already defined by the
contract facade.

### Override Semantics

Keep current override behavior:

- explicit `host` still wins
- explicit `baseUrl` still overrides the selected host’s `apiBaseUrl`
- returned `client.host` reflects the effective `apiBaseUrl`

### Testing Strategy

- add a regression test that constructs the client with no overrides
- assert `client.host.kind === 'server'`
- assert the default `apiBaseUrl` remains the canonical local server URL
- assert the source no longer hardcodes `runtimeMode: 'desktop'` inside `client.ts`

## Success Criteria

- `createMagicStudioServerClient()` defaults to `server` runtime identity
- no default server client path depends on desktop discovery semantics
- existing explicit host and base URL override behavior remains intact
