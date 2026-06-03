# Magic Studio Platform Bridge Neutralization Design

## Scope

- include: `magic-studio-core public runtime bridge type naming`
- include: `magic-studio-core public runtime/toolkit bridge error messages`
- include: `magic-studio-core bridge-access feature labels in public errors`
- exclude: changing internal bridge command identifiers in this document; that work is specified in
  `2026-04-18-magic-studio-internal-bridge-command-neutralization-design.md`
- exclude: changing the `runtime.bridge` property name

## Problem

The public magic-studio-core runtime surface still exports an implementation-loaded type name:

- `PlatformNativeBridgeCapability`

It also exposes user-facing errors that mention implementation history rather than the abstract
runtime capability:

- `[PlatformRuntime] Native invoke is not available on this platform`
- `[PlatformToolKit] <feature> requires desktop native bridge`

For a server-first, greenfield architecture, this is avoidable leakage:

- the public contract should describe a bridge capability
- the fact that some platforms implement that bridge through native adapters is internal

## Options

### Option 1: Keep native naming

Pros:
- no code churn

Cons:
- public vocabulary keeps legacy implementation framing
- error messages imply desktop-only availability even though bridge use is a broader runtime concern

### Option 2: Rename only the exported type

- `PlatformNativeBridgeCapability` -> `PlatformBridgeCapability`
- keep existing error messages

Pros:
- removes one public type leak

Cons:
- user-facing runtime errors stay inconsistent

### Option 3: Recommended

- rename the public type to `PlatformBridgeCapability`
- keep the `runtime.bridge` property name unchanged
- replace public error messages with neutral bridge wording

Pros:
- public runtime surface uses a stable, abstraction-oriented vocabulary
- no compatibility burden in this greenfield app
- internal bridge command names remain encapsulated from the public API and are standardized
  separately by `2026-04-18-magic-studio-internal-bridge-command-neutralization-design.md`

Cons:
- requires a few targeted source/runtime regression tests

## Decision

Adopt Option 3.

## Design

### Public Type

Replace:

- `PlatformNativeBridgeCapability`

with:

- `PlatformBridgeCapability`

The `PlatformRuntime` property remains:

- `readonly bridge: PlatformBridgeCapability`

This keeps API ergonomics unchanged while neutralizing the exported type identity.

### Public Error Messages

Replace runtime/toolkit wording with bridge capability wording:

- `[PlatformRuntime] Bridge invoke is not available on this platform`
- `[PlatformToolKit] <feature> requires platform bridge access`

This avoids incorrectly implying that bridge-backed operations are specifically “desktop native”
concerns at the public API boundary.

### Public Feature Labels

When bridge access is missing, feature labels in user-facing errors should also be neutral:

- `media probe`
- `video transcode`
- `sqlite execute`
- `zip local paths`

They should not surface tool names such as `FFprobe` or `FFmpeg`.

### Internal Boundary

The following remain internal implementation details at the public API boundary:

- bridge command ids like `media_command_execute`
- desktop-only transport adapters
- runtime API wiring behind `api.invoke`

## Testing Strategy

- add runtime contract assertions for `PlatformBridgeCapability`
- add runtime behavior assertion for the new invoke error wording
- add toolkit regression test for neutral bridge-access error wording
- assert bridge-access errors do not mention `FFprobe` or `FFmpeg`

## Success Criteria

- public magic-studio-core runtime exports `PlatformBridgeCapability`
- public runtime/toolkit error messages no longer mention `native`
- public toolkit bridge-access errors no longer mention `desktop native bridge`
- public toolkit bridge-access errors no longer mention `FFprobe` or `FFmpeg`
