# Auth And Notes SDK Integration Design

**Date:** 2026-03-15

## Goal

Make `auth` and `notes` in `magic-studio-v2` run against the real backend SDK contract end to end. If the current backend or generated SDK is missing required methods, add the backend API, refresh OpenAPI, regenerate `@sdkwork/app-sdk`, then update the frontend until the flows are stable.

## Scope

- `packages/sdkwork-react-auth`
- `packages/sdkwork-react-notes`
- `packages/sdkwork-react-core`
- app routing and session bootstrap in `src/`
- backend auth and notes APIs if current OpenAPI/SDK coverage is incomplete
- SDK regeneration and frontend package integration after backend changes

## Current State Summary

- The app already routes `/login` to `@sdkwork/react-auth` and `/notes` to `@sdkwork/react-notes`.
- `auth` already persists session tokens and binds them into the SDK client, but it still needs contract validation against the real backend responses and runtime behavior.
- `notes` already calls many SDK note methods, but it also contains fallback probing logic for missing SDK/backend capabilities, which indicates the current API surface is not yet trusted as complete.
- The integration requirement is stricter than the current implementation: the final result must rely on formal backend APIs and generated SDK methods, not on permanent raw HTTP fallbacks.

## Recommended Approach

Use a backend-contract-first integration approach with staged delivery:

1. Stabilize `auth` first so login state, token refresh, and protected calls are reliable.
2. Audit `notes` against the real backend contract and remove any dependency on missing-or-guesswork endpoints by formally adding those endpoints where needed.
3. Regenerate the SDK after backend changes and refit the frontend services to the generated methods.

This is the recommended approach because `notes` depends on authenticated calls, and a stable session layer removes false negatives during notes debugging.

## Architecture

### Auth

- `packages/sdkwork-react-auth` remains the business-facing auth package.
- `packages/sdkwork-react-core` remains the source of truth for SDK client initialization and session token binding.
- The backend contract must fully support:
  - username/password login
  - phone login if exposed in UI
  - register
  - logout
  - refresh token
  - verify/send code
  - password reset
  - QR login if exposed in UI
  - current user profile lookup
- The frontend auth store should treat the session as valid only when token persistence and profile restoration both succeed.

### Notes

- `packages/sdkwork-react-notes` remains the business-facing notes package.
- `noteService` should call generated SDK methods only for the final version.
- Missing capabilities such as permanent delete, trash clearing, folder moving, content update, or batch operations must be formalized in backend APIs and reflected in OpenAPI.
- `noteStore` continues to manage optimistic UI and debounced persistence, but backend confirmation must remain authoritative.

## Data Flow

### Auth flow

1. User logs in from `@sdkwork/react-auth`.
2. Backend returns auth tokens and login payload.
3. Tokens are persisted through the SDK session helpers.
4. The app restores profile and exposes an authenticated store state.
5. Protected modules use `getAppSdkClientWithSession()`.
6. Token refresh updates persisted tokens and keeps the SDK client synchronized.

### Notes flow

1. Authenticated note requests go through `noteBusinessService` to `noteService`.
2. `noteService` calls generated SDK note methods.
3. `noteStore` loads workspace snapshot, note detail, folder tree, trash, and mutations.
4. Debounced editor writes resolve through formal note content update APIs.
5. Destructive and move operations verify the backend result by reloading authoritative state where needed.

## Error Handling

- Treat unauthenticated, unauthorized, not-found, validation, and unsupported-operation errors as separate categories.
- Surface user-readable messages from backend responses where possible.
- Clear local auth state when refresh or session restoration proves invalid.
- For notes, do not silently pretend success on mutation paths if the backend contract cannot confirm the state change.

## Testing Strategy

Use TDD for every behavior change.

### Auth tests

- login persists tokens and updates store state
- session restore succeeds with valid persisted tokens
- refresh token updates runtime session
- logout clears session
- invalid persisted session is cleared cleanly

### Notes tests

- list and detail load through generated SDK methods
- create note returns usable active note data
- title/content/favorite/folder updates persist correctly
- trash, restore, permanent delete, and clear trash behave correctly
- folder create, rename, move, and delete behave correctly
- unsupported backend gaps are replaced by formal API methods, not permanent raw fallback logic

## Verification

Minimum required verification before claiming completion:

- targeted tests for auth and notes packages
- `pnpm run audit:services`
- `pnpm run typecheck`
- `pnpm run build`
- any backend compile or SDK generation commands needed for contract updates

## Risks

- Generated SDK names may differ from current handwritten assumptions.
- Existing fallback code may mask real contract defects.
- Session restoration bugs can appear as notes failures if auth is not stabilized first.
- Backend API additions may require iterative OpenAPI regeneration before the frontend compiles cleanly.

## Decision

Proceed with a real-contract integration: stabilize `auth`, audit and formalize `notes` APIs, regenerate SDK when necessary, then refit frontend services and verify end to end.
