# Prompt Platform and Presigned Upload Design

**Date:** 2026-03-20

**Goal:** Normalize Magic Studio prompt capabilities around the official SDK `PromptApi`, make prompt data loading safe for instance-scoped SDK access, and unify all server-side file uploads behind a single client-side presigned-upload flow.

## Context

- The official SDK already exposes a dedicated `PromptApi` with prompt library and prompt history operations in `@sdkwork/app-sdk/dist/api/prompt.d.ts`.
- The frontend core layer currently maps `sdk.prompt` and `usePrompt` to `generation` instead of the SDK's real `prompt` module.
- Existing server upload logic is partially unified:
  - `packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts` already performs presigned PUT uploads and metadata registration.
  - `packages/sdkwork-react-assets/src/services/assetSdkQueryService.ts` and `packages/sdkwork-react-drive/src/services/driveBusinessService.ts` already reuse that helper.
  - `packages/sdkwork-react-core/src/services/storage/providers/ServerProvider.ts` still carries a parallel "upload intent" implementation instead of reusing the shared upload helper.
- `PromptTextInput` in `packages/sdkwork-react-assets/src/components/generate/PromptTextInput.tsx` is the shared prompt input used across image, video, audio, music, film, and other generation experiences.

## Problems

### 1. Prompt SDK Access Is Incorrect

- `packages/sdkwork-react-core/src/sdk/index.ts` exports `sdk.prompt` as `generation`.
- `packages/sdkwork-react-core/src/sdk/hooks.ts` exports `usePrompt()` as `generation`.
- Any future prompt-library UI built on top of the core SDK facade would be wired to the wrong backend API.

### 2. Global SDK Client Mutation Breaks Instance Safety

- `getAppSdkClientWithSession(overrides)` in `packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts` mutates the shared singleton when overrides are provided.
- This makes it unsafe to load prompt libraries or histories from multiple SDK instances inside the same app session.

### 3. Prompt Library and History Are Not Encapsulated as Frontend Capabilities

- The app has a prompt-focused package (`@sdkwork/react-prompt`) but it only implements prompt optimization logic today.
- The shared prompt input does not have a reusable, configurable capability layer for:
  - prompt library list loading
  - prompt history loading
  - prompt usage reporting
  - favorite / unfavorite
  - instance-scoped loading

### 4. Presigned Upload Logic Is Duplicated

- `uploadViaPresignedUrl` and `ServerProvider` both implement "ask server for upload URL, then PUT from the client" but with different request/response handling.
- This duplication risks drift in headers, registration semantics, and error handling.

## Design Decisions

### A. Treat Prompt Capabilities as an Official SDK Domain

- Correct the core SDK facade so prompt functionality is always routed through the official SDK `prompt` module.
- Add typed prompt capability services in `@sdkwork/react-core` instead of binding `@sdkwork/react-assets` directly to raw SDK payloads.
- Keep prompt optimization in `generation`; keep prompt library / history in `prompt`.

### B. Introduce Scoped SDK Clients

- Add a non-mutating client factory in `@sdkwork/react-core` that can create a temporary SDK client for a specific runtime instance:
  - `baseUrl`
  - `tenantId`
  - `organizationId`
  - auth/access tokens
- Continue to preserve the existing global singleton for the default application instance.
- All prompt-library and prompt-history loading must support an explicit scoped-instance option.

### C. Build a Shared Prompt Capability Service

- Add a reusable service layer in `@sdkwork/react-core` that normalizes official prompt payloads into frontend-friendly records.
- Required capabilities:
  - list prompt library entries
  - list popular prompts
  - list most-favorited prompts
  - list prompt history
  - mark prompt as used
  - favorite / unfavorite prompt
  - create / update / delete prompt entries
- The service must support both:
  - default global client loading
  - instance-scoped loading through the new scoped client factory

### D. Keep `PromptTextInput` Configurable

