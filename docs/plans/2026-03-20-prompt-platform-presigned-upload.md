# Prompt Platform and Presigned Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct the frontend's prompt SDK integration, add instance-safe prompt capability services for `PromptTextInput`, and unify all server uploads behind the shared client-side presigned upload flow.

**Architecture:** The work starts in `@sdkwork/react-core` by repairing the official SDK prompt facade and adding a scoped SDK client factory that does not mutate the global singleton. Prompt library/history flows are then normalized in a shared core service and surfaced through `PromptTextInput`, while all server-side file uploads are routed through the existing `uploadViaPresignedUrl` kernel so asset, drive, and storage-provider uploads share one presigned URL implementation.

**Tech Stack:** TypeScript, React, Vitest, Vite, `@sdkwork/app-sdk`, Tiptap, shared SDKWork package exports.

---

### Task 1: Fix the core prompt SDK facade

**Files:**
- Modify: `packages/sdkwork-react-core/src/sdk/index.ts`
- Modify: `packages/sdkwork-react-core/src/sdk/hooks.ts`
- Test: `packages/sdkwork-react-core/src/sdk/__tests__/promptSdkFacade.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';

const promptModule = { listPrompts: vi.fn() };
const generationModule = { enhanceGenerationPrompt: vi.fn() };

vi.mock('../useAppSdkClient', () => ({
  getAppSdkClientWithSession: () => ({
    prompt: promptModule,
    generation: generationModule,
  }),
  getAppSdkClientConfig: () => ({ baseUrl: 'https://api.example.com' }),
}));

it('routes sdk.prompt to the official prompt module', async () => {
  const { sdk } = await import('../index');
  expect(sdk.prompt).toBe(promptModule);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/promptSdkFacade.test.ts
```

Expected: FAIL because `sdk.prompt` currently resolves to `generation`.

**Step 3: Write minimal implementation**

