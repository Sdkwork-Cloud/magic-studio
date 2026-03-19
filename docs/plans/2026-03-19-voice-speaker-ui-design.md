# Voice Speaker Shared UI Design

## Context
- `VoiceLabModal` still renders a manual portal plus raw `<button>`s and labels, so it does not yet reap the benefits of the new shared UI primitives.
- `ChooseVoiceSpeakerModal` is already wired to the commons dialog, but it still uses an unmanaged heading (no `DialogTitle`) and filter chips built with ad-hoc markup.
- The new `@sdkwork/react-commons/ui` package exports `Dialog`, `Button`, `Input`, `Select`, `Textarea`, etc., but the editors still need a path alias and package export to resolve it.

## Approaches
1. **Minimal leftovers**: Keep the current markup, simply remove the stray portal and hook up the commons dialog props. This fixes the compile errors quickly but leaves the UX brittle and inconsistently styled.
2. **Rebuild each modal with shared primitives** (recommended): Rework both modals to use `Dialog`, `DialogTitle`, `DialogDescription`, `Button`, and the rest of the commons form controls, which gives us accessible headings, consistent buttons, and centralized styles.
3. **Factor a shared shell**: Build a new `VoiceModalShell` that encapsulates the common header/footers and reuses it in both modals. This would be highly reusable but adds an extra layer of indirection and touches more files than the current scope.

## Recommended Approach
- Update the TypeScript path mapping and the commons package `exports` so `@sdkwork/react-commons/ui` is resolvable in both apps and tests.
- Rebuild `VoiceLabModal` to drop the manual portal, rely solely on the commons `Dialog` primitives, add a `DialogTitle`/`DialogDescription`, turn the avatar view toggles into shared `Button`s, and keep the existing `Field` helper for labeling inputs.
- Adjust `ChooseVoiceSpeakerModal` so its header uses `DialogTitle`, the quick action chips remain shared `Button`s, and the dialog footer preserves the commons styling. Keep the embedded `VoiceLabModal` as-is once its API is stable.
- Ensure each modal has an accessible dialog name that matches the existing tests (`voice lab`, `select voice`) and retains the same button labels so the tests stay focused on the key controls.

## Testing
- Run `pnpm test -- packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/VoiceLabModal.test.tsx packages/sdkwork-react-voicespeaker/src/components/voicespeaker/__tests__/ChooseVoiceSpeakerModal.test.tsx`.
- Visually check that the dialogs still render their custom headers/footers and that the top-level buttons respond to clicks the same way.

## Questions
- Are there any other voice speaker components that must adopt the commons UI primitives in this change, or are `VoiceLabModal` and `ChooseVoiceSpeakerModal` the full scope for now?
