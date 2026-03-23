# Drive Notification SDK Standardization Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete SDK-based service integration verification for `sdkwork-react-drive` and `sdkwork-react-notifications`, then remove remaining service-encapsulation blockers across `magic-studio-v2`.

**Architecture:** Keep business packages calling backend capabilities only through local `src/services` adapters backed by `@sdkwork/app-sdk` or approved runtime service seams. Avoid direct browser storage or runtime bridge access in feature code and tests. Use project audit scripts as the enforcement gate after targeted package verification.

**Tech Stack:** React, TypeScript, pnpm workspace, Vitest, `@sdkwork/app-sdk`, custom service adapter controller pattern.

---

## Decisions

1. `sdkwork-react-notifications` remains on `getSdkworkClient().notification.*` because the generated SDK already covers list, unread count, mark-read, delete, and test-send flows.
2. `sdkwork-react-drive` remains on `SdkDriveBusinessAdapter`, but was re-verified against generated SDK methods to confirm current method coverage for list, create folder, rename, move, content read/write, favorite, delete, restore, and clear trash.
3. Project completion is gated by `pnpm run audit:services`; once target packages pass typecheck, the remaining repo blockers must also be eliminated.
4. `sdkwork-react-i18n` now owns a dedicated `src/services` seam for locale persistence instead of touching `localStorage` directly.
5. `sdkwork-react-commons` tests now inject `windowControlService` adapters instead of referencing runtime bridge globals directly.

## Verification Targets

1. `pnpm --filter @sdkwork/react-drive typecheck`
2. `pnpm --filter @sdkwork/react-notifications typecheck`
3. `pnpm --filter @sdkwork/react-i18n typecheck`
4. `pnpm test -- packages/sdkwork-react-i18n/src/services/localeStorageService.test.ts packages/sdkwork-react-commons/src/components/Desktop/WindowControls/WindowControls.test.tsx`
5. `pnpm run audit:services`