- Extend `PromptTextInput` with opt-in capabilities instead of hard-coding prompt dialogs everywhere.
- Base configuration:
  - `enablePromptLibrary?: boolean`
  - `enablePromptHistory?: boolean`
  - `promptBizType?: 'DEFAULT' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MUSIC' | 'AGENT' | 'VOICE_CLONE_WORDS'`
  - `promptType?: 'DEFAULT' | 'SYSTEM' | 'ASSISTANT' | 'USER'`
  - `promptInstance?: ScopedSdkInstance | undefined`
  - `promptApplyMode?: 'replace' | 'append'`
- Default apply mode is `replace`, matching the product decision already confirmed in this thread.

### E. Unify All Server Uploads Behind One Core Upload Kernel

- `packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts` becomes the single upload kernel for all server uploads.
- Update it to prefer the official SDK method name `registerPresigned`, while remaining backward-compatible with `registerPresignedUpload` or HTTP fallback.
- Refactor `ServerProvider` so it reuses the same upload helper instead of maintaining a second presigned-flow implementation.
- Keep local-only VFS writes out of scope; only uploads that go to a server-managed object store must move to the presigned flow.

## Targeted File Changes

### Core SDK and Instance Isolation

- Modify `packages/sdkwork-react-core/src/sdk/index.ts`
- Modify `packages/sdkwork-react-core/src/sdk/hooks.ts`
- Modify `packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts`
- Create `packages/sdkwork-react-core/src/sdk/promptLibraryService.ts`
- Create tests under `packages/sdkwork-react-core/src/sdk/__tests__/`

### Shared Upload Kernel

- Modify `packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts`
- Modify `packages/sdkwork-react-core/src/services/storage/providers/ServerProvider.ts`
- Modify `packages/sdkwork-react-core/src/services/storage/types.ts` if needed to align terminology
- Create / extend tests under:
  - `packages/sdkwork-react-core/src/sdk/__tests__/`
  - `packages/sdkwork-react-core/src/services/storage/providers/__tests__/`

### Prompt Input UI

- Modify `packages/sdkwork-react-assets/src/components/generate/PromptTextInput.tsx`
- Create prompt picker UI helpers under `packages/sdkwork-react-assets/src/components/generate/`
- Re-export new prompt service hooks or types if required from package entrypoints
- Add focused tests for new prompt capability wiring if the package test setup supports it

## Data Flow

### Prompt Library

1. `PromptTextInput` opens the prompt library dialog.
2. The component calls the shared prompt capability service.
3. The service resolves either:
   - the default global SDK client, or
   - a scoped SDK client for the selected instance.
4. The service calls the official SDK `prompt` APIs and normalizes results.
5. The chosen prompt is applied to the editor with `replace` by default.
6. Optional side-effect: report prompt usage through `prompt.use(id)`.

### Prompt History

1. `PromptTextInput` opens the history dialog.
2. The component calls the prompt capability service for history entries.
3. History entries are normalized from SDK `PromptHistoryVO`.
4. The chosen history record applies `usedContent`, falling back to `promptContent`.

### Server Upload

1. Feature code passes raw bytes / blob / file name / metadata to the shared upload helper.
2. The helper requests a presigned PUT URL from the official SDK upload API.
3. The browser uploads the file body directly to object storage.
4. The helper registers the uploaded object metadata through the official SDK.
5. Callers receive the normalized file registration payload and continue business logic.

## Verification Strategy

- Add unit tests for the corrected `sdk.prompt` / `usePrompt` wiring.
- Add unit tests for scoped-client creation so overrides do not mutate the global singleton.
- Add unit tests for prompt capability normalization from SDK `PromptVO` / `PromptHistoryVO`.
- Add upload helper tests for:
  - official `registerPresigned`
  - legacy fallback registration
  - content-type propagation
  - error handling on PUT failure
- Update `ServerProvider` tests so server mode proves it delegates to the shared presigned upload kernel.
- Run targeted Vitest suites, then package typecheck/build verification.

## Rollout Notes

- Land the core SDK fix first.
- Land the shared upload-kernel cleanup second.
- Land the prompt service and `PromptTextInput` integration third.
- After the infrastructure is stable, migrate any remaining server upload callers that still bypass the shared helper.