- Update `sdk.prompt` in `packages/sdkwork-react-core/src/sdk/index.ts` to return `getSdkworkClient().prompt`.
- Update `usePrompt()` in `packages/sdkwork-react-core/src/sdk/hooks.ts` to return `c.prompt`.
- Keep `generation`-based prompt enhancement logic untouched.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/promptSdkFacade.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-core/src/sdk/index.ts packages/sdkwork-react-core/src/sdk/hooks.ts packages/sdkwork-react-core/src/sdk/__tests__/promptSdkFacade.test.ts
git commit -m "fix: map prompt sdk facade to official prompt api"
```

### Task 2: Add an instance-scoped SDK client factory

**Files:**
- Modify: `packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts`
- Modify: `packages/sdkwork-react-core/src/sdk/index.ts`
- Test: `packages/sdkwork-react-core/src/sdk/__tests__/scopedAppSdkClient.test.ts`

**Step 1: Write the failing test**

```ts
it('creates a scoped client without mutating the global singleton config', async () => {
  const sdk = await import('../useAppSdkClient');
  sdk.initAppSdkClient({ baseUrl: 'https://default.example.com' });

  const scoped = sdk.createScopedAppSdkClient({
    baseUrl: 'https://tenant-b.example.com',
    tenantId: 'tenant-b',
  });

  expect(scoped).toBeTruthy();
  expect(sdk.getAppSdkClientConfig()?.baseUrl).toBe('https://default.example.com');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/scopedAppSdkClient.test.ts
```

Expected: FAIL because no scoped client factory exists yet.

**Step 3: Write minimal implementation**

- Add a new non-mutating helper such as `createScopedAppSdkClient(overrides)` in `useAppSdkClient.ts`.
- Reuse `createAppSdkClientConfig()` and `createClient()` to build a temporary compat client.
- Apply session tokens to the scoped client without touching the module-level `appSdkClient` / `appSdkConfig`.
- Re-export the new helper from `packages/sdkwork-react-core/src/sdk/index.ts`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/scopedAppSdkClient.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts packages/sdkwork-react-core/src/sdk/index.ts packages/sdkwork-react-core/src/sdk/__tests__/scopedAppSdkClient.test.ts
git commit -m "feat: add scoped sdk client factory"
```

### Task 3: Normalize official prompt library and history capabilities

**Files:**
- Create: `packages/sdkwork-react-core/src/sdk/promptLibraryService.ts`
- Modify: `packages/sdkwork-react-core/src/sdk/index.ts`
- Test: `packages/sdkwork-react-core/src/sdk/__tests__/promptLibraryService.test.ts`

**Step 1: Write the failing test**

```ts
it('normalizes prompt library and prompt history records from the official sdk', async () => {
  const service = await import('../promptLibraryService');
  const result = service.normalizePromptHistoryRecord({
    id: 7,
    promptTitle: 'Storyboard',
    promptContent: 'base prompt',
    usedContent: 'expanded prompt',
    model: 'gpt-image',
  });

  expect(result.id).toBe('7');
  expect(result.title).toBe('Storyboard');
  expect(result.content).toBe('expanded prompt');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/promptLibraryService.test.ts
```

Expected: FAIL because the service does not exist yet.

**Step 3: Write minimal implementation**

- Add normalized frontend types for:
  - prompt library entry
  - prompt history entry
  - prompt query options
  - scoped instance options
- Implement service methods:
  - `listPrompts`
  - `listPopularPrompts`
  - `listMostFavoritedPrompts`
  - `listPromptHistory`
  - `usePrompt`
  - `favoritePrompt`
  - `unfavoritePrompt`
  - `createPrompt`
  - `updatePrompt`
  - `deletePrompt`
- Resolve the client through either the global singleton or the scoped client factory.
- Export the service and types from `packages/sdkwork-react-core/src/sdk/index.ts`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/promptLibraryService.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-core/src/sdk/promptLibraryService.ts packages/sdkwork-react-core/src/sdk/index.ts packages/sdkwork-react-core/src/sdk/__tests__/promptLibraryService.test.ts
git commit -m "feat: add official prompt library service"
```

### Task 4: Make the shared presigned upload kernel fully official-SDK compatible

**Files:**
- Modify: `packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts`
- Test: `packages/sdkwork-react-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts`

**Step 1: Write the failing test**

```ts
it('prefers upload.registerPresigned when registering presigned uploads', async () => {
  const registerPresigned = vi.fn(async () => ({ code: '2000', data: { fileId: 'f-1' } }));
  const getPresignedUrl = vi.fn(async () => ({ code: '2000', data: { url: 'https://upload.example.com/put' } }));
  global.fetch = vi.fn(async () => ({ ok: true, status: 200 })) as any;

  await uploadViaPresignedUrl({
    upload: { getPresignedUrl, registerPresigned },
  } as any, {
    file: new Uint8Array([1, 2, 3]),
    fileName: 'demo.png',
    type: 'IMAGE',
  });

  expect(registerPresigned).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts
```

Expected: FAIL because the helper only checks `registerPresignedUpload` today.

**Step 3: Write minimal implementation**

- Add support for the official SDK registration method name `registerPresigned`.
- Keep compatibility with `registerPresignedUpload` and HTTP fallback for older clients.
- Preserve content type and folder registration behavior.
- Keep the helper as the single presigned upload kernel.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts packages/sdkwork-react-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts
git commit -m "fix: align presigned upload helper with official sdk"
```

### Task 5: Route `ServerProvider` through the shared upload kernel

**Files:**
- Modify: `packages/sdkwork-react-core/src/services/storage/providers/ServerProvider.ts`
- Modify: `packages/sdkwork-react-core/src/services/storage/providers/__tests__/ServerProvider.test.ts`

**Step 1: Write the failing test**

```ts
it('delegates server-mode uploads to the shared presigned upload helper', async () => {
  const provider = new ServerProvider({
    provider: 'server',
    apiEndpoint: 'https://api.example.com',
    mode: 'server',
  } as any);

  const result = await provider.upload('images/demo.png', new Uint8Array([1, 2, 3]));
  expect(result.key).toContain('images/demo.png');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/services/storage/providers/__tests__/ServerProvider.test.ts
```

Expected: FAIL or require substantial mocking updates because `ServerProvider` still owns a parallel upload-intent implementation.

**Step 3: Write minimal implementation**

- Refactor `ServerProvider.upload()` so it delegates to `uploadViaPresignedUrl`.
- Use provider config to derive:
  - path prefix
  - upload path
  - provider identifier
  - optional bucket
- Keep download / list / delete / sign behavior unchanged for now.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- packages/sdkwork-react-core/src/services/storage/providers/__tests__/ServerProvider.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-core/src/services/storage/providers/ServerProvider.ts packages/sdkwork-react-core/src/services/storage/providers/__tests__/ServerProvider.test.ts
git commit -m "refactor: reuse shared presigned upload kernel in server provider"
```

### Task 6: Add configurable prompt library and history to `PromptTextInput`

**Files:**
- Modify: `packages/sdkwork-react-assets/src/components/generate/PromptTextInput.tsx`
- Create: `packages/sdkwork-react-assets/src/components/generate/PromptPickerDialog.tsx`
- Create: `packages/sdkwork-react-assets/src/components/generate/PromptHistoryDialog.tsx`
- Modify: `packages/sdkwork-react-assets/src/index.ts`
- Modify: `packages/sdkwork-react-assets/src/components/index.ts`
- Test: `packages/sdkwork-react-assets/tests/promptTextInputPromptPicker.test.tsx`

**Step 1: Write the failing test**

```tsx
it('replaces the current prompt when a library prompt is selected', async () => {
  render(
    <PromptTextInput
      value="old prompt"
      onChange={onChange}
      enablePromptLibrary
      promptApplyMode="replace"
    />
  );

  await user.click(screen.getByRole('button', { name: /prompt library/i }));
  await user.click(await screen.findByRole('button', { name: /use storyboard prompt/i }));

  expect(onChange).toHaveBeenLastCalledWith('storyboard prompt content');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- packages/sdkwork-react-assets/tests/promptTextInputPromptPicker.test.tsx
```

Expected: FAIL because the picker UI and prompt capability props do not exist yet.

**Step 3: Write minimal implementation**

- Add configurable props to `PromptTextInput` for prompt library / history support.
- Add dialog-based picker UI using shared dialog primitives.
- Load library and history through the new core prompt service.
- Default selection behavior to `replace`.
- When choosing a saved prompt, call prompt usage reporting if the record has an id.
- Keep the editor enhancement and local history behavior working.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test -- packages/sdkwork-react-assets/tests/promptTextInputPromptPicker.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-assets/src/components/generate/PromptTextInput.tsx packages/sdkwork-react-assets/src/components/generate/PromptPickerDialog.tsx packages/sdkwork-react-assets/src/components/generate/PromptHistoryDialog.tsx packages/sdkwork-react-assets/src/index.ts packages/sdkwork-react-assets/src/components/index.ts packages/sdkwork-react-assets/tests/promptTextInputPromptPicker.test.tsx
git commit -m "feat: add prompt library and history to prompt text input"
```

### Task 7: Verify existing upload callers still use the shared kernel

**Files:**
- Verify: `packages/sdkwork-react-assets/src/services/assetSdkQueryService.ts`
- Verify: `packages/sdkwork-react-drive/src/services/driveBusinessService.ts`
- Verify: any remaining server-upload callers discovered during grep audit

**Step 1: Write the audit expectation**

Document the invariant:

- no feature uploads files to the backend through direct multipart endpoints when a presigned flow is available
- asset uploads, drive uploads, and server-mode storage uploads all share the same helper

**Step 2: Run focused grep and tests**

Run:

```bash
git grep -n "uploadViaPresignedUrl\\|registerPresigned\\|getPresignedUrl" -- packages src
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/promptSdkFacade.test.ts packages/sdkwork-react-core/src/sdk/__tests__/scopedAppSdkClient.test.ts packages/sdkwork-react-core/src/sdk/__tests__/promptLibraryService.test.ts packages/sdkwork-react-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts packages/sdkwork-react-core/src/services/storage/providers/__tests__/ServerProvider.test.ts packages/sdkwork-react-assets/tests/promptTextInputPromptPicker.test.tsx
```

Expected:
- upload callers point at the shared helper
- targeted tests PASS

**Step 3: Make minimal follow-up fixes**

- If grep reveals any remaining direct server upload path for normal file ingestion, migrate it to the shared helper.
- Keep local-only filesystem writes untouched.

**Step 4: Re-run targeted verification**

Run the same commands again.

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-assets/src/services/assetSdkQueryService.ts packages/sdkwork-react-drive/src/services/driveBusinessService.ts packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts packages/sdkwork-react-core/src/services/storage/providers/ServerProvider.ts
git commit -m "refactor: standardize server uploads on presigned client flow"
```

### Task 8: Final verification

**Files:**
- Verify only

**Step 1: Run the targeted tests**

```bash
pnpm test -- packages/sdkwork-react-core/src/sdk/__tests__/promptSdkFacade.test.ts packages/sdkwork-react-core/src/sdk/__tests__/scopedAppSdkClient.test.ts packages/sdkwork-react-core/src/sdk/__tests__/promptLibraryService.test.ts packages/sdkwork-react-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts packages/sdkwork-react-core/src/services/storage/providers/__tests__/ServerProvider.test.ts packages/sdkwork-react-assets/tests/promptTextInputPromptPicker.test.tsx
```

Expected: PASS.

**Step 2: Run package typecheck/build verification**

```bash
pnpm typecheck
pnpm build:packages
```

Expected:
- no new type errors from prompt SDK integration
- package builds complete successfully or fail only on unrelated pre-existing issues

**Step 3: Run service audit**

```bash
pnpm audit:services
```

Expected: PASS for the touched packages.

**Step 4: Manual functional spot-check**

Verify:

- `PromptTextInput` can open prompt library and history
- selected prompt replaces current value by default
- prompt library can load against the default instance
- prompt library can load against a scoped instance configuration
- asset uploads still complete
- drive uploads still complete
- server storage provider uploads still complete

**Step 5: Commit**

```bash
git add docs/plans/2026-03-20-prompt-platform-presigned-upload-design.md docs/plans/2026-03-20-prompt-platform-presigned-upload.md packages/sdkwork-react-core/src/sdk/index.ts packages/sdkwork-react-core/src/sdk/hooks.ts packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts packages/sdkwork-react-core/src/sdk/promptLibraryService.ts packages/sdkwork-react-core/src/sdk/uploadViaPresignedUrl.ts packages/sdkwork-react-core/src/services/storage/providers/ServerProvider.ts packages/sdkwork-react-assets/src/components/generate/PromptTextInput.tsx
git commit -m "feat: unify prompt platform and presigned uploads"
```

---

Plan complete and saved to `docs/plans/2026-03-20-prompt-platform-presigned-upload.md`. Two execution options:

1. **Subagent-Driven (this session)** - I stay in this session and sequentially implement each task while checking before moving on.
2. **Parallel Session** - Open a new session using `superpowers:executing-plans` with the same plan file.

I will continue with **option 1** (Subagent-Driven) and implement the plan here.
