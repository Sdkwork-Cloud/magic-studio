> Migrated from `docs/plans/2026-03-20-drive-notification-sdk-standardization-design.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Drive Notification SDK Standardization Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete SDK-based service integration verification for `sdkwork-magic-studio-drive` and `sdkwork-magic-studio-notifications`, then remove remaining service-encapsulation blockers across `magic-studio-v2`.

**Architecture:** Keep business packages calling backend capabilities only through local `src/services` adapters backed by `retired generic app SDK` or approved runtime service seams. Avoid direct browser storage or runtime bridge access in feature code and tests. Use project audit scripts as the enforcement gate after targeted package verification.

**Tech Stack:** React, TypeScript, pnpm workspace, Vitest, `retired generic app SDK`, custom service adapter controller pattern.

---

## Decisions

1. `sdkwork-magic-studio-notifications` remains on `getSdkworkClient().notification.*` because the generated SDK already covers list, unread count, mark-read, delete, and test-send flows.
2. `sdkwork-magic-studio-drive` remains on `SdkDriveBusinessAdapter`, but was re-verified against generated SDK methods to confirm current method coverage for list, create folder, rename, move, content read/write, favorite, delete, restore, and clear trash.
3. Project completion is gated by `pnpm run audit:services`; once target packages pass typecheck, the remaining repo blockers must also be eliminated.
4. `sdkwork-magic-studio-i18n` now owns a dedicated `src/services` seam for locale persistence instead of touching `localStorage` directly.
5. `sdkwork-magic-studio-commons` tests now inject `windowControlService` adapters instead of referencing runtime bridge globals directly.

## Verification Targets

1. `pnpm --filter @sdkwork/magic-studio-drive typecheck`
2. `pnpm --filter @sdkwork/magic-studio-notifications typecheck`
3. `pnpm --filter @sdkwork/magic-studio-i18n typecheck`
4. `pnpm test -- packages/sdkwork-magic-studio-i18n/src/services/localeStorageService.test.ts packages/sdkwork-magic-studio-commons/src/components/Desktop/WindowControls/WindowControls.test.tsx`
5. `pnpm run audit:services`

