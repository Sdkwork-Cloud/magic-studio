# Voice Speaker UI Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the raw dialog/form controls in the voicespeaker modals with the shared `@sdkwork/react-commons/ui` primitives and ensure the companion tests stay green.

**Architecture:** Each modal will continue to own its own business logic, but both will reuse the commons dialog skeleton (`Dialog`, `DialogTitle`, `DialogDescription`, `DialogClose`). We will configure the package aliasing in `tsconfig.json` and the commons `package.json` so the `ui` entrypoint resolves cleanly.

**Tech Stack:** TypeScript, Vite, Vitest, React, `@sdkwork/react-commons/ui`, Tailwind-inspired utility classes from the design system.

---

### Task 1: Resolve the `@sdkwork/react-commons/ui` alias

**Files:**
- Modify: `tsconfig.json:#paths`
- Modify: `packages/sdkwork-react-commons/package.json:#exports`

**Step 1: Write the failing test**

```tsx
// Already present in VoiceLabModal.test.tsx (and failing) while the alias is missing:
expect(screen.getByRole('dialog', { name: /voice lab/i })).toBeInTheDocument();
```

**Step 2: Run it to make sure it fails**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: Module resolution error because `@sdkwork/react-commons/ui` is not aliased yet.

**Step 3: Write the minimal implementation**

- Add a `paths` entry for `@sdkwork/react-commons/ui` that points to `packages/sdkwork-react-commons/src/components/ui/index.ts`.
- Extend `packages/sdkwork-react-commons/package.json` exports with a `./ui` target that points to the compiled `components/ui/index.js` and type definitions.

**Step 4: Run the test to verify the alias resolves**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: No module-not-found errors (but the tests may still fail for other reasons).

**Step 5: Commit**

```
git add tsconfig.json packages/sdkwork-react-commons/package.json
git commit -m "chore: expose commons ui alias"
```

### Task 2: Rebuild `VoiceLabModal` with shared UI primitives

**Files:**
- Modify: `packages/sdkwork-react-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`

**Step 1: Write the failing test**

```tsx
// VoiceLabModal.test.tsx already asserts this, so it will fail until DialogTitle is added.
expect(await screen.findByRole('dialog', { name: /voice lab/i })).toBeInTheDocument();
```

**Step 2: Run test to verify failure**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: Fails because the dialog has no accessible name and still wraps a manual `createPortal`.

**Step 3: Write the minimal implementation**

- Remove the `createPortal` import and the extra wrapper inside the return.
- Render `<DialogTitle>`/`<DialogDescription>` inside the header so Radix can label the dialog, and keep the subtitle text.
- Replace the inline `<button>` toggles (mode switch and avatar view) with the shared `Button` component, switching `variant` between `secondary` and `ghost`.
- Keep the existing top/bottom sections but rely entirely on `DialogContent` as the outermost container, applying `p-0` there.
- Ensure the `Field` helper wraps each `Label`/control pair and continues to use `@sdkwork/react-commons/ui` inputs.
- Delete the stray `document.body` text that remained from the portal call.

**Step 4: Run the test to verify it passes**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: Test passes now that the dialog exposes the expected name.

**Step 5: Commit**

```
git add packages/sdkwork-react-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx
git commit -m "fix: use commons dialog primitives in VoiceLabModal"
```

### Task 3: Harden `ChooseVoiceSpeakerModal` header and filters

**Files:**
- Modify: `packages/sdkwork-react-voicespeaker/src/components/voicespeaker/ChooseVoiceSpeakerModal.tsx`

**Step 1: Write the failing test**

```tsx
expect(screen.getByRole('dialog', { name: /select voice/i })).toBeInTheDocument();
```

**Step 2: Run the failing test**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: Still fails because the dialog title is plain `<h3>` and not wired to Radix.

**Step 3: Write the minimal implementation**

- Add `DialogTitle` (and optionally `DialogDescription`) around the header text so the dialog can expose its name.
- Keep the close action inside `DialogClose asChild>` (already present) and ensure the `Voice Lab` quick actions remain `Button`s.
- Refactor the filters/chips into shared buttons (`FilterChip` already uses `Button`), but double-check there are no stray `<button>` tags.
- Confirm that the modal still renders its footer buttons and the embedded `VoiceLabModal`.

**Step 4: Run the test to ensure it passes**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: Both modal tests pass with the new accessible header.

**Step 5: Commit**

```
git add packages/sdkwork-react-voicespeaker/src/components/voicespeaker/ChooseVoiceSpeakerModal.tsx
git commit -m "fix: align ChooseVoiceSpeakerModal with shared dialog primitives"
```

### Task 4: Final verification

**Files:**
- Test: `packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx`
- Test: `packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx`

**Step 1: Write the (already present) verification snippet**

```
expect(screen.getByRole('dialog', { name: /voice lab|select voice/i })).toBeInTheDocument();
```

**Step 2: Run the final targeted suite**

```
pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx
```
Expected: Both tests pass.

**Step 3: No code changes.**

**Step 4: No additional test run needed.**

**Step 5: No commit (changes already staged above).**

---

Plan complete and saved to `docs/plans/2026-03-19-voice-speaker-ui-plan.md`. Two execution options:

1. **Subagent-Driven (this session)** – I stay in this session and sequentially implement each task while checking before moving on.
2. **Parallel Session** – Open a new session using `superpowers:executing-plans` with the same plan file.

I will continue with **option 1** (Subagent-Driven) and execute the plan here.
