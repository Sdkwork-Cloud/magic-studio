# Service Interface Standard v3 (Proposal)

Date: 2026-03-03
Status: Proposed (waiting for policy confirmation)

## 1. Why v3 is needed

Current `audit:services` passes under v2 rules, but v2 only audits a subset of side effects (`fetch/storage/clipboard/invoke/runtime bridge`).
A recursive scan found additional interaction classes still happening outside `src/services/**`, so v2 is not strict enough for "all interactions via service".

## 2. New interaction classes to govern

The following should be treated as service-boundary interactions in v3:

1. Media playback/recording
- `new Audio(...)`
- `HTMLMediaElement.play/pause`
- `navigator.mediaDevices.getUserMedia`
- `MediaRecorder`

2. Blob URL lifecycle
- `URL.createObjectURL`
- `URL.revokeObjectURL`

3. Navigation/browser side effects
- `window.open`
- `window.location.href = ...`
- `window.location.reload()`

4. Session-global mutable bridge objects
- `window.__*` temporary runtime state

## 3. Recursive scan snapshot (2026-03-03)

Examples of uncovered interaction usage outside service layer were found in modules including:
- `sdkwork-react-canvas`
- `sdkwork-react-film`
- `sdkwork-react-audio`
- `sdkwork-react-voicespeaker`
- `sdkwork-react-editor`
- `sdkwork-react-prompt`
- `sdkwork-react-portal-video`
- `sdkwork-react-drive`
- `sdkwork-react-settings`
- `sdkwork-react-skills`
- `sdkwork-react-magiccut`
- `sdkwork-react-image`
- `sdkwork-react-commons`

These are policy blind spots under v2, not necessarily implementation bugs.

## 4. v3 policy proposal

1. Extend audit rule definitions
- Add new rule keys: `mediaPlayback`, `mediaRecord`, `blobUrl`, `navigationMutation`, `windowGlobalMutation`.

2. Layer rules
- Components/pages/store can only call service APIs for these interactions.
- Shared UI packages can keep local UI-only behavior only if marked as explicit boundary exception in policy.

3. Exception strategy
- Keep exceptions explicit and file-scoped (no package-wide wildcard where avoidable).
- Mandatory reason for each exception in policy file.

4. Enforcement
- Update `scripts/audit-service-encapsulation.mjs` to detect the new classes.
- Keep strict gate in CI with `pnpm.cmd run audit:services`.

## 5. Suggested rollout

1. Phase A: policy + scanner update only, report mode.
2. Phase B: migrate high-frequency interaction modules (`voicespeaker`, `audio`, `prompt`, `magiccut`).
3. Phase C: strict CI gate for all new interaction classes.

## 6. Decisions requiring confirmation

1. Should `window.location` reads in router/runtime be exempt globally, or only for specific files?
2. Should `URL.createObjectURL` in low-level shared components be mandatory-service, or allowed as component-local utility?
3. Should media capture UI widgets (for example recorder components) be treated as service boundary packages with explicit exemption?
4. Do we enforce full v3 immediately, or enable report-only mode for one iteration first?
